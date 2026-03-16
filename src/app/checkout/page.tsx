'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements, PaymentElement,
  useStripe, useElements
} from '@stripe/react-stripe-js'
import {
  Check, Shield, RefreshCw, ArrowLeft, Zap,
  Lock, CreditCard, Clock, AlertCircle
} from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const features = [
  'Dashboard CA & finances en temps réel',
  'CRM leads intégré',
  'Coach IA business personnalisé',
  'Résumé hebdomadaire par email',
  'Synchronisation Google Sheets',
  'Gestion des factures & objectifs',
  'Configuration incluse par notre équipe',
  'Support par email réactif',
]

// ── Formulaire de paiement Stripe ────────────────────────────────────────────
function PaymentForm({
  plan, email, coupon, customerId, type, onSuccess
}: {
  plan: string
  email: string
  coupon: string
  customerId: string
  type: 'payment' | 'setup'
  onSuccess: () => void
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [acceptCGV,      setAcceptCGV]      = useState(false)
  const [acceptRetract,  setAcceptRetract]  = useState(false)

  const canPay = acceptCGV && acceptRetract

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !canPay) return
    setLoading(true); setError('')

    try {
      if (type === 'payment') {
        const { error: stripeError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/activate?plan=annual&email=${encodeURIComponent(email)}`,
          },
        })
        if (stripeError) { setError(stripeError.message || 'Erreur'); setLoading(false); return }
      } else {
        const { setupIntent, error: stripeError } = await stripe.confirmSetup({
          elements,
          confirmParams: { return_url: `${window.location.origin}/activate?plan=monthly` },
          redirect: 'if_required',
        })
        if (stripeError) { setError(stripeError.message || 'Erreur'); setLoading(false); return }

        if (setupIntent?.status === 'succeeded') {
          const res = await fetch('/api/stripe/confirm', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ setupIntentId: setupIntent.id, customerId, email, coupon }),
          })
          const data = await res.json()
          if (data.error) { setError(data.error); setLoading(false); return }
          onSuccess()
          return
        }
      }
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border)]">
        <PaymentElement options={{
          layout: 'tabs',
          appearance: {
            theme: 'flat',
            variables: {
              colorPrimary:         '#0D1B2A',
              colorBackground:      '#ffffff',
              colorText:            '#0D1B2A',
              colorDanger:          '#dc2626',
              fontFamily:           'DM Sans, sans-serif',
              spacingUnit:          '4px',
              borderRadius:         '10px',
              colorTextPlaceholder: '#A8BDD0',
            },
            rules: {
              '.Input': {
                border:    '1px solid rgba(13,27,42,0.08)',
                boxShadow: 'none',
                fontSize:  '14px',
                padding:   '10px 14px',
              },
              '.Input:focus': {
                border:    '1px solid #0288D1',
                boxShadow: '0 0 0 3px rgba(79,195,247,0.15)',
              },
              '.Label': {
                fontSize:   '12px',
                fontWeight: '600',
                color:      '#3D5166',
              },
              '.Tab': {
                border:       '1px solid rgba(13,27,42,0.08)',
                borderRadius: '10px',
              },
              '.Tab--selected': {
                border:          '1px solid #0D1B2A',
                backgroundColor: '#0D1B2A',
                color:           'white',
              },
            }
          }
        }} />
      </div>

      {/* ── Cases à cocher légales ── */}
      <div className="space-y-3 rounded-xl p-4" style={{ background: '#F5F4F0', border: '1px solid rgba(13,27,42,0.08)' }}>

        {/* Case 1 — Rétractation */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAcceptRetract(!acceptRetract)}
            className="shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{
              backgroundColor: acceptRetract ? '#0D1B2A' : 'white',
              border: acceptRetract ? '2px solid #0D1B2A' : '2px solid rgba(13,27,42,0.20)',
              cursor: 'pointer',
            }}>
            {acceptRetract && <Check size={11} style={{ color: 'white' }} />}
          </div>
          <span className="text-xs leading-relaxed" style={{ color: '#3D5166' }}>
            Je renonce expressément à mon droit de rétractation conformément à l'article L221-28 du Code de la consommation, 
            le service numérique étant fourni immédiatement après le paiement. <span style={{ color: '#C62828', fontWeight: 600 }}>*</span>
          </span>
        </label>

        {/* Case 2 — CGV/CGU/Confidentialité */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAcceptCGV(!acceptCGV)}
            className="shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{
              backgroundColor: acceptCGV ? '#0D1B2A' : 'white',
              border: acceptCGV ? '2px solid #0D1B2A' : '2px solid rgba(13,27,42,0.20)',
              cursor: 'pointer',
            }}>
            {acceptCGV && <Check size={11} style={{ color: 'white' }} />}
          </div>
          <span className="text-xs leading-relaxed" style={{ color: '#3D5166' }}>
            J'accepte les{' '}
            <a href="/legal?tab=cgv" target="_blank" className="text-cyan-600 hover:underline font-medium">CGV</a>,{' '}
            les{' '}
            <a href="/legal?tab=cgu" target="_blank" className="text-cyan-600 hover:underline font-medium">CGU</a>{' '}
            et la{' '}
            <a href="/legal?tab=confidentialite" target="_blank" className="text-cyan-600 hover:underline font-medium">politique de confidentialité</a>{' '}
            de VCEL. <span style={{ color: '#C62828', fontWeight: 600 }}>*</span>
          </span>
        </label>

        <p className="text-xs" style={{ color: '#A8BDD0' }}>
          <span style={{ color: '#C62828' }}>*</span> Champs obligatoires pour finaliser le paiement.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button type="submit" disabled={!stripe || loading || !canPay}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all"
        style={{
          background:  !canPay ? '#A8BDD0' : loading ? '#2C4A6E' : '#0D1B2A',
          color:       'white',
          cursor:      loading || !stripe || !canPay ? 'not-allowed' : 'pointer',
          boxShadow:   canPay ? '0 4px 16px rgba(13,27,42,0.20)' : 'none',
          opacity:     !stripe ? 0.6 : 1,
        }}>
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Traitement en cours...
          </>
        ) : (
          <>
            <Lock size={14} style={{ color: canPay ? '#4FC3F7' : 'white' }} />
            {type === 'payment' ? 'Payer 468€' : 'Commencer l\'abonnement'}
          </>
        )}
      </button>

      {!canPay && (
        <p className="text-center text-xs" style={{ color: '#A8BDD0' }}>
          Veuillez cocher les deux cases pour activer le paiement.
        </p>
      )}

      <p className="text-center text-xs" style={{ color: '#A8BDD0' }}>
        Paiement sécurisé · Chiffrement SSL · Powered by Stripe
      </p>
    </form>
  )
}

// ── Succès ───────────────────────────────────────────────────────────────────
function SuccessView({ plan }: { plan: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5">
        <Check size={28} className="text-emerald-600" />
      </div>
      <h2 className="font-display text-2xl mb-2" style={{ color: '#0D1B2A' }}>Paiement confirmé !</h2>
      <p className="text-sm mb-6" style={{ color: '#3D5166' }}>
        {plan === 'annual'
          ? 'Votre abonnement annuel est activé. Vous recevrez un email de confirmation.'
          : 'Votre abonnement mensuel est activé. Accès immédiat à votre espace client.'
        }
      </p>
      <a href="/dashboard" className="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white"
        style={{ background: '#0D1B2A', boxShadow: '0 4px 16px rgba(13,27,42,0.20)' }}>
        Accéder à mon dashboard →
      </a>
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────
function CheckoutContent() {
  const searchParams = useSearchParams()
  const plan         = searchParams.get('plan') === 'annual' ? 'annual' : 'monthly'

  const [step,          setStep]          = useState<'info' | 'payment' | 'success'>('info')
  const [clientSecret,  setClientSecret]  = useState('')
  const [intentType,    setIntentType]    = useState<'payment' | 'setup'>('setup')
  const [customerId,    setCustomerId]    = useState('')
  const [email,         setEmail]         = useState('')
  const [coupon,        setCoupon]        = useState('')
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [error,         setError]         = useState('')

  const isAnnual    = plan === 'annual'
  const prixDisplay = isAnnual ? '468€' : '49€/mois'

  const handleContinue = async () => {
    setLoadingIntent(true); setError('')
    try {
      const res  = await fetch('/api/stripe/intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan, email, coupon }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoadingIntent(false); return }
      setClientSecret(data.clientSecret)
      setIntentType(data.type)
      setCustomerId(data.customerId || '')
      setStep('payment')
    } catch { setError('Erreur de connexion') }
    setLoadingIntent(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F4F0' }}>
      {/* Header */}
      <header className="bg-white border-b px-6 py-4" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/">
            <img src="/logo.png" alt="VCEL" className="h-7 w-auto" style={{ mixBlendMode: 'darken' }} />
          </a>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#7A90A4' }}>
            <Lock size={12} style={{ color: '#10b981' }} />
            Paiement 100% sécurisé par Stripe
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8">

          {/* Colonne gauche — récap */}
          <div>
            <a href="/#tarifs" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
              style={{ color: '#7A90A4' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#0D1B2A'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#7A90A4'}>
              <ArrowLeft size={16} /> Retour aux tarifs
            </a>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: '#E0F7FA', color: '#00838F', border: '1px solid #B2EBF2' }}>
                {isAnnual ? '−20% offre annuelle' : 'Abonnement mensuel'}
              </div>
              <h1 className="font-display text-3xl mb-3" style={{ color: '#0D1B2A' }}>
                Abonnement VCEL
              </h1>
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display text-5xl" style={{ color: '#0D1B2A' }}>
                  {isAnnual ? '468€' : '49€'}
                </span>
                <span className="mb-2 text-sm" style={{ color: '#7A90A4' }}>
                  {isAnnual ? '/ an (39€/mois)' : '/ mois'}
                </span>
              </div>
              {isAnnual
                ? <p className="text-sm font-medium" style={{ color: '#2E7D32' }}>Économisez 120€ vs mensuel · Facturé en une fois</p>
                : <p className="text-sm" style={{ color: '#7A90A4' }}>Sans engagement · Résiliable à tout moment</p>
              }
            </div>

            {/* Features */}
            <div className="rounded-2xl p-5 space-y-2.5 mb-6"
              style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(13,27,42,0.08)' }}>
              {features.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#E8F5E9', border: '1px solid #C8E6C9' }}>
                    <Check size={11} style={{ color: '#2E7D32' }} />
                  </div>
                  <span className="text-sm" style={{ color: '#3D5166' }}>{f}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-5 flex-wrap text-xs" style={{ color: '#A8BDD0' }}>
              <span className="flex items-center gap-1.5"><Shield size={12} style={{ color: '#10b981' }} /> SSL 256-bit</span>
              <span className="flex items-center gap-1.5"><RefreshCw size={12} style={{ color: '#0288D1' }} /> Annulation libre</span>
              <span className="flex items-center gap-1.5"><Zap size={12} style={{ color: '#f59e0b' }} /> Accès immédiat</span>
            </div>
          </div>

          {/* Colonne droite — formulaire */}
          <div className="rounded-2xl p-6 md:p-8"
            style={{ background: 'white', border: '1px solid rgba(13,27,42,0.08)', boxShadow: '0 8px 32px rgba(13,27,42,0.10)' }}>

            {step === 'success' ? (
              <SuccessView plan={plan} />
            ) : step === 'info' ? (
              <>
                <h2 className="font-semibold text-lg mb-6" style={{ color: '#0D1B2A' }}>
                  Votre commande
                </h2>

                {/* Toggle plan */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#3D5166' }}>Plan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'monthly', label: '49€/mois', sub: 'Sans engagement' },
                      { id: 'annual',  label: '39€/mois', sub: '468€/an · −20%', badge: true },
                    ].map(p => (
                      <a key={p.id} href={`/checkout?plan=${p.id}`}
                        className="p-3 rounded-xl border text-center transition-all relative block"
                        style={{
                          border:     plan === p.id ? '2px solid #0D1B2A' : '1px solid rgba(13,27,42,0.08)',
                          background: plan === p.id ? '#f0f4f8' : 'white',
                          cursor:     'pointer',
                        }}>
                        {p.badge && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: '#2E7D32' }}>Économies</span>
                        )}
                        <p className="font-bold text-sm" style={{ color: '#0D1B2A' }}>{p.label}</p>
                        <p className="text-xs" style={{ color: '#7A90A4' }}>{p.sub}</p>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#3D5166' }}>
                    Email
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    style={{
                      width: '100%', background: 'white', border: '1px solid rgba(13,27,42,0.08)',
                      borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
                      color: '#0D1B2A', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    }}
                    onFocus={e => { e.target.style.border = '1px solid #0288D1'; e.target.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.15)' }}
                    onBlur={e  => { e.target.style.border = '1px solid rgba(13,27,42,0.08)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Code promo */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#3D5166' }}>
                    Code promo
                  </label>
                  <input type="text" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder="SOLOFREE"
                    style={{
                      width: '100%', background: 'white', border: '1px solid rgba(13,27,42,0.08)',
                      borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
                      color: '#0D1B2A', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                      textTransform: 'uppercase',
                    }}
                    onFocus={e => { e.target.style.border = '1px solid #0288D1'; e.target.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.15)' }}
                    onBlur={e  => { e.target.style.border = '1px solid rgba(13,27,42,0.08)'; e.target.style.boxShadow = 'none' }}
                  />
                  {coupon === 'SOLOFREE' && (
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#2E7D32' }}>
                      <Check size={11} /> Code valide — 1er mois offert
                    </p>
                  )}
                </div>

                {/* Récap */}
                <div className="rounded-xl p-4 mb-5" style={{ background: '#F5F4F0', border: '1px solid rgba(13,27,42,0.08)' }}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: '#3D5166' }}>VCEL {isAnnual ? 'Annuel' : 'Mensuel'}</span>
                    <span className="font-semibold" style={{ color: '#0D1B2A' }}>{prixDisplay}</span>
                  </div>
                  {coupon === 'SOLOFREE' && (
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span style={{ color: '#2E7D32' }}>Code SOLOFREE</span>
                      <span className="font-semibold" style={{ color: '#2E7D32' }}>−49€ (1er mois offert)</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-1 flex items-center justify-between" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
                    <span className="font-semibold text-sm" style={{ color: '#0D1B2A' }}>Total aujourd'hui</span>
                    <span className="font-bold text-xl" style={{ color: '#0D1B2A' }}>
                      {isAnnual ? (coupon === 'SOLOFREE' ? '419€' : '468€') : (coupon === 'SOLOFREE' ? '0€' : '49€')}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                    style={{ background: '#FFEBEE', border: '1px solid #FFCDD2' }}>
                    <AlertCircle size={14} style={{ color: '#C62828' }} />
                    <p className="text-sm" style={{ color: '#C62828' }}>{error}</p>
                  </div>
                )}

                <button onClick={handleContinue} disabled={loadingIntent || !email}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background:  loadingIntent ? '#2C4A6E' : '#0D1B2A',
                    color:       'white',
                    cursor:      loadingIntent || !email ? 'not-allowed' : 'pointer',
                    boxShadow:   '0 4px 16px rgba(13,27,42,0.20)',
                    opacity:     !email ? 0.6 : 1,
                  }}>
                  {loadingIntent ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <CreditCard size={15} style={{ color: '#4FC3F7' }} />
                      Continuer vers le paiement
                    </>
                  )}
                </button>

                <p className="text-center text-xs mt-3" style={{ color: '#A8BDD0' }}>
                  Votre carte sera demandée à l'étape suivante
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep('info')} className="p-1.5 rounded-lg transition-colors"
                    style={{ color: '#7A90A4' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="font-semibold" style={{ color: '#0D1B2A' }}>Informations de paiement</h2>
                </div>

                {/* Récap compact */}
                <div className="rounded-xl p-3 mb-5 flex items-center justify-between"
                  style={{ background: '#F5F4F0', border: '1px solid rgba(13,27,42,0.08)' }}>
                  <span className="text-sm" style={{ color: '#3D5166' }}>
                    VCEL {isAnnual ? 'Annuel' : 'Mensuel'}
                    {coupon === 'SOLOFREE' ? ' + SOLOFREE' : ''}
                  </span>
                  <span className="font-bold" style={{ color: '#0D1B2A' }}>
                    {isAnnual ? (coupon === 'SOLOFREE' ? '419€' : '468€') : (coupon === 'SOLOFREE' ? '0€' : '49€')}
                  </span>
                </div>

                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat' } }}>
                    <PaymentForm
                      plan={plan} email={email} coupon={coupon}
                      customerId={customerId} type={intentType}
                      onSuccess={() => setStep('success')}
                    />
                  </Elements>
                )}
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