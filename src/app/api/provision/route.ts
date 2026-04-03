import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

async function createWorkflowCA(userId: string, sheetId: string, clientNom: string): Promise<string> {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const VCEL2_TEMPLATE = '{"name": "VCEL-2 — CA Sheets → Supabase [CLIENT_NOM_PLACEHOLDER]", "nodes": [{"parameters": {"rule": {"interval": [{"field": "cronExpression", "expression": "0 6 * * 1"}]}}, "id": "trigger-ca-USER_ID_PLACEHOLDER", "name": "Déclencheur hebdo", "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.1, "position": [112, 304]}, {"parameters": {"documentId": {"__rl": true, "mode": "id", "value": "SHEET_ID_PLACEHOLDER"}, "sheetName": {"__rl": true, "value": 2075626985, "mode": "list", "cachedResultName": "dashboard", "cachedResultUrl": "https://docs.google.com/spreadsheets/d/SHEET_ID_PLACEHOLDER/edit#gid=2075626985"}, "options": {}}, "id": "sheets-ca-USER_ID_PLACEHOLDER", "name": "Lire CA depuis Sheets", "type": "n8n-nodes-base.googleSheets", "typeVersion": 4.7, "position": [320, 304], "credentials": {"googleSheetsOAuth2Api": {"id": "szTHHjccPuAqXvDP", "name": "sheets_vcel"}}}, {"parameters": {"jsCode": "const rows = $input.all().map(i => i.json);\\nconst userId = \'USER_ID_PLACEHOLDER\';\\nconst results = [];\\nfor (const row of rows) {\\n  if (!row.mois || !row.ca_ht) continue;\\n  results.push({ json: { user_id: userId, mois: row.mois, ca_ht: parseFloat(row.ca_ht || 0), charges: parseFloat(row.charges_total || 0) } });\\n}\\nreturn results;"}, "id": "calcul-ca-USER_ID_PLACEHOLDER", "name": "Calculer CA mensuel", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [544, 304]}, {"parameters": {"method": "POST", "url": "https://rvgkzyafgqitmhuyvznh.supabase.co/rest/v1/ca_data", "sendHeaders": true, "headerParameters": {"parameters": [{"name": "apikey", "value": "SUPABASE_KEY_PLACEHOLDER"}, {"name": "Authorization", "value": "Bearer SUPABASE_KEY_PLACEHOLDER"}, {"name": "Content-Type", "value": "application/json"}, {"name": "Prefer", "value": "resolution=merge-duplicates"}]}, "sendBody": true, "bodyParameters": {"parameters": [{"name": "user_id", "value": "={{ $json.user_id }}"}, {"name": "mois", "value": "={{ $json.mois }}"}, {"name": "ca_ht", "value": "={{ $json.ca_ht }}"}, {"name": "charges", "value": "={{ $json.charges }}"}]}, "options": {}}, "id": "supabase-ca-USER_ID_PLACEHOLDER", "name": "Upsert Supabase CA", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.4, "position": [768, 304]}, {"parameters": {"url": "https://vcel.fr/api/workflows/sync", "sendHeaders": true, "headerParameters": {"parameters": [{"name": "x-provision-secret", "value": "PROVISIONING_SECRET_PLACEHOLDER_REPLACE"}]}, "options": {}}, "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.4, "position": [976, 304], "id": "7f2097b9-ebf5-42fe-83ee-505e48a42afa", "name": "HTTP Request"}], "pinData": {}, "connections": {"Déclencheur hebdo": {"main": [[{"node": "Lire CA depuis Sheets", "type": "main", "index": 0}]]}, "Lire CA depuis Sheets": {"main": [[{"node": "Calculer CA mensuel", "type": "main", "index": 0}]]}, "Calculer CA mensuel": {"main": [[{"node": "Upsert Supabase CA", "type": "main", "index": 0}]]}, "Upsert Supabase CA": {"main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]}}, "active": true, "settings": {"executionOrder": "v1", "callerPolicy": "workflowsFromSameOwner", "availableInMCP": false}, "versionId": "0c363955-e140-4bb0-883a-a8c2230c65ea", "meta": {"instanceId": "f0b7b12a77277c1e44db6d0b048d7a8dda62a8cb3f8c45adc45370441690747c"}, "id": "T77AxoxwEr08z9E6", "tags": []}'
  const wfStr = VCEL2_TEMPLATE
    .replace(/USER_ID_PLACEHOLDER/g, userId)
    .replace(/SHEET_ID_PLACEHOLDER/g, sheetId)
    .replace(/CLIENT_NOM_PLACEHOLDER/g, clientNom)
    .replace(/SUPABASE_KEY_PLACEHOLDER/g, supabaseKey)
    .replace(/PROVISIONING_SECRET_PLACEHOLDER_REPLACE/g, process.env.PROVISIONING_SECRET!)
  const workflow = JSON.parse(wfStr)
  delete workflow.id
  delete workflow.active
  delete workflow.versionId
  delete workflow.meta
  delete workflow.tags
  workflow.name = `VCEL-2 — CA Sheets → Supabase [${clientNom}]`
  const res  = await n8nFetch('/workflows', { method: 'POST', body: JSON.stringify(workflow) })
  const data = await res.json()
  console.log('[N8N VCEL-2] response:', JSON.stringify(data).substring(0, 200))
  await n8nFetch('/workflows/' + data.id + '/activate', { method: 'POST', body: '{}' })
  return data.id
}

