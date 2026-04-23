// src/app/api/karen/chat/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK_URL = 'https://n8n.vcel.fr/webhook-test/karen-chat'

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
    const [
      { data: user },
      { data: factures },
      { data: leads },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('nom, email, plan, created_at').eq('id', userId).single(),
      supabaseAdmin.from('factures').select('numero, montant_ttc, statut').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabaseAdmin.from('leads').select('nom, score, statut').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    ])

    const facturesImpayees = factures?.filter(f => f.statut === 'en_attente' || f.statut === 'en retard') || []

    const system_context = `
Utilisateur : ${user?.nom} (${user?.email})
Plan VCEL : ${user?.plan || 'Starter'}
Client depuis : ${user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Inconnu'}
Factures impayées : ${facturesImpayees.length}
Derniers leads : ${leads?.map(l => `${l.nom} (${l.score})`).join(', ') || 'Aucun'}
`

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        user_id: userId,
        session_id,
        system_context,
        history: history || [],
      }),
    })

    if (!res.ok) throw new Error(`n8n error: ${res.status}`)

    const data = await res.json()
    return NextResponse.json({ response: data.response })

  } catch (e: any) {
    console.error('Karen chat error:', e)
    return NextResponse.json({
      response: 'Je suis momentanément indisponible. Réessayez dans quelques instants.'
    })
  }
}
