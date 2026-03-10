import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé OpenAI manquante' }, { status: 500 })

  const userId = (session.user as any).id
  const { messages, dashboardData, userName } = await req.json()

  // Données business
  const objectifs      = dashboardData?.objectifs || []
  const dernierCA      = dashboardData?.ca?.[dashboardData.ca.length - 1]
  const totalLeads     = dashboardData?.leads?.length || 0
  const leadsChauds    = dashboardData?.leads?.filter((l: any) => l.score === 'chaud').length || 0
  const leadsConvertis = dashboardData?.leads?.filter((l: any) => l.statut === 'converti').length || 0
  const impayees       = dashboardData?.factures?.filter((f: any) => f.statut !== 'payée').length || 0
  const wfErreurs      = dashboardData?.workflows?.filter((w: any) => w.statut === 'erreur').length || 0
  const scorePrix      = dashboardData?.scorePrix || null
  const secteur        = dashboardData?.secteur || null

  const objectifsTexte = objectifs.length > 0
    ? objectifs.map((o: any) => `- ${o.label} : cible ${o.cible}${o.type === 'ca' ? '€' : o.type === 'conversion' ? '%' : ''} (${o.periode}) — ID: ${o.id}`).join('\n')
    : 'Aucun objectif défini'

  const systemPrompt = `Tu es le coach business personnel de ${userName}${secteur ? `, entrepreneur dans le secteur "${secteur}"` : ''}.

Tu combines analyse business ET soutien psychologique. Tu sais que l'entrepreneuriat est solitaire et que les hauts et les bas font partie du chemin.

DONNÉES ACTUELLES DE ${userName} :
- CA dernier mois : ${dernierCA?.ca_ht || 0}€ (charges : ${dernierCA?.charges || 0}€, marge : ${dernierCA?.marge || 0}€)
- Leads : ${totalLeads} total, ${leadsChauds} chauds, ${leadsConvertis} convertis (taux: ${totalLeads > 0 ? Math.round(leadsConvertis/totalLeads*100) : 0}%)
- Factures impayées : ${impayees}
- Workflows en erreur : ${wfErreurs}
${scorePrix !== null ? `- Score santé tarifaire : ${scorePrix}/100` : ''}

OBJECTIFS ACTUELS :
${objectifsTexte}

TU PEUX CRÉER/MODIFIER DES OBJECTIFS :
Quand l'utilisateur veut créer un objectif, propose une config précise et demande sa confirmation.
Quand il confirme (dit "oui", "ok", "valide", "go", "c'est bon"), réponds UNIQUEMENT avec ce JSON (rien d'autre) :
{"action":"create_objectif","data":{"type":"ca|leads|conversion|factures|custom","label":"texte","cible":nombre,"periode":"mensuel|annuel"}}

Quand il veut supprimer un objectif existant et confirme :
{"action":"delete_objectif","data":{"id":"uuid-de-l-objectif"}}

RÈGLES :
- Parle en français, de façon chaleureuse, directe et humaine
- Interprète les chiffres avec empathie, ne les récite pas
- Écoute D'ABORD si quelqu'un se sent mal
- Célèbre les petites victoires
- Maximum 3-4 paragraphes. Sois concis et percutant
- Emojis avec parcimonie
- Tu es UN coach qui CONNAÎT ce client — pas un chatbot générique`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
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

    // Détecter si c'est une action JSON
    const trimmed = reply.trim()
    if (trimmed.startsWith('{"action"')) {
      try {
        const action = JSON.parse(trimmed)

        if (action.action === 'create_objectif') {
          const { type, label, cible, periode } = action.data
          const { error } = await supabaseAdmin.from('objectifs').insert({
            user_id: userId, type, label, cible, periode, actif: true
          })
          if (error) return NextResponse.json({ reply: `❌ Erreur lors de la création : ${error.message}`, action: null })
          return NextResponse.json({
            reply: `✅ Objectif créé : **${label}** — cible ${cible}${type === 'ca' ? '€' : type === 'conversion' ? '%' : ''} (${periode})\n\nC'est dans tes objectifs maintenant. On va le surveiller ensemble 💪`,
            action: 'objectif_created'
          })
        }

        if (action.action === 'delete_objectif') {
          const { id } = action.data
          await supabaseAdmin.from('objectifs').delete().eq('id', id).eq('user_id', userId)
          return NextResponse.json({
            reply: `✅ Objectif supprimé. Tu peux en créer un nouveau quand tu veux.`,
            action: 'objectif_deleted'
          })
        }
      } catch {
        // Pas un JSON valide, réponse normale
      }
    }

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
