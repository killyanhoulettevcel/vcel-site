'use client'
import { useEffect, useRef, useState } from 'react'
import { BarChart2, Users, FileText, Bot, Zap, TrendingUp, Flame, Check, ArrowRight } from 'lucide-react'

const steps = [
  {
    id: 'finances', label: 'Dashboard financier',
    tag: 'Finance', tagColor: '#2563eb', tagBg: '#eff6ff',
    headline: 'Vos chiffres, enfin clairs',
    desc: 'CA, charges et marge en temps réel. Synchronisé automatiquement depuis Google Sheets. Fini les tableaux mis à jour à la main.',
    icon: BarChart2, accent: '#4FC3F7',
  },
  {
    id: 'crm', label: 'CRM Leads',
    tag: 'Commercial', tagColor: '#7c3aed', tagBg: '#f5f3ff',
    headline: 'Ne laissez plus passer un prospect',
    desc: "Score IA automatique sur chaque lead. Alerte instantanée quand un prospect devient chaud. Relances automatiques si inactif trop longtemps.",
    icon: Users, accent: '#7c3aed',
  },
  {
    id: 'factures', label: 'Factures',
    tag: 'Comptabilité', tagColor: '#ea580c', tagBg: '#fff7ed',
    headline: 'Zéro facture impayée oubliée',
    desc: "Suivi de toutes vos factures. Relances automatiques en cas de retard. Vous savez en temps réel ce que vous devez encaisser.",
    icon: FileText, accent: '#ea580c',
  },
  {
    id: 'coach', label: 'Coach IA',
    tag: 'Intelligence', tagColor: '#059669', tagBg: '#f0fdf4',
    headline: 'Un coach qui connaît vos chiffres',
    desc: "Posez n'importe quelle question business. Il connaît votre CA, vos leads et vos objectifs. Des conseils précis, pas des généralités.",
    icon: Bot, accent: '#059669',
  },
]

