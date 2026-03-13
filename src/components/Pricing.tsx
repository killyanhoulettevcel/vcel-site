'use client'
import { useState } from 'react'
import { Check, Zap, ArrowRight, Shield, RefreshCw } from 'lucide-react'

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
  const [loading,     setLoading]     = useState(false)
  const [annual,      setAnnual]      = useState(false)
  const [error,       setError]       = useState('')
  const [tauxHoraire, setTauxHoraire] = useState(25)

  const prixMensuel = annual ? 39 : 49
  const priceId     = annual ? PRICE_ANNUAL : PRICE_MONTHLY

  const heuresBreakeven = (prixMensuel / tauxHoraire).toFixed(1)
  const valeur20h       = Math.round(tauxHoraire * 20)

  const handleCheckout = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, annual }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      if (data.url) window.location.href = data.url
    } catch {
      setError('Erreur de connexion — réessayez')
      setLoading(false)
    }
  }

  return (
    <section id="tarifs" className="relative py-20 md:py-28 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgba(59,130,246,0.05),transparent)]" />

      <div className="max-w-5xl mx-auto">
        <div className="mb-10 md:mb-16">
          <p className="text-blue-400 text-sm font-semibold mb-3 tracking-wide uppercase">Tarifs</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">Simple et transparent</h2>
          <p className="text-white/40 text-base md:text-lg">Un abonnement mensuel. Sans engagement. Résiliable à tout moment.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-5 md:gap-6">

          {/* Carte offre */}
          <div className="lg:col-span-3 bg-white/3 border border-white/10 rounded-2xl p-6 md:p-8">
            {/* Toggle */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="flex items-center p-1 bg-white/5 border border-white/8 rounded-xl gap-1">
                <button onClick={() => setAnnual(false)}
                  className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${!annual ? 'bg-white text-[#080c14]' : 'text-white/40 hover:text-white/70'}`}>
                  Mensuel
                </button>
                <button onClick={() => setAnnual(true)}
                  className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${annual ? 'bg-white text-[#080c14]' : 'text-white/40 hover:text-white/70'}`}>
                  Annuel
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${annual ? 'bg-green-500/20 text-green-600' : 'bg-green-500/15 text-green-400'}`}>−20%</span>
                </button>
              </div>
            </div>

            {/* Prix */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-end gap-2 mb-1">
                <span className="font-display text-5xl md:text-6xl font-extrabold text-white tracking-tight">{prixMensuel}€</span>
                <span className="text-white/30 text-sm mb-3">/ mois</span>
              </div>
              {annual
                ? <p className="text-green-400 text-sm font-medium">Facturé 468€/an · économisez 120€</p>
                : <p className="text-white/30 text-sm">Sans engagement · résiliable en 1 clic</p>
              }
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/15">
                <span className="text-xs text-white/40">Offre lancement :</span>
                <code className="text-sm font-bold text-blue-300">SOLO19</code>
                <span className="text-xs text-white/30">→ 1er mois à 19€</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 md:gap-2.5 mb-6 md:mb-8">
              {features.map(f => (
                <div key={f} className="flex items-center gap-3 text-sm text-white/60">
                  <Check size={13} className="text-blue-400 shrink-0" /> {f}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button onClick={handleCheckout} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 group">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Redirection Stripe...</>
              ) : (
                <><Zap size={15} fill="white" />Commencer maintenant<ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 md:gap-5 mt-4 text-white/20 text-xs flex-wrap">
              <span className="flex items-center gap-1.5"><Shield size={10} /> Paiement Stripe sécurisé</span>
              <span className="flex items-center gap-1.5"><RefreshCw size={10} /> Annulation libre</span>
            </div>
          </div>

          {/* ROI + Garantie */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5 md:p-6 flex-1">
              <p className="text-white text-sm font-semibold mb-1">Calculateur de rentabilité</p>
              <p className="text-white/35 text-xs mb-5">Ajustez votre taux horaire</p>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-xs">Votre taux horaire</span>
                  <span className="text-white font-bold text-lg">{tauxHoraire}€/h</span>
                </div>
                <input type="range" min={10} max={200} step={5} value={tauxHoraire}
                  onChange={e => setTauxHoraire(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer" />
                <div className="flex justify-between text-white/20 text-xs mt-1"><span>10€</span><span>200€</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/6">
                  <span className="text-white/40 text-xs">Seuil de rentabilité</span>
                  <span className="text-white font-semibold text-sm">{heuresBreakeven}h / mois</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-500/8 rounded-xl border border-blue-500/15">
                  <span className="text-white/40 text-xs">Valeur si 20h économisées</span>
                  <span className="text-blue-300 font-bold text-sm">{valeur20h.toLocaleString('fr-FR')}€</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/8 rounded-xl border border-green-500/15">
                  <span className="text-white/40 text-xs">ROI mensuel estimé</span>
                  <span className="text-green-400 font-bold text-sm">x{Math.round(valeur20h / prixMensuel)}</span>
                </div>
              </div>
              <p className="text-white/20 text-xs mt-4 leading-relaxed">* Estimation basée sur 20h/mois économisées.</p>
            </div>

            <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
              <p className="text-white text-sm font-semibold mb-2">Accès immédiat après paiement</p>
              <p className="text-white/35 text-xs leading-relaxed">Votre espace client est configuré automatiquement. Email d'activation sous 5 minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
