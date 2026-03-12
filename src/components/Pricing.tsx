'use client'
import { useState } from 'react'
import { Check, Zap, Star, ArrowRight, Shield, Clock, TrendingUp } from 'lucide-react'

const features = [
  'Dashboard CA temps réel',
  'CRM Leads automatisé',
  'Résumé hebdo IA par email',
  'Google Sheets synchronisé',
  'Coach IA business personnel',
  'Gestion factures & finances',
  'Workflows n8n dédiés',
  'Support prioritaire 24h',
  'Mises à jour incluses',
]

const comparaisons = [
  { label: 'Freelance automation', price: '1 500€', sub: 'setup unique' },
  { label: 'Agence no-code', price: '3 000€', sub: '/ trimestre' },
  { label: 'Zapier Pro', price: '588€', sub: '/ an' },
  { label: 'Make Business', price: '360€', sub: '/ an' },
]

const stack = ['n8n', 'Google Sheets', 'Gmail', 'Stripe', 'GPT-4o', 'Supabase', 'Vercel']

// ⚠️ Remplace par tes vrais Price IDs Stripe
const PRICE_MONTHLY = 'price_1T1QK42fhxDJntt9VCBc77Gs'
const PRICE_ANNUAL  = 'price_1TABiy2fhxDJntt99715Z9e4'

export default function Pricing() {
  const [loading, setLoading] = useState(false)
  const [annual, setAnnual]   = useState(false)
  const [error, setError]     = useState('')

  const price   = annual ? 39 : 49
  const priceId = annual ? PRICE_ANNUAL : PRICE_MONTHLY

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, annual }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      if (data.url) window.location.href = data.url
    } catch (e: any) {
      setError('Erreur de connexion — réessayez')
      setLoading(false)
    }
  }

  return (
    <section id="tarifs" className="relative py-28 px-6 overflow-hidden">
      <div className="glow-orb w-[700px] h-[700px] bg-blue-600/15 top-[0%] left-[-200px]" />
      <div className="glow-orb w-[400px] h-[400px] bg-indigo-500/10 bottom-[10%] right-[-100px]" />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="section-label">
            <span className="w-4 h-px bg-blue-400" />
            Tarifs simples
            <span className="w-4 h-px bg-blue-400" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Un seul abonnement,<br />
            <span className="text-blue-400">tout inclus</span>
          </h2>
          <p className="text-white/40 text-lg mb-8">Sans engagement. Résiliable en 1 clic.</p>

          {/* Toggle mensuel/annuel */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-white/5 border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-white/40 hover:text-white'
              }`}>
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-white/40 hover:text-white'
              }`}>
              Annuel
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">

          {/* Carte principale */}
          <div className="md:col-span-2 relative card-glass p-8 border-blue-500/40"
            style={{ boxShadow: '0 0 80px rgba(59,130,246,0.12)' }}>

            <div className="absolute -top-3.5 left-8">
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/40">
                <Star size={11} fill="white" /> OFFRE LANCEMENT — 1er mois à 19€
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pt-4 mb-8">
              <div>
                <div className="flex items-end gap-3 mb-1">
                  <span className="font-display text-6xl font-extrabold text-white">{price}€</span>
                  <div className="mb-2">
                    <div className="text-white/30 text-sm">/ mois</div>
                    {annual && <div className="text-green-400 text-xs font-semibold">économisez 120€/an</div>}
                  </div>
                </div>
                <p className="text-white/30 text-sm">
                  {annual ? 'Facturé annuellement' : 'Sans engagement · résiliable à tout moment'}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-xs text-white/50">Code lancement :</span>
                  <code className="text-sm font-bold text-blue-300 tracking-wider">SOLO19</code>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/70 list-none">
                    <Check size={14} className="text-blue-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* CTA Stripe */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary w-full justify-center text-base py-4 font-semibold disabled:opacity-60 disabled:cursor-not-allowed group">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Redirection vers Stripe...
                  </span>
                ) : (
                  <>
                    <Zap size={16} fill="white" />
                    Démarrer pour {annual ? '39€' : '19€'} ce mois
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-6 text-white/25 text-xs">
                <span className="flex items-center gap-1.5"><Shield size={11} /> Paiement sécurisé Stripe</span>
                <span className="flex items-center gap-1.5"><Clock size={11} /> Accès immédiat</span>
                <span className="flex items-center gap-1.5"><TrendingUp size={11} /> ROI garanti</span>
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="flex flex-col gap-4">
            <div className="card-glass p-6">
              <h3 className="font-display font-semibold text-white text-sm mb-4">Ce que vous économisez</h3>
              <div className="space-y-2">
                {comparaisons.map(r => (
                  <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/40 text-xs">{r.label}</span>
                    <div className="text-right">
                      <div className="text-white/50 text-xs font-medium line-through">{r.price}</div>
                      <div className="text-white/20 text-xs">{r.sub}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-white font-semibold text-sm">VCEL</span>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-sm">{price}€</div>
                    <div className="text-white/30 text-xs">/ mois</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-glass p-6">
              <h3 className="font-display font-semibold text-white text-sm mb-3">Stack incluse</h3>
              <div className="flex flex-wrap gap-2">
                {stack.map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50">{t}</span>
                ))}
              </div>
            </div>

            <div className="card-glass p-6 border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-semibold">ROI en 2h</span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                À 25€/h, économiser <strong className="text-white/80">2h/mois</strong> rembourse l'abonnement. Nos clients en économisent 80.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