async function createWorkflowResume(userId: string, clientNom: string, clientEmail: string): Promise<string> {
  const provisionSecret = process.env.PROVISIONING_SECRET!
  const VCEL3_TEMPLATE = '{"name": "VCEL-3 — Résumé Hebdo IA [CLIENT_EMAIL_PLACEHOLDER]", "nodes": [{"parameters": {"rule": {"interval": [{"field": "cronExpression", "expression": "0 8 * * 1"}]}}, "id": "trigger-resume-USER_ID_PLACEHOLDER", "name": "Chaque Lundi 8h", "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.1, "position": [112, 304]}, {"parameters": {"url": "https://vcel.fr/api/provision/resume-data?userId=USER_ID_PLACEHOLDER", "sendHeaders": true, "headerParameters": {"parameters": [{"name": "x-provision-secret", "value": "PROVISION_SECRET_PLACEHOLDER"}]}, "options": {}}, "id": "fetch-data-USER_ID_PLACEHOLDER", "name": "Récupérer données client", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.4, "position": [320, 304]}, {"parameters": {"sendTo": "={{ $(\'Récupérer données client\').item.json.client.email }}", "subject": "📊 Ton résumé de la semaine — VCEL", "message": "={{ $json.output[0].content[0].text }}", "options": {"appendAttribution": false}}, "id": "gmail-resume-USER_ID_PLACEHOLDER", "name": "Envoyer résumé", "type": "n8n-nodes-base.gmail", "typeVersion": 2.1, "position": [864, 304], "webhookId": "e1da3a97-f712-4927-9be1-adc4bcb911e3", "credentials": {"gmailOAuth2": {"id": "X5gnBQVdof0wiJyu", "name": "gmail_vcel"}}}, {"parameters": {"modelId": {"__rl": true, "value": "gpt-4o-mini", "mode": "list", "cachedResultName": "GPT-4O-MINI"}, "responses": {"values": [{"role": "system", "content": "=Tu es le coach business de CLIENT_EMAIL_PLACEHOLDER.\\n\\nTu dois retourner UNIQUEMENT ce HTML en remplaçant les variables — rien d\'autre, pas de markdown, pas d\'explication, pas de balise <html> personnalisée :\\n\\n<!DOCTYPE html>\\n<html>\\n<head>\\n  <meta charset=\\"UTF-8\\">\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">\\n</head>\\n<body style=\\"margin:0;padding:0;background:#0f172a;font-family:\'Segoe UI\',Arial,sans-serif;\\">\\n  <table width=\\"100%\\" cellpadding=\\"0\\" cellspacing=\\"0\\" style=\\"background:#0f172a;padding:40px 20px;\\">\\n    <tr><td align=\\"center\\">\\n      <table width=\\"600\\" cellpadding=\\"0\\" cellspacing=\\"0\\" style=\\"max-width:600px;width:100%;\\">\\n        <tr><td style=\\"background:linear-gradient(135deg,#1e3a5f,#1e293b);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;\\">\\n          <p style=\\"margin:0 0 8px;color:#64748b;font-size:13px;letter-spacing:2px;text-transform:uppercase;\\">Votre résumé de la semaine</p>\\n          <h1 style=\\"margin:0;color:#ffffff;font-size:28px;font-weight:700;\\">VCEL</h1>\\n          <p style=\\"margin:8px 0 0;color:#3b82f6;font-size:14px;\\">REMPLACE_DATE</p>\\n        </td></tr>\\n        <tr><td style=\\"background:#1e293b;padding:28px 40px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;\\">\\n          <p style=\\"margin:0;color:#94a3b8;font-size:15px;line-height:1.7;\\">REMPLACE_INTRO_COACH_2_3_PHRASES</p>\\n        </td></tr>\\n        <tr><td style=\\"background:#1e293b;padding:24px 40px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;\\">\\n          <p style=\\"margin:0 0 16px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-top:1px solid #ffffff0a;padding-top:24px;\\">💰 Finances du mois</p>\\n          <table width=\\"100%\\" cellpadding=\\"0\\" cellspacing=\\"0\\"><tr>\\n            <td width=\\"33%\\" style=\\"text-align:center;background:#0f172a;border-radius:12px;padding:16px 8px;\\">\\n              <p style=\\"margin:0 0 4px;color:#64748b;font-size:11px;\\">CA HT</p>\\n              <p style=\\"margin:0;color:#ffffff;font-size:22px;font-weight:700;\\">REMPLACE_CA€</p>\\n              <p style=\\"margin:4px 0 0;font-size:11px;color:REMPLACE_COULEUR_EVOL;\\">REMPLACE_EVOLUTION</p>\\n            </td>\\n            <td width=\\"4%\\"></td>\\n            <td width=\\"33%\\" style=\\"text-align:center;background:#0f172a;border-radius:12px;padding:16px 8px;\\">\\n              <p style=\\"margin:0 0 4px;color:#64748b;font-size:11px;\\">Charges</p>\\n              <p style=\\"margin:0;color:#ffffff;font-size:22px;font-weight:700;\\">REMPLACE_CHARGES€</p>\\n            </td>\\n            <td width=\\"4%\\"></td>\\n            <td width=\\"33%\\" style=\\"text-align:center;background:#0f172a;border-radius:12px;padding:16px 8px;\\">\\n              <p style=\\"margin:0 0 4px;color:#64748b;font-size:11px;\\">Marge</p>\\n              <p style=\\"margin:0;color:REMPLACE_COULEUR_MARGE;font-size:22px;font-weight:700;\\">REMPLACE_MARGE€</p>\\n            </td>\\n          </tr></table>\\n        </td></tr>\\n        <tr><td style=\\"background:#1e293b;padding:24px 40px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;\\">\\n          <p style=\\"margin:0 0 16px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-top:1px solid #ffffff0a;padding-top:24px;\\">🎯 Leads & Conversion</p>\\n          <table width=\\"100%\\" cellpadding=\\"0\\" cellspacing=\\"0\\"><tr>\\n            <td width=\\"25%\\" style=\\"text-align:center;background:#0f172a;border-radius:12px;padding:14px 8px;\\">\\n              <p style=\\"margin:0 0 4px;color:#64748b;font-size:11px;\\">Total</p>\\n              <p style=\\"margin:0;color:#ffffff;font-size:20px;font-weight:700;\\">REMPLACE_LEADS_TOTAL</p>\\n            </td>\\n            <td width=\\"4%\\"></td>\\n            <td width=\\"25%\\" style=\\"text-align:center;background:#0f172a;border-radius:12px;padding:14px 8px;\\">\\n              <p style=\\"margin:0 0 4px;color:#64748b;font-size:11px;\\">Chauds</p>\\n              <p style=\\"margin:0;color:#f97316;font-size:20px;font-weight:700;\\">REMPLACE_LEADS_CHAUDS</p>\\n            </td>\\n            <td width=\\"4%\\"></td>\\n            <td width=\\"25%\\" style=\\"text-align:center;background:#0f172a;border-radius:12px;padding:14px 8px;\\">\\n              <p style=\\"margin:0 0 4px;color:#64748b;font-size:11px;\\">Convertis</p>\\n              <p style=\\"margin:0;color:#22c55e;font-size:20px;font-weight:700;\\">REMPLACE_LEADS_CONVERTIS</p>\\n            </td>\\n            <td width=\\"4%\\"></td>\\n            <td width=\\"25%\\" style=\\"text-align:center;background:#0f172a;border-radius:12px;padding:14px 8px;\\">\\n              <p style=\\"margin:0 0 4px;color:#64748b;font-size:11px;\\">Taux</p>\\n              <p style=\\"margin:0;color:#3b82f6;font-size:20px;font-weight:700;\\">REMPLACE_TAUX%</p>\\n            </td>\\n          </tr></table>\\n        </td></tr>\\n        <tr><td style=\\"background:#1e293b;padding:24px 40px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;\\">\\n          <div style=\\"background:linear-gradient(135deg,#1e3a5f,#1e3a8a);border-radius:12px;padding:24px;border-left:3px solid #3b82f6;\\">\\n            <p style=\\"margin:0 0 8px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;\\">⚡ Action de la semaine</p>\\n            <p style=\\"margin:0;color:#e2e8f0;font-size:15px;line-height:1.7;font-weight:500;\\">REMPLACE_CONSEIL_DIRECT</p>\\n          </div>\\n        </td></tr>\\n        <tr><td style=\\"background:#1e293b;padding:8px 40px 32px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;text-align:center;\\">\\n          <a href=\\"https://vcel.fr/dashboard/client\\" style=\\"display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;margin-top:16px;\\">Voir mon dashboard →</a>\\n        </td></tr>\\n        <tr><td style=\\"background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #ffffff0f;border-top:none;\\">\\n          <p style=\\"margin:0;color:#334155;font-size:12px;\\">VCEL · Automatisez. Gagnez du temps. Scalez.</p>\\n        </td></tr>\\n      </table>\\n    </td></tr>\\n  </table>\\n</body>\\n</html>\\n\\nVariables à remplacer avec les données reçues en JSON :\\n- REMPLACE_DATE → date du lundi en français\\n- REMPLACE_INTRO_COACH_2_3_PHRASES → message coach direct et motivant\\n- REMPLACE_CA → ca_ht du dernier mois\\n- REMPLACE_CHARGES → charges du dernier mois\\n- REMPLACE_MARGE → marge calculée\\n- REMPLACE_COULEUR_MARGE → #22c55e si positif, #ef4444 si négatif\\n- REMPLACE_EVOLUTION → évolution vs mois précédent\\n- REMPLACE_COULEUR_EVOL → #22c55e hausse, #ef4444 baisse, #64748b stable\\n- REMPLACE_LEADS_TOTAL → nombre total leads\\n- REMPLACE_LEADS_CHAUDS → leads chauds\\n- REMPLACE_LEADS_CONVERTIS → leads convertis\\n- REMPLACE_TAUX → taux conversion %\\n- REMPLACE_CONSEIL_DIRECT → 1 action concrète basée sur les chiffres"}, {"content": "==Voici les données JSON du client :\\n\\nNom : {{ $json.client.nom }}\\nCA du mois : {{ $json.stats.ca_mois }}€\\nCharges : {{ $json.stats.charges_mois }}€\\nMarge : {{ $json.stats.marge_mois }}€\\nÉvolution CA : {{ $json.stats.diff_ca }}%\\nLeads total : {{ $json.stats.leads_semaine }}\\nLeads chauds : {{ $json.stats.leads_chauds }}\\nFactures impayées : {{ $json.stats.factures_dues }} pour {{ $json.stats.montant_du }}€\\nObjectifs : {{ $json.objectifs }}\\n\\nRemplace toutes les variables REMPLACE_XXX dans le template HTML avec ces données et retourne uniquement le HTML final."}]}, "builtInTools": {}, "options": {"maxTokens": 4000}}, "type": "@n8n/n8n-nodes-langchain.openAi", "typeVersion": 2.1, "position": [528, 304], "id": "45051bde-9e52-415d-a513-ec1083087b6f", "name": "Message a model", "credentials": {"openAiApi": {"id": "QMVl4ggc1HgxMwd4", "name": "OpenAi account"}}}, {"parameters": {"url": "https://vcel.fr/api/workflows/sync", "sendHeaders": true, "headerParameters": {"parameters": [{"name": "x-provision-secret", "value": "PROVISION_SECRET_PLACEHOLDER"}]}, "options": {}}, "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.4, "position": [1072, 304], "id": "034e2247-afd1-4a66-afba-ea4a06b29a38", "name": "HTTP Request"}], "pinData": {}, "connections": {"Chaque Lundi 8h": {"main": [[{"node": "Récupérer données client", "type": "main", "index": 0}]]}, "Récupérer données client": {"main": [[{"node": "Message a model", "type": "main", "index": 0}]]}, "Message a model": {"main": [[{"node": "Envoyer résumé", "type": "main", "index": 0}]]}, "Envoyer résumé": {"main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]}}, "active": true, "settings": {"executionOrder": "v1", "callerPolicy": "workflowsFromSameOwner", "availableInMCP": false}, "versionId": "b91fc845-26e2-4c17-8927-a786706bb653", "meta": {"instanceId": "f0b7b12a77277c1e44db6d0b048d7a8dda62a8cb3f8c45adc45370441690747c"}, "id": "t2b3GkujVww82dNw", "tags": []}'
  const wfStr = VCEL3_TEMPLATE
    .replace(/USER_ID_PLACEHOLDER/g, userId)
    .replace(/CLIENT_NOM_PLACEHOLDER/g, clientNom)
    .replace(/CLIENT_EMAIL_PLACEHOLDER/g, clientEmail)
    .replace(/PROVISION_SECRET_PLACEHOLDER/g, provisionSecret)
  const workflow = JSON.parse(wfStr)
  delete workflow.id
  delete workflow.active
  delete workflow.versionId
  delete workflow.meta
  delete workflow.tags
  workflow.name = `VCEL-3 — Résumé Hebdo IA [${clientEmail}]`
  const res  = await n8nFetch('/workflows', { method: 'POST', body: JSON.stringify(workflow) })
  const data = await res.json()
  console.log('[N8N VCEL-3] response:', JSON.stringify(data).substring(0, 200))
  await n8nFetch('/workflows/' + data.id + '/activate', { method: 'POST', body: '{}' })
  return data.id
}

