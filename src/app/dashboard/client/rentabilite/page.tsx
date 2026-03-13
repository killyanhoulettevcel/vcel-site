'use client'
import { useState, useEffect } from 'react'
import { Clock, Euro, TrendingUp, Zap, Calculator, Info, Package, ShoppingBag, BarChart2, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Workflow {
  nom: string
  heures_semaine: number
  actif: boolean
}

const workflowsDefaut: Workflow[] = [
  { nom: 'Devis / Factures automatiques',  heures_semaine: 3,   actif: true },
  { nom: 'Leads Forms → CRM',              heures_semaine: 2,   actif: true },
  { nom: 'Reporting CA hebdo',             heures_semaine: 1.5, actif: true },
  { nom: 'Posts Réseaux sociaux auto',     heures_semaine: 2.5, actif: true },
  { nom: 'OCR Factures fournisseurs',      heures_semaine: 1.5, actif: true },
  { nom: 'Relance leads automatique',      heures_semaine: 1,   actif: true },
  { nom: 'Résumé hebdomadaire IA',         heures_semaine: 0.5, actif: true },
  { nom: 'Onboarding clients Stripe',      heures_semaine: 1,   actif: true },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass px-3 py-2 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'taux_marge' ? 'Marge' : p.name === 'ca' ? 'CA ventes' : p.name} : {p.value}{p.name === 'taux_marge' ? '%' : '€'}
        </p>
      ))}
    </div>
  )
}

