// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Google OAuth ─────────────────────────────────────────────────────────
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email / Mot de passe ─────────────────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',         type: 'email' },
        password: { label: 'Mot de passe',  type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', credentials.email.toLowerCase())
          .single()
        if (error || !user) return null
        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.nom, role: user.role }
      },
    }),
  ],

  callbacks: {
    // Créer ou récupérer l'utilisateur Google dans Supabase
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase()
        if (!email) return false

        // Vérifier si l'utilisateur existe déjà
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id, role')
          .eq('email', email)
          .single()

        if (!existing) {
          // Créer le compte automatiquement
          const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
              email,
              nom:          user.name  || email.split('@')[0],
              avatar_url:   user.image || null,
              role:         'client',
              password_hash: '', // pas de mot de passe pour Google
              google_id:    user.id,
            })
            .select('id, role')
            .single()

          if (error || !newUser) return false
          user.id   = newUser.id
          ;(user as any).role = newUser.role
        } else {
          // Mettre à jour l'avatar si besoin
          await supabaseAdmin
            .from('users')
            .update({ avatar_url: user.image, google_id: user.id })
            .eq('email', email)

          user.id   = existing.id
          ;(user as any).role = existing.role
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub  = user.id
        token.role = (user as any).role || 'client'
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.sub
        (session.user as any).role = token.role
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
