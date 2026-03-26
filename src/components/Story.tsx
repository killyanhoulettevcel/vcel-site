'use client'
import { useEffect, useRef, useState } from 'react'

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
          setVal(Math.round((1 - Math.pow(1 - p, 3)) * to))
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
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 12 }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, transitionDelay: `${delay}ms` }} />
      </div>
    </div>
  )
}

// ── Donut ─────────────────────────────────────────────────────────────────────
function Donut({ pct, color, size = 110 }: { pct: number; color: string; size?: number }) {
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
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" stroke="rgba(255,255,255,0.07)" />
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" stroke={color}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ - (p / 100) * circ}
        style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1) 0.3s', transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }} />
      <text x="50" y="50" dominantBaseline="middle" textAnchor="middle"
        style={{ fill: color, fontSize: 20, fontWeight: 700, fontFamily: 'DM Serif Display, serif' }}>{p}%</text>
    </svg>
  )
}

const steps = [
  { tag: 'MON HISTOIRE',        accent: '#4FC3F7' },
  { tag: 'LE DÉCLENCHEUR',      accent: '#4FC3F7' },
  { tag: 'CE QUE J\'AI DÉCOUVERT', accent: '#4FC3F7' },
  { tag: 'LA RÉALITÉ',          accent: '#f97316' },
  { tag: 'LA VISION',           accent: '#4FC3F7' },
  { tag: 'CE QUE VCEL FAIT',    accent: '#10b981' },
  { tag: 'POUR TOI',            accent: '#4FC3F7' },
]

