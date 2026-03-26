// src/app/api/simulateur/conseil/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé OpenAI manquante' }, { status: 500 })

  const { statut, caAnnuel, charges, result, regime } = await req.json()

  // Compatibilité avec les deux nommages possibles (ancienne + nouvelle version de la page)
  const urssaf       = result.urssaf ?? 0
  const ir           = result.IR ?? result.ir ?? 0
  const is           = result.is ?? 0
  const net          = result.net ?? result.netApresCharges ?? 0
  const taux         = result.taux ?? result.tauxPrelevementGlobal ?? 0
  const tvaN         = result.tvaN ?? result.tvaNette ?? 0

  const prompt = `Tu es un expert-comptable français spécialisé dans les TPE et indépendants.

Analyse cette situation fiscale et donne un conseil court et actionnable (3-4 phrases max) :

- Statut juridique : ${regime}
- CA annuel HT : ${caAnnuel.toLocaleString('fr-FR')} €
- Charges annuelles : ${(charges || 0).toLocaleString('fr-FR')} €
- URSSAF estimées : ${urssaf.toLocaleString('fr-FR')} €
- IS estimé : ${is.toLocaleString('fr-FR')} €
- IR estimé : ${ir.toLocaleString('fr-FR')} €
- TVA nette à reverser : ${tvaN.toLocaleString('fr-FR')} €
- Net perçu estimé : ${net.toLocaleString('fr-FR')} €
- Taux de prélèvements global : ${taux}%

Donne un conseil concret : est-ce que ce statut est optimisé ? Y a-t-il un seuil critique à surveiller ? Une action simple à faire ?
Réponds directement sans salutation ni introduction, en français, de manière simple et accessible.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    const data = await res.json()
    const conseil = data.choices?.[0]?.message?.content?.trim() || ''
    return NextResponse.json({ conseil })
  } catch {
    return NextResponse.json({ error: 'Erreur OpenAI' }, { status: 500 })
  }
}