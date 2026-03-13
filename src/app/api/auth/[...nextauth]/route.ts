// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',        type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
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
        return {
          id:    user.id,
          email: user.email,
          name:  user.nom,
          image: user.avatar_url || null,
          role:  user.role,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase()
        if (!email) return false

        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id, role')
          .eq('email', email)
          .single()

        if (!existing) {
          const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
              email,
              nom:           user.name  || email.split('@')[0],
              avatar_url:    user.image || null,
              role:          'client',
              password_hash: '',
              google_id:     account.providerAccountId,
            })
            .select('id, role')
            .single()
          if (error || !newUser) return false
          user.id = newUser.id
          ;(user as any).role = 'client'
        } else {
          await supabaseAdmin
            .from('users')
            .update({
              avatar_url: user.image,
              google_id:  account.providerAccountId,
            })
            .eq('email', email)
          user.id = existing.id
          ;(user as any).role = existing.role
        }
      }
      return true
    },

    async jwt({ token, user, account }) {
      // Premier appel — juste après signIn
      if (user) {
        token.uid  = user.id
        token.role = (user as any).role || 'client'
        return token
      }

      // Appels suivants — vérifier que uid et role sont présents
      if (!token.uid) {
        // Connexion Google : retrouver l'utilisateur via email
        if (token.email) {
          const { data } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('email', (token.email as string).toLowerCase())
            .single()
          if (data) {
            token.uid  = data.id
            token.role = data.role || 'client'
          }
        }
      }

      if (!token.role) {
        token.role = 'client'
      }

      return token
    },

    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = (token.uid || token.sub) as string
        ;(session.user as any).role = (token.role || 'client') as string
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
