// src/app/api/nps/route.ts
// Reçoit les réponses NPS depuis l'email et les stocke en Supabase

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — retourne les users actifs depuis exactement 30 jours (pour n8n)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISIONING_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now     = new Date()
  const day30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const day31ago = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email, nom, plan, created_at')
    .eq('statut', 'actif')
    .gte('created_at', day31ago.toISOString())
    .lte('created_at', day30ago.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = (users || []).map(u => ({
    id:    u.id,
    email: u.email,
    nom:   u.nom || u.email.split('@')[0],
    plan:  u.plan || 'pro',
  }))

  return NextResponse.json({ users: enriched, total: enriched.length })
}

// POST — reçoit la note NPS depuis le lien email cliqué
export async function POST(req: NextRequest) {
  const { userId, email, note } = await req.json()

  if (!note || note < 1 || note > 5) {
    return NextResponse.json({ error: 'Note invalide (1-5)' }, { status: 400 })
  }

  // Stocker la réponse NPS
  const { error } = await supabaseAdmin
    .from('nps_responses')
    .upsert({
      user_id:    userId || null,
      email:      email,
      note:       note,
      created_at: new Date().toISOString(),
    }, { onConflict: 'email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si note >= 4 → rediriger vers page de remerciement avec CTA avis Google/Trustpilot
  const redirect = note >= 4
    ? `${process.env.NEXTAUTH_URL}/nps/merci?note=${note}&positive=1`
    : `${process.env.NEXTAUTH_URL}/nps/merci?note=${note}`

  return NextResponse.json({ success: true, redirect, isPromoter: note >= 4 })
}