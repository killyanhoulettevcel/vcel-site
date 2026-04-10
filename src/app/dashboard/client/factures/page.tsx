'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, AlertCircle, CheckCircle, Clock, Plus, Pencil,
  Trash2, X, Check, RefreshCw, Download, Mail, Loader,
  Search, ArrowUpDown, Receipt, Landmark, BookTemplate
} from 'lucide-react'
import { useRealtimeData } from '@/lib/useRealtimeData'
import { exportCSV } from '@/lib/exportCSV'

interface Facture {
  id: string
  numero_facture: string
  type_facture?: 'facture' | 'avoir' | 'acompte' | 'proforma'
  date_facture: string
  date_echeance?: string
  montant_ht: number
  tva: number
  montant_ttc: number
  statut: 'payée' | 'en attente' | 'en retard'
  stripe_invoice_id?: string
  email_client?: string
  nom_client?: string
  objet?: string
}

const statutConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  'payée':      { label: 'Payée',      color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   icon: CheckCircle },
  'en attente': { label: 'En attente', color: '#0288D1', bg: 'rgba(2,136,209,0.08)',   icon: Clock },
  'en retard':  { label: 'En retard',  color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   icon: AlertCircle },
}

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  'facture':  { label: 'Facture',  color: '#0288D1', bg: 'rgba(2,136,209,0.08)',   icon: FileText },
  'avoir':    { label: 'Avoir',    color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  icon: Landmark },
  'acompte':  { label: 'Acompte', color: '#D97706', bg: 'rgba(217,119,6,0.08)',   icon: Receipt },
  'proforma': { label: 'Proforma', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', icon: BookTemplate },
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function FacturesPage() {
  const router = useRouter()
  const { data: factures, loading, lastUpdate, refresh } = useRealtimeData<Facture>('/api/factures', 'factures')

  const [filtre,     setFiltre]     = useState('toutes')
  const [typeFiltre, setTypeFiltre] = useState('tous')
  const [recherche,  setRecherche]  = useState('')
  const [sortField,  setSortField]  = useState<'date_facture' | 'montant_ttc' | 'date_echeance'>('date_facture')
  const [sortAsc,    setSortAsc]    = useState(false)
  const [relancing,        setRelancing]        = useState<string | null>(null)
  const [relanceOk,        setRelanceOk]        = useState<string | null>(null)
  const [relanceErr,       setRelanceErr]       = useState<string | null>(null)
  const [showRelanceModal, setShowRelanceModal] = useState(false)
  const [relanceFacture,   setRelanceFacture]   = useState<Facture | null>(null)
  const [emailRelance,     setEmailRelance]     = useState('')

  const filtered = factures
    .filter(f => filtre === 'toutes' || f.statut === filtre)
    .filter(f => typeFiltre === 'tous' || (f.type_facture || 'facture') === typeFiltre)
    .filter(f => {
      if (!recherche) return true
      const q = recherche.toLowerCase()
      return (
        f.numero_facture?.toLowerCase().includes(q) ||
        f.nom_client?.toLowerCase().includes(q) ||
        f.email_client?.toLowerCase().includes(q) ||
        f.objet?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let va: any = a[sortField] || ''
      let vb: any = b[sortField] || ''
      if (sortField === 'montant_ttc') { va = Number(va); vb = Number(vb) }
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(v => !v)
    else { setSortField(field); setSortAsc(false) }
  }

  const totalImpayé = factures.filter(f => f.statut !== 'payée' && (f.type_facture || 'facture') === 'facture').reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const totalCA     = factures.filter(f => f.statut === 'payée' && (f.type_facture || 'facture') === 'facture').reduce((s, f) => s + (f.montant_ht || 0), 0)
  const nbEnRetard  = factures.filter(f => f.statut === 'en retard').length

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
    setRelanceFacture(f); setEmailRelance(f.email_client || ''); setRelanceErr(null); setShowRelanceModal(true)
  }

  const handleRelance = async () => {
    if (!relanceFacture || !emailRelance) return
    setRelancing(relanceFacture.id); setRelanceErr(null)
    try {
      const res = await fetch('/api/emails', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'relance_facture', to: emailRelance, data: { nomClient: relanceFacture.nom_client || emailRelance, numeroFacture: relanceFacture.numero_facture, montant: relanceFacture.montant_ttc, dateEcheance: relanceFacture.date_echeance || relanceFacture.date_facture } }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur envoi')
      setRelanceOk(relanceFacture.id); setShowRelanceModal(false)
      setTimeout(() => setRelanceOk(null), 3000)
    } catch (e: any) { setRelanceErr(e.message) }
    setRelancing(null)
  }

  const SortBtn = ({ field, label }: { field: typeof sortField; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1"
      style={{ color: sortField === field ? 'var(--text-primary)' : 'var(--text-muted)' }}>
      {label}<ArrowUpDown size={11} style={{ opacity: sortField === field ? 1 : 0.4 }} />
    </button>
  )

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Factures</h1>
          <div className="flex items-center gap-3">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Synchronisé avec Stripe</p>
            {lastUpdate && <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-light)' }}><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(factures, 'factures')} className="btn-ghost text-sm py-2 px-3"><Download size={14} /></button>
          <button onClick={refresh} className="btn-ghost text-sm py-2 px-3"><RefreshCw size={14} /></button>
          <button onClick={() => router.push('/dashboard/client/factures/nouvelle')} className="btn-primary text-sm"><Plus size={15} /> Nouvelle facture</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'CA encaissé (HT)', value: `${fmt(totalCA)}€`, color: '#16A34A' },
          { label: 'En attente', value: `${fmt(totalImpayé)}€`, color: totalImpayé > 0 ? '#D97706' : 'var(--text-primary)' },
          { label: 'En retard', value: String(nbEnRetard), color: nbEnRetard > 0 ? '#DC2626' : 'var(--text-primary)' },
          { label: 'Total documents', value: String(factures.length), color: 'var(--text-primary)' },
        ].map(s => (
          <div key={s.label} className="card-glass p-4">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="font-display text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {totalImpayé > 0 && (
        <div className="card-glass p-4 mb-5 flex items-center gap-3" style={{ borderColor: 'rgba(217,119,6,0.3)', background: 'rgba(217,119,6,0.05)' }}>
          <AlertCircle size={16} style={{ color: '#D97706', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#D97706' }}><strong>{fmt(totalImpayé)}€ TTC</strong> en attente de paiement</p>
        </div>
      )}

      {/* Recherche + Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }} />
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par client, numéro, objet..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['toutes', 'payée', 'en attente', 'en retard'].map(f => (
            <button key={f} onClick={() => setFiltre(f)} className="px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize"
              style={{ background: filtre === f ? 'var(--navy)' : 'transparent', color: filtre === f ? 'white' : 'var(--text-muted)', border: filtre === f ? '1px solid var(--navy)' : '1px solid var(--border)' }}>{f}</button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['tous', 'facture', 'avoir', 'acompte', 'proforma'].map(t => (
            <button key={t} onClick={() => setTypeFiltre(t)} className="px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize"
              style={{ background: typeFiltre === t ? 'var(--navy)' : 'transparent', color: typeFiltre === t ? 'white' : 'var(--text-muted)', border: typeFiltre === t ? '1px solid var(--navy)' : '1px solid var(--border)' }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card-glass p-12 text-center flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-muted)' }} />Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{recherche || filtre !== 'toutes' || typeFiltre !== 'tous' ? 'Aucun résultat' : 'Aucune facture'}</p>
          {!recherche && filtre === 'toutes' && typeFiltre === 'tous' && (
            <button onClick={() => router.push('/dashboard/client/factures/nouvelle')} className="btn-primary text-sm">+ Créer la première facture</button>
          )}
        </div>
      ) : (
        <div className="card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[
                    <th key="num" className="text-left text-xs font-semibold pb-3 pt-4 px-4" style={{ color: 'var(--text-muted)' }}><SortBtn field="date_facture" label="N° / Type" /></th>,
                    <th key="cli" className="text-left text-xs font-semibold pb-3 pt-4 px-4" style={{ color: 'var(--text-muted)' }}>Client</th>,
                    <th key="dat" className="text-left text-xs font-semibold pb-3 pt-4 px-4" style={{ color: 'var(--text-muted)' }}><SortBtn field="date_facture" label="Date" /></th>,
                    <th key="ech" className="text-left text-xs font-semibold pb-3 pt-4 px-4" style={{ color: 'var(--text-muted)' }}><SortBtn field="date_echeance" label="Échéance" /></th>,
                    <th key="ht"  className="text-left text-xs font-semibold pb-3 pt-4 px-4" style={{ color: 'var(--text-muted)' }}>HT</th>,
                    <th key="tva" className="text-left text-xs font-semibold pb-3 pt-4 px-4" style={{ color: 'var(--text-muted)' }}>TVA</th>,
                    <th key="ttc" className="text-left text-xs font-semibold pb-3 pt-4 px-4" style={{ color: 'var(--text-muted)' }}><SortBtn field="montant_ttc" label="TTC" /></th>,
                    <th key="sta" className="text-left text-xs font-semibold pb-3 pt-4 px-4" style={{ color: 'var(--text-muted)' }}>Statut</th>,
                    <th key="act" className="pb-3 pt-4 px-4" />,
                  ]}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const type  = f.type_facture || 'facture'
                  const tConf = typeConfig[type] || typeConfig.facture
                  const TIcon = tConf.icon
                  const sConf = statutConfig[f.statut] || statutConfig['en attente']
                  const isRetard = f.date_echeance && f.statut !== 'payée' && new Date(f.date_echeance) < new Date()
                  return (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: tConf.bg }}>
                            <TIcon size={12} style={{ color: tConf.color }} />
                          </div>
                          <div>
                            <p className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{f.numero_facture}</p>
                            <p className="text-xs" style={{ color: tConf.color }}>{tConf.label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{f.nom_client || '—'}</p>
                        {f.email_client && <p className="text-xs" style={{ color: 'var(--text-light)' }}>{f.email_client}</p>}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{f.date_facture || '—'}</td>
                      <td className="py-3 px-4 text-xs" style={{ color: isRetard ? '#DC2626' : 'var(--text-muted)', fontWeight: isRetard ? 600 : 400 }}>
                        {f.date_echeance || '—'}{isRetard && ' ⚠'}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{fmt(f.montant_ht)}€</td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-light)' }}>{fmt(f.tva)}€</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold" style={{ color: type === 'avoir' ? '#7C3AED' : 'var(--text-primary)' }}>{fmt(f.montant_ttc)}€</span>
                      </td>
                      <td className="py-3 px-4">
                        <select value={f.statut} onChange={e => changeStatut(f.id, e.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-xl font-medium cursor-pointer focus:outline-none border-0"
                          style={{ background: sConf.bg, color: sConf.color }}>
                          {['payée', 'en attente', 'en retard'].map(s => (
                            <option key={s} value={s} style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {f.statut !== 'payée' && type === 'facture' && (
                            <button onClick={() => openRelance(f)} disabled={relancing === f.id}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: relanceOk === f.id ? '#16A34A' : 'var(--text-light)' }}>
                              {relancing === f.id ? <Loader size={13} className="animate-spin" /> : relanceOk === f.id ? <Check size={13} /> : <Mail size={13} />}
                            </button>
                          )}
                          <button onClick={() => router.push(`/dashboard/client/factures/nouvelle?edit=${f.id}`)}
                            className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-light)' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteFacture(f.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-light)' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} document{filtered.length > 1 ? 's' : ''}{recherche || filtre !== 'toutes' || typeFiltre !== 'tous' ? ' (filtrés)' : ''}</p>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Total TTC : {fmt(filtered.reduce((s, f) => s + (f.montant_ttc || 0), 0))}€</p>
          </div>
        </div>
      )}

      {/* Modal relance */}
      {showRelanceModal && relanceFacture && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Relancer — {relanceFacture.numero_facture}</h2>
              <button onClick={() => setShowRelanceModal(false)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email du client *</label>
                <input type="email" value={emailRelance} onChange={e => setEmailRelance(e.target.value)} placeholder="client@exemple.fr"
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div className="rounded-xl p-4 space-y-1 text-xs" style={{ background: 'var(--bg-secondary)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Facture : <span style={{ color: 'var(--text-secondary)' }}>{relanceFacture.numero_facture}</span></p>
                <p style={{ color: 'var(--text-muted)' }}>Montant : <span style={{ color: 'var(--text-secondary)' }}>{fmt(relanceFacture.montant_ttc)}€ TTC</span></p>
                <p style={{ color: 'var(--text-muted)' }}>Échéance : <span style={{ color: 'var(--text-secondary)' }}>{relanceFacture.date_echeance || relanceFacture.date_facture}</span></p>
              </div>
              {relanceErr && <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}><AlertCircle size={13} /> {relanceErr}</div>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRelanceModal(false)} className="btn-ghost flex-1 justify-center text-sm">Annuler</button>
              <button onClick={handleRelance} disabled={!emailRelance || !!relancing} className="btn-primary flex-1 justify-center text-sm disabled:opacity-40">
                {relancing ? <Loader size={14} className="animate-spin" /> : <><Mail size={14} /> Envoyer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}