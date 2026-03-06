import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Endpoint appelé par n8n chaque lundi pour récupérer les données du client
// Sécurisé par x-provision-secret
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISIONING_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

  const now = new Date()

  const [caRes, leadsRes, facturesRes, profilRes, objectifsRes] = await Promise.all([
    supabaseAdmin.from('ca_data').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabaseAdmin.from('leads').select('statut, score, created_at').eq('user_id', userId),
    supabaseAdmin.from('factures').select('montant_ttc, statut').eq('user_id', userId).neq('statut', 'payée'),
    supabaseAdmin.from('users').select('nom, email, secteur').eq('id', userId).single(),
    supabaseAdmin.from('objectifs').select('*').eq('user_id', userId).eq('actif', true),
  ])

  const ca        = caRes.data || []
  const leads     = leadsRes.data || []
  const factures  = facturesRes.data || []
  const profil    = profilRes.data
  const objectifs = objectifsRes.data || []

  // Stats calculées
  const dernierCA      = ca[0] || {}
  const avantCA        = ca[1] || {}
  const diffCA         = avantCA.ca_ht > 0
    ? Math.round((dernierCA.ca_ht - avantCA.ca_ht) / avantCA.ca_ht * 100)
    : 0

  const leadsSemaine   = leads.filter(l => {
    const d = new Date(l.created_at)
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
  })
  const leadsChauds    = leadsSemaine.filter(l => l.score === 'chaud').length
  const montantDu      = factures.reduce((s, f) => s + (f.montant_ttc || 0), 0)

  const objectifsTexte = objectifs.length > 0
    ? objectifs.map(o => `- ${o.label} : cible ${o.cible}${o.type === 'ca' ? '€' : o.type === 'conversion' ? '%' : ''}`).join('\n')
    : 'Aucun objectif défini'

  return NextResponse.json({
    client: {
      nom:    profil?.nom || profil?.email,
      email:  profil?.email,
      secteur: profil?.secteur,
    },
    stats: {
      ca_mois:        dernierCA.ca_ht || 0,
      charges_mois:   dernierCA.charges || 0,
      marge_mois:     dernierCA.marge || 0,
      diff_ca:        diffCA,
      leads_semaine:  leadsSemaine.length,
      leads_chauds:   leadsChauds,
      factures_dues:  factures.length,
      montant_du:     montantDu,
    },
    objectifs: objectifsTexte,
    prompt: `Tu es le coach business de ${profil?.nom || profil?.email}.

Voici les données de la semaine :
- CA dernier mois : ${dernierCA.ca_ht || 0}€ (${diffCA >= 0 ? '+' : ''}${diffCA}% vs mois précédent)
- Charges : ${dernierCA.charges || 0}€ | Marge : ${dernierCA.marge || 0}€
- Nouveaux leads cette semaine : ${leadsSemaine.length} (${leadsChauds} chauds)
- Factures impayées : ${factures.length} pour ${montantDu}€

Objectifs fixés :
${objectifsTexte}

Rédige un résumé hebdomadaire en HTML simple (h2, p, ul, strong). Ton chaleureux et motivant. Max 300 mots.`
  })
}
