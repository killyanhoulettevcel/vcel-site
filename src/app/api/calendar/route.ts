// src/app/api/calendar/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getValidToken, listEvents, createEvent, deleteEvent } from '@/lib/googleCalendar'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id

  const { searchParams } = new URL(req.url)
  const timeMin = searchParams.get('timeMin') || undefined
  const timeMax = searchParams.get('timeMax') || undefined

  try {
    const token  = await getValidToken(supabaseAdmin, userId)
    const events = await listEvents(token, { timeMin, timeMax, maxResults: 50 })
    return NextResponse.json(events)
  } catch (e: any) {
    if (e.message?.includes('non connecté')) {
      return NextResponse.json({ error: 'not_connected' }, { status: 403 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()

  try {
    const token = await getValidToken(supabaseAdmin, userId)
    const event = await createEvent(token, body)
    return NextResponse.json(event, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('id')
  if (!eventId) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  try {
    const token = await getValidToken(supabaseAdmin, userId)
    await deleteEvent(token, eventId)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
