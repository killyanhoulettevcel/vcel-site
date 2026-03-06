import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const role = (session.user as any).role
  if (role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Pour chaque client, on récupère ses stats
  const clientsAvecStats = await Promise.all((users || []).map(async (user) => {
    const [leads, factures, workflows, ca] = await Promise.all([
      supabaseAdmin.from('leads').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabaseAdmin.from('factures').select('montant_ttc, statut').eq('user_id', user.id),
      supabaseAdmin.from('workflows').select('id, actif, statut').eq('user_id', user.id),
      supabaseAdmin.from('ca_data').select('ca_ht').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    ])

    const impayees   = (factures.data || []).filter(f => f.statut !== 'payée').length
    const wfActifs   = (workflows.data || []).filter(w => w.actif).length
    const caDernier  = ca.data?.[0]?.ca_ht || 0

    return {
      id:          user.id,
      nom:         user.nom || '',
      email:       user.email || '',
      secteur:     user.secteur || '—',
      statut:      user.statut || 'actif',
      created_at:  user.created_at,
      stripe_customer_id: user.stripe_customer_id,
      leads:       leads.count || 0,
      factures_impayees: impayees,
      workflows_actifs:  wfActifs,
      ca_dernier:  caDernier,
    }
  }))

  return NextResponse.json(clientsAvecStats)
}
