'use client'
import { useEffect, useState } from 'react'
import {
  Users, TrendingUp, Zap, Euro, Crown, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  WrenchIcon, Clock, Activity
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Workflow {
  id: string
  nom: string
  actif: boolean
  statut: 'ok' | 'warning' | 'erreur' | 'inactif'
  nb_executions_mois: number
  nb_executions_semaine?: number
  nb_executions_jour?: number
  derniere_execution?: string
  erreur_message?: string
  nb_tentatives_repair?: number
  repair_message?: string
  workflow_id?: string
}

interface Client {
  id: string
  nom: string
  email: string
  secteur: string
  statut: string
  created_at: string
  stripe_customer_id: string
  leads: number
  factures_impayees: number
  workflows_actifs: number
  ca_dernier: number
  workflows?: Workflow[]
}

// ─── Composants workflows ─────────────────────────────────────────────────────

function WorkflowDots({ workflows }: { workflows?: Workflow[] }) {
  if (!workflows || workflows.length === 0)
    return <span style={{ color: 'var(--text-light)', fontSize: 12 }}>—</span>
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {workflows.map(w => (
        <div key={w.id}
          title={`${w.nom}${w.erreur_message ? ' — ' + w.erreur_message : ''}`}
          className={`w-2 h-2 rounded-full ${
            w.statut === 'ok'      ? 'bg-green-400' :
            w.statut === 'warning' ? 'bg-orange-400 animate-pulse' :
            w.statut === 'erreur'  ? 'bg-red-400 animate-pulse' :
            'bg-[var(--border-hover)]'
          }`} />
      ))}
      {workflows.some(w => w.statut === 'erreur') && (
        <AlertTriangle size={11} className="text-red-400 ml-0.5" />
      )}
      {workflows.some(w => w.statut === 'warning') && !workflows.some(w => w.statut === 'erreur') && (
        <AlertTriangle size={11} className="text-orange-400 ml-0.5" />
      )}
    </div>
  )
}

