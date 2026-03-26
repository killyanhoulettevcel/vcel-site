'use client'
import { useEffect, useRef, useState } from 'react'
import { useScrollReveal } from '@/lib/useScrollReveal'

// ── Compteur animé ────────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 2000, color = '#4FC3F7' }: {
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
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])

  return <span ref={ref} style={{ color }}>{val}{suffix}</span>
}

// ── Barre animée ──────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color, label, delay = 0 }: {
  pct: number; color: string; label: string; delay?: number
}) {
  const [width, setWidth] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => setWidth(pct), delay)
        obs.unobserve(el)
      }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [pct, delay])

  return (
    <div ref={ref} className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 12 }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, transitionDelay: `${delay}ms` }} />
      </div>
    </div>
  )
}

// ── Donut SVG animé ───────────────────────────────────────────────────────────
function DonutChart({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const [progress, setProgress] = useState(0)
  const ref = useRef<SVGCircleElement>(null)
  const r = 44
  const circ = 2 * Math.PI * r

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => setProgress(pct), 300)
        obs.unobserve(el)
      }
    }, { threshold: 0.4 })
    obs.observe(el.ownerSVGElement!)
    return () => obs.disconnect()
  }, [pct])

  const dashOffset = circ - (progress / 100) * circ

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8"
        stroke="rgba(255,255,255,0.06)" />
      <circle ref={ref} cx="50" cy="50" r={r} fill="none" strokeWidth="8"
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1) 0.3s', transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
      />
      <text x="50" y="50" dominantBaseline="middle" textAnchor="middle"
        style={{ fill: color, fontSize: 18, fontWeight: 700, fontFamily: 'DM Serif Display, serif' }}>
        {progress}%
      </text>
    </svg>
  )
}

