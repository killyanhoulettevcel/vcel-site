// src/app/api/profil/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, nom, secteur, statut, role, created_at, stripe_customer_id, google_access_token, preferences')
    .eq('id', userId)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()
  const updates: any = {}

  if (body.nom)         updates.nom     = body.nom
  if (body.secteur)     updates.secteur = body.secteur
  if (body.email)       updates.email   = body.email.toLowerCase()
  if (body.preferences) updates.preferences = body.preferences

  // Déconnexion Google
  if (body.disconnect_google) {
    updates.google_access_token  = null
    updates.google_refresh_token = null
    updates.google_token_expiry  = null
  }

  // Changement de mot de passe
  if (body.new_password) {
    if (!body.current_password) return NextResponse.json({ error: 'Mot de passe actuel requis' }, { status: 400 })
    const { data: user } = await supabaseAdmin.from('users').select('password_hash').eq('id', userId).single()
    const valid = await bcrypt.compare(body.current_password, user?.password_hash || '')
    if (!valid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
    updates.password_hash = await bcrypt.hash(body.new_password, 10)
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ message: 'Rien à mettre à jour' })

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, nom, secteur, statut, role, preferences')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
