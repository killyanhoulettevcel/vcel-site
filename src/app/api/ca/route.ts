// src/app/api/ca/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { sheetsUpsert, getUserSheetId } from '@/lib/googleSheets'

async function syncToSheet(userId: string, row: any) {
  try {
    const sheetId = await getUserSheetId(supabaseAdmin, userId)
    if (!sheetId) return
    const caHt    = parseFloat(row.ca_ht)   || 0
    const charges = parseFloat(row.charges) || 0
    const marge   = caHt - charges
    const taux    = caHt > 0 ? Math.round(charges / caHt * 100) : 0
    const tva     = Math.round(caHt * 0.2)
    await sheetsUpsert(sheetId, 'dashboard', 'A', row.mois, [
      row.mois, caHt, charges, marge, taux, tva, 0, tva, caHt,
      row.nb_factures || 0, 0,
      Math.ceil(new Date().getMonth() / 3),
    ])
  } catch (e) {
    console.error('[CA] Erreur sync Sheets:', e)
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const role   = (session.user as any).role
  let query = supabaseAdmin.from('ca_data').select('*').order('created_at', { ascending: true })
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
    .from('ca_data')
    .insert({
      user_id:     userId,
      mois:        body.mois,
      ca_ht:       parseFloat(body.ca) || 0,
      charges:     parseFloat(body.charges) || 0,
      nb_factures: parseInt(body.nb_factures) || 0,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  syncToSheet(userId, data)
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...updates } = body
  if (updates.ca !== undefined) {
    updates.ca_ht = parseFloat(updates.ca) || 0
    delete updates.ca
  }
  if (updates.charges !== undefined) {
    updates.charges = parseFloat(updates.charges) || 0
  }
  const { data, error } = await supabaseAdmin
    .from('ca_data')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  syncToSheet(userId, data)
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin
    .from('ca_data').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
