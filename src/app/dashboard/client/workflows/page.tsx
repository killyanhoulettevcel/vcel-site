'use client'
import { useState, useEffect } from 'react'
import { Zap, CheckCircle, XCircle, Circle, RefreshCw, BarChart2, Mail } from 'lucide-react'

interface Workflow {
  id: string
  workflow_id: string
  nom: string
  actif: boolean
  statut: 'actif' | 'erreur' | 'inactif'
  nb_executions_mois: number
  derniere_execution?: string
  erreur_message?: string
}

const statutConfig: Record<string, { label: string, color: string, dot: string }> = {
  actif:   { label: 'Actif',   color: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-400' },
  erreur:  { label: 'Erreur',  color: 'bg-red-500/10 text-red-400 border-red-500/20',       dot: 'bg-red-400'   },
  inactif: { label: 'Inactif', color: 'bg-white/5 text-white/30 border-white/10',           dot: 'bg-white/20'  },
}

const workflowIcons: Record<string, React.ElementType> = {
  'CA Sheets → Supabase': BarChart2,
  'Résumé hebdomadaire IA': Mail,
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchWorkflows = async () => {
    try {
      const res  = await fetch('/api/workflows')
      const data = await res.json()
      setWorkflows(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchWorkflows() }, [])

  const refresh = () => { setRefreshing(true); fetchWorkflows() }

  const actifs  = workflows.filter(w => w.actif).length
  const erreurs = workflows.filter(w => w.statut === 'erreur').length
  const totalEx = workflows.reduce((s, w) => s + (w.nb_executions_mois || 0), 0)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Workflows</h1>
          <p className="text-white/40 text-sm">Vos automatisations n8n actives</p>
        </div>
        <button onClick={refresh}
          className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Actifs</p>
          <p className="font-display text-3xl font-bold text-white">
            {actifs}<span className="text-white/20 text-lg font-normal">/{workflows.length}</span>
          </p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Erreurs</p>
          <p className={`font-display text-3xl font-bold ${erreurs > 0 ? 'text-red-400' : 'text-white'}`}>{erreurs}</p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Exécutions ce mois</p>
          <p className="font-display text-3xl font-bold text-white">{totalEx}</p>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
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
          <p className="text-white/20 text-xs mt-1">Vos workflows apparaîtront ici après la configuration de votre compte</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => {
            const s   = statutConfig[w.statut] || statutConfig['inactif']
            const Icon = workflowIcons[w.nom] || Zap
            return (
              <div key={w.id} className={`card-glass p-5 transition-all ${w.statut === 'erreur' ? 'border-red-500/20' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      w.actif ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 border border-white/10'
                    }`}>
                      <Icon size={18} className={w.actif ? 'text-blue-400' : 'text-white/20'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white text-sm font-medium">{w.nom}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${s.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${w.statut === 'erreur' ? 'animate-pulse' : ''}`} />
                          {s.label}
                        </span>
                      </div>
                      {w.erreur_message && (
                        <p className="text-red-400 text-xs flex items-center gap-1.5 mb-1">
                          <XCircle size={11} /> {w.erreur_message}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-white/25">
                        <span>{w.nb_executions_mois || 0} exécutions ce mois</span>
                        {w.derniere_execution && (
                          <span>Dernière : {new Date(w.derniere_execution).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statut indicator */}
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${s.dot} ${w.statut === 'erreur' ? 'animate-pulse' : ''}`} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div className="card-glass p-5 mt-6 flex items-start gap-3">
        <Zap size={15} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white text-sm font-medium mb-0.5">Vos workflows tournent automatiquement</p>
          <p className="text-white/30 text-xs">VCEL-2 synchronise votre CA chaque lundi à 6h. VCEL-3 vous envoie votre résumé chaque lundi à 8h.</p>
        </div>
      </div>
    </div>
  )
}
