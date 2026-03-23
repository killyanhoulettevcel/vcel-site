'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Users, FileText, Zap, User, ChevronRight, ArrowUpRight, RefreshCw } from 'lucide-react'

interface Dimension {
  id: string
  label: string
  pts: number
  max: number
  icon: React.ElementType
  couleur: string
  bg: string
  ring: string
  message: string
  action: string
  href: string
}

interface ScoreData {
  total: number
  dimensions: Dimension[]
  lastUpdated: Date
}

function computeScore(data: {
  caData: any[]
  leads: any[]
  factures: any[]
  workflows: any[]
  profil: any
}): ScoreData {
  const { caData, leads, factures, workflows, profil } = data
  const now = new Date()
  const moisActuel = now.toISOString().slice(0, 7)

  // --- CA (30 pts) ---
  let caScore = 0
  const dernierMois = caData[caData.length - 1]
  const avantDernier = caData[caData.length - 2]
  if (caData.length > 0) caScore += 15
  if (caData.length >= 3) caScore += 5
  if (dernierMois && avantDernier && dernierMois.ca_ht > avantDernier.ca_ht) caScore += 10
  else if (dernierMois && dernierMois.ca_ht > 0) caScore += 5
  const caMessage = caScore >= 25 ? 'CA en progression — continuez ainsi !'
    : caScore >= 15 ? 'CA renseigné, ajoutez plusieurs mois pour voir la tendance'
    : 'Renseignez votre CA pour débloquer les insights financiers'
  const caAction = caScore >= 25 ? 'Voir les finances' : 'Saisir mon CA'

  // --- Leads (25 pts) ---
  let leadsScore = 0
  const leadsCeMois = leads.filter((l: any) => l.date?.startsWith(moisActuel))
  const leadsConvertis = leads.filter((l: any) => l.statut === 'converti')
  const tauxConversion = leads.length > 0 ? leadsConvertis.length / leads.length : 0
  if (leads.length > 0) leadsScore += 10
  if (leadsCeMois.length >= 3) leadsScore += 8
  else if (leadsCeMois.length >= 1) leadsScore += 4
  if (tauxConversion >= 0.2) leadsScore += 7
  else if (tauxConversion >= 0.1) leadsScore += 3
  const leadsMessage = leadsScore >= 20 ? `Excellent taux de conversion (${Math.round(tauxConversion * 100)}%)`
    : leadsScore >= 10 ? `${leads.length} leads — travaillez la conversion`
    : 'Commencez à tracker vos prospects dans le CRM'
  const leadsAction = leads.length === 0 ? 'Ajouter un lead' : 'Voir le CRM'

  // --- Factures (20 pts) ---
  let facturesScore = 20
  const enRetard = factures.filter((f: any) => f.statut === 'en retard')
  const enAttente = factures.filter((f: any) => f.statut === 'en attente')
  facturesScore -= enRetard.length * 7
  facturesScore -= enAttente.length * 2
  facturesScore = Math.max(0, Math.min(20, facturesScore))
  if (factures.length === 0) facturesScore = 5
  const facturesMessage = enRetard.length > 0 ? `${enRetard.length} facture${enRetard.length > 1 ? 's' : ''} en retard — relancez vos clients`
    : enAttente.length > 0 ? `${enAttente.length} facture${enAttente.length > 1 ? 's' : ''} en attente de paiement`
    : factures.length > 0 ? 'Toutes vos factures sont à jour ✓'
    : 'Créez votre première facture'
  const facturesAction = enRetard.length > 0 ? 'Relancer les impayés' : factures.length === 0 ? 'Créer une facture' : 'Voir les factures'

  // --- Workflows (15 pts) ---
  const wfActifs = workflows.filter((w: any) => w.statut === 'ok').length
  const wfTotal = Math.max(workflows.length, 8)
  const wfScore = Math.round((wfActifs / wfTotal) * 15)
  const workflowsMessage = wfActifs === 0 ? 'Aucune automatisation active — vous perdez du temps !'
    : wfActifs >= 6 ? `${wfActifs} automatisations actives — votre business tourne seul`
    : `${wfActifs}/${wfTotal} workflows actifs — activez-en plus`
  const workflowsAction = wfActifs === 0 ? 'Activer mes workflows' : 'Gérer les workflows'

  // --- Profil (10 pts) ---
  let profilScore = 0
  if (profil?.nom) profilScore += 4
  if (profil?.secteur) profilScore += 3
  if (profil?.email) profilScore += 3
  const profilMessage = profilScore >= 8 ? 'Profil complet ✓'
    : profilScore >= 4 ? 'Profil partiellement renseigné'
    : 'Complétez votre profil pour personnaliser vos rapports'
  const profilAction = profilScore >= 8 ? 'Voir le profil' : 'Compléter le profil'

  const total = caScore + leadsScore + facturesScore + wfScore + profilScore

  const dimensions: Dimension[] = [
    {
      id: 'ca', label: 'Finances', pts: caScore, max: 30,
      icon: TrendingUp, couleur: 'text-cyan-600', bg: 'bg-cyan-50', ring: 'ring-cyan-200',
      message: caMessage, action: caAction, href: '/dashboard/client/finances',
    },
    {
      id: 'leads', label: 'Prospection', pts: leadsScore, max: 25,
      icon: Users, couleur: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-200',
      message: leadsMessage, action: leadsAction, href: '/dashboard/client/leads',
    },
    {
      id: 'factures', label: 'Facturation', pts: facturesScore, max: 20,
      icon: FileText, couleur: facturesScore >= 15 ? 'text-emerald-600' : 'text-orange-500',
      bg: facturesScore >= 15 ? 'bg-emerald-50' : 'bg-orange-50',
      ring: facturesScore >= 15 ? 'ring-emerald-200' : 'ring-orange-200',
      message: facturesMessage, action: facturesAction, href: '/dashboard/client/factures',
    },
    {
      id: 'workflows', label: 'Automatisation', pts: wfScore, max: 15,
      icon: Zap, couleur: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200',
      message: workflowsMessage, action: workflowsAction, href: '/dashboard/client/workflows',
    },
    {
      id: 'profil', label: 'Profil', pts: profilScore, max: 10,
      icon: User, couleur: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200',
      message: profilMessage, action: profilAction, href: '/dashboard/client/profil',
    },
  ]

  return { total, dimensions, lastUpdated: new Date() }
}

