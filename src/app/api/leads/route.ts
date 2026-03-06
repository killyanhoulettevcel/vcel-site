import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// ─── GET — Lire les leads du client connecté ─────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const role   = (session.user as any).role

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut')

  let query = supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  // Admin voit tous les leads, client voit les siens
  if (role !== 'admin') query = query.eq('user_id', userId)
  if (statut) query = query.eq('statut', statut)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// ─── POST — Créer un lead ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const body    = await req.json()

  // Si pas connecté (formulaire landing) → user_id null
  const userId = session ? (session.user as any).id : null

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      user_id:    userId,
      nom:        body.nom,
      email:      body.email,
      telephone:  body.telephone || '',
      entreprise: body.entreprise || '',
      secteur:    body.secteur || '',
      message:    body.message || '',
      score:      body.score || 'tiède',
      statut:     'nouveau',
      source:     body.source || 'Formulaire landing',
      date:       new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// ─── PUT — Modifier un lead ───────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...updates } = body

  const { data, error } = await supabaseAdmin
    .from('leads')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ─── DELETE — Supprimer un lead ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const { error } = await supabaseAdmin
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
