'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, FileText, Zap, AlertCircle, ArrowUpRight, ShoppingBag, Package } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass px-3 py-2 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
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
      try { const r = await fetch(url); return r.ok ? await r.json().then(d => Array.isArray(d) ? d : []) : [] } catch { return [] }
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
  const leadsCeMois    = leads.filter(l => l.date?.startsWith(moisActuel)).length
  const impayees       = factures.filter(f => f.statut !== 'payée')
  const montantDu      = impayees.reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const ventesCeMois   = ventes.filter(v => v.date_vente?.startsWith(moisActuel))
  const caVentesCeMois = ventesCeMois.reduce((s, v) => s + (v.total || 0), 0)
  const nbVentesCeMois = ventesCeMois.length

  const bestSellers = [...produits].sort((a, b) => {
    const va = ventes.filter(v => v.produit_id === a.id).reduce((s, v) => s + v.quantite, 0)
    const vb = ventes.filter(v => v.produit_id === b.id).reduce((s, v) => s + v.quantite, 0)
    return vb - va
  }).slice(0, 3)

  const caChartData = caData.map(m => {
    const ventesMonth = ventes.filter(v => v.date_vente?.slice(0, 7) === m.mois?.slice(0, 7)).reduce((s, v) => s + (v.total || 0), 0)
    return { ...m, ventes: Math.round(ventesMonth) }
  })

  const joursNoms = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
  const leadsParJour = joursNoms.map(jour => ({ jour, leads: 0 }))
  leads.forEach(l => {
    if (!l.date) return
    const d = new Date(l.date)
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 6) leadsParJour[d.getDay()].leads++
  })
  const leadsData = [...leadsParJour.slice(1), leadsParJour[0]]

  const kpis = [
    { label: 'CA ce mois',        value: dernierMois ? `${(dernierMois.ca_ht || 0).toLocaleString('fr-FR')}€` : '—', sub: diffCA !== null ? `${diffCA >= 0 ? '+' : ''}${diffCA}% vs mois dernier` : 'Pas de données', trend: diffCA === null ? 'warn' : diffCA >= 0 ? 'up' : 'down', icon: TrendingUp },
    { label: 'Ventes ce mois',    value: `${caVentesCeMois.toLocaleString('fr-FR')}€`, sub: `${nbVentesCeMois} vente${nbVentesCeMois > 1 ? 's' : ''} · ${produits.length} produits`, trend: nbVentesCeMois > 0 ? 'up' : 'warn', icon: ShoppingBag },
    { label: 'Leads ce mois',     value: String(leadsCeMois), sub: `${leads.length} leads au total`, trend: 'up', icon: Users },
    { label: 'Factures impayées', value: String(impayees.length), sub: impayees.length > 0 ? `${montantDu.toLocaleString('fr-FR')}€ en attente` : 'Tout est à jour ✓', trend: impayees.length > 0 ? 'warn' : 'up', icon: FileText },
  ]

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-96">
      <div className="flex items-center gap-3 text-white/30">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        Chargement...
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-xl md:text-2xl font-bold text-white mb-1">Bonjour {nom} 👋</h1>
        <p className="text-white/40 text-xs md:text-sm">Voici votre tableau de bord — données en temps réel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="card-glass p-4 md:p-5">
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <p className="text-white/40 text-xs font-medium leading-tight">{k.label}</p>
              <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center shrink-0 ${k.trend === 'up' ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                <k.icon size={12} className={k.trend === 'up' ? 'text-green-400' : 'text-orange-400'} />
              </div>
            </div>
            <p className="font-display text-xl md:text-2xl font-bold text-white mb-1">{k.value}</p>
            <p className={`text-xs flex items-center gap-1 ${k.trend === 'up' ? 'text-green-400' : 'text-orange-400'}`}>
              {k.trend === 'up' ? <TrendingUp size={10} /> : <AlertCircle size={10} />}
              <span className="truncate">{k.sub}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="lg:col-span-2 card-glass p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="font-display font-semibold text-white text-sm">Évolution CA & Ventes</h2>
              <p className="text-white/30 text-xs">{caData.length} mois de données</p>
            </div>
            <a href="/dashboard/client/finances" className="text-xs text-blue-400 flex items-center gap-1">
              Détail <ArrowUpRight size={12} />
            </a>
          </div>
          {caData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-white/20 text-xs text-center px-4">
              Aucune donnée CA — ajoutez des mois dans Finances
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={caChartData}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="chargesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ventesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mois" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ca_ht"   stroke="#3B82F6" strokeWidth={2} fill="url(#caGrad)" />
                <Area type="monotone" dataKey="charges" stroke="#6366f1" strokeWidth={2} fill="url(#chargesGrad)" />
                <Area type="monotone" dataKey="ventes"  stroke="#10b981" strokeWidth={2} fill="url(#ventesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-glass p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="font-display font-semibold text-white text-sm">Leads / jour</h2>
              <p className="text-white/30 text-xs">Cette semaine</p>
            </div>
            <a href="/dashboard/client/leads" className="text-xs text-blue-400 flex items-center gap-1">
              CRM <ArrowUpRight size={12} />
            </a>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leadsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="jour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best-sellers + Workflows */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="card-glass p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="font-display font-semibold text-white text-sm">🏆 Best-sellers</h2>
            <a href="/dashboard/client/produits" className="text-xs text-blue-400 flex items-center gap-1">Produits <ArrowUpRight size={12} /></a>
          </div>
          {bestSellers.length === 0 ? (
            <div className="text-center py-6">
              <Package size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/20 text-xs">Aucun produit</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p, i) => {
                const qty = ventes.filter(v => v.produit_id === p.id).reduce((s, v) => s + v.quantite, 0)
                const ca  = ventes.filter(v => v.produit_id === p.id).reduce((s, v) => s + (v.total || 0), 0)
                const medals = ['🥇','🥈','🥉']
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <span className="text-base md:text-lg shrink-0">{medals[i]}</span>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{p.nom}</p>
                        <p className="text-white/30 text-xs">{qty} ventes · {p.taux_marge}%</p>
                      </div>
                    </div>
                    <span className="text-green-400 text-xs font-semibold shrink-0">{ca.toLocaleString('fr-FR')}€</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card-glass p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="font-display font-semibold text-white text-sm">Statut workflows</h2>
            <a href="/dashboard/client/workflows" className="text-xs text-blue-400 flex items-center gap-1">Gérer <ArrowUpRight size={12} /></a>
          </div>
          {workflows.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-6">Aucun workflow configuré</p>
          ) : (
            <div className="space-y-2">
              {workflows.slice(0, 5).map((w) => (
                <div key={w.id || w.nom} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${w.statut === 'ok' ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
                    <span className="text-white/70 text-xs md:text-sm truncate">{w.nom}</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-xs text-white/30 shrink-0">
                    <span className="hidden md:block">{w.nb_executions_mois || 0} exec.</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${w.statut === 'ok' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {w.statut === 'ok' ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
