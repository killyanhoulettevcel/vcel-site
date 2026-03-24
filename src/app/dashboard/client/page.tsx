'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, FileText, AlertCircle, ArrowUpRight, ShoppingBag, Package, Zap, ChevronRight, Sparkles, X, Activity, HeartPulse } from 'lucide-react'
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

function OnboardingBanner({ session, onDismiss }: { session: any, onDismiss: () => void }) {
  const [progress, setProgress] = useState<number | null>(null)
  const [nextStep, setNextStep] = useState<{ titre: string; href: string } | null>(null)

  const stepsDef = [
    { id: 'profil',   titre: 'Complétez votre profil',      href: '/dashboard/client/profil' },
    { id: 'ca',       titre: 'Renseignez votre premier CA',  href: '/dashboard/client/finances' },
    { id: 'lead',     titre: 'Ajoutez votre premier lead',   href: '/dashboard/client/leads' },
    { id: 'facture',  titre: 'Créez votre première facture', href: '/dashboard/client/factures' },
    { id: 'workflow', titre: 'Activez vos automatisations',  href: '/dashboard/client/workflows' },
  ]

  useEffect(() => {
    const userId = (session?.user as any)?.id
    if (!userId) return
    const detect = async () => {
      const done = new Set<string>()
      try {
        const profil = await fetch('/api/profil').then(r => r.ok ? r.json() : null)
        if (profil?.nom || profil?.secteur) done.add('profil')
        const ca = await fetch('/api/ca').then(r => r.ok ? r.json() : [])
        if (Array.isArray(ca) && ca.length > 0) done.add('ca')
        const leads = await fetch('/api/leads').then(r => r.ok ? r.json() : [])
        if (Array.isArray(leads) && leads.length > 0) done.add('lead')
        const factures = await fetch('/api/factures').then(r => r.ok ? r.json() : [])
        if (Array.isArray(factures) && factures.length > 0) done.add('facture')
        const wf = await fetch('/api/workflows').then(r => r.ok ? r.json() : [])
        if (Array.isArray(wf) && wf.some((w: any) => w.statut === 'ok')) done.add('workflow')
      } catch {}
      const saved = localStorage.getItem(`onboarding_${userId}`)
      const manual = saved ? new Set<string>(JSON.parse(saved)) : new Set<string>()
      const merged = new Set([...done, ...manual])
      setProgress(Math.round(merged.size / stepsDef.length * 100))
      setNextStep(stepsDef.find(s => !merged.has(s.id)) || null)
    }
    detect()
  }, [session])

  if (progress === null || progress === 100) return null
  const completed = Math.round(progress / 100 * stepsDef.length)

  return (
    <div className="card-glass mb-6 p-4 border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-blue-500/5">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white text-sm font-semibold">Finalisez votre configuration</p>
              <p className="text-white/40 text-xs">{completed}/{stepsDef.length} étapes complétées</p>
            </div>
            <button onClick={onDismiss} className="text-white/20 hover:text-white/50 transition-colors ml-4">
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-1 mb-3">
            {stepsDef.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full ${i < completed ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-white/10'}`} />
            ))}
          </div>
          {nextStep && (
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-xs">
                Prochaine étape : <span className="text-white/70">{nextStep.titre}</span>
              </p>
              <a href={nextStep.href} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Continuer <ChevronRight size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, titre, description, cta, href, color = 'text-[var(--text-light)]' }: {
  icon: React.ElementType; titre: string; description: string; cta: string; href: string; color?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-[var(--border)] flex items-center justify-center mb-3">
        <Icon size={18} className={color} />
      </div>
      <p className="text-[var(--text-secondary)] text-sm font-semibold mb-1">{titre}</p>
      <p className="text-[var(--text-light)] text-xs mb-4 max-w-[160px] leading-relaxed">{description}</p>
      <a href={href} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--navy)] bg-[var(--navy)]/5 border border-[var(--navy)]/10 hover:bg-[var(--navy)]/10 px-3 py-1.5 rounded-lg transition-colors">
        {cta} <ArrowUpRight size={11} />
      </a>
    </div>
  )
}

