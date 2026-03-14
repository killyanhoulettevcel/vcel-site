'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, FileText, AlertCircle, ArrowUpRight, ShoppingBag, Package, Zap, BarChart2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs shadow-lg-navy">
      <p className="text-[var(--text-muted)] mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name === 'ca_ht' ? 'CA' : p.name === 'charges' ? 'Charges' : p.name === 'ventes' ? 'Ventes' : p.name} : {p.value}{p.name !== 'leads' ? '€' : ''}
        </p>
      ))}
    </div>
  )
}

export default function ClientDashboard() {
  const { data: session } = useSession()
  const nom = session?.user?.name?.split(' ')[0] || 'vous'

  const [caData,    setCaData]    = useState<any[]>([])
  const [leads,     setLeads]     = useState<any[]>([])
  const [factures,  setFactures]  = useState<any[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [produits,  setProduits]  = useState<any[]>([])
  const [ventes,    setVentes]    = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const safeFetch = async (url: string) => {
      try { const r = await fetch(url); return r.ok ? await r.json().then((d: any) => Array.isArray(d) ? d : []) : [] } catch { return [] }
    }
    Promise.all([
      safeFetch('/api/ca'), safeFetch('/api/leads'), safeFetch('/api/factures'),
      safeFetch('/api/workflows'), safeFetch('/api/produits'), safeFetch('/api/ventes'),
    ]).then(([ca, ld, fa, wf, pr, ve]) => {
      setCaData(ca); setLeads(ld); setFactures(fa)
      setWorkflows(wf); setProduits(pr); setVentes(ve)
      setLoading(false)
    })
  }, [])

  const dernierMois  = caData[caData.length - 1]
  const avantDernier = caData[caData.length - 2]
  const diffCA = dernierMois && avantDernier && avantDernier.ca_ht > 0
    ? Math.round((dernierMois.ca_ht - avantDernier.ca_ht) / avantDernier.ca_ht * 100) : null

  const now        = new Date()
  const moisActuel = now.toISOString().slice(0, 7)
  const impayees       = factures.filter((f: any) => f.statut !== 'payée')
  const montantDu      = impayees.reduce((s: number, f: any) => s + (f.montant_ttc || 0), 0)
  const leadsCeMois    = leads.filter((l: any) => l.date?.startsWith(moisActuel)).length
  const ventesCeMois   = ventes.filter((v: any) => v.date_vente?.startsWith(moisActuel))
  const caVentesCeMois = ventesCeMois.reduce((s: number, v: any) => s + (v.total || 0), 0)
  const nbVentesCeMois = ventesCeMois.length

  const bestSellers = [...produits].sort((a: any, b: any) => {
    const va = ventes.filter((v: any) => v.produit_id === a.id).reduce((s: number, v: any) => s + v.quantite, 0)
    const vb = ventes.filter((v: any) => v.produit_id === b.id).reduce((s: number, v: any) => s + v.quantite, 0)
    return vb - va
  }).slice(0, 3)

  const caChartData = caData.map((m: any) => {
    const ventesMonth = ventes.filter((v: any) => v.date_vente?.slice(0, 7) === m.mois?.slice(0, 7)).reduce((s: number, v: any) => s + (v.total || 0), 0)
    return { ...m, ventes: Math.round(ventesMonth) }
  })

  const joursNoms = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
  const leadsParJour = joursNoms.map(jour => ({ jour, leads: 0 }))
  leads.forEach((l: any) => {
    if (!l.date) return
    const d = new Date(l.date)
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 6) leadsParJour[d.getDay()].leads++
  })
  const leadsData = [...leadsParJour.slice(1), leadsParJour[0]]

  const kpis = [
    {
      label: 'CA ce mois',
      value: dernierMois ? `${(dernierMois.ca_ht || 0).toLocaleString('fr-FR')}€` : '—',
      sub: diffCA !== null ? `${diffCA >= 0 ? '+' : ''}${diffCA}% vs mois dernier` : 'Aucune donnée',
      trend: diffCA === null ? 'neutral' : diffCA >= 0 ? 'up' : 'down',
      icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100',
    },
    {
      label: 'Ventes ce mois',
      value: `${caVentesCeMois.toLocaleString('fr-FR')}€`,
      sub: `${nbVentesCeMois} vente${nbVentesCeMois > 1 ? 's' : ''} · ${produits.length} produits`,
      trend: nbVentesCeMois > 0 ? 'up' : 'neutral',
      icon: ShoppingBag, color: 'text-navy-700', bg: 'bg-navy-50 border-navy-100',
    },
    {
      label: 'Leads ce mois',
      value: String(leadsCeMois),
      sub: `${leads.length} leads au total`,
      trend: 'up',
      icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Factures impayées',
      value: String(impayees.length),
      sub: impayees.length > 0 ? `${montantDu.toLocaleString('fr-FR')}€ en attente` : 'Tout est à jour ✓',
      trend: impayees.length > 0 ? 'warn' : 'up',
      icon: FileText, color: impayees.length > 0 ? 'text-orange-500' : 'text-emerald-600',
      bg: impayees.length > 0 ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100',
    },
  ]

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-96">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="w-5 h-5 border-2 border-[var(--border-hover)] border-t-navy-700 rounded-full animate-spin" />
        Chargement...
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-2xl md:text-3xl text-[var(--navy)] mb-1">
          Bonjour {nom} 👋
        </h1>
        <p className="text-[var(--text-muted)] text-sm">Tableau de bord — données en temps réel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[var(--text-muted)] text-xs font-medium">{k.label}</p>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${k.bg}`}>
                <k.icon size={14} className={k.color} />
              </div>
            </div>
            <p className="font-display text-2xl text-[var(--navy)] mb-1">{k.value}</p>
            <p className={`text-xs flex items-center gap-1 ${
              k.trend === 'up' ? 'text-emerald-600' :
              k.trend === 'warn' ? 'text-orange-500' : 'text-[var(--text-muted)]'
            }`}>
              {k.trend === 'up' ? <TrendingUp size={10} /> : k.trend === 'down' ? <TrendingDown size={10} /> : <AlertCircle size={10} />}
              <span className="truncate">{k.sub}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="lg:col-span-2 card-glass p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-[var(--navy)] text-sm">Évolution CA & Ventes</h2>
              <p className="text-[var(--text-muted)] text-xs">{caData.length} mois de données</p>
            </div>
            <a href="/dashboard/client/finances" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium">
              Détail <ArrowUpRight size={12} />
            </a>
          </div>
          {caData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-[var(--text-light)] text-sm">
              Aucune donnée — ajoutez des mois dans Finances
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={caChartData}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D1B2A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0D1B2A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ventesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="chargesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E65100" stopOpacity={0.10} />
                    <stop offset="95%" stopColor="#E65100" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mois" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ca_ht"   stroke="#0D1B2A" strokeWidth={2} fill="url(#caGrad)" />
                <Area type="monotone" dataKey="ventes"  stroke="#0288D1" strokeWidth={2} fill="url(#ventesGrad)" />
                <Area type="monotone" dataKey="charges" stroke="#E65100" strokeWidth={1.5} fill="url(#chargesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-glass p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-[var(--navy)] text-sm">Leads / jour</h2>
              <p className="text-[var(--text-muted)] text-xs">Cette semaine</p>
            </div>
            <a href="/dashboard/client/leads" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium">
              CRM <ArrowUpRight size={12} />
            </a>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leadsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="jour" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" fill="#0D1B2A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best-sellers + Workflows */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="card-glass p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--navy)] text-sm">🏆 Best-sellers</h2>
            <a href="/dashboard/client/produits" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium">
              Produits <ArrowUpRight size={12} />
            </a>
          </div>
          {bestSellers.length === 0 ? (
            <div className="text-center py-6">
              <Package size={24} className="text-[var(--text-light)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)] text-xs">Aucun produit</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p: any, i: number) => {
                const qty = ventes.filter((v: any) => v.produit_id === p.id).reduce((s: number, v: any) => s + v.quantite, 0)
                const ca  = ventes.filter((v: any) => v.produit_id === p.id).reduce((s: number, v: any) => s + (v.total || 0), 0)
                const medals = ['🥇','🥈','🥉']
                return (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{medals[i]}</span>
                      <div className="min-w-0">
                        <p className="text-[var(--text-primary)] text-xs font-semibold truncate">{p.nom}</p>
                        <p className="text-[var(--text-muted)] text-xs">{qty} ventes · {p.taux_marge}% marge</p>
                      </div>
                    </div>
                    <span className="text-emerald-600 text-xs font-bold shrink-0">{ca.toLocaleString('fr-FR')}€</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card-glass p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--navy)] text-sm">Workflows</h2>
            <a href="/dashboard/client/workflows" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium">
              Gérer <ArrowUpRight size={12} />
            </a>
          </div>
          {workflows.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm text-center py-6">Aucun workflow configuré</p>
          ) : (
            <div className="space-y-2">
              {workflows.slice(0, 5).map((w: any) => (
                <div key={w.id || w.nom} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${w.statut === 'ok' ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                    <span className="text-[var(--text-secondary)] text-xs font-medium truncate">{w.nom}</span>
                  </div>
                  <span className={`badge text-xs ${w.statut === 'ok' ? 'badge-green' : 'badge-red'}`}>
                    {w.statut === 'ok' ? '✓ Actif' : '✗ Erreur'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
