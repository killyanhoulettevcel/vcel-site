'use client'
import { useEffect, useRef } from 'react'
import { ArrowRight, Clock, TrendingUp, Users } from 'lucide-react'

const stats = [
  { icon: Clock, value: '20h', label: 'économisées / semaine' },
  { icon: TrendingUp, value: '200h', label: 'récupérées / an' },
  { icon: Users, value: '10k€', label: 'valeur générée @25€/h' },
]

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = ref.current?.querySelectorAll('.opacity-0-init')
    els?.forEach((el, i) => {
      setTimeout(() => {
        el.classList.remove('opacity-0-init')
        el.classList.add('animate-fade-up')
      }, i * 120)
    })
  }, [])

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">

      {/* Background orbs */}
      <div className="glow-orb w-[600px] h-[600px] bg-blue-600/20 top-[-100px] left-[-200px]" />
      <div className="glow-orb w-[400px] h-[400px] bg-blue-400/10 bottom-[0px] right-[-100px] animate-glow-pulse" />
      <div className="glow-orb w-[200px] h-[200px] bg-indigo-500/20 top-[40%] right-[20%]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Badge */}
        <div className="opacity-0-init inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-blue-400/20 bg-blue-500/10 text-blue-300 text-xs font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Pack Starter — 1er mois à 19€ avec le code SOLO19
        </div>

        {/* Headline */}
        <h1 className="opacity-0-init font-display text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
          <span className="text-white">Récupérez </span>
          <span className="shimmer-text">20h par semaine</span>
          <br />
          <span className="text-white">sur votre admin</span>
        </h1>

        <p className="opacity-0-init text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-light">
          8 workflows n8n prêts-à-lancer pour solopreneurs et PME.
          Devis PDP, CRM, CA, posts réseaux — <span className="text-white/80">actifs en 2 minutes.</span>
        </p>

        {/* CTAs */}
        <div className="opacity-0-init flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a href="#tarifs" className="btn-primary text-base px-8 py-4 group">
            Démarrer à 19€
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#workflows" className="btn-ghost text-base px-8 py-4">
            Voir les 8 workflows
          </a>
        </div>

        {/* Stats */}
        <div className="opacity-0-init grid grid-cols-3 gap-4 max-w-xl mx-auto">
          {stats.map((s) => (
            <div key={s.value} className="card-glass p-4 text-center">
              <s.icon size={18} className="text-blue-400 mx-auto mb-2" />
              <div className="font-display font-bold text-2xl text-white">{s.value}</div>
              <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="opacity-0-init mt-10 flex items-center justify-center gap-3 text-white/30 text-sm">
          <div className="flex -space-x-2">
            {['bg-blue-400', 'bg-indigo-400', 'bg-cyan-400', 'bg-blue-600'].map((c, i) => (
              <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-navy-950 flex items-center justify-center text-xs font-bold text-white`}>
                {['K','M','S','A'][i]}
              </div>
            ))}
          </div>
          <span>+47 solopreneurs automatisés ce mois</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 text-xs animate-float">
        <span>Découvrir</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </section>
  )
}
