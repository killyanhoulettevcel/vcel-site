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

  const workflow = {
  "name": "VCEL-2 — CA Sheets → Supabase [${clientNom}]",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 6 * * 1"
            }
          ]
        }
      },
      "id": "trigger-ca-${userId}",
      "name": "Déclencheur hebdo",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [
        112,
        304
      ]
    },
    {
      "parameters": {
        "documentId": {
          "__rl": true,
          "mode": "id",
          "value": "${sheetId}"
        },
        "sheetName": {
          "__rl": true,
          "value": 2075626985,
          "mode": "list",
          "cachedResultName": "dashboard",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=2075626985"
        },
        "options": {}
      },
      "id": "sheets-ca-${userId}",
      "name": "Lire CA depuis Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [
        320,
        304
      ],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "6fkxDhYtydoKz0Ww",
          "name": "sheets_vcel"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "const rows = $input.all().map(i => i.json);\nconst userId = '${userId}';\nconst results = [];\n\nfor (const row of rows) {\n  if (!row.mois || !row.ca_ht) continue;\n  results.push({\n    json: {\n      user_id:  userId,\n      mois:     row.mois,\n      ca_ht:    parseFloat(row.ca_ht || 0),\n      charges:  parseFloat(row.charges_total || 0),\n      marge:    parseFloat(row.marge_brute || 0),\n    }\n  });\n}\nreturn results;"
      },
      "id": "calcul-ca-${userId}",
      "name": "Calculer CA mensuel",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        544,
        304
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://rvgkzyafgqitmhuyvznh.supabase.co/rest/v1/ca_data",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "${supabaseKey}"
            },
            {
              "name": "Authorization",
              "value": "Bearer ${supabaseKey}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "Prefer",
              "value": "resolution=merge-duplicates"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "user_id",
              "value": "={{ $json.user_id }}"
            },
            {
              "name": "mois",
              "value": "={{ $json.mois }}"
            },
            {
              "name": "ca_ht",
              "value": "={{ $json.ca_ht }}"
            },
            {
              "name": "charges",
              "value": "={{ $json.charges }}"
            }
          ]
        },
        "options": {}
      },
      "id": "supabase-ca-${userId}",
      "name": "Upsert Supabase CA",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.4,
      "position": [
        768,
        304
      ]
    }
  ],
  "connections": {
    "Déclencheur hebdo": {
      "main": [
        [
          {
            "node": "Lire CA depuis Sheets",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Lire CA depuis Sheets": {
      "main": [
        [
          {
            "node": "Calculer CA mensuel",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Calculer CA mensuel": {
      "main": [
        [
          {
            "node": "Upsert Supabase CA",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "callerPolicy": "workflowsFromSameOwner",
    "availableInMCP": false
  }
}
  workflow.name = `VCEL-2 — CA Sheets → Supabase [${clientNom}]`

  const res  = await n8nFetch('/workflows', { method: 'POST', body: JSON.stringify(workflow) })
  const data = await res.json()
  console.log('[N8N VCEL-2] response:', JSON.stringify(data).substring(0, 200))
  return data.id
}
return results;`
        }
      },
      {
        id: `supabase-ca-${userId}`,
        name: 'Upsert Supabase CA',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.4,
        position: [768, 304],
        parameters: {
          method: 'POST',
          url: `${supabaseUrl}/rest/v1/ca_data`,
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'apikey',        value: supabaseKey },
              { name: 'Authorization', value: `Bearer ${supabaseKey}` },
              { name: 'Content-Type',  value: 'application/json' },
              { name: 'Prefer',        value: 'resolution=merge-duplicates' },
            ]
          },
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'user_id', value: '={ $json.user_id }' },
              { name: 'mois',    value: '={ $json.mois }' },
              { name: 'ca_ht',   value: '={ $json.ca_ht }' },
              { name: 'charges', value: '={ $json.charges }' },
            ]
          },
          options: {}
        }
      }
    ],
    connections: {
      'Déclencheur hebdo':     { main: [[{ node: 'Lire CA depuis Sheets', type: 'main', index: 0 }]] },
      'Lire CA depuis Sheets': { main: [[{ node: 'Calculer CA mensuel',   type: 'main', index: 0 }]] },
      'Calculer CA mensuel':   { main: [[{ node: 'Upsert Supabase CA',    type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' }
  }

  const res  = await n8nFetch('/workflows', { method: 'POST', body: JSON.stringify(workflow) })
  const data = await res.json()
  console.log('[N8N VCEL-2] response:', JSON.stringify(data).substring(0, 200))
  return data.id
}

// ── Créer workflow VCEL-3 dans n8n pour ce client ────────────────────────────
async function createWorkflowResume(userId: string, clientEmail: string, clientNom: string): Promise<string> {
  const workflow = {
    name: `VCEL-3 — Résumé Hebdo IA [${clientNom}]`,
    nodes: [
      {
        id: `trigger-resume-${userId}`,
        name: 'Chaque Lundi 8h',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.1,
        position: [100, 300],
        parameters: {
          rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * 1' }] }
        }
      },
      {
        id: `fetch-data-${userId}`,
        name: 'Récupérer données client',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.4,
        position: [320, 300],
        parameters: {
          url: `${process.env.NEXTAUTH_URL || 'https://vcel-site-gpg3.vercel.app'}/api/provision/resume-data?userId=${userId}`,
          method: 'GET',
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'x-provision-secret', value: process.env.PROVISIONING_SECRET! }]
          },
          options: {}
        }
      },
      {
        id: `gpt-resume-${userId}`,
        name: 'GPT Résumé IA',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.4,
        position: [540, 300],
        parameters: {
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'Authorization', value: `Bearer ${process.env.OPENAI_API_KEY}` },
              { name: 'Content-Type',  value: 'application/json' },
            ]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: `={
  "model": "gpt-4o-mini",
  "max_tokens": 600,
  "temperature": 0.8,
  "messages": [
    { "role": "system", "content": "Tu es le coach business de ${clientNom}. Rédige un résumé hebdomadaire chaleureux et motivant en HTML simple." },
    { "role": "user", "content": {{ JSON.stringify($json) }} }
  ]
}`,
          options: {}
        }
      },
      {
        id: `gmail-resume-${userId}`,
        name: 'Envoyer résumé',
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2.1,
        position: [760, 300],
        parameters: {
          sendTo:    clientEmail,
          subject:   `📊 Ton résumé de la semaine — VCEL`,
          emailType: 'html',
          message:   '={{ $json.choices[0].message.content }}',
          options:   { appendAttribution: false }
        },
        credentials: { gmailOAuth2: { id: process.env.N8N_GMAIL_CREDENTIAL_ID!, name: 'Gmail VCEL' } }
      }
    ],
    connections: {
      'Chaque Lundi 8h':          { main: [[{ node: 'Récupérer données client', type: 'main', index: 0 }]] },
      'Récupérer données client': { main: [[{ node: 'GPT Résumé IA',            type: 'main', index: 0 }]] },
      'GPT Résumé IA':            { main: [[{ node: 'Envoyer résumé',           type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' }
  }

  const res  = await n8nFetch('/workflows', { method: 'POST', body: JSON.stringify(workflow) })
  const data = await res.json()
  console.log('[N8N VCEL-3] response:', JSON.stringify(data).substring(0, 200))
  return data.id
}

// ── Activer un workflow n8n ───────────────────────────────────────────────────
async function activateWorkflow(workflowId: string): Promise<void> {
  await n8nFetch(`/workflows/${workflowId}/activate`, { method: 'POST' })
}

// ── ENDPOINT PRINCIPAL ────────────────────────────────────────────────────────
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
