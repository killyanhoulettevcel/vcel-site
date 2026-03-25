// src/app/api/lead-activites/route.ts
// Gère la timeline d'activités par lead
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const leadId = searchParams.get('lead_id')
  if (!leadId) return NextResponse.json({ error: 'lead_id requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('lead_activites')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()

  const { data, error } = await supabaseAdmin
    .from('lead_activites')
    .insert({
      user_id:  userId,
      lead_id:  body.lead_id,
      type:     body.type,     // 'note' | 'email' | 'appel' | 'statut' | 'creation' | 'relance'
      contenu:  body.contenu,
      meta:     body.meta || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin
    .from('lead_activites')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}