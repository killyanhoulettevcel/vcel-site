'use client'
import { useState, useEffect } from 'react'
import { Zap, XCircle, RefreshCw, BarChart2, Mail, ChevronDown, Clock, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Workflow {
  id: string
  workflow_id: string
  nom: string
  actif: boolean
  statut: 'ok' | 'warning' | 'erreur' | 'inactif'
  nb_executions_jour: number
  nb_executions_semaine: number
  nb_executions_mois: number
  nb_executions_total: number
  derniere_execution?: string
  derniere_erreur?: string
  erreur_message?: string
  nb_tentatives_repair?: number
  repair_message?: string
  seuil_warning_heures?: number
}

interface WorkflowMeta {
  label: string
  description: string
  detail: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  tag: string
  schedule: string
}

function getWorkflowMeta(nom: string): WorkflowMeta {
  if (nom.includes('VCEL-2') || nom.includes('CA Sheets')) {
    return {
      label: 'Sync CA depuis Google Sheets',
      description: 'Lit votre Google Sheet chaque lundi matin et synchronise votre CA, charges et marge dans le dashboard.',
      detail: 'Ce workflow récupère les données de votre onglet "dashboard" dans Google Sheets, calcule la marge mensuelle et les pousse dans Supabase. Il met aussi à jour le statut des workflows.',
      icon: BarChart2,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-100',
      tag: 'Finance',
      schedule: 'Tous les lundis à 6h',
    }
  }
  if (nom.includes('VCEL-3') || nom.includes('Résumé') || nom.includes('Resume')) {
    return {
      label: 'Résumé hebdomadaire IA',
      description: 'Chaque lundi, génère et envoie un email personnalisé avec vos chiffres clés et un conseil actionnable.',
      detail: 'Ce workflow récupère vos données (CA, leads, factures, objectifs), les envoie à GPT-4o mini qui génère un email HTML personnalisé avec analyse et recommandations, puis l\'envoie sur votre boîte Gmail.',
      icon: Mail,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50 border-violet-100',
      tag: 'IA',
      schedule: 'Tous les lundis à 8h',
    }
  }
  return {
    label: nom,
    description: 'Automatisation n8n active sur votre compte.',
    detail: '',
    icon: Zap,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-100',
    tag: 'Automation',
    schedule: 'Planifié',
  }
}

const statutConfig = {
  ok:      { label: 'Actif',    textColor: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200',   dot: 'bg-emerald-400', icon: CheckCircle },
  warning: { label: 'Inactif',  textColor: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200',     dot: 'bg-orange-400',  icon: AlertTriangle },
  erreur:  { label: 'Erreur',   textColor: 'text-red-600',     bg: 'bg-red-50 border-red-200',           dot: 'bg-red-400',     icon: AlertTriangle },
  inactif: { label: 'Inactif',  textColor: 'text-[var(--text-light)]', bg: 'bg-[var(--bg-secondary)] border-[var(--border)]', dot: 'bg-[var(--border-hover)]', icon: Clock },
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows]   = useState<Workflow[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [expanded, setExpanded]     = useState<string | null>(null)

  const fetchWorkflows = async () => {
    try {
      const res  = await fetch('/api/workflows')
      const data = await res.json()
      setWorkflows(Array.isArray(data) ? data : [])
      setLastUpdate(new Date())
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    fetchWorkflows()
    const channel = supabase
      .channel('workflows-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflows' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setWorkflows(prev => prev.map(w => w.id === (payload.new as any).id ? { ...w, ...(payload.new as any) } : w))
          setLastUpdate(new Date())
        } else { fetchWorkflows() }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const refresh = () => { setRefreshing(true); fetchWorkflows() }

  const actifs   = workflows.filter(w => w.statut === 'ok').length
  const warnings = workflows.filter(w => w.statut === 'warning').length
  const erreurs  = workflows.filter(w => w.statut === 'erreur').length
  const totalEx  = workflows.reduce((s, w) => s + (w.nb_executions_semaine || 0), 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl">

      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-[var(--navy)] mb-1">Workflows</h1>
          <div className="flex items-center gap-3">
            <p className="text-[var(--text-muted)] text-xs md:text-sm">Vos automatisations n8n actives</p>
            {lastUpdate && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Temps réel
              </span>
            )}
          </div>
        </div>
        <button onClick={refresh} className="btn-ghost text-sm py-2 px-3 md:px-4 flex items-center gap-2 shrink-0">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="kpi-card">
          <p className="text-[var(--text-muted)] text-xs mb-2">Actifs</p>
          <p className="font-display text-2xl md:text-3xl font-bold text-[var(--navy)]">
            {actifs}<span className="text-[var(--text-light)] text-sm md:text-lg font-normal">/{workflows.length}</span>
          </p>
        </div>
        <div className="kpi-card">
          <p className="text-[var(--text-muted)] text-xs mb-2">Erreurs</p>
          <p className={`font-display text-2xl md:text-3xl font-bold ${erreurs > 0 ? 'text-red-500' : 'text-[var(--navy)]'}`}>{erreurs}</p>
        </div>
        <div className="kpi-card">
          <p className="text-[var(--text-muted)] text-xs mb-1">Exécutions</p>
          <p className="text-[var(--text-light)] text-xs mb-1 hidden md:block">ce mois</p>
          <p className="font-display text-2xl md:text-3xl font-bold text-[var(--navy)]">{totalEx}</p>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="card-glass p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)]" />
                <div className="flex-1">
                  <div className="h-4 bg-[var(--bg-secondary)] rounded w-48 mb-2" />
                  <div className="h-3 bg-[var(--bg-secondary)] rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <Zap size={32} className="text-[var(--text-light)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-sm">Aucun workflow configuré</p>
          <p className="text-[var(--text-light)] text-xs mt-1">Vos workflows apparaîtront ici après la configuration initiale</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => {
            const meta   = getWorkflowMeta(w.nom)
            const s      = statutConfig[w.statut] || statutConfig['inactif']
            const isOpen = expanded === w.id
            const StatusIcon = s.icon

            return (
              <div
                key={w.id}
                className={`card-glass overflow-hidden transition-all duration-200 ${w.statut === 'erreur' ? 'border-red-200' : w.statut === 'warning' ? 'border-orange-200' : ''}`}
              >
                {/* Header cliquable */}
                <div
                  className="p-4 md:p-5 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : w.id)}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                      <meta.icon size={17} className={meta.iconColor} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-[var(--text-primary)] text-sm font-semibold">{meta.label}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1.5 ${s.bg} ${s.textColor}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${w.statut === 'erreur' || w.statut === 'warning' ? 'animate-pulse' : ''}`} />
                          {s.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-light)] font-mono hidden md:inline">{meta.tag}</span>
                      </div>
                      <p className="text-[var(--text-muted)] text-xs truncate">{meta.description}</p>
                    </div>

                    <ChevronDown
                      size={15}
                      className={`text-[var(--text-light)] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {w.erreur_message && (
                    <div className="mt-3 ml-14 flex items-start gap-2 text-red-600 text-xs bg-red-50 rounded-lg p-2.5 border border-red-100">
                      <XCircle size={12} className="shrink-0 mt-0.5" />
                      {w.erreur_message}
                    </div>
                  )}
                </div>

                {/* Détail expandé */}
                {isOpen && (
                  <div className="border-t border-[var(--border)] px-4 md:px-5 py-4 space-y-4 bg-[var(--bg-secondary)]">

                    {meta.detail && (
                      <div className="flex items-start gap-2.5 bg-white rounded-xl p-3 border border-[var(--border)]">
                        <Info size={13} className="text-[var(--text-light)] shrink-0 mt-0.5" />
                        <p className="text-[var(--text-muted)] text-xs leading-relaxed">{meta.detail}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl p-3 text-center border border-[var(--border)]">
                        <p className="text-[var(--text-muted)] text-xs mb-1">Exécutions</p>
                        <p className="text-[var(--navy)] font-display font-bold text-lg" title={`Ce mois : ${w.nb_executions_mois || 0}`}>{w.nb_executions_semaine || 0}</p>
                        <p className="text-[var(--text-light)] text-xs">ce mois</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 text-center border border-[var(--border)]">
                        <p className="text-[var(--text-muted)] text-xs mb-1">Planning</p>
                        <p className="text-[var(--text-secondary)] text-xs font-medium mt-2 leading-snug">{meta.schedule}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 text-center border border-[var(--border)]">
                        <p className="text-[var(--text-muted)] text-xs mb-1">Dernière exec.</p>
                        <p className="text-[var(--text-secondary)] text-xs font-medium mt-2 leading-snug">
                          {w.derniere_execution
                            ? new Date(w.derniere_execution).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                            : '—'}
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 rounded-xl p-3 border ${s.bg}`}>
                      <StatusIcon size={13} className={s.textColor} />
                      <p className={`text-xs font-medium ${s.textColor}`}>
                        {w.repair_message && w.statut !== 'ok' && (
                          <p className="text-xs mt-1 italic" style={{ color: w.statut === 'warning' ? '#EA580C' : '#DC2626' }}>
                            🤖 {w.repair_message.slice(0, 80)}{w.repair_message.length > 80 ? '…' : ''}
                          </p>
                        )}
                        {w.nb_tentatives_repair != null && w.nb_tentatives_repair > 0 && w.statut !== 'ok' && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Tentatives IA : {w.nb_tentatives_repair}/3
                          </p>
                        )}
                        {w.statut === 'ok'
                          ? 'Ce workflow tourne normalement. Aucune intervention requise.'
                          : w.statut === 'erreur'
                          ? 'Une erreur a été détectée lors de la dernière exécution. Vérifiez la connexion n8n.'
                          : 'Ce workflow est en pause. Contactez le support pour le réactiver.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="card-glass p-4 md:p-5 mt-5 md:mt-6 flex items-start gap-3">
        <Zap size={15} className="text-cyan-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[var(--text-primary)] text-sm font-medium mb-0.5">Vos workflows tournent automatiquement</p>
          <p className="text-[var(--text-muted)] text-xs">
            VCEL-2 synchronise votre CA chaque lundi à 6h depuis Google Sheets.
            VCEL-3 vous envoie votre résumé IA personnalisé chaque lundi à 8h par email.
          </p>
        </div>
      </div>
    </div>
  )
}