function PreviewFinances({ p }: { p: number }) {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2">
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'CA ce mois', val: '8 420€', trend: '+12%', up: true },
          { label: 'Marge', val: '5 890€', trend: '+8%', up: true },
          { label: 'Charges', val: '2 530€', trend: '-3%', up: false },
        ].map((k, i) => (
          <div key={k.label} className="bg-white rounded-xl p-2 border transition-all duration-700"
            style={{ borderColor: 'rgba(13,27,42,0.08)', opacity: p > i * 0.2 ? 1 : 0, transform: `translateY(${p > i * 0.2 ? 0 : 10}px)`, transitionDelay: `${i * 80}ms` }}>
            <p style={{ color: '#7A90A4', fontSize: 9 }} className="mb-0.5">{k.label}</p>
            <p style={{ color: '#0D1B2A', fontWeight: 700, fontSize: 11 }}>{k.val}</p>
            <p style={{ fontSize: 9, fontWeight: 600, color: k.up ? '#059669' : '#ea580c' }}>{k.trend}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-3 border flex-1" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
        <p style={{ color: '#7A90A4', fontSize: 9 }} className="mb-2">Évolution CA — 6 mois</p>
        <div className="flex items-end gap-1" style={{ height: 60 }}>
          {[40, 55, 48, 70, 65, 85].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md transition-all duration-700"
              style={{ height: `${p > 0.3 ? h : 0}%`, background: i === 5 ? 'linear-gradient(180deg, #4FC3F7, #0288D1)' : 'rgba(79,195,247,0.25)', transitionDelay: `${200 + i * 60}ms` }} />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-2.5 border" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <p style={{ color: '#0D1B2A', fontSize: 10, fontWeight: 600 }}>Objectif mensuel</p>
          <p style={{ color: '#4FC3F7', fontSize: 10, fontWeight: 700 }}>84%</p>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p > 0.5 ? 84 : 0}%`, background: 'linear-gradient(90deg, #4FC3F7, #0288D1)', transitionDelay: '400ms' }} />
        </div>
      </div>
    </div>
  )
}

function PreviewCRM({ p }: { p: number }) {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2">
      <div className="rounded-xl p-2 flex items-center gap-2 transition-all duration-700"
        style={{ background: '#fef2f2', border: '1px solid #fecaca', opacity: p > 0.1 ? 1 : 0, transform: `translateY(${p > 0.1 ? 0 : -8}px)` }}>
        <Flame size={11} style={{ color: '#dc2626' }} className="shrink-0" />
        <p style={{ color: '#991b1b', fontSize: 9, fontWeight: 600 }}>🔥 Lead chaud détecté — Sophie Renard !</p>
      </div>
      {[
        { nom: 'Sophie Renard', co: 'Renard Conseil', score: 'chaud', val: '2 400€' },
        { nom: 'Marc Tissot', co: 'MT Formation', score: 'tiède', val: '1 800€' },
        { nom: 'Amina Bouri', co: 'AB Studio', score: 'chaud', val: '3 200€' },
      ].map((l, i) => (
        <div key={l.nom} className="bg-white rounded-xl p-2.5 border flex items-center gap-2 transition-all duration-700"
          style={{ borderColor: 'rgba(13,27,42,0.08)', opacity: p > i * 0.15 ? 1 : 0, transform: `translateX(${p > i * 0.15 ? 0 : 14}px)`, transitionDelay: `${100 + i * 80}ms` }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: l.score === 'chaud' ? '#fef2f2' : '#fff7ed', color: l.score === 'chaud' ? '#dc2626' : '#ea580c' }}>
            {l.nom.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: '#0D1B2A', fontSize: 11, fontWeight: 600 }} className="truncate">{l.nom}</p>
            <p style={{ color: '#7A90A4', fontSize: 9 }}>{l.co}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="px-1.5 py-0.5 rounded-full font-semibold" style={{ fontSize: 9, background: l.score === 'chaud' ? '#fef2f2' : '#fff7ed', color: l.score === 'chaud' ? '#dc2626' : '#ea580c' }}>
              {l.score === 'chaud' ? '🔥' : '➖'}
            </span>
            <span style={{ color: '#059669', fontSize: 10, fontWeight: 700 }}>{l.val}</span>
          </div>
        </div>
      ))}
      <div className="rounded-xl p-2 flex items-center gap-1.5 transition-all duration-700"
        style={{ background: '#ecfeff', border: '1px solid #a5f3fc', opacity: p > 0.6 ? 1 : 0 }}>
        <Zap size={10} style={{ color: '#0284c7' }} className="shrink-0" />
        <p style={{ color: '#0c4a6e', fontSize: 9, fontWeight: 500 }}>Score IA activé — analyse automatique</p>
      </div>
    </div>
  )
}

function PreviewFactures({ p }: { p: number }) {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'À encaisser', val: '4 800€', color: '#059669', bg: '#f0fdf4', delay: 0 },
          { label: 'En retard', val: '1 200€', color: '#dc2626', bg: '#fef2f2', delay: 100 },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-2.5 border transition-all duration-700"
            style={{ background: k.bg, borderColor: 'rgba(13,27,42,0.06)', opacity: p > 0.1 ? 1 : 0, transform: `scale(${p > 0.1 ? 1 : 0.9})`, transitionDelay: `${k.delay}ms` }}>
            <p style={{ color: k.color, fontSize: 9, opacity: 0.7 }} className="mb-0.5">{k.label}</p>
            <p style={{ fontWeight: 800, fontSize: 16, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>
      {[
        { num: 'F-2026-012', client: 'Sophie R.', montant: '1 800€', statut: 'payée', bg: '#f0fdf4', color: '#166534' },
        { num: 'F-2026-011', client: 'Marc T.', montant: '2 400€', statut: 'en attente', bg: '#fffbeb', color: '#92400e' },
        { num: 'F-2026-010', client: 'Pierre G.', montant: '1 200€', statut: 'en retard', bg: '#fef2f2', color: '#991b1b' },
      ].map((f, i) => (
        <div key={f.num} className="bg-white rounded-xl p-2.5 border flex items-center justify-between transition-all duration-700"
          style={{ borderColor: 'rgba(13,27,42,0.08)', opacity: p > i * 0.15 ? 1 : 0, transform: `translateX(${p > i * 0.15 ? 0 : 14}px)`, transitionDelay: `${150 + i * 80}ms` }}>
          <div>
            <p style={{ color: '#0D1B2A', fontSize: 11, fontWeight: 600 }}>{f.num}</p>
            <p style={{ color: '#7A90A4', fontSize: 9 }}>{f.client}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: '#0D1B2A', fontSize: 11, fontWeight: 700 }}>{f.montant}</span>
            <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: 9, background: f.bg, color: f.color, fontWeight: 600 }}>{f.statut}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewCoach({ p }: { p: number }) {
  const msgs = [
    { side: 'bot', text: "CA mars +12% 🎉. 3 leads chauds non relancés depuis 8 jours — c'est votre priorité." },
    { side: 'user', text: 'Comment améliorer mon taux de conversion ?' },
    { side: 'bot', text: "LinkedIn = 40% de conversion. Concentrez-y 80% de vos efforts. Relancez Sophie R. cette semaine (deal 2 400€ à portée)." },
  ]
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2 justify-center">
      {msgs.map((m, i) => (
        <div key={i} className={`flex items-end gap-1.5 transition-all duration-700 ${m.side === 'user' ? 'flex-row-reverse' : ''}`}
          style={{ opacity: p > i * 0.25 ? 1 : 0, transform: `translateY(${p > i * 0.25 ? 0 : 10}px)`, transitionDelay: `${i * 150}ms` }}>
          {m.side === 'bot' && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#0D1B2A' }}>
              <Bot size={10} style={{ color: '#4FC3F7' }} />
            </div>
          )}
          <div className="rounded-2xl p-2.5 max-w-[85%]"
            style={{ background: m.side === 'bot' ? '#fff' : '#0288D1', border: m.side === 'bot' ? '1px solid rgba(13,27,42,0.08)' : 'none' }}>
            <p style={{ color: m.side === 'bot' ? '#0D1B2A' : '#fff', fontSize: 10, lineHeight: 1.5 }}>{m.text}</p>
          </div>
          {m.side === 'user' && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e0f7fa' }}>
              <span style={{ color: '#0288D1', fontSize: 9, fontWeight: 700 }}>V</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const Previews = [PreviewFinances, PreviewCRM, PreviewFactures, PreviewCoach]

export default function DemoSection() {
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
    if (isMobile) return // pas de scroll-driven sur mobile
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

  const currentStep = steps[activeStep]
  const Preview = Previews[activeStep]

  // ── Version mobile : tabs cliquables ──────────────────────────────────────
  if (isMobile) {
    return (
      <section id="demo" className="py-14 px-4" style={{ background: 'linear-gradient(180deg, #F5F4F0, #EFEEE9)' }}>
        <div className="text-center mb-8">
          <p className="text-cyan-600 text-xs font-semibold mb-2 tracking-wide uppercase">Aperçu du produit</p>
          <h2 className="font-display text-3xl font-normal" style={{ color: '#0D1B2A' }}>
            Votre cockpit business
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => setActiveStep(i)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border"
              style={{
                background: activeStep === i ? s.accent : 'white',
                color: activeStep === i ? '#fff' : '#7A90A4',
                borderColor: activeStep === i ? s.accent : 'rgba(13,27,42,0.08)',
              }}>
              <s.icon size={12} style={{ color: activeStep === i ? '#fff' : s.accent }} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Texte */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border mb-3"
            style={{ background: currentStep.tagBg, color: currentStep.tagColor, borderColor: `${currentStep.tagColor}30` }}>
            <currentStep.icon size={11} />
            {currentStep.tag}
          </span>
          <h3 className="font-display text-2xl font-normal mb-3" style={{ color: '#0D1B2A' }}>{currentStep.headline}</h3>
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#3D5166' }}>{currentStep.desc}</p>
          <a href="#tarifs" className="landing-btn-primary text-sm inline-flex">
            Commencer gratuitement
            <ArrowRight size={14} style={{ color: '#fff' }} />
          </a>
        </div>

        {/* Mockup */}
        <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(13,27,42,0.08)', boxShadow: '0 8px 32px rgba(13,27,42,0.10)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: '#F5F4F0', borderColor: 'rgba(13,27,42,0.06)' }}>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#fc5f5a' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#fdba2c' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#27c93f' }} />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white rounded px-4 py-0.5 border" style={{ borderColor: 'rgba(13,27,42,0.08)', fontSize: 9, color: '#A8BDD0' }}>app.vcel.fr</div>
            </div>
          </div>
          <div className="p-3" style={{ background: '#F8F7F3', minHeight: 280 }}>
            <Preview p={1} />
          </div>
        </div>
      </section>
    )
  }

  // ── Version desktop : scroll-driven ───────────────────────────────────────
  return (
    <section id="demo" ref={sectionRef} style={{ height: `${steps.length * 100}vh` }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F5F4F0 0%, #EFEEE9 100%)' }}>

        {/* Halo accent */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse at 65% 50%, ${currentStep.accent}12 0%, transparent 55%)` }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Texte */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                {steps.map((s, i) => (
                  <button key={s.id}
                    onClick={() => {
                      const section = sectionRef.current
                      if (!section) return
                      const target = section.offsetTop + (i / steps.length) * (section.offsetHeight - window.innerHeight) + 10
                      window.scrollTo({ top: target, behavior: 'smooth' })
                    }}
                    className="rounded-full transition-all duration-500"
                    style={{ height: 4, width: i === activeStep ? 32 : 8, background: i === activeStep ? currentStep.accent : 'rgba(13,27,42,0.15)' }} />
                ))}
              </div>

              <span key={`tag-${activeStep}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border mb-5"
                style={{ background: currentStep.tagBg, color: currentStep.tagColor, borderColor: `${currentStep.tagColor}30`, animation: 'revealUp 0.4s ease forwards' }}>
                <currentStep.icon size={11} />
                {currentStep.tag}
              </span>

              <h2 key={`h-${activeStep}`} className="font-display text-4xl md:text-5xl font-normal mb-5"
                style={{ color: '#0D1B2A', animation: 'revealUp 0.5s cubic-bezier(.16,1,.3,1) forwards' }}>
                {currentStep.headline}
              </h2>

              <p key={`d-${activeStep}`} className="text-lg leading-relaxed mb-8"
                style={{ color: '#3D5166', maxWidth: 420, animation: 'revealUp 0.5s 0.08s cubic-bezier(.16,1,.3,1) both' }}>
                {currentStep.desc}
              </p>

              <div className="mb-8">
                <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(13,27,42,0.10)', width: 180 }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${stepProgress * 100}%`, background: currentStep.accent }} />
                </div>
              </div>

              <a href="#tarifs" className="landing-btn-primary inline-flex">
                Essayer gratuitement — 1er mois offert
                <ArrowRight size={15} style={{ color: '#ffffff' }} />
              </a>
            </div>

            {/* Mockup */}
            <div className="relative">
              <div className="bg-white rounded-3xl overflow-hidden transition-all duration-700"
                style={{ boxShadow: `0 24px 64px rgba(13,27,42,0.14), 0 0 0 1px rgba(13,27,42,0.06), 0 0 40px ${currentStep.accent}18` }}>
                <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ background: '#F5F4F0', borderColor: 'rgba(13,27,42,0.06)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fc5f5a' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fdba2c' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27c93f' }} />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-lg px-6 py-1 border" style={{ borderColor: 'rgba(13,27,42,0.08)', fontSize: 10, color: '#A8BDD0' }}>
                      app.vcel.fr/dashboard
                    </div>
                  </div>
                </div>

                <div className="flex" style={{ minHeight: 320 }}>
                  <div className="w-10 border-r flex flex-col items-center pt-4 gap-3" style={{ background: '#0D1B2A', borderColor: 'rgba(255,255,255,0.05)' }}>
                    {steps.map((s, i) => (
                      <div key={s.id} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500"
                        style={{ background: i === activeStep ? `${currentStep.accent}30` : 'transparent' }}>
                        <s.icon size={12} style={{ color: i === activeStep ? currentStep.accent : 'rgba(255,255,255,0.3)' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-3" style={{ background: '#F8F7F3' }}>
                    <Preview p={stepProgress} />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl px-4 py-2.5 border shadow-lg transition-all duration-500"
                style={{ borderColor: 'rgba(13,27,42,0.08)', boxShadow: '0 8px 24px rgba(13,27,42,0.10)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: currentStep.tagColor }}>{currentStep.label}</p>
                <p style={{ fontSize: 10, color: '#7A90A4' }}>Module {activeStep + 1}/{steps.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}