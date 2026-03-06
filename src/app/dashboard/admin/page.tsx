'use client'
import { useEffect, useState } from 'react'
import { Users, TrendingUp, Zap, Euro, Crown, RefreshCw, ExternalLink } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
}

const colorMap: Record<string, string> = {
  blue:   'bg-blue-500/10 text-blue-400',
  green:  'bg-green-500/10 text-green-400',
  purple: 'bg-purple-500/10 text-purple-400',
  orange: 'bg-orange-500/10 text-orange-400',
}

export default function AdminDashboard() {
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

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

  // ── KPIs calculés ──────────────────────────────────────────────────────────
  const actifs     = clients.filter(c => c.statut === 'actif').length
  const mrr        = actifs * 49
  const totalLeads = clients.reduce((s, c) => s + (c.leads || 0), 0)
  const totalWf    = clients.reduce((s, c) => s + (c.workflows_actifs || 0), 0)

  // MRR simulé sur 6 mois (basé sur nb clients actifs)
  const mrrData = clients.length > 0 ? [
    { mois: 'Oct', mrr: Math.max(0, actifs - 5) * 49 },
    { mois: 'Nov', mrr: Math.max(0, actifs - 4) * 49 },
    { mois: 'Déc', mrr: Math.max(0, actifs - 3) * 49 },
    { mois: 'Jan', mrr: Math.max(0, actifs - 2) * 49 },
    { mois: 'Fév', mrr: Math.max(0, actifs - 1) * 49 },
    { mois: 'Mar', mrr: actifs * 49 },
  ] : []

  const kpis = [
    { label: 'Clients actifs',   value: String(actifs),        sub: `${clients.length} total`,         icon: Users,       color: 'blue' },
    { label: 'MRR',              value: `${mrr}€`,             sub: `${actifs} × 49€/mois`,            icon: Euro,        color: 'green' },
    { label: 'Leads générés',    value: String(totalLeads),    sub: 'tous clients confondus',           icon: TrendingUp,  color: 'purple' },
    { label: 'Workflows actifs', value: `${totalWf}`,          sub: `sur ${clients.length * 8} total`,  icon: Zap,         color: 'orange' },
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
            <p className="text-white/30 text-xs">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* MRR Chart */}
      {mrrData.length > 0 && (
        <div className="card-glass p-6 mb-6">
          <div className="mb-6">
            <h2 className="font-display font-semibold text-white text-sm">MRR (Monthly Recurring Revenue)</h2>
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
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            Chargement...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucun client — ils arrivent après paiement Stripe</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Client', 'Secteur', 'CA dernier mois', 'Leads', 'Workflows', 'Statut', 'Depuis'].map(h => (
                    <th key={h} className="text-left text-xs text-white/30 font-medium pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                          {(c.nom || c.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">{c.nom || '—'}</p>
                          <p className="text-white/30 text-xs">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-white/50 text-xs">{c.secteur}</td>
                    <td className="py-3 pr-4 text-white font-semibold text-xs">
                      {c.ca_dernier > 0 ? `${c.ca_dernier.toLocaleString('fr-FR')}€` : '—'}
                    </td>
                    <td className="py-3 pr-4 text-white/70 text-xs">{c.leads}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="text-white/50 text-xs">{c.workflows_actifs}/8</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.statut === 'actif' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'
                      }`}>
                        {c.statut}
                      </span>
                    </td>
                    <td className="py-3 text-white/30 text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
