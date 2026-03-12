import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Mot de passe trop court (8 caractères min)' }, { status: 400 })

  // Vérifier le token
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('activation_token', token)
    .single()

  if (error || !user) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })

  // Vérifier expiration
  if (user.activation_token_exp && new Date(user.activation_token_exp) < new Date()) {
    return NextResponse.json({ error: 'Lien expiré — contactez le support' }, { status: 400 })
  }

  // Hasher le mot de passe et activer le compte
  const hash = await bcrypt.hash(password, 10)
  await supabaseAdmin.from('users').update({
    password_hash: hash,
    compte_active: true,
    activation_token: null,
    activation_token_exp: null,
  }).eq('id', user.id)

  return NextResponse.json({ success: true, email: user.email })
}
