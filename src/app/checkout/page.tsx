'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, Shield, RefreshCw, ArrowLeft, Zap, Lock, CreditCard } from 'lucide-react'

const features = [
  'Dashboard CA & finances en temps réel',
  'CRM leads intégré',
  'Coach IA business personnalisé',
  'Résumé hebdomadaire par email',
  'Synchronisation Google Sheets',
  'Gestion des factures',
  'Objectifs & suivi de progression',
  'Configuration incluse par notre équipe',
  'Support par email',
]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const plan         = searchParams.get('plan') || 'monthly'
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [email,   setEmail]   = useState('')
  const [coupon,  setCoupon]  = useState('')

  const isAnnual    = plan === 'annual'
  const prixMensuel = isAnnual ? 39 : 49
  const priceId     = isAnnual
    ? 'price_1TABiy2fhxDJntt99715Z9e4'
    : 'price_1T1QK42fhxDJntt9VCBc77Gs'

  const handleCheckout = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId, annual: isAnnual, email: email || undefined, coupon: coupon || undefined }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      if (data.url)   window.location.href = data.url
    } catch {
      setError('Erreur de connexion — réessayez')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="VCEL" className="h-7 w-auto" style={{ mixBlendMode: 'multiply' }} />
          </a>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
            <Lock size={12} className="text-emerald-500" />
            Paiement sécurisé par Stripe
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8">

          {/* Colonne gauche — récap offre */}
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-8 hover:text-[var(--navy)] transition-colors">
              <ArrowLeft size={16} /> Retour
            </button>

            <div className="mb-6">
              <span className="badge badge-cyan mb-3 inline-flex">
                {isAnnual ? '−20% offre annuelle' : 'Offre mensuelle'}
              </span>
              <h1 className="font-display text-3xl text-[var(--navy)] mb-2">
                Abonnement VCEL
              </h1>
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display text-5xl text-[var(--navy)]">{prixMensuel}€</span>
                <span className="text-[var(--text-muted)] mb-2">/ mois</span>
              </div>
              {isAnnual
                ? <p className="text-emerald-600 text-sm font-medium">Facturé 468€/an · économisez 120€</p>
                : <p className="text-[var(--text-muted)] text-sm">Sans engagement · résiliable à tout moment</p>
              }
            </div>

            {/* Features */}
            <div className="card-glass p-5 space-y-2.5 mb-6">
              {features.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-emerald-600" />
                  </div>
                  <span className="text-[var(--text-secondary)] text-sm">{f}</span>
                </div>
              ))}
            </div>

            {/* Garanties */}
            <div className="flex items-center gap-6 text-[var(--text-muted)] text-xs flex-wrap">
              <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-500" /> Paiement 100% sécurisé</span>
              <span className="flex items-center gap-1.5"><RefreshCw size={12} className="text-cyan-500" /> Annulation libre</span>
              <span className="flex items-center gap-1.5"><Zap size={12} className="text-amber-500" /> Accès immédiat</span>
            </div>
          </div>

          {/* Colonne droite — formulaire */}
          <div>
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-lg-navy">
              <h2 className="font-semibold text-[var(--navy)] text-lg mb-6">Finaliser votre commande</h2>

              <div className="space-y-4 mb-6">
                {/* Plan toggle */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Plan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <a href="/checkout?plan=monthly"
                      className={`p-3 rounded-xl border text-center text-sm font-medium transition-all cursor-pointer ${
                        !isAnnual
                          ? 'border-[var(--navy)] bg-navy-50 text-[var(--navy)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                      }`}>
                      <p className="font-bold">49€/mois</p>
                      <p className="text-xs opacity-70">Mensuel</p>
                    </a>
                    <a href="/checkout?plan=annual"
                      className={`p-3 rounded-xl border text-center text-sm font-medium transition-all cursor-pointer relative ${
                        isAnnual
                          ? 'border-[var(--navy)] bg-navy-50 text-[var(--navy)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                      }`}>
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">−20%</span>
                      <p className="font-bold">39€/mois</p>
                      <p className="text-xs opacity-70">Annuel</p>
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                    Email <span className="text-[var(--text-light)] font-normal normal-case">(optionnel — pré-rempli sur Stripe)</span>
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    className="input-field" />
                </div>

                {/* Code promo */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                    Code promo
                  </label>
                  <div className="flex gap-2">
                    <input type="text" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                      placeholder="SOLO19"
                      className="input-field flex-1 uppercase" />
                  </div>
                  {coupon === 'SOLO19' && (
                    <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1">
                      <Check size={11} /> Code valide — 1er mois à 19€
                    </p>
                  )}
                </div>
              </div>

              {/* Récap prix */}
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-5 border border-[var(--border)]">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[var(--text-secondary)]">Abonnement VCEL {isAnnual ? 'annuel' : 'mensuel'}</span>
                  <span className="text-[var(--navy)] font-semibold">{prixMensuel}€/mois</span>
                </div>
                {coupon === 'SOLO19' && (
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-emerald-600">Code SOLO19</span>
                    <span className="text-emerald-600 font-semibold">−30€ ce mois</span>
                  </div>
                )}
                <div className="border-t border-[var(--border)] pt-2 mt-2 flex items-center justify-between">
                  <span className="text-[var(--navy)] font-semibold text-sm">
                    {coupon === 'SOLO19' ? "Aujourd'hui" : "Total"}
                  </span>
                  <span className="text-[var(--navy)] font-bold text-lg">
                    {coupon === 'SOLO19' ? '19€' : `${prixMensuel}€`}
                  </span>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-[var(--navy)] hover:bg-[var(--navy-light)] disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-md-navy text-sm group"
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Redirection vers Stripe...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} className="text-cyan-400" />
                    Payer avec Stripe
                    <Lock size={13} className="ml-auto opacity-50" />
                  </>
                )}
              </button>

              <p className="text-center text-[var(--text-light)] text-xs mt-4 leading-relaxed">
                En cliquant, vous serez redirigé vers Stripe pour finaliser le paiement en toute sécurité.
                Vous pouvez annuler à tout moment depuis votre espace client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-100 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[var(--border-hover)] border-t-navy-700 rounded-full animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}