// ── Section principale ────────────────────────────────────────────────────────
export default function Story() {
  const sectionRef = useScrollReveal() as React.RefObject<HTMLElement>

  return (
    <section ref={sectionRef} className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #0a1520 100%)' }}>

      {/* Grille déco */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(79,195,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

      {/* Halo gauche */}
      <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full pointer-events-none blur-[100px] -translate-y-1/2"
        style={{ background: 'rgba(79,195,247,0.08)' }} />
      <div className="absolute top-1/3 right-0 w-60 h-60 rounded-full pointer-events-none blur-[80px]"
        style={{ background: 'rgba(124,58,237,0.07)' }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-16 md:mb-20">
          <p className="reveal text-cyan-400 text-xs md:text-sm font-semibold mb-3 tracking-widest uppercase">Mon histoire</p>
          <h2 className="reveal delay-100 font-display text-4xl md:text-6xl font-normal leading-tight" style={{ color: '#ffffff' }}>
            Pourquoi j'ai créé<br />
            <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>VCEL.</span>
          </h2>
        </div>

        {/* ── Bloc 1 — Le déclencheur ── */}
        <div className="grid md:grid-cols-2 gap-8 items-center mb-20 md:mb-28">
          <div className="reveal">
            <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— LE DÉCLENCHEUR</span>
            <blockquote className="font-display text-2xl md:text-3xl mt-4 mb-5 leading-snug"
              style={{ color: '#ffffff', borderLeft: '3px solid #4FC3F7', paddingLeft: 20 }}>
              "Killyan, les tâches administratives me bouffent mes semaines entières."
            </blockquote>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Des dizaines d'entrepreneurs me disaient la même chose. Des gens brillants, ambitieux —
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}> paralysés par du temps volé à leur vraie mission.</strong>
            </p>
          </div>

          {/* Graphique — temps perdu */}
          <div className="reveal delay-200 rounded-3xl p-6 md:p-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(79,195,247,0.12)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              Temps hebdo perdu sur l'admin
            </p>
            <AnimatedBar pct={72} color="#ef4444" label="Solopreneurs sans outil" delay={0} />
            <AnimatedBar pct={45} color="#f97316" label="TPE avec tableurs manuels" delay={150} />
            <AnimatedBar pct={12} color="#4FC3F7" label="Avec VCEL" delay={300} />
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 12 }}>
              * Estimation basée sur les retours utilisateurs
            </p>
          </div>
        </div>

        {/* ── Bloc 2 — La découverte ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-20 md:mb-28">

          {/* Stat principale */}
          <div className="reveal md:col-span-1 rounded-3xl p-8 flex flex-col items-center justify-center text-center"
            style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.1), rgba(2,136,209,0.08))', border: '1px solid rgba(79,195,247,0.2)' }}>
            <DonutChart pct={45} color="#4FC3F7" size={130} />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              des dirigeants de PME se sentent <strong style={{ color: '#ffffff' }}>seuls dans leur business</strong>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 8 }}>Source : Bpifrance Le Lab</p>
          </div>

          {/* Texte + 2 stats */}
          <div className="reveal delay-150 md:col-span-2 flex flex-col justify-center gap-6">
            <div>
              <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— CE QUE J'AI DÉCOUVERT</span>
              <p className="text-lg md:text-xl leading-relaxed mt-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
                J'ai creusé. J'ai étudié. Et j'ai trouvé quelque chose que
                <strong style={{ color: '#ffffff' }}> personne ne disait à voix haute.</strong>
              </p>
              <p className="text-base leading-relaxed mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Pas seuls par manque d'entourage. Seuls face aux décisions. Seuls face aux chiffres.
                Seuls quand ça va pas — et <strong style={{ color: 'rgba(255,255,255,0.7)' }}>seuls aussi quand ça va bien.</strong>
              </p>
            </div>

            {/* 2 petites stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-display text-4xl font-normal" style={{ color: '#f97316' }}>
                  <Counter to={3} suffix="h" color="#f97316" duration={1200} />
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>perdues/semaine en admin</p>
              </div>
              <div className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-display text-4xl font-normal" style={{ color: '#4FC3F7' }}>
                  <Counter to={800} suffix="€" color="#4FC3F7" duration={2000} />
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>perdus/mois en relances tardives</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bloc 3 — La vision ── */}
        <div className="grid md:grid-cols-2 gap-8 items-center mb-20 md:mb-28">

          {/* Vision NON/OUI */}
          <div className="reveal rounded-3xl p-7 md:p-8"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— LA VISION</span>
            <p className="text-base mt-4 mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              C'est là que j'ai compris ce que VCEL devait être.
            </p>
            <div className="space-y-4">
              {[
                { label: 'Juste un dashboard', ok: false },
                { label: "Juste un outil d'automatisation", ok: false },
                { label: 'Un vrai copilote pour ton business', ok: true },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="font-bold text-xs w-8" style={{ color: c.ok ? '#4FC3F7' : 'rgba(255,255,255,0.2)' }}>
                    {c.ok ? 'OUI' : 'NON'}
                  </span>
                  <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  <span style={{ color: c.ok ? '#ffffff' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: c.ok ? 600 : 400 }}>
                    {c.label}
                  </span>
                  {c.ok && (
                    <span className="ml-auto text-lg">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ce que VCEL fait */}
          <div className="reveal delay-200">
            <span style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em' }}>— CE QUE VCEL FAIT</span>
            <h3 className="font-display text-3xl md:text-4xl mt-4 mb-5 leading-tight">
              <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>Célèbre </span>
              <span style={{ color: '#ffffff' }}>tes victoires avec toi.</span>
            </h3>
            <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Gère les tâches répétitives à ta place. Te donne une vision claire en temps réel.
              Et reconnaît chaque victoire — <strong style={{ color: 'rgba(255,255,255,0.8)' }}>même les petites.</strong>
            </p>

            {/* Métriques VCEL */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 20, suffix: 'h', label: 'économisées/mois', color: '#4FC3F7' },
                { val: 49, suffix: '€', label: '/mois seulement', color: '#10b981' },
                { val: 24, suffix: 'h', label: 'opérationnel', color: '#f97316' },
              ].map((m, i) => (
                <div key={i} className="rounded-2xl p-4 text-center"
                  style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
                  <p className="font-display text-2xl font-normal">
                    <Counter to={m.val} suffix={m.suffix} color={m.color} duration={1500} />
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA final ── */}
        <div className="reveal text-center rounded-3xl py-14 px-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.1), rgba(2,136,209,0.08))', border: '1px solid rgba(79,195,247,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(79,195,247,0.05) 0%, transparent 70%)' }} />
          <p style={{ color: '#4FC3F7', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
            — POUR TOI
          </p>
          <h3 className="font-display text-3xl md:text-5xl font-normal mb-4" style={{ color: '#ffffff' }}>
            L'outil que j'aurais voulu{' '}
            <span style={{ color: '#4FC3F7', fontStyle: 'italic' }}>avoir.</span>
          </h3>
          <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Celui que je construis pour vous.
          </p>
          <a href="#tarifs" className="landing-btn-primary inline-flex text-base px-8 py-4">
            Rejoindre VCEL — 1er mois offert
          </a>
        </div>

      </div>
    </section>
  )
}