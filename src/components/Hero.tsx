'use client'
import { useEffect, useRef } from 'react'
import { ArrowRight, Clock, BarChart2, Bot } from 'lucide-react'

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = ref.current?.querySelectorAll('.fade-in')
    els?.forEach((el, i) => {
      const e = el as HTMLElement
      e.style.opacity = '0'
      e.style.transform = 'translateY(20px)'
      setTimeout(() => {
        e.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
        e.style.opacity = '1'
        e.style.transform = 'translateY(0)'
      }, i * 100 + 100)
    })
  }, [])

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden">

      {/* Background subtil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent)]" />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Badge */}
        <div className="fade-in inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Automatisation pour solopreneurs et TPE/PME
        </div>

        {/* Headline sobre */}
        <h1 className="fade-in font-display text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 text-white">
          Automatisez votre<br />
          <span className="text-blue-400">gestion d'entreprise</span>
        </h1>

        <p className="fade-in text-white/45 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-light">
          Dashboard financier, CRM leads, résumé hebdo IA — connectés à vos outils existants.
          Configuration incluse, opérationnel en 24h.
        </p>

        <div className="fade-in flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <a href="#tarifs"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 group">
            Voir les offres
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a href="#workflows"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
            Voir les fonctionnalités
          </a>
        </div>

        {/* 3 pilliers honnêtes */}
        <div className="fade-in grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: Clock, title: 'Gain de temps', desc: 'Tâches répétitives automatisées' },
            { icon: BarChart2, title: 'Visibilité financière', desc: 'CA, charges, marge en temps réel' },
            { icon: Bot, title: 'Coach IA', desc: 'Conseils personnalisés chaque semaine' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/3 border border-white/8 rounded-2xl p-5 text-left hover:border-white/15 transition-colors">
              <Icon size={18} className="text-blue-400 mb-3" />
              <p className="text-white text-sm font-semibold mb-1">{title}</p>
              <p className="text-white/35 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </section>
  )
}
