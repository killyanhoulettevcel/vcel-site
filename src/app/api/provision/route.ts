import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Ajoute dans .env.local :
// N8N_URL=https://ton-instance-n8n.railway.app
// N8N_API_KEY=ton-api-key-n8n (Settings → API → Create API Key)
// GOOGLE_SERVICE_ACCOUNT_EMAIL=vcel@vcel.iam.gserviceaccount.com
// GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
// GOOGLE_SHEETS_TEMPLATE_ID=id-de-ta-feuille-template
// PROVISIONING_SECRET=un-secret-pour-sécuriser-cet-endpoint
// ─────────────────────────────────────────────────────────────────────────────


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

// ── Générer JWT pour Google Service Account ───────────────────────────────────
async function generateGoogleJWT(credentials: any): Promise<string> {
  const now   = Math.floor(Date.now() / 1000)
  const claim = {
    iss:   credentials.client_email,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }

  const toBase64url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const header  = toBase64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = toBase64url(JSON.stringify(claim))
  const input   = `${header}.${payload}`

  // Signer avec la clé privée RSA
  const keyData = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(input)
  )

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${input}.${sig}`
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
  // Activer le workflow
  await n8nFetch('/workflows/' + data.id + '/activate', { method: 'POST', body: '{}' })
  return data.id
}

// ── Créer workflow VCEL-3 dans n8n pour ce client ────────────────────────────
async function createWorkflowResume(userId: string, clientNom: string, clientEmail: string): Promise<string> {
  const nextauthUrl     = process.env.NEXTAUTH_URL || "https://vcel-site-gpg3.vercel.app"
  const provisionSecret = process.env.PROVISIONING_SECRET!
  const wfStr = "{\"name\": \"VCEL-3 \\u2014 R\\u00e9sum\\u00e9 Hebdo IA [killyan houlette]\", \"nodes\": [{\"parameters\": {\"rule\": {\"interval\": [{\"field\": \"cronExpression\", \"expression\": \"0 8 * * 1\"}]}}, \"id\": \"trigger-resume-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"Chaque Lundi 8h\", \"type\": \"n8n-nodes-base.scheduleTrigger\", \"typeVersion\": 1.1, \"position\": [112, 304]}, {\"parameters\": {\"url\": \"https://vcel-site-gpg3.vercel.app/api/provision/resume-data?userId=9abee008-6386-42ea-ae82-ca9ac40ca062\", \"sendHeaders\": true, \"headerParameters\": {\"parameters\": [{\"name\": \"x-provision-secret\", \"value\": \"vcel2024xK9mP3qR7nL2wT8\"}]}, \"options\": {}}, \"id\": \"fetch-data-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"R\\u00e9cup\\u00e9rer donn\\u00e9es client\", \"type\": \"n8n-nodes-base.httpRequest\", \"typeVersion\": 4.4, \"position\": [320, 304]}, {\"parameters\": {\"sendTo\": \"={{ $('R\\u00e9cup\\u00e9rer donn\\u00e9es client').item.json.client.email }}\", \"subject\": \"\\ud83d\\udcca Ton r\\u00e9sum\\u00e9 de la semaine \\u2014 VCEL\", \"message\": \"={{ $json.output[0].content[0].text }}\", \"options\": {\"appendAttribution\": false}}, \"id\": \"gmail-resume-9abee008-6386-42ea-ae82-ca9ac40ca062\", \"name\": \"Envoyer r\\u00e9sum\\u00e9\", \"type\": \"n8n-nodes-base.gmail\", \"typeVersion\": 2.1, \"position\": [864, 304], \"webhookId\": \"e1da3a97-f712-4927-9be1-adc4bcb911e3\", \"credentials\": {\"gmailOAuth2\": {\"id\": \"BIICZBJj4lmNP8QF\", \"name\": \"gmail_vcel\"}}}, {\"parameters\": {\"modelId\": {\"__rl\": true, \"value\": \"gpt-4o-mini\", \"mode\": \"list\", \"cachedResultName\": \"GPT-4O-MINI\"}, \"responses\": {\"values\": [{\"role\": \"system\", \"content\": \"=Tu es le coach business de Killyan Houlette.\\n\\nTu dois retourner UNIQUEMENT ce HTML en rempla\\u00e7ant les variables \\u2014 rien d'autre, pas de markdown, pas d'explication, pas de balise <html> personnalis\\u00e9e :\\n\\n<!DOCTYPE html>\\n<html>\\n<head>\\n  <meta charset=\\\"UTF-8\\\">\\n  <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">\\n</head>\\n<body style=\\\"margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;\\\">\\n  <table width=\\\"100%\\\" cellpadding=\\\"0\\\" cellspacing=\\\"0\\\" style=\\\"background:#0f172a;padding:40px 20px;\\\">\\n    <tr><td align=\\\"center\\\">\\n      <table width=\\\"600\\\" cellpadding=\\\"0\\\" cellspacing=\\\"0\\\" style=\\\"max-width:600px;width:100%;\\\">\\n        <tr><td style=\\\"background:linear-gradient(135deg,#1e3a5f,#1e293b);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;\\\">\\n          <p style=\\\"margin:0 0 8px;color:#64748b;font-size:13px;letter-spacing:2px;text-transform:uppercase;\\\">Votre r\\u00e9sum\\u00e9 de la semaine</p>\\n          <h1 style=\\\"margin:0;color:#ffffff;font-size:28px;font-weight:700;\\\">VCEL</h1>\\n          <p style=\\\"margin:8px 0 0;color:#3b82f6;font-size:14px;\\\">REMPLACE_DATE</p>\\n        </td></tr>\\n        <tr><td style=\\\"background:#1e293b;padding:28px 40px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;\\\">\\n          <p style=\\\"margin:0;color:#94a3b8;font-size:15px;line-height:1.7;\\\">REMPLACE_INTRO_COACH_2_3_PHRASES</p>\\n        </td></tr>\\n        <tr><td style=\\\"background:#1e293b;padding:24px 40px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;\\\">\\n          <p style=\\\"margin:0 0 16px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-top:1px solid #ffffff0a;padding-top:24px;\\\">\\ud83d\\udcb0 Finances du mois</p>\\n          <table width=\\\"100%\\\" cellpadding=\\\"0\\\" cellspacing=\\\"0\\\"><tr>\\n            <td width=\\\"33%\\\" style=\\\"text-align:center;background:#0f172a;border-radius:12px;padding:16px 8px;\\\">\\n              <p style=\\\"margin:0 0 4px;color:#64748b;font-size:11px;\\\">CA HT</p>\\n              <p style=\\\"margin:0;color:#ffffff;font-size:22px;font-weight:700;\\\">REMPLACE_CA\\u20ac</p>\\n              <p style=\\\"margin:4px 0 0;font-size:11px;color:REMPLACE_COULEUR_EVOL;\\\">REMPLACE_EVOLUTION</p>\\n            </td>\\n            <td width=\\\"4%\\\"></td>\\n            <td width=\\\"33%\\\" style=\\\"text-align:center;background:#0f172a;border-radius:12px;padding:16px 8px;\\\">\\n              <p style=\\\"margin:0 0 4px;color:#64748b;font-size:11px;\\\">Charges</p>\\n              <p style=\\\"margin:0;color:#ffffff;font-size:22px;font-weight:700;\\\">REMPLACE_CHARGES\\u20ac</p>\\n            </td>\\n            <td width=\\\"4%\\\"></td>\\n            <td width=\\\"33%\\\" style=\\\"text-align:center;background:#0f172a;border-radius:12px;padding:16px 8px;\\\">\\n              <p style=\\\"margin:0 0 4px;color:#64748b;font-size:11px;\\\">Marge</p>\\n              <p style=\\\"margin:0;color:REMPLACE_COULEUR_MARGE;font-size:22px;font-weight:700;\\\">REMPLACE_MARGE\\u20ac</p>\\n            </td>\\n          </tr></table>\\n        </td></tr>\\n        <tr><td style=\\\"background:#1e293b;padding:24px 40px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;\\\">\\n          <p style=\\\"margin:0 0 16px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-top:1px solid #ffffff0a;padding-top:24px;\\\">\\ud83c\\udfaf Leads & Conversion</p>\\n          <table width=\\\"100%\\\" cellpadding=\\\"0\\\" cellspacing=\\\"0\\\"><tr>\\n            <td width=\\\"25%\\\" style=\\\"text-align:center;background:#0f172a;border-radius:12px;padding:14px 8px;\\\">\\n              <p style=\\\"margin:0 0 4px;color:#64748b;font-size:11px;\\\">Total</p>\\n              <p style=\\\"margin:0;color:#ffffff;font-size:20px;font-weight:700;\\\">REMPLACE_LEADS_TOTAL</p>\\n            </td>\\n            <td width=\\\"4%\\\"></td>\\n            <td width=\\\"25%\\\" style=\\\"text-align:center;background:#0f172a;border-radius:12px;padding:14px 8px;\\\">\\n              <p style=\\\"margin:0 0 4px;color:#64748b;font-size:11px;\\\">Chauds</p>\\n              <p style=\\\"margin:0;color:#f97316;font-size:20px;font-weight:700;\\\">REMPLACE_LEADS_CHAUDS</p>\\n            </td>\\n            <td width=\\\"4%\\\"></td>\\n            <td width=\\\"25%\\\" style=\\\"text-align:center;background:#0f172a;border-radius:12px;padding:14px 8px;\\\">\\n              <p style=\\\"margin:0 0 4px;color:#64748b;font-size:11px;\\\">Convertis</p>\\n              <p style=\\\"margin:0;color:#22c55e;font-size:20px;font-weight:700;\\\">REMPLACE_LEADS_CONVERTIS</p>\\n            </td>\\n            <td width=\\\"4%\\\"></td>\\n            <td width=\\\"25%\\\" style=\\\"text-align:center;background:#0f172a;border-radius:12px;padding:14px 8px;\\\">\\n              <p style=\\\"margin:0 0 4px;color:#64748b;font-size:11px;\\\">Taux</p>\\n              <p style=\\\"margin:0;color:#3b82f6;font-size:20px;font-weight:700;\\\">REMPLACE_TAUX%</p>\\n            </td>\\n          </tr></table>\\n        </td></tr>\\n        <tr><td style=\\\"background:#1e293b;padding:24px 40px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;\\\">\\n          <div style=\\\"background:linear-gradient(135deg,#1e3a5f,#1e3a8a);border-radius:12px;padding:24px;border-left:3px solid #3b82f6;\\\">\\n            <p style=\\\"margin:0 0 8px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;\\\">\\u26a1 Action de la semaine</p>\\n            <p style=\\\"margin:0;color:#e2e8f0;font-size:15px;line-height:1.7;font-weight:500;\\\">REMPLACE_CONSEIL_DIRECT</p>\\n          </div>\\n        </td></tr>\\n        <tr><td style=\\\"background:#1e293b;padding:8px 40px 32px;border-left:1px solid #ffffff0f;border-right:1px solid #ffffff0f;text-align:center;\\\">\\n          <a href=\\\"https://vcel-site-gpg3.vercel.app/dashboard/client\\\" style=\\\"display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;margin-top:16px;\\\">Voir mon dashboard \\u2192</a>\\n        </td></tr>\\n        <tr><td style=\\\"background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #ffffff0f;border-top:none;\\\">\\n          <p style=\\\"margin:0;color:#334155;font-size:12px;\\\">VCEL \\u00b7 Automatisez. Gagnez du temps. Scalez.</p>\\n        </td></tr>\\n      </table>\\n    </td></tr>\\n  </table>\\n</body>\\n</html>\\n\\nVariables \\u00e0 remplacer avec les donn\\u00e9es re\\u00e7ues en JSON :\\n- REMPLACE_DATE \\u2192 date du lundi en fran\\u00e7ais\\n- REMPLACE_INTRO_COACH_2_3_PHRASES \\u2192 message coach direct et motivant\\n- REMPLACE_CA \\u2192 ca_ht du dernier mois\\n- REMPLACE_CHARGES \\u2192 charges du dernier mois\\n- REMPLACE_MARGE \\u2192 marge calcul\\u00e9e\\n- REMPLACE_COULEUR_MARGE \\u2192 #22c55e si positif, #ef4444 si n\\u00e9gatif\\n- REMPLACE_EVOLUTION \\u2192 \\u00e9volution vs mois pr\\u00e9c\\u00e9dent\\n- REMPLACE_COULEUR_EVOL \\u2192 #22c55e hausse, #ef4444 baisse, #64748b stable\\n- REMPLACE_LEADS_TOTAL \\u2192 nombre total leads\\n- REMPLACE_LEADS_CHAUDS \\u2192 leads chauds\\n- REMPLACE_LEADS_CONVERTIS \\u2192 leads convertis\\n- REMPLACE_TAUX \\u2192 taux conversion %\\n- REMPLACE_CONSEIL_DIRECT \\u2192 1 action concr\\u00e8te bas\\u00e9e sur les chiffres\"}, {\"content\": \"==Voici les donn\\u00e9es JSON du client :\\n\\nNom : {{ $json.client.nom }}\\nCA du mois : {{ $json.stats.ca_mois }}\\u20ac\\nCharges : {{ $json.stats.charges_mois }}\\u20ac\\nMarge : {{ $json.stats.marge_mois }}\\u20ac\\n\\u00c9volution CA : {{ $json.stats.diff_ca }}%\\nLeads total : {{ $json.stats.leads_semaine }}\\nLeads chauds : {{ $json.stats.leads_chauds }}\\nFactures impay\\u00e9es : {{ $json.stats.factures_dues }} pour {{ $json.stats.montant_du }}\\u20ac\\nObjectifs : {{ $json.objectifs }}\\n\\nRemplace toutes les variables REMPLACE_XXX dans le template HTML avec ces donn\\u00e9es et retourne uniquement le HTML final.\"}]}, \"builtInTools\": {}, \"options\": {\"maxTokens\": 4000}}, \"type\": \"@n8n/n8n-nodes-langchain.openAi\", \"typeVersion\": 2.1, \"position\": [528, 304], \"id\": \"45051bde-9e52-415d-a513-ec1083087b6f\", \"name\": \"Message a model\", \"credentials\": {\"openAiApi\": {\"id\": \"QyG8uqv3jbC6dfrQ\", \"name\": \"OpenAi account\"}}}], \"connections\": {\"Chaque Lundi 8h\": {\"main\": [[{\"node\": \"R\\u00e9cup\\u00e9rer donn\\u00e9es client\", \"type\": \"main\", \"index\": 0}]]}, \"R\\u00e9cup\\u00e9rer donn\\u00e9es client\": {\"main\": [[{\"node\": \"Message a model\", \"type\": \"main\", \"index\": 0}]]}, \"Message a model\": {\"main\": [[{\"node\": \"Envoyer r\\u00e9sum\\u00e9\", \"type\": \"main\", \"index\": 0}]]}}, \"settings\": {\"executionOrder\": \"v1\", \"callerPolicy\": \"workflowsFromSameOwner\", \"availableInMCP\": false}}"
    .replace(/9abee008-6386-42ea-ae82-ca9ac40ca062/g, userId)
    .replace(/killyan houlette/g, clientNom)
    .replace(/Killyan Houlette/g, clientNom.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))
    .replace(/killyan\.houlette@vcel\.fr/g, clientEmail)
    .replace(/vcel-site-gpg3\.vercel\.app/g, nextauthUrl.replace("https://", ""))
    .replace(/vcel2024xK9mP3qR7nL2wT8/g, provisionSecret)
  const workflow = JSON.parse(wfStr)
  workflow.name = "VCEL-3 — Résumé Hebdo IA [" + clientNom + "]"
  const res  = await n8nFetch('/workflows', { method: 'POST', body: JSON.stringify(workflow) })
  const data = await res.json()
  console.log('[N8N VCEL-3] response:', JSON.stringify(data).substring(0, 200))
  await n8nFetch('/workflows/' + data.id + '/activate', { method: 'POST', body: '{}' })
  return data.id
}



export async function POST(req: NextRequest) {
  const N8N_URL = process.env.N8N_URL
  const N8N_KEY = process.env.N8N_API_KEY
  const SECRET  = process.env.PROVISIONING_SECRET

  console.log('[PROVISION] ENV CHECK - N8N_URL:', N8N_URL || 'MANQUANT', '| SECRET:', SECRET ? 'OK' : 'MANQUANT')

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
    await activateWorkflow(wf2Id)
    console.log('[PROVISION] VCEL-2 OK:', wf2Id)
  } catch (e: any) {
    console.error('[PROVISION] Erreur étape 2:', e.message)
    return NextResponse.json({ error: 'Étape 2 (VCEL-2): ' + e.message, step: 2, sheetId }, { status: 500 })
  }

  // ── Étape 3 : VCEL-3 ────────────────────────────────────────────────────────
  let wf3Id = ''
  try {
    console.log('[PROVISION] Étape 3: VCEL-3...')
    wf3Id = await createWorkflowResume(userId, email, nom || email)
    await activateWorkflow(wf3Id)
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