async function activateWorkflow(workflowId: string): Promise<void> {
  await n8nFetch('/workflows/' + workflowId + '/activate', { method: 'POST', body: '{}' })
}

export async function POST(req: NextRequest) {
  const SECRET = process.env.PROVISIONING_SECRET
  console.log('[PROVISION] ENV CHECK - N8N_URL:', process.env.N8N_URL || 'MANQUANT', '| SECRET:', SECRET ? 'OK' : 'MANQUANT')

  const secret = req.headers.get('x-provision-secret')
  if (secret !== SECRET) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { userId, email, nom } = await req.json()
  if (!userId || !email) return NextResponse.json({ error: 'userId et email requis' }, { status: 400 })

  console.log(`[PROVISION] Démarrage pour ${email} (${userId})`)

  // Étape 1 : Google Sheet
  let sheetId = ''
  try {
    console.log('[PROVISION] Étape 1: Google Sheets...')
    sheetId = await createGoogleSheet(nom || email, email)
    console.log('[PROVISION] Sheet OK:', sheetId)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 1:', e.message)
    return NextResponse.json({ error: 'Étape 1 (Google Sheets): ' + e.message, step: 1 }, { status: 500 })
  }

  // Étape 2 : VCEL-2
  let wf2Id = ''
  try {
    console.log('[PROVISION] Étape 2: VCEL-2...')
    wf2Id = await createWorkflowCA(userId, sheetId, nom || email)
    console.log('[PROVISION] VCEL-2 OK:', wf2Id)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 2:', e.message)
    return NextResponse.json({ error: 'Étape 2 (VCEL-2): ' + e.message, step: 2, sheetId }, { status: 500 })
  }

  // Étape 3 : VCEL-3
  let wf3Id = ''
  try {
    console.log('[PROVISION] Étape 3: VCEL-3...')
    wf3Id = await createWorkflowResume(userId, nom || email, email)
    console.log('[PROVISION] VCEL-3 OK:', wf3Id)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 3:', e.message)
    return NextResponse.json({ error: 'Étape 3 (VCEL-3): ' + e.message, step: 3, sheetId, wf2Id }, { status: 500 })
  }

  // Étape 4 : Supabase
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
      { user_id: userId, workflow_id: wf2Id, nom: 'CA Sheets → Supabase',   actif: true, statut: 'ok', nb_executions_mois: 0 },
      { user_id: userId, workflow_id: wf3Id, nom: 'Résumé hebdomadaire IA', actif: true, statut: 'ok', nb_executions_mois: 0 },
    ])
    console.log('[PROVISION] ✅ Terminé pour', email)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 4:', e.message)
    return NextResponse.json({ error: 'Étape 4 (Supabase): ' + e.message, step: 4 }, { status: 500 })
  }

  return NextResponse.json({ success: true, sheetId, wf2Id, wf3Id, message: `Environnement créé pour ${email}` })
}
