// src/components/ImportCSV.tsx
// Composant drag & drop pour importer n'importe quel CSV
'use client'
import { useState, useRef } from 'react'
import { Upload, CheckCircle, XCircle, FileText, X } from 'lucide-react'

interface ImportResult {
  success: boolean
  type: string
  inserted: number
  total: number
  message: string
  error?: string
}

const TYPE_LABELS: Record<string, string> = {
  ca:                   '📊 CA & Finances',
  leads:                '👥 CRM Leads',
  factures:             '📄 Factures clients',
  factures_fournisseurs:'🏭 Factures fournisseurs',
}

export default function ImportCSV({ onSuccess }: { onSuccess?: () => void }) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result,    setResult]    = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setResult({ success: false, type: '', inserted: 0, total: 0, message: '', error: 'Fichier CSV uniquement (.csv)' })
      return
    }
    setUploading(true)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res  = await fetch('/api/import-csv', { method: 'POST', body: form })
      const data = await res.json()
      setResult(data)
      if (data.success && onSuccess) onSuccess()
    } catch {
      setResult({ success: false, type: '', inserted: 0, total: 0, message: '', error: 'Erreur lors de l\'import' })
    }
    setUploading(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="card-glass p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-white text-sm">Importer un CSV</h3>
          <p className="text-white/30 text-xs mt-0.5">Détection automatique du type — sync Supabase + Google Sheets</p>
        </div>
        {result && (
          <button onClick={() => setResult(null)} className="text-white/20 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Zone drop */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-blue-500/60 bg-blue-500/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/2'
        }`}>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Import en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-white/20" />
            <p className="text-white/50 text-sm">Glissez votre CSV ici ou <span className="text-blue-400">cliquez pour choisir</span></p>
            <p className="text-white/20 text-xs">CA · Leads · Factures · Fournisseurs — détecté automatiquement</p>
          </div>
        )}
      </div>

      {/* Résultat */}
      {result && (
        <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
          result.success
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-red-500/5 border-red-500/20'
        }`}>
          {result.success
            ? <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
            : <XCircle    size={16} className="text-red-400 shrink-0 mt-0.5" />
          }
          <div>
            {result.success ? (
              <>
                <p className="text-green-400 text-sm font-medium">
                  {TYPE_LABELS[result.type] || result.type} — {result.inserted}/{result.total} lignes importées
                </p>
                <p className="text-white/30 text-xs mt-0.5">Supabase + Google Sheets synchronisés ✓</p>
              </>
            ) : (
              <p className="text-red-400 text-sm">{result.error || result.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Aide colonnes */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { label: '📊 CA',         cols: 'mois, ca_ht, charges_total' },
          { label: '👥 Leads',      cols: 'nom, email, score, statut, source' },
          { label: '📄 Factures',   cols: 'invoice_id, montant_ht, statut' },
          { label: '🏭 Fournisseurs', cols: 'fournisseur, numero_facture, montant_ht' },
        ].map(t => (
          <div key={t.label} className="bg-white/3 rounded-lg p-2.5">
            <p className="text-white/50 text-xs font-medium mb-0.5">{t.label}</p>
            <p className="text-white/20 text-xs">{t.cols}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
