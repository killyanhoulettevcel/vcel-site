'use client'
import { useEffect, useRef, useState } from 'react'
import { BarChart2, Users, FileText, Bot, Zap, TrendingUp, Flame, Check, Euro, ArrowRight } from 'lucide-react'

const steps = [
  {
    id: 'finances',
    label: 'Dashboard financier',
    tag: 'Finance',
    tagColor: '#2563eb',
    tagBg: '#eff6ff',
    headline: 'Vos chiffres, enfin clairs',
    desc: 'CA, charges et marge en temps réel. Synchronisé automatiquement depuis Google Sheets. Fini les tableaux à jour à la main.',
    icon: BarChart2,
    accent: '#4FC3F7',
  },
  {
    id: 'crm',
    label: 'CRM Leads',
    tag: 'Commercial',
    tagColor: '#7c3aed',
    tagBg: '#f5f3ff',
    headline: 'Ne laissez plus passer un prospect',
    desc: "Score IA automatique sur chaque lead. Alerte instantanée quand un prospect devient chaud. Relances automatiques si inactif trop longtemps.",
    icon: Users,
    accent: '#7c3aed',
  },
  {
    id: 'factures',
    label: 'Factures',
    tag: 'Comptabilité',
    tagColor: '#ea580c',
    tagBg: '#fff7ed',
    headline: 'Zéro facture impayée oubliée',
    desc: "Suivi de toutes vos factures émises et impayées. Relances automatiques en cas de retard. Vous savez en temps réel ce que vous devez encaisser.",
    icon: FileText,
    accent: '#ea580c',
  },
  {
    id: 'coach',
    label: 'Coach IA',
    tag: 'Intelligence',
    tagColor: '#059669',
    tagBg: '#f0fdf4',
    headline: 'Un coach qui connaît vos chiffres',
    desc: "Posez n'importe quelle question business. Il connaît votre CA, vos leads et vos objectifs. Des conseils précis, pas des généralités.",
    icon: Bot,
    accent: '#059669',
  },
]

// ── Previews ──────────────────────────────────────────────────────────────────

