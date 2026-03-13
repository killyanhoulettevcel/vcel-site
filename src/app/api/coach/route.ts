import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getValidToken, getTodayEvents } from '@/lib/googleCalendar'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé OpenAI manquante' }, { status: 500 })

  const userId = (session.user as any).id
  const { messages, dashboardData, userName } = await req.json()

  // Données business enrichies
  const objectifs       = dashboardData?.objectifs || []
  const leads           = dashboardData?.leads || []
  const factures        = dashboardData?.factures || []
  const finances        = dashboardData?.ca || []
  const workflows       = dashboardData?.workflows || []
  const dernierCA       = finances[finances.length - 1]
  const avant_dernierCA = finances[finances.length - 2]
  const totalLeads      = leads.length
  const leadsChauds     = leads.filter((l: any) => l.score === 'chaud')
  const il7jours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const leadsNonContactes = leadsChauds.filter((l: any) => {
    if (l.statut === 'converti' || l.statut === 'perdu') return false
    if (l.derniere_relance && new Date(l.derniere_relance) > il7jours) return false
    return true
  })
  const leadsConvertis  = leads.filter((l: any) => l.statut === 'converti').length
  const impayees        = factures.filter((f: any) => f.statut !== 'payée')
  const wfErreurs       = workflows.filter((w: any) => w.statut === 'erreur').length
  const scorePrix       = dashboardData?.scorePrix || null
  const secteur         = dashboardData?.secteur || null
  const tauxConversion  = totalLeads > 0 ? Math.round(leadsConvertis / totalLeads * 100) : 0
  const evolutionCA     = avant_dernierCA?.ca_ht > 0
    ? Math.round((((dernierCA?.ca_ht || 0) - avant_dernierCA.ca_ht) / avant_dernierCA.ca_ht) * 100)
    : null

  // ── RDV du jour depuis Google Calendar ──────────────────────────────────────
  let rdvAujourdhui: any[] = []
  try {
    const token = await getValidToken(supabaseAdmin, userId)
    rdvAujourdhui = await getTodayEvents(token)
  } catch { /* Calendar non connecté, pas bloquant */ }

  const rdvTexte = rdvAujourdhui.length > 0
    ? rdvAujourdhui.map((e: any) => {
        const heure = e.start?.dateTime
          ? new Date(e.start.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : 'Journée entière'
        const lieu = e.location ? ` @ ${e.location}` : ''
        const participants = e.attendees?.length ? ` (${e.attendees.map((a: any) => a.email).join(', ')})` : ''
        return `- ${heure}${lieu} : ${e.summary}${participants}`
      }).join('\n')
    : 'Aucun RDV aujourd\'hui'

  const objectifsTexte = objectifs.length > 0
    ? objectifs.map((o: any) => `- ${o.label} : cible ${o.cible}${o.type === 'ca' ? '€' : o.type === 'conversion' ? '%' : ''} (${o.periode}) — ID: ${o.id}`).join('\n')
    : 'Aucun objectif défini'

  const leadsChaudsTexte = leadsNonContactes.map((l: any) => {
    const joursDepuis = l.derniere_relance
      ? Math.floor((Date.now() - new Date(l.derniere_relance).getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24))
    return `- ${l.nom || l.email} (${l.email}) — ${joursDepuis}j sans contact — ID: ${l.id}`
  }).join('\n') || 'Aucun lead chaud à relancer'

  const facturesTexte = impayees.slice(0, 5).map((f: any) =>
    `- ${f.numero_facture} : ${f.montant_ttc}€ (${f.statut}) — ID: ${f.id}`
  ).join('\n') || 'Aucune facture impayée'

  const systemPrompt = `Tu es le coach business personnel de ${userName}${secteur ? `, entrepreneur dans le secteur "${secteur}"` : ''}.

Tu combines analyse business ET soutien psychologique. Tu es direct, humain, et tu AGIS — pas juste des conseils.

━━━ DONNÉES ACTUELLES ━━━
CA ce mois : ${dernierCA?.ca_ht || 0}€ | Charges : ${dernierCA?.charges || 0}€ | Marge : ${dernierCA?.marge || 0}€
${evolutionCA !== null ? `Évolution CA vs mois dernier : ${evolutionCA > 0 ? '+' : ''}${evolutionCA}%` : ''}
Leads : ${totalLeads} total | ${leadsChauds.length} chauds | ${leadsConvertis} convertis | Taux conversion : ${tauxConversion}%
Factures impayées : ${impayees.length} (${impayees.reduce((s: number, f: any) => s + (f.montant_ttc || 0), 0)}€)
Workflows en erreur : ${wfErreurs}
${scorePrix !== null ? `Score santé tarifaire : ${scorePrix}/100` : ''}

━━━ AGENDA DU JOUR ━━━
${rdvTexte}

━━━ LEADS CHAUDS NON CONTACTÉS ━━━
${leadsChaudsTexte}

━━━ FACTURES IMPAYÉES ━━━
${facturesTexte}

━━━ OBJECTIFS ━━━
${objectifsTexte}

━━━ TES ACTIONS DISPONIBLES ━━━
Quand l'utilisateur confirme (dit "oui", "ok", "go", "valide", "c'est bon"), réponds UNIQUEMENT avec le JSON correspondant :

1. Créer un objectif :
{"action":"create_objectif","data":{"type":"ca|leads|conversion|factures|custom","label":"texte","cible":nombre,"periode":"mensuel|annuel"}}

2. Modifier un objectif existant :
{"action":"update_objectif","data":{"id":"uuid","label":"texte","cible":nombre,"periode":"mensuel|annuel"}}

3. Supprimer un objectif :
{"action":"delete_objectif","data":{"id":"uuid"}}

4. Relancer les leads chauds :
{"action":"relancer_leads","data":{"ids":["id1","id2"],"message_coach":"Message court"}}

5. Marquer une facture en relance :
{"action":"relancer_facture","data":{"id":"uuid","message_coach":"texte"}}

6. Corriger le statut d'un lead :
{"action":"update_lead","data":{"id":"uuid","statut":"contacté|qualifié|converti|perdu","score":"chaud|tiède|froid"}}

━━━ RÈGLES ━━━
- Parle en français, chaleureux, direct, humain. Zéro jargon.
- Si l'utilisateur a des RDV aujourd'hui, mentionne-les naturellement au début si pertinent
- Interprète les chiffres avec empathie — ne les récite pas
- Écoute D'ABORD si quelqu'un se sent mal
- Célèbre les petites victoires
- Quand tu vois des problèmes (leads non contactés, factures impayées, CA en chute), PROPOSE des actions concrètes
- Si le CA baisse fort, propose de relancer les leads chauds
- Si taux conversion < 10%, propose de revoir l'approche commerciale
- Si objectif irréaliste, dis-le franchement et propose une correction
- Maximum 3-4 paragraphes. Percutant.
- Tu es UN coach qui CONNAÎT ce client — pas un chatbot générique`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 700,
        temperature: 0.85,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ],
      })
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message || 'Erreur OpenAI' }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Je n\'ai pas pu générer une réponse.'

    // Détecter action JSON
    const trimmed = reply.trim()
    if (trimmed.startsWith('{"action"')) {
      try {
        const action = JSON.parse(trimmed)

        if (action.action === 'create_objectif') {
          const { type, label, cible, periode } = action.data
          const { error } = await supabaseAdmin.from('objectifs').insert({
            user_id: userId, type, label, cible, periode, actif: true
          })
          if (error) return NextResponse.json({ reply: `❌ Erreur : ${error.message}` })
          return NextResponse.json({
            reply: `✅ Objectif créé : **${label}** — cible ${cible}${type === 'ca' ? '€' : type === 'conversion' ? '%' : ''} (${periode})\n\nJe vais suivre ça avec toi. On y va 💪`,
            action: 'objectif_created'
          })
        }

        if (action.action === 'update_objectif') {
          const { id, label, cible, periode } = action.data
          await supabaseAdmin.from('objectifs').update({ label, cible, periode }).eq('id', id).eq('user_id', userId)
          return NextResponse.json({
            reply: `✅ Objectif mis à jour : **${label}** — nouvelle cible ${cible} (${periode})\n\nC'est plus réaliste, on va l'atteindre ensemble.`,
            action: 'objectif_updated'
          })
        }

        if (action.action === 'delete_objectif') {
          await supabaseAdmin.from('objectifs').delete().eq('id', action.data.id).eq('user_id', userId)
          return NextResponse.json({
            reply: `✅ Objectif supprimé. Quand tu veux en créer un nouveau, je suis là.`,
            action: 'objectif_deleted'
          })
        }

        if (action.action === 'relancer_leads') {
          const { ids, message_coach } = action.data
          await supabaseAdmin.from('leads')
            .update({ statut: 'contacté', derniere_relance: new Date().toISOString() })
            .in('id', ids).eq('user_id', userId)
          return NextResponse.json({
            reply: `✅ ${ids.length} lead${ids.length > 1 ? 's' : ''} relancé${ids.length > 1 ? 's' : ''} et marqué${ids.length > 1 ? 's' : ''} comme contacté${ids.length > 1 ? 's' : ''} 📞\n\n${message_coach}\n\nJe ne les repropose pas avant 7 jours.`,
            action: 'leads_relanced'
          })
        }

        if (action.action === 'relancer_facture') {
          await supabaseAdmin.from('factures').update({ statut: 'en retard' }).eq('id', action.data.id).eq('user_id', userId)
          return NextResponse.json({
            reply: `✅ Facture marquée en retard — pense à envoyer un email de relance aujourd'hui.\n\n${action.data.message_coach}`,
            action: 'facture_relanced'
          })
        }

        if (action.action === 'update_lead') {
          const { id, statut, score } = action.data
          await supabaseAdmin.from('leads').update({ statut, score }).eq('id', id).eq('user_id', userId)
          return NextResponse.json({
            reply: `✅ Lead mis à jour — statut : ${statut}${score ? `, score : ${score}` : ''}.`,
            action: 'lead_updated'
          })
        }

      } catch { /* Pas un JSON valide, réponse normale */ }
    }

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
