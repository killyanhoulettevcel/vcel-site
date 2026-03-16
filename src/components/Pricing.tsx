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
  const heuresBreakeven = (prixMensuel / tauxHoraire).toFixed(1)
  const valeur20h       = Math.round(tauxHoraire * 20)

  const priceId = annual ? PRICE_ANNUAL : PRICE_MONTHLY

  const handleCheckout = () => {
    window.location.href = `/checkout?plan=${annual ? 'annual' : 'monthly'}&priceId=${priceId}`
  }

  return (
    <section id="tarifs" className="relative py-20 md:py-28 px-6" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10 md:mb-16">
          <p className="text-cyan-600 text-sm font-semibold mb-3 tracking-wide uppercase">Tarifs</p>
          <h2 className="font-display text-3xl md:text-5xl mb-4" style={{ color: '#0D1B2A' }}>Simple et transparent</h2>
          <p className="text-base md:text-lg" style={{ color: '#7A90A4' }}>Un abonnement mensuel. Sans engagement. Résiliable à tout moment.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-5 md:gap-6">

          {/* Carte offre — 3 colonnes */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 md:p-8 shadow-lg" style={{ border: '1px solid rgba(13,27,42,0.08)' }}>

            {/* Toggle mensuel/annuel */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="flex items-center p-1 rounded-xl gap-1" style={{ backgroundColor: '#EFEEE9', border: '1px solid rgba(13,27,42,0.08)' }}>
                <button
                  onClick={() => setAnnual(false)}
                  style={{
                    backgroundColor: !annual ? '#0D1B2A' : 'transparent',
                    color: !annual ? '#ffffff' : '#3D5166',
                  }}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all">
                  Mensuel
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  style={{
                    backgroundColor: annual ? '#0D1B2A' : 'transparent',
                    color: annual ? '#ffffff' : '#3D5166',
                  }}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5">
                  Annuel
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">−20%</span>
                </button>
              </div>
            </div>

            {/* Prix */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display text-5xl md:text-6xl tracking-tight" style={{ color: '#0D1B2A' }}>{prixMensuel}€</span>
                <span className="text-sm mb-3" style={{ color: '#A8BDD0' }}>/ mois</span>
              </div>
              {annual
                ? <p className="text-emerald-600 text-sm font-medium">Facturé 468€/an · économisez 120€</p>
                : <p className="text-sm" style={{ color: '#A8BDD0' }}>Sans engagement · résiliable en 1 clic</p>
              }
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200">
                <span className="text-xs" style={{ color: '#A8BDD0' }}>Offre lancement :</span>
                <code className="text-sm font-bold text-cyan-700">SOLO19</code>
                <span className="text-xs" style={{ color: '#A8BDD0' }}>→ 1er mois à 19€</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 mb-6 md:mb-8">
              {features.map(f => (
                <div key={f} className="flex items-center gap-3 text-sm" style={{ color: '#3D5166' }}>
                  <div className="w-4 h-4 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-cyan-600" />
                  </div>
                  {f}
                </div>
              ))}
            </div>

            {/* CTA — .btn-primary + style inline pour garantir color:white */}
            <button
              onClick={handleCheckout}
              className="btn-primary w-full justify-center rounded-xl text-sm"
              style={{ padding: '16px', color: '#ffffff', backgroundColor: '#0D1B2A' }}>
              <Zap size={15} style={{ color: '#4FC3F7' }} fill="currentColor" />
              Commencer maintenant
              <ArrowRight size={14} />
            </button>

            <div className="flex items-center justify-center gap-5 mt-4 text-xs flex-wrap" style={{ color: '#A8BDD0' }}>
              <span className="flex items-center gap-1.5"><Shield size={10} /> Paiement Stripe sécurisé</span>
              <span className="flex items-center gap-1.5"><RefreshCw size={10} /> Annulation libre</span>
            </div>
          </div>

          {/* ROI + Garantie — 2 colonnes */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Calculateur ROI */}
            <div className="bg-white rounded-2xl p-5 md:p-6 flex-1 shadow-sm" style={{ border: '1px solid rgba(13,27,42,0.08)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#0D1B2A' }}>Calculateur de rentabilité</p>
              <p className="text-xs mb-5" style={{ color: '#A8BDD0' }}>Ajustez votre taux horaire</p>

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

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#EFEEE9', border: '1px solid rgba(13,27,42,0.08)' }}>
                  <span className="text-xs" style={{ color: '#7A90A4' }}>Seuil de rentabilité</span>
                  <span className="font-semibold text-sm" style={{ color: '#0D1B2A' }}>{heuresBreakeven}h / mois</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                  <span className="text-xs" style={{ color: '#7A90A4' }}>Valeur si 20h économisées</span>
                  <span className="text-cyan-700 font-bold text-sm">{valeur20h.toLocaleString('fr-FR')}€</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-xs" style={{ color: '#7A90A4' }}>ROI mensuel estimé</span>
                  <span className="text-emerald-700 font-bold text-sm">x{Math.round(valeur20h / prixMensuel)}</span>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: '#A8BDD0' }}>* Estimation basée sur 20h/mois économisées.</p>
            </div>

            {/* Accès immédiat */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid rgba(13,27,42,0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-cyan-600" />
                <p className="text-sm font-semibold" style={{ color: '#0D1B2A' }}>Accès immédiat</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#A8BDD0' }}>
                Votre espace client est configuré automatiquement après le paiement. Email d'activation sous 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
