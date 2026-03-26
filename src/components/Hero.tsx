'use client'
import { useEffect, useRef } from 'react'
import { ArrowRight, Clock, BarChart2, Bot, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react'

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = ref.current?.querySelectorAll('.fade-in')
    els?.forEach((el, i) => {
      const e = el as HTMLElement
      e.style.opacity = '0'
      e.style.transform = 'translateY(28px)'
      setTimeout(() => {
        e.style.transition = 'opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1)'
        e.style.opacity = '1'
        e.style.transform = 'translateY(0)'
      }, i * 130 + 80)
    })
  }, [])

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden" style={{ backgroundColor: '#F5F4F0' }}>

      {/* Fond ambiance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[80px]" />
        <div className="absolute bottom-10 left-[5%] w-[400px] h-[400px] rounded-full bg-navy-800/6 blur-[60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-300/5 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(var(--navy) 1px, transparent 1px), linear-gradient(90deg, var(--navy) 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">

        {/* Badge */}
        <div className="fade-in inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white border border-[var(--border)] shadow-sm text-[var(--text-secondary)] text-xs font-semibold">
          <Sparkles size={12} className="text-cyan-600" />
          Automatisation pour solopreneurs et TPE/PME
          <span className="w-px h-3 bg-[var(--border)]" />
          <span className="text-cyan-600 font-bold">Nouveau</span>
        </div>

        {/* Headline */}
        <h1 className="fade-in font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.0] tracking-tight mb-6 text-[var(--navy)]">
          Pilotez votre business<br />
          <em className="not-italic text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4FC3F7 0%, #0288D1 50%, #4FC3F7 100%)' }}>
            sans effort
          </em>
        </h1>

        <p className="fade-in text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-3 font-light">
          Dashboard financier, CRM leads et coach IA — tout en un, connecté à vos outils, opérationnel en 24h.
        </p>

        {/* Promo code */}
        <p className="fade-in text-sm text-[var(--text-muted)] mb-10">
          Code lancement <span className="font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-lg">SOLOFREE</span> — 1er mois offert
        </p>

        <div className="fade-in flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <a href="#tarifs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold text-white group transition-all"
            style={{ background: 'linear-gradient(135deg, #0D1B2A, #1A2E45)', boxShadow: '0 4px 20px rgba(13,27,42,0.25)' }}>
            Commencer gratuitement
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold text-[var(--navy)] bg-white border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-md transition-all">
            Voir la démo
          </a>
        </div>

        {/* 3 pilliers */}
        <div className="fade-in grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: Clock,     title: 'Gain de temps',        desc: 'Tâches répétitives automatisées' },
            { icon: BarChart2, title: 'Visibilité financière', desc: 'CA, charges, marge en temps réel' },
            { icon: Bot,       title: 'Coach IA',              desc: 'Conseils personnalisés chaque semaine' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-left rounded-2xl p-4 bg-white border border-[var(--border)] hover:border-cyan-200 hover:shadow-md transition-all group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ background: '#0D1B2A' }}>
                <Icon size={16} className="text-cyan-400" />
              </div>
              <p className="text-[var(--text-primary)] text-sm font-semibold mb-1">{title}</p>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats sociales */}
        <div className="fade-in flex flex-wrap items-center justify-center gap-6 mt-12 pt-12 border-t border-[var(--border)]">
          {[
            { val: '49€', label: '/mois tout inclus' },
            { val: '24h', label: 'pour être opérationnel' },
            { val: '8', label: 'modules connectés' },
          ].map(s => (
            <div key={s.val} className="text-center">
              <p className="font-display text-3xl font-normal text-[var(--navy)]">{s.val}</p>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-px h-10 bg-gradient-to-b from-[var(--navy)] to-transparent opacity-20" />
      </div>
    </section>
  )
}