'use client'
import { useState, useEffect, useRef } from 'react'
import { BarChart2, Users, FileText, Bot, TrendingUp, Zap, ArrowRight, Check } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'crm',       label: 'CRM Leads', icon: Users },
  { id: 'factures',  label: 'Factures',  icon: FileText },
  { id: 'coach',     label: 'Coach IA',  icon: Bot },
]

const mockupData: Record<string, { title: string; desc: string }> = {
  dashboard: {
    title: 'Vue financière en temps réel',
    desc: 'CA, charges, marge et objectifs — tout sur un seul écran. Mis à jour automatiquement depuis vos Google Sheets.',
  },
  crm: {
    title: 'CRM Leads avec Score IA',
    desc: "Suivez vos prospects, scorez-les automatiquement avec l'IA et ne laissez plus passer une opportunité.",
  },
  factures: {
    title: 'Gestion des factures',
    desc: 'Toutes vos factures émises et impayées au même endroit. Relances automatiques en cas de retard.',
  },
  coach: {
    title: 'Coach IA business',
    desc: 'Votre coach connaît vos chiffres, vos leads et vos objectifs. Il vous conseille avec précision.',
  },
}

function PreviewDashboard() {
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: '#F5F4F0' }}>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'CA ce mois', val: '8 420€', trend: '+12%', up: true },
          { label: 'Marge nette', val: '5 890€', trend: '+8%', up: true },
          { label: 'Factures dues', val: '1 200€', trend: '3 en attente', up: false },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl p-3 border" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
            <p style={{ color: '#7A90A4', fontSize: 10 }} className="mb-1">{k.label}</p>
            <p style={{ color: '#0D1B2A', fontWeight: 700, fontSize: 13 }}>{k.val}</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: k.up ? '#059669' : '#d97706' }} className="mt-0.5">{k.trend}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-3 border" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
        <p style={{ color: '#7A90A4', fontSize: 10 }} className="mb-3">Évolution CA — 6 mois</p>
        <div className="flex items-end gap-2 h-14">
          {[40, 55, 48, 70, 65, 85].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-lg"
              style={{ height: `${h}%`, background: i === 5 ? 'linear-gradient(180deg, #4FC3F7, #0288D1)' : 'rgba(79,195,247,0.2)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewCRM() {
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: '#F5F4F0' }}>
      {[
        { nom: 'Sophie Renard', co: 'Renard Conseil', score: 'chaud', val: '2 400€' },
        { nom: 'Marc Tissot',   co: 'MT Formation',   score: 'tiède', val: '1 800€' },
        { nom: 'Amina Bouri',   co: 'AB Studio',      score: 'chaud', val: '3 200€' },
      ].map(l => (
        <div key={l.nom} className="bg-white rounded-xl p-3 border flex items-center gap-3" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
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
      <div className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: '#ecfeff', border: '1px solid #a5f3fc' }}>
        <Zap size={12} style={{ color: '#0284c7' }} className="shrink-0" />
        <p style={{ color: '#0c4a6e', fontSize: 10, fontWeight: 500 }}>Score IA activé — 3 leads analysés automatiquement</p>
      </div>
    </div>
  )
}

