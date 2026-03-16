'use client'
import { useState } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function Contact() {
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ nom: '', email: '', secteur: '' })

  const secteurs = ['Freelance', 'Coach / Formateur', 'E-commerce', 'Consultant', 'PME', 'Autre']

  const handleSubmit = async () => {
    if (!form.email || !form.nom) return
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom, email: form.email,
          secteur: form.secteur || 'Non précisé',
          source: 'Formulaire landing', score: 'tiède',
          statut: 'nouveau', date: new Date().toISOString().split('T')[0],
          message: '', telephone: '', entreprise: '',
        })
      })
    } catch {}
    setLoading(false)
    setSent(true)
  }

  return (
    <section id="contact" className="relative py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <p className="text-blue-400 text-sm font-semibold mb-3 tracking-wide uppercase">Contact</p>
          <h2 className="font-display text-4xl font-bold text-white mb-3">Une question ?</h2>
          <p className="text-white/40">On vous répond par email sous 24h.</p>
        </div>

        <div className="bg-white/3 border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="py-8 text-center">
              <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-white mb-2">Message reçu</h3>
              <p className="text-white/40 text-sm">On vous répond sous 24h. Vérifiez vos spams si besoin.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-2">Prénom *</label>
                  <input type="text" value={form.nom}
                    onChange={e => setForm({...form, nom: e.target.value})}
                    placeholder="Votre prénom"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-2">Email *</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="vous@email.com"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/40 mb-2">Votre activité</label>
                <div className="flex flex-wrap gap-2">
                  {secteurs.map(s => (
                    <button key={s} onClick={() => setForm({...form, secteur: s})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.secteur === s
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-white/3 border-white/8 text-white/40 hover:text-white/60 hover:border-white/15'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSubmit}
                disabled={loading || !form.email || !form.nom}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all">
                {loading ? 'Envoi...' : <><ArrowRight size={15} /> Envoyer</>}
              </button>

              <p className="text-center text-white/20 text-xs">
                Ou écrivez directement à <a href="mailto:contact@vcel.fr" className="underline hover:text-white/40">contact@vcel.fr</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}