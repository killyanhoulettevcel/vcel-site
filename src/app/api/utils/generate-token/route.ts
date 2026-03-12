import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISIONING_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

  const token = crypto.randomBytes(32).toString('hex')
  const exp   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours

  await supabaseAdmin.from('users').update({
    activation_token: token,
    activation_token_exp: exp.toISOString(),
  }).eq('id', userId)

  const url = `${process.env.NEXTAUTH_URL}/activate?token=${token}`
  return NextResponse.json({ token, url })
}
