'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'

function ActivateContent() {
  const params   = useSearchParams()
  const router   = useRouter()
  const token    = params.get('token') || ''

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const rules = [
    { label: '8 caractères minimum', ok: password.length >= 8 },
    { label: 'Une majuscule',         ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre',            ok: /[0-9]/.test(password) },
    { label: 'Les mots de passe correspondent', ok: password === confirm && confirm !== '' },
  ]
  const allOk = rules.every(r => r.ok)

  const handleSubmit = async () => {
    if (!allOk) return
    setLoading(true)
    setError('')

    const res  = await fetch('/api/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur lors de l\'activation')
      setLoading(false)
      return
    }

    setSuccess(true)
    // Connecter automatiquement
    await signIn('credentials', {
      email: data.email,
      password,
      callbackUrl: '/dashboard/client/onboarding',
      redirect: true,
    })
  }

  if (!token) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
      <div className="card-glass p-8 max-w-md w-full text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold text-white mb-2">Lien invalide</h1>
        <p className="text-white/40 text-sm">Ce lien d'activation est invalide. Contactez le support.</p>
      </div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
      <div className="card-glass p-8 max-w-md w-full text-center">
        <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold text-white mb-2">Compte activé !</h1>
        <p className="text-white/40 text-sm">Connexion en cours...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
      <div className="card-glass p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-400 font-display font-bold text-xl">V</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Activez votre compte</h1>
          <p className="text-white/40 text-sm">Choisissez votre mot de passe pour accéder à VCEL</p>
        </div>

        {/* Champs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Choisissez un mot de passe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 pr-10"
              />
              <button onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Règles */}
        <div className="space-y-1.5 mb-6">
          {rules.map(r => (
            <div key={r.label} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${r.ok ? 'bg-green-400' : 'bg-white/20'}`} />
              <span className={`text-xs ${r.ok ? 'text-green-400' : 'text-white/30'}`}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={!allOk || loading}
          className="w-full btn-primary py-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Activation...</> : 'Activer mon compte →'}
        </button>
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateContent />
    </Suspense>
  )
}
