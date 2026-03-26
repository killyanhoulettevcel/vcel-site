'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, RefreshCw, AlertTriangle, Info, TrendingUp,
  Users, FileText, Zap, Target, ArrowRight, CheckCircle,
  Bell, ShieldAlert, Clock, ChevronRight, Filter
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Priorite   = 'critique' | 'important' | 'info'
type Categorie  = 'leads' | 'finances' | 'objectifs' | 'workflows' | 'croissance' | 'ia'

interface Alerte {
  id: string
  priorite: Priorite
  categorie: Categorie
  titre: string
  message: string
  valeur?: string
  action: string
  href: string
  ts: string
}

interface AlertesData {
  alertes: Alerte[]
  insightIA: string | null
  stats: { critique: number; important: number; info: number; total: number }
  generatedAt: string
}

// ─── Config visuelle ──────────────────────────────────────────────────────────

const PRIORITE_CONFIG = {
  critique:  { label: 'Critique',   bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   dot: '#EF4444', text: '#DC2626',  icon: ShieldAlert   },
  important: { label: 'Important',  bg: 'rgba(249,115,22,0.07)',  border: 'rgba(249,115,22,0.22)',  dot: '#F97316', text: '#EA580C',  icon: AlertTriangle },
  info:      { label: 'Info',       bg: 'rgba(79,195,247,0.06)',  border: 'rgba(79,195,247,0.18)',  dot: '#4FC3F7', text: '#0288D1',  icon: Info          },
}

const CATEGORIE_CONFIG: Record<Categorie, { icon: any; label: string; color: string }> = {
  leads:      { icon: Users,      label: 'Leads',       color: '#4FC3F7' },
  finances:   { icon: FileText,   label: 'Finances',    color: '#22C55E' },
  objectifs:  { icon: Target,     label: 'Objectifs',   color: '#7C5CBF' },
  workflows:  { icon: Zap,        label: 'Workflows',   color: '#F97316' },
  croissance: { icon: TrendingUp, label: 'Croissance',  color: '#10B981' },
  ia:         { icon: Sparkles,   label: 'IA',          color: '#F59E0B' },
}

// ─── Composants ──────────────────────────────────────────────────────────────

