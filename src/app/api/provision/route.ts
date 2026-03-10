import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const notifications: any[] = []
  const now = new Date()

  // ── 1. Leads nouveaux non contactés ──────────────────────────────────────
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('id, nom, email, created_at')
    .eq('user_id', userId)
    .eq('statut', 'nouveau')
    .order('created_at', { ascending: false })
    .limit(5)

  for (const lead of leads || []) {
    notifications.push({
      id:      `lead-${lead.id}`,
      type:    'lead',
      titre:   'Nouveau lead',
      message: `${lead.nom || lead.email} vient de s'inscrire`,
      date:    lead.created_at,
      lu:      false,
      href:    '/dashboard/client/leads',
    })
  }

  // ── 2. Factures impayées ─────────────────────────────────────────────────
  const { data: factures } = await supabaseAdmin
    .from('factures')
    .select('id, numero_facture, montant_ttc, statut, created_at')
    .eq('user_id', userId)
    .in('statut', ['en attente', 'en retard'])
    .order('created_at', { ascending: false })
    .limit(3)

  for (const f of factures || []) {
    notifications.push({
      id:      `facture-${f.id}`,
      type:    f.statut === 'en retard' ? 'erreur' : 'warning',
      titre:   f.statut === 'en retard' ? 'Facture en retard' : 'Facture en attente',
      message: `${f.numero_facture} — ${(f.montant_ttc || 0).toLocaleString('fr-FR')}€`,
      date:    f.created_at,
      lu:      false,
      href:    '/dashboard/client/factures',
    })
  }

  // ── 3. Workflows en erreur ───────────────────────────────────────────────
  const { data: workflows } = await supabaseAdmin
    .from('workflows')
    .select('id, nom, erreur_message, updated_at')
    .eq('user_id', userId)
    .eq('statut', 'erreur')
    .limit(3)

  for (const w of workflows || []) {
    notifications.push({
      id:      `workflow-${w.id}`,
      type:    'erreur',
      titre:   'Workflow en erreur',
      message: `${w.nom}${w.erreur_message ? ' — ' + w.erreur_message : ''}`,
      date:    w.updated_at,
      lu:      false,
      href:    '/dashboard/client/workflows',
    })
  }

  // ── 4. DÉTECTION D'ANOMALIES ─────────────────────────────────────────────

  const { data: tousLeads } = await supabaseAdmin
    .from('leads')
    .select('id, created_at, statut, score')
    .eq('user_id', userId)

  const { data: caData } = await supabaseAdmin
    .from('ca_data')
    .select('ca_ht, charges, marge, mois, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3)

  // 4a. Aucun lead depuis 7 jours
  const il7jours = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const leadsRecents = (tousLeads || []).filter(l => new Date(l.created_at) > il7jours)
  if ((tousLeads || []).length > 0 && leadsRecents.length === 0) {
    notifications.push({
      id:      'anomalie-no-leads',
      type:    'warning',
      titre:   '⚠️ Aucun lead depuis 7 jours',
      message: 'Ton acquisition est au point mort — vérifie tes sources',
      date:    now.toISOString(),
      lu:      false,
      href:    '/dashboard/client/leads',
      anomalie: true,
    })
  }

  // 4b. Chute de CA > 30% vs mois précédent
  if (caData && caData.length >= 2) {
    const dernier   = caData[0]
    const precedent = caData[1]
    if (precedent.ca_ht > 0) {
      const chute = (precedent.ca_ht - dernier.ca_ht) / precedent.ca_ht * 100
      if (chute > 30) {
        notifications.push({
          id:      'anomalie-ca-chute',
          type:    'erreur',
          titre:   `📉 CA en chute de ${Math.round(chute)}%`,
          message: `${dernier.mois} : ${dernier.ca_ht}€ vs ${precedent.ca_ht}€ le mois dernier`,
          date:    now.toISOString(),
          lu:      false,
          href:    '/dashboard/client/finances',
          anomalie: true,
        })
      }
    }
  }

  // 4c. Taux de conversion faible (< 5% avec plus de 10 leads)
  const totalLeads     = (tousLeads || []).length
  const leadsConvertis = (tousLeads || []).filter(l => l.statut === 'converti').length
  if (totalLeads >= 10 && leadsConvertis / totalLeads < 0.05) {
    notifications.push({
      id:      'anomalie-conversion',
      type:    'warning',
      titre:   '📊 Taux de conversion faible',
      message: `${leadsConvertis}/${totalLeads} leads convertis (${Math.round(leadsConvertis / totalLeads * 100)}%)`,
      date:    now.toISOString(),
      lu:      false,
      href:    '/dashboard/client/leads',
      anomalie: true,
    })
  }

  // 4d. Marge négative ce mois
  if (caData && caData.length > 0 && caData[0].marge < 0) {
    notifications.push({
      id:      'anomalie-marge-negative',
      type:    'erreur',
      titre:   '🔴 Marge négative ce mois',
      message: `${caData[0].mois} : marge de ${caData[0].marge}€ — charges > CA`,
      date:    now.toISOString(),
      lu:      false,
      href:    '/dashboard/client/finances',
      anomalie: true,
    })
  }

  // 4e. Leads chauds non traités depuis 48h
  const il48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  const { data: leadsChaudsAnciens } = await supabaseAdmin
    .from('leads')
    .select('id, nom, email, created_at')
    .eq('user_id', userId)
    .eq('score', 'chaud')
    .eq('statut', 'nouveau')
    .lt('created_at', il48h.toISOString())
    .limit(3)

  for (const lead of leadsChaudsAnciens || []) {
    notifications.push({
      id:      `anomalie-lead-chaud-${lead.id}`,
      type:    'warning',
      titre:   '🔥 Lead chaud non contacté',
      message: `${lead.nom || lead.email} attend depuis plus de 48h`,
      date:    lead.created_at,
      lu:      false,
      href:    '/dashboard/client/leads',
      anomalie: true,
    })
  }

  // 4f. Objectifs en retard (< 50% à mi-mois)
  const jourDuMois = now.getDate()
  const joursTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const pctMois    = jourDuMois / joursTotal

  if (pctMois >= 0.5) {
    const { data: objectifs } = await supabaseAdmin
      .from('objectifs')
      .select('*')
      .eq('user_id', userId)
      .eq('actif', true)
      .eq('periode', 'mensuel')

    for (const obj of objectifs || []) {
      let actuel = 0
      if (obj.type === 'ca')         actuel = (caData?.[0]?.ca_ht || 0)
      if (obj.type === 'leads')      actuel = (tousLeads || []).filter((l: any) => {
        const d = new Date(l.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length
      if (obj.type === 'conversion') actuel = totalLeads > 0 ? Math.round(leadsConvertis / totalLeads * 100) : 0

      const pctObjectif = obj.cible > 0 ? actuel / obj.cible : 1
      if (pctObjectif < 0.5) {
        notifications.push({
          id:      `objectif-${obj.id}`,
          type:    'warning',
          titre:   `🎯 Objectif en retard : ${obj.label}`,
          message: `${actuel}${obj.type === 'ca' ? '€' : obj.type === 'conversion' ? '%' : ''} / ${obj.cible}${obj.type === 'ca' ? '€' : obj.type === 'conversion' ? '%' : ''} — ${Math.round(pctObjectif * 100)}% atteint`,
          date:    now.toISOString(),
          lu:      false,
          href:    '/dashboard/client/objectifs',
          anomalie: true,
        })
      }
    }
  }

  // ── Trier : anomalies en premier, puis par date ──────────────────────────
  notifications.sort((a, b) => {
    if (a.anomalie && !b.anomalie) return -1
    if (!a.anomalie && b.anomalie) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return NextResponse.json(notifications.slice(0, 15))
}