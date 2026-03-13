// src/app/api/emails/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import {
  sendEmailFromUser,
  templateRelanceFacture,
  templateRelanceLead,
  templateBienvenue,
} from '@/lib/googleGmail'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id

  const body = await req.json()
  const { type, to, data } = body

  // Récupérer le nom de l'expéditeur
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('nom')
    .eq('id', userId)
    .single()
  const nomExpediteur = user?.nom || 'Votre prestataire'

  try {
    let subject = ''
    let html    = ''

    if (type === 'relance_facture') {
      const tpl = templateRelanceFacture({ ...data, nomExpediteur })
      subject = tpl.subject
      html    = tpl.html
    } else if (type === 'relance_lead') {
      const tpl = templateRelanceLead({ ...data, nomExpediteur })
      subject = tpl.subject
      html    = tpl.html
    } else if (type === 'bienvenue') {
      const tpl = templateBienvenue({ ...data, nomExpediteur })
      subject = tpl.subject
      html    = tpl.html
    } else {
      return NextResponse.json({ error: 'Type email inconnu' }, { status: 400 })
    }

    await sendEmailFromUser(supabaseAdmin, userId, { to, subject, html })

    // Logger l'envoi dans Supabase
    await supabaseAdmin.from('emails_log').insert({
      user_id: userId,
      type,
      destinataire: to,
      subject,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET : récupérer l'historique des emails envoyés
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = (session.user as any).id

  const { data } = await supabaseAdmin
    .from('emails_log')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data || [])
}
