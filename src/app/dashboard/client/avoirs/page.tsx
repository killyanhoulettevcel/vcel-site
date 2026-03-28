'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, Mail, Check, RefreshCw,
  Download, X, Loader, AlertCircle, Clock, CheckCircle, Filter, ArrowRight
} from 'lucide-react'
import { useRealtimeData } from '@/lib/useRealtimeData'
import { exportCSV } from '@/lib/exportCSV'

// acompte, Acomptes, Factures d'acompte liées à vos devis, Aucun acompte — les acomptes sont liés à vos devis acceptés, BADGE_COLOR, BADGE_BG remplacés

interface Facture {
  id: string
  numero_facture: string
  date_facture: string
  date_echeance?: string
  montant_ht: number
  tva: number
  montant_ttc: number
  statut: 'payée' | 'en attente' | 'en retard' | 'accepté' | 'refusé' | 'expiré'
  client_email?: string
  client_nom?: string
  objet?: string
  type_facture?: string
  facture_ref_id?: string
  acompte_pct?: number
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'payée':      { label: 'Payée',    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  'en attente': { label: 'En attente', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: Clock },
  'en retard':  { label: 'En retard', color: 'text-red-600',   bg: 'bg-red-50 border-red-200',   icon: AlertCircle },
  'accepté':    { label: 'Accepté',  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  'refusé':     { label: 'Refusé',   color: 'text-red-600',    bg: 'bg-red-50 border-red-200',   icon: AlertCircle },
  'expiré':     { label: 'Expiré',   color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', icon: Clock },
}

export default function AcomptesPage() {
  const router = useRouter()
  const { data: allDocs, loading, lastUpdate, refresh } = useRealtimeData<Facture>('/api/factures', 'factures')
  const [filtre, setFiltre] = useState('tous')

  // Filtrer uniquement ce type
  const docs = allDocs.filter(f => (f.type_facture || 'facture') === 'acompte')
  const filtered = filtre === 'tous' ? docs : docs.filter(f => f.statut === filtre)

  const fmt = (n: number) => `${Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

  const deleteDoc = async (id: string) => {
    if (!confirm('Supprimer ce document ?')) return
    await fetch(`/api/factures?id=${id}`, { method: 'DELETE' })
    refresh()
  }

  const changeStatut = async (id: string, statut: string) => {
    await fetch('/api/factures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }) })
    refresh()
  }

  // Convertir un devis en facture
  const convertirEnFacture = async (doc: Facture) => {
    const res = await fetch('/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...doc,
        id: undefined,
        type_facture: 'facture',
        statut: 'en attente',
        facture_ref_id: doc.id,
        numero_facture: '', // sera auto-généré
        date_facture: new Date().toISOString().split('T')[0],
      }),
    })
    if (res.ok) router.push('/dashboard/client/factures')
  }

  // KPIs selon le type
  const total      = docs.length
  const montantHT  = docs.reduce((s, d) => s + (d.montant_ht || 0), 0)
  const montantTTC = docs.reduce((s, d) => s + (d.montant_ttc || 0), 0)

  const STATUTS_DISPO = ['en attente', 'payée', 'en retard']

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--navy)' }}>Acomptes</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Factures d'acompte liées à vos devis</p>
            {lastUpdate && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#22C55E' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(docs, 'acompte')} className="btn-ghost text-sm py-2 px-3"><Download size={14} /></button>
          <button onClick={refresh} className="btn-ghost text-sm py-2 px-3"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          <button
            onClick={() => router.push(`/dashboard/client/factures/nouvelle?type=acompte`)}
            className="btn-primary text-sm">
            <Plus size={14} /> Nouvel acompte
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-glass p-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Total</p>
          <p className="font-display text-xl font-bold" style={{ color: 'var(--navy)' }}>{total}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>documents</p>
        </div>
        <div className="card-glass p-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Total HT</p>
          <p className="font-display text-xl font-bold" style={{ color: 'var(--navy)' }}>{fmt(montantHT)}</p>
        </div>
        <div className="card-glass p-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Total TTC</p>
          <p className="font-display text-xl font-bold" style={{ color: 'var(--navy)' }}>{fmt(montantTTC)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={13} style={{ color: 'var(--text-muted)' }} />
        <button onClick={() => setFiltre('tous')}
          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
          style={{ background: filtre === 'tous' ? 'var(--navy)' : 'transparent', borderColor: filtre === 'tous' ? 'var(--navy)' : 'var(--border)', color: filtre === 'tous' ? 'white' : 'var(--text-muted)' }}>
          Tous ({docs.length})
        </button>
        {STATUTS_DISPO.map(s => (
          <button key={s} onClick={() => setFiltre(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
            style={{ background: filtre === s ? 'var(--navy)' : 'transparent', borderColor: filtre === s ? 'var(--navy)' : 'var(--border)', color: filtre === s ? 'white' : 'var(--text-muted)' }}>
            {STATUT_CONFIG[s]?.label || s} ({docs.filter(d => d.statut === s).length})
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="card-glass p-12 text-center flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-hover)', borderTopColor: 'var(--cyan)' }} />
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <p className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Aucun acompte — les acomptes sont liés à vos devis acceptés</p>
          <button onClick={() => router.push(`/dashboard/client/factures/nouvelle?type=acompte`)}
            className="btn-primary mt-3 text-sm">+ Nouvel acompte</button>
        </div>
      ) : (
        <div className="card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['N°', 'Client', 'Objet', 'Date', 'Échéance', 'Montant TTC', 'Statut', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold pb-3 pt-4 px-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const sc = STATUT_CONFIG[doc.statut] || STATUT_CONFIG['en attente']
                  const SIcon = sc.icon
                  return (
                    <tr key={doc.id} className="table-row">
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.numero_facture}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{doc.client_nom || '—'}</p>
                        {doc.client_email && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{doc.client_email}</p>}
                      </td>
                      <td className="py-3 px-4 max-w-[140px]">
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{doc.objet || '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {doc.date_facture ? new Date(doc.date_facture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {doc.date_echeance ? new Date(doc.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                        {fmt(doc.montant_ttc)}
                        {doc.acompte_pct && <span className="ml-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>({doc.acompte_pct}%)</span>}
                      </td>
                      <td className="py-3 px-4">
                        <select value={doc.statut} onChange={e => changeStatut(doc.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg font-medium cursor-pointer focus:outline-none border ${sc.bg} ${sc.color}`}>
                          {STATUTS_DISPO.map(s => (
                            <option key={s} value={s} style={{ background: 'white', color: 'var(--navy)' }}>{STATUT_CONFIG[s]?.label || s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          
                          <button onClick={() => router.push(`/dashboard/client/factures/${doc.id}`)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]" style={{ color: 'var(--text-muted)' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteDoc(doc.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-50" style={{ color: 'var(--text-muted)' }}>
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
        </div>
      )}
    </div>
  )
}