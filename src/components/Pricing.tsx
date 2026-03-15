'use client'
import { useState } from 'react'
import { Check, Zap, ArrowRight, Shield, RefreshCw, Clock } from 'lucide-react'

const PRICE_MONTHLY = 'price_1T1QK42fhxDJntt9VCBc77Gs'
const PRICE_ANNUAL  = 'price_1TABiy2fhxDJntt99715Z9e4'

const features = [
  'Dashboard CA & finances',
  'CRM leads intégré',
  'Coach IA business',
  'Résumé hebdo par email',
  'Synchronisation Google Sheets',
  'Gestion des factures',
  'Objectifs & suivi de progression',
  'Configuration incluse',
  'Support par email',
]

export default function Pricing() {
  const [annual,      setAnnual]      = useState(false)
  const [tauxHoraire, setTauxHoraire] = useState(25)

  const prixMensuel     = annual ? 39 : 49
  const priceId         = annual ? PRICE_ANNUAL : PRICE_MONTHLY
  const heuresBreakeven = (prixMensuel / tauxHoraire).toFixed(1)
  const valeur20h       = Math.round(tauxHoraire * 20)

  const handleCheckout = () => {
    window.location.href = `/checkout?plan=${annual ? 'annual' : 'monthly'}`
  }

  return (
    <section id="tarifs" className="relative py-20 md:py-28 px-6 bg-cream-200">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10 md:mb-16">
          <p className="text-cyan-600 text-sm font-semibold mb-3 tracking-wide uppercase">Tarifs</p>
          <h2 className="font-display text-3xl md:text-5xl text-[var(--navy)] mb-4">Simple et transparent</h2>
          <p className="text-[var(--text-secondary)] text-base md:text-lg">Un abonnement mensuel. Sans engagement. Résiliable à tout moment.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-5 md:gap-6">

          {/* Carte offre — 3 colonnes */}
          <div className="lg:col-span-3 bg-white border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-lg-navy">

            {/* Toggle mensuel/annuel */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="flex items-center p-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl gap-1">
                <button onClick={() => setAnnual(false)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    !annual ? 'bg-[var(--navy)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}>
                  Mensuel
                </button>
                <button onClick={() => setAnnual(true)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    annual ? 'bg-[var(--navy)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}>
                  Annuel
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">−20%</span>
                </button>
              </div>
            </div>

            {/* Prix */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display text-5xl md:text-6xl text-[var(--navy)] tracking-tight">{prixMensuel}€</span>
                <span className="text-[var(--text-muted)] text-sm mb-3">/ mois</span>
              </div>
              {annual
                ? <p className="text-emerald-600 text-sm font-medium">Facturé 468€/an · économisez 120€</p>
                : <p className="text-[var(--text-muted)] text-sm">Sans engagement · résiliable en 1 clic</p>
              }
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200">
                <span className="text-xs text-[var(--text-muted)]">Offre lancement :</span>
                <code className="text-sm font-bold text-cyan-700">SOLO19</code>
                <span className="text-xs text-[var(--text-muted)]">→ 1er mois à 19€</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 mb-6 md:mb-8">
              {features.map(f => (
                <div key={f} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="w-4 h-4 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-cyan-600" />
                  </div>
                  {f}
                </div>
              ))}
            </div>

{/* CTA */}
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 bg-[var(--navy)] hover:bg-[var(--navy-light)] text-white font-semibold py-4 rounded-xl transition-all shadow-md-navy group text-sm cursor-pointer">
              <>
                <Zap size={15} className="text-cyan-400" fill="currentColor" />
                Commencer maintenant
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            </button>

            <div className="flex items-center justify-center gap-5 mt-4 text-[var(--text-light)] text-xs flex-wrap">
              <span className="flex items-center gap-1.5"><Shield size={10} /> Paiement Stripe sécurisé</span>
              <span className="flex items-center gap-1.5"><RefreshCw size={10} /> Annulation libre</span>
            </div>
          </div>

          {/* ROI + Garantie — 2 colonnes */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Calculateur ROI */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5 md:p-6 flex-1 shadow-sm-navy">
              <p className="text-[var(--navy)] text-sm font-semibold mb-1">Calculateur de rentabilité</p>
              <p className="text-[var(--text-muted)] text-xs mb-5">Ajustez votre taux horaire</p>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)] text-xs">Votre taux horaire</span>
                  <span className="text-[var(--navy)] font-bold">{tauxHoraire}€/h</span>
                </div>
                <input type="range" min={10} max={200} step={5} value={tauxHoraire}
                  onChange={e => setTauxHoraire(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#0D1B2A]" />
                <div className="flex justify-between text-[var(--text-light)] text-xs mt-1">
                  <span>10€</span><span>200€</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-xs">Seuil de rentabilité</span>
                  <span className="text-[var(--navy)] font-semibold text-sm">{heuresBreakeven}h / mois</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                  <span className="text-[var(--text-muted)] text-xs">Valeur si 20h économisées</span>
                  <span className="text-cyan-700 font-bold text-sm">{valeur20h.toLocaleString('fr-FR')}€</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[var(--text-muted)] text-xs">ROI mensuel estimé</span>
                  <span className="text-emerald-700 font-bold text-sm">x{Math.round(valeur20h / prixMensuel)}</span>
                </div>
              </div>
              <p className="text-[var(--text-light)] text-xs mt-3">* Estimation basée sur 20h/mois économisées.</p>
            </div>

            {/* Garantie */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm-navy">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-cyan-600" />
                <p className="text-[var(--navy)] text-sm font-semibold">Accès immédiat</p>
              </div>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                Votre espace client est configuré automatiquement après le paiement. Email d'activation sous 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}