// src/app/api/trial/users/route.ts
// Retourne les users en trial avec leur nombre de jours restants
// Utilisé par le workflow n8n de séquence email fidélisation

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  // Vérifier le secret de provision
  const secret = req.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISIONING_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()

  // Récupérer tous les users en trial avec trial_end dans le futur ou passé récent
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email, nom, plan, trial_end, created_at')
    .eq('statut', 'trial')
    .not('trial_end', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculer les jours écoulés depuis le début du trial pour chaque user
  const enriched = (users || []).map(user => {
    const trialEnd    = new Date(user.trial_end)
    const trialStart  = new Date(trialEnd.getTime() - 14 * 24 * 60 * 60 * 1000)
    const msElapsed   = now.getTime() - trialStart.getTime()
    const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24))
    const msRemaining = trialEnd.getTime() - now.getTime()
    const daysLeft    = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

    return {
      id:          user.id,
      email:       user.email,
      nom:         user.nom || user.email.split('@')[0],
      plan:        user.plan || 'starter',
      trial_end:   user.trial_end,
      days_elapsed: daysElapsed,
      days_left:    daysLeft,
    }
  })

  // Filtrer par jour pour le workflow n8n
  // Le workflow appellera cette route et filtrera par days_elapsed
  const day11 = enriched.filter(u => u.days_elapsed === 11)
  const day13 = enriched.filter(u => u.days_elapsed === 13)
  const day14 = enriched.filter(u => u.days_elapsed >= 14)

  return NextResponse.json({
    all:   enriched,
    day11,
    day13,
    day14,
    total: enriched.length,
    now:   now.toISOString(),
  })
}