'use client'
import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ nom: '', email: '', secteur: '' })
  const [loading, setLoading] = useState(false)

  const secteurs = ['Coach / Formateur', 'Freelance', 'E-commerce', 'Immobilier', 'Consultant', 'PME', 'Autre']

  const handleSubmit = async () => {
    if (!form.email || !form.nom) return
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom:       form.nom,
          email:     form.email,
          secteur:   form.secteur || 'Non précisé',
          source:    'Formulaire landing',
          score:     form.secteur === 'Immobilier' ? 'chaud' : 'tiède',
          statut:    'nouveau',
          date:      new Date().toISOString().split('T')[0],
          message:   '',
          telephone: '',
          entreprise: '',
        })
      })
    } catch (e) {
      console.error('Erreur envoi lead:', e)
    }
    setLoading(false)
    setSent(true)
  }

  return (
    <section id="contact" className="relative py-28 px-6 overflow-hidden">
      <div className="glow-orb w-[700px] h-[700px] bg-blue-600/15 top-[-200px] left-[-200px]" />

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="section-label">
            <span className="w-4 h-px bg-blue-400" />
            Démarrer maintenant
            <span className="w-4 h-px bg-blue-400" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Prêt à récupérer<br />
            <span className="text-blue-400">vos 20h ?</span>
          </h2>
          <p className="text-white/40">Laissez vos infos, on vous envoie le pack + accès en moins de 2h.</p>
        </div>

        <div className="card-glass p-8" style={{ boxShadow: '0 0 80px rgba(59,130,246,0.08)' }}>
          {sent ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold text-white mb-2">C'est parti ! 🚀</h3>
              <p className="text-white/50">Vous recevrez le pack dans les 2 heures.<br />Vérifiez vos spams si besoin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Prénom *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={e => setForm({...form, nom: e.target.value})}
                    placeholder="Killyan"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="killyan@vcel.fr"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Votre activité</label>
                <div className="flex flex-wrap gap-2">
                  {secteurs.map(s => (
                    <button key={s}
                      onClick={() => setForm({...form, secteur: s})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.secteur === s
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo reminder */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/15">
                <div className="text-blue-400 text-xs">
                  🎯 Code <code className="font-bold text-blue-300">SOLO19</code> appliqué automatiquement — 1er mois à <strong>19€</strong> au lieu de 49€
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !form.email || !form.nom}
                className="btn-primary w-full justify-center text-base py-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:transform-none">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  <>
                    <Send size={16} />
                    Recevoir le Pack Starter
                  </>
                )}
              </button>

              <p className="text-center text-white/20 text-xs">
                Zéro spam. Désabonnement en 1 clic. Paiement Stripe sécurisé.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
