'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, Check, RefreshCw,
  Download, AlertCircle, Clock, CheckCircle, Filter, ArrowRight
} from 'lucide-react'
import { useRealtimeData } from '@/lib/useRealtimeData'
import { exportCSV } from '@/lib/exportCSV'

interface Facture {
  id: string
  numero_facture: string
  date_facture: string
  date_echeance?: string
  montant_ht: number
  tva: number
  montant_ttc: number
  statut: string
  client_email?: string
  client_nom?: string
  objet?: string
  type_facture?: string
  acompte_pct?: number
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'payée':      { label: 'Payée',      color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  'en attente': { label: 'En attente', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100' },
  'en retard':  { label: 'En retard',  color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
  'accepté':    { label: 'Accepté',    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  'refusé':     { label: 'Refusé',     color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
  'expiré':     { label: 'Expiré',     color: 'text-orange-500',  bg: 'bg-orange-50 border-orange-200' },
}

const STATUTS_DISPO = ['en attente', 'payée']

export default function AvoirsPage() {
  const router = useRouter()
  const { data: allDocs, loading, lastUpdate, refresh } = useRealtimeData<Facture>('/api/factures', 'factures')
  const [filtre, setFiltre] = useState('tous')

  const docs     = allDocs.filter(f => (f.type_facture || 'facture') === 'avoir')
  const filtered = filtre === 'tous' ? docs : docs.filter(f => f.statut === filtre)
  const fmt      = (n: number) => `${Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
  const montantHT  = docs.reduce((s, d) => s + (d.montant_ht  || 0), 0)
  const montantTTC = docs.reduce((s, d) => s + (d.montant_ttc || 0), 0)

  const deleteDoc = async (id: string) => {
    if (!confirm('Supprimer ce document ?')) return
    await fetch(`/api/factures?id=${id}`, { method: 'DELETE' })
    refresh()
  }

  const changeStatut = async (id: string, statut: string) => {
    await fetch('/api/factures', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut }),
    })
    refresh()
  }

  const convertirEnFacture = async (doc: Facture) => {
    await fetch('/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...doc, id: undefined, type_facture: 'facture',
        statut: 'en attente', facture_ref_id: doc.id,
        numero_facture: '',
        date_facture: new Date().toISOString().split('T')[0],
      }),
    })
    router.push('/dashboard/client/factures')
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--navy)' }}>Avoirs</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Notes de crédit et remboursements</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(docs, 'avoir')} className="btn-ghost text-sm py-2 px-3"><Download size={14} /></button>
          <button onClick={refresh} className="btn-ghost text-sm py-2 px-3"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          <button
            onClick={() => router.push('/dashboard/client/factures/nouvelle?type=avoir')}
            className="btn-primary text-sm">
            <Plus size={14} /> Nouvel avoir
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: String(docs.length), sub: 'documents' },
          { label: 'Total HT', value: fmt(montantHT), sub: '' },
          { label: 'Total TTC', value: fmt(montantTTC), sub: '' },
        ].map((k, i) => (
          <div key={i} className="card-glass p-4">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
            <p className="font-display text-xl font-bold" style={{ color: 'var(--navy)' }}>{k.value}</p>
            {k.sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{k.sub}</p>}
          </div>
        ))}
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
          <p className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Aucun avoir émis</p>
          <button onClick={() => router.push('/dashboard/client/factures/nouvelle?type=avoir')}
            className="btn-primary mt-3 text-sm">+ Nouvel avoir</button>
        </div>
      ) : (
        <div className="card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['N°', 'Client', 'Objet', 'Date', 'Échéance', 'Montant TTC', 'Statut', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold pb-3 pt-4 px-4 uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const sc = STATUT_CONFIG[doc.statut] || STATUT_CONFIG['en attente']
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
                        {doc.acompte_pct && <span className="ml-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>{`(${doc.acompte_pct}%)`}</span>}
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
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                            style={{ color: 'var(--text-muted)' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteDoc(doc.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                            style={{ color: 'var(--text-muted)' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}