// src/app/api/calendar/today/route.ts
// Retourne les événements du jour pour les notifications
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getValidToken, getTodayEvents } from '@/lib/googleCalendar'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([])
  const userId = (session.user as any).id

  try {
    const token  = await getValidToken(supabaseAdmin, userId)
    const events = await getTodayEvents(token)
    return NextResponse.json(events)
  } catch {
    return NextResponse.json([])
  }
}
