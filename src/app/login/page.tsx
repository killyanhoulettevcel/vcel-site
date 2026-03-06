'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Email ou mot de passe incorrect.')
      return
    }

    // Redirection selon le rôle (NextAuth retourne la session)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-navy-950 relative overflow-hidden">
      {/* Orbs */}
      <div className="glow-orb w-[500px] h-[500px] bg-blue-600/15 top-[-100px] left-[-200px]" />
      <div className="glow-orb w-[300px] h-[300px] bg-indigo-500/10 bottom-0 right-[-50px]" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">VCEL</span>
          </a>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Espace client</h1>
          <p className="text-white/40 text-sm">Accédez à vos workflows et données</p>
        </div>

        {/* Card */}
        <div className="card-glass p-8" style={{ boxShadow: '0 0 80px rgba(59,130,246,0.08)' }}>
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="killyan@vcel.fr"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:transform-none mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : 'Se connecter →'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Pas encore client ?{' '}
          <a href="/#tarifs" className="text-blue-400 hover:text-blue-300 transition-colors">
            Démarrer à 19€
          </a>
        </p>
      </div>
    </div>
  )
}
