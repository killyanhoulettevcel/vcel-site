'use client'
import { useState, useEffect } from 'react'
import { Clock, Euro, TrendingUp, Zap, Calculator, RefreshCw, Info } from 'lucide-react'

interface Workflow {
  nom: string
  heures_semaine: number
  actif: boolean
}

const workflowsDefaut: Workflow[] = [
  { nom: 'Devis / Factures automatiques',   heures_semaine: 3,   actif: true },
  { nom: 'Leads Forms → CRM',               heures_semaine: 2,   actif: true },
  { nom: 'Reporting CA hebdo',              heures_semaine: 1.5, actif: true },
  { nom: 'Posts Réseaux sociaux auto',      heures_semaine: 2.5, actif: true },
  { nom: 'OCR Factures fournisseurs',       heures_semaine: 1.5, actif: true },
  { nom: 'Relance leads automatique',       heures_semaine: 1,   actif: true },
  { nom: 'Résumé hebdomadaire IA',          heures_semaine: 0.5, actif: true },
  { nom: 'Onboarding clients Stripe',       heures_semaine: 1,   actif: true },
]

export default function RentabiliteePage() {
  const [tauxHoraire, setTauxHoraire] = useState(50)
  const [workflows, setWorkflows]     = useState<Workflow[]>(workflowsDefaut)
  const [abonnement, setAbonnement]   = useState(49)
  const [loading, setLoading]         = useState(true)

  // Charger données réelles depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [caRes, profilRes] = await Promise.all([
          fetch('/api/ca').then(r => r.json()),
          fetch('/api/profil').then(r => r.json()),
        ])
        // Estimer taux horaire depuis CA moyen
        const caData = Array.isArray(caRes) ? caRes : []
        if (caData.length > 0) {
          const caMoyen = caData.reduce((s: number, d: any) => s + (d.ca_ht || 0), 0) / caData.length
          if (caMoyen > 0) setTauxHoraire(Math.round(caMoyen / 160)) // 160h/mois
        }
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [])

  const toggleWorkflow = (i: number) => {
    setWorkflows(prev => prev.map((w, idx) => idx === i ? { ...w, actif: !w.actif } : w))
  }

  const updateHeures = (i: number, val: number) => {
    setWorkflows(prev => prev.map((w, idx) => idx === i ? { ...w, heures_semaine: val } : w))
  }

  // Calculs
  const workflowsActifs     = workflows.filter(w => w.actif)
  const heuresSemaine       = workflowsActifs.reduce((s, w) => s + w.heures_semaine, 0)
  const heuresMois          = heuresSemaine * 4.33
  const heuresAn            = heuresMois * 12
  const valeurMois          = Math.round(heuresMois * tauxHoraire)
  const valeurAn            = Math.round(heuresAn * tauxHoraire)
  const roi                 = abonnement > 0 ? Math.round((valeurMois - abonnement) / abonnement * 100) : 0
  const paybackJours        = abonnement > 0 ? Math.round(abonnement / (valeurMois / 30)) : 0
  const multiplicateur      = abonnement > 0 ? (valeurMois / abonnement).toFixed(1) : '∞'

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1">Calculateur de rentabilité</h1>
        <p className="text-white/40 text-sm">Combien vaut vraiment ton abonnement VCEL ?</p>
      </div>

      {/* Paramètres */}
      <div className="card-glass p-6 mb-6">
        <h2 className="font-display font-semibold text-white text-sm mb-4 flex items-center gap-2">
          <Calculator size={14} className="text-blue-400" /> Tes paramètres
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">
              Ton taux horaire (€/h)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={20} max={300} step={5} value={tauxHoraire}
                onChange={e => setTauxHoraire(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-white font-bold text-lg w-16 text-right">{tauxHoraire}€</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">
              Abonnement VCEL (€/mois)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={19} max={199} step={10} value={abonnement}
                onChange={e => setAbonnement(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-white font-bold text-lg w-16 text-right">{abonnement}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs résultats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Heures libérées/mois', value: `${Math.round(heuresMois)}h`, sub: `${Math.round(heuresSemaine)}h/semaine`, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
          { label: 'Valeur générée/mois',  value: `${valeurMois.toLocaleString('fr-FR')}€`, sub: `à ${tauxHoraire}€/h`, color: 'text-green-400', bg: 'bg-green-500/10', icon: Euro },
          { label: 'ROI mensuel',          value: `${roi}%`, sub: `x${multiplicateur} ton invest.`, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: TrendingUp },
          { label: 'Rentable en',          value: `${paybackJours}j`, sub: 'de chaque mois', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Zap },
        ].map(k => (
          <div key={k.label} className="card-glass p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-white/40 text-xs">{k.label}</p>
              <div className={`w-6 h-6 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon size={12} className={k.color} />
              </div>
            </div>
            <p className={`font-display text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-white/30 text-xs mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Résumé valeur annuelle */}
      <div className="card-glass p-5 mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs mb-1">Valeur totale récupérée cette année</p>
            <p className="font-display text-3xl font-bold text-white">{valeurAn.toLocaleString('fr-FR')}€</p>
            <p className="text-white/30 text-xs mt-1">pour {Math.round(heuresAn)}h libérées — coût abonnement : {(abonnement * 12).toLocaleString('fr-FR')}€/an</p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-xs mb-1">Gain net annuel</p>
            <p className="font-display text-2xl font-bold text-green-400">
              +{(valeurAn - abonnement * 12).toLocaleString('fr-FR')}€
            </p>
          </div>
        </div>
      </div>

      {/* Workflows détail */}
      <div className="card-glass p-6">
        <h2 className="font-display font-semibold text-white text-sm mb-4 flex items-center gap-2">
          <Zap size={14} className="text-blue-400" /> Détail par workflow
          <span className="text-white/20 text-xs font-normal ml-auto flex items-center gap-1">
            <Info size={11} /> Ajuste les heures selon ton usage réel
          </span>
        </h2>
        <div className="space-y-2">
          {workflows.map((w, i) => (
            <div key={i} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all ${w.actif ? 'bg-white/3' : 'opacity-40'}`}>
              <button onClick={() => toggleWorkflow(i)}
                className={`w-4 h-4 rounded border-2 shrink-0 transition-all flex items-center justify-center ${
                  w.actif ? 'bg-blue-500 border-blue-500' : 'border-white/20'
                }`}>
                {w.actif && <span className="text-white text-xs">✓</span>}
              </button>
              <span className="text-white/70 text-xs flex-1">{w.nom}</span>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number" min={0} max={20} step={0.5} value={w.heures_semaine}
                  onChange={e => updateHeures(i, Number(e.target.value))}
                  disabled={!w.actif}
                  className="w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-white/30 text-xs w-12">h/sem</span>
                <span className="text-green-400 text-xs font-medium w-16 text-right">
                  +{Math.round(w.heures_semaine * 4.33 * tauxHoraire)}€/mois
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 mt-3 pt-3 flex items-center justify-between">
          <span className="text-white/40 text-xs">{workflowsActifs.length} workflows actifs</span>
          <span className="text-white font-semibold text-sm">
            Total : <span className="text-green-400">{valeurMois.toLocaleString('fr-FR')}€/mois</span>
          </span>
        </div>
      </div>
    </div>
  )
}
