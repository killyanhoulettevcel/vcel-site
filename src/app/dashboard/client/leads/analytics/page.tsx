'use client'
import React, { useState, useEffect } from 'react'
import {
  TrendingUp, Users, Flame, Check, Clock, ArrowLeft,
  Target, BarChart2, Zap, ChevronRight, RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  nom: string
  score: 'chaud' | 'tiède' | 'froid'
  statut: 'nouveau' | 'contacté' | 'qualifié' | 'converti' | 'perdu'
  source: string
  valeur_estimee: number
  probabilite: number
  created_at: string
}

interface StatSource {
  source: string
  total: number
  convertis: number
  taux: number
  valeur: number
}

interface StatScore {
  score: string
  total: number
  convertis: number
  taux: number
}

export default function LeadsAnalyticsPage() {
  const router = useRouter()
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ── Calculs analytics ──────────────────────────────────────────────────────
  const total     = leads.length
  const convertis = leads.filter(l => l.statut === 'converti').length
  const perdus    = leads.filter(l => l.statut === 'perdu').length
  const actifs    = leads.filter(l => !['converti', 'perdu'].includes(l.statut)).length
  const tauxConv  = total > 0 ? Math.round(convertis / total * 100) : 0

  // Temps moyen de conversion (jours entre created_at et converti)
  // On approxime avec les leads convertis
  const leadsConvertis = leads.filter(l => l.statut === 'converti')
  const tempsMoyen = leadsConvertis.length > 0
    ? Math.round(leadsConvertis.reduce((s, l) => {
        return s + (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)
      }, 0) / leadsConvertis.length)
    : 0

  // CA réalisé (leads convertis avec valeur)
  const caRealise = leadsConvertis.reduce((s, l) => s + (l.valeur_estimee || 0), 0)

  // CA prévisionnel (pipeline actif)
  const caPrevisionnel = leads
    .filter(l => !['perdu', 'converti'].includes(l.statut))
    .reduce((s, l) => {
      const prob = l.probabilite || { nouveau: 10, contacté: 25, qualifié: 60 }[l.statut as string] || 0
      return s + (l.valeur_estimee || 0) * prob / 100
    }, 0)

  // Stats par source
  const sources = [...new Set(leads.map(l => l.source || 'Manuel'))].filter(Boolean)
  const statsSources: StatSource[] = sources.map(src => {
    const sl        = leads.filter(l => (l.source || 'Manuel') === src)
    const conv      = sl.filter(l => l.statut === 'converti').length
    const valeur    = sl.filter(l => l.statut === 'converti').reduce((s, l) => s + (l.valeur_estimee || 0), 0)
    return { source: src, total: sl.length, convertis: conv, taux: sl.length > 0 ? Math.round(conv / sl.length * 100) : 0, valeur }
  }).sort((a, b) => b.taux - a.taux)

  // Stats par score
  const statsScores: StatScore[] = ['chaud', 'tiède', 'froid'].map(sc => {
    const sl   = leads.filter(l => l.score === sc)
    const conv = sl.filter(l => l.statut === 'converti').length
    return { score: sc, total: sl.length, convertis: conv, taux: sl.length > 0 ? Math.round(conv / sl.length * 100) : 0 }
  })

  // Évolution mensuelle des leads créés
  const now = new Date()
  const mois = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    const moisStr = d.toISOString().slice(0, 7)
    const total   = leads.filter(l => l.created_at?.startsWith(moisStr)).length
    const conv    = leads.filter(l => l.created_at?.startsWith(moisStr) && l.statut === 'converti').length
    return { label, total, conv }
  })
  const maxMois = Math.max(...mois.map(m => m.total), 1)

  const scoreColors = {
    chaud: { bg: 'bg-red-50', color: 'text-red-600', bar: 'bg-red-400', icon: '🔥' },
    tiède: { bg: 'bg-orange-50', color: 'text-orange-600', bar: 'bg-orange-400', icon: '➖' },
    froid: { bg: 'bg-blue-50', color: 'text-blue-600', bar: 'bg-blue-400', icon: '❄️' },
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[var(--border)] border-t-cyan-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-[var(--navy)]">Analytics Leads</h1>
          <p className="text-[var(--text-muted)] text-sm">Performance de ton pipeline commercial</p>
        </div>
        <button onClick={() => { setLoading(true); fetch('/api/leads').then(r => r.json()).then(d => { setLeads(d); setLoading(false) }) }}
          className="ml-auto btn-ghost py-2 px-2.5">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="kpi-card">
          <div className="flex items-center gap-1.5 mb-2"><Users size={13} className="text-cyan-600" /><span className="text-[var(--text-muted)] text-xs">Total leads</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{total}</p>
          <p className="text-[var(--text-light)] text-xs mt-1">{actifs} actifs · {perdus} perdus</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-1.5 mb-2"><Check size={13} className="text-emerald-500" /><span className="text-[var(--text-muted)] text-xs">Taux conv.</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{tauxConv}<span className="text-lg font-normal text-[var(--text-muted)]">%</span></p>
          <p className="text-[var(--text-light)] text-xs mt-1">{convertis} convertis</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-1.5 mb-2"><Clock size={13} className="text-violet-600" /><span className="text-[var(--text-muted)] text-xs">Temps moyen</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{tempsMoyen}<span className="text-lg font-normal text-[var(--text-muted)]">j</span></p>
          <p className="text-[var(--text-light)] text-xs mt-1">avant conversion</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-1.5 mb-2"><TrendingUp size={13} className="text-amber-600" /><span className="text-[var(--text-muted)] text-xs">CA réalisé</span></div>
          <p className="font-display text-2xl font-bold text-[var(--navy)]">{caRealise.toLocaleString('fr-FR')}€</p>
          <p className="text-[var(--text-light)] text-xs mt-1">Pipeline : {caPrevisionnel.toLocaleString('fr-FR')}€</p>
        </div>
      </div>

      {/* Évolution mensuelle */}
      <div className="card-glass p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={15} className="text-cyan-600" />
          <h2 className="font-display font-bold text-[var(--navy)] text-sm">Évolution sur 6 mois</h2>
        </div>
        <div className="flex items-end gap-2 h-28">
          {mois.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end gap-0.5" style={{ height: '80px' }}>
                {/* Barre total */}
                <div className="w-full rounded-t-lg bg-cyan-100 transition-all relative"
                  style={{ height: `${Math.round((m.total / maxMois) * 72)}px`, minHeight: m.total > 0 ? '4px' : '0' }}>
                  {/* Barre convertis par dessus */}
                  {m.conv > 0 && (
                    <div className="absolute bottom-0 w-full rounded-t-lg bg-emerald-400"
                      style={{ height: `${Math.round((m.conv / m.total) * 100)}%` }} />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-light)] font-medium">{m.label}</p>
              <p className="text-[10px] font-bold text-[var(--text-secondary)]">{m.total}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-100" /><span className="text-xs text-[var(--text-muted)]">Créés</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span className="text-xs text-[var(--text-muted)]">Convertis</span></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">

        {/* Taux de conversion par source */}
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-amber-500" />
            <h2 className="font-display font-bold text-[var(--navy)] text-sm">Meilleurs canaux d'acquisition</h2>
          </div>
          {statsSources.length === 0 ? (
            <p className="text-[var(--text-light)] text-xs italic">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {statsSources.map(s => (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{s.source}</span>
                      <span className="text-xs text-[var(--text-light)]">{s.total} leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.valeur > 0 && <span className="text-xs text-emerald-600 font-semibold">{s.valeur.toLocaleString('fr-FR')}€</span>}
                      <span className="text-xs font-bold text-[var(--navy)]">{s.taux}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full transition-all"
                      style={{ width: `${s.taux}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Taux de conversion par score */}
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={15} className="text-red-500" />
            <h2 className="font-display font-bold text-[var(--navy)] text-sm">Conversion par score</h2>
          </div>
          <div className="space-y-3">
            {statsScores.map(s => {
              const cfg = scoreColors[s.score as keyof typeof scoreColors]
              return (
                <div key={s.score}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon} {s.score}
                      </span>
                      <span className="text-xs text-[var(--text-light)]">{s.total} leads</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--navy)]">{s.taux}%</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div className={`h-full ${cfg.bar} rounded-full transition-all`}
                      style={{ width: `${s.taux}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--text-light)] mt-0.5">{s.convertis} converti{s.convertis > 1 ? 's' : ''}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Insights automatiques */}
      <div className="card-glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target size={15} className="text-violet-600" />
          <h2 className="font-display font-bold text-[var(--navy)] text-sm">Insights</h2>
        </div>
        <div className="space-y-2">
          {/* Meilleure source */}
          {statsSources[0] && statsSources[0].taux > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-sm font-semibold text-emerald-700">Meilleur canal : {statsSources[0].source}</p>
                <p className="text-xs text-emerald-600">{statsSources[0].taux}% de taux de conversion — mise dessus davantage</p>
              </div>
            </div>
          )}
          {/* Leads chauds non convertis */}
          {(() => {
            const chaudsActifs = leads.filter(l => l.score === 'chaud' && !['converti', 'perdu'].includes(l.statut)).length
            if (chaudsActifs > 0) return (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-sm font-semibold text-red-700">{chaudsActifs} lead{chaudsActifs > 1 ? 's' : ''} chaud{chaudsActifs > 1 ? 's' : ''} à convertir</p>
                  <p className="text-xs text-red-600">Ils sont prêts — relance-les maintenant</p>
                </div>
              </div>
            )
            return null
          })()}
          {/* Taux de conversion faible */}
          {tauxConv < 10 && total > 5 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-700">Taux de conversion faible ({tauxConv}%)</p>
                <p className="text-xs text-amber-600">Utilise le Score IA pour identifier les leads à prioriser</p>
              </div>
            </div>
          )}
          {/* Pipeline vide */}
          {caPrevisionnel === 0 && total > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Ajoute une valeur estimée à tes leads</p>
                <p className="text-xs text-[var(--text-muted)]">Ça te permettra de visualiser ton CA prévisionnel</p>
              </div>
            </div>
          )}
          {total === 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <span className="text-lg">📊</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Pas encore assez de données</p>
                <p className="text-xs text-[var(--text-muted)]">Ajoute des leads pour voir les analytics</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}