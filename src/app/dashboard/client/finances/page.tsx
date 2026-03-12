'use client'
import { useState } from 'react'
import { TrendingUp, TrendingDown, Plus, Pencil, Trash2, X, Check, RefreshCw, Download } from 'lucide-react'
import { useRealtimeData } from '@/lib/useRealtimeData'
import { exportCSV } from '@/lib/exportCSV'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface CAData {
  id: string
  mois: string
  date: string
  ca_ht: number
  charges: number
  marge: number
}

const emptyForm = { mois: '', date: '', ca: '', charges: '' }

export default function FinancesPage() {
  const { data: caData, loading, lastUpdate, refresh } = useRealtimeData<CAData>('/api/ca', 'ca_data')

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState<CAData | null>(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)

  // KPIs
  const dernierMois  = caData[caData.length - 1]
  const avantDernier = caData[caData.length - 2]
  const totalCA      = caData.reduce((s, d) => s + (d.ca_ht || 0), 0)
  const totalMarge   = caData.reduce((s, d) => s + (d.marge || 0), 0)
  const tauxMarge    = totalCA > 0 ? Math.round(totalMarge / totalCA * 100) : 0

  const diffCA = dernierMois && avantDernier
    ? Math.round((dernierMois.ca_ht - avantDernier.ca_ht) / avantDernier.ca_ht * 100)
    : null

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit   = (d: CAData) => {
    setEditItem(d)
    setForm({ mois: d.mois, date: d.date, ca: String(d.ca_ht), charges: String(d.charges) })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    if (editItem) {
      await fetch('/api/ca', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
    } else {
      await fetch('/api/ca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setShowModal(false)
    refresh()
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Supprimer cette entrée ?')) return
    await fetch(`/api/ca?id=${id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">CA & Finances</h1>
          <div className="flex items-center gap-3">
            <p className="text-white/40 text-sm">Reporting financier depuis Supabase</p>
            {lastUpdate && (
              <span className="flex items-center gap-1.5 text-xs text-green-400/60">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(caData, 'finances')} className="btn-ghost text-sm py-2.5 px-4" title="Exporter CSV"><Download size={14} /></button>
          <button onClick={refresh} className="btn-ghost text-sm py-2.5 px-4"><RefreshCw size={14} /></button>
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Ajouter un mois</button>
        </div>
      </div>

    

      {/* KPIs */}
      {caData.length === 0 && !loading ? (
        <div className="card-glass p-12 text-center mb-8">
          <p className="text-white/30 text-sm mb-4">Aucune donnée financière</p>
          <button onClick={openCreate} className="btn-primary text-sm">+ Ajouter le premier mois</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card-glass p-5">
              <p className="text-white/40 text-xs font-medium mb-3">CA ce mois</p>
              <p className="font-display text-2xl font-bold text-white mb-1">
                {dernierMois ? `${(dernierMois.ca_ht || 0).toLocaleString('fr-FR')}€` : '—'}
              </p>
              {diffCA !== null && (
                <p className={`text-xs flex items-center gap-1 ${diffCA >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {diffCA >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {diffCA >= 0 ? '+' : ''}{diffCA}% vs mois préc.
                </p>
              )}
            </div>
            <div className="card-glass p-5">
              <p className="text-white/40 text-xs font-medium mb-3">Charges ce mois</p>
              <p className="font-display text-2xl font-bold text-white mb-1">
                {dernierMois ? `${(dernierMois.charges || 0).toLocaleString('fr-FR')}€` : '—'}
              </p>
            </div>
            <div className="card-glass p-5">
              <p className="text-white/40 text-xs font-medium mb-3">CA cumulé</p>
              <p className="font-display text-2xl font-bold text-white mb-1">{totalCA.toLocaleString('fr-FR')}€</p>
            </div>
            <div className="card-glass p-5">
              <p className="text-white/40 text-xs font-medium mb-3">Taux de marge</p>
              <p className="font-display text-2xl font-bold text-green-400 mb-1">{tauxMarge}%</p>
            </div>
          </div>

          {/* Chart */}
          {caData.length > 0 && (
            <div className="card-glass p-6 mb-6">
              <h2 className="font-display font-semibold text-white text-sm mb-6">CA vs Charges vs Marge</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={caData}>
                  <defs>
                    <linearGradient id="caG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="chargesG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="margeG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mois" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
                  <Tooltip contentStyle={{ background: '#0b1535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} />
                  <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="ca_ht" name="CA HT" stroke="#3B82F6" strokeWidth={2} fill="url(#caG)" />
                  <Area type="monotone" dataKey="charges" name="Charges" stroke="#f97316" strokeWidth={2} fill="url(#chargesG)" />
                  <Area type="monotone" dataKey="marge" name="Marge" stroke="#22c55e" strokeWidth={2} fill="url(#margeG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tableau */}
          <div className="card-glass p-6">
            <h2 className="font-display font-semibold text-white text-sm mb-5">Détail mensuel</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Mois', 'CA HT', 'Charges', 'Marge', '% Marge', ''].map(h => (
                      <th key={h} className="text-left text-xs text-white/30 font-medium pb-3 pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...caData].reverse().map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="py-3 pr-6 text-white font-medium text-xs">{r.mois}</td>
                      <td className="py-3 pr-6 text-white text-xs">{(r.ca_ht || 0).toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-6 text-orange-400 text-xs">{(r.charges || 0).toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-6 text-green-400 font-semibold text-xs">{(r.marge || 0).toLocaleString('fr-FR')}€</td>
                      <td className="py-3 pr-6 text-white/50 text-xs">
                        {r.ca_ht > 0 ? Math.round(r.marge / r.ca_ht * 100) : 0}%
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(r)} className="text-white/20 hover:text-blue-400 transition-colors p-1"><Pencil size={13} /></button>
                          <button onClick={() => deleteEntry(r.id)} className="text-white/20 hover:text-red-400 transition-colors p-1"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white">{editItem ? 'Modifier' : 'Ajouter un mois'}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Mois *</label>
                  <input value={form.mois} onChange={e => setForm({...form, mois: e.target.value})}
                    placeholder="Mar 2026"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">CA HT (€) *</label>
                  <input type="number" value={form.ca} onChange={e => setForm({...form, ca: e.target.value})}
                    placeholder="4600"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Charges (€)</label>
                  <input type="number" value={form.charges} onChange={e => setForm({...form, charges: e.target.value})}
                    placeholder="1300"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>
              {form.ca && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-xs text-green-400">
                  Marge calculée : {((parseFloat(form.ca) || 0) - (parseFloat(form.charges) || 0)).toLocaleString('fr-FR')}€
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.mois || !form.ca}
                className="btn-primary flex-1 justify-center disabled:opacity-40">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={15} />{editItem ? 'Modifier' : 'Ajouter'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
