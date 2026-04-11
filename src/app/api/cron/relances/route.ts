// src/app/api/cron/relances/route.ts
// Appelé chaque matin par Vercel Cron (0 7 * * *)
// 1. Envoie les relances automatiques aux clients (factures impayées, leads froids)
// 2. Envoie des rappels au solopreneur (leads chauds inactifs)

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmailFromUser, templateRelanceFacture, templateRelanceLead } from '@/lib/googleGmail'

// Template rappel interne — envoyé au solopreneur lui-même
function templateRappelInterne(options: {
  leads: { nom: string; email: string; statut: string; score: string; joursInactif: number }[]
  nomExpediteur: string
}): { subject: string; html: string } {
  const subject = `⏰ ${options.leads.length} lead${options.leads.length > 1 ? 's' : ''} en attente de relance`
  const rows = options.leads.map(l => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
        <p style="margin:0;color:#1e293b;font-size:13px;font-weight:600;">${l.nom}</p>
        <p style="margin:2px 0 0;color:#64748b;font-size:12px;">${l.email}</p>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">
        <span style="background:${l.score === 'chaud' ? '#fef2f2' : l.score === 'tiède' ? '#fff7ed' : '#eff6ff'};color:${l.score === 'chaud' ? '#dc2626' : l.score === 'tiède' ? '#ea580c' : '#2563eb'};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;">
          ${l.score === 'chaud' ? '🔥' : l.score === 'tiède' ? '➖' : '❄️'} ${l.score}
        </span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">
        <span style="background:#f8fafc;color:#475569;padding:2px 8px;border-radius:8px;font-size:11px;">${l.statut}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:${l.joursInactif > 14 ? '#dc2626' : '#ea580c'};font-size:13px;font-weight:700;">
        ${l.joursInactif}j
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background:linear-gradient(135deg,#0D1B2A,#1e3a5f);border-radius:16px 16px 0 0;padding:28px 32px;">
          <p style="margin:0 0 4px;color:#4FC3F7;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Rappel VCEL</p>
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">⏰ Leads en attente de relance</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Ces leads n'ont pas été contactés depuis un moment</p>
        </td></tr>

        <tr><td style="background:#ffffff;padding:24px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Lead</th>
              <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Score</th>
              <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Statut</th>
              <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Inactif</th>
            </tr>
            ${rows}
          </table>
        </td></tr>

        <tr><td style="background:#ffffff;padding:8px 32px 28px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/client/leads" style="display:inline-block;background:linear-gradient(135deg,#4FC3F7,#0288D1);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:700;font-size:14px;">
            Voir mes leads →
          </a>
        </td></tr>

        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">VCEL · Rappel automatique quotidien</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, html }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const today = new Date()
  let sent = 0, errors = 0

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, nom, email, preferences, google_refresh_token')
    .not('google_refresh_token', 'is', null)

  for (const user of users || []) {
    const prefs = user.preferences || {}

    // ── 1. Relances factures impayées → email au CLIENT ─────────────────
    if (prefs.relance_factures_auto) {
      const delai = prefs.relance_factures_delai || 7
      const dateLimit = new Date(today)
      dateLimit.setDate(dateLimit.getDate() - delai)

      // Utiliser date_echeance si disponible, sinon date_facture + délai
      const { data: factures } = await supabaseAdmin
        .from('factures')
        .select('*')
        .eq('user_id', user.id)
        .in('statut', ['en attente', 'en retard'])
        .or(`date_echeance.lte.${today.toISOString().split('T')[0]},and(date_echeance.is.null,date_facture.lte.${dateLimit.toISOString().split('T')[0]})`)

      for (const facture of factures || []) {
        if (!facture.email_client) continue
        const { data: already } = await supabaseAdmin
          .from('emails_log').select('id')
          .eq('user_id', user.id).eq('type', 'relance_facture')
          .eq('destinataire', facture.email_client)
          .gte('sent_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
          .limit(1)
        if (already?.length) continue
        // Passer en retard automatiquement si date_echeance dépassée
        if (facture.date_echeance && new Date(facture.date_echeance) < today && facture.statut === 'en attente') {
          await supabaseAdmin.from('factures').update({ statut: 'en retard' }).eq('id', facture.id)
        }
        try {
          const tpl = templateRelanceFacture({
            nomClient: facture.nom_client || facture.email_client,
            numeroFacture: facture.numero_facture,
            montant: facture.montant_ttc,
            dateEcheance: facture.date_echeance || facture.date_facture,
            nomExpediteur: user.nom,
          })
          await sendEmailFromUser(supabaseAdmin, user.id, { to: facture.email_client, ...tpl })
          await supabaseAdmin.from('emails_log').insert({
            user_id: user.id, type: 'relance_facture',
            destinataire: facture.email_client, subject: tpl.subject,
          })
          sent++
        } catch { errors++ }
      }
    }

    // ── 2. Relances leads → email au LEAD (si activé) ───────────────────
    if (prefs.relance_leads_auto) {
      const delai = prefs.relance_leads_delai || 5
      const dateLimit = new Date(today)
      dateLimit.setDate(dateLimit.getDate() - delai)

      const { data: leads } = await supabaseAdmin
        .from('leads').select('*')
        .eq('user_id', user.id)
        .in('statut', ['nouveau'])
        .lte('created_at', dateLimit.toISOString())

      for (const lead of leads || []) {
        if (!lead.email) continue
        const { data: already } = await supabaseAdmin
          .from('emails_log').select('id')
          .eq('user_id', user.id).eq('type', 'relance_lead')
          .eq('destinataire', lead.email)
          .gte('sent_at', new Date(new Date().setDate(new Date().getDate() - delai)).toISOString())
          .limit(1)
        if (already?.length) continue
        try {
          const tpl = templateRelanceLead({ nomLead: lead.nom, nomExpediteur: user.nom })
          await sendEmailFromUser(supabaseAdmin, user.id, { to: lead.email, ...tpl })
          await supabaseAdmin.from('emails_log').insert({
            user_id: user.id, type: 'relance_lead',
            destinataire: lead.email, subject: tpl.subject,
          })
          await supabaseAdmin.from('leads').update({ statut: 'contacté' }).eq('id', lead.id)
          sent++
        } catch { errors++ }
      }
    }

    // ── 3. Rappel interne → email au SOLOPRENEUR (toujours actif) ────────
    // Leads chauds ou tièdes en statut actif, inactifs depuis X jours
    const delaiRappel = prefs.relance_leads_delai || 5
    const dateRappel  = new Date(today)
    dateRappel.setDate(dateRappel.getDate() - delaiRappel)

    const { data: leadsInactifs } = await supabaseAdmin
      .from('leads').select('*')
      .eq('user_id', user.id)
      .in('statut', ['nouveau', 'contacté', 'qualifié'])
      .in('score', ['chaud', 'tiède'])
      .lte('created_at', dateRappel.toISOString())

    if (!leadsInactifs?.length) continue

    // Vérifier qu'on n'a pas déjà envoyé un rappel aujourd'hui
    const { data: alreadyRappel } = await supabaseAdmin
      .from('emails_log').select('id')
      .eq('user_id', user.id).eq('type', 'rappel_leads_inactifs')
      .gte('sent_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
      .limit(1)

    if (alreadyRappel?.length) continue

    // Calculer le nombre de jours d'inactivité par lead
    const leadsAvecJours = leadsInactifs.map(l => ({
      nom:          l.nom,
      email:        l.email,
      statut:       l.statut,
      score:        l.score,
      joursInactif: Math.floor((today.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    })).sort((a, b) => b.joursInactif - a.joursInactif) // Plus anciens en premier

    try {
      const tpl = templateRappelInterne({ leads: leadsAvecJours, nomExpediteur: user.nom })
      await sendEmailFromUser(supabaseAdmin, user.id, { to: user.email, ...tpl })
      await supabaseAdmin.from('emails_log').insert({
        user_id: user.id, type: 'rappel_leads_inactifs',
        destinataire: user.email, subject: tpl.subject,
      })
      sent++
    } catch { errors++ }
  }

  return NextResponse.json({ success: true, sent, errors, date: today.toISOString() })
}
