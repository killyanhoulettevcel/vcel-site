'use client'
import { useState } from 'react'
import {
  BarChart2, Users, FileText, Bot, TrendingUp,
  Flame, Check, Euro, ArrowRight, Zap
} from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'crm', label: 'CRM Leads', icon: Users },
  { id: 'factures', label: 'Factures', icon: FileText },
  { id: 'coach', label: 'Coach IA', icon: Bot },
]

const mockups = {
  dashboard: {
    title: 'Vue financière en temps réel',
    desc: 'CA, charges, marge et objectifs — tout sur un seul écran. Mis à jour automatiquement depuis vos Google Sheets.',
    preview: (
      <div className="bg-[#F5F4F0] rounded-xl p-4 space-y-3">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'CA ce mois', val: '8 420€', trend: '+12%', up: true },
            { label: 'Marge nette', val: '5 890€', trend: '+8%', up: true },
            { label: 'Factures dues', val: '1 200€', trend: '3 en attente', up: false },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl p-3 border border-[rgba(13,27,42,0.08)]">
              <p className="text-[#7A90A4] text-[10px] mb-1">{k.label}</p>
              <p className="font-bold text-[#0D1B2A] text-sm">{k.val}</p>
              <p className={`text-[10px] font-medium mt-0.5 ${k.up ? 'text-emerald-600' : 'text-amber-600'}`}>{k.trend}</p>
            </div>
          ))}
        </div>
        {/* Mini chart */}
        <div className="bg-white rounded-xl p-3 border border-[rgba(13,27,42,0.08)]">
          <p className="text-[#7A90A4] text-[10px] mb-3">Évolution CA — 6 derniers mois</p>
          <div className="flex items-end gap-2 h-14">
            {[40, 55, 48, 70, 65, 85].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-lg transition-all"
                style={{ height: `${h}%`, background: i === 5 ? 'linear-gradient(180deg, #4FC3F7, #0288D1)' : 'rgba(79,195,247,0.2)' }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  crm: {
    title: 'CRM Leads avec Score IA',
    desc: "Suivez vos prospects, scorez-les automatiquement avec l'IA et ne laissez plus passer une opportunité.",
    preview: (
      <div className="bg-[#F5F4F0] rounded-xl p-4 space-y-2">
        {[
          { nom: 'Sophie Renard', co: 'Renard Conseil', score: 'chaud', statut: 'qualifié', val: '2 400€' },
          { nom: 'Marc Tissot', co: 'MT Formation', score: 'tiède', statut: 'contacté', val: '1 800€' },
          { nom: 'Amina Bouri', co: 'AB Studio', score: 'chaud', statut: 'nouveau', val: '3 200€' },
        ].map(l => (
          <div key={l.nom} className="bg-white rounded-xl p-3 border border-[rgba(13,27,42,0.08)] flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${l.score === 'chaud' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
              {l.nom.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#0D1B2A] text-xs font-semibold truncate">{l.nom}</p>
              <p className="text-[#7A90A4] text-[10px]">{l.co}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${l.score === 'chaud' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                {l.score === 'chaud' ? '🔥' : '➖'} {l.score}
              </span>
              <span className="text-emerald-600 text-[10px] font-bold">{l.val}</span>
            </div>
          </div>
        ))}
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-2.5 flex items-center gap-2">
          <Zap size={12} className="text-cyan-600 shrink-0" />
          <p className="text-cyan-700 text-[10px] font-medium">Score IA activé — 3 leads analysés automatiquement</p>
        </div>
      </div>
    ),
  },
  factures: {
    title: 'Gestion des factures',
    desc: 'Toutes vos factures émises et impayées au même endroit. Relances automatiques en cas de retard.',
    preview: (
      <div className="bg-[#F5F4F0] rounded-xl p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2 mb-1">
          {[
            { label: 'À encaisser', val: '4 800€', color: 'text-emerald-600' },
            { label: 'En retard', val: '1 200€', color: 'text-red-500' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl p-3 border border-[rgba(13,27,42,0.08)]">
              <p className="text-[#7A90A4] text-[10px] mb-1">{k.label}</p>
              <p className={`font-bold text-sm ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>
        {[
          { num: 'F-2026-012', client: 'Sophie R.', montant: '1 800€', statut: 'payée', color: 'bg-emerald-50 text-emerald-600' },
          { num: 'F-2026-011', client: 'Marc T.', montant: '2 400€', statut: 'en attente', color: 'bg-amber-50 text-amber-600' },
          { num: 'F-2026-010', client: 'Pierre G.', montant: '1 200€', statut: 'en retard', color: 'bg-red-50 text-red-600' },
        ].map(f => (
          <div key={f.num} className="bg-white rounded-xl p-3 border border-[rgba(13,27,42,0.08)] flex items-center justify-between">
            <div>
              <p className="text-[#0D1B2A] text-xs font-semibold">{f.num}</p>
              <p className="text-[#7A90A4] text-[10px]">{f.client}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#0D1B2A] text-xs font-bold">{f.montant}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${f.color}`}>{f.statut}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  coach: {
    title: 'Coach IA business',
    desc: 'Votre coach connaît vos chiffres, vos leads et vos objectifs. Il vous conseille avec précision, pas avec des généralités.',
    preview: (
      <div className="bg-[#F5F4F0] rounded-xl p-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#0D1B2A] flex items-center justify-center shrink-0 mt-0.5">
            <Bot size={13} className="text-cyan-400" />
          </div>
          <div className="bg-white rounded-2xl rounded-tl-sm p-3 border border-[rgba(13,27,42,0.08)] flex-1">
            <p className="text-[#0D1B2A] text-xs leading-relaxed">Bonjour ! Votre CA de mars est en hausse de 12% — excellente trajectoire. Cependant, j'ai repéré <strong>3 leads chauds</strong> non relancés depuis 8 jours. C'est votre priorité du jour.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 flex-row-reverse">
          <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-cyan-700 text-[10px] font-bold">V</span>
          </div>
          <div className="bg-cyan-600 rounded-2xl rounded-tr-sm p-3 flex-1">
            <p className="text-white text-xs leading-relaxed">Comment améliorer mon taux de conversion ?</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#0D1B2A] flex items-center justify-center shrink-0 mt-0.5">
            <Bot size={13} className="text-cyan-400" />
          </div>
          <div className="bg-white rounded-2xl rounded-tl-sm p-3 border border-[rgba(13,27,42,0.08)] flex-1">
            <p className="text-[#0D1B2A] text-xs leading-relaxed">Votre meilleur canal est LinkedIn (40% de conversion). Je vous suggère d'y concentrer 80% de vos efforts en avril et de relancer Sophie R. cette semaine — son deal à 2 400€ est à portée.</p>
          </div>
        </div>
      </div>
    ),
  },
}

export default function DemoSection() {
  const [activeTab, setActiveTab] = useState<keyof typeof mockups>('dashboard')
  const active = mockups[activeTab]

  return (
    <section id="demo" className="py-20 md:py-28 px-6" style={{ background: 'linear-gradient(180deg, #F5F4F0 0%, #EFEEE9 100%)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-cyan-600 text-sm font-semibold mb-3 tracking-wide uppercase">Aperçu du produit</p>
          <h2 className="font-display text-3xl md:text-5xl font-normal text-[var(--navy)] mb-4">
            Votre cockpit business,<br />
            <em className="not-italic text-[var(--text-muted)]">en un coup d'œil</em>
          </h2>
          <p className="text-[var(--text-muted)] text-base max-w-xl mx-auto">
            8 modules connectés. Vos données synchronisées. Aucune configuration technique requise.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center bg-white border border-[var(--border)] rounded-2xl p-1 gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as keyof typeof mockups)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--navy)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--navy)]'
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mockup card */}
        <div className="bg-white rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white border border-[var(--border)] rounded-lg px-8 py-1 text-[10px] text-[var(--text-light)]">
                app.vcel.fr/dashboard
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-normal text-[var(--navy)] mb-3">{active.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">{active.desc}</p>
                <a href="#tarifs" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors group">
                  Accéder maintenant
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-[var(--border)]">
                {active.preview}
              </div>
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { icon: TrendingUp, label: 'Synchronisation temps réel' },
            { icon: Zap, label: 'Automatisations incluses' },
            { icon: Bot, label: 'Coach IA personnel' },
            { icon: Check, label: 'Opérationnel en 24h' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2.5 bg-white rounded-xl p-3 border border-[var(--border)]">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                <f.icon size={13} className="text-cyan-600" />
              </div>
              <p className="text-[var(--text-secondary)] text-xs font-medium leading-tight">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}