function getScoreLabel(score: number): { label: string; color: string; bg: string; desc: string } {
  if (score >= 85) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500', desc: 'Votre business est en pleine santé' }
  if (score >= 65) return { label: 'Bon', color: 'text-cyan-600', bg: 'bg-cyan-500', desc: 'Quelques axes à optimiser' }
  if (score >= 40) return { label: 'À améliorer', color: 'text-orange-500', bg: 'bg-orange-400', desc: 'Des actions prioritaires à mener' }
  return { label: 'Critique', color: 'text-red-500', bg: 'bg-red-400', desc: 'Votre business a besoin d\'attention' }
}

export default function ScoreSante() {
  const [score, setScore] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAndCompute = async () => {
    setRefreshing(true)
    try {
      const [caData, leads, factures, workflows, profil] = await Promise.all([
        fetch('/api/ca').then(r => r.ok ? r.json() : []),
        fetch('/api/leads').then(r => r.ok ? r.json() : []),
        fetch('/api/factures').then(r => r.ok ? r.json() : []),
        fetch('/api/workflows').then(r => r.ok ? r.json() : []),
        fetch('/api/profil').then(r => r.ok ? r.json() : null),
      ])
      setScore(computeScore({ caData, leads, factures, workflows, profil }))
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchAndCompute() }, [])

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="w-5 h-5 border-2 border-[var(--border-hover)] border-t-navy-700 rounded-full animate-spin" />
        Calcul de votre score...
      </div>
    </div>
  )

  if (!score) return null

  const { label, color, bg, desc } = getScoreLabel(score.total)
  const circumference = 2 * Math.PI * 52
  const dashOffset = circumference - (score.total / 100) * circumference

  return (
    <div className="p-4 md:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl text-[var(--navy)] mb-1">
          Score de santé
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Évaluation automatique de votre business en temps réel
        </p>
      </div>

      {/* Score principal */}
      <div className="card-glass p-6 md:p-8 mb-6 flex flex-col md:flex-row items-center gap-8">
        {/* Cercle SVG animé */}
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
            {/* Fond */}
            <circle cx="70" cy="70" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
            {/* Arc coloré */}
            <circle
              cx="70" cy="70" r="52"
              fill="none"
              stroke={score.total >= 85 ? '#10b981' : score.total >= 65 ? '#06b6d4' : score.total >= 40 ? '#f97316' : '#ef4444'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
            />
          </svg>
          {/* Valeur centrale */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-4xl font-bold ${color}`}>{score.total}</span>
            <span className="text-[var(--text-muted)] text-xs font-medium">/100</span>
          </div>
        </div>

        {/* Texte */}
        <div className="flex-1 text-center md:text-left">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${color} bg-current/10`}
            style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}>
            <span className={`w-2 h-2 rounded-full ${bg}`} />
            <span className={color}>{label}</span>
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--navy)] mb-1">{desc}</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Basé sur vos finances, prospects, factures, automatisations et profil.
          </p>
          <button
            onClick={fetchAndCompute}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--navy)] transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Recalculer
          </button>
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        {score.dimensions.map((dim) => {
          const pct = Math.round((dim.pts / dim.max) * 100)
          const isExpanded = expanded === dim.id

          return (
            <div
              key={dim.id}
              className="card-glass overflow-hidden cursor-pointer hover:border-[var(--border-hover)] transition-all"
              onClick={() => setExpanded(isExpanded ? null : dim.id)}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Icône */}
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${dim.bg} ring-1 ${dim.ring}`}>
                  <dim.icon size={15} className={dim.couleur} />
                </div>

                {/* Barre + label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[var(--text-primary)] text-sm font-semibold">{dim.label}</span>
                    <span className={`text-xs font-bold ${dim.couleur}`}>{dim.pts}<span className="text-[var(--text-muted)] font-normal">/{dim.max}</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 80 ? 'bg-emerald-400'
                        : pct >= 50 ? 'bg-cyan-400'
                        : pct >= 25 ? 'bg-orange-400'
                        : 'bg-red-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <ChevronRight
                  size={15}
                  className={`text-[var(--text-light)] transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                />
              </div>

              {/* Détail expandé */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 ml-13">
                  <div className="flex items-start justify-between gap-4 ml-[52px]">
                    <p className="text-[var(--text-muted)] text-xs leading-relaxed flex-1">{dim.message}</p>
                    <a
                      href={dim.href}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--navy)] whitespace-nowrap border border-[var(--border)] hover:border-[var(--border-hover)] px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      {dim.action} <ArrowUpRight size={10} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer tip */}
      <div className="mt-6 p-4 rounded-2xl bg-[var(--navy)]/3 border border-[var(--border)]">
        <p className="text-[var(--text-muted)] text-xs text-center">
          💡 Le score se recalcule automatiquement à chaque visite. Pour progresser, cliquez sur chaque dimension.
        </p>
      </div>
    </div>
  )
}