function PreviewFinances({ progress }: { progress: number }) {
  const bars = [40, 55, 48, 70, 65, 85]
  return (
    <div className="w-full h-full flex flex-col gap-3 p-2">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'CA ce mois', val: '8 420€', trend: '+12%', color: '#059669' },
          { label: 'Marge nette', val: '5 890€', trend: '+8%', color: '#059669' },
          { label: 'Charges', val: '2 530€', trend: '-3%', color: '#ea580c' },
        ].map((k, i) => (
          <div key={k.label} className="bg-white rounded-xl p-3 border transition-all duration-700"
            style={{
              borderColor: 'rgba(13,27,42,0.08)',
              opacity: progress > i * 0.2 ? 1 : 0,
              transform: `translateY(${progress > i * 0.2 ? 0 : 12}px)`,
              transitionDelay: `${i * 80}ms`,
            }}>
            <p style={{ color: '#7A90A4', fontSize: 10 }} className="mb-1">{k.label}</p>
            <p style={{ color: '#0D1B2A', fontWeight: 700, fontSize: 13 }}>{k.val}</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: k.color }}>{k.trend}</p>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="bg-white rounded-xl p-4 border flex-1" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
        <p style={{ color: '#7A90A4', fontSize: 10 }} className="mb-3">Évolution CA — 6 mois</p>
        <div className="flex items-end gap-2" style={{ height: 80 }}>
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg transition-all duration-700"
              style={{
                height: `${progress > 0.3 ? h : 0}%`,
                background: i === bars.length - 1 ? 'linear-gradient(180deg, #4FC3F7, #0288D1)' : 'rgba(79,195,247,0.25)',
                transitionDelay: `${200 + i * 60}ms`,
              }} />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'].map(m => (
            <span key={m} style={{ fontSize: 9, color: '#A8BDD0' }}>{m}</span>
          ))}
        </div>
      </div>
      {/* Objectif */}
      <div className="bg-white rounded-xl p-3 border" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
        <div className="flex items-center justify-between mb-2">
          <p style={{ color: '#0D1B2A', fontSize: 11, fontWeight: 600 }}>Objectif mensuel</p>
          <p style={{ color: '#4FC3F7', fontSize: 11, fontWeight: 700 }}>84%</p>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress > 0.5 ? 84 : 0}%`, background: 'linear-gradient(90deg, #4FC3F7, #0288D1)', transitionDelay: '400ms' }} />
        </div>
      </div>
    </div>
  )
}

function PreviewCRM({ progress }: { progress: number }) {
  const leads = [
    { nom: 'Sophie Renard', co: 'Renard Conseil', score: 'chaud', val: '2 400€', statut: 'qualifié' },
    { nom: 'Marc Tissot',   co: 'MT Formation',   score: 'tiède', val: '1 800€', statut: 'contacté' },
    { nom: 'Amina Bouri',   co: 'AB Studio',      score: 'chaud', val: '3 200€', statut: 'nouveau' },
  ]
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2">
      {/* Alert IA */}
      <div className="rounded-xl p-2.5 flex items-center gap-2 transition-all duration-700"
        style={{ background: '#fef2f2', border: '1px solid #fecaca', opacity: progress > 0.1 ? 1 : 0, transform: `translateY(${progress > 0.1 ? 0 : -8}px)` }}>
        <Flame size={13} style={{ color: '#dc2626' }} className="shrink-0" />
        <p style={{ color: '#991b1b', fontSize: 10, fontWeight: 600 }}>🔥 Alerte — Sophie Renard est un lead chaud !</p>
      </div>
      {leads.map((l, i) => (
        <div key={l.nom} className="bg-white rounded-xl p-3 border flex items-center gap-3 transition-all duration-700"
          style={{
            borderColor: 'rgba(13,27,42,0.08)',
            opacity: progress > i * 0.15 ? 1 : 0,
            transform: `translateX(${progress > i * 0.15 ? 0 : 16}px)`,
            transitionDelay: `${100 + i * 80}ms`,
          }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: l.score === 'chaud' ? '#fef2f2' : '#fff7ed', color: l.score === 'chaud' ? '#dc2626' : '#ea580c' }}>
            {l.nom.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: '#0D1B2A', fontSize: 12, fontWeight: 600 }} className="truncate">{l.nom}</p>
            <p style={{ color: '#7A90A4', fontSize: 10 }}>{l.co}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-full font-semibold"
              style={{ fontSize: 10, background: l.score === 'chaud' ? '#fef2f2' : '#fff7ed', color: l.score === 'chaud' ? '#dc2626' : '#ea580c' }}>
              {l.score === 'chaud' ? '🔥' : '➖'} {l.score}
            </span>
            <span style={{ color: '#059669', fontSize: 10, fontWeight: 700 }}>{l.val}</span>
          </div>
        </div>
      ))}
      <div className="rounded-xl p-2.5 flex items-center gap-2 transition-all duration-700"
        style={{ background: '#ecfeff', border: '1px solid #a5f3fc', opacity: progress > 0.6 ? 1 : 0, transitionDelay: '300ms' }}>
        <Zap size={12} style={{ color: '#0284c7' }} className="shrink-0" />
        <p style={{ color: '#0c4a6e', fontSize: 10, fontWeight: 500 }}>Score IA activé — analyse automatique en cours</p>
      </div>
    </div>
  )
}

function PreviewFactures({ progress }: { progress: number }) {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'À encaisser', val: '4 800€', color: '#059669', bg: '#f0fdf4', delay: 0 },
          { label: 'En retard',   val: '1 200€', color: '#dc2626', bg: '#fef2f2', delay: 100 },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 border transition-all duration-700"
            style={{ background: k.bg, borderColor: 'rgba(13,27,42,0.06)', opacity: progress > 0.1 ? 1 : 0, transform: `scale(${progress > 0.1 ? 1 : 0.9})`, transitionDelay: `${k.delay}ms` }}>
            <p style={{ color: k.color, fontSize: 10, opacity: 0.7 }} className="mb-1">{k.label}</p>
            <p style={{ fontWeight: 800, fontSize: 18, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>
      {[
        { num: 'F-2026-012', client: 'Sophie R.', montant: '1 800€', statut: 'payée',      bg: '#f0fdf4', color: '#166534' },
        { num: 'F-2026-011', client: 'Marc T.',   montant: '2 400€', statut: 'en attente', bg: '#fffbeb', color: '#92400e' },
        { num: 'F-2026-010', client: 'Pierre G.', montant: '1 200€', statut: 'en retard',  bg: '#fef2f2', color: '#991b1b' },
      ].map((f, i) => (
        <div key={f.num} className="bg-white rounded-xl p-3 border flex items-center justify-between transition-all duration-700"
          style={{ borderColor: 'rgba(13,27,42,0.08)', opacity: progress > i * 0.15 ? 1 : 0, transform: `translateX(${progress > i * 0.15 ? 0 : 16}px)`, transitionDelay: `${150 + i * 80}ms` }}>
          <div>
            <p style={{ color: '#0D1B2A', fontSize: 12, fontWeight: 600 }}>{f.num}</p>
            <p style={{ color: '#7A90A4', fontSize: 10 }}>{f.client}</p>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#0D1B2A', fontSize: 12, fontWeight: 700 }}>{f.montant}</span>
            <span className="px-2 py-0.5 rounded-full font-medium" style={{ fontSize: 10, background: f.bg, color: f.color }}>{f.statut}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewCoach({ progress }: { progress: number }) {
  const messages = [
    { side: 'bot', text: "Bonjour ! Votre CA de mars est en hausse de 12% 🎉. J'ai repéré 3 leads chauds non relancés depuis 8 jours — c'est votre priorité du jour." },
    { side: 'user', text: 'Comment améliorer mon taux de conversion ?' },
    { side: 'bot', text: "Votre meilleur canal est LinkedIn (40% de conversion). Concentrez-y 80% de vos efforts. Relancez Sophie R. cette semaine — son deal à 2 400€ est à portée." },
  ]
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2 justify-center">
      {messages.map((m, i) => (
        <div key={i}
          className={`flex items-end gap-2 transition-all duration-700 ${m.side === 'user' ? 'flex-row-reverse' : ''}`}
          style={{ opacity: progress > i * 0.25 ? 1 : 0, transform: `translateY(${progress > i * 0.25 ? 0 : 12}px)`, transitionDelay: `${i * 150}ms` }}>
          {m.side === 'bot' && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#0D1B2A' }}>
              <Bot size={12} style={{ color: '#4FC3F7' }} />
            </div>
          )}
          <div className="rounded-2xl p-3 max-w-[85%]"
            style={{ background: m.side === 'bot' ? '#ffffff' : '#0288D1', border: m.side === 'bot' ? '1px solid rgba(13,27,42,0.08)' : 'none' }}>
            <p style={{ color: m.side === 'bot' ? '#0D1B2A' : '#ffffff', fontSize: 11, lineHeight: 1.6 }}>{m.text}</p>
          </div>
          {m.side === 'user' && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e0f7fa' }}>
              <span style={{ color: '#0288D1', fontSize: 10, fontWeight: 700 }}>V</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const previewComponents = [PreviewFinances, PreviewCRM, PreviewFactures, PreviewCoach]

export default function DemoSection() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const stickyRef   = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect   = section.getBoundingClientRect()
      const total  = section.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const globalProgress = Math.min(1, scrolled / total)

      const stepCount = steps.length
      const stepSize  = 1 / stepCount
      const step      = Math.min(stepCount - 1, Math.floor(globalProgress / stepSize))
      const local     = (globalProgress - step * stepSize) / stepSize

      setActiveStep(step)
      setStepProgress(Math.min(1, local * 1.5)) // accélérer légèrement l'animation interne
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const PreviewComponent = previewComponents[activeStep]
  const currentStep = steps[activeStep]

  return (
    <section id="demo" ref={sectionRef} style={{ height: `${steps.length * 100}vh` }}>

      {/* Sticky container */}
      <div ref={stickyRef} className="sticky top-0 h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F5F4F0 0%, #EFEEE9 100%)' }}>

        {/* Fond accent animé */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse at 60% 50%, ${currentStep.accent}15 0%, transparent 60%)` }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Côté texte */}
            <div>
              {/* Indicateurs étapes */}
              <div className="flex items-center gap-2 mb-6">
                {steps.map((s, i) => (
                  <button key={s.id}
                    onClick={() => {
                      const section = sectionRef.current
                      if (!section) return
                      const target = section.offsetTop + (i / steps.length) * (section.offsetHeight - window.innerHeight) + 10
                      window.scrollTo({ top: target, behavior: 'smooth' })
                    }}
                    className="transition-all duration-500 rounded-full"
                    style={{
                      height: 4,
                      width: i === activeStep ? 32 : 8,
                      background: i === activeStep ? currentStep.accent : 'rgba(13,27,42,0.15)',
                    }} />
                ))}
              </div>

              {/* Tag */}
              <div className="transition-all duration-500 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                  style={{ background: currentStep.tagBg, color: currentStep.tagColor, borderColor: `${currentStep.tagColor}30` }}>
                  <currentStep.icon size={11} />
                  {currentStep.tag}
                </span>
              </div>

              {/* Headline */}
              <h2 key={`h-${activeStep}`}
                className="font-display text-4xl md:text-5xl font-normal mb-5 transition-all duration-500"
                style={{ color: '#0D1B2A', animation: 'revealUp 0.6s cubic-bezier(.16,1,.3,1) forwards' }}>
                {currentStep.headline}
              </h2>

              {/* Description */}
              <p key={`d-${activeStep}`}
                className="text-base md:text-lg leading-relaxed mb-8"
                style={{ color: '#3D5166', maxWidth: 440, animation: 'revealUp 0.6s 0.1s cubic-bezier(.16,1,.3,1) both' }}>
                {currentStep.desc}
              </p>

              {/* Barre progression */}
              <div className="mb-8">
                <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(13,27,42,0.10)', width: 200 }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${stepProgress * 100}%`, background: currentStep.accent }} />
                </div>
              </div>

              <a href="#tarifs" className="landing-btn-primary inline-flex">
                Essayer gratuitement — 1er mois offert
                <ArrowRight size={15} style={{ color: '#ffffff' }} />
              </a>
            </div>

            {/* Côté mockup */}
            <div className="relative">
              {/* Window chrome */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl transition-all duration-700"
                style={{ boxShadow: `0 24px 64px rgba(13,27,42,0.14), 0 0 0 1px rgba(13,27,42,0.06), 0 0 40px ${currentStep.accent}20` }}>
                {/* Barre titre */}
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

                {/* Sidebar mini */}
                <div className="flex" style={{ minHeight: 340 }}>
                  <div className="w-10 border-r flex flex-col items-center pt-4 gap-3" style={{ background: '#0D1B2A', borderColor: 'rgba(255,255,255,0.05)' }}>
                    {steps.map((s, i) => (
                      <div key={s.id} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500"
                        style={{ background: i === activeStep ? `${currentStep.accent}30` : 'transparent' }}>
                        <s.icon size={12} style={{ color: i === activeStep ? currentStep.accent : 'rgba(255,255,255,0.3)' }} />
                      </div>
                    ))}
                  </div>

                  {/* Preview content */}
                  <div className="flex-1 p-4" style={{ background: '#F8F7F3' }}>
                    <PreviewComponent progress={stepProgress} />
                  </div>
                </div>
              </div>

              {/* Étiquette flottante */}
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