import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const role   = (session.user as any).role
  const notifications: any[] = []
  const now = new Date()

  // ══════════════════════════════════════════════════════
  // NOTIFS ADMIN — workflows en panne chez les clients
  // ══════════════════════════════════════════════════════
  if (role === 'admin') {
    const { data: wfEnErreur } = await supabaseAdmin
      .from('workflows')
      .select('id, nom, erreur_message, updated_at, user_id, users!inner(nom, email)')
      .eq('statut', 'erreur')
      .order('updated_at', { ascending: false })
      .limit(10)

    for (const w of wfEnErreur || []) {
      const client = (w as any).users
      notifications.push({
        id:      `admin-wf-erreur-${w.id}`,
        type:    'erreur',
        titre:   `Workflow en panne — ${(client?.nom || client?.email || 'Client').split(' ')[0]}`,
        message: `${w.nom.length > 30 ? w.nom.slice(0, 30) + '…' : w.nom}${w.erreur_message ? ' · ' + w.erreur_message.slice(0, 40) : ''}`,
        date:    w.updated_at,
        lu:      false,
        href:    '/dashboard/admin',
      })
    }

    // Workflows inactifs depuis > 7 jours alors qu'ils devraient tourner
    const il7jours = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const { data: wfInactifs } = await supabaseAdmin
      .from('workflows')
      .select('id, nom, derniere_execution, updated_at, user_id, users!inner(nom, email)')
      .eq('actif', true)
      .or(`derniere_execution.lt.${il7jours.toISOString()},derniere_execution.is.null`)
      .order('updated_at', { ascending: false })
      .limit(5)

    for (const w of wfInactifs || []) {
      const client = (w as any).users
      notifications.push({
        id:      `admin-wf-inactif-${w.id}`,
        type:    'warning',
        titre:   `Workflow inactif — ${(client?.nom || client?.email || 'Client').split(' ')[0]}`,
        message: `${w.nom.length > 30 ? w.nom.slice(0, 30) + '…' : w.nom} · +7 jours sans exécution`,
        date:    w.updated_at || now.toISOString(),
        lu:      false,
        href:    '/dashboard/admin',
      })
    }

    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return NextResponse.json(notifications.slice(0, 15))
  }

  // ══════════════════════════════════════════════════════
  // NOTIFS CLIENT (code existant)
  // ══════════════════════════════════════════════════════

  // 1. Leads nouveaux non contactés
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

  // 2. Factures impayées
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

  // 3. Workflows en erreur
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

  // 4. Anomalies
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
      id: 'anomalie-no-leads', type: 'warning', anomalie: true,
      titre: '⚠️ Aucun lead depuis 7 jours',
      message: 'Ton acquisition est au point mort — vérifie tes sources',
      date: now.toISOString(), lu: false, href: '/dashboard/client/leads',
    })
  }

  // 4b. Chute de CA > 30%
  if (caData && caData.length >= 2) {
    const dernier = caData[0], precedent = caData[1]
    if (precedent.ca_ht > 0) {
      const chute = (precedent.ca_ht - dernier.ca_ht) / precedent.ca_ht * 100
      if (chute > 30) {
        notifications.push({
          id: 'anomalie-ca-chute', type: 'erreur', anomalie: true,
          titre: `📉 CA en chute de ${Math.round(chute)}%`,
          message: `${dernier.mois} : ${dernier.ca_ht}€ vs ${precedent.ca_ht}€`,
          date: now.toISOString(), lu: false, href: '/dashboard/client/finances',
        })
      }
    }
  }

  // 4c. Taux de conversion faible
  const totalLeads = (tousLeads || []).length
  const leadsConvertis = (tousLeads || []).filter(l => l.statut === 'converti').length
  if (totalLeads >= 10 && leadsConvertis / totalLeads < 0.05) {
    notifications.push({
      id: 'anomalie-conversion', type: 'warning', anomalie: true,
      titre: '📊 Taux de conversion faible',
      message: `${leadsConvertis}/${totalLeads} leads convertis (${Math.round(leadsConvertis / totalLeads * 100)}%)`,
      date: now.toISOString(), lu: false, href: '/dashboard/client/leads',
    })
  }

  // 4d. Marge négative
  if (caData && caData.length > 0 && caData[0].marge < 0) {
    notifications.push({
      id: 'anomalie-marge-negative', type: 'erreur', anomalie: true,
      titre: '🔴 Marge négative ce mois',
      message: `${caData[0].mois} : marge de ${caData[0].marge}€`,
      date: now.toISOString(), lu: false, href: '/dashboard/client/finances',
    })
  }

  // 4e. Leads chauds non traités 48h
  const il48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  const { data: leadsChaudsAnciens } = await supabaseAdmin
    .from('leads')
    .select('id, nom, email, created_at')
    .eq('user_id', userId).eq('score', 'chaud').eq('statut', 'nouveau')
    .lt('created_at', il48h.toISOString()).limit(3)

  for (const lead of leadsChaudsAnciens || []) {
    notifications.push({
      id: `anomalie-lead-chaud-${lead.id}`, type: 'warning', anomalie: true,
      titre: '🔥 Lead chaud non contacté',
      message: `${lead.nom || lead.email} attend depuis plus de 48h`,
      date: lead.created_at, lu: false, href: '/dashboard/client/leads',
    })
  }

  // 4f. Objectifs en retard
  const jourDuMois = now.getDate()
  const joursTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  if (jourDuMois / joursTotal >= 0.5) {
    const { data: objectifs } = await supabaseAdmin
      .from('objectifs').select('*')
      .eq('user_id', userId).eq('actif', true).eq('periode', 'mensuel')

    for (const obj of objectifs || []) {
      let actuel = 0
      if (obj.type === 'ca')         actuel = caData?.[0]?.ca_ht || 0
      if (obj.type === 'leads')      actuel = (tousLeads || []).filter((l: any) => {
        const d = new Date(l.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length
      if (obj.type === 'conversion') actuel = totalLeads > 0 ? Math.round(leadsConvertis / totalLeads * 100) : 0
      const pctObjectif = obj.cible > 0 ? actuel / obj.cible : 1
      if (pctObjectif < 0.5) {
        notifications.push({
          id: `objectif-${obj.id}`, type: 'warning', anomalie: true,
          titre: `🎯 Objectif en retard : ${obj.label}`,
          message: `${actuel} / ${obj.cible} — ${Math.round(pctObjectif * 100)}% atteint`,
          date: now.toISOString(), lu: false, href: '/dashboard/client/objectifs',
        })
      }
    }
  }

  notifications.sort((a, b) => {
    if (a.anomalie && !b.anomalie) return -1
    if (!a.anomalie && b.anomalie) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return NextResponse.json(notifications.slice(0, 15))
}