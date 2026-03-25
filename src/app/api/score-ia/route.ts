// /api/leads/score-ia
// Analyse un lead et attribue automatiquement un score chaud/tiède/froid
// + une explication courte + une action recommandée

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
  const { leadId, bulk } = await req.json()

  // Mode bulk : scorer tous les leads sans score défini
  if (bulk) {
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .in('score', ['tiède']) // On rescores les tiède par défaut (non assignés manuellement)
      .limit(20)

    if (!leads?.length) return NextResponse.json({ scored: 0 })

    let scored = 0
    for (const lead of leads) {
      const result = await scoreLead(lead, apiKey)
      if (result) {
        await supabaseAdmin.from('leads')
          .update({ score: result.score })
          .eq('id', lead.id).eq('user_id', userId)

        // Log activité
        await supabaseAdmin.from('lead_activites').insert({
          user_id: userId,
          lead_id: lead.id,
          type: 'score',
          contenu: `Score IA : ${result.score} — ${result.raison}`,
          meta: { ia: true, action: result.action },
        }).catch(() => {})

        scored++
      }
    }
    return NextResponse.json({ scored })
  }

  // Mode single : scorer un lead spécifique
  if (!leadId) return NextResponse.json({ error: 'leadId requis' }, { status: 400 })

  const { data: lead } = await supabaseAdmin
    .from('leads').select('*').eq('id', leadId).eq('user_id', userId).single()

  if (!lead) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })

  const result = await scoreLead(lead, apiKey)
  if (!result) return NextResponse.json({ error: 'Erreur scoring IA' }, { status: 500 })

  // Sauvegarder le score
  await supabaseAdmin.from('leads')
    .update({ score: result.score })
    .eq('id', leadId).eq('user_id', userId)

  // Log activité
  await supabaseAdmin.from('lead_activites').insert({
    user_id: userId,
    lead_id: leadId,
    type: 'score',
    contenu: `Score IA : ${result.score} — ${result.raison}`,
    meta: { ia: true, action: result.action },
  }).catch(() => {})

  return NextResponse.json(result)
}

async function scoreLead(lead: any, apiKey: string): Promise<{ score: string; raison: string; action: string } | null> {
  const prompt = `Tu es un expert en qualification de leads B2B.

Analyse ce lead et attribue un score parmi : "chaud", "tiède", "froid".

Données du lead :
- Nom : ${lead.nom || '—'}
- Email : ${lead.email || '—'}
- Entreprise : ${lead.entreprise || '—'}
- Secteur : ${lead.secteur || '—'}
- Source : ${lead.source || '—'}
- Message : ${lead.message || '—'}
- Notes : ${lead.notes || '—'}
- Statut actuel : ${lead.statut || 'nouveau'}
- Date : ${lead.date || '—'}

Critères :
- CHAUD : message détaillé avec besoin clair, décideur, secteur à fort budget, urgence exprimée, email pro
- TIÈDE : intérêt général sans urgence, informations partielles, pas de décideur identifié
- FROID : message vague/absent, email générique, pas de contexte business, lead froid depuis longtemps

Réponds UNIQUEMENT en JSON valide :
{"score":"chaud|tiède|froid","raison":"1 phrase courte expliquant pourquoi","action":"1 action concrète à faire maintenant"}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) return null

    // Nettoyer les backticks si présents
    const clean = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!['chaud', 'tiède', 'froid'].includes(parsed.score)) return null
    return parsed
  } catch {
    return null
  }
}