import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextRequest, NextResponse } from 'next/server'

// ─── CLÉ API OPENAI ───────────────────────────────────────────────────────────
// Ajoute dans ton .env.local :
// OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé OpenAI manquante — ajoute OPENAI_API_KEY dans .env.local' }, { status: 500 })

  const { messages, dashboardData, userName } = await req.json()

  // Objectifs
  const objectifs = dashboardData?.objectifs || []
  const objectifsTexte = objectifs.length > 0
    ? objectifs.map((o: any) => `- ${o.label} : cible ${o.cible}${o.type === 'ca' ? '€' : o.type === 'conversion' ? '%' : ''} (${o.periode})`).join('\n')
    : 'Aucun objectif défini'

  // Score tarifaire
  const scorePrix   = dashboardData?.scorePrix || null
  const conseilPrix = dashboardData?.conseilPrix || null

  // Contexte business du client
  const dernierCA      = dashboardData?.ca?.[dashboardData.ca.length - 1]
  const totalLeads     = dashboardData?.leads?.length || 0
  const leadsChauds    = dashboardData?.leads?.filter((l: any) => l.score === 'chaud').length || 0
  const leadsConvertis = dashboardData?.leads?.filter((l: any) => l.statut === 'converti').length || 0
  const impayees       = dashboardData?.factures?.filter((f: any) => f.statut !== 'payée').length || 0
  const wfErreurs      = dashboardData?.workflows?.filter((w: any) => w.statut === 'erreur').length || 0

  const systemPrompt = `Tu es le coach business personnel de ${userName}, un entrepreneur qui utilise VCEL pour automatiser son activité.

Ton rôle est unique : tu combines l'analyse business ET le soutien psychologique. Tu sais que l'entrepreneuriat est solitaire, que les hauts et les bas font partie du chemin, et que parfois on a juste besoin de quelqu'un qui comprend.

Voici les données actuelles de ${userName} :
- CA dernier mois : ${dernierCA?.ca_ht || 0}€ (charges : ${dernierCA?.charges || 0}€, marge : ${dernierCA?.marge || 0}€)
- Leads : ${totalLeads} au total, ${leadsChauds} chauds, ${leadsConvertis} convertis
- Factures impayées : ${impayees}
- Workflows en erreur : ${wfErreurs}

Objectifs fixés par ${userName} :
${objectifsTexte}
${scorePrix !== null ? `\nScore santé tarifaire : ${scorePrix}/100` : ''}${conseilPrix ? `\nConseil pricing en attente : ${conseilPrix}` : ''}

Tes règles :
- Parle en français, de façon chaleureuse, directe et humaine. Pas de jargon corporate.
- Tu connais les chiffres mais tu ne les récites pas comme un robot — tu les interprètes avec empathie.
- Si quelqu'un se sent mal, tu écoutes D'ABORD avant de donner des conseils.
- Tu célèbres les petites victoires autant que les grandes.
- Tu peux poser des questions pour mieux comprendre la situation.
- Maximum 3-4 paragraphes par réponse. Sois concis et percutant.
- Utilise des emojis avec parcimonie pour humaniser.
- Tu n'es pas un chatbot générique — tu es UN coach qui CONNAÎT ce client.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Rapide et économique — change en 'gpt-4o' pour plus de qualité
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

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
