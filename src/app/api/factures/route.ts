// src/app/api/factures/route.ts
// Colonnes onglet "factures" :
// invoice_id, invoice_number, client_email, montant_ht, montant_ttc, date, statut, invoice_pdf, hosted_invoice_url
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { sheetsUpsert, getUserSheetId } from '@/lib/googleSheets'

// Met à jour ca_data quand une facture/avoir est créé ou modifié avec statut payée
async function syncCaData(userId: string, facture: any, oldFacture?: any) {
  try {
    // Seulement si c'est une facture ou un avoir (pas proforma/acompte)
    const type = facture.type_facture || 'facture'
    if (type !== 'facture' && type !== 'avoir') return

    // Seulement si statut payée
    if (facture.statut !== 'payée') {
      // Si l'ancienne version était payée et la nouvelle ne l'est plus → annuler l'impact
      if (oldFacture?.statut === 'payée') {
        const mois = (oldFacture.date_facture || oldFacture.date || '').slice(0, 7)
        if (!mois) return
        const { data: existing } = await supabaseAdmin
          .from('ca_data').select('id, ca_ht, nb_factures').eq('user_id', userId).eq('mois', mois).single()
        if (existing) {
          const montant = parseFloat(oldFacture.montant_ht) || 0
          await supabaseAdmin.from('ca_data').update({
            ca_ht:       Math.max(0, (existing.ca_ht || 0) - montant),
            nb_factures: Math.max(0, (existing.nb_factures || 0) - 1),
          }).eq('id', existing.id)
        }
      }
      return
    }

    const mois     = (facture.date_facture || facture.date || '').slice(0, 7)
    if (!mois) return

    const montant  = parseFloat(facture.montant_ht) || 0 // négatif pour avoir
    const delta    = oldFacture?.statut === 'payée'
      ? montant - (parseFloat(oldFacture.montant_ht) || 0) // modification
      : montant // nouvelle entrée

    const { data: existing } = await supabaseAdmin
      .from('ca_data').select('id, ca_ht, nb_factures').eq('user_id', userId).eq('mois', mois).single()

    if (existing) {
      await supabaseAdmin.from('ca_data').update({
        ca_ht:       (existing.ca_ht || 0) + delta,
        nb_factures: type === 'facture'
          ? (existing.nb_factures || 0) + (oldFacture?.statut === 'payée' ? 0 : 1)
          : existing.nb_factures, // avoir ne compte pas comme facture supplémentaire
      }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('ca_data').insert({
        user_id:     userId,
        mois,
        ca_ht:       montant,
        charges:     0,
        nb_factures: type === 'facture' ? 1 : 0,
      })
    }
    console.log(`[Factures] ca_data mis à jour — ${userId} — ${mois} ${delta > 0 ? '+' : ''}${delta}€ (${type})`)
  } catch (e: any) {
    console.error('[Factures] Erreur sync ca_data:', e.message)
  }
}

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
  syncCaData(userId, data)
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...updates } = body
  // Récupérer l'ancienne version pour calculer le delta ca_data
  const { data: oldData } = await supabaseAdmin
    .from('factures').select('montant_ht, statut, type_facture, date_facture').eq('id', id).single()

  const { data, error } = await supabaseAdmin
    .from('factures').update(updates).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  syncFactureToSheet(userId, data)
  syncCaData(userId, data, oldData || undefined)
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