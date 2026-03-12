// src/app/api/factures-fournisseurs/route.ts
// Colonnes onglet "factures_fournisseurs" :
// date_reception, fournisseur, numero_facture, montant_ht, tva, montant_ttc, date_facture, statut
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { sheetsUpsert, sheetsAppend, getUserSheetId } from '@/lib/googleSheets'

async function syncFournisseurToSheet(userId: string, facture: any, isUpdate = false) {
  try {
    const sheetId = await getUserSheetId(supabaseAdmin, userId)
    if (!sheetId) return
    const row = [
      facture.date_reception  || new Date().toISOString().split('T')[0],
      facture.fournisseur     || '',
      facture.numero_facture  || '',
      facture.montant_ht      || 0,
      facture.tva             || 0,
      facture.montant_ttc     || 0,
      facture.date_facture    || '',
      facture.statut          || 'reçue',
    ]
    if (isUpdate && facture.numero_facture) {
      await sheetsUpsert(sheetId, 'factures_fournisseurs', 'C', facture.numero_facture, row)
    } else {
      await sheetsAppend(sheetId, 'factures_fournisseurs!A:H', [row])
    }
  } catch (e) {
    console.error('[FournisseurS] Erreur sync Sheets:', e)
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const role   = (session.user as any).role
  let query = supabaseAdmin.from('factures_fournisseurs').select('*').order('created_at', { ascending: false })
  if (role !== 'admin') query = query.eq('user_id', userId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()
  const { data, error } = await supabaseAdmin
    .from('factures_fournisseurs').insert({ user_id: userId, ...body }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  syncFournisseurToSheet(userId, data, false)
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabaseAdmin
    .from('factures_fournisseurs').update(updates).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  syncFournisseurToSheet(userId, data, true)
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin
    .from('factures_fournisseurs').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
