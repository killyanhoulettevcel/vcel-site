import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ── Helpers n8n API ───────────────────────────────────────────────────────────
const n8nFetch = (path: string, options: RequestInit = {}) => {
  const url = process.env.N8N_URL
  const key = process.env.N8N_API_KEY
  if (!url) throw new Error('N8N_URL manquant dans les variables Vercel')
  if (!key) throw new Error('N8N_API_KEY manquant dans les variables Vercel')
  return fetch(`${url}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': key,
      ...options.headers,
    },
  })
}

// ── Créer Google Sheet via webhook n8n VCEL-0 ────────────────────────────────
async function createGoogleSheet(clientNom: string, clientEmail: string): Promise<string> {
  const webhookUrl = process.env.N8N_WEBHOOK_CREATE_SHEET
  if (!webhookUrl) throw new Error('N8N_WEBHOOK_CREATE_SHEET manquant dans les variables Vercel')
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom: clientNom, email: clientEmail }),
  })
  if (!res.ok) throw new Error(`Webhook VCEL-0 erreur: ${res.status}`)
  const data = await res.json()
  console.log('[VCEL-0] response:', JSON.stringify(data).substring(0, 200))
  const sheetId = data.sheetId || data.id
  if (!sheetId) throw new Error('sheetId manquant dans la réponse VCEL-0')
  return sheetId
}

// ── Créer workflow VCEL-2 dans n8n pour ce client ────────────────────────────
async function createWorkflowCA(userId: string, sheetId: string, clientNom: string): Promise<string> {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const wfStr = "{\"name\": \"VCEL-2 \\u2014 CA Sheets \\u2192 Supabase [killyan houlette]\", \"nodes\": [{\"parameters\": {\"rule\": {\"interval\": [{\"field\": \"cronExpression\", \"expression\": \"0 6 * * 1\"}]}}, \"id\": \"trigger-ca-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"D\\u00e9clencheur hebdo\", \"type\": \"n8n-nodes-base.scheduleTrigger\", \"typeVersion\": 1.1, \"position\": [112, 304]}, {\"parameters\": {\"documentId\": {\"__rl\": true, \"mode\": \"id\", \"value\": \"16pp3akDG1u_1X6GwvWHV_Vfyv__OUPaytbgAICgJ7Jk\"}, \"sheetName\": {\"__rl\": true, \"value\": 2075626985, \"mode\": \"list\", \"cachedResultName\": \"dashboard\", \"cachedResultUrl\": \"https://docs.google.com/spreadsheets/d/16pp3akDG1u_1X6GwvWHV_Vfyv__OUPaytbgAICgJ7Jk/edit#gid=2075626985\"}, \"options\": {}}, \"id\": \"sheets-ca-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"Lire CA depuis Sheets\", \"type\": \"n8n-nodes-base.googleSheets\", \"typeVersion\": 4.7, \"position\": [320, 304], \"credentials\": {\"googleSheetsOAuth2Api\": {\"id\": \"6fkxDhYtydoKz0Ww\", \"name\": \"sheets_vcel\"}}}, {\"parameters\": {\"jsCode\": \"const rows = $input.all().map(i => i.json);\\nconst userId = 'USER_ID_PLACEHOLDER';\\nconst results = [];\\nfor (const row of rows) {\\n  if (!row.mois || !row.ca_ht) continue;\\n  results.push({ json: { user_id: userId, mois: row.mois, ca_ht: parseFloat(row.ca_ht || 0), charges: parseFloat(row.charges_total || 0) } });\\n}\\nreturn results;\"}, \"id\": \"calcul-ca-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"Calculer CA mensuel\", \"type\": \"n8n-nodes-base.code\", \"typeVersion\": 2, \"position\": [544, 304]}, {\"parameters\": {\"method\": \"POST\", \"url\": \"https://rvgkzyafgqitmhuyvznh.supabase.co/rest/v1/ca_data\", \"sendHeaders\": true, \"headerParameters\": {\"parameters\": [{\"name\": \"apikey\", \"value\": \"sb_secret_j-knaqCmrLYGzwPgltwAsA_1lK9bsyP\"}, {\"name\": \"Authorization\", \"value\": \"Bearer sb_secret_j-knaqCmrLYGzwPgltwAsA_1lK9bsyP\"}, {\"name\": \"Content-Type\", \"value\": \"application/json\"}, {\"name\": \"Prefer\", \"value\": \"resolution=merge-duplicates\"}]}, \"sendBody\": true, \"bodyParameters\": {\"parameters\": [{\"name\": \"user_id\", \"value\": \"={{ $json.user_id }}\"}, {\"name\": \"mois\", \"value\": \"={{ $json.mois }}\"}, {\"name\": \"ca_ht\", \"value\": \"={{ $json.ca_ht }}\"}, {\"name\": \"charges\", \"value\": \"={{ $json.charges }}\"}]}, \"options\": {}}, \"id\": \"supabase-ca-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"Upsert Supabase CA\", \"type\": \"n8n-nodes-base.httpRequest\", \"typeVersion\": 4.4, \"position\": [768, 304]}], \"connections\": {\"D\\u00e9clencheur hebdo\": {\"main\": [[{\"node\": \"Lire CA depuis Sheets\", \"type\": \"main\", \"index\": 0}]]}, \"Lire CA depuis Sheets\": {\"main\": [[{\"node\": \"Calculer CA mensuel\", \"type\": \"main\", \"index\": 0}]]}, \"Calculer CA mensuel\": {\"main\": [[{\"node\": \"Upsert Supabase CA\", \"type\": \"main\", \"index\": 0}]]}}, \"settings\": {\"executionOrder\": \"v1\", \"callerPolicy\": \"workflowsFromSameOwner\", \"availableInMCP\": false}}"
    .replace(/USER_ID_PLACEHOLDER/g, userId)
    .replace(/9abee008-6386-42ea-ae82-ca9ac40ca062/g, userId)
    .replace(/16pp3akDG1u_1X6GwvWHV_Vfyv__OUPaytbgAICgJ7Jk/g, sheetId)
    .replace(/killyan houlette/g, clientNom)
    .replace(/sb_secret_j-knaqCmrLYGzwPgltwAsA_1lK9bsyP/g, supabaseKey)
  const workflow = JSON.parse(wfStr)
  workflow.name = "VCEL-2 — CA Sheets → Supabase [" + clientNom + "]"
  const res  = await n8nFetch('/workflows', { method: 'POST', body: JSON.stringify(workflow) })
  const data = await res.json()
  console.log('[N8N VCEL-2] response:', JSON.stringify(data).substring(0, 200))
  await n8nFetch('/workflows/' + data.id + '/activate', { method: 'POST', body: '{}' })
  return data.id
}

// ── Créer workflow VCEL-3 dans n8n pour ce client ────────────────────────────
async function createWorkflowResume(userId: string, clientNom: string, clientEmail: string): Promise<string> {
  const nextauthUrl     = process.env.NEXTAUTH_URL || "https://vcel-site-gpg3.vercel.app"
  const provisionSecret = process.env.PROVISIONING_SECRET!
  const wfStr = "{\"name\": \"VCEL-3 \\u2014 R\\u00e9sum\\u00e9 Hebdo IA [killyan houlette]\", \"nodes\": [{\"parameters\": {\"rule\": {\"interval\": [{\"field\": \"cronExpression\", \"expression\": \"0 8 * * 1\"}]}}, \"id\": \"trigger-resume-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"Chaque Lundi 8h\", \"type\": \"n8n-nodes-base.scheduleTrigger\", \"typeVersion\": 1.1, \"position\": [112, 304]}, {\"parameters\": {\"url\": \"NEXTAUTH_URL_PLACEHOLDER/api/provision/resume-data?userId=USER_ID_PLACEHOLDER\", \"sendHeaders\": true, \"headerParameters\": {\"parameters\": [{\"name\": \"x-provision-secret\", \"value\": \"SECRET_PLACEHOLDER\"}]}, \"options\": {}}, \"id\": \"fetch-data-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"R\\u00e9cup\\u00e9rer donn\\u00e9es client\", \"type\": \"n8n-nodes-base.httpRequest\", \"typeVersion\": 4.4, \"position\": [320, 304]}, {\"parameters\": {\"sendTo\": \"={{ $('R\\u00e9cup\\u00e9rer donn\\u00e9es client').item.json.client.email }}\", \"subject\": \"\\ud83d\\udcca Ton r\\u00e9sum\\u00e9 de la semaine \\u2014 VCEL\", \"message\": \"={{ $json.output[0].content[0].text }}\", \"options\": {\"appendAttribution\": false, \"emailType\": \"html\"}}, \"id\": \"gmail-resume-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"Envoyer r\\u00e9sum\\u00e9\", \"type\": \"n8n-nodes-base.gmail\", \"typeVersion\": 2.1, \"position\": [864, 304], \"webhookId\": \"e1da3a97-f712-4927-9be1-adc4bcb911e3\", \"credentials\": {\"gmailOAuth2\": {\"id\": \"BIICZBJj4lmNP8QF\", \"name\": \"gmail_vcel\"}}}, {\"parameters\": {\"modelId\": {\"__rl\": true, \"value\": \"gpt-4o-mini\", \"mode\": \"list\", \"cachedResultName\": \"GPT-4O-MINI\"}, \"responses\": {\"values\": [{\"role\": \"system\", \"content\": \"Tu es le coach business de CLIENT_NOM_PLACEHOLDER. Tu recois ses donnees business de la semaine.\\n\\nTu dois retourner UNIQUEMENT le code HTML final en remplissant ces variables dans le template fourni.\\n\\nRetourne UNIQUEMENT le HTML complet, sans markdown, sans explication.\"}, {\"content\": \"={{ JSON.stringify($json) }}\"}]}, \"builtInTools\": {}, \"options\": {\"maxTokens\": 4000}}, \"type\": \"@n8n/n8n-nodes-langchain.openAi\", \"typeVersion\": 2.1, \"position\": [528, 304], \"id\": \"45051bde-9e52-415d-a513-ec1083087b6f\", \"name\": \"Message a model\", \"credentials\": {\"openAiApi\": {\"id\": \"QyG8uqv3jbC6dfrQ\", \"name\": \"OpenAi account\"}}}], \"connections\": {\"Chaque Lundi 8h\": {\"main\": [[{\"node\": \"R\\u00e9cup\\u00e9rer donn\\u00e9es client\", \"type\": \"main\", \"index\": 0}]]}, \"R\\u00e9cup\\u00e9rer donn\\u00e9es client\": {\"main\": [[{\"node\": \"Message a model\", \"type\": \"main\", \"index\": 0}]]}, \"Message a model\": {\"main\": [[{\"node\": \"Envoyer r\\u00e9sum\\u00e9\", \"type\": \"main\", \"index\": 0}]]}}, \"settings\": {\"executionOrder\": \"v1\", \"callerPolicy\": \"workflowsFromSameOwner\", \"availableInMCP\": false}}"
    .replace(/USER_ID_PLACEHOLDER/g, userId)
    .replace(/CLIENT_NOM_PLACEHOLDER/g, clientNom)
    .replace(/9abee008-6386-42ea-ae82-ca9ac40ca062/g, userId)
    .replace(/killyan houlette/g, clientNom)
    .replace(/NEXTAUTH_URL_PLACEHOLDER/g, nextauthUrl)
    .replace(/SECRET_PLACEHOLDER/g, provisionSecret)
  const workflow = JSON.parse(wfStr)
  workflow.name = "VCEL-3 — Résumé Hebdo IA [" + clientNom + "]"
  const res  = await n8nFetch('/workflows', { method: 'POST', body: JSON.stringify(workflow) })
  const data = await res.json()
  console.log('[N8N VCEL-3] response:', JSON.stringify(data).substring(0, 200))
  await n8nFetch('/workflows/' + data.id + '/activate', { method: 'POST', body: '{}' })
  return data.id
}

export async function POST(req: NextRequest) {
  const SECRET  = process.env.PROVISIONING_SECRET
  console.log('[PROVISION] ENV CHECK - N8N_URL:', process.env.N8N_URL || 'MANQUANT', '| SECRET:', SECRET ? 'OK' : 'MANQUANT')

  const secret = req.headers.get('x-provision-secret')
  if (secret !== SECRET) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { userId, email, nom } = await req.json()
  if (!userId || !email) return NextResponse.json({ error: 'userId et email requis' }, { status: 400 })

  console.log(`[PROVISION] Démarrage pour ${email} (${userId})`)

  // ── Étape 1 : Google Sheet ──────────────────────────────────────────────────
  let sheetId = ''
  try {
    console.log('[PROVISION] Étape 1: Google Sheets...')
    sheetId = await createGoogleSheet(nom || email, email)
    console.log('[PROVISION] Sheet OK:', sheetId)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 1:', e.message)
    return NextResponse.json({ error: 'Étape 1 (Google Sheets): ' + e.message, step: 1 }, { status: 500 })
  }

  // ── Étape 2 : VCEL-2 ────────────────────────────────────────────────────────
  let wf2Id = ''
  try {
    console.log('[PROVISION] Étape 2: VCEL-2...')
    wf2Id = await createWorkflowCA(userId, sheetId, nom || email)
    console.log('[PROVISION] VCEL-2 OK:', wf2Id)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 2:', e.message)
    return NextResponse.json({ error: 'Étape 2 (VCEL-2): ' + e.message, step: 2, sheetId }, { status: 500 })
  }

  // ── Étape 3 : VCEL-3 ────────────────────────────────────────────────────────
  let wf3Id = ''
  try {
    console.log('[PROVISION] Étape 3: VCEL-3...')
    wf3Id = await createWorkflowResume(userId, nom || email, email)
    console.log('[PROVISION] VCEL-3 OK:', wf3Id)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 3:', e.message)
    return NextResponse.json({ error: 'Étape 3 (VCEL-3): ' + e.message, step: 3, sheetId, wf2Id }, { status: 500 })
  }

  // ── Étape 4 : Supabase ──────────────────────────────────────────────────────
  try {
    const { error: updateError } = await supabaseAdmin.from('users').update({
      n8n_workflow_ca_id:     wf2Id,
      n8n_workflow_resume_id: wf3Id,
      google_sheet_id:        sheetId,
      provisionne:            true,
      provisionne_at:         new Date().toISOString(),
    }).eq('id', userId)

    if (updateError) console.error('[PROVISION] Update error:', updateError.message)

    await supabaseAdmin.from('workflows').insert([
      { user_id: userId, workflow_id: wf2Id, nom: 'CA Sheets → Supabase',   actif: true, statut: 'actif', nb_executions_mois: 0 },
      { user_id: userId, workflow_id: wf3Id, nom: 'Résumé hebdomadaire IA', actif: true, statut: 'actif', nb_executions_mois: 0 },
    ])
    console.log('[PROVISION] ✅ Terminé pour', email)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 4:', e.message)
    return NextResponse.json({ error: 'Étape 4 (Supabase): ' + e.message, step: 4 }, { status: 500 })
  }

  return NextResponse.json({ success: true, sheetId, wf2Id, wf3Id, message: `Environnement créé pour ${email}` })
}
