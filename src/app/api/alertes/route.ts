// src/app/api/alertes/route.ts
// Alertes proactives IA — analyse toutes les données du client et génère des insights actionnables
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const now    = new Date()
  const apiKey = process.env.OPENAI_API_KEY

  // ── 1. Collecte de toutes les données en parallèle ───────────────────────
  const [
    leadsRes, facturesRes, caRes, workflowsRes,
    objectifsRes, produitsRes, ventesRes, profilRes,
  ] = await Promise.all([
    supabaseAdmin.from('leads').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabaseAdmin.from('factures').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabaseAdmin.from('ca_data').select('*').eq('user_id', userId).order('mois', { ascending: false }).limit(6),
    supabaseAdmin.from('workflows').select('*').eq('user_id', userId),
    supabaseAdmin.from('objectifs').select('*').eq('user_id', userId),
    supabaseAdmin.from('produits').select('*').eq('user_id', userId).eq('actif', true),
    supabaseAdmin.from('ventes').select('*').eq('user_id', userId).order('date_vente', { ascending: false }).limit(50),
    supabaseAdmin.from('users').select('nom, secteur, statut_juridique, preferences').eq('id', userId).single(),
  ])

  const leads     = leadsRes.data     || []
  const factures  = facturesRes.data  || []
  const caData    = caRes.data        || []
  const workflows = workflowsRes.data || []
  const objectifs = objectifsRes.data || []
  const produits  = produitsRes.data  || []
  const ventes    = ventesRes.data    || []
  const profil    = profilRes.data

  // ── 2. Calculs analytiques ─────────────────────────────────────────────────
  const moisActuel   = now.toISOString().slice(0, 7)
  const il7j         = new Date(now.getTime() - 7  * 86400000)
  const il14j        = new Date(now.getTime() - 14 * 86400000)
  const il48h        = new Date(now.getTime() - 48 * 3600000)
  const jourDuMois   = now.getDate()
  const joursTotal   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const pctMois      = jourDuMois / joursTotal

  // Leads
  const leadsChauds         = leads.filter(l => l.score === 'chaud')
  const leadsNonContactes   = leadsChauds.filter(l => l.statut === 'nouveau' || l.statut === 'contacté')
  const leadsChauds48h      = leadsNonContactes.filter(l => new Date(l.created_at) < il48h)
  const leadsChauds7j       = leadsNonContactes.filter(l => new Date(l.updated_at || l.created_at) < il7j)
  const leadsRecents7j      = leads.filter(l => new Date(l.created_at) > il7j)
  const leadsConvertis      = leads.filter(l => l.statut === 'converti')
  const tauxConversion      = leads.length > 0 ? Math.round(leadsConvertis.length / leads.length * 100) : 0
  const leadsCeMois         = leads.filter(l => l.created_at?.startsWith(moisActuel))

  // Factures
  const facturesImpayees    = factures.filter(f => f.statut !== 'payée')
  const facturesEnRetard    = factures.filter(f => f.statut === 'en retard')
  const montantImpaye       = facturesImpayees.reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const montantEnRetard     = facturesEnRetard.reduce((s, f) => s + (f.montant_ttc || 0), 0)

  // CA
  const dernierCA    = caData[0]
  const avantDernier = caData[1]
  const evolutionCA  = dernierCA && avantDernier && avantDernier.ca_ht > 0
    ? Math.round(((dernierCA.ca_ht - avantDernier.ca_ht) / avantDernier.ca_ht) * 100) : null
  const caMoyen      = caData.length > 0 ? caData.reduce((s, d) => s + (d.ca_ht || 0), 0) / caData.length : 0
  const caCeMois     = dernierCA?.mois === moisActuel ? dernierCA.ca_ht : 0

  // Objectifs
  const objectifsCeMois = objectifs.filter(o => o.periode === 'mensuel')
  const objectifsEnRetard = objectifsCeMois.filter(o => {
    if (pctMois < 0.4) return false
    const actuel = o.type === 'ca' ? (caCeMois || 0)
      : o.type === 'leads' ? leadsCeMois.length
      : o.type === 'conversion' ? tauxConversion : 0
    return o.valeur_cible > 0 && (actuel / o.valeur_cible) < pctMois * 0.7
  })

  // Workflows
  const wfEnErreur   = workflows.filter(w => w.statut === 'erreur')
  const wfInactifs   = workflows.filter(w => w.actif && w.statut !== 'ok')

  // Produits / ventes
  const ventesCeMois = ventes.filter(v => v.date_vente?.startsWith(moisActuel))
  const caVentes     = ventesCeMois.reduce((s, v) => s + (v.total || 0), 0)

  // ── 3. Génération des alertes déterministes ────────────────────────────────
  type Priorite = 'critique' | 'important' | 'info'
  type Categorie = 'leads' | 'finances' | 'objectifs' | 'workflows' | 'croissance' | 'ia'

  interface Alerte {
    id: string
    priorite: Priorite
    categorie: Categorie
    titre: string
    message: string
    valeur?: string
    action: string
    href: string
    ia?: boolean
    ts: string
  }

  const alertes: Alerte[] = []

  // ── CRITIQUE ──────────────────────────────────────────────────────────────

  if (facturesEnRetard.length > 0) {
    alertes.push({
      id: 'factures-retard', priorite: 'critique', categorie: 'finances',
      titre: `${facturesEnRetard.length} facture${facturesEnRetard.length > 1 ? 's' : ''} en retard`,
      message: `${montantEnRetard.toLocaleString('fr-FR')} € non encaissés — risque de trésorerie immédiat.`,
      valeur: `${montantEnRetard.toLocaleString('fr-FR')} €`,
      action: 'Voir les factures', href: '/dashboard/client/factures',
      ts: now.toISOString(),
    })
  }

  if (leadsChauds48h.length > 0) {
    alertes.push({
      id: 'leads-chauds-48h', priorite: 'critique', categorie: 'leads',
      titre: `${leadsChauds48h.length} lead${leadsChauds48h.length > 1 ? 's' : ''} chaud${leadsChauds48h.length > 1 ? 's' : ''} sans réponse depuis 48h`,
      message: `${leadsChauds48h.map(l => l.nom || l.email).slice(0, 3).join(', ')}${leadsChauds48h.length > 3 ? `… et ${leadsChauds48h.length - 3} autres` : ''} — chaque heure compte sur un lead chaud.`,
      valeur: `${leadsChauds48h.length} leads`,
      action: 'Relancer maintenant', href: '/dashboard/client/leads',
      ts: now.toISOString(),
    })
  }

  if (wfEnErreur.length > 0) {
    alertes.push({
      id: 'workflows-erreur', priorite: 'critique', categorie: 'workflows',
      titre: `${wfEnErreur.length} workflow${wfEnErreur.length > 1 ? 's' : ''} en erreur`,
      message: `${wfEnErreur.map(w => w.nom).slice(0, 2).join(', ')} — tes automatisations sont à l'arrêt.`,
      valeur: `${wfEnErreur.length} en panne`,
      action: 'Diagnostiquer', href: '/dashboard/client/workflows',
      ts: now.toISOString(),
    })
  }

  if (dernierCA?.marge < 0) {
    alertes.push({
      id: 'marge-negative', priorite: 'critique', categorie: 'finances',
      titre: 'Marge négative ce mois',
      message: `${dernierCA.mois} : ${Math.abs(dernierCA.marge).toLocaleString('fr-FR')} € de déficit. Tes charges dépassent ton CA.`,
      valeur: `${dernierCA.marge.toLocaleString('fr-FR')} €`,
      action: 'Analyser les finances', href: '/dashboard/client/finances',
      ts: now.toISOString(),
    })
  }

  // ── IMPORTANT ─────────────────────────────────────────────────────────────

  if (facturesImpayees.length > 0 && facturesEnRetard.length === 0) {
    alertes.push({
      id: 'factures-impayees', priorite: 'important', categorie: 'finances',
      titre: `${facturesImpayees.length} facture${facturesImpayees.length > 1 ? 's' : ''} en attente de paiement`,
      message: `${montantImpaye.toLocaleString('fr-FR')} € à encaisser.`,
      valeur: `${montantImpaye.toLocaleString('fr-FR')} €`,
      action: 'Voir les factures', href: '/dashboard/client/factures',
      ts: now.toISOString(),
    })
  }

  if (leadsChauds7j.length > 0 && leadsChauds48h.length === 0) {
    alertes.push({
      id: 'leads-chauds-7j', priorite: 'important', categorie: 'leads',
      titre: `${leadsChauds7j.length} lead${leadsChauds7j.length > 1 ? 's' : ''} chaud${leadsChauds7j.length > 1 ? 's' : ''} à relancer`,
      message: `Pas de contact depuis plus de 7 jours. Ils risquent de refroidir.`,
      valeur: `${leadsChauds7j.length} leads`,
      action: 'Gérer les leads', href: '/dashboard/client/leads',
      ts: now.toISOString(),
    })
  }

  if (evolutionCA !== null && evolutionCA < -20) {
    alertes.push({
      id: 'ca-chute', priorite: 'important', categorie: 'finances',
      titre: `CA en baisse de ${Math.abs(evolutionCA)}% ce mois`,
      message: `${dernierCA?.ca_ht?.toLocaleString('fr-FR')} € vs ${avantDernier?.ca_ht?.toLocaleString('fr-FR')} € le mois précédent.`,
      valeur: `${evolutionCA > 0 ? '+' : ''}${evolutionCA}%`,
      action: 'Voir les finances', href: '/dashboard/client/finances',
      ts: now.toISOString(),
    })
  }

  if (objectifsEnRetard.length > 0) {
    objectifsEnRetard.forEach(o => {
      const actuel = o.type === 'ca' ? caCeMois : o.type === 'leads' ? leadsCeMois.length : tauxConversion
      const pct = o.valeur_cible > 0 ? Math.round(actuel / o.valeur_cible * 100) : 0
      alertes.push({
        id: `objectif-${o.id}`, priorite: 'important', categorie: 'objectifs',
        titre: `Objectif en retard : ${o.titre}`,
        message: `${pct}% atteint à mi-parcours (${actuel.toLocaleString('fr-FR')} / ${o.valeur_cible.toLocaleString('fr-FR')} ${o.unite || ''}).`,
        valeur: `${pct}%`,
        action: 'Voir les objectifs', href: '/dashboard/client/objectifs',
        ts: now.toISOString(),
      })
    })
  }

  if (leadsRecents7j.length === 0 && leads.length > 5) {
    alertes.push({
      id: 'acquisition-stop', priorite: 'important', categorie: 'leads',
      titre: 'Aucun nouveau lead cette semaine',
      message: 'Ton acquisition est au ralenti. Vérifie tes sources (formulaires, réseaux sociaux, publicités).',
      action: 'Voir les leads', href: '/dashboard/client/leads',
      ts: now.toISOString(),
    })
  }

  if (wfInactifs.length > 0 && wfEnErreur.length === 0) {
    alertes.push({
      id: 'workflows-inactifs', priorite: 'important', categorie: 'workflows',
      titre: `${wfInactifs.length} workflow${wfInactifs.length > 1 ? 's' : ''} inactif${wfInactifs.length > 1 ? 's' : ''}`,
      message: `${wfInactifs.map(w => w.nom).slice(0, 2).join(', ')} — des automatisations qui pourraient te faire gagner du temps.`,
      action: 'Activer', href: '/dashboard/client/workflows',
      ts: now.toISOString(),
    })
  }

  // ── INFO (opportunités) ────────────────────────────────────────────────────

  if (evolutionCA !== null && evolutionCA > 20) {
    alertes.push({
      id: 'ca-hausse', priorite: 'info', categorie: 'croissance',
      titre: `CA en hausse de +${evolutionCA}% 🎉`,
      message: `Belle progression ! ${dernierCA?.ca_ht?.toLocaleString('fr-FR')} € ce mois.`,
      valeur: `+${evolutionCA}%`,
      action: 'Voir les finances', href: '/dashboard/client/finances',
      ts: now.toISOString(),
    })
  }

  if (tauxConversion > 20 && leads.length >= 10) {
    alertes.push({
      id: 'conversion-top', priorite: 'info', categorie: 'croissance',
      titre: `Taux de conversion excellent : ${tauxConversion}%`,
      message: `${leadsConvertis.length} clients sur ${leads.length} leads. Ton offre parle bien à ta cible.`,
      valeur: `${tauxConversion}%`,
      action: 'Voir les analytics', href: '/dashboard/client/leads/analytics',
      ts: now.toISOString(),
    })
  }

  if (leadsNonContactes.length > 0 && leadsChauds7j.length === 0 && leadsChauds48h.length === 0) {
    alertes.push({
      id: 'leads-pipeline', priorite: 'info', categorie: 'leads',
      titre: `${leadsNonContactes.length} lead${leadsNonContactes.length > 1 ? 's' : ''} chaud${leadsNonContactes.length > 1 ? 's' : ''} dans le pipeline`,
      message: 'Ils sont actifs et récents — bon moment pour avancer.',
      valeur: `${leadsNonContactes.length} leads`,
      action: 'Voir les leads', href: '/dashboard/client/leads',
      ts: now.toISOString(),
    })
  }

  // ── 4. Insight IA (optionnel) ──────────────────────────────────────────────
  let insightIA: string | null = null

  if (apiKey && caData.length >= 2 && leads.length >= 3) {
    try {
      const contexte = `
Business : ${profil?.secteur || 'indépendant'} — ${profil?.statut_juridique || 'statut inconnu'}
CA ce mois : ${(caCeMois || 0).toLocaleString('fr-FR')} € (moy. ${Math.round(caMoyen).toLocaleString('fr-FR')} €/mois)
Évolution CA : ${evolutionCA !== null ? `${evolutionCA > 0 ? '+' : ''}${evolutionCA}%` : 'N/A'}
Leads total : ${leads.length} — convertis : ${leadsConvertis.length} (${tauxConversion}%)
Leads chauds non traités : ${leadsNonContactes.length}
Factures impayées : ${facturesImpayees.length} (${montantImpaye.toLocaleString('fr-FR')} €)
Objectifs en retard : ${objectifsEnRetard.length}
Workflows actifs / en erreur : ${workflows.filter(w => w.actif).length} / ${wfEnErreur.length}
`.trim()

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 150,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: `Tu es un conseiller business pour indépendants. En 2-3 phrases max, donne un insight stratégique percutant basé sur ces données — pas de généralités, uniquement des observations concrètes sur les chiffres fournis. Identifie LA priorité numéro 1 et pourquoi. Parle directement, sans intro ni formule de politesse.\n\n${contexte}`,
          }],
        }),
      })
      const d = await res.json()
      insightIA = d.choices?.[0]?.message?.content?.trim() || null
    } catch {}
  }

  // ── 5. Tri final ──────────────────────────────────────────────────────────
  const ordre: Record<Priorite, number> = { critique: 0, important: 1, info: 2 }
  alertes.sort((a, b) => ordre[a.priorite] - ordre[b.priorite])

  return NextResponse.json({
    alertes,
    insightIA,
    stats: {
      critique:  alertes.filter(a => a.priorite === 'critique').length,
      important: alertes.filter(a => a.priorite === 'important').length,
      info:      alertes.filter(a => a.priorite === 'info').length,
      total:     alertes.length,
    },
    generatedAt: now.toISOString(),
  })
}