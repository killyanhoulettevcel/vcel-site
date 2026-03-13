// src/lib/googleCalendar.ts
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'

// ── Rafraîchir le token OAuth ─────────────────────────────────────────────────
export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string, expiry: Date }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Refresh token échoué: ' + JSON.stringify(data))
  return {
    access_token: data.access_token,
    expiry:       new Date(Date.now() + (data.expires_in || 3600) * 1000),
  }
}

// ── Récupérer un token valide (refresh si expiré) ─────────────────────────────
export async function getValidToken(supabaseAdmin: any, userId: string): Promise<string> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', userId)
    .single()

  if (!user?.google_refresh_token) throw new Error('Google Calendar non connecté')

  const expiry = user.google_token_expiry ? new Date(user.google_token_expiry) : new Date(0)
  const needsRefresh = expiry < new Date(Date.now() + 60000) // refresh si expire dans < 1min

  if (needsRefresh || !user.google_access_token) {
    const { access_token, expiry: newExpiry } = await refreshAccessToken(user.google_refresh_token)
    await supabaseAdmin.from('users').update({
      google_access_token:  access_token,
      google_token_expiry:  newExpiry.toISOString(),
    }).eq('id', userId)
    return access_token
  }

  return user.google_access_token
}

// ── Lister les événements ─────────────────────────────────────────────────────
export async function listEvents(token: string, options: {
  timeMin?: string
  timeMax?: string
  maxResults?: number
  calendarId?: string
} = {}) {
  const params = new URLSearchParams({
    timeMin:    options.timeMin    || new Date().toISOString(),
    timeMax:    options.timeMax    || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults: String(options.maxResults || 50),
    singleEvents: 'true',
    orderBy:    'startTime',
  })
  const calId = encodeURIComponent(options.calendarId || 'primary')
  const res = await fetch(`${CALENDAR_BASE}/calendars/${calId}/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.items || []
}

// ── Créer un événement ────────────────────────────────────────────────────────
export async function createEvent(token: string, event: {
  summary: string
  description?: string
  location?: string
  start: string // ISO datetime
  end: string   // ISO datetime
  attendees?: string[]
  calendarId?: string
}) {
  const calId = encodeURIComponent(event.calendarId || 'primary')
  const body: any = {
    summary:     event.summary,
    description: event.description || '',
    location:    event.location    || '',
    start: { dateTime: event.start, timeZone: 'Europe/Paris' },
    end:   { dateTime: event.end,   timeZone: 'Europe/Paris' },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
  }
  if (event.attendees?.length) {
    body.attendees = event.attendees.map(email => ({ email }))
  }
  const res = await fetch(`${CALENDAR_BASE}/calendars/${calId}/events`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// ── Modifier un événement ─────────────────────────────────────────────────────
export async function updateEvent(token: string, eventId: string, event: any, calendarId = 'primary') {
  const calId = encodeURIComponent(calendarId)
  const res = await fetch(`${CALENDAR_BASE}/calendars/${calId}/events/${eventId}`, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(event),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// ── Supprimer un événement ────────────────────────────────────────────────────
export async function deleteEvent(token: string, eventId: string, calendarId = 'primary') {
  const calId = encodeURIComponent(calendarId)
  await fetch(`${CALENDAR_BASE}/calendars/${calId}/events/${eventId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ── Événements du jour ────────────────────────────────────────────────────────
export async function getTodayEvents(token: string) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return listEvents(token, { timeMin: start.toISOString(), timeMax: end.toISOString(), maxResults: 20 })
}