function AlerteCard({ alerte, onAction }: { alerte: Alerte; onAction: (href: string) => void }) {
  const P = PRIORITE_CONFIG[alerte.priorite]
  const C = CATEGORIE_CONFIG[alerte.categorie]
  const PIcon = P.icon
  const CIcon = C.icon

  return (
    <div className="card-glass p-4 md:p-5 group transition-all hover:scale-[1.005] animate-fade-in"
      style={{ borderColor: P.border, background: P.bg }}>
      <div className="flex items-start gap-4">

        {/* Icône catégorie */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${C.color}18` }}>
          <CIcon size={16} style={{ color: C.color }} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {alerte.titre}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: `${P.dot}18`, color: P.text }}>
                <PIcon size={9} />
                {P.label}
              </span>
            </div>
            {alerte.valeur && (
              <span className="text-sm font-bold shrink-0" style={{ color: P.text }}>
                {alerte.valeur}
              </span>
            )}
          </div>

          <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {alerte.message}
          </p>

          <button
            onClick={() => onAction(alerte.href)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-2.5"
            style={{ color: C.color }}>
            {alerte.action}
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function StatPill({ count, label, color, bg }: any) {
  if (!count) return null
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
      style={{ background: bg, color }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {count} {label}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AlertesPage() {
  const router = useRouter()
  const [data,        setData]        = useState<AlertesData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [filtre,      setFiltre]      = useState<Priorite | Categorie | 'all'>('all')

  const fetchAlertes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/alertes', { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchAlertes() }, [])

  const alertesFiltrees = data?.alertes.filter(a => {
    if (filtre === 'all') return true
    return a.priorite === filtre || a.categorie === filtre
  }) || []

  const nbCritique = data?.stats.critique || 0

  const FILTRES = [
    { id: 'all',       label: 'Tout',       count: data?.stats.total },
    { id: 'critique',  label: 'Critique',   count: data?.stats.critique,  color: '#EF4444' },
    { id: 'important', label: 'Important',  count: data?.stats.important, color: '#F97316' },
    { id: 'info',      label: 'Info',       count: data?.stats.info,      color: '#4FC3F7' },
    { id: 'leads',     label: 'Leads',      count: data?.alertes.filter(a => a.categorie === 'leads').length },
    { id: 'finances',  label: 'Finances',   count: data?.alertes.filter(a => a.categorie === 'finances').length },
    { id: 'workflows', label: 'Workflows',  count: data?.alertes.filter(a => a.categorie === 'workflows').length },
  ] as const

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border-hover)', borderTopColor: 'var(--cyan)' }} />
        <span className="text-sm">Analyse de votre business…</span>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(2,136,209,0.08))' }}>
                <Bell size={17} style={{ color: 'var(--cyan)' }} />
              </div>
              {nbCritique > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: '#EF4444' }}>
                  {nbCritique}
                </div>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: 'var(--navy)' }}>
              Alertes & insights
            </h1>
          </div>
          <p className="text-sm ml-11.5" style={{ color: 'var(--text-muted)' }}>
            Analyse IA de votre business en temps réel
            {data?.generatedAt && (
              <span> — {new Date(data.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </p>
        </div>

        <button onClick={() => fetchAlertes(true)} disabled={refreshing}
          className="btn-ghost text-sm flex items-center gap-2 shrink-0">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* ── Stats globales ── */}
      {data && data.stats.total > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <StatPill count={data.stats.critique}  label="critique(s)"  color="#DC2626" bg="rgba(239,68,68,0.08)" />
          <StatPill count={data.stats.important} label="important(s)" color="#EA580C" bg="rgba(249,115,22,0.07)" />
          <StatPill count={data.stats.info}      label="info"         color="#0288D1" bg="rgba(79,195,247,0.08)" />
        </div>
      )}

      {/* ── Insight IA ── */}
      {data?.insightIA && (
        <div className="card-glass p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, var(--cyan-dark), var(--cyan), transparent)' }} />
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(2,136,209,0.08))' }}>
              <Sparkles size={14} style={{ color: 'var(--cyan)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"
                style={{ color: 'var(--cyan-dark)' }}>
                Analyse IA
                <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ background: 'rgba(79,195,247,0.12)', color: 'var(--cyan-dark)' }}>
                  GPT-4o mini
                </span>
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {data.insightIA}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <Filter size={13} style={{ color: 'var(--text-muted)' }} />
        {FILTRES.map(f => {
          const active = filtre === f.id
          const hasColor = 'color' in f && f.color
          return (
            <button key={f.id}
              onClick={() => setFiltre(f.id as any)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
              style={{
                background: active ? (hasColor ? `${f.color}12` : 'var(--navy)') : 'transparent',
                borderColor: active ? (hasColor ? `${f.color}40` : 'var(--navy)') : 'var(--border)',
                color: active ? (hasColor ? f.color : 'white') : 'var(--text-muted)',
              }}>
              {f.label}
              {f.count != null && f.count > 0 && (
                <span className="px-1 py-0 rounded-full text-[10px] font-bold"
                  style={{ background: active ? 'rgba(255,255,255,0.20)' : 'var(--bg-secondary)', color: 'inherit' }}>
                  {f.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Liste des alertes ── */}
      {alertesFiltrees.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(34,197,94,0.10)' }}>
            <CheckCircle size={24} style={{ color: '#22C55E' }} />
          </div>
          <p className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {filtre === 'all' ? 'Tout est au vert !' : 'Aucune alerte dans cette catégorie'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {filtre === 'all'
              ? 'Aucun point d\'attention détecté sur votre business aujourd\'hui.'
              : 'Essayez un autre filtre ou revenez plus tard.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Grouper par priorité */}
          {(['critique', 'important', 'info'] as Priorite[]).map(p => {
            const groupe = alertesFiltrees.filter(a => a.priorite === p)
            if (groupe.length === 0) return null
            const PC = PRIORITE_CONFIG[p]
            const PIcon = PC.icon
            return (
              <div key={p}>
                <div className="flex items-center gap-2 mb-2.5">
                  <PIcon size={13} style={{ color: PC.dot }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: PC.text }}>
                    {PC.label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({groupe.length})</span>
                </div>
                <div className="space-y-2.5">
                  {groupe.map(a => (
                    <AlerteCard key={a.id} alerte={a} onAction={href => router.push(href)} />
                  ))}
                </div>
                <div className="mt-4 mb-2" />
              </div>
            )
          })}
        </div>
      )}

      {/* ── Footer ── */}
      {data && (
        <p className="text-xs mt-8 text-center" style={{ color: 'var(--text-light)' }}>
          {data.stats.total > 0
            ? `${data.stats.total} alerte${data.stats.total > 1 ? 's' : ''} détectée${data.stats.total > 1 ? 's' : ''} — analyse automatique de vos données Supabase`
            : 'Analyse automatique de vos données — mise à jour à chaque visite'}
        </p>
      )}
    </div>
  )
}