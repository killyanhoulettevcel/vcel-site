'use client'
import { useState, useEffect } from 'react'
import { Check, Zap, ArrowRight, Shield, RefreshCw, Clock, Flame, Users, Star, Building2, Sparkles } from 'lucide-react'

// ── Stripe Price IDs ─────────────────────────────────────────────────────────
const PRICES = {
  starter: {
    monthly: 'price_1TKDU32fhxDJntt9gQReMoQ0',
    annual:  'price_1TKDUd2fhxDJntt9TasRT1qZ',
  },
  pro: {
    monthly: 'price_1TKDVC2fhxDJntt9syXt9Eml',
    annual:  'price_1TKDVb2fhxDJntt95GeQqJaA',
  },
  business: {
    monthly: 'price_1TKDZ02fhxDJntt9s85YSysI',
    annual:  'price_1TKDZS2fhxDJntt92RhD0X8s',
  },
}

const PLACES_MAX    = 50
const PLACES_PRISES = 34

// ── Countdown au 1er du mois ─────────────────────────────────────────────────
function useCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const getTarget = () => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0).getTime()
    }
    const tick = () => {
      const diff = getTarget() - Date.now()
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTime({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ── Plans ────────────────────────────────────────────────────────────────────
const plans = [
  {
    key: 'starter' as const,
    name: 'Starter',
    icon: Sparkles,
    priceMonthly: 19,
    priceAnnual: 15,
    description: 'Parfait pour démarrer en freelance',
    cta: 'Démarrer gratuitement',
    ctaNote: '14 jours offerts · résiliable avant le premier débit',
    highlight: false,
    badge: null,
    color: { bg: 'rgba(13,27,42,0.03)', accent: '#5C7589', border: 'rgba(13,27,42,0.08)' },
    features: [
      'Dashboard CA & finances',
      'Gestion des factures',
      'CRM leads intégré',
      'Résumé hebdo par email',
      'Support par email',
    ],
    missing: [
      'Coach IA business',
      'Synchronisation Google Sheets',
      'Objectifs & suivi de progression',
    ],
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    icon: Zap,
    priceMonthly: 39,
    priceAnnual: 31,
    description: 'Pour les freelances qui veulent scaler',
    cta: 'Démarrer gratuitement',
    ctaNote: '14 jours offerts · résiliable avant le premier débit',
    highlight: true,
    badge: 'Le plus populaire',
    color: { bg: '#0D1B2A', accent: '#4FC3F7', border: 'rgba(79,195,247,0.2)' },
    features: [
      'Tout le plan Starter',
      'Coach IA business',
      'Synchronisation Google Sheets',
      'Objectifs & suivi de progression',
      'Configuration incluse',
      'Support prioritaire',
    ],
    missing: [],
  },
  {
    key: 'business' as const,
    name: 'Business',
    icon: Building2,
    priceMonthly: 69,
    priceAnnual: 55,
    description: 'Pour les TPE et petites structures',
    cta: 'Contacter l\'équipe',
    ctaNote: 'Démo personnalisée incluse',
    highlight: false,
    badge: null,
    color: { bg: 'rgba(13,27,42,0.03)', accent: '#0288D1', border: 'rgba(2,136,209,0.15)' },
    features: [
      'Tout le plan Pro',
      'Multi-utilisateurs (jusqu\'à 5)',
      'Export comptable FEC',
      'Signature électronique',
      'Rappels automatiques impayés',
      'Onboarding dédié',
      'Support téléphonique',
    ],
    missing: [],
  },
]

// ── Composant ────────────────────────────────────────────────────────────────
export default function Pricing() {
  const [annual,      setAnnual]      = useState(false)
  const [tauxHoraire, setTauxHoraire] = useState(50)
  const countdown   = useCountdown()
  const placesRestantes = PLACES_MAX - PLACES_PRISES
  const pourcent        = Math.round((PLACES_PRISES / PLACES_MAX) * 100)

  const handleCheckout = (planKey: 'starter' | 'pro' | 'business') => {
    if (planKey === 'business') {
      window.location.href = '/contact'
      return
    }
    const priceId = PRICES[planKey][annual ? 'annual' : 'monthly']
    window.location.href = `/checkout?plan=${planKey}_${annual ? 'annual' : 'monthly'}&priceId=${priceId}`
  }

  // Calcul ROI basé sur le plan Pro
  const prixRef        = annual ? plans[1].priceAnnual : plans[1].priceMonthly
  const heuresBreakeven = (prixRef / tauxHoraire).toFixed(1)
  const valeur20h       = Math.round(tauxHoraire * 20)

  return (
    <section id="tarifs" className="relative py-20 md:py-28 px-4 md:px-6" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10 md:mb-14">
          <p className="text-cyan-600 text-xs md:text-sm font-semibold mb-3 tracking-wide uppercase">Tarifs</p>
          <h2 className="font-display text-3xl md:text-5xl mb-4" style={{ color: '#0D1B2A' }}>Simple et transparent</h2>
          <p className="text-base" style={{ color: '#7A90A4' }}>Choisissez le plan adapté à votre activité. Sans engagement. Résiliable à tout moment.</p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center p-1 rounded-xl gap-1" style={{ backgroundColor: '#EFEEE9', border: '1px solid rgba(13,27,42,0.08)' }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ backgroundColor: !annual ? '#0D1B2A' : 'transparent', color: !annual ? '#ffffff' : '#3D5166' }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ backgroundColor: annual ? '#0D1B2A' : 'transparent', color: annual ? '#ffffff' : '#3D5166' }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
            >
              Annuel
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">−20%</span>
            </button>
          </div>
          {annual && (
            <p className="text-sm text-emerald-600 font-medium">
              Économisez jusqu'à 168€/an
            </p>
          )}
        </div>

        {/* Bannière urgence */}
        <div className="mb-8 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #0D1B2A, #1e3a5f)', border: '1px solid rgba(79,195,247,0.2)' }}>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(79,195,247,0.15)' }}>
              <Users size={18} style={{ color: '#4FC3F7' }} />
            </div>
            <div>
              <p style={{ color: '#ffffff', fontSize: 13, fontWeight: 700 }}>
                Plus que <span style={{ color: '#4FC3F7' }}>{placesRestantes} places</span> au tarif lancement
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{PLACES_PRISES}/{PLACES_MAX} solopreneurs déjà inscrits</p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', width: 180 }}>
                <div className="h-full rounded-full" style={{ width: `${pourcent}%`, background: 'linear-gradient(90deg, #4FC3F7, #0288D1)' }} />
              </div>
            </div>
          </div>
          <div className="hidden sm:block w-px h-12" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Flame size={14} style={{ color: '#f97316' }} />
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Offre expire dans</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { val: countdown.days,    label: 'j' },
                { val: countdown.hours,   label: 'h' },
                { val: countdown.minutes, label: 'm' },
                { val: countdown.seconds, label: 's' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <div className="rounded-lg px-2 py-1 text-center min-w-[36px]" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <p style={{ color: '#ffffff', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                      {String(t.val).padStart(2, '0')}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{t.label}</p>
                  </div>
                  {i < 3 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700 }}>:</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grille des 3 plans */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => {
            const price    = annual ? plan.priceAnnual : plan.priceMonthly
            const PlanIcon = plan.icon

            return (
              <div
                key={plan.key}
                className="relative rounded-2xl flex flex-col"
                style={{
                  background: plan.highlight ? plan.color.bg : '#ffffff',
                  border: `1px solid ${plan.color.border}`,
                  boxShadow: plan.highlight
                    ? '0 20px 60px rgba(13,27,42,0.25), 0 8px 24px rgba(13,27,42,0.15)'
                    : '0 4px 16px rgba(13,27,42,0.06)',
                  transform: plan.highlight ? 'scale(1.03)' : 'scale(1)',
                  zIndex: plan.highlight ? 10 : 1,
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                    style={{ background: 'linear-gradient(90deg, #4FC3F7, #0288D1)', color: '#ffffff' }}
                  >
                    <Star size={10} fill="currentColor" />
                    {plan.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Header plan */}
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: plan.highlight ? 'rgba(79,195,247,0.15)' : 'rgba(13,27,42,0.06)' }}
                    >
                      <PlanIcon size={15} style={{ color: plan.highlight ? '#4FC3F7' : plan.color.accent }} />
                    </div>
                    <span
                      className="font-semibold text-base"
                      style={{ color: plan.highlight ? '#ffffff' : '#0D1B2A' }}
                    >
                      {plan.name}
                    </span>
                  </div>

                  {/* Prix */}
                  <div className="mb-2">
                    <div className="flex items-end gap-1.5">
                      <span
                        className="font-display text-4xl tracking-tight"
                        style={{ color: plan.highlight ? '#ffffff' : '#0D1B2A' }}
                      >
                        {price}€
                      </span>
                      <span className="text-sm mb-1.5" style={{ color: plan.highlight ? 'rgba(255,255,255,0.4)' : '#A8BDD0' }}>
                        / mois
                      </span>
                    </div>
                    {annual && (
                      <p className="text-xs" style={{ color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#A8BDD0' }}>
                        Facturé {price * 12}€/an
                      </p>
                    )}
                  </div>

                  <p className="text-xs mb-5" style={{ color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#7A90A4' }}>
                    {plan.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-6 flex-1">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2.5 text-sm">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: plan.highlight ? 'rgba(79,195,247,0.2)' : 'rgba(79,195,247,0.1)',
                            border: plan.highlight ? '1px solid rgba(79,195,247,0.3)' : '1px solid rgba(79,195,247,0.2)',
                          }}
                        >
                          <Check size={9} style={{ color: plan.highlight ? '#4FC3F7' : '#0288D1' }} />
                        </div>
                        <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.85)' : '#3D5166' }}>{f}</span>
                      </div>
                    ))}
                    {plan.missing.map(f => (
                      <div key={f} className="flex items-start gap-2.5 text-sm opacity-35">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: 'rgba(13,27,42,0.05)', border: '1px solid rgba(13,27,42,0.1)' }}
                        >
                          <div className="w-1.5 h-px rounded-full" style={{ background: '#A8BDD0' }} />
                        </div>
                        <span style={{ color: '#7A90A4' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div>
                    <button
                      onClick={() => handleCheckout(plan.key)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl font-medium text-sm transition-all"
                      style={{
                        padding: '13px 16px',
                        background: plan.highlight
                          ? 'linear-gradient(135deg, #4FC3F7, #0288D1)'
                          : 'rgba(13,27,42,0.06)',
                        color: plan.highlight ? '#ffffff' : '#0D1B2A',
                        border: plan.highlight ? 'none' : '1px solid rgba(13,27,42,0.1)',
                      }}
                    >
                      {plan.highlight && <Zap size={13} style={{ color: 'rgba(255,255,255,0.8)' }} />}
                      {plan.cta}
                      <ArrowRight size={13} />
                    </button>
                    <p className="text-center text-xs mt-2" style={{ color: plan.highlight ? 'rgba(255,255,255,0.4)' : '#A8BDD0' }}>
                      {plan.ctaNote}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ligne de réassurance */}
        <div className="flex items-center justify-center gap-6 flex-wrap text-xs mb-12" style={{ color: '#A8BDD0' }}>
          <span className="flex items-center gap-1.5"><Shield size={11} /> Paiement Stripe sécurisé</span>
          <span className="flex items-center gap-1.5"><RefreshCw size={11} /> Annulation libre</span>
          <span className="flex items-center gap-1.5"><Clock size={11} /> Accès immédiat après paiement</span>
        </div>

        {/* Section ROI — en bas, liée au plan Pro */}
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{ background: '#ffffff', border: '1px solid rgba(13,27,42,0.08)', boxShadow: '0 4px 16px rgba(13,27,42,0.06)' }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#0D1B2A' }}>Calculateur de rentabilité</p>
              <p className="text-xs mb-5" style={{ color: '#A8BDD0' }}>Combien vaut votre temps ? Ajustez votre taux horaire.</p>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: '#7A90A4' }}>Votre taux horaire</span>
                  <span className="font-bold" style={{ color: '#0D1B2A' }}>{tauxHoraire}€/h</span>
                </div>
                <input
                  type="range" min={10} max={200} step={5} value={tauxHoraire}
                  onChange={e => setTauxHoraire(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#0D1B2A]"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#A8BDD0' }}>
                  <span>10€</span><span>200€</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#EFEEE9', border: '1px solid rgba(13,27,42,0.08)' }}>
                <span className="text-xs" style={{ color: '#7A90A4' }}>Plan Pro — seuil de rentabilité</span>
                <span className="font-semibold text-sm" style={{ color: '#0D1B2A' }}>{heuresBreakeven}h / mois</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                <span className="text-xs" style={{ color: '#7A90A4' }}>Valeur si 20h économisées</span>
                <span className="text-cyan-700 font-bold text-sm">{valeur20h.toLocaleString('fr-FR')}€</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-xs" style={{ color: '#7A90A4' }}>ROI mensuel estimé (Pro)</span>
                <span className="text-emerald-700 font-bold text-sm">x{Math.round(valeur20h / prixRef)}</span>
              </div>
              <p className="text-xs" style={{ color: '#A8BDD0' }}>* Estimation basée sur 20h/mois économisées.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}