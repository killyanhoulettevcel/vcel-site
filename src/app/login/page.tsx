'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [loadingG, setLoadingG] = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) { setError('Email ou mot de passe incorrect.'); return }
    router.push('/dashboard')
  }

  const handleGoogle = async () => {
    setLoadingG(true)
    setError('')
    await signIn('google', { callbackUrl: '/dashboard' })
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

            {/* Bouton Google */}
            <button onClick={handleGoogle} disabled={loadingG}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white text-sm font-medium disabled:opacity-50">
              {loadingG ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              Continuer avec Google
            </button>

            {/* Séparateur */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/20 text-xs">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="killyan@vcel.fr"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
                <button onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleLogin} disabled={loading || !email || !password}
              className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:transform-none">
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
