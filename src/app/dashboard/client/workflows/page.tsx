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
  statut: 'ok' | 'erreur' | 'inactif'
  nb_executions_mois: number
  derniere_execution?: string
  erreur_message?: string
}

// Mapping dynamique basé sur le préfixe du nom en base
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
      description: 'Lit votre Google Sheet chaque lundi matin et synchronise automatiquement votre CA, charges et marge dans le dashboard.',
      detail: 'Ce workflow récupère les données de votre onglet "dashboard" dans Google Sheets, calcule la marge mensuelle et les pousse dans Supabase. Il met aussi à jour le statut des workflows.',
      icon: BarChart2,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      tag: 'Finance',
      schedule: 'Tous les lundis à 6h',
    }
  }
  if (nom.includes('VCEL-3') || nom.includes('Résumé') || nom.includes('Resume')) {
    return {
      label: 'Résumé hebdomadaire IA',
      description: 'Chaque lundi matin, génère et envoie par email un résumé personnalisé de vos chiffres clés avec un conseil actionnable de votre coach IA.',
      detail: 'Ce workflow récupère vos données (CA, leads, factures, objectifs), les envoie à GPT-4o mini qui génère un email HTML personnalisé avec analyse et recommandations, puis l\'envoie sur votre boîte Gmail.',
      icon: Mail,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      tag: 'IA',
      schedule: 'Tous les lundis à 8h',
    }
  }
  // Fallback générique
  return {
    label: nom,
    description: 'Automatisation n8n active sur votre compte.',
    detail: '',
    icon: Zap,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10 border-yellow-500/20',
    tag: 'Automation',
    schedule: 'Planifié',
  }
}

const statutConfig = {
  ok:      { label: 'Actif',   textColor: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  dot: 'bg-green-400',  icon: CheckCircle },
  erreur:  { label: 'Erreur',  textColor: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',      dot: 'bg-red-400',    icon: AlertTriangle },
  inactif: { label: 'Inactif', textColor: 'text-white/30',   bg: 'bg-white/5 border-white/10',           dot: 'bg-white/20',   icon: Clock },
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

  const actifs  = workflows.filter(w => w.statut === 'ok').length
  const erreurs = workflows.filter(w => w.statut === 'erreur').length
  const totalEx = workflows.reduce((s, w) => s + (w.nb_executions_mois || 0), 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl">

      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-white mb-1">Workflows</h1>
          <div className="flex items-center gap-3">
            <p className="text-white/40 text-xs md:text-sm">Vos automatisations n8n actives</p>
            {lastUpdate && (
              <span className="flex items-center gap-1.5 text-xs text-green-400/60">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
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
        <div className="card-glass p-4 md:p-5">
          <p className="text-white/40 text-xs mb-2">Actifs</p>
          <p className="font-display text-2xl md:text-3xl font-bold text-white">
            {actifs}<span className="text-white/20 text-sm md:text-lg font-normal">/{workflows.length}</span>
          </p>
        </div>
        <div className="card-glass p-4 md:p-5">
          <p className="text-white/40 text-xs mb-2">Erreurs</p>
          <p className={`font-display text-2xl md:text-3xl font-bold ${erreurs > 0 ? 'text-red-400' : 'text-white'}`}>{erreurs}</p>
        </div>
        <div className="card-glass p-4 md:p-5">
          <p className="text-white/40 text-xs mb-1">Exécutions</p>
          <p className="text-white/30 text-xs mb-1 hidden md:block">ce mois</p>
          <p className="font-display text-2xl md:text-3xl font-bold text-white">{totalEx}</p>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="card-glass p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="flex-1">
                  <div className="h-4 bg-white/5 rounded w-48 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <Zap size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Aucun workflow configuré</p>
          <p className="text-white/20 text-xs mt-1">Vos workflows apparaîtront ici après la configuration initiale</p>
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
                className={`card-glass overflow-hidden transition-all duration-200 ${w.statut === 'erreur' ? 'border-red-500/20' : ''}`}
              >
                {/* Header cliquable */}
                <div
                  className="p-4 md:p-5 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : w.id)}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Icône */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                      <meta.icon size={17} className={meta.iconColor} />
                    </div>

                    {/* Nom + statut */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-white text-sm font-semibold">{meta.label}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${s.bg} ${s.textColor}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${w.statut === 'erreur' ? 'animate-pulse' : ''}`} />
                          {s.label}
                        </span>
                        <span className="text-[10px] text-white/20 font-mono hidden md:inline">{meta.tag}</span>
                      </div>
                      <p className="text-white/35 text-xs truncate">{meta.description}</p>
                    </div>

                    {/* Toggle */}
                    <ChevronDown
                      size={15}
                      className={`text-white/20 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Erreur visible */}
                  {w.erreur_message && (
                    <div className="mt-3 ml-14 flex items-start gap-2 text-red-400 text-xs bg-red-500/5 rounded-lg p-2.5 border border-red-500/10">
                      <XCircle size={12} className="shrink-0 mt-0.5" />
                      {w.erreur_message}
                    </div>
                  )}
                </div>

                {/* Détail expandé */}
                {isOpen && (
                  <div className="border-t border-white/5 px-4 md:px-5 py-4 space-y-4">

                    {/* Description longue */}
                    {meta.detail && (
                      <div className="flex items-start gap-2.5 bg-white/3 rounded-xl p-3">
                        <Info size={13} className="text-white/30 shrink-0 mt-0.5" />
                        <p className="text-white/45 text-xs leading-relaxed">{meta.detail}</p>
                      </div>
                    )}

                    {/* Métriques */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/3 rounded-xl p-3 text-center">
                        <p className="text-white/30 text-xs mb-1">Exécutions</p>
                        <p className="text-white font-display font-bold text-lg">{w.nb_executions_mois || 0}</p>
                        <p className="text-white/20 text-xs">ce mois</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3 text-center">
                        <p className="text-white/30 text-xs mb-1">Planning</p>
                        <p className="text-white/70 text-xs font-medium mt-2 leading-snug">{meta.schedule}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3 text-center">
                        <p className="text-white/30 text-xs mb-1">Dernière exec.</p>
                        <p className="text-white/70 text-xs font-medium mt-2 leading-snug">
                          {w.derniere_execution
                            ? new Date(w.derniere_execution).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Statut détaillé */}
                    <div className={`flex items-center gap-2 rounded-xl p-3 ${s.bg}`}>
                      <StatusIcon size={13} className={s.textColor} />
                      <p className={`text-xs font-medium ${s.textColor}`}>
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

      {/* Footer info */}
      <div className="card-glass p-4 md:p-5 mt-5 md:mt-6 flex items-start gap-3">
        <Zap size={15} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white text-sm font-medium mb-0.5">Vos workflows tournent automatiquement</p>
          <p className="text-white/30 text-xs">
            VCEL-2 synchronise votre CA chaque lundi à 6h depuis Google Sheets.
            VCEL-3 vous envoie votre résumé IA personnalisé chaque lundi à 8h par email.
          </p>
        </div>
      </div>
    </div>
  )
}