function StepContent({ id, p }: { id: number; p: number }) {
  if (id === 0) return (
    <div className="flex flex-col justify-center h-full gap-4">
      <h3 className="font-display text-3xl md:text-5xl font-normal leading-tight" style={{ color: '#ffffff' }}>
        Pourquoi j'ai créé{' '}
        <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>VCEL.</span>
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7 }}>
        L'histoire vraie — une vision, une étude, et une décision qui a tout changé.
      </p>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4FC3F7' }} />
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Scrollez pour découvrir →</span>
      </div>
    </div>
  )

  if (id === 1) return (
    <div className="flex flex-col justify-center h-full gap-5">
      <blockquote className="font-display text-xl md:text-2xl leading-snug"
        style={{ color: '#ffffff', borderLeft: '3px solid #4FC3F7', paddingLeft: 20 }}>
        "Killyan, les tâches administratives me bouffent mes semaines entières."
      </blockquote>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.75 }}>
        Des dizaines d'entrepreneurs me disaient la même chose. Des gens brillants, ambitieux —
        <strong style={{ color: '#ffffff' }}> paralysés par du temps volé à leur vraie mission.</strong>
      </p>
    </div>
  )

  if (id === 2) return (
    <div className="flex flex-col justify-center h-full gap-5">
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
        J'ai creusé. J'ai étudié. Et j'ai trouvé quelque chose que{' '}
        <strong style={{ color: '#ffffff' }}>personne ne disait à voix haute.</strong>
      </p>
      <div className="flex items-center gap-6 p-5 rounded-2xl" style={{ background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)' }}>
        <Donut pct={45} color="#4FC3F7" size={110} />
        <div>
          <p style={{ color: '#ffffff', fontWeight: 700, fontSize: 15, lineHeight: 1.5 }}>
            des dirigeants de PME se sentent seuls dans leur business
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 8 }}>Source : Bpifrance Le Lab</p>
        </div>
      </div>
    </div>
  )

  if (id === 3) return (
    <div className="flex flex-col justify-center h-full gap-5">
      <h3 className="font-display text-2xl md:text-3xl leading-tight" style={{ color: '#ffffff' }}>
        Pas seuls par manque d'entourage.
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.75 }}>
        Seuls face aux décisions. Seuls face aux chiffres. Seuls quand ça va pas —{' '}
        <strong style={{ color: '#ffffff' }}>et seuls aussi quand ça va bien.</strong>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: 3, suffix: 'h', label: 'perdues/semaine en admin', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
          { to: 800, suffix: '€', label: 'perdus/mois en relances tardives', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
        ].map((m, i) => (
          <div key={i} className="rounded-2xl p-4 text-center" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
            <p className="font-display text-3xl"><Counter to={m.to} suffix={m.suffix} color={m.color} duration={1500} /></p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 5 }}>{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  )

  if (id === 4) return (
    <div className="flex flex-col justify-center h-full gap-5">
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
        C'est là que j'ai compris ce que VCEL devait être.
      </p>
      <div className="space-y-3">
        {[
          { label: 'Juste un dashboard', ok: false },
          { label: "Juste un outil d'automatisation", ok: false },
          { label: 'Un vrai copilote pour ton business', ok: true },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-4 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 10, fontWeight: 800, width: 28, color: c.ok ? '#4FC3F7' : 'rgba(255,255,255,0.2)' }}>
              {c.ok ? 'OUI' : 'NON'}
            </span>
            <div className="w-5 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <span style={{ color: c.ok ? '#ffffff' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: c.ok ? 700 : 400 }}>
              {c.label}
            </span>
            {c.ok && <span className="ml-auto" style={{ color: '#4FC3F7' }}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  )

  if (id === 5) return (
    <div className="flex flex-col justify-center h-full gap-5">
      <h3 className="font-display text-2xl md:text-3xl leading-tight">
        <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>Célèbre </span>
        <span style={{ color: '#ffffff' }}>tes victoires avec toi.</span>
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.75 }}>
        Gère les tâches répétitives. Donne une vision claire en temps réel.
        Reconnaît chaque victoire — <strong style={{ color: 'rgba(255,255,255,0.85)' }}>même les petites.</strong>
      </p>
      <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Bar pct={72} color="#ef4444" label="Temps admin sans outil" delay={0} />
        <Bar pct={12} color="#10b981" label="Temps admin avec VCEL" delay={200} />
      </div>
    </div>
  )

  if (id === 6) return (
    <div className="flex flex-col justify-center h-full gap-5">
      <h3 className="font-display text-3xl md:text-4xl leading-tight" style={{ color: '#ffffff' }}>
        L'outil que j'aurais voulu{' '}
        <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>avoir.</span>
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
        Celui que je construis pour vous.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: 20, suffix: 'h', label: 'économisées/mois', color: '#4FC3F7' },
          { to: 49, suffix: '€', label: '/mois seulement', color: '#10b981' },
          { to: 24, suffix: 'h', label: 'opérationnel', color: '#f97316' },
        ].map((m, i) => (
          <div key={i} className="rounded-xl p-4 text-center"
            style={{ background: `${m.color}12`, border: `1px solid ${m.color}25` }}>
            <p className="font-display text-2xl md:text-3xl"><Counter to={m.to} suffix={m.suffix} color={m.color} duration={1500} /></p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 4 }}>{m.label}</p>
          </div>
        ))}
      </div>
      <a href="#tarifs" className="landing-btn-primary inline-flex justify-center text-sm mt-2">
        Rejoindre VCEL — 1er mois offert
      </a>
    </div>
  )

  return null
}

