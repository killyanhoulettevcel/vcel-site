'use client'
import { useEffect, useRef } from 'react'
import { FileText, Bell, BarChart2, PenLine, UserPlus, ScanLine, Landmark, Bot } from 'lucide-react'

const workflows = [
  { num: '01', icon: FileText,  title: 'Dashboard financier',    desc: 'Synchronisation de votre CA, charges et marge depuis Google Sheets. Mise à jour automatique chaque semaine.',  tag: 'Finance',      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',   accent: '#2563eb' },
  { num: '02', icon: Bell,      title: 'Résumé hebdo IA',        desc: 'Chaque lundi, un email personnalisé avec vos chiffres clés, vos leads en attente et un conseil actionnable.',   tag: 'IA',           color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', accent: '#7c3aed' },
  { num: '03', icon: UserPlus,  title: 'CRM Leads',              desc: 'Suivi de vos prospects : statut, score, dernière relance. Filtres et notes intégrés.',                          tag: 'Commercial',   color: 'text-cyan-600',   bg: 'bg-cyan-50',   border: 'border-cyan-100',   accent: '#0284c7' },
  { num: '04', icon: BarChart2, title: 'Reporting CA',           desc: 'Graphiques d\'évolution mensuelle et trimestrielle. Exportable et consultable depuis le dashboard.',            tag: 'Analytique',   color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-100',accent: '#059669' },
  { num: '05', icon: FileText,  title: 'Gestion factures',       desc: 'Suivi des factures émises et impayées. Alertes automatiques sur les retards de paiement.',                      tag: 'Comptabilité', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', accent: '#ea580c' },
  { num: '06', icon: PenLine,   title: 'Coach IA business',      desc: 'Posez vos questions à votre coach IA. Il connaît vos chiffres et vos objectifs pour répondre précisément.',    tag: 'IA',           color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', accent: '#7c3aed' },
  { num: '07', icon: ScanLine,  title: 'Synchronisation Google', desc: 'Connexion bidirectionnelle avec Google Sheets. Vos données restent dans vos outils existants.',               tag: 'Intégration',  color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-100',   accent: '#0d9488' },
  { num: '08', icon: Landmark,  title: 'Objectifs & suivi',      desc: 'Définissez vos objectifs mensuels. Le dashboard suit votre progression et vous alerte en cas de retard.',      tag: 'Pilotage',     color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100',  accent: '#d97706' },
]

export default function Workflows() {
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const speed = 0.4
    const totalWidth = track.scrollWidth / 2

    const animate = () => {
      if (!pausedRef.current) {
        posRef.current += speed
        if (posRef.current >= totalWidth) posRef.current = 0
        track.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <section id="workflows" className="relative py-20 md:py-28 overflow-hidden" style={{ backgroundColor: '#EFEEE9' }}>

      {/* Accent couleur en haut — heatmap header */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #4FC3F7, #0288D1, #4FC3F7)' }} />

      <div className="max-w-6xl mx-auto px-6 mb-12">
        <p className="text-cyan-600 text-sm font-semibold mb-3 tracking-wide uppercase">Fonctionnalités</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h2 className="font-display text-3xl md:text-5xl text-[var(--navy)] max-w-xl">
            Tout ce dont vous avez besoin,{' '}
            <em className="not-italic" style={{ color: '#7A90A4' }}>rien de superflu</em>
          </h2>
          <p className="text-[var(--text-muted)] text-sm md:text-base max-w-xs md:text-right">
            8 modules connectés entre eux. Vos données, votre stack Google, votre coach IA personnel.
          </p>
        </div>
      </div>

      {/* Carrousel fonctionnalités */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #EFEEE9, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(-90deg, #EFEEE9, transparent)' }} />

        <div ref={trackRef} className="flex gap-4 will-change-transform px-6" style={{ width: 'max-content' }}>
          {[...workflows, ...workflows].map((w, i) => (
            <div
              key={i}
              onMouseEnter={() => { pausedRef.current = true }}
              onMouseLeave={() => { pausedRef.current = false }}
              className="w-72 shrink-0 bg-white rounded-2xl border p-5 cursor-default select-none transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
              style={{ borderColor: 'rgba(13,27,42,0.08)', boxShadow: '0 2px 12px rgba(13,27,42,0.06)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${w.accent}15` }}>
                  <w.icon size={18} style={{ color: w.accent }} />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg"
                  style={{ background: `${w.accent}12`, color: w.accent }}>
                  {w.tag}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-light)] font-mono mb-1">{w.num}</p>
              <h3 className="font-semibold text-[var(--navy)] text-sm mb-2 leading-tight">{w.title}</h3>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">{w.desc}</p>

              {/* Barre accent en bas */}
              <div className="mt-4 h-0.5 rounded-full opacity-30" style={{ background: w.accent }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}