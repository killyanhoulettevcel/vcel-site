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

// ── Créer Google Sheet depuis template ───────────────────────────────────────
async function createGoogleSheet(clientNom: string, clientEmail: string): Promise<string> {
  // On utilise l'API Google Drive pour copier le template
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}')

  // Obtenir un token d'accès via JWT Service Account
  const jwt = await generateGoogleJWT(credentials)
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const { access_token } = await tokenRes.json()

  // Copier le template Google Sheets
  const templateId = process.env.GOOGLE_SHEETS_TEMPLATE_ID!
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || ''
  const copyRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${templateId}/copy?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `VCEL — ${clientNom} (${clientEmail})`,
        parents: [folderId],
        driveId: folderId,
      }),
    }
  )
  const copyData = await copyRes.json()
  console.log('[GOOGLE] copyData:', JSON.stringify(copyData).substring(0, 200))

  // Partager la feuille avec le client (optionnel)
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${copyData.id}/permissions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'writer',
        type: 'user',
        emailAddress: clientEmail,
      }),
    }
  )

  return copyData.id
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
  const workflow = {
    name: `VCEL-2 — CA Sheets → Supabase [${clientNom}]`,
    nodes: [
      {
        id: `trigger-ca-${userId}`,
        name: 'Déclencheur hebdo',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.1,
        position: [100, 300],
        parameters: {
          rule: { interval: [{ field: 'cronExpression', expression: '0 6 * * 1' }] }
        }
      },
      {
        id: `sheets-ca-${userId}`,
        name: 'Lire CA depuis Sheets',
        type: 'n8n-nodes-base.googleSheets',
        typeVersion: 4.7,
        position: [320, 300],
        parameters: {
          operation: 'readRows',
          documentId: { __rl: true, value: sheetId, mode: 'id' },
          sheetName:  { __rl: true, value: 'CA',    mode: 'name' },
          options: {}
        },
        credentials: { googleSheetsOAuth2Api: { id: process.env.N8N_GOOGLE_CREDENTIAL_ID!, name: 'Google Sheets VCEL' } }
      },
      {
        id: `calcul-ca-${userId}`,
        name: 'Calculer CA mensuel',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [540, 300],
        parameters: {
          jsCode: `
const rows = $input.all().map(i => i.json);
const userId = '${userId}';
const results = [];

for (const row of rows) {
  if (!row.mois || !row.ca_ht) continue;
  results.push({
    json: {
      user_id:  userId,
      mois:     row.mois,
      ca_ht:    parseFloat(row.ca_ht || 0),
      charges:  parseFloat(row.charges || 0),
      marge:    parseFloat(row.ca_ht || 0) - parseFloat(row.charges || 0),
    }
  });
}
return results;`
        }
      },
      {
        id: `supabase-ca-${userId}`,
        name: 'Upsert Supabase CA',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.4,
        position: [760, 300],
        parameters: {
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ca_data`,
          method: 'POST',
          authentication: 'genericCredentialType',
          genericAuthType: 'httpHeaderAuth',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'apikey',        value: process.env.SUPABASE_SERVICE_ROLE_KEY! },
              { name: 'Authorization', value: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` },
              { name: 'Content-Type',  value: 'application/json' },
              { name: 'Prefer',        value: 'resolution=merge-duplicates' },
            ]
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify($json) }}',
          options: {}
        }
      }
    ],
    connections: {
      'Déclencheur hebdo':    { main: [[{ node: 'Lire CA depuis Sheets', type: 'main', index: 0 }]] },
      'Lire CA depuis Sheets':{ main: [[{ node: 'Calculer CA mensuel',   type: 'main', index: 0 }]] },
      'Calculer CA mensuel':  { main: [[{ node: 'Upsert Supabase CA',    type: 'main', index: 0 }]] },
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
          url: `${process.env.NEXTAUTH_URL}/api/provision/resume-data?userId=${userId}`,
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
        type: 'n8n-nodes-base.openAi',
        typeVersion: 1.3,
        position: [540, 300],
        parameters: {
          resource: 'chat',
          operation: 'complete',
          modelId: { __rl: true, value: 'gpt-4o-mini', mode: 'list' },
          messages: {
            values: [
              { role: 'system', content: `Tu es le coach business de ${clientNom}. Rédige un résumé hebdomadaire chaleureux et motivant en HTML simple.` },
              { role: 'user',   content: '={{ JSON.stringify($json) }}' }
            ]
          },
          options: { maxTokens: 600, temperature: 0.8 }
        },
        credentials: { openAiApi: { id: process.env.N8N_OPENAI_CREDENTIAL_ID!, name: 'OpenAI VCEL' } }
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
          message:   '={{ $json.message.content }}',
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
