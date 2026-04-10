// src/app/api/churn/users/route.ts
// Retourne les users inactifs depuis exactement 7 jours
// Utilisé par le workflow n8n de reconquête churn

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISIONING_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now     = new Date()
  const day7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const day8ago = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)

  // Users passés à inactif il y a exactement 7 jours (fenêtre de 24h)
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email, nom, plan, updated_at')
    .eq('statut', 'inactif')
    .gte('updated_at', day8ago.toISOString())
    .lte('updated_at', day7ago.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = (users || []).map(u => ({
    id:    u.id,
    email: u.email,
    nom:   u.nom || u.email.split('@')[0],
    plan:  u.plan || 'pro',
  }))

  return NextResponse.json({ users: enriched, total: enriched.length })
}