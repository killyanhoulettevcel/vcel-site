'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock, BarChart2, Bot, Sparkles } from 'lucide-react'

// ── Compteur animé ────────────────────────────────────────────────────────────
function AnimatedCounter({ to, suffix = '', duration = 1800 }: { to: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration)
          // Ease out cubic
          const ease = 1 - Math.pow(1 - p, 3)
          setCount(Math.round(ease * to))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// ── Texte morphing ────────────────────────────────────────────────────────────
const morphWords = ['sans effort', 'automatiquement', 'en 24 heures', 'sans technique']

function MorphingText() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % morphWords.length)
        setVisible(true)
      }, 400)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className="text-gradient-animated inline-block"
      style={{
        transition: 'opacity 0.4s cubic-bezier(.16,1,.3,1), transform 0.4s cubic-bezier(.16,1,.3,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        minWidth: '6ch',
      }}>
      {morphWords[index]}
    </span>
  )
}

// ── Hero principal ────────────────────────────────────────────────────────────
export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  // Fade-in séquentiel — le H1 (LCP) reste visible dès le départ
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.fade-in')
    els?.forEach((el, i) => {
      const e = el as HTMLElement
      // Ne pas masquer le H1 (LCP) — seulement les éléments non-critiques
      if (e.tagName === 'H1') return
      e.style.opacity = '0'
      e.style.transform = 'translateY(24px)'
      setTimeout(() => {
        e.style.transition = 'opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1)'
        e.style.opacity = '1'
        e.style.transform = 'translateY(0)'
      }, i * 140 + 80)
    })
  }, [])

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-6 pt-28 pb-20 overflow-hidden" style={{ backgroundColor: '#F5F4F0' }}>

      {/* Fond ambiance — halo qui respire */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(ellipse, rgba(79,195,247,0.22) 0%, transparent 65%)', animation: 'breathe 6s ease-in-out infinite' }} />
        <div className="absolute top-16 right-[8%] w-[250px] h-[250px] rounded-full blur-[80px]"
          style={{ background: 'rgba(79,195,247,0.10)', animation: 'breathe 8s ease-in-out infinite 1s' }} />
        <div className="absolute bottom-32 left-[5%] w-[200px] h-[200px] rounded-full blur-[70px]"
          style={{ background: 'rgba(13,27,42,0.05)', animation: 'breathe 7s ease-in-out infinite 2s' }} />
        <div className="absolute inset-0 opacity-[0.022]"
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

        {/* Headline avec morphing */}
        <h1 className="fade-in font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.05] tracking-tight mb-6 text-[var(--navy)]">
          Pilotez votre business<br />
          <MorphingText />
        </h1>

        <p className="fade-in text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4 font-light">
          Le logiciel de gestion tout-en-un pour solopreneurs et TPE/PME — dashboard financier, CRM leads et coach IA connectés à Google Sheets. Opérationnel en 24h.
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

        {/* 3 pilliers — tilt 3D au hover */}
        <div className="fade-in grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: Clock,     title: 'Gain de temps',        desc: 'Tâches répétitives automatisées' },
            { icon: BarChart2, title: 'Visibilité financière', desc: 'CA, charges, marge en temps réel' },
            { icon: Bot,       title: 'Coach IA',              desc: 'Conseils personnalisés chaque semaine' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title}
              className="tilt-card text-left rounded-2xl p-4 bg-white border border-[var(--border)] cursor-default"
              style={{ transformStyle: 'preserve-3d', willChange: 'transform', transition: 'box-shadow 0.3s, border-color 0.3s' }}
              onMouseMove={e => {
                const el = e.currentTarget
                const rect = el.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width - 0.5
                const y = (e.clientY - rect.top) / rect.height - 0.5
                el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`
                el.style.boxShadow = `${-x * 12}px ${y * 8}px 32px rgba(13,27,42,0.12), 0 0 24px rgba(79,195,247,0.12)`
                el.style.borderColor = 'rgba(79,195,247,0.35)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) translateY(0)'
                el.style.boxShadow = ''
                el.style.borderColor = 'rgba(13,27,42,0.08)'
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#0D1B2A', transform: 'translateZ(20px)' }}>
                <Icon size={16} className="text-cyan-400" />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)', transform: 'translateZ(10px)' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats — compteurs animés */}
        <div className="fade-in flex flex-wrap items-center justify-center gap-8 md:gap-12 mt-12 pt-12 border-t border-[var(--border)]">
          {[
            { to: 49,  suffix: '€',  label: '/mois tout inclus',       duration: 1200 },
            { to: 24,  suffix: 'h',  label: 'pour être opérationnel',  duration: 1500 },
            { to: 8,   suffix: '',   label: 'modules connectés',        duration: 900 },
            { to: 50,  suffix: '+',  label: 'utilisateurs actifs',      duration: 1800 },
          ].map((s, i) => (
            <div key={i} className="text-center group cursor-default">
              <p className="font-display text-3xl md:text-4xl font-normal transition-all duration-300 group-hover:scale-110"
                style={{ color: 'var(--navy)' }}>
                <AnimatedCounter to={s.to} suffix={s.suffix} duration={s.duration} />
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="w-px h-10 bg-gradient-to-b from-[var(--navy)] to-transparent opacity-20" />
      </div>
    </section>
  )
}