// src/app/api/leads/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { sheetsAppend, sheetsUpsert, getUserSheetId } from '@/lib/googleSheets'
import {
  sendEmailFromUser,
  templateAlertLeadChaud,
} from '@/lib/googleGmail'

async function syncLeadToSheet(userId: string, lead: any, isUpdate = false) {
  try {
    const sheetId = await getUserSheetId(supabaseAdmin, userId)
    if (!sheetId) return
    const row = [
      lead.date       || new Date().toISOString().split('T')[0],
      lead.nom        || '',
      lead.email      || '',
      lead.telephone  || '',
      lead.entreprise || '',
      lead.secteur    || '',
      lead.message    || '',
      lead.score      || '',
      lead.statut     || 'nouveau',
      lead.source     || '',
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

async function logActivite(userId: string, leadId: string, type: string, contenu: string, meta?: any) {
  try {
    await supabaseAdmin.from('lead_activites').insert({
      user_id: userId, lead_id: leadId, type, contenu, meta: meta || null,
    })
  } catch {} // Silencieux si la table n'existe pas encore
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

  // ── Détection de doublon ─────────────────────────────────────────────────
  if (body.email) {
    const { data: existing } = await supabaseAdmin
      .from('leads')
      .select('id, nom, statut, score, created_at')
      .eq('user_id', userId)
      .ilike('email', body.email.trim())
      .limit(1)

    if (existing?.length) {
      const doublon = existing[0]
      // Si force=true dans le body, on crée quand même
      if (!body.force) {
        return NextResponse.json({
          doublon: true,
          lead: doublon,
          message: `Un lead avec cet email existe déjà (${doublon.nom}, statut : ${doublon.statut})`,
        }, { status: 409 })
      }
    }
  }

  // Champs de base — toujours présents
  const payload: any = {
    user_id:    userId,
    nom:        body.nom,
    email:      body.email,
    telephone:  body.telephone  || '',
    entreprise: body.entreprise || '',
    secteur:    body.secteur    || '',
    message:    body.message    || '',
    score:      body.score      || 'tiède',
    statut:     body.statut     || 'nouveau',
    source:     body.source     || 'Manuel',
    date:       body.date       || new Date().toISOString().split('T')[0],
  }

  // Champs optionnels (nouvelles colonnes) — ajoutés seulement si fournis
  if (body.notes          !== undefined) payload.notes          = body.notes || ''
  if (body.valeur_estimee !== undefined) payload.valeur_estimee = parseFloat(body.valeur_estimee) || 0
  if (body.probabilite    !== undefined) payload.probabilite    = parseInt(body.probabilite)    || 0

  const { data, error } = await supabaseAdmin
    .from('leads').insert(payload).select().single()

  if (error) {
    console.error('[Leads POST]', error.message, error.details)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logActivite(userId, data.id, 'creation', `Lead créé depuis ${data.source || 'Manuel'}`)
  syncLeadToSheet(userId, data, false)
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id
  const body   = await req.json()
  const { id, ...rawUpdates } = body

  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  // Nettoyer les champs numériques
  const updates: any = { ...rawUpdates }
  if (updates.valeur_estimee !== undefined) updates.valeur_estimee = parseFloat(updates.valeur_estimee) || 0
  if (updates.probabilite    !== undefined) updates.probabilite    = parseInt(updates.probabilite)    || 0

  // Supprimer les champs qui pourraient ne pas exister en base
  // (sera ignoré si la colonne n'existe pas — Supabase renvoie une erreur sinon)
  const safeUpdates: any = {}
  const alwaysAllowed = ['statut', 'score', 'nom', 'email', 'telephone', 'entreprise',
    'secteur', 'message', 'source', 'date']
  const optionalFields = ['notes', 'valeur_estimee', 'probabilite']

  for (const key of alwaysAllowed) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key]
  }

  // Récupérer l'ancien statut/score
  const { data: ancien } = await supabaseAdmin
    .from('leads').select('statut, score').eq('id', id).eq('user_id', userId).single()

  // Essayer d'abord avec tous les champs
  for (const key of optionalFields) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key]
  }

  let { data, error } = await supabaseAdmin
    .from('leads').update(safeUpdates).eq('id', id).eq('user_id', userId).select().single()

  // Si erreur sur les champs optionnels, réessayer sans eux
  if (error && (error.message.includes('notes') || error.message.includes('valeur_estimee') || error.message.includes('probabilite'))) {
    console.warn('[Leads PUT] Colonnes optionnelles manquantes, retry sans:', error.message)
    const fallback: any = {}
    for (const key of alwaysAllowed) {
      if (safeUpdates[key] !== undefined) fallback[key] = safeUpdates[key]
    }
    const retry = await supabaseAdmin
      .from('leads').update(fallback).eq('id', id).eq('user_id', userId).select().single()
    data  = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[Leads PUT]', error.message, error.details)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Logs activité
  if (ancien && updates.statut && updates.statut !== ancien.statut) {
    await logActivite(userId, id, 'statut',
      `Statut changé : ${ancien.statut} → ${updates.statut}`,
      { ancien: ancien.statut, nouveau: updates.statut }
    )
  }
  if (ancien && updates.score && updates.score !== ancien.score) {
    await logActivite(userId, id, 'score',
      `Score changé : ${ancien.score} → ${updates.score}`,
      { ancien: ancien.score, nouveau: updates.score }
    )

    // 🔥 Alerte email si le lead passe à "chaud"
    if (updates.score === 'chaud') {
      try {
        const { data: userInfo } = await supabaseAdmin
          .from('users')
          .select('nom, email, google_refresh_token, preferences')
          .eq('id', userId).single()

        // Envoyer seulement si Google connecté et notifications activées
        if (userInfo?.google_refresh_token && userInfo?.preferences?.notifications_email !== false) {
          const tpl = templateAlertLeadChaud({
            nomLead:       data.nom,
            entreprise:    data.entreprise || undefined,
            email:         data.email,
            telephone:     data.telephone || undefined,
            source:        data.source || undefined,
            scoreIaRaison: data.score_ia_raison || undefined,
            scoreIaAction: data.score_ia_action || undefined,
            nomExpediteur: userInfo.nom || 'VCEL',
            dashboardUrl:  `${process.env.NEXTAUTH_URL}/dashboard/client/leads`,
          })
          await sendEmailFromUser(supabaseAdmin, userId, {
            to: userInfo.email, subject: tpl.subject, html: tpl.html,
          })
          await supabaseAdmin.from('emails_log').insert({
            user_id: userId, type: 'alerte_lead_chaud',
            destinataire: userInfo.email, subject: tpl.subject,
          })
        }
      } catch (e) {
        console.error('[Alerte lead chaud]', e)
      }
    }
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