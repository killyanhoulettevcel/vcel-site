import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé OpenAI manquante' }, { status: 500 })

  const userId = (session.user as any).id

  // Récupérer toutes les données
  const [caRes, leadsRes, facturesRes, profilRes] = await Promise.all([
    supabaseAdmin.from('ca_data').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(6),
    supabaseAdmin.from('leads').select('statut, score, secteur, created_at').eq('user_id', userId),
    supabaseAdmin.from('factures').select('montant_ht, montant_ttc, statut').eq('user_id', userId),
    supabaseAdmin.from('users').select('nom, secteur').eq('id', userId).single(),
  ])

  const caData    = caRes.data || []
  const leads     = leadsRes.data || []
  const factures  = facturesRes.data || []
  const profil    = profilRes.data

  // Calculs
  const totalLeads     = leads.length
  const leadsConvertis = leads.filter(l => l.statut === 'converti').length
  const tauxConversion = totalLeads > 0 ? Math.round(leadsConvertis / totalLeads * 100) : 0
  const caTotal        = caData.reduce((s, d) => s + (d.ca_ht || 0), 0)
  const caMoyen        = caData.length > 0 ? Math.round(caTotal / caData.length) : 0
  const dernierCA      = caData[0]
  const montantMoyen   = factures.length > 0
    ? Math.round(factures.reduce((s, f) => s + (f.montant_ht || 0), 0) / factures.length)
    : 0

  const prompt = `Tu es un expert en pricing pour entrepreneurs et freelances.

Voici le profil et les données de l'entrepreneur :
- Secteur : ${profil?.secteur || 'Non précisé'}
- CA moyen mensuel : ${caMoyen}€
- CA dernier mois : ${dernierCA?.ca_ht || 0}€
- Charges dernier mois : ${dernierCA?.charges || 0}€
- Marge dernier mois : ${dernierCA?.marge || 0}€
- Nombre de leads : ${totalLeads} (taux de conversion : ${tauxConversion}%)
- Montant moyen facturé : ${montantMoyen}€
- Nombre de factures : ${factures.length}

Analyse ces données et fournis des suggestions de prix en JSON UNIQUEMENT, sans markdown, sans backticks :
{
  "analyse": "2-3 phrases d'analyse du positionnement actuel",
  "score_sante": 75,
  "suggestions": [
    {
      "titre": "Titre court",
      "description": "Explication courte",
      "action": "Action concrète à faire",
      "impact": "fort|moyen|faible",
      "type": "hausse|baisse|nouveau"
    }
  ],
  "objectif_ca": 1500,
  "conseil_rapide": "Un conseil actionnable en 1 phrase"
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'Tu es un expert pricing. Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.' },
          { role: 'user', content: prompt }
        ]
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    return NextResponse.json({ ...parsed, caMoyen, tauxConversion, montantMoyen })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
