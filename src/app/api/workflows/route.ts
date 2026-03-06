import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const role   = (session.user as any).role

  let query = supabaseAdmin
    .from('workflows')
    .select('*')
    .order('nom', { ascending: true })

  if (role !== 'admin') query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) { console.error('Workflows error:', error); return NextResponse.json([]) }
  return NextResponse.json(data || [])
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...updates } = body

  const { data, error } = await supabaseAdmin
    .from('workflows')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