function MiniScoreWidget({ caData, leads, factures, workflows }: {
  caData: any[], leads: any[], factures: any[], workflows: any[]
}) {
  const moisActuel = new Date().toISOString().slice(0, 7)
  const enRetard = factures.filter((f: any) => f.statut === 'en retard').length
  const enAttente = factures.filter((f: any) => f.statut === 'en attente').length
  const leadsCeMois = leads.filter((l: any) => l.date?.startsWith(moisActuel)).length
  const wfActifs = workflows.filter((w: any) => w.statut === 'ok').length
  const dernierMois = caData[caData.length - 1]
  const avantDernier = caData[caData.length - 2]

  let score = 0
  if (caData.length > 0) score += 15
  if (caData.length >= 3) score += 5
  if (dernierMois && avantDernier && dernierMois.ca_ht > avantDernier.ca_ht) score += 10
  else if (dernierMois?.ca_ht > 0) score += 5
  if (leads.length > 0) score += 10
  if (leadsCeMois >= 3) score += 8
  else if (leadsCeMois >= 1) score += 4
  let factScore = 20 - enRetard * 7 - enAttente * 2
  if (factures.length === 0) factScore = 5
  score += Math.max(0, Math.min(20, factScore))
  score += Math.round((wfActifs / Math.max(workflows.length, 8)) * 15)
  score += 7

  const color = score >= 85 ? 'text-emerald-600' : score >= 65 ? 'text-cyan-600' : score >= 40 ? 'text-orange-500' : 'text-red-500'
  const bgBar = score >= 85 ? 'bg-emerald-400' : score >= 65 ? 'bg-cyan-400' : score >= 40 ? 'bg-orange-400' : 'bg-red-400'
  const label = score >= 85 ? 'Excellent' : score >= 65 ? 'Bon' : score >= 40 ? 'À améliorer' : 'Critique'

  return (
    <div className="card-glass p-5 mb-6 md:mb-8 flex items-center gap-6">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
          <HeartPulse size={18} className={color} />
        </div>
        <div>
          <p className="text-[var(--text-muted)] text-xs font-medium">Score de santé</p>
          <p className={`font-display text-2xl font-bold ${color}`}>{score}<span className="text-[var(--text-muted)] text-sm font-normal">/100</span></p>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden mb-1.5">
          <div className={`h-full rounded-full transition-all duration-700 ${bgBar}`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-[var(--text-muted)] text-xs">{label} — <span className="text-[var(--text-secondary)]">voir le détail complet</span></p>
      </div>
      <a href="/dashboard/client/score" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium shrink-0">
        Détail <ArrowUpRight size={12} />
      </a>
    </div>
  )
}

export default function ClientDashboard() {
  const { data: session } = useSession()
  const nom = session?.user?.name?.split(' ')[0] || 'vous'
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const [caData,    setCaData]    = useState<any[]>([])
  const [leads,     setLeads]     = useState<any[]>([])
  const [factures,  setFactures]  = useState<any[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [produits,  setProduits]  = useState<any[]>([])
  const [ventes,    setVentes]    = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const userId = (session?.user as any)?.id
    if (userId) {
      const dismissed = localStorage.getItem(`banner_dismissed_${userId}`)
      if (dismissed) setBannerDismissed(true)
    }
  }, [session])

  const handleDismiss = () => {
    const userId = (session?.user as any)?.id
    if (userId) localStorage.setItem(`banner_dismissed_${userId}`, '1')
    setBannerDismissed(true)
  }

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
      icon: FileText,
      color: impayees.length > 0 ? 'text-orange-500' : 'text-emerald-600',
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
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-2xl md:text-3xl text-[var(--navy)] mb-1">
          Bonjour {nom} 👋
        </h1>
        <p className="text-[var(--text-muted)] text-sm">Tableau de bord — données en temps réel</p>
      </div>

      {!bannerDismissed && (
        <OnboardingBanner session={session} onDismiss={handleDismiss} />
      )}

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
            <EmptyState icon={Activity} titre="Aucune donnée financière" description="Ajoutez votre CA mensuel pour voir vos graphiques prendre vie en temps réel." cta="Saisir mon premier CA" href="/dashboard/client/finances" color="text-cyan-500" />
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
          {leads.length === 0 ? (
            <EmptyState icon={Users} titre="Aucun lead encore" description="Suivez vos prospects et visualisez leur progression semaine par semaine." cta="Ajouter un lead" href="/dashboard/client/leads" color="text-purple-500" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={leadsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="jour" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="leads" fill="#0D1B2A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <MiniScoreWidget caData={caData} leads={leads} factures={factures} workflows={workflows} />

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="card-glass p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--navy)] text-sm">🏆 Best-sellers</h2>
            <a href="/dashboard/client/produits" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium">
              Produits <ArrowUpRight size={12} />
            </a>
          </div>
          {bestSellers.length === 0 ? (
            <EmptyState icon={Package} titre="Aucun produit enregistré" description="Ajoutez vos produits ou services pour suivre vos ventes et marges en temps réel." cta="Créer un produit" href="/dashboard/client/produits" color="text-emerald-500" />
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
            <h2 className="font-semibold text-[var(--navy)] text-sm">⚡ Workflows</h2>
            <a href="/dashboard/client/workflows" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium">
              Gérer <ArrowUpRight size={12} />
            </a>
          </div>
          {workflows.length === 0 ? (
            <EmptyState icon={Zap} titre="Automatisations non configurées" description="Activez vos 8 workflows préconfigurés : relances, résumé hebdo IA, sync données..." cta="Activer mes workflows" href="/dashboard/client/workflows" color="text-yellow-500" />
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