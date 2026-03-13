// src/app/api/produits/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { data, error } = await supabaseAdmin
    .from('produits').select('*').eq('user_id', userId).eq('actif', true).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('produits').insert({
    user_id:     userId,
    nom:         body.nom,
    description: body.description || '',
    prix_vente:  parseFloat(body.prix_vente) || 0,
    cout_revient:parseFloat(body.cout_revient) || 0,
    stock:       parseInt(body.stock) || 0,
    categorie:   body.categorie || '',
    source:      'manuel',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body = await req.json()
  const { id, ...updates } = body
  if (updates.prix_vente)   updates.prix_vente   = parseFloat(updates.prix_vente)
  if (updates.cout_revient) updates.cout_revient = parseFloat(updates.cout_revient)
  if (updates.stock)        updates.stock        = parseInt(updates.stock)
  updates.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('produits').update(updates).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin
    .from('produits').update({ actif: false }).eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
