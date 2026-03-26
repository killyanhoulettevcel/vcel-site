'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

// ── Compteur animé ────────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1800, color = '#4FC3F7' }: {
  to: number; suffix?: string; duration?: number; color?: string
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const done = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !done.current) {
        done.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration)
          const ease = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(ease * to))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])
  return <span ref={ref} style={{ color }}>{val}{suffix}</span>
}

// ── Barre animée ──────────────────────────────────────────────────────────────
function Bar({ pct, color, label, delay = 0 }: { pct: number; color: string; label: string; delay?: number }) {
  const [w, setW] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setTimeout(() => setW(pct), delay); obs.unobserve(entries[0].target) }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [pct, delay])
  return (
    <div ref={ref} className="mb-3">
      <div className="flex justify-between mb-1.5">
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 11 }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}70, ${color})`, transitionDelay: `${delay}ms` }} />
      </div>
    </div>
  )
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function Donut({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const [p, setP] = useState(0)
  const r = 40, circ = 2 * Math.PI * r
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setTimeout(() => setP(pct), 300); obs.unobserve(entries[0].target) }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [pct])
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" stroke="rgba(255,255,255,0.06)" />
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" stroke={color}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ - (p / 100) * circ}
        style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1) 0.3s', transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }} />
      <text x="50" y="50" dominantBaseline="middle" textAnchor="middle"
        style={{ fill: color, fontSize: 20, fontWeight: 700, fontFamily: 'DM Serif Display, serif' }}>{p}%</text>
    </svg>
  )
}

// ── Slides content ────────────────────────────────────────────────────────────
function SlideContent({ id, active }: { id: number; active: boolean }) {
  const style = {
    opacity: active ? 1 : 0,
    transform: active ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 0.5s cubic-bezier(.16,1,.3,1), transform 0.5s cubic-bezier(.16,1,.3,1)',
    position: 'absolute' as const, inset: 0,
  }

  if (id === 0) return (
    <div style={style} className="flex flex-col justify-center h-full">
      <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— MON HISTOIRE</span>
      <h3 className="font-display text-3xl md:text-4xl mt-4 mb-4 leading-tight" style={{ color: '#ffffff' }}>
        Pourquoi j'ai créé{' '}
        <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>VCEL.</span>
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
        L'histoire vraie — une vision, une étude, et une décision qui a tout changé.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4FC3F7' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Swipe ou attendez →</span>
      </div>
    </div>
  )

  if (id === 1) return (
    <div style={style} className="flex flex-col justify-center h-full">
      <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— LE DÉCLENCHEUR</span>
      <blockquote className="font-display text-xl md:text-2xl mt-4 mb-5 leading-snug"
        style={{ color: '#ffffff', borderLeft: '3px solid #4FC3F7', paddingLeft: 16 }}>
        "Killyan, les tâches administratives me bouffent mes semaines entières."
      </blockquote>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.7 }}>
        Des dizaines d'entrepreneurs me disaient la même chose. Des gens brillants, ambitieux —
        <strong style={{ color: 'rgba(255,255,255,0.85)' }}> paralysés par du temps volé à leur vraie mission.</strong>
      </p>
    </div>
  )

  if (id === 2) return (
    <div style={style} className="flex flex-col justify-center h-full">
      <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— CE QUE J'AI DÉCOUVERT</span>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, marginTop: 12, marginBottom: 16 }}>
        J'ai creusé. J'ai étudié. Et j'ai trouvé quelque chose que <strong style={{ color: '#ffffff' }}>personne ne disait à voix haute.</strong>
      </p>
      <div className="flex items-center gap-6">
        <Donut pct={45} color="#4FC3F7" size={110} />
        <div>
          <p style={{ color: '#ffffff', fontWeight: 700, fontSize: 14, lineHeight: 1.5 }}>
            des dirigeants de PME se sentent seuls dans leur business
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 6 }}>Source : Bpifrance Le Lab</p>
        </div>
      </div>
    </div>
  )

  if (id === 3) return (
    <div style={style} className="flex flex-col justify-center h-full">
      <span style={{ color: '#f97316', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— LA RÉALITÉ</span>
      <h3 className="font-display text-2xl md:text-3xl mt-4 mb-3 leading-tight" style={{ color: '#ffffff' }}>
        Pas seuls par manque d'entourage.
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
        Seuls face aux décisions. Seuls face aux chiffres. Seuls quand ça va pas — <strong style={{ color: '#ffffff' }}>et seuls aussi quand ça va bien.</strong>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <p className="font-display text-3xl"><Counter to={3} suffix="h" color="#f97316" duration={1200} /></p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 }}>perdues/semaine</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="font-display text-3xl"><Counter to={800} suffix="€" color="#ef4444" duration={2000} /></p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 }}>perdus/mois</p>
        </div>
      </div>
    </div>
  )

  if (id === 4) return (
    <div style={style} className="flex flex-col justify-center h-full">
      <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— LA VISION</span>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 12, marginBottom: 16 }}>
        C'est là que j'ai compris ce que VCEL devait être.
      </p>
      <div className="space-y-3">
        {[
          { label: "Juste un dashboard", ok: false },
          { label: "Juste un outil d'automatisation", ok: false },
          { label: "Un vrai copilote pour ton business", ok: true },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, width: 30, color: c.ok ? '#4FC3F7' : 'rgba(255,255,255,0.2)' }}>
              {c.ok ? 'OUI' : 'NON'}
            </span>
            <div className="w-5 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: c.ok ? '#ffffff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: c.ok ? 700 : 400 }}>
              {c.label}
            </span>
            {c.ok && <span className="ml-auto text-cyan-400 text-sm">✓</span>}
          </div>
        ))}
      </div>
    </div>
  )

  if (id === 5) return (
    <div style={style} className="flex flex-col justify-center h-full">
      <span style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— CE QUE VCEL FAIT</span>
      <h3 className="font-display text-2xl md:text-3xl mt-4 mb-3 leading-tight">
        <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>Célèbre </span>
        <span style={{ color: '#ffffff' }}>tes victoires avec toi.</span>
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
        Gère les tâches répétitives. Donne une vision claire. Reconnaît chaque victoire — <strong style={{ color: 'rgba(255,255,255,0.8)' }}>même les petites.</strong>
      </p>
      <Bar pct={72} color="#ef4444" label="Temps admin sans outil" delay={0} />
      <Bar pct={12} color="#10b981" label="Temps admin avec VCEL" delay={200} />
    </div>
  )

  if (id === 6) return (
    <div style={style} className="flex flex-col justify-center h-full">
      <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— POUR TOI</span>
      <h3 className="font-display text-3xl md:text-4xl mt-4 mb-4 leading-tight" style={{ color: '#ffffff' }}>
        L'outil que j'aurais voulu{' '}
        <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>avoir.</span>
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
        Celui que je construis pour vous.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { to: 20, suffix: 'h', label: 'économisées/mois', color: '#4FC3F7' },
          { to: 49, suffix: '€', label: '/mois seulement', color: '#10b981' },
          { to: 24, suffix: 'h', label: 'opérationnel', color: '#f97316' },
        ].map((m, i) => (
          <div key={i} className="rounded-xl p-3 text-center"
            style={{ background: `${m.color}12`, border: `1px solid ${m.color}25` }}>
            <p className="font-display text-2xl"><Counter to={m.to} suffix={m.suffix} color={m.color} duration={1500} /></p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 3 }}>{m.label}</p>
          </div>
        ))}
      </div>
      <a href="#tarifs" className="landing-btn-primary inline-flex text-sm justify-center">
        Rejoindre VCEL — 1er mois offert
      </a>
    </div>
  )

  return null
}

const TOTAL = 7

export default function Story() {
  const [active, setActive] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const goTo = useCallback((i: number) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setActive(i)
      setTransitioning(false)
    }, 200)
  }, [transitioning])

  const next = useCallback(() => goTo((active + 1) % TOTAL), [active, goTo])
  const prev = useCallback(() => goTo((active - 1 + TOTAL) % TOTAL), [active, goTo])

  // Auto-avance quand la section est visible
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        intervalRef.current = setInterval(() => setActive(a => (a + 1) % TOTAL), 5000)
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => { obs.disconnect(); if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #0a1520 100%)' }}>

      {/* Grille déco */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(79,195,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      <div className="absolute top-1/2 -left-20 w-96 h-96 rounded-full pointer-events-none blur-[120px] -translate-y-1/2"
        style={{ background: 'rgba(79,195,247,0.07)' }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-cyan-400 text-xs md:text-sm font-semibold mb-3 tracking-widest uppercase">Mon histoire</p>
          <h2 className="font-display text-3xl md:text-5xl font-normal" style={{ color: '#ffffff' }}>
            Pourquoi VCEL{' '}
            <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>existe.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">

          {/* ── Photo + infos fondateur ── */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="relative">
              {/* Halo photo */}
              <div className="absolute -inset-4 rounded-3xl pointer-events-none blur-[30px] opacity-30"
                style={{ background: 'linear-gradient(135deg, #4FC3F7, #0288D1)' }} />
              <img
                src="/killyan.png"
                alt="Killyan Houlette — Fondateur de VCEL"
                width={380}
                height={380}
                className="relative rounded-3xl object-cover shadow-2xl"
                style={{
                  width: 'clamp(240px, 35vw, 360px)',
                  height: 'auto',
                  border: '1px solid rgba(79,195,247,0.25)',
                }}
              />
              {/* Badge */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-5 py-3 shadow-xl border whitespace-nowrap"
                style={{ borderColor: 'rgba(13,27,42,0.1)' }}>
                <p style={{ color: '#0D1B2A', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>Killyan Houlette</p>
                <p style={{ color: '#4FC3F7', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>Fondateur · VCEL</p>
              </div>
            </div>

            {/* Numéros slide sous la photo */}
            <div className="flex items-center gap-2 mt-8">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-400"
                  style={{ height: 4, width: i === active ? 28 : 8, background: i === active ? '#4FC3F7' : 'rgba(255,255,255,0.2)' }} />
              ))}
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginLeft: 8 }}>
                {String(active + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* ── Slide card ── */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0D1B2A, #132238)',
                border: '1px solid rgba(79,195,247,0.15)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,195,247,0.05)',
              }}>

              {/* Barre top colorée */}
              <div className="h-1 w-full transition-all duration-500"
                style={{ background: active <= 1 ? '#4FC3F7' : active <= 3 ? '#f97316' : active <= 5 ? '#10b981' : '#4FC3F7' }} />

              {/* Contenu slides */}
              <div className="p-7 md:p-8" style={{ minHeight: 360, position: 'relative' }}>
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <SlideContent key={i} id={i} active={i === active && !transitioning} />
                ))}
              </div>

              {/* Footer navigation */}
              <div className="flex items-center justify-between px-7 md:px-8 py-4 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={prev}
                  className="text-xs font-semibold transition-all hover:opacity-100 disabled:opacity-20"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  disabled={active === 0}>
                  ← Précédent
                </button>
                <button onClick={next}
                  className="text-xs font-semibold transition-all hover:opacity-100"
                  style={{ color: active === TOTAL - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)' }}
                  disabled={active === TOTAL - 1}>
                  Suivant →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}