function PreviewFactures() {
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: '#F5F4F0' }}>
      <div className="grid grid-cols-2 gap-2 mb-1">
        {[
          { label: 'À encaisser', val: '4 800€', color: '#059669' },
          { label: 'En retard',   val: '1 200€', color: '#dc2626' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl p-3 border" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
            <p style={{ color: '#7A90A4', fontSize: 10 }} className="mb-1">{k.label}</p>
            <p style={{ fontWeight: 700, fontSize: 14, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>
      {[
        { num: 'F-2026-012', client: 'Sophie R.', montant: '1 800€', statut: 'payée',      bg: '#f0fdf4', color: '#166534' },
        { num: 'F-2026-011', client: 'Marc T.',   montant: '2 400€', statut: 'en attente', bg: '#fffbeb', color: '#92400e' },
        { num: 'F-2026-010', client: 'Pierre G.', montant: '1 200€', statut: 'en retard',  bg: '#fef2f2', color: '#991b1b' },
      ].map(f => (
        <div key={f.num} className="bg-white rounded-xl p-3 border flex items-center justify-between" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
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

function PreviewCoach() {
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: '#F5F4F0' }}>
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#0D1B2A' }}>
          <Bot size={13} style={{ color: '#4FC3F7' }} />
        </div>
        <div className="bg-white rounded-2xl rounded-tl-sm p-3 border flex-1" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
          <p style={{ color: '#0D1B2A', fontSize: 11, lineHeight: 1.6 }}>Bonjour ! Votre CA de mars est en hausse de 12% 🎉. J'ai repéré <strong>3 leads chauds</strong> non relancés depuis 8 jours — c'est votre priorité du jour.</p>
        </div>
      </div>
      <div className="flex items-start gap-3 flex-row-reverse">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e0f7fa' }}>
          <span style={{ color: '#0288D1', fontSize: 10, fontWeight: 700 }}>V</span>
        </div>
        <div className="rounded-2xl rounded-tr-sm p-3 flex-1" style={{ background: '#0288D1' }}>
          <p style={{ color: '#ffffff', fontSize: 11, lineHeight: 1.6 }}>Comment améliorer mon taux de conversion ?</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#0D1B2A' }}>
          <Bot size={13} style={{ color: '#4FC3F7' }} />
        </div>
        <div className="bg-white rounded-2xl rounded-tl-sm p-3 border flex-1" style={{ borderColor: 'rgba(13,27,42,0.08)' }}>
          <p style={{ color: '#0D1B2A', fontSize: 11, lineHeight: 1.6 }}>Votre meilleur canal est LinkedIn (40% de conversion). Concentrez-y 80% de vos efforts en avril. Relancez Sophie R. cette semaine — son deal à 2 400€ est à portée.</p>
        </div>
      </div>
    </div>
  )
}

const previews: Record<string, React.FC> = {
  dashboard: PreviewDashboard,
  crm:       PreviewCRM,
  factures:  PreviewFactures,
  coach:     PreviewCoach,
}

export default function DemoSection() {
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const sectionRef = useRef<HTMLDivElement>(null)
  const data = mockupData[activeTab]
  const Preview = previews[activeTab]

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.reveal').forEach((r, i) => {
            setTimeout(() => r.classList.add('visible'), i * 100)
          })
          obs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="demo" ref={sectionRef} className="py-20 md:py-28 px-6 overflow-hidden" style={{ background: 'linear-gradient(180deg, #F5F4F0 0%, #EFEEE9 100%)' }}>
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <p className="reveal text-cyan-600 text-sm font-semibold mb-3 tracking-wide uppercase">Aperçu du produit</p>
          <h2 className="reveal delay-100 font-display text-3xl md:text-5xl font-normal mb-4" style={{ color: 'var(--navy)' }}>
            Votre cockpit business,<br />
            <em className="not-italic" style={{ color: '#7A90A4' }}>en un coup d'œil</em>
          </h2>
          <p className="reveal delay-200 text-base max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            8 modules connectés. Vos données synchronisées. Aucune configuration technique requise.
          </p>
        </div>

        {/* Tabs */}
        <div className="reveal delay-300 flex justify-center mb-8">
          <div className="flex items-center bg-white border rounded-2xl p-1 gap-1" style={{ borderColor: 'var(--border)' }}>
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: isActive ? '#0D1B2A' : 'transparent',
                    color: isActive ? '#ffffff' : '#7A90A4',
                    boxShadow: isActive ? '0 2px 8px rgba(13,27,42,0.20)' : 'none',
                  }}>
                  <Icon size={13} style={{ color: isActive ? '#4FC3F7' : 'currentColor' }} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mockup */}
        <div className="reveal-scale delay-200 bg-white rounded-3xl border overflow-hidden"
          style={{ borderColor: 'var(--border)', boxShadow: '0 20px 60px rgba(13,27,42,0.10)' }}>
          {/* Chrome */}
          <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white border rounded-lg px-8 py-1" style={{ borderColor: 'var(--border)', fontSize: 10, color: 'var(--text-light)' }}>
                app.vcel.fr/dashboard
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-normal mb-3" style={{ color: 'var(--navy)' }}>{data.title}</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>{data.desc}</p>
                <a href="#tarifs" className="inline-flex items-center gap-2 text-sm font-semibold group" style={{ color: '#0288D1' }}>
                  Accéder maintenant
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                <Preview />
              </div>
            </div>
          </div>
        </div>

        {/* Features row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { icon: TrendingUp, label: 'Synchronisation temps réel' },
            { icon: Zap,        label: 'Automatisations incluses' },
            { icon: Bot,        label: 'Coach IA personnel' },
            { icon: Check,      label: 'Opérationnel en 24h' },
          ].map((f, i) => (
            <div key={f.label} className={`reveal delay-${(i+1)*100} flex items-center gap-2.5 bg-white rounded-xl p-3 border`}
              style={{ borderColor: 'var(--border)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#ecfeff' }}>
                <f.icon size={13} style={{ color: '#0288D1' }} />
              </div>
              <p className="text-xs font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}