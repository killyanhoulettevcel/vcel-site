'use client'
import { useEffect, useRef } from 'react'
import { ArrowRight, Clock, BarChart2, Bot, Sparkles } from 'lucide-react'

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = ref.current?.querySelectorAll('.fade-in')
    els?.forEach((el, i) => {
      const e = el as HTMLElement
      e.style.opacity = '0'
      e.style.transform = 'translateY(24px)'
      setTimeout(() => {
        e.style.transition = 'opacity 0.7s ease, transform 0.7s ease'
        e.style.opacity = '1'
        e.style.transform = 'translateY(0)'
      }, i * 120 + 100)
    })
  }, [])

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden bg-cream-100">

      {/* Fond géométrique subtil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-navy-800/6 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-400/4 blur-3xl" />
        {/* Grille */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(var(--navy) 1px, transparent 1px), linear-gradient(90deg, var(--navy) 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Badge */}
        <div className="fade-in inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white border border-[var(--border)] shadow-sm-navy text-[var(--text-secondary)] text-xs font-semibold">
          <Sparkles size={13} className="text-cyan-600" />
          Automatisation pour solopreneurs et TPE/PME
          <span className="w-px h-3 bg-[var(--border)]" />
          <span className="text-cyan-600">Nouveau</span>
        </div>

        {/* Headline */}
        <h1 className="fade-in font-display text-4xl sm:text-5xl md:text-7xl font-normal leading-[1.05] tracking-tight mb-6 text-[var(--navy)]">
          Automatisez votre<br />
          <em className="not-italic text-transparent bg-clip-text bg-gradient-cyan">gestion d'entreprise</em>
        </h1>

        <p className="fade-in text-[var(--text-secondary)] text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-light">
          Dashboard financier, CRM leads, résumé hebdo IA — connectés à vos outils existants.
          Configuration incluse, opérationnel en 24h.
        </p>

        <div className="fade-in flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <a href="#tarifs"
            className="w-full sm:w-auto btn-primary text-sm px-8 py-3.5 flex items-center justify-center gap-2 group">
            Voir les offres
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a href="#workflows"
            className="w-full sm:w-auto btn-ghost text-sm px-8 py-3.5 flex items-center justify-center gap-2">
            Fonctionnalités
          </a>
        </div>

        {/* 3 pilliers */}
        <div className="fade-in grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: Clock,     title: 'Gain de temps',        desc: 'Tâches répétitives automatisées' },
            { icon: BarChart2, title: 'Visibilité financière', desc: 'CA, charges, marge en temps réel' },
            { icon: Bot,       title: 'Coach IA',              desc: 'Conseils personnalisés chaque semaine' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="kpi-card text-left group cursor-default">
              <div className="w-9 h-9 rounded-xl bg-navy-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon size={16} className="text-cyan-400" />
              </div>
              <p className="text-[var(--text-primary)] text-sm font-semibold mb-1">{title}</p>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-12 bg-gradient-to-b from-[var(--navy)] to-transparent opacity-20" />
      </div>
    </section>
  )
}