export default function RentabilitePage() {
  const [tauxHoraire, setTauxHoraire] = useState(50)
  const [workflows,   setWorkflows]   = useState<Workflow[]>(workflowsDefaut)
  const [abonnement,  setAbonnement]  = useState(49)
  const [produits,    setProduits]    = useState<any[]>([])
  const [ventes,      setVentes]      = useState<any[]>([])
  const [caData,      setCaData]      = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<'workflows' | 'produits' | 'mois'>('workflows')

  useEffect(() => {
    const safe = async (url: string) => {
      try { const r = await fetch(url); return r.ok ? await r.json() : [] } catch { return [] }
    }
    const fetchAll = async () => {
      const [ca, pr, ve] = await Promise.all([safe('/api/ca'), safe('/api/produits'), safe('/api/ventes')])
      const caArr = Array.isArray(ca) ? ca : []
      setCaData(caArr)
      setProduits(Array.isArray(pr) ? pr : [])
      setVentes(Array.isArray(ve) ? ve : [])
      if (caArr.length > 0) {
        const caMoyen = caArr.reduce((s: number, d: any) => s + (d.ca_ht || 0), 0) / caArr.length
        if (caMoyen > 0) setTauxHoraire(Math.round(caMoyen / 160))
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  const toggleWorkflow = (i: number) =>
    setWorkflows(prev => prev.map((w, idx) => idx === i ? { ...w, actif: !w.actif } : w))
  const updateHeures = (i: number, val: number) =>
    setWorkflows(prev => prev.map((w, idx) => idx === i ? { ...w, heures_semaine: val } : w))

  // ── Calculs workflows ────────────────────────────────────────────────────────
  const wfActifs     = workflows.filter(w => w.actif)
  const heuresSemaine = wfActifs.reduce((s, w) => s + w.heures_semaine, 0)
  const heuresMois   = heuresSemaine * 4.33
  const heuresAn     = heuresMois * 12
  const valeurMois   = Math.round(heuresMois * tauxHoraire)
  const valeurAn     = Math.round(heuresAn * tauxHoraire)
  const roi          = abonnement > 0 ? Math.round((valeurMois - abonnement) / abonnement * 100) : 0
  const paybackJours = abonnement > 0 ? Math.round(abonnement / (valeurMois / 30)) : 0
  const multiplicateur = abonnement > 0 ? (valeurMois / abonnement).toFixed(1) : '∞'

  // ── Rentabilité par produit ──────────────────────────────────────────────────
  const produitsRentabilite = produits.map(p => {
    const ventesP = ventes.filter(v => v.produit_id === p.id)
    const qtyTotal = ventesP.reduce((s, v) => s + v.quantite, 0)
    const caTotal  = ventesP.reduce((s, v) => s + (v.total || 0), 0)
    const margeEur = caTotal * (p.taux_marge / 100)
    return { ...p, qtyTotal, caTotal: Math.round(caTotal), margeEur: Math.round(margeEur) }
  }).sort((a, b) => b.margeEur - a.margeEur)

  // ── Rentabilité par mois ─────────────────────────────────────────────────────
  const parMois = caData.map(m => {
    const ventesM = ventes.filter(v => v.date_vente?.slice(0, 7) === m.mois?.slice(0, 7))
    const caVentes = ventesM.reduce((s, v) => s + (v.total || 0), 0)
    const marge    = (m.ca_ht || 0) - (m.charges || 0)
    return {
      mois:      m.mois,
      ca_ht:     m.ca_ht || 0,
      charges:   m.charges || 0,
      marge:     Math.round(marge),
      ca_ventes: Math.round(caVentes),
      taux_marge: m.ca_ht > 0 ? Math.round(marge / m.ca_ht * 100) : 0,
    }
  })

  // ── Totaux produits ──────────────────────────────────────────────────────────
  const totalCaVentes  = produitsRentabilite.reduce((s, p) => s + p.caTotal, 0)
  const totalMargeVentes = produitsRentabilite.reduce((s, p) => s + p.margeEur, 0)
  const margeMoyenneProduits = produitsRentabilite.length > 0
    ? Math.round(produitsRentabilite.reduce((s, p) => s + p.taux_marge, 0) / produitsRentabilite.length)
    : 0

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex items-center gap-3 text-white/30">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        Chargement...
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1">Rentabilité</h1>
        <p className="text-white/40 text-sm">Analyse ta rentabilité par workflow, produit et mois</p>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Valeur récupérée/mois', value: `${valeurMois.toLocaleString('fr-FR')}€`,    sub: `${Math.round(heuresMois)}h libérées`, color: 'text-blue-400',   icon: Clock },
          { label: 'CA ventes total',        value: `${totalCaVentes.toLocaleString('fr-FR')}€`, sub: `${ventes.length} ventes`,            color: 'text-green-400',  icon: ShoppingBag },
          { label: 'Marge ventes',           value: `${totalMargeVentes.toLocaleString('fr-FR')}€`, sub: `marge moy. ${margeMoyenneProduits}%`, color: 'text-purple-400', icon: BarChart2 },
          { label: 'ROI abonnement',         value: `x${multiplicateur}`,                        sub: `rentable en ${paybackJours}j/mois`,  color: 'text-orange-400', icon: TrendingUp },
        ].map(k => (
          <div key={k.label} className="card-glass p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-white/40 text-xs">{k.label}</p>
              <k.icon size={13} className={k.color} />
            </div>
            <p className={`font-display text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-white/30 text-xs mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['workflows','⚡ Workflows'], ['produits','📦 Par produit'], ['mois','📅 Par mois']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              tab === id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
            }`}>{label}</button>
        ))}
      </div>

      {/* Tab Workflows */}
      {tab === 'workflows' && (
        <>
          <div className="card-glass p-6 mb-6">
            <h2 className="font-display font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Calculator size={14} className="text-blue-400" /> Paramètres
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">Taux horaire (€/h)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={1} max={300} step={5} value={tauxHoraire}
                    onChange={e => setTauxHoraire(Number(e.target.value))} className="flex-1 accent-blue-500" />
                  <span className="text-white font-bold w-16 text-right">{tauxHoraire}€</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">Abonnement VCEL (€/mois)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={19} max={199} step={10} value={abonnement}
                    onChange={e => setAbonnement(Number(e.target.value))} className="flex-1 accent-blue-500" />
                  <span className="text-white font-bold w-16 text-right">{abonnement}€</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-glass p-5 mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs mb-1">Valeur récupérée cette année</p>
                <p className="font-display text-3xl font-bold text-white">{valeurAn.toLocaleString('fr-FR')}€</p>
                <p className="text-white/30 text-xs mt-1">pour {Math.round(heuresAn)}h libérées · coût : {(abonnement * 12).toLocaleString('fr-FR')}€/an</p>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-xs mb-1">Gain net annuel</p>
                <p className="font-display text-2xl font-bold text-green-400">+{(valeurAn - abonnement * 12).toLocaleString('fr-FR')}€</p>
              </div>
            </div>
          </div>

          <div className="card-glass p-6">
            <h2 className="font-display font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Zap size={14} className="text-blue-400" /> Détail par workflow
              <span className="text-white/20 text-xs font-normal ml-auto flex items-center gap-1">
                <Info size={11} /> Ajuste les heures selon ton usage
              </span>
            </h2>
            <div className="space-y-2">
              {workflows.map((w, i) => (
                <div key={i} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all ${w.actif ? 'bg-white/3' : 'opacity-40'}`}>
                  <button onClick={() => toggleWorkflow(i)}
                    className={`w-4 h-4 rounded border-2 shrink-0 transition-all flex items-center justify-center ${w.actif ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                    {w.actif && <span className="text-white text-xs">✓</span>}
                  </button>
                  <span className="text-white/70 text-xs flex-1">{w.nom}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <input type="number" min={0} max={20} step={0.5} value={w.heures_semaine}
                      onChange={e => updateHeures(i, Number(e.target.value))} disabled={!w.actif}
                      className="w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none" />
                    <span className="text-white/30 text-xs w-12">h/sem</span>
                    <span className="text-green-400 text-xs font-medium w-16 text-right">
                      +{Math.round(w.heures_semaine * 4.33 * tauxHoraire)}€/mois
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 mt-3 pt-3 flex items-center justify-between">
              <span className="text-white/40 text-xs">{wfActifs.length} workflows actifs</span>
              <span className="text-white font-semibold text-sm">Total : <span className="text-green-400">{valeurMois.toLocaleString('fr-FR')}€/mois</span></span>
            </div>
          </div>
        </>
      )}

      {/* Tab Produits */}
      {tab === 'produits' && (
        <div className="card-glass p-6">
          {produitsRentabilite.length === 0 ? (
            <div className="text-center py-12">
              <Package size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm mb-2">Aucun produit</p>
              <a href="/dashboard/client/produits" className="text-blue-400 text-xs flex items-center justify-center gap-1">
                Ajouter des produits <ArrowUpRight size={12} />
              </a>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={produitsRentabilite.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="nom" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="taux_marge" name="taux_marge" radius={[4, 4, 0, 0]}>
                      {produitsRentabilite.slice(0, 8).map((p, i) => (
                        <Cell key={i} fill={p.taux_marge >= 30 ? '#10b981' : p.taux_marge >= 15 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Produit', 'Prix vente', 'Marge %', 'Ventes', 'CA total', 'Marge €'].map(h => (
                      <th key={h} className="text-left text-xs text-white/30 font-medium pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {produitsRentabilite.map(p => (
                    <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                      <td className="py-3 pr-4 text-white text-xs font-medium">{p.nom}</td>
                      <td className="py-3 pr-4 text-white/60 text-xs">{p.prix_vente}€</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${p.taux_marge >= 30 ? 'text-green-400' : p.taux_marge >= 15 ? 'text-orange-400' : 'text-red-400'}`}>
                          {p.taux_marge}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-white/60 text-xs">{p.qtyTotal}</td>
                      <td className="py-3 pr-4 text-white/60 text-xs">{p.caTotal.toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-4 text-green-400 text-xs font-semibold">{p.margeEur.toLocaleString('fr-FR')}€</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td colSpan={4} className="pt-3 text-white/40 text-xs">Total</td>
                    <td className="pt-3 text-white font-semibold text-xs">{totalCaVentes.toLocaleString('fr-FR')}€</td>
                    <td className="pt-3 text-green-400 font-semibold text-xs">{totalMargeVentes.toLocaleString('fr-FR')}€</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      )}

      {/* Tab Mois */}
      {tab === 'mois' && (
        <div className="card-glass p-6">
          {parMois.length === 0 ? (
            <div className="text-center py-12">
              <BarChart2 size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Aucune donnée CA</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={parMois}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="mois" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="marge" name="marge" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ca_ventes" name="ca" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Mois', 'CA HT', 'Charges', 'Marge €', 'Marge %', 'CA Ventes'].map(h => (
                      <th key={h} className="text-left text-xs text-white/30 font-medium pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parMois.map(m => (
                    <tr key={m.mois} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                      <td className="py-3 pr-4 text-white text-xs font-medium">{m.mois}</td>
                      <td className="py-3 pr-4 text-white/60 text-xs">{m.ca_ht.toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-4 text-white/60 text-xs">{m.charges.toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${m.marge >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {m.marge.toLocaleString('fr-FR')}€
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${m.taux_marge >= 30 ? 'text-green-400' : m.taux_marge >= 15 ? 'text-orange-400' : 'text-red-400'}`}>
                          {m.taux_marge}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-blue-400 text-xs">{m.ca_ventes.toLocaleString('fr-FR')}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  )
}
