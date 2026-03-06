'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, FileText, Zap, AlertCircle, ArrowUpRight } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass px-4 py-3 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'ca' ? 'CA' : p.name === 'charges' ? 'Charges' : 'Leads'} : {p.value}{p.name !== 'leads' ? '€' : ''}
        </p>
      ))}
    </div>
  )
}

export default function ClientDashboard() {
  const { data: session } = useSession()
  const nom = session?.user?.name?.split(' ')[0] || 'vous'

  const [caData,      setCaData]      = useState<any[]>([])
  const [leads,       setLeads]       = useState<any[]>([])
  const [factures,    setFactures]    = useState<any[]>([])
  const [workflows,   setWorkflows]   = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const safeFetch = async (url: string) => {
      try {
        const res = await fetch(url)
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data : []
      } catch { return [] }
    }

    const fetchAll = async () => {
      const [ca, ld, fa, wf] = await Promise.all([
        safeFetch('/api/ca'),
        safeFetch('/api/leads'),
        safeFetch('/api/factures'),
        safeFetch('/api/workflows'),
      ])
      setCaData(ca)
      setLeads(ld)
      setFactures(fa)
      setWorkflows(wf)
      setLoading(false)
    }
    fetchAll()
  }, [])

  // ── KPIs calculés ──────────────────────────────────────────────────────────
  const dernierMois  = caData[caData.length - 1]
  const avantDernier = caData[caData.length - 2]
  const diffCA = dernierMois && avantDernier && avantDernier.ca_ht > 0
    ? Math.round((dernierMois.ca_ht - avantDernier.ca_ht) / avantDernier.ca_ht * 100)
    : null

  // Leads ce mois
  const now = new Date()
  const leadscemois = leads.filter(l => {
    if (!l.date) return false
    const d = new Date(l.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // Factures impayées
  const impayees   = factures.filter(f => f.statut !== 'payée')
  const montantDu  = impayees.reduce((s, f) => s + (f.montant_ttc || 0), 0)

  // Workflows
  const wfActifs  = workflows.filter(w => w.actif).length
  const wfErreurs = workflows.filter(w => w.statut === 'erreur').length

  // Leads par jour cette semaine
  const joursNoms = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
  const leadsParJour = joursNoms.map(jour => ({ jour, leads: 0 }))
  leads.forEach(l => {
    if (!l.date) return
    const d = new Date(l.date)
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 6) leadsParJour[d.getDay()].leads++
  })
  // Réordonner Lun → Dim
  const leadsData = [...leadsParJour.slice(1), leadsParJour[0]]

  const kpis = [
    {
      label: 'CA ce mois',
      value: dernierMois ? `${(dernierMois.ca_ht || 0).toLocaleString('fr-FR')}€` : '—',
      sub: diffCA !== null ? `${diffCA >= 0 ? '+' : ''}${diffCA}% vs mois dernier` : 'Pas de données',
      trend: diffCA === null ? 'warn' : diffCA >= 0 ? 'up' : 'down',
      icon: TrendingUp,
    },
    {
      label: 'Leads ce mois',
      value: String(leadscemois),
      sub: `${leads.length} leads au total`,
      trend: 'up',
      icon: Users,
    },
    {
      label: 'Factures impayées',
      value: String(impayees.length),
      sub: impayees.length > 0 ? `${montantDu.toLocaleString('fr-FR')}€ en attente` : 'Tout est à jour ✓',
      trend: impayees.length > 0 ? 'warn' : 'up',
      icon: FileText,
    },
    {
      label: 'Workflows actifs',
      value: `${wfActifs}/8`,
      sub: wfErreurs > 0 ? `${wfErreurs} en erreur` : 'Tous opérationnels ✓',
      trend: wfErreurs > 0 ? 'warn' : 'up',
      icon: Zap,
    },
  ]

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex items-center gap-3 text-white/30">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        Chargement du dashboard...
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1">Bonjour {nom} 👋</h1>
        <p className="text-white/40 text-sm">Voici votre tableau de bord — données en temps réel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="card-glass p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-white/40 text-xs font-medium">{k.label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                k.trend === 'up' ? 'bg-green-500/10' : 'bg-orange-500/10'
              }`}>
                <k.icon size={14} className={k.trend === 'up' ? 'text-green-400' : 'text-orange-400'} />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-white mb-1">{k.value}</p>
            <p className={`text-xs flex items-center gap-1 ${
              k.trend === 'up' ? 'text-green-400' : 'text-orange-400'
            }`}>
              {k.trend === 'up' ? <TrendingUp size={10} /> : <AlertCircle size={10} />}
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-white text-sm">Évolution CA</h2>
              <p className="text-white/30 text-xs">{caData.length} mois de données</p>
            </div>
            <a href="/dashboard/client/finances" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Détail <ArrowUpRight size={12} />
            </a>
          </div>
          {caData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm">
              Aucune donnée CA — ajoutez des mois dans Finances
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={caData}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="chargesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mois" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ca_ht" stroke="#3B82F6" strokeWidth={2} fill="url(#caGrad)" />
                <Area type="monotone" dataKey="charges" stroke="#6366f1" strokeWidth={2} fill="url(#chargesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-white text-sm">Leads / jour</h2>
              <p className="text-white/30 text-xs">Cette semaine</p>
            </div>
            <a href="/dashboard/client/leads" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              CRM <ArrowUpRight size={12} />
            </a>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={leadsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="jour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workflows */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-white text-sm">Statut des workflows</h2>
          <a href="/dashboard/client/workflows" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Gérer <ArrowUpRight size={12} />
          </a>
        </div>
        {workflows.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-6">Aucun workflow configuré</p>
        ) : (
          <div className="space-y-2">
            {workflows.slice(0, 5).map((w) => (
              <div key={w.id || w.nom} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    w.statut === 'ok' ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-red-400 animate-pulse'
                  }`} />
                  <span className="text-white/70 text-sm">{w.nom}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/30">
                  <span>{w.executions || 0} exec.</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    w.statut === 'ok' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {w.statut === 'ok' ? '✓ Actif' : '✗ Erreur'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
