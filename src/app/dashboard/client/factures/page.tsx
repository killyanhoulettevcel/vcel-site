'use client'
import { useState } from 'react'
import { FileText, AlertCircle, CheckCircle, Clock, Plus, Pencil, Trash2, X, Check, RefreshCw, Download, Mail, Loader } from 'lucide-react'
import { useRealtimeData } from '@/lib/useRealtimeData'
import { exportCSV } from '@/lib/exportCSV'

interface Facture {
  id: string
  numero_facture: string
  date_facture: string
  montant_ht: number
  tva: number
  montant_ttc: number
  statut: 'payée' | 'en attente' | 'en retard'
  stripe_invoice_id?: string
  email_client?: string
  nom_client?: string
}

const statutConfig: Record<string, { label: string, color: string, icon: React.ElementType }> = {
  'payée':      { label: 'Payée',      color: 'bg-green-500/10 text-green-400',  icon: CheckCircle },
  'en attente': { label: 'En attente', color: 'bg-blue-500/10 text-blue-400',    icon: Clock },
  'en retard':  { label: 'En retard',  color: 'bg-red-500/10 text-red-400',      icon: AlertCircle },
}

const emptyForm = {
  numero_facture: '', date_facture: '', montant_ht: '', tva: '', montant_ttc: '',
  statut: 'en attente' as const, email_client: '', nom_client: '',
}

