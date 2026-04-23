// src/app/api/karen/chat/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const KAREN_URL = process.env.KAREN_API_URL || 'https://karen.vcel.fr'
const KAREN_TOKEN = process.env.KAREN_SECRET_TOKEN || ''

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const { message, session_id, history } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  }

  try {
    // Récupérer le contexte complet du client depuis Supabase VCEL
    const [
      { data: user },
      { data: factures },
      { data: leads },
      { data: ca },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('nom, email, plan, created_at').eq('id', userId).single(),
      supabaseAdmin.from('factures').select('numero, montant_ttc, statut, date_echeance').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('leads').select('nom, email, score, statut, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('ca_data').select('mois, montant').eq('user_id', userId).order('mois', { ascending: false }).limit(3),
    ])

    // Construire le contexte client
    const facturesImpayees = factures?.filter(f => f.statut === 'en_attente' || f.statut === 'en retard') || []
    const leadsChauds = leads?.filter(l => l.score === 'chaud') || []

    const contexteClient = `
CONTEXTE CLIENT (user_id: ${userId}):
- Nom: ${user?.nom || 'Inconnu'}
- Email: ${user?.email}
- Plan: ${user?.plan || 'Starter'}
- Client depuis: ${user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Inconnu'}

FACTURES RÉCENTES:
${factures?.map(f => `- ${f.numero}: ${f.montant_ttc}€ — ${f.statut} (échéance: ${f.date_echeance || 'N/A'})`).join('\n') || 'Aucune facture'}

FACTURES IMPAYÉES: ${facturesImpayees.length}
${facturesImpayees.map(f => `- ${f.numero}: ${f.montant_ttc}€`).join('\n') || 'Aucune'}

LEADS RÉCENTS:
${leads?.map(l => `- ${l.nom}: score ${l.score}, statut ${l.statut}`).join('\n') || 'Aucun lead'}

LEADS CHAUDS: ${leadsChauds.length}

CA RÉCENT:
${ca?.map(c => `- ${c.mois}: ${c.montant}€`).join('\n') || 'Données indisponibles'}
`

    // Sauvegarder le message utilisateur dans Karen DB
    // (appel direct Supabase Karen via service role)
    const karenSupabaseUrl = process.env.KAREN_SUPABASE_URL
    const karenSupabaseKey = process.env.KAREN_SUPABASE_SERVICE_KEY

    if (karenSupabaseUrl && karenSupabaseKey) {
      await fetch(`${karenSupabaseUrl}/rest/v1/karen_conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': karenSupabaseKey,
          'Authorization': `Bearer ${karenSupabaseKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          session_id,
          role: 'user',
          content: message,
          metadata: { source: 'vcel_widget' },
        }),
      })
    }

    // Appeler Karen FastAPI
    const karenRes = await fetch(`${KAREN_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KAREN_TOKEN}`,
      },
      body: JSON.stringify({
        message,
        history: history || [],
        system_context: contexteClient,
        user_id: userId,
        session_id,
      }),
    })

    if (!karenRes.ok) {
      throw new Error(`Karen API error: ${karenRes.status}`)
    }

    const karenData = await karenRes.json()
    const response = karenData.response || karenData.message || 'Je n\'ai pas pu traiter votre demande.'

    // Sauvegarder la réponse Karen dans Karen DB
    if (karenSupabaseUrl && karenSupabaseKey) {
      await fetch(`${karenSupabaseUrl}/rest/v1/karen_conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': karenSupabaseKey,
          'Authorization': `Bearer ${karenSupabaseKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          session_id,
          role: 'assistant',
          content: response,
          metadata: { source: 'karen_fastapi' },
        }),
      })

      // Analyser si c'est un feedback/feature request
      await analyzeFeedback(userId, session_id, message, response, karenSupabaseUrl, karenSupabaseKey)
    }

    return NextResponse.json({ response })

  } catch (e: any) {
    console.error('Karen chat error:', e)

    // Fallback si Karen FastAPI est down
    const fallbackResponse = await getFallbackResponse(message, userId)
    return NextResponse.json({ response: fallbackResponse })
  }
}

// Analyse automatique des feedbacks
async function analyzeFeedback(
  userId: string,
  sessionId: string,
  userMessage: string,
  karenResponse: string,
  supabaseUrl: string,
  supabaseKey: string
) {
  const feedbackKeywords = {
    feature_request: ['j\'aimerais', 'il manque', 'pourquoi pas', 'ce serait bien', 'mon ancien logiciel', 'avant j\'avais', 'possibilité d\'ajouter', 'vous pourriez'],
    bug: ['ça marche pas', 'bug', 'erreur', 'problème', 'ne fonctionne pas', 'impossible', 'bloqué'],
    plainte: ['nul', 'décevant', 'mauvais', 'pas content', 'insatisfait', 'annuler'],
  }

  const msgLower = userMessage.toLowerCase()
  let detectedType: string | null = null

  for (const [type, keywords] of Object.entries(feedbackKeywords)) {
    if (keywords.some(kw => msgLower.includes(kw))) {
      detectedType = type
      break
    }
  }

  if (detectedType) {
    await fetch(`${supabaseUrl}/rest/v1/karen_feedbacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        type: detectedType,
        titre: userMessage.slice(0, 100),
        description: userMessage,
        statut: 'nouveau',
      }),
    })
  }
}

// Réponse de fallback si Karen FastAPI est indisponible
async function getFallbackResponse(message: string, userId: string): Promise<string> {
  const msgLower = message.toLowerCase()

  if (msgLower.includes('ca') || msgLower.includes('chiffre')) {
    return 'Je récupère votre CA... Mon service est momentanément indisponible. Consultez votre dashboard pour les données en temps réel.'
  }
  if (msgLower.includes('facture') || msgLower.includes('impayé')) {
    return 'Pour vos factures, rendez-vous dans la section Factures de votre dashboard. Je serai de retour très bientôt !'
  }
  if (msgLower.includes('lead')) {
    return 'Vos leads sont disponibles dans la section CRM de votre dashboard. Je suis momentanément indisponible mais je reviens vite !'
  }

  return 'Je suis momentanément indisponible. Votre message a été enregistré et je reviendrai vers vous dès que possible. En attendant, votre dashboard VCEL reste entièrement accessible.'
}
