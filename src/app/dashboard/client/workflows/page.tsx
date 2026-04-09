'use client'
import PlanGate from '@/components/dashboard/PlanGate'
import { useState, useEffect } from 'react'
import { Target, Plus, Trash2, TrendingUp, Users, FileText, Percent, RefreshCw, X, Check, ShoppingBag, BarChart2 } from 'lucide-react'

interface Objectif {
  id: string
  type: string
  label: string
  cible: number
  periode: string
  actif: boolean
}

interface Reels {
  caMois: number
  chargesMois: number
  margeMois: number
  leadsMois: number
  leadsTotal: number
  tauxConversion: number
  montantDu: number
  nbFacturesMois: number
  caVentesMois: number
  nbVentesMois: number
  margeMoyenne: number
}

const typesObjectif = [
  { value: 'ca',         label: 'CA mensuel',          icon: TrendingUp, unit: '€', placeholder: '2000' },
  { value: 'ventes',     label: 'Ventes (€)',           icon: ShoppingBag,unit: '€', placeholder: '1500' },
  { value: 'leads',      label: 'Leads par mois',       icon: Users,      unit: '',  placeholder: '20' },
  { value: 'conversion', label: 'Taux de conversion',   icon: Percent,    unit: '%', placeholder: '15' },
  { value: 'factures',   label: 'Factures émises',      icon: FileText,   unit: '',  placeholder: '10' },
  { value: 'marge',      label: 'Marge mensuelle',      icon: BarChart2,  unit: '€', placeholder: '1000' },
  { value: 'custom',     label: 'Personnalisé',         icon: Target,     unit: '',  placeholder: '100' },
]

const emptyForm = { type: 'ca', label: '', cible: '', periode: 'mensuel' }

export default function ObjectifsPage() {
  const [data,     setData]     = useState<{ objectifs: Objectif[], reels: Reels } | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(emptyForm)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/objectifs')
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    if (!form.cible) return
    setSaving(true)
    const typeInfo = typesObjectif.find(t => t.value === form.type)
    await fetch('/api/objectifs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, label: form.label || typeInfo?.label || form.type })
    })
    setForm(emptyForm); setShowForm(false); setSaving(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/objectifs?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const getProgression = (obj: Objectif, reels: Reels): { actuel: number, unite: string } => {
    switch (obj.type) {
      case 'ca':         return { actuel: reels.caMois,        unite: '€' }
      case 'ventes':     return { actuel: reels.caVentesMois,  unite: '€' }
      case 'leads':      return { actuel: reels.leadsMois,     unite: '' }
      case 'conversion': return { actuel: reels.tauxConversion,unite: '%' }
      case 'factures':   return { actuel: reels.nbFacturesMois,unite: '' }
      case 'marge':      return { actuel: reels.margeMois,     unite: '€' }
      default:           return { actuel: 0,                   unite: '' }
    }
  }

  const getPct    = (actuel: number, cible: number) => cible > 0 ? Math.min(Math.round(actuel / cible * 100), 100) : 0
  const getStatus = (pct: number) => {
    if (pct >= 100) return { color: 'text-green-400', bg: 'bg-green-400',  label: '✓ Atteint' }
    if (pct >= 70)  return { color: 'text-blue-400',  bg: 'bg-blue-400',   label: 'En bonne voie' }
    if (pct >= 40)  return { color: 'text-orange-400',bg: 'bg-orange-400', label: 'À surveiller' }
    return             { color: 'text-red-400',   bg: 'bg-red-400',    label: 'En retard' }
  }

  return (
    <PlanGate feature="workflows">
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-white mb-1">Objectifs & KPIs</h1>
          <p className="text-white/40 text-sm">Fixe des cibles et suis ta progression en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="btn-ghost text-sm py-2.5 px-4">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2.5 px-4">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* Stats réelles */}
      {data?.reels && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 md:mb-6">
          {[
            { label: 'CA ce mois',      value: `${data.reels.caMois.toLocaleString('fr-FR')}€`,        icon: TrendingUp,  color: 'text-blue-400' },
            { label: 'Ventes ce mois',  value: `${data.reels.caVentesMois.toLocaleString('fr-FR')}€`,  icon: ShoppingBag, color: 'text-green-400' },
            { label: 'Marge ce mois',   value: `${data.reels.margeMois.toLocaleString('fr-FR')}€`,     icon: BarChart2,   color: 'text-purple-400' },
            { label: 'Leads ce mois',   value: String(data.reels.leadsMois),                            icon: Users,       color: 'text-indigo-400' },
            { label: 'Taux conversion', value: `${data.reels.tauxConversion}%`,                        icon: Percent,     color: 'text-cyan-400' },
            { label: 'Impayées',        value: `${data.reels.montantDu.toLocaleString('fr-FR')}€`,     icon: FileText,    color: 'text-orange-400' },
          ].map(k => (
            <div key={k.label} className="card-glass p-4 flex items-center gap-3">
              <k.icon size={15} className={k.color} />
              <div>
                <p className="text-white/40 text-xs">{k.label}</p>
                <p className="text-white font-bold text-sm">{k.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="card-glass p-5 mb-5 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white text-sm">Nouvel objectif</h3>
            <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Type</label>
              <div className="flex flex-wrap gap-2">
                {typesObjectif.map(t => (
                  <button key={t.value} onClick={() => setForm({...form, type: t.value})}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.type === t.value ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
                    }`}>
                    <t.icon size={11} /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Label</label>
                <input value={form.label} onChange={e => setForm({...form, label: e.target.value})}
                  placeholder={typesObjectif.find(t => t.value === form.type)?.label}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">
                  Cible ({typesObjectif.find(t => t.value === form.type)?.unit || ''})
                </label>
                <input type="number" value={form.cible} onChange={e => setForm({...form, cible: e.target.value})}
                  placeholder={typesObjectif.find(t => t.value === form.type)?.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Période</label>
              <div className="flex gap-2">
                {['hebdo','mensuel','annuel'].map(p => (
                  <button key={p} onClick={() => setForm({...form, periode: p})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                      form.periode === p ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50'
                    }`}>{p}</button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving || !form.cible} className="btn-primary disabled:opacity-40">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Créer l'objectif</>}
            </button>
          </div>
        </div>
      )}

      {/* Liste objectifs */}
      {loading ? (
        <div className="card-glass p-12 text-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/30 text-sm">Chargement...</p>
        </div>
      ) : !data?.objectifs?.length ? (
        <div className="card-glass p-10 text-center">
          <Target size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm mb-1">Aucun objectif défini</p>
          <p className="text-white/20 text-xs">Ajoute ton premier objectif pour suivre ta progression</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.objectifs.map(obj => {
            const typeInfo = typesObjectif.find(t => t.value === obj.type) || typesObjectif[0]
            const prog     = getProgression(obj, data.reels)
            const pct      = getPct(prog.actuel, obj.cible)
            const status   = getStatus(pct)
            return (
              <div key={obj.id} className="card-glass p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <typeInfo.icon size={14} className="text-white/50" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{obj.label}</p>
                      <p className="text-white/30 text-xs capitalize">{obj.periode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    <button onClick={() => handleDelete(obj.id)} className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${status.bg} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">{prog.actuel.toLocaleString('fr-FR')}{prog.unite} atteint</span>
                  <span className="text-white/60 font-medium">{pct}% — cible : {obj.cible.toLocaleString('fr-FR')}{typeInfo.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </PlanGate>
  )
}