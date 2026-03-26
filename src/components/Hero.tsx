'use client'
import { useEffect, useRef } from 'react'
import { ArrowRight, Clock, BarChart2, Bot, Sparkles } from 'lucide-react'

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fade-in séquentiel des éléments hero
    const els = ref.current?.querySelectorAll('.fade-in')
    els?.forEach((el, i) => {
      const e = el as HTMLElement
      e.style.opacity = '0'
      e.style.transform = 'translateY(28px)'
      setTimeout(() => {
        e.style.transition = 'opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1)'
        e.style.opacity = '1'
        e.style.transform = 'translateY(0)'
      }, i * 140 + 100)
    })
  }, [])

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden" style={{ backgroundColor: '#F5F4F0' }}>

      {/* Fond ambiance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Halo cyan central — attire l'œil vers le headline */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(79,195,247,0.20) 0%, transparent 65%)' }} />
        <div className="absolute top-16 right-[8%] w-[250px] h-[250px] rounded-full blur-[80px]"
          style={{ background: 'rgba(79,195,247,0.10)' }} />
        <div className="absolute bottom-32 left-[5%] w-[200px] h-[200px] rounded-full blur-[70px]"
          style={{ background: 'rgba(13,27,42,0.06)' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(var(--navy) 1px, transparent 1px), linear-gradient(90deg, var(--navy) 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">

        {/* Badge */}
        <div className="fade-in inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white border border-[var(--border)] shadow-sm text-[var(--text-secondary)] text-xs font-semibold">
          <Sparkles size={12} className="text-cyan-600 animate-pulse" />
          Automatisation pour solopreneurs et TPE/PME
          <span className="w-px h-3 bg-[var(--border)]" />
          <span className="text-cyan-600 font-bold">Nouveau</span>
        </div>

        {/* Headline — heatmap principale */}
        <h1 className="fade-in font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.0] tracking-tight mb-6 text-[var(--navy)]">
          Pilotez votre business<br />
          <span className="text-gradient-animated">sans effort</span>
        </h1>

        <p className="fade-in text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4 font-light">
          Dashboard financier, CRM leads et coach IA — tout en un, connecté à vos outils, opérationnel en 24h.
        </p>

        {/* Promo code */}
        <p className="fade-in text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
          Code lancement{' '}
          <span className="font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg mx-1 animate-border-glow inline-block">SOLOFREE</span>
          — 1er mois offert
        </p>

        {/* CTAs */}
        <div className="fade-in flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <a href="#tarifs" className="landing-btn-primary w-full sm:w-auto group">
            Commencer gratuitement
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" style={{ color: '#ffffff' }} />
          </a>
          <a href="#demo" className="landing-btn-secondary w-full sm:w-auto">
            Voir la démo
          </a>
        </div>

        {/* 3 pilliers */}
        <div className="fade-in grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: Clock,     title: 'Gain de temps',        desc: 'Tâches répétitives automatisées' },
            { icon: BarChart2, title: 'Visibilité financière', desc: 'CA, charges, marge en temps réel' },
            { icon: Bot,       title: 'Coach IA',              desc: 'Conseils personnalisés chaque semaine' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={title}
              className="text-left rounded-2xl p-4 bg-white border border-[var(--border)] transition-all duration-300 group cursor-default heatmap-primary"
              style={{ animationDelay: `${i * 100}ms` }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(79,195,247,0.4)'
                el.style.boxShadow = '0 8px 32px rgba(13,27,42,0.10), 0 0 24px rgba(79,195,247,0.15)'
                el.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(13,27,42,0.08)'
                el.style.boxShadow = ''
                el.style.transform = ''
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3"
                style={{ background: '#0D1B2A' }}>
                <Icon size={16} className="text-cyan-400" />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="fade-in flex flex-wrap items-center justify-center gap-8 mt-12 pt-12 border-t border-[var(--border)]">
          {[
            { val: '49€', label: '/mois tout inclus' },
            { val: '24h', label: 'pour être opérationnel' },
            { val: '8', label: 'modules connectés' },
          ].map((s, i) => (
            <div key={s.val} className="text-center group cursor-default">
              <p className="font-display text-3xl font-normal transition-all duration-300 group-hover:scale-110"
                style={{ color: 'var(--navy)', display: 'block' }}>
                {s.val}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-10 bg-gradient-to-b from-[var(--navy)] to-transparent opacity-20" />
      </div>
    </section>
  )
}