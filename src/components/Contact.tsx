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
    <section id="contact" className="relative py-24 px-4 md:px-6"
      style={{ background: 'linear-gradient(180deg, #0a1520 0%, #0D1B2A 100%)' }}>
      <div className="max-w-2xl mx-auto">

        <div className="mb-10">
          <p style={{ color: '#4FC3F7', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Contact
          </p>
          <h2 className="font-display text-4xl font-normal mb-3" style={{ color: '#ffffff' }}>
            Une question ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            On vous répond par email sous 24h.
          </p>
        </div>

        <div className="rounded-2xl p-7 md:p-8"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {sent ? (
            <div className="py-10 text-center">
              <CheckCircle size={44} style={{ color: '#10b981', margin: '0 auto 16px' }} />
              <h3 className="font-display text-xl font-normal mb-2" style={{ color: '#ffffff' }}>
                Message reçu !
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                On vous répond sous 24h. Vérifiez vos spams si besoin.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-nom"
                    style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Prénom *
                  </label>
                  <input
                    id="contact-nom"
                    type="text"
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    placeholder="Votre prénom"
                    aria-required="true"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      color: '#ffffff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(79,195,247,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email"
                    style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Email *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="vous@email.com"
                    aria-required="true"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      color: '#ffffff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(79,195,247,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
              </div>

              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Votre activité
                </p>
                <div className="flex flex-wrap gap-2" role="group">
                  {secteurs.map(s => (
                    <button key={s} onClick={() => setForm({ ...form, secteur: s })}
                      aria-pressed={form.secteur === s}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${form.secteur === s ? '#4FC3F7' : 'rgba(255,255,255,0.12)'}`,
                        background: form.secteur === s ? 'rgba(79,195,247,0.15)' : 'rgba(255,255,255,0.04)',
                        color: form.secteur === s ? '#4FC3F7' : 'rgba(255,255,255,0.55)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !form.email || !form.nom}
                aria-label="Envoyer le formulaire de contact"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: loading || !form.email || !form.nom
                    ? 'rgba(79,195,247,0.3)'
                    : 'linear-gradient(135deg, #0D1B2A, #1e3a5f)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 15,
                  padding: '14px 24px',
                  borderRadius: 14,
                  border: 'none',
                  cursor: loading || !form.email || !form.nom ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(13,27,42,0.3)',
                  transition: 'all 0.2s',
                }}>
                {loading
                  ? <span style={{ color: '#ffffff' }}>Envoi en cours...</span>
                  : <><ArrowRight size={16} style={{ color: '#4FC3F7' }} /><span style={{ color: '#ffffff' }}>Envoyer</span></>
                }
              </button>

              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                Ou écrivez à{' '}
                <a href="mailto:contact@vcel.fr"
                  style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>
                  contact@vcel.fr
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}