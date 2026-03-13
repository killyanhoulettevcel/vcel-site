// src/app/api/prix/route.ts
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

  const [caRes, leadsRes, facturesRes, profilRes, produitsRes, ventesRes] = await Promise.all([
    supabaseAdmin.from('ca_data').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(6),
    supabaseAdmin.from('leads').select('statut, score, secteur, created_at').eq('user_id', userId),
    supabaseAdmin.from('factures').select('montant_ht, montant_ttc, statut').eq('user_id', userId),
    supabaseAdmin.from('users').select('nom, secteur').eq('id', userId).single(),
    supabaseAdmin.from('produits').select('nom, prix_vente, cout_revient, taux_marge, stock, categorie').eq('user_id', userId).eq('actif', true),
    supabaseAdmin.from('ventes').select('produit_id, total, quantite, date_vente').eq('user_id', userId),
  ])

  const caData   = caRes.data    || []
  const leads    = leadsRes.data || []
  const factures = facturesRes.data || []
  const profil   = profilRes.data
  const produits = produitsRes.data || []
  const ventes   = ventesRes.data   || []

  // Calculs généraux
  const totalLeads     = leads.length
  const leadsConvertis = leads.filter(l => l.statut === 'converti').length
  const tauxConversion = totalLeads > 0 ? Math.round(leadsConvertis / totalLeads * 100) : 0
  const caTotal        = caData.reduce((s, d) => s + (d.ca_ht || 0), 0)
  const caMoyen        = caData.length > 0 ? Math.round(caTotal / caData.length) : 0
  const dernierCA      = caData[0]
  const montantMoyenFactures = factures.length > 0
    ? Math.round(factures.reduce((s, f) => s + (f.montant_ht || 0), 0) / factures.length)
    : 0
  const montantMoyenVentes = ventes.length > 0
    ? Math.round(ventes.reduce((s, v) => s + (v.total || 0), 0) / ventes.length)
    : 0
  const montantMoyen = montantMoyenFactures || montantMoyenVentes || 0

  // Calculs produits
  const moisActuel = new Date().toISOString().slice(0, 7)
  const produitsAvecStats = produits.map(p => {
    const ventesP   = ventes.filter(v => v.produit_id === (p as any).id)
    const qtyTotal  = ventesP.reduce((s, v) => s + v.quantite, 0)
    const caVentes  = ventesP.reduce((s, v) => s + (v.total || 0), 0)
    const ventesMois = ventesP.filter(v => v.date_vente?.startsWith(moisActuel)).length
    return { ...p, qtyTotal, caVentes: Math.round(caVentes), ventesMois }
  }).sort((a, b) => b.caVentes - a.caVentes)

  const margeMoyenne = produits.length > 0
    ? Math.round(produits.reduce((s, p) => s + (p.taux_marge || 0), 0) / produits.length)
    : 0

  const produitsTexte = produitsAvecStats.length > 0
    ? produitsAvecStats.map(p =>
        `- ${p.nom} : prix ${p.prix_vente}€ · coût ${p.cout_revient}€ · marge ${p.taux_marge}% · ${p.qtyTotal} ventes au total · ${p.ventesMois} ce mois`
      ).join('\n')
    : 'Aucun produit enregistré'

  const prompt = `Tu es un expert en pricing pour entrepreneurs et freelances.

Voici le profil et les données de l'entrepreneur :
- Secteur : ${profil?.secteur || 'Non précisé'}
- CA moyen mensuel : ${caMoyen}€
- CA dernier mois : ${dernierCA?.ca_ht || 0}€
- Charges dernier mois : ${dernierCA?.charges || 0}€
- Marge dernier mois : ${dernierCA?.marge || 0}€
- Leads : ${totalLeads} (taux conversion : ${tauxConversion}%)
- Montant moyen facturé : ${montantMoyen}€
- Marge moyenne produits : ${margeMoyenne}%

CATALOGUE PRODUITS :
${produitsTexte}

Analyse ces données et fournis des suggestions de prix en JSON UNIQUEMENT, sans markdown, sans backticks.
Base tes suggestions sur les VRAIS produits listés ci-dessus — cite leurs noms, leurs prix actuels, et propose des ajustements précis.
Si la marge est < 20% sur un produit, suggère une hausse de prix ou une réduction des coûts.
Si un produit se vend bien (beaucoup de ventes), suggère de tester une hausse de 10-20%.
Si un produit ne se vend pas, suggère un repositionnement ou une offre groupée.

{
  "analyse": "2-3 phrases d'analyse du positionnement actuel basées sur les vrais produits",
  "score_sante": 75,
  "suggestions": [
    {
      "titre": "Titre court avec nom du produit si applicable",
      "description": "Explication courte et précise",
      "action": "Action concrète : ex. Passer le prix de X à Y€",
      "impact": "fort|moyen|faible",
      "type": "hausse|baisse|nouveau"
    }
  ],
  "objectif_ca": 1500,
  "conseil_rapide": "Un conseil actionnable en 1 phrase avec chiffres précis"
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 900,
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'Tu es un expert pricing. Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.' },
          { role: 'user', content: prompt }
        ]
      })
    })
    const data   = await response.json()
    const text   = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ ...parsed, caMoyen, tauxConversion, montantMoyen, margeMoyenne })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
