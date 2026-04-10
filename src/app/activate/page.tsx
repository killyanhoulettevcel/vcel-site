'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Gift, Zap, Building2, Sparkles } from 'lucide-react'
import { signIn } from 'next-auth/react'

const PLAN_META: Record<string, { label: string; icon: React.ElementType; color: string; features: string[] }> = {
  starter: {
    label: 'Starter', icon: Sparkles, color: '#5C7589',
    features: ['Dashboard CA & finances', 'Gestion des factures', 'CRM leads intégré', 'Résumé hebdo par email'],
  },
  pro: {
    label: 'Pro', icon: Zap, color: '#0288D1',
    features: ['Tout le plan Starter', 'Coach IA business', 'Synchronisation Google Sheets', 'Objectifs & suivi'],
  },
  business: {
    label: 'Business', icon: Building2, color: '#0D1B2A',
    features: ['Tout le plan Pro', 'Multi-utilisateurs', 'Export FEC', 'Signature électronique'],
  },
}

// ── Flow post-checkout (pas de token, juste plan) ─────────────────────────────
function PostCheckoutView({ plan, billing }: { plan: string; billing: string }) {
  const router   = useRouter()
  const meta     = PLAN_META[plan] || PLAN_META.pro
  const PlanIcon = meta.icon
  const isTrial  = billing === 'monthly' && (plan === 'starter' || plan === 'pro')

  useEffect(() => {
    // Rediriger vers le dashboard après 4 secondes
    const t = setTimeout(() => router.push('/dashboard/client/onboarding'), 4000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="max-w-md w-full">

        {/* Icône succès */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #E8F5E9, #F1F8E9)', border: '1px solid #C8E6C9' }}>
          {isTrial
            ? <Gift size={28} style={{ color: '#2E7D32' }} />
            : <CheckCircle size={28} style={{ color: '#2E7D32' }} />
          }
        </div>

        {/* Titre */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl mb-2" style={{ color: '#0D1B2A' }}>
            {isTrial ? 'Votre essai démarre !' : 'Bienvenue sur VCEL !'}
          </h1>
          <p className="text-sm" style={{ color: '#7A90A4' }}>
            {isTrial
              ? `Votre plan ${meta.label} est actif — 14 jours gratuits, aucun débit avant la fin de l'essai.`
              : `Votre abonnement ${meta.label} est activé. Accès immédiat à votre espace client.`
            }
          </p>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid rgba(13,27,42,0.08)', boxShadow: '0 4px 16px rgba(13,27,42,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(79,195,247,0.1)' }}>
              <PlanIcon size={15} style={{ color: meta.color }} />
            </div>
            <span className="font-semibold" style={{ color: '#0D1B2A' }}>Plan {meta.label}</span>
            {isTrial && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                14j gratuits
              </span>
            )}
          </div>
          <div className="space-y-2">
            {meta.features.map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.2)' }}>
                  <CheckCircle size={9} style={{ color: '#0288D1' }} />
                </div>
                <span style={{ color: '#3D5166' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Email envoyé */}
        <div className="rounded-xl p-4 mb-6 text-center" style={{ background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)' }}>
          <p className="text-sm" style={{ color: '#0288D1' }}>
            📧 Un email d'activation vous a été envoyé. Vérifiez votre boîte mail pour créer votre mot de passe.
          </p>
        </div>

        {/* Redirection auto */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Loader2 size={14} className="animate-spin" style={{ color: '#A8BDD0' }} />
            <p className="text-xs" style={{ color: '#A8BDD0' }}>Redirection vers votre dashboard...</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/client/onboarding')}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: '#0D1B2A', boxShadow: '0 4px 16px rgba(13,27,42,0.20)' }}
          >
            Accéder à mon dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Flow token (email n8n) ─────────────────────────────────────────────────────
function TokenActivateView({ token }: { token: string }) {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const rules = [
    { label: '8 caractères minimum',           ok: password.length >= 8 },
    { label: 'Une majuscule',                   ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre',                      ok: /[0-9]/.test(password) },
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
      setError(data.error || "Erreur lors de l'activation")
      setLoading(false)
      return
    }

    setSuccess(true)
    await signIn('credentials', {
      email: data.email,
      password,
      callbackUrl: '/dashboard/client/onboarding',
      redirect: true,
    })
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="text-center">
        <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#2E7D32' }} />
        <h1 className="font-display text-2xl mb-2" style={{ color: '#0D1B2A' }}>Compte activé !</h1>
        <p className="text-sm" style={{ color: '#7A90A4' }}>Connexion en cours...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: '#0D1B2A' }}>
            <span className="font-display font-bold text-xl text-white">V</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: '#0D1B2A' }}>Activez votre compte</h1>
          <p className="text-sm" style={{ color: '#7A90A4' }}>Choisissez votre mot de passe pour accéder à VCEL</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid rgba(13,27,42,0.08)', boxShadow: '0 8px 32px rgba(13,27,42,0.08)' }}>

          {/* Champs */}
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D5166' }}>Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Choisissez un mot de passe"
                  onKeyDown={e => e.key === 'Enter' && allOk && handleSubmit()}
                  style={{
                    width: '100%', border: '1px solid rgba(13,27,42,0.08)', borderRadius: '10px',
                    padding: '10px 40px 10px 14px', fontSize: '14px', color: '#0D1B2A',
                    outline: 'none', fontFamily: 'DM Sans, sans-serif', background: 'white',
                  }}
                  onFocus={e => { e.target.style.border = '1px solid #0288D1'; e.target.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.15)' }}
                  onBlur={e  => { e.target.style.border = '1px solid rgba(13,27,42,0.08)'; e.target.style.boxShadow = 'none' }}
                />
                <button onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#A8BDD0' }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3D5166' }}>Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                onKeyDown={e => e.key === 'Enter' && allOk && handleSubmit()}
                style={{
                  width: '100%', border: '1px solid rgba(13,27,42,0.08)', borderRadius: '10px',
                  padding: '10px 14px', fontSize: '14px', color: '#0D1B2A',
                  outline: 'none', fontFamily: 'DM Sans, sans-serif', background: 'white',
                }}
                onFocus={e => { e.target.style.border = '1px solid #0288D1'; e.target.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.15)' }}
                onBlur={e  => { e.target.style.border = '1px solid rgba(13,27,42,0.08)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Règles */}
          <div className="space-y-1.5 mb-5">
            {rules.map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full`}
                  style={{ background: r.ok ? '#22c55e' : 'rgba(13,27,42,0.15)' }} />
                <span className="text-xs" style={{ color: r.ok ? '#22c55e' : '#A8BDD0' }}>{r.label}</span>
              </div>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <div className="rounded-xl px-4 py-3 mb-4" style={{ background: '#FFEBEE', border: '1px solid #FFCDD2' }}>
              <p className="text-sm" style={{ color: '#C62828' }}>{error}</p>
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={handleSubmit}
            disabled={!allOk || loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{
              background: !allOk ? '#A8BDD0' : loading ? '#2C4A6E' : '#0D1B2A',
              cursor: !allOk || loading ? 'not-allowed' : 'pointer',
              boxShadow: allOk ? '0 4px 16px rgba(13,27,42,0.20)' : 'none',
            }}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Activation...</>
              : 'Activer mon compte →'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lien invalide ─────────────────────────────────────────────────────────────
function InvalidView() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="text-center max-w-sm">
        <XCircle size={48} className="mx-auto mb-4" style={{ color: '#EF4444' }} />
        <h1 className="font-display text-xl font-bold mb-2" style={{ color: '#0D1B2A' }}>Lien invalide</h1>
        <p className="text-sm" style={{ color: '#7A90A4' }}>Ce lien d'activation est invalide ou a expiré. Contactez le support.</p>
      </div>
    </div>
  )
}

// ── Routeur principal ─────────────────────────────────────────────────────────
function ActivateContent() {
  const params  = useSearchParams()
  const token   = params.get('token')   || ''
  const planRaw = params.get('plan')    || '' // ex: "pro_monthly" ou "starter_annual"
  const billing = params.get('billing') || ''

  // Extraire plan et billing depuis le param plan (ex: "pro_monthly")
  let plan    = planRaw
  let billingFinal = billing
  if (planRaw.includes('_')) {
    const parts  = planRaw.split('_')
    plan         = parts[0]
    billingFinal = billingFinal || parts[1] || 'monthly'
  }

  // Flow 1 : token présent → activation par mot de passe
  if (token) return <TokenActivateView token={token} />

  // Flow 2 : plan présent → post-checkout
  if (plan && PLAN_META[plan]) return <PostCheckoutView plan={plan} billing={billingFinal} />

  // Ni l'un ni l'autre
  return <InvalidView />
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F4F0' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: '#0D1B2A' }} />
      </div>
    }>
      <ActivateContent />
    </Suspense>
  )
}