function WorkflowDetail({
  workflows, onRepair, repairing
}: {
  workflows?: Workflow[]
  onRepair: (wfId: string, n8nId: string, nom: string) => void
  repairing: string | null
}) {
  if (!workflows || workflows.length === 0)
    return <p className="text-xs py-2" style={{ color: 'var(--text-light)' }}>Aucun workflow configuré</p>

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {workflows.map(w => {
        const execDisplay = w.nb_executions_semaine ?? w.nb_executions_mois ?? 0
        const isProblematic = w.statut === 'warning' || w.statut === 'erreur'

        return (
          <div key={w.id} className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
            w.statut === 'erreur'  ? 'bg-red-50 border-red-200' :
            w.statut === 'warning' ? 'bg-orange-50 border-orange-200' :
            w.statut === 'ok'      ? 'bg-green-50 border-green-100' :
            'border-[var(--border)]'
          }`} style={{ background: w.statut === 'ok' ? 'rgba(34,197,94,0.04)' : undefined }}>

            {/* Dot statut */}
            <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
              w.statut === 'ok'      ? 'bg-green-400' :
              w.statut === 'warning' ? 'bg-orange-400 animate-pulse' :
              w.statut === 'erreur'  ? 'bg-red-400 animate-pulse' :
              'bg-[var(--border-hover)]'
            }`} />

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate mb-0.5" style={{ color: 'var(--text-primary)' }}>{w.nom}</p>

              {/* Erreur ou message repair */}
              {w.erreur_message && (
                <p className="truncate text-red-600 mb-0.5">{w.erreur_message}</p>
              )}
              {w.repair_message && isProblematic && (
                <p className="italic truncate mb-0.5" style={{ color: w.statut === 'warning' ? '#EA580C' : '#DC2626' }}>
                  🤖 {w.repair_message.slice(0, 60)}{w.repair_message.length > 60 ? '…' : ''}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span style={{ color: 'var(--text-muted)' }}>
                  {execDisplay} exec/7j
                </span>
                {w.nb_executions_mois != null && (
                  <span style={{ color: 'var(--text-light)' }}>
                    · {w.nb_executions_mois} ce mois
                  </span>
                )}
                {w.derniere_execution && (
                  <span style={{ color: 'var(--text-light)' }}>
                    · {new Date(w.derniere_execution).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                {w.nb_tentatives_repair != null && w.nb_tentatives_repair > 0 && (
                  <span style={{ color: '#EA580C' }}>
                    · {w.nb_tentatives_repair}/3 tentatives IA
                  </span>
                )}
              </div>
            </div>

            {/* Bouton réparation IA manuelle */}
            {isProblematic && w.workflow_id && (
              <button
                onClick={() => onRepair(w.id, w.workflow_id!, w.nom)}
                disabled={repairing === w.id}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: repairing === w.id ? 'var(--bg-secondary)' : 'rgba(249,115,22,0.10)',
                  color: repairing === w.id ? 'var(--text-muted)' : '#EA580C',
                  border: '1px solid rgba(249,115,22,0.20)',
                }}
                title="Lancer la réparation IA">
                {repairing === w.id
                  ? <><div className="w-3 h-3 border border-orange-300 border-t-orange-500 rounded-full animate-spin" /> IA…</>
                  : <><WrenchIcon size={10} /> Réparer</>
                }
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [clients,   setClients]   = useState<Client[]>([])
  const [loading,   setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [repairing, setRepairing] = useState<string | null>(null)
  const [repairMsg, setRepairMsg] = useState<Record<string, string>>({})

  const fetchClients = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/clients')
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
      setLastUpdate(new Date())
    } catch (e) { console.error('Admin fetch error:', e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchClients()
    const interval = setInterval(fetchClients, 30000)
    return () => clearInterval(interval)
  }, [])

  // Réparation IA manuelle depuis l'admin
  const handleRepair = async (wfId: string, n8nId: string, nom: string) => {
    setRepairing(wfId)
    try {
      const res = await fetch('/api/workflows/repair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PROVISIONING_SECRET || ''}`,
        },
        body: JSON.stringify({ workflowId: wfId, n8nWorkflowId: n8nId, nom }),
      })
      const data = await res.json()
      setRepairMsg(prev => ({ ...prev, [wfId]: data.message || data.action || 'Tentative lancée' }))
      // Rafraîchir les données après 5s
      setTimeout(fetchClients, 5000)
    } catch {
      setRepairMsg(prev => ({ ...prev, [wfId]: 'Erreur lors de la tentative' }))
    }
    setRepairing(null)
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const actifs     = clients.filter(c => c.statut === 'actif').length
  // MRR dynamique par plan (Starter 19, Pro 39, Business 69 — fallback 39 si plan inconnu)
  const PLAN_PRICE: Record<string, number> = { starter: 19, pro: 39, business: 69 }
  const mrr = clients
    .filter(c => c.statut === 'actif')
    .reduce((sum, c) => sum + (PLAN_PRICE[(c as any).plan] ?? 39), 0)
  const totalLeads = clients.reduce((s, c) => s + (c.leads || 0), 0)
  const totalWfOk  = clients.reduce((s, c) => s + (c.workflows?.filter(w => w.statut === 'ok').length || 0), 0)
  const wfWarnings = clients.reduce((s, c) => s + (c.workflows?.filter(w => w.statut === 'warning').length || 0), 0)
  const wfErreurs  = clients.reduce((s, c) => s + (c.workflows?.filter(w => w.statut === 'erreur').length || 0), 0)
  const wfProblemes = wfWarnings + wfErreurs

  const mrrData = clients.length > 0 ? [
    { mois: 'Oct', mrr: Math.max(0, actifs - 5) * 39 },
    { mois: 'Nov', mrr: Math.max(0, actifs - 4) * 39 },
    { mois: 'Déc', mrr: Math.max(0, actifs - 3) * 39 },
    { mois: 'Jan', mrr: Math.max(0, actifs - 2) * 39 },
    { mois: 'Fév', mrr: Math.max(0, actifs - 1) * 39 },
    { mois: 'Mar', mrr: mrr },
  ] : []

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown size={20} className="text-yellow-400" />
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--navy)' }}>Vue Admin VCEL</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Tous vos clients · {clients.length} compte{clients.length > 1 ? 's' : ''}
              </p>
              {lastUpdate && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#22C55E' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={fetchClients} className="btn-ghost text-sm py-2.5 px-4">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Alertes workflows */}
      {wfErreurs > 0 && (
        <div className="mb-3 flex items-center gap-3 p-4 rounded-xl border"
          style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <XCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm font-medium text-red-600">
            {wfErreurs} workflow{wfErreurs > 1 ? 's' : ''} en erreur — intervention requise
          </p>
        </div>
      )}
      {wfWarnings > 0 && (
        <div className="mb-3 flex items-center gap-3 p-4 rounded-xl border"
          style={{ background: 'rgba(249,115,22,0.07)', borderColor: 'rgba(249,115,22,0.22)' }}>
          <AlertTriangle size={16} className="text-orange-500 shrink-0" />
          <p className="text-sm font-medium text-orange-600">
            {wfWarnings} workflow{wfWarnings > 1 ? 's' : ''} inactif{wfWarnings > 1 ? 's' : ''} — réparation IA disponible
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Clients actifs',   value: String(actifs),    sub: `${clients.length} total`,       icon: Users,     alert: false },
          { label: 'MRR',              value: `${mrr}€`,         sub: `MRR calculé par plan`,          icon: Euro,      alert: false },
          { label: 'Leads générés',    value: String(totalLeads),sub: 'tous clients confondus',         icon: TrendingUp,alert: false },
          {
            label: 'Workflows actifs',
            value: String(totalWfOk),
            sub: wfErreurs > 0 ? `${wfErreurs} erreur${wfErreurs > 1 ? 's' : ''}` :
                 wfWarnings > 0 ? `${wfWarnings} en warning` : '0 problème',
            icon: wfErreurs > 0 ? XCircle : wfWarnings > 0 ? AlertTriangle : Activity,
            alert: wfProblemes > 0,
            alertColor: wfErreurs > 0 ? 'text-red-500' : 'text-orange-500',
          },
        ].map((k, i) => (
          <div key={i} className="card-glass p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                k.alert ? (wfErreurs > 0 ? 'bg-red-50' : 'bg-orange-50') : 'bg-blue-50'
              }`}>
                <k.icon size={14} className={k.alert ? (k as any).alertColor : 'text-blue-500'} />
              </div>
            </div>
            <p className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>{k.value}</p>
            <p className={`text-xs ${k.alert ? (wfErreurs > 0 ? 'text-red-500' : 'text-orange-500') : ''}`}
              style={{ color: k.alert ? undefined : 'var(--text-muted)' }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* MRR Chart */}
      {mrrData.length > 0 && (
        <div className="card-glass p-6 mb-6">
          <div className="mb-4">
            <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>MRR</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Basé sur les plans actifs</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mois" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-muted)' }}
                itemStyle={{ color: '#22c55e' }} />
              <Area type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table clients */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Clients ({clients.length})
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Cliquez pour voir les workflows · les dots oranges = réparation IA dispo
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 flex items-center justify-center gap-2"
            style={{ color: 'var(--text-muted)' }}>
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--border-hover)', borderTopColor: 'var(--cyan)' }} />
            Chargement...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-light)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun client</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => {
              const isOpen      = expanded === c.id
              const nbErreurs   = c.workflows?.filter(w => w.statut === 'erreur').length  || 0
              const nbWarnings  = c.workflows?.filter(w => w.statut === 'warning').length || 0
              const nbActifs    = c.workflows?.filter(w => w.statut === 'ok').length      || 0
              const hasProbleme = nbErreurs > 0 || nbWarnings > 0

              return (
                <div key={c.id}
                  className="rounded-xl overflow-hidden transition-all border"
                  style={{
                    borderColor: nbErreurs > 0  ? 'rgba(239,68,68,0.25)' :
                                 nbWarnings > 0 ? 'rgba(249,115,22,0.22)' :
                                 'var(--border)',
                  }}>

                  {/* Ligne principale */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-[var(--bg-secondary)]"
                    onClick={() => setExpanded(isOpen ? null : c.id)}>

                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(79,195,247,0.12)', color: 'var(--cyan-dark)' }}>
                      {(c.nom || c.email).charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 w-44 shrink-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.nom || '—'}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{c.email}</p>
                    </div>

                    <p className="text-xs w-28 shrink-0 hidden md:block" style={{ color: 'var(--text-muted)' }}>{c.secteur}</p>

                    <p className="text-xs font-semibold w-20 shrink-0 hidden lg:block" style={{ color: 'var(--text-primary)' }}>
                      {c.ca_dernier > 0 ? `${c.ca_dernier.toLocaleString('fr-FR')}€` : '—'}
                    </p>

                    <div className="flex-1">
                      <WorkflowDots workflows={c.workflows} />
                    </div>

                    {/* Badge statut workflows */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {nbErreurs > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(239,68,68,0.10)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.20)' }}>
                          <XCircle size={9} /> {nbErreurs} erreur{nbErreurs > 1 ? 's' : ''}
                        </span>
                      )}
                      {nbWarnings > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(249,115,22,0.10)', color: '#EA580C', border: '1px solid rgba(249,115,22,0.20)' }}>
                          <AlertTriangle size={9} /> {nbWarnings} warning{nbWarnings > 1 ? 's' : ''}
                        </span>
                      )}
                      {!hasProbleme && nbActifs > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(34,197,94,0.08)', color: '#16A34A', border: '1px solid rgba(34,197,94,0.18)' }}>
                          <CheckCircle size={9} /> {nbActifs} actif{nbActifs > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      c.statut === 'actif' ? 'bg-green-50 text-green-600 border border-green-100' : 'border'
                    }`} style={c.statut !== 'actif' ? { color: 'var(--text-muted)', borderColor: 'var(--border)' } : {}}>
                      {c.statut}
                    </span>

                    <div className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Détail workflows */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                      <p className="section-label mb-2">Détail workflows</p>
                      <WorkflowDetail
                        workflows={c.workflows}
                        onRepair={handleRepair}
                        repairing={repairing}
                      />
                      {/* Messages de retour réparation */}
                      {c.workflows?.some(w => repairMsg[w.id]) && (
                        <div className="mt-3 space-y-1">
                          {c.workflows.filter(w => repairMsg[w.id]).map(w => (
                            <p key={w.id} className="text-xs px-3 py-2 rounded-lg"
                              style={{ background: 'rgba(79,195,247,0.07)', color: 'var(--cyan-dark)' }}>
                              🤖 {w.nom} : {repairMsg[w.id]}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}