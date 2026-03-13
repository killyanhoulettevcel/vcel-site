'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Plus, Zap, RefreshCw, AlertCircle, Target, BarChart2 } from 'lucide-react'

interface Suggestion {
  titre: string
  description: string
  action: string
  impact: 'fort' | 'moyen' | 'faible'
  type: 'hausse' | 'baisse' | 'nouveau'
}

interface PrixData {
  analyse: string
  score_sante: number
  suggestions: Suggestion[]
  objectif_ca: number
  conseil_rapide: string
  caMoyen: number
  tauxConversion: number
  montantMoyen: number
  margeMoyenne: number
  error?: string
}

const impactColor = {
  fort:   'text-green-400 bg-green-500/10 border-green-500/20',
  moyen:  'text-orange-400 bg-orange-500/10 border-orange-500/20',
  faible: 'text-white/40 bg-white/5 border-white/10',
}

const typeConfig = {
  hausse:  { icon: TrendingUp,   color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Hausse recommandée' },
  baisse:  { icon: TrendingDown, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Ajustement à la baisse' },
  nouveau: { icon: Plus,         color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Nouvelle offre' },
}

export default function PrixPage() {
  const [data,       setData]       = useState<PrixData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/prix')
      const json = await res.json()
      setData(json)
      setLastUpdate(new Date())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchSuggestions() }, [])

  const scoreColor = (s: number) => s >= 70 ? 'text-green-400' : s >= 40 ? 'text-orange-400' : 'text-red-400'
  const scoreBg    = (s: number) => s >= 70 ? 'bg-green-400'   : s >= 40 ? 'bg-orange-400'   : 'bg-red-400'

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Suggestions de prix</h1>
          <p className="text-white/40 text-sm">Analyse IA basée sur tes vrais produits et marges</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={fetchSuggestions} disabled={loading} className="btn-ghost text-sm py-2.5 px-4">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card-glass p-12 text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Analyse de tes produits en cours...</p>
          <p className="text-white/20 text-xs mt-1">GPT analyse tes prix, marges et ventes</p>
        </div>
      ) : data?.error ? (
        <div className="card-glass p-6 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{data.error}</p>
        </div>
      ) : data ? (
        <div className="space-y-5">
          {/* Score + stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card-glass p-5 col-span-1">
              <p className="text-white/40 text-xs mb-2">Score tarifaire</p>
              <p className={`font-display text-4xl font-bold ${scoreColor(data.score_sante)}`}>
                {data.score_sante}<span className="text-lg">/100</span>
              </p>
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${scoreBg(data.score_sante)} rounded-full transition-all duration-700`}
                  style={{ width: `${data.score_sante}%` }} />
              </div>
            </div>
            <div className="card-glass p-5">
              <p className="text-white/40 text-xs mb-1">CA moyen / mois</p>
              <p className="font-display text-2xl font-bold text-white">{data.caMoyen.toLocaleString('fr-FR')}€</p>
              <div className="flex items-center gap-1 mt-1">
                <Target size={11} className="text-blue-400" />
                <p className="text-blue-400 text-xs">Objectif : {data.objectif_ca?.toLocaleString('fr-FR')}€</p>
              </div>
            </div>
            <div className="card-glass p-5">
              <p className="text-white/40 text-xs mb-1">Panier moyen</p>
              <p className="font-display text-2xl font-bold text-white">{data.montantMoyen}€</p>
              <p className="text-white/30 text-xs mt-1">{data.tauxConversion}% conversion</p>
            </div>
            <div className="card-glass p-5">
              <p className="text-white/40 text-xs mb-1">Marge moy. produits</p>
              <p className={`font-display text-2xl font-bold ${
                (data.margeMoyenne || 0) >= 30 ? 'text-green-400' :
                (data.margeMoyenne || 0) >= 15 ? 'text-orange-400' : 'text-red-400'
              }`}>{data.margeMoyenne || 0}%</p>
              <p className="text-white/30 text-xs mt-1">
                {(data.margeMoyenne || 0) >= 30 ? 'Bonne marge ✓' : (data.margeMoyenne || 0) >= 15 ? 'À améliorer' : 'Marge faible ⚠️'}
              </p>
            </div>
          </div>

          {/* Analyse IA */}
          <div className="card-glass p-5 border-blue-500/15 bg-blue-500/5">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Zap size={13} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white text-xs font-semibold mb-1">Analyse IA</p>
                <p className="text-white/60 text-sm leading-relaxed">{data.analyse}</p>
              </div>
            </div>
          </div>

          {/* Conseil rapide */}
          <div className="card-glass p-4 flex items-center gap-3 border-yellow-500/15 bg-yellow-500/5">
            <span className="text-lg">💡</span>
            <p className="text-white/70 text-sm">{data.conseil_rapide}</p>
          </div>

          {/* Suggestions */}
          <div>
            <h2 className="font-display font-semibold text-white text-sm mb-3">
              {data.suggestions?.length} suggestions personnalisées
            </h2>
            <div className="space-y-3">
              {(data.suggestions || []).map((s, i) => {
                const cfg = typeConfig[s.type] || typeConfig['nouveau']
                return (
                  <div key={i} className="card-glass p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <cfg.icon size={15} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-white text-sm font-medium">{s.titre}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${impactColor[s.impact]}`}>
                            Impact {s.impact}
                          </span>
                          <span className="text-xs text-white/20">{cfg.label}</span>
                        </div>
                        <p className="text-white/50 text-xs mb-2">{s.description}</p>
                        <div className="flex items-start gap-1.5">
                          <span className="text-blue-400 text-xs mt-0.5">→</span>
                          <p className="text-blue-400 text-xs font-medium">{s.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
