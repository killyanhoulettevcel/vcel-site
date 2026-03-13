// src/app/api/auth/google-calendar/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ')

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (code && state === 'calendar') {
    const userId = (session.user as any).id
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  `${process.env.NEXTAUTH_URL}/api/auth/google-calendar`,
        grant_type:    'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/client/agenda?error=oauth`)
    }
    await supabaseAdmin.from('users').update({
      google_access_token:  tokens.access_token,
      google_refresh_token: tokens.refresh_token,
      google_token_expiry:  new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    }).eq('id', userId)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/client/agenda?connected=1`)
  }

  // Initier le flow OAuth avec Calendar + Gmail
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  `${process.env.NEXTAUTH_URL}/api/auth/google-calendar`,
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state:         'calendar',
  })
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
