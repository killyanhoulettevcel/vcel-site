// src/app/api/cron/relances/route.ts
// Appelé chaque matin par Vercel Cron — envoie les relances automatiques
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmailFromUser, templateRelanceFacture, templateRelanceLead } from '@/lib/googleGmail'

export async function GET(req: NextRequest) {
  // Sécurité : vérifier le token cron Vercel
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const today   = new Date()
  let sent      = 0
  let errors    = 0

  // Récupérer tous les users avec relances auto activées et Google connecté
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, nom, email, preferences, google_access_token, google_refresh_token')
    .not('google_refresh_token', 'is', null)

  for (const user of users || []) {
    const prefs = user.preferences || {}

    // ── Relances factures ──────────────────────────────────────────────────
    if (prefs.relance_factures_auto) {
      const delai = prefs.relance_factures_delai || 7
      const dateLimit = new Date(today)
      dateLimit.setDate(dateLimit.getDate() - delai)

      const { data: factures } = await supabaseAdmin
        .from('factures')
        .select('*')
        .eq('user_id', user.id)
        .in('statut', ['en attente', 'en retard'])
        .lte('date_facture', dateLimit.toISOString().split('T')[0])

      for (const facture of factures || []) {
        if (!facture.email_client) continue
        // Vérifier qu'on n'a pas déjà relancé aujourd'hui
        const { data: already } = await supabaseAdmin
          .from('emails_log')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'relance_facture')
          .eq('destinataire', facture.email_client)
          .gte('sent_at', new Date(today.setHours(0,0,0,0)).toISOString())
          .limit(1)

        if (already?.length) continue

        try {
          const tpl = templateRelanceFacture({
            nomClient:     facture.nom_client || facture.email_client,
            numeroFacture: facture.numero_facture,
            montant:       facture.montant_ttc,
            dateEcheance:  facture.date_facture,
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

    // ── Relances leads ─────────────────────────────────────────────────────
    if (prefs.relance_leads_auto) {
      const delai = prefs.relance_leads_delai || 5
      const dateLimit = new Date(today)
      dateLimit.setDate(dateLimit.getDate() - delai)

      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .in('statut', ['nouveau'])
        .lte('created_at', dateLimit.toISOString())

      for (const lead of leads || []) {
        if (!lead.email) continue
        const { data: already } = await supabaseAdmin
          .from('emails_log')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'relance_lead')
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
          // Passer le statut à "contacté"
          await supabaseAdmin.from('leads').update({ statut: 'contacté' }).eq('id', lead.id)
          sent++
        } catch { errors++ }
      }
    }
  }

  return NextResponse.json({ success: true, sent, errors, date: today.toISOString() })
}
