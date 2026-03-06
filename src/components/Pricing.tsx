'use client'
import { Check, Zap, Star } from 'lucide-react'

const features = [
  '8 workflows JSON prêts-à-importer',
  'Vidéo setup 2 min par workflow',
  'Devis/Factures PDP 2026 inclus',
  'CRM Leads auto → Google Sheets',
  'Dashboard CA hebdo + mensuel + trimestriel',
  'OCR factures fournisseurs',
  'Posts réseaux sociaux automatisés',
  'Alertes budget bancaire',
  'Google Sheets base clients incluse',
  'Support email 48h',
  'Mises à jour workflows incluses',
]

export default function Pricing() {
  return (
    <section id="tarifs" className="relative py-28 px-6 overflow-hidden">
      <div className="glow-orb w-[600px] h-[600px] bg-blue-600/15 top-[10%] left-[-150px]" />

      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-16">
          <div className="section-label">
            <span className="w-4 h-px bg-blue-400" />
            Tarifs simples
            <span className="w-4 h-px bg-blue-400" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Un seul pack,<br />
            <span className="text-blue-400">tout inclus</span>
          </h2>
          <p className="text-white/40 text-lg">Pas d'abonnement surprise. Pas de setup fees.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Promo card */}
          <div className="relative card-glass p-8 border-blue-500/40" style={{ boxShadow: '0 0 60px rgba(59,130,246,0.12)' }}>
            {/* Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/40">
                <Star size={11} fill="white" /> OFFRE LANCEMENT
              </span>
            </div>

            <div className="mb-6 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display text-5xl font-extrabold text-white">19€</span>
                <div>
                  <div className="text-white/40 text-xs line-through">49€</div>
                  <div className="text-blue-400 text-xs font-semibold">1er mois</div>
                </div>
              </div>
              <p className="text-white/40 text-sm">puis 49€/mois · Sans engagement</p>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs text-white/50">Code promo :</span>
                <code className="text-sm font-bold text-blue-300 tracking-wider">SOLO19</code>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                  <Check size={15} className="text-blue-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <a href="#contact"
              className="btn-primary w-full justify-center text-base py-4 font-semibold">
              <Zap size={16} fill="white" />
              Démarrer pour 19€
            </a>
            <p className="text-center text-white/25 text-xs mt-3">Paiement sécurisé via Stripe</p>
          </div>

          {/* Value prop card */}
          <div className="flex flex-col gap-4">

            <div className="card-glass p-6">
              <h3 className="font-display font-semibold text-white mb-3">Ce que vous économisez</h3>
              <div className="space-y-2">
                {[
                  { label: 'Freelance automation', price: '1 500€', sub: 'setup unique' },
                  { label: 'Agence no-code', price: '3 000€', sub: '/ trimestre' },
                  { label: 'Zapier Pro', price: '588€', sub: '/ an' },
                  { label: 'Make Business', price: '360€', sub: '/ an' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/40 text-sm">{r.label}</span>
                    <div className="text-right">
                      <div className="text-white/60 text-sm font-medium line-through">{r.price}</div>
                      <div className="text-white/25 text-xs">{r.sub}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-white font-semibold text-sm">VCEL Pack Starter</span>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">49€</div>
                    <div className="text-white/30 text-xs">/ mois</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-glass p-6">
              <h3 className="font-display font-semibold text-white mb-3">Stack incluse</h3>
              <div className="flex flex-wrap gap-2">
                {['n8n', 'Google Sheets', 'Gmail', 'Stripe', 'GPT-4o-mini', 'LinkedIn', 'Instagram', 'TikTok', 'Tink/Indy'].map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50">{t}</span>
                ))}
              </div>
            </div>

            <div className="card-glass p-6 border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-semibold">ROI garanti</span>
              </div>
              <p className="text-white/50 text-sm">
                À 25€/h, récupérer <strong className="text-white/80">2h/mois</strong> rembourse déjà l'abonnement. Vous en économisez 80.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
