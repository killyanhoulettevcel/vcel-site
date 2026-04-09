'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  Check, Shield, RefreshCw, ArrowLeft, Zap,
  Lock, CreditCard, Clock, AlertCircle, Gift, Sparkles, Building2
} from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PLAN_META: Record<string, {
  label: string
  icon: React.ElementType
  priceMonthly: number
  priceAnnual: number
  features: string[]
}> = {
  starter: {
    label: 'Starter', icon: Sparkles, priceMonthly: 19, priceAnnual: 15,
    features: ['Dashboard CA & finances', 'Gestion des factures', 'CRM leads intégré', 'Résumé hebdo par email', 'Support par email'],
  },
  pro: {
    label: 'Pro', icon: Zap, priceMonthly: 39, priceAnnual: 31,
    features: ['Tout le plan Starter', 'Coach IA business', 'Synchronisation Google Sheets', 'Objectifs & suivi de progression', 'Configuration incluse', 'Support prioritaire'],
  },
  business: {
    label: 'Business', icon: Building2, priceMonthly: 69, priceAnnual: 55,
    features: ["Tout le plan Pro", "Multi-utilisateurs (jusqu'à 5)", 'Export comptable FEC', 'Signature électronique', 'Rappels automatiques impayés', 'Onboarding dédié', 'Support téléphonique'],
  },
}

const isTrial = (plan: string, billing: string) =>
  (plan === 'starter' || plan === 'pro') && billing === 'monthly'

