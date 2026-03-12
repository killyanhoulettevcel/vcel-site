'use client'
import { useEffect, useState } from 'react'
import { Users, TrendingUp, Zap, Euro, Crown, RefreshCw, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Workflow {
  id: string
  nom: string
  actif: boolean
  statut: 'ok' | 'erreur' | 'inactif'
  nb_executions_mois: number
  derniere_execution?: string
  erreur_message?: string
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

const colorMap: Record<string, string> = {
  blue:   'bg-blue-500/10 text-blue-400',
  green:  'bg-green-500/10 text-green-400',
  purple: 'bg-purple-500/10 text-purple-400',
  orange: 'bg-orange-500/10 text-orange-400',
}

function WorkflowDots({ workflows }: { workflows?: Workflow[] }) {
  if (!workflows || workflows.length === 0) {
    return <span className="text-white/20 text-xs">—</span>
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {workflows.map(w => (
        <div key={w.id} title={`${w.nom}${w.erreur_message ? ' — ' + w.erreur_message : ''}`}
          className={`w-2 h-2 rounded-full ${
            w.statut === 'ok'     ? 'bg-green-400' :
            w.statut === 'erreur' ? 'bg-red-400 animate-pulse' :
            'bg-white/15'
          }`} />
      ))}
      {workflows.filter(w => w.statut === 'erreur').length > 0 && (
        <AlertTriangle size={11} className="text-red-400 ml-1" />
      )}
    </div>
  )
}

function WorkflowDetail({ workflows }: { workflows?: Workflow[] }) {
  if (!workflows || workflows.length === 0) {
    return <p className="text-white/20 text-xs py-2">Aucun workflow configuré</p>
  }
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {workflows.map(w => (
        <div key={w.id} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
          w.statut === 'erreur' ? 'bg-red-500/8 border-red-500/20' :
          w.statut === 'ok'     ? 'bg-green-500/5 border-green-500/15' :
          'bg-white/3 border-white/8'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${
            w.statut === 'ok'     ? 'bg-green-400' :
            w.statut === 'erreur' ? 'bg-red-400 animate-pulse' :
            'bg-white/20'
          }`} />
          <div className="min-w-0">
            <p className="text-white/70 font-medium truncate">{w.nom}</p>
            {w.erreur_message && (
              <p className="text-red-400 mt-0.5 truncate">{w.erreur_message}</p>
            )}
            {w.derniere_execution && (
              <p className="text-white/25 mt-0.5">
                {new Date(w.derniere_execution).toLocaleDateString('fr-FR')}
              </p>
            )}
            <p className="text-white/20">{w.nb_executions_mois || 0} exec/mois</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [clients, setClients]       = useState<Client[]>([])
  const [loading, setLoading]       = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [expanded, setExpanded]     = useState<string | null>(null)

  const fetchClients = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/clients')
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Admin fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
    const interval = setInterval(fetchClients, 30000)
    return () => clearInterval(interval)
  }, [])

  const actifs     = clients.filter(c => c.statut === 'actif').length
  const mrr        = actifs * 49
  const totalLeads = clients.reduce((s, c) => s + (c.leads || 0), 0)
  const totalWf    = clients.reduce((s, c) => s + (c.workflows?.filter(w => w.statut === 'ok').length || 0), 0)
  const wfEnErreur = clients.reduce((s, c) =>
    s + (c.workflows?.filter(w => w.statut === 'erreur').length || 0), 0)

  const mrrData = clients.length > 0 ? [
    { mois: 'Oct', mrr: Math.max(0, actifs - 5) * 49 },
    { mois: 'Nov', mrr: Math.max(0, actifs - 4) * 49 },
    { mois: 'Déc', mrr: Math.max(0, actifs - 3) * 49 },
    { mois: 'Jan', mrr: Math.max(0, actifs - 2) * 49 },
    { mois: 'Fév', mrr: Math.max(0, actifs - 1) * 49 },
    { mois: 'Mar', mrr: actifs * 49 },
  ] : []

  const kpis = [
    { label: 'Clients actifs',   value: String(actifs),     sub: `${clients.length} total`,         icon: Users,      color: 'blue'   },
    { label: 'MRR',              value: `${mrr}€`,          sub: `${actifs} × 49€/mois`,            icon: Euro,       color: 'green'  },
    { label: 'Leads générés',    value: String(totalLeads), sub: 'tous clients confondus',           icon: TrendingUp, color: 'purple' },
    { label: 'Workflows actifs', value: `${totalWf}`,       sub: `${wfEnErreur} en erreur`,         icon: Zap,        color: wfEnErreur > 0 ? 'orange' : 'blue' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown size={20} className="text-yellow-400" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Vue Admin VCEL</h1>
            <div className="flex items-center gap-3">
              <p className="text-white/40 text-sm">Tous vos clients · {clients.length} comptes</p>
              {lastUpdate && (
                <span className="flex items-center gap-1.5 text-xs text-green-400/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={fetchClients} className="btn-ghost text-sm py-2.5 px-4">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Alerte workflows en erreur */}
      {wfEnErreur > 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm font-medium">
            {wfEnErreur} workflow{wfEnErreur > 1 ? 's' : ''} en erreur chez vos clients — vérifiez les détails ci-dessous
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="card-glass p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-white/40 text-xs font-medium">{k.label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[k.color]}`}>
                <k.icon size={14} />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-white mb-1">{k.value}</p>
            <p className={`text-xs ${k.label === 'Workflows actifs' && wfEnErreur > 0 ? 'text-orange-400' : 'text-white/30'}`}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* MRR Chart */}
      {mrrData.length > 0 && (
        <div className="card-glass p-6 mb-6">
          <div className="mb-6">
            <h2 className="font-display font-semibold text-white text-sm">MRR</h2>
            <p className="text-white/30 text-xs">Basé sur {actifs} clients actifs × 49€</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mois" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip contentStyle={{ background: '#0b1535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} itemStyle={{ color: '#22c55e' }} />
              <Area type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Clients table */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-white text-sm">
            Clients ({clients.length})
          </h2>
          <p className="text-white/25 text-xs">Cliquez sur un client pour voir ses workflows</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            Chargement...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucun client</p>
          </div>
        ) : (
          <div className="space-y-1">
            {clients.map((c) => {
              const isOpen     = expanded === c.id
              const erreurs    = c.workflows?.filter(w => w.statut === 'erreur').length || 0
              const actifCount = c.workflows?.filter(w => w.statut === 'ok').length || 0

              return (
                <div key={c.id} className={`border rounded-xl overflow-hidden transition-all ${
                  erreurs > 0 ? 'border-red-500/20' : 'border-white/5'
                }`}>
                  <div
                    className="flex items-center gap-4 p-4 hover:bg-white/2 cursor-pointer transition-colors"
                    onClick={() => setExpanded(isOpen ? null : c.id)}>

                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                      {(c.nom || c.email).charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 w-40 shrink-0">
                      <p className="text-white text-xs font-medium truncate">{c.nom || '—'}</p>
                      <p className="text-white/30 text-xs truncate">{c.email}</p>
                    </div>

                    <p className="text-white/40 text-xs w-28 shrink-0 hidden md:block">{c.secteur}</p>

                    <p className="text-white text-xs font-semibold w-20 shrink-0 hidden lg:block">
                      {c.ca_dernier > 0 ? `${c.ca_dernier.toLocaleString('fr-FR')}€` : '—'}
                    </p>

                    <div className="flex-1">
                      <WorkflowDots workflows={c.workflows} />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {erreurs > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          <XCircle size={10} /> {erreurs} erreur{erreurs > 1 ? 's' : ''}
                        </span>
                      ) : actifCount > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle size={10} /> {actifCount} actifs
                        </span>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </div>

                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      c.statut === 'actif' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'
                    }`}>{c.statut}</span>

                    <div className="text-white/20 shrink-0">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      <p className="text-white/30 text-xs mb-2 font-medium uppercase tracking-wide">Détail workflows</p>
                      <WorkflowDetail workflows={c.workflows} />
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
