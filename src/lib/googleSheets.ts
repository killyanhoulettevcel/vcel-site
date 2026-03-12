// src/lib/googleSheets.ts
// Lib générique pour lire/écrire dans Google Sheets via Service Account

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

// ── Générer un token OAuth2 depuis le Service Account ─────────────────────────
async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!

  // La clé peut être un JSON stringifié ou juste la private_key
  let privateKey: string
  try {
    const parsed = JSON.parse(rawKey)
    privateKey = parsed.private_key || rawKey
  } catch {
    privateKey = rawKey
  }

  privateKey = privateKey.replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss:   email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }

  const toBase64url = (str: string) =>
    btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const header  = toBase64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = toBase64url(JSON.stringify(claim))
  const input   = `${header}.${payload}`

  const keyData = privateKey
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

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const jwt = `${input}.${sig}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth2:grantType:jwt-bearer',
      assertion:  jwt,
    }),
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error('Token Google échoué: ' + JSON.stringify(tokenData))
  return tokenData.access_token
}

// ── Lire les valeurs d'un onglet ──────────────────────────────────────────────
export async function sheetsRead(sheetId: string, range: string): Promise<any[][]> {
  const token = await getAccessToken()
  const res = await fetch(
    `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.values || []
}

// ── Ajouter une ligne dans un onglet (append) ─────────────────────────────────
export async function sheetsAppend(sheetId: string, range: string, values: any[][]): Promise<void> {
  const token = await getAccessToken()
  await fetch(
    `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ values }),
    }
  )
}

// ── Mettre à jour une plage précise ──────────────────────────────────────────
export async function sheetsUpdate(sheetId: string, range: string, values: any[][]): Promise<void> {
  const token = await getAccessToken()
  await fetch(
    `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method:  'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ values }),
    }
  )
}

// ── Trouver la ligne d'une valeur dans une colonne ────────────────────────────
// Retourne le numéro de ligne (1-based) ou -1 si pas trouvé
export async function sheetsFindRow(sheetId: string, tab: string, col: string, value: string): Promise<number> {
  const values = await sheetsRead(sheetId, `${tab}!${col}:${col}`)
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === value) return i + 1
  }
  return -1
}

// ── Upsert : met à jour si la ligne existe, sinon ajoute ─────────────────────
// matchCol : colonne de recherche ex: 'A', matchValue : valeur à chercher
export async function sheetsUpsert(
  sheetId:    string,
  tab:        string,
  matchCol:   string,
  matchValue: string,
  rowValues:  any[]
): Promise<void> {
  const rowNum = await sheetsFindRow(sheetId, tab, matchCol, matchValue)
  if (rowNum > 0) {
    const range = `${tab}!A${rowNum}:Z${rowNum}`
    await sheetsUpdate(sheetId, range, [rowValues])
  } else {
    await sheetsAppend(sheetId, `${tab}!A:Z`, [rowValues])
  }
}

// ── Récupérer le google_sheet_id d'un user depuis Supabase ───────────────────
// (import séparé pour éviter les dépendances circulaires)
export async function getUserSheetId(supabaseAdmin: any, userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('google_sheet_id')
    .eq('id', userId)
    .single()
  return data?.google_sheet_id || null
}