// ── Formulaire Stripe ─────────────────────────────────────────────────────────
function PaymentForm({ plan, billing, email, customerId, onSuccess }: {
  plan: string; billing: string; email: string; customerId: string
  onSuccess: (trialEnd?: number) => void
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [acceptCGV, setAcceptCGV]         = useState(false)
  const [acceptRetract, setAcceptRetract] = useState(false)

  const trial    = isTrial(plan, billing)
  const canPay   = acceptCGV && acceptRetract
  const meta     = PLAN_META[plan] || PLAN_META.pro
  const price    = billing === 'annual' ? meta.priceAnnual : meta.priceMonthly

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !canPay) return
    setLoading(true); setError('')

    const { setupIntent, error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/activate?plan=${plan}_${billing}` },
      redirect: 'if_required',
    })

    if (stripeError) { setError(stripeError.message || 'Erreur'); setLoading(false); return }

    if (setupIntent?.status === 'succeeded') {
      const res  = await fetch('/api/stripe/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupIntentId: setupIntent.id, customerId, email }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      onSuccess(data.trialEnd)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Récap compact */}
      <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: '#F5F4F0', border: '1px solid rgba(13,27,42,0.08)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#0D1B2A' }}>VCEL {meta.label} · {billing === 'annual' ? 'Annuel' : 'Mensuel'}</p>
          {trial && <p className="text-xs" style={{ color: '#2E7D32' }}>14 jours gratuits — aucun débit avant le J+14</p>}
        </div>
        <span className="font-bold text-lg" style={{ color: trial ? '#2E7D32' : '#0D1B2A' }}>
          {trial ? '0€' : billing === 'annual' ? `${price * 12}€` : `${price}€`}
        </span>
      </div>

      {/* Stripe */}
      <div className="rounded-2xl p-4" style={{ background: '#F5F4F0', border: '1px solid rgba(13,27,42,0.08)' }}>
        <PaymentElement options={{ layout: 'tabs', appearance: { theme: 'flat',
          variables: { colorPrimary: '#0D1B2A', colorBackground: '#ffffff', colorText: '#0D1B2A', colorDanger: '#dc2626', fontFamily: 'DM Sans, sans-serif', spacingUnit: '4px', borderRadius: '10px', colorTextPlaceholder: '#A8BDD0' },
          rules: {
            '.Input': { border: '1px solid rgba(13,27,42,0.08)', boxShadow: 'none', fontSize: '14px', padding: '10px 14px' },
            '.Input:focus': { border: '1px solid #0288D1', boxShadow: '0 0 0 3px rgba(79,195,247,0.15)' },
            '.Label': { fontSize: '12px', fontWeight: '600', color: '#3D5166' },
            '.Tab': { border: '1px solid rgba(13,27,42,0.08)', borderRadius: '10px' },
            '.Tab--selected': { border: '1px solid #0D1B2A', backgroundColor: '#0D1B2A', color: 'white' },
          },
        }}} />
      </div>

      {/* Note trial */}
      {trial && (
        <div className="flex items-start gap-2.5 px-1">
          <Gift size={14} style={{ color: '#2E7D32', marginTop: 1, flexShrink: 0 }} />
          <p className="text-xs leading-relaxed" style={{ color: '#5C7589' }}>
            Votre carte ne sera <strong>pas débitée pendant 14 jours</strong>. À l'issue de l'essai, votre abonnement démarrera automatiquement à <strong>{price}€/mois</strong>. Annulable à tout moment avant.
          </p>
        </div>
      )}

      {/* Cases légales */}
      <div className="space-y-3 rounded-xl p-4" style={{ background: '#F5F4F0', border: '1px solid rgba(13,27,42,0.08)' }}>
        {[
          { checked: acceptRetract, set: setAcceptRetract, text: "Je renonce expressément à mon droit de rétractation conformément à l'article L221-28 du Code de la consommation, le service numérique étant fourni immédiatement après inscription." },
          { checked: acceptCGV, set: setAcceptCGV, text: null },
        ].map((item, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer">
            <div onClick={() => item.set(!item.checked)}
              className="shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all"
              style={{ backgroundColor: item.checked ? '#0D1B2A' : 'white', border: item.checked ? '2px solid #0D1B2A' : '2px solid rgba(13,27,42,0.20)', cursor: 'pointer' }}>
              {item.checked && <Check size={11} style={{ color: 'white' }} />}
            </div>
            <span className="text-xs leading-relaxed" style={{ color: '#3D5166' }}>
              {i === 0 ? item.text : <>J'accepte les <a href="/legal?tab=cgv" target="_blank" className="text-cyan-600 hover:underline font-medium">CGV</a>, les <a href="/legal?tab=cgu" target="_blank" className="text-cyan-600 hover:underline font-medium">CGU</a> et la <a href="/legal?tab=confidentialite" target="_blank" className="text-cyan-600 hover:underline font-medium">politique de confidentialité</a>.</>}
              {' '}<span style={{ color: '#C62828', fontWeight: 600 }}>*</span>
            </span>
          </label>
        ))}
        <p className="text-xs" style={{ color: '#A8BDD0' }}><span style={{ color: '#C62828' }}>*</span> Champs obligatoires.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button type="submit" disabled={!stripe || loading || !canPay}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all"
        style={{ background: !canPay ? '#A8BDD0' : loading ? '#2C4A6E' : '#0D1B2A', color: 'white', cursor: loading || !stripe || !canPay ? 'not-allowed' : 'pointer', boxShadow: canPay ? '0 4px 16px rgba(13,27,42,0.20)' : 'none' }}>
        {loading
          ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Traitement...</>
          : trial
            ? <><Gift size={14} style={{ color: canPay ? '#4FC3F7' : 'white' }} />Démarrer mes 14 jours gratuits</>
            : <><Lock size={14} style={{ color: canPay ? '#4FC3F7' : 'white' }} />Confirmer l'abonnement</>
        }
      </button>

      {!canPay && <p className="text-center text-xs" style={{ color: '#A8BDD0' }}>Cochez les deux cases pour continuer.</p>}
      <p className="text-center text-xs" style={{ color: '#A8BDD0' }}>Paiement sécurisé · Chiffrement SSL · Powered by Stripe</p>
    </form>
  )
}

// ── Succès ────────────────────────────────────────────────────────────────────
function SuccessView({ plan, billing, trialEnd }: { plan: string; billing: string; trialEnd?: number }) {
  const trial = isTrial(plan, billing)
  const date  = trialEnd ? new Date(trialEnd * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const meta  = PLAN_META[plan] || PLAN_META.pro
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#E8F5E9', border: '2px solid #C8E6C9' }}>
        {trial ? <Gift size={28} style={{ color: '#2E7D32' }} /> : <Check size={28} style={{ color: '#2E7D32' }} />}
      </div>
      <h2 className="font-display text-2xl mb-2" style={{ color: '#0D1B2A' }}>{trial ? 'Votre essai démarre !' : 'Abonnement activé !'}</h2>
      <p className="text-sm mb-2" style={{ color: '#3D5166' }}>
        {trial && date ? <>Accès complet au plan <strong>{meta.label}</strong> jusqu'au <strong>{date}</strong>.</> : <>Votre abonnement <strong>VCEL {meta.label}</strong> est actif.</>}
      </p>
      {trial && <p className="text-xs mb-6" style={{ color: '#A8BDD0' }}>Vous recevrez un rappel par email 3 jours avant la fin de l'essai.</p>}
      <a href="/dashboard" className="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white mt-4" style={{ background: '#0D1B2A', boxShadow: '0 4px 16px rgba(13,27,42,0.20)' }}>
        Accéder à mon dashboard →
      </a>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
function CheckoutContent() {
  const searchParams = useSearchParams()
  const plan    = searchParams.get('plan')    || 'pro'
  const billing = searchParams.get('billing') || 'monthly'

  const meta    = PLAN_META[plan] || PLAN_META.pro
  const trial   = isTrial(plan, billing)
  const price   = billing === 'annual' ? meta.priceAnnual : meta.priceMonthly
  const PlanIcon = meta.icon

  const [step, setStep]               = useState<'info' | 'payment' | 'success'>('info')
  const [email, setEmail]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [customerId, setCustomerId]   = useState('')
  const [trialEnd, setTrialEnd]       = useState<number | undefined>()

  const handleContinue = async () => {
    if (!email) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/stripe/intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing, email }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setClientSecret(data.clientSecret)
      setCustomerId(data.customerId || '')
      setStep('payment')
    } catch { setError('Erreur de connexion') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F4F0' }}>
      <header className="bg-white border-b px-6 py-4" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/"><img src="/logo.png" alt="VCEL" className="h-7 w-auto" style={{ mixBlendMode: 'darken' }} /></a>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#7A90A4' }}>
            <Lock size={12} style={{ color: '#10b981' }} />Paiement 100% sécurisé par Stripe
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8">

          {/* Gauche */}
          <div>
            <a href="/#tarifs" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors" style={{ color: '#7A90A4' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#0D1B2A'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#7A90A4'}>
              <ArrowLeft size={16} /> Retour aux tarifs
            </a>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E0F7FA', border: '1px solid #B2EBF2' }}>
                <PlanIcon size={16} style={{ color: '#0288D1' }} />
              </div>
              <span className="font-semibold" style={{ color: '#0D1B2A' }}>VCEL {meta.label}</span>
              {billing === 'annual' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">−20%</span>}
            </div>

            <div className="mb-4">
              <div className="flex items-end gap-2">
                <span className="font-display text-5xl" style={{ color: '#0D1B2A' }}>{price}€</span>
                <span className="mb-2 text-sm" style={{ color: '#7A90A4' }}>/mois</span>
              </div>
              {billing === 'annual' && <p className="text-sm font-medium" style={{ color: '#2E7D32' }}>Facturé {price * 12}€/an · économisez {(meta.priceMonthly - price) * 12}€</p>}
            </div>

            {trial && (
              <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #E8F5E9, #F1F8E9)', border: '1px solid #C8E6C9' }}>
                <Gift size={16} style={{ color: '#2E7D32', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1B5E20' }}>14 jours gratuits</p>
                  <p className="text-xs" style={{ color: '#388E3C' }}>Carte requise · Aucun débit pendant 14 jours · Annulable avant</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl p-5 space-y-2.5 mb-6" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(13,27,42,0.08)' }}>
              {meta.features.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E8F5E9', border: '1px solid #C8E6C9' }}>
                    <Check size={11} style={{ color: '#2E7D32' }} />
                  </div>
                  <span className="text-sm" style={{ color: '#3D5166' }}>{f}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-5 flex-wrap text-xs" style={{ color: '#A8BDD0' }}>
              <span className="flex items-center gap-1.5"><Shield size={12} style={{ color: '#10b981' }} /> SSL 256-bit</span>
              <span className="flex items-center gap-1.5"><RefreshCw size={12} style={{ color: '#0288D1' }} /> Annulation libre</span>
              <span className="flex items-center gap-1.5"><Clock size={12} style={{ color: '#f59e0b' }} /> Accès immédiat</span>
            </div>
          </div>

          {/* Droite */}
          <div className="rounded-2xl p-6 md:p-8" style={{ background: 'white', border: '1px solid rgba(13,27,42,0.08)', boxShadow: '0 8px 32px rgba(13,27,42,0.10)' }}>

            {step === 'success' && <SuccessView plan={plan} billing={billing} trialEnd={trialEnd} />}

            {step === 'info' && (
              <>
                <h2 className="font-semibold text-lg mb-1" style={{ color: '#0D1B2A' }}>
                  {trial ? 'Démarrer votre essai gratuit' : 'Votre commande'}
                </h2>
                <p className="text-sm mb-6" style={{ color: '#7A90A4' }}>
                  {trial ? "Entrez votre email pour continuer. Votre carte sera demandée à l'étape suivante — aucun débit pendant 14 jours." : "Entrez votre email pour accéder au paiement sécurisé."}
                </p>

                {/* Toggle billing */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#3D5166' }}>Facturation</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'monthly', label: `${meta.priceMonthly}€/mois`, sub: trial ? '14j gratuits inclus' : 'Sans engagement' },
                      { id: 'annual',  label: `${meta.priceAnnual}€/mois`,  sub: `${meta.priceAnnual * 12}€/an · −20%`, badge: true },
                    ].map(b => (
                      <a key={b.id} href={`/checkout?plan=${plan}&billing=${b.id}`}
                        className="p-3 rounded-xl text-center transition-all relative block"
                        style={{ border: billing === b.id ? '2px solid #0D1B2A' : '1px solid rgba(13,27,42,0.08)', background: billing === b.id ? '#f0f4f8' : 'white' }}>
                        {b.badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#2E7D32' }}>Économies</span>}
                        <p className="font-bold text-sm" style={{ color: '#0D1B2A' }}>{b.label}</p>
                        <p className="text-xs" style={{ color: '#7A90A4' }}>{b.sub}</p>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Récap */}
                <div className="rounded-xl p-4 mb-5" style={{ background: '#F5F4F0', border: '1px solid rgba(13,27,42,0.08)' }}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span style={{ color: '#3D5166' }}>VCEL {meta.label} · {billing === 'annual' ? 'Annuel' : 'Mensuel'}</span>
                    <span className="font-semibold" style={{ color: '#0D1B2A' }}>{price}€/mois</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex items-center justify-between" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
                    <span className="font-semibold text-sm" style={{ color: '#0D1B2A' }}>Total aujourd'hui</span>
                    <span className="font-bold text-xl" style={{ color: trial ? '#2E7D32' : '#0D1B2A' }}>
                      {trial ? '0€' : billing === 'annual' ? `${price * 12}€` : `${price}€`}
                    </span>
                  </div>
                  {trial && <p className="text-xs mt-1" style={{ color: '#7A90A4' }}>Puis {price}€/mois automatiquement à partir du J+14</p>}
                </div>

                {/* Email */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#3D5166' }}>Adresse email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.fr"
                    onKeyDown={e => e.key === 'Enter' && email && handleContinue()}
                    style={{ width: '100%', background: 'white', border: '1px solid rgba(13,27,42,0.08)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#0D1B2A', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                    onFocus={e => { e.target.style.border = '1px solid #0288D1'; e.target.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.15)' }}
                    onBlur={e  => { e.target.style.border = '1px solid rgba(13,27,42,0.08)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: '#FFEBEE', border: '1px solid #FFCDD2' }}>
                    <AlertCircle size={14} style={{ color: '#C62828' }} />
                    <p className="text-sm" style={{ color: '#C62828' }}>{error}</p>
                  </div>
                )}

                <button onClick={handleContinue} disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: loading ? '#2C4A6E' : '#0D1B2A', color: 'white', cursor: loading || !email ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(13,27,42,0.20)', opacity: !email ? 0.6 : 1 }}>
                  {loading
                    ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Chargement...</>
                    : <><CreditCard size={15} style={{ color: '#4FC3F7' }} />Continuer vers le paiement</>
                  }
                </button>
                <p className="text-center text-xs mt-3" style={{ color: '#A8BDD0' }}>
                  {trial ? 'Carte requise · Aucun débit pendant 14 jours · Annulable avant' : "Vos informations de paiement à l'étape suivante"}
                </p>
              </>
            )}

            {step === 'payment' && clientSecret && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep('info')} className="p-1.5 rounded-lg" style={{ color: '#7A90A4' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="font-semibold" style={{ color: '#0D1B2A' }}>Informations de paiement</h2>
                </div>
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat' } }}>
                  <PaymentForm
                    plan={plan} billing={billing} email={email} customerId={customerId}
                    onSuccess={(te) => { setTrialEnd(te); setStep('success') }}
                  />
                </Elements>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F4F0' }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#0D1B2A', borderTopColor: 'transparent' }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}