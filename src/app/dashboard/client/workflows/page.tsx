'use client'
import { useState } from 'react'
import { Zap, CheckCircle, XCircle, Circle, Play, RefreshCw, FileText, Bell, BarChart2, PenLine, UserPlus, Share2, ScanLine, Landmark } from 'lucide-react'

const workflows = [
  {
    id: 'devis-factures',
    nom: 'Devis & Factures PDP 2026',
    description: 'Génération automatique devis/factures conforme PDP 2026',
    icon: FileText,
    actif: true,
    statut: 'ok',
    executions: 47,
    derniere: '2026-03-05 14:32',
    gain: '6h/sem',
  },
  {
    id: 'relances',
    nom: 'Relances Clients Auto',
    description: 'Séquence de relance automatique selon statut paiement',
    icon: Bell,
    actif: true,
    statut: 'ok',
    executions: 23,
    derniere: '2026-03-05 09:00',
    gain: '3h/sem',
  },
  {
    id: 'reporting-ca',
    nom: 'Reporting CA Dashboard',
    description: 'Dashboard CFO hebdo/mensuel/trimestriel + conseil IA',
    icon: BarChart2,
    actif: true,
    statut: 'ok',
    executions: 12,
    derniere: '2026-03-03 08:00',
    gain: '2h/sem',
  },
  {
    id: 'signature',
    nom: 'Signature Contrats',
    description: 'Envoi et suivi signature via Universign',
    icon: PenLine,
    actif: false,
    statut: 'inactif',
    executions: 0,
    derniere: null,
    gain: '2h/sem',
  },
  {
    id: 'leads-crm',
    nom: 'Leads Forms → CRM',
    description: 'Capture leads Gmail → extraction GPT → CRM Sheets',
    icon: UserPlus,
    actif: true,
    statut: 'ok',
    executions: 112,
    derniere: '2026-03-05 17:18',
    gain: '2h/sem',
  },
  {
    id: 'posts-reseaux',
    nom: 'Posts Réseaux Auto',
    description: 'Publication automatique LinkedIn / Instagram / TikTok',
    icon: Share2,
    actif: true,
    statut: 'erreur',
    executions: 8,
    derniere: '2026-03-04 14:00',
    gain: '2h/sem',
    erreur: 'Rate limit LinkedIn — token expiré',
  },
  {
    id: 'ocr-factures',
    nom: 'OCR Factures Fournisseurs',
    description: 'PDF facture → OCR + extraction GPT → Sheets comptabilité',
    icon: ScanLine,
    actif: true,
    statut: 'ok',
    executions: 23,
    derniere: '2026-03-05 11:45',
    gain: '2h/sem',
  },
  {
    id: 'alertes-budget',
    nom: 'Alertes Budget Banque',
    description: 'Connexion Tink/Indy → alertes dépassement seuils',
    icon: Landmark,
    actif: false,
    statut: 'inactif',
    executions: 0,
    derniere: null,
    gain: '1h/sem',
  },
]

const statutConfig: Record<string, { label: string, color: string, dot: string, icon: React.ElementType }> = {
  ok:      { label: 'Actif',   color: 'bg-green-500/10 text-green-400 border-green-500/20',  dot: 'bg-green-400', icon: CheckCircle },
  erreur:  { label: 'Erreur',  color: 'bg-red-500/10 text-red-400 border-red-500/20',        dot: 'bg-red-400',   icon: XCircle },
  inactif: { label: 'Inactif', color: 'bg-white/5 text-white/30 border-white/10',            dot: 'bg-white/20',  icon: Circle },
}

export default function WorkflowsPage() {
  const [data, setData] = useState(workflows)

  const toggle = (id: string) => {
    setData(prev => prev.map(w =>
      w.id === id ? { ...w, actif: !w.actif, statut: !w.actif ? 'ok' : 'inactif' } : w
    ))
  }

  const actifs = data.filter(w => w.actif).length
  const erreurs = data.filter(w => w.statut === 'erreur').length
  const totalExec = data.reduce((s, w) => s + w.executions, 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1">Workflows</h1>
        <p className="text-white/40 text-sm">Statut et gestion de vos 8 workflows n8n</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Actifs</p>
          <p className="font-display text-3xl font-bold text-white">{actifs}<span className="text-white/20 text-lg font-normal">/8</span></p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Erreurs</p>
          <p className={`font-display text-3xl font-bold ${erreurs > 0 ? 'text-red-400' : 'text-white'}`}>{erreurs}</p>
        </div>
        <div className="card-glass p-5">
          <p className="text-white/40 text-xs mb-2">Exécutions totales</p>
          <p className="font-display text-3xl font-bold text-white">{totalExec}</p>
        </div>
      </div>

      {/* Workflows list */}
      <div className="space-y-3">
        {data.map((w) => {
          const s = statutConfig[w.statut]
          return (
            <div key={w.id} className={`card-glass p-5 transition-all ${w.statut === 'erreur' ? 'border-red-500/20' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    w.actif ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 border border-white/10'
                  }`}>
                    <w.icon size={18} className={w.actif ? 'text-blue-400' : 'text-white/20'} />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white text-sm font-medium">{w.nom}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${s.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${w.statut === 'erreur' ? 'animate-pulse' : ''}`} />
                        {s.label}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs mb-2">{w.description}</p>

                    {/* Erreur message */}
                    {w.erreur && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5 mb-2">
                        <XCircle size={11} />
                        {w.erreur}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-white/25">
                      <span>{w.executions} exécutions</span>
                      {w.derniere && <span>Dernière : {w.derniere}</span>}
                      <span className="text-green-400/60">+{w.gain}</span>
                    </div>
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(w.id)}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                      w.actif ? 'bg-blue-500' : 'bg-white/10'
                    }`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                      w.actif ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
