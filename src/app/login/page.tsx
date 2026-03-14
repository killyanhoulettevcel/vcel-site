'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'

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
    setLoading(true); setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) { setError('Email ou mot de passe incorrect.'); return }
    router.push('/dashboard')
  }

  const handleGoogle = async () => {
    setLoadingG(true); setError('')
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-cream-100 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-navy-800/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block mb-8">
            <img src="/logo.png" alt="VCEL" className="h-10 w-auto mx-auto" />
          </a>
          <h1 className="font-display text-2xl text-[var(--navy)] mb-2">Espace client</h1>
          <p className="text-[var(--text-muted)] text-sm">Accédez à vos workflows et données</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg-navy p-8">
          {/* Google */}
          <button onClick={handleGoogle} disabled={loadingG}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-white hover:shadow-sm-navy transition-all text-[var(--text-primary)] text-sm font-medium mb-5 disabled:opacity-50">
            {loadingG ? (
              <div className="w-4 h-4 border-2 border-[var(--border-hover)] border-t-navy-700 rounded-full animate-spin" />
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

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--text-light)] text-xs">ou</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="you@exemple.fr"
                className="input-field" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="input-field pr-11" />
                <button onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-secondary)] transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle size={15} className="shrink-0" /> {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleLogin} disabled={loading || !email || !password}
              className="btn-primary w-full justify-center py-3.5 disabled:opacity-40 disabled:cursor-not-allowed group">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>Se connecter</span><ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[var(--text-muted)] text-xs mt-6">
          Pas encore client ?{' '}
          <a href="/#tarifs" className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors">
            Démarrer à 19€
          </a>
        </p>
      </div>
    </div>
  )
}
