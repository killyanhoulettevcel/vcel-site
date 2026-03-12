// src/app/api/factures/route.ts
// Colonnes onglet "factures" :
// invoice_id, invoice_number, client_email, montant_ht, montant_ttc, date, statut, invoice_pdf, hosted_invoice_url
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { sheetsUpsert, getUserSheetId } from '@/lib/googleSheets'

async function syncFactureToSheet(userId: string, facture: any) {
  try {
    const sheetId = await getUserSheetId(supabaseAdmin, userId)
    if (!sheetId) return
    const row = [
      facture.invoice_id         || facture.id || '',
      facture.invoice_number     || '',
      facture.client_email       || '',
      facture.montant_ht         || 0,
      facture.montant_ttc        || 0,
      facture.date               || new Date().toISOString().split('T')[0],
      facture.statut             || 'en attente',
      facture.invoice_pdf        || '',
      facture.hosted_invoice_url || '',
    ]
    await sheetsUpsert(sheetId, 'factures', 'A', facture.invoice_id || facture.id, row)
  } catch (e) {
    console.error('[Factures] Erreur sync Sheets:', e)
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const role   = (session.user as any).role
  let query = supabaseAdmin.from('factures').select('*').order('created_at', { ascending: false })
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
    .from('factures').insert({ user_id: userId, ...body }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  syncFactureToSheet(userId, data)
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabaseAdmin
    .from('factures').update(updates).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  syncFactureToSheet(userId, data)
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin
    .from('factures').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
