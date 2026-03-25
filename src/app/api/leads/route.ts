// src/app/api/leads/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { sheetsAppend, sheetsUpsert, getUserSheetId } from '@/lib/googleSheets'

async function syncLeadToSheet(userId: string, lead: any, isUpdate = false) {
  try {
    const sheetId = await getUserSheetId(supabaseAdmin, userId)
    if (!sheetId) return
    const row = [
      lead.date        || new Date().toISOString().split('T')[0],
      lead.nom         || '',
      lead.email       || '',
      lead.telephone   || '',
      lead.entreprise  || '',
      lead.secteur     || '',
      lead.message     || '',
      lead.score       || '',
      lead.statut      || 'nouveau',
      lead.source      || '',
    ]
    if (isUpdate && lead.email) {
      await sheetsUpsert(sheetId, 'CRM_Leads', 'C', lead.email, row)
    } else {
      await sheetsAppend(sheetId, 'CRM_Leads!A:J', [row])
    }
  } catch (e) {
    console.error('[Leads] Erreur sync Sheets:', e)
  }
}

// Loguer automatiquement une activité lors d'un changement de statut
async function logActivite(userId: string, leadId: string, type: string, contenu: string, meta?: any) {
  try {
    await supabaseAdmin.from('lead_activites').insert({
      user_id: userId,
      lead_id: leadId,
      type,
      contenu,
      meta: meta || null,
    })
  } catch {}
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const role   = (session.user as any).role
  let query = supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false })
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
    .from('leads')
    .insert({
      user_id:          userId,
      nom:              body.nom,
      email:            body.email,
      telephone:        body.telephone || '',
      entreprise:       body.entreprise || '',
      secteur:          body.secteur || '',
      message:          body.message || '',
      notes:            body.notes || '',
      score:            body.score || 'tiède',
      statut:           body.statut || 'nouveau',
      source:           body.source || 'Manuel',
      valeur_estimee:   parseFloat(body.valeur_estimee) || 0,
      probabilite:      parseInt(body.probabilite) || 0,
      date:             body.date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log création
  await logActivite(userId, data.id, 'creation', `Lead créé depuis ${data.source || 'Manuel'}`)
  syncLeadToSheet(userId, data, false)

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...updates } = body

  // Parser les champs numériques
  if (updates.valeur_estimee !== undefined) updates.valeur_estimee = parseFloat(updates.valeur_estimee) || 0
  if (updates.probabilite    !== undefined) updates.probabilite    = parseInt(updates.probabilite) || 0
  updates.updated_at = new Date().toISOString()

  // Récupérer l'ancien statut pour détecter le changement
  const { data: ancien } = await supabaseAdmin
    .from('leads').select('statut, score').eq('id', id).eq('user_id', userId).single()

  const { data, error } = await supabaseAdmin
    .from('leads').update(updates).eq('id', id).eq('user_id', userId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log automatique si changement de statut
  if (ancien && updates.statut && updates.statut !== ancien.statut) {
    await logActivite(userId, id, 'statut',
      `Statut changé : ${ancien.statut} → ${updates.statut}`,
      { ancien: ancien.statut, nouveau: updates.statut }
    )
  }

  // Log si changement de score
  if (ancien && updates.score && updates.score !== ancien.score) {
    await logActivite(userId, id, 'score',
      `Score changé : ${ancien.score} → ${updates.score}`,
      { ancien: ancien.score, nouveau: updates.score }
    )
  }

  syncLeadToSheet(userId, data, true)
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin
    .from('leads').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}