export default function Story() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const onScroll = () => {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const total = section.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const globalProgress = Math.min(1, scrolled / total)
      const stepSize = 1 / steps.length
      const step = Math.min(steps.length - 1, Math.floor(globalProgress / stepSize))
      const local = (globalProgress - step * stepSize) / stepSize
      setActiveStep(step)
      setStepProgress(Math.min(1, local * 1.5))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobile])

  const current = steps[activeStep]

  // ── Mobile : tabs ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <section className="py-16 px-4" style={{ background: 'linear-gradient(180deg, #0D1B2A, #0a1520)' }}>
        <div className="text-center mb-8">
          <p className="text-cyan-400 text-xs font-semibold mb-2 tracking-widest uppercase">Mon histoire</p>
          <h2 className="font-display text-3xl font-normal" style={{ color: '#ffffff' }}>
            Pourquoi VCEL <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>existe.</span>
          </h2>
        </div>
        {/* Photo mobile */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl blur-[20px] opacity-20" style={{ background: 'linear-gradient(135deg, #4FC3F7, #0288D1)' }} />
            <img src="/killyan.png" alt="Killyan Houlette — Fondateur VCEL"
              width={200} height={200}
              className="relative rounded-2xl shadow-2xl object-cover"
              style={{ width: 180, border: '1px solid rgba(79,195,247,0.25)' }} />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl px-4 py-2 shadow-lg whitespace-nowrap"
              style={{ border: '1px solid rgba(13,27,42,0.1)' }}>
              <p style={{ color: '#0D1B2A', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>Killyan Houlette</p>
              <p style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 600, textAlign: 'center' }}>Fondateur · VCEL</p>
            </div>
          </div>
        </div>
        {/* Tabs mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide mt-8">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={{
                background: activeStep === i ? s.accent : 'transparent',
                color: activeStep === i ? '#0D1B2A' : 'rgba(255,255,255,0.4)',
                borderColor: activeStep === i ? s.accent : 'rgba(255,255,255,0.1)',
              }}>
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(79,195,247,0.12)', minHeight: 280 }}>
          <p style={{ color: current.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', marginBottom: 16 }}>— {current.tag}</p>
          <div style={{ position: 'relative', minHeight: 220 }}>
            <StepContent id={activeStep} p={1} />
          </div>
        </div>
      </section>
    )
  }

  // ── Desktop : scroll-driven ────────────────────────────────────────────────
  return (
    <section ref={sectionRef} style={{ height: `${steps.length * 100}vh` }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0a1520 100%)' }}>

        {/* Grille déco */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(79,195,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

        {/* Halo accent qui change de couleur */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse at 35% 50%, ${current.accent}08 0%, transparent 55%)` }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            {/* ── Photo + infos — FIXE ── */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-5 rounded-3xl pointer-events-none blur-[40px] opacity-25 transition-all duration-1000"
                  style={{ background: `linear-gradient(135deg, ${current.accent}, #0288D1)` }} />
                <img
                  src="/killyan.png"
                  alt="Killyan Houlette — Fondateur de VCEL"
                  width={380} height={380}
                  className="relative rounded-3xl object-cover shadow-2xl transition-all duration-700"
                  style={{
                    width: 'clamp(260px, 30vw, 360px)',
                    height: 'auto',
                    border: `1px solid ${current.accent}30`,
                    boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 40px ${current.accent}15`,
                  }}
                />
                {/* Badge fondateur */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-5 py-3 shadow-xl border whitespace-nowrap"
                  style={{ border: '1px solid rgba(13,27,42,0.1)' }}>
                  <p style={{ color: '#0D1B2A', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>Killyan Houlette</p>
                  <p style={{ color: current.accent, fontSize: 11, fontWeight: 600, textAlign: 'center', transition: 'color 0.5s' }}>Fondateur · VCEL</p>
                </div>
              </div>

              {/* Dots progression */}
              <div className="flex items-center gap-2 mt-8">
                {steps.map((s, i) => (
                  <button key={i}
                    onClick={() => {
                      const section = sectionRef.current
                      if (!section) return
                      const target = section.offsetTop + (i / steps.length) * (section.offsetHeight - window.innerHeight) + 10
                      window.scrollTo({ top: target, behavior: 'smooth' })
                    }}
                    className="rounded-full transition-all duration-500"
                    style={{ height: 4, width: i === activeStep ? 28 : 8, background: i === activeStep ? current.accent : 'rgba(255,255,255,0.2)' }} />
                ))}
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginLeft: 8 }}>
                  {String(activeStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* ── Contenu slide — CHANGE ── */}
            <div>
              {/* Tag */}
              <p key={`tag-${activeStep}`} className="text-xs font-bold mb-5 tracking-widest"
                style={{ color: current.accent, animation: 'revealUp 0.4s ease forwards' }}>
                — {current.tag}
              </p>

              {/* Contenu */}
              <div key={`content-${activeStep}`} style={{ animation: 'revealUp 0.5s cubic-bezier(.16,1,.3,1) forwards', minHeight: 340 }}>
                <StepContent id={activeStep} p={stepProgress} />
              </div>

              {/* Barre progression */}
              <div className="mt-8">
                <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', width: 160 }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${stepProgress * 100}%`, background: current.accent }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}