export default function FacturesPage() {
  const { data: factures, loading, lastUpdate, refresh } = useRealtimeData<Facture>('/api/factures', 'factures')

  const [filtre,      setFiltre]      = useState('toutes')
  const [showModal,   setShowModal]   = useState(false)
  const [editItem,    setEditItem]    = useState<Facture | null>(null)
  const [form,        setForm]        = useState(emptyForm)
  const [saving,      setSaving]      = useState(false)
  const [relancing,   setRelancing]   = useState<string | null>(null)
  const [relanceOk,   setRelanceOk]   = useState<string | null>(null)
  const [relanceErr,  setRelanceErr]  = useState<string | null>(null)
  const [showRelanceModal, setShowRelanceModal] = useState(false)
  const [relanceFacture,   setRelanceFacture]   = useState<Facture | null>(null)
  const [emailRelance,     setEmailRelance]     = useState('')

  const filtered    = filtre === 'toutes' ? factures : factures.filter(f => f.statut === filtre)
  const totalImpayé = factures.filter(f => f.statut !== 'payée').reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const totalCA     = factures.filter(f => f.statut === 'payée').reduce((s, f) => s + (f.montant_ht || 0), 0)

  const handleHtChange = (val: string) => {
    const ht  = parseFloat(val) || 0
    const tva = ht * 0.2
    setForm(f => ({ ...f, montant_ht: val, tva: tva.toFixed(2), montant_ttc: (ht + tva).toFixed(2) }))
  }

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit   = (f: Facture) => {
    setEditItem(f)
    setForm({
      numero_facture: f.numero_facture, date_facture: f.date_facture,
      montant_ht: String(f.montant_ht), tva: String(f.tva), montant_ttc: String(f.montant_ttc),
      statut: f.statut, email_client: f.email_client || '', nom_client: f.nom_client || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    if (editItem) {
      await fetch('/api/factures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
    } else {
      await fetch('/api/factures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false); setShowModal(false); refresh()
  }

  const deleteFacture = async (id: string) => {
    if (!confirm('Supprimer cette facture ?')) return
    await fetch(`/api/factures?id=${id}`, { method: 'DELETE' })
    refresh()
  }

  const changeStatut = async (id: string, statut: string) => {
    await fetch('/api/factures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }) })
    refresh()
  }

  const openRelance = (f: Facture) => {
    setRelanceFacture(f)
    setEmailRelance(f.email_client || '')
    setRelanceErr(null)
    setShowRelanceModal(true)
  }

  const handleRelance = async () => {
    if (!relanceFacture || !emailRelance) return
    setRelancing(relanceFacture.id)
    setRelanceErr(null)
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'relance_facture',
          to:   emailRelance,
          data: {
            nomClient:     relanceFacture.nom_client || emailRelance,
            numeroFacture: relanceFacture.numero_facture,
            montant:       relanceFacture.montant_ttc,
            dateEcheance:  relanceFacture.date_facture,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur envoi')
      setRelanceOk(relanceFacture.id)
      setShowRelanceModal(false)
      setTimeout(() => setRelanceOk(null), 3000)
    } catch (e: any) {
      setRelanceErr(e.message)
    }
    setRelancing(null)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-white mb-1">Factures</h1>
          <div className="flex items-center gap-3">
            <p className="text-white/40 text-sm">Synchronisé avec Stripe en temps réel</p>
            {lastUpdate && (
              <span className="flex items-center gap-1.5 text-xs text-green-400/60">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(factures, 'factures')} className="btn-ghost text-sm py-2.5 px-4"><Download size={14} /></button>
          <button onClick={refresh} className="btn-ghost text-sm py-2.5 px-4"><RefreshCw size={14} /></button>
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Nouvelle facture</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">CA encaissé</p>
          <p className="font-display text-2xl font-bold text-green-400">{totalCA.toLocaleString('fr-FR')}€</p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">En attente</p>
          <p className={`font-display text-2xl font-bold ${totalImpayé > 0 ? 'text-orange-400' : 'text-white'}`}>{totalImpayé.toLocaleString('fr-FR')}€</p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Total factures</p>
          <p className="font-display text-2xl font-bold text-white">{factures.length}</p>
        </div>
      </div>

      {totalImpayé > 0 && (
        <div className="card-glass p-4 border-orange-500/20 bg-orange-500/5 mb-6 flex items-center gap-3">
          <AlertCircle size={16} className="text-orange-400 shrink-0" />
          <p className="text-orange-300 text-sm"><strong>{totalImpayé.toLocaleString('fr-FR')}€ TTC</strong> en attente de paiement</p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {['toutes', 'payée', 'en attente', 'en retard'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
              filtre === f ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
            }`}>{f}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-white/30 text-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <FileText size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Aucune facture</p>
          <button onClick={openCreate} className="btn-primary mt-4 text-sm">+ Créer la première facture</button>
        </div>
      ) : (
        <div className="card-glass p-6">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['N° Facture', 'Client', 'Date', 'HT', 'TVA', 'TTC', 'Statut', ''].map(h => (
                    <th key={h} className="text-left text-xs text-white/30 font-medium pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-blue-400" />
                        <span className="text-white text-xs font-mono">{f.numero_facture}</span>
                        {f.stripe_invoice_id && <span className="text-xs text-blue-400/40">Stripe</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-white/70 text-xs">{f.nom_client || '—'}</p>
                        {f.email_client && <p className="text-white/30 text-xs">{f.email_client}</p>}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-white/40 text-xs">{f.date_facture}</td>
                    <td className="py-3 pr-4 text-white text-xs">{(f.montant_ht || 0).toLocaleString('fr-FR')}€</td>
                    <td className="py-3 pr-4 text-white/40 text-xs">{(f.tva || 0).toLocaleString('fr-FR')}€</td>
                    <td className="py-3 pr-4 text-white font-semibold text-xs">{(f.montant_ttc || 0).toLocaleString('fr-FR')}€</td>
                    <td className="py-3 pr-4">
                      <select value={f.statut} onChange={e => changeStatut(f.id, e.target.value)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-medium cursor-pointer focus:outline-none bg-transparent border-0 ${statutConfig[f.statut]?.color}`}>
                        {['payée', 'en attente', 'en retard'].map(s => (
                          <option key={s} value={s} className="bg-navy-900 text-white">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Bouton relancer — uniquement si pas payée */}
                        {f.statut !== 'payée' && (
                          <button onClick={() => openRelance(f)}
                            title="Relancer par email"
                            disabled={relancing === f.id}
                            className={`p-1 transition-colors ${
                              relanceOk === f.id
                                ? 'text-green-400'
                                : 'text-white/20 hover:text-orange-400'
                            }`}>
                            {relancing === f.id
                              ? <Loader size={13} className="animate-spin" />
                              : relanceOk === f.id
                                ? <Check size={13} />
                                : <Mail size={13} />
                            }
                          </button>
                        )}
                        <button onClick={() => openEdit(f)} className="text-white/20 hover:text-blue-400 transition-colors p-1"><Pencil size={13} /></button>
                        <button onClick={() => deleteFacture(f.id)} className="text-white/20 hover:text-red-400 transition-colors p-1"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal relance */}
      {showRelanceModal && relanceFacture && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-white text-sm">Relancer la facture {relanceFacture.numero_facture}</h2>
              <button onClick={() => setShowRelanceModal(false)} className="text-white/30 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Email du client *</label>
                <input type="email" value={emailRelance} onChange={e => setEmailRelance(e.target.value)}
                  placeholder="client@exemple.fr"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="card-glass p-4 bg-white/3 text-xs text-white/40 space-y-1">
                <p><span className="text-white/60">Facture :</span> {relanceFacture.numero_facture}</p>
                <p><span className="text-white/60">Montant :</span> {relanceFacture.montant_ttc.toLocaleString('fr-FR')}€ TTC</p>
                <p><span className="text-white/60">Date :</span> {relanceFacture.date_facture}</p>
              </div>
              {relanceErr && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle size={13} /> {relanceErr}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRelanceModal(false)} className="btn-ghost flex-1 justify-center text-sm">Annuler</button>
              <button onClick={handleRelance} disabled={!emailRelance || !!relancing}
                className="btn-primary flex-1 justify-center text-sm disabled:opacity-40">
                {relancing ? <Loader size={14} className="animate-spin" /> : <><Mail size={14} /> Envoyer la relance</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white">{editItem ? 'Modifier la facture' : 'Nouvelle facture'}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Nom client</label>
                  <input value={form.nom_client} onChange={e => setForm({...form, nom_client: e.target.value})}
                    placeholder="Jean Dupont"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Email client</label>
                  <input type="email" value={form.email_client} onChange={e => setForm({...form, email_client: e.target.value})}
                    placeholder="client@exemple.fr"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">N° Facture *</label>
                <input value={form.numero_facture} onChange={e => setForm({...form, numero_facture: e.target.value})}
                  placeholder="F-2026-001"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Date *</label>
                <input type="date" value={form.date_facture} onChange={e => setForm({...form, date_facture: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Montant HT (€) *</label>
                <input type="number" value={form.montant_ht} onChange={e => handleHtChange(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">TVA (€)</label>
                  <input type="number" value={form.tva} onChange={e => setForm({...form, tva: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">TTC (€)</label>
                  <input type="number" value={form.montant_ttc} onChange={e => setForm({...form, montant_ttc: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Statut</label>
                <div className="flex gap-2">
                  {(['payée', 'en attente', 'en retard'] as const).map(s => (
                    <button key={s} onClick={() => setForm({...form, statut: s})}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.statut === s ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.numero_facture || !form.date_facture}
                className="btn-primary flex-1 justify-center disabled:opacity-40">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={15} />{editItem ? 'Modifier' : 'Créer'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
