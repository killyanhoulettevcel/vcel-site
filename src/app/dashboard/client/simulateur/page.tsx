'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Calculator, TrendingDown, TrendingUp, RefreshCw, ChevronDown,
  ChevronUp, Sparkles, Check, Info, AlertTriangle, ArrowRight,
  PiggyBank, Landmark, Receipt, ShieldCheck
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'

// ─── Types & Barèmes ──────────────────────────────────────────────────────────

type StatutId = 'ae_bnc' | 'ae_bic' | 'ei_ir' | 'eurl_is' | 'sasu'

interface Regime {
  id: StatutId; label: string; tag: string; description: string
  tauxURSSAF: number; abattement?: number
  tvaFranchise: boolean; seuilTVA: number; secteurs: string[]
  avantages: string[]; limites: string[]
}

interface SimuPrefs { statut: StatutId; charges: number; tauxTVA: number; nbParts: number; remuneration: number }

const REGIMES: Regime[] = [
  { id: 'ae_bnc', label: 'Auto-entrepreneur', tag: 'BNC', description: 'Services, consulting, coaching, freelance',
    tauxURSSAF: 21.2, abattement: 34, tvaFranchise: true, seuilTVA: 36800,
    secteurs: ['Coach / Formateur', 'Freelance', 'Consultant'],
    avantages: ['Simplicité maximale', 'Pas de comptable obligatoire', 'Franchise TVA < 36 800 €'],
    limites: ['Plafond CA 77 700 €', 'Pas de déduction charges réelles', 'Protection sociale réduite'] },
  { id: 'ae_bic', label: 'Auto-entrepreneur', tag: 'BIC', description: 'Vente, e-commerce, artisanat',
    tauxURSSAF: 12.3, abattement: 71, tvaFranchise: true, seuilTVA: 91900,
    secteurs: ['E-commerce'],
    avantages: ['URSSAF réduit (12.3%)', 'Abattement 71%', 'Plafond 188 700 €'],
    limites: ['Activité commerciale uniquement', 'Pas de déduction charges réelles'] },
  { id: 'ei_ir', label: 'Entreprise individuelle', tag: 'IR', description: 'Régime réel, charges déductibles',
    tauxURSSAF: 45, tvaFranchise: false, seuilTVA: 0,
    secteurs: [],
    avantages: ['Charges déductibles au réel', 'Déficits imputables', 'Pas de capital minimum'],
    limites: ['Responsabilité illimitée', 'Charges sociales élevées', 'Comptabilité complète'] },
  { id: 'eurl_is', label: 'EURL', tag: 'IS', description: 'Société, responsabilité limitée',
    tauxURSSAF: 45, tvaFranchise: false, seuilTVA: 0,
    secteurs: ['Immobilier', 'PME'],
    avantages: ['IS réduit à 15% jusqu\'à 42 500 €', 'Responsabilité limitée', 'Dividendes optimisables'],
    limites: ['Comptabilité obligatoire', 'Charges TNS élevées', 'Coût de création'] },
  { id: 'sasu', label: 'SASU', tag: 'SA', description: 'Société par actions, assimilé salarié',
    tauxURSSAF: 75, tvaFranchise: false, seuilTVA: 0,
    secteurs: [],
    avantages: ['Protection sociale optimale', 'Assimilé salarié', 'Crédibilité accrue'],
    limites: ['Charges sociales très élevées (75%)', 'Coût de gestion', 'Frais de création'] },
]

const BAREME_IR = [
  { p: 0, q: 11497, t: 0 }, { p: 11497, q: 29315, t: .11 },
  { p: 29315, q: 83823, t: .30 }, { p: 83823, q: 180294, t: .41 },
  { p: 180294, q: Infinity, t: .45 },
]

function ir(rev: number, parts = 1) {
  const b = rev / parts; let i = 0
  for (const { p, q, t } of BAREME_IR) { if (b <= p) break; i += (Math.min(b, q) - p) * t }
  return Math.max(0, Math.round(i * parts))
}

function simuler(caHT: number, sid: StatutId, charges: number, tauxTVA: number, parts: number, rem: number) {
  const rg = REGIMES.find(r => r.id === sid)!
  const assujetti = !rg.tvaFranchise || caHT > rg.seuilTVA
  const tvaC = assujetti ? Math.round(caHT * tauxTVA / 100) : 0
  const tvaD = assujetti ? Math.round(charges * tauxTVA / 100 * .6) : 0
  const tvaN = Math.max(0, tvaC - tvaD)
  const cfe = 750

  if (sid === 'ae_bic' || sid === 'ae_bnc') {
    const urssaf = Math.round(caHT * rg.tauxURSSAF / 100)
    const revImp = Math.max(0, caHT * (1 - (rg.abattement ?? 34) / 100) - urssaf)
    const IR = ir(revImp, parts)
    const net = Math.max(0, caHT - urssaf - IR - tvaN - cfe)
    return { net, urssaf, is: 0, IR, tvaN, tvaC, tvaD, cfe, revImp, caHT,
      taux: caHT > 0 ? Math.round((urssaf + IR + tvaN + cfe) / caHT * 100) : 0 }
  }
  if (sid === 'ei_ir') {
    const bene = Math.max(0, caHT - charges)
    const urssaf = Math.round(bene * .45)
    const revImp = Math.max(0, bene - urssaf)
    const IR = ir(revImp, parts)
    const net = Math.max(0, caHT - charges - urssaf - IR - tvaN - cfe)
    return { net, urssaf, is: 0, IR, tvaN, tvaC, tvaD, cfe, revImp, caHT,
      taux: caHT > 0 ? Math.round((urssaf + IR + tvaN + cfe) / caHT * 100) : 0 }
  }
  const tc = sid === 'sasu' ? .75 : .45
  const urssaf = Math.round(rem * tc)
  const bIS = Math.max(0, caHT - charges - rem - urssaf)
  const IS = bIS <= 42500 ? Math.round(bIS * .15) : Math.round(42500 * .15 + (bIS - 42500) * .25)
  const revImp = Math.max(0, rem - urssaf * .5)
  const IR = ir(revImp, parts)
  const net = Math.max(0, caHT - charges - urssaf - IS - IR - tvaN - cfe)
  return { net, urssaf, is: IS, IR, tvaN, tvaC, tvaD, cfe, revImp, caHT,
    taux: caHT > 0 ? Math.round((urssaf + IS + IR + tvaN + cfe) / caHT * 100) : 0 }
}

// ─── Composants UI ────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const fmtp = (n: number) => `${n}%`

function Slider({ label, value, min, max, step, onChange, hint, suffix = '€' }: any) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</label>
        <div className="flex items-center gap-1">
          <input type="number" value={value} onChange={e => onChange(+e.target.value)}
            className="w-24 text-right text-sm font-bold rounded-lg px-2.5 py-1.5 border outline-none"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          {suffix !== '€' && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
        </div>
      </div>
      <div className="relative h-1.5 rounded-full mb-1.5" style={{ background: 'var(--border-hover)' }}>
        <div className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--cyan-dark), var(--cyan))' }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(+e.target.value)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
      </div>
      {hint && <p className="text-xs" style={{ color: 'var(--text-light)' }}>{hint}</p>}
    </div>
  )
}

function KpiMini({ label, value, sub, color = 'var(--text-primary)', icon: Icon, accent }: any) {
  return (
    <div className="card-glass p-4 relative overflow-hidden">
      {accent && <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-2xl" style={{ background: accent }} />}
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {Icon && <Icon size={13} style={{ color }} />}
      </div>
      <p className="font-display text-xl font-bold mb-0.5" style={{ color }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function SimulateurPage() {
  const [statut,       setStatut]      = useState<StatutId>('ae_bnc')
  const [caAnnuel,     setCaAnnuel]    = useState(40000)
  const [charges,      setCharges]     = useState(5000)
  const [tauxTVA,      setTauxTVA]     = useState(20)
  const [nbParts,      setNbParts]     = useState(1)
  const [remuneration, setRem]         = useState(24000)
  const [showAvance,   setShowAvance]  = useState(false)
  const [showDetail,   setShowDetail]  = useState(false)
  const [loading,      setLoading]     = useState(true)
  const [savedOk,      setSavedOk]     = useState(false)
  const [caSource,     setCaSource]    = useState<'manual' | 'auto'>('manual')
  const [conseil,      setConseil]     = useState('')
  const [loadingIA,    setLoadingIA]   = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const [profilRes, caRes] = await Promise.all([
          fetch('/api/profil').then(r => r.ok ? r.json() : null),
          fetch('/api/ca').then(r => r.ok ? r.json() : []),
        ])
        const prefs: SimuPrefs | undefined = profilRes?.preferences?.simulateur
        if (prefs) {
          if (prefs.statut)       setStatut(prefs.statut)
          if (prefs.charges)      setCharges(prefs.charges)
          if (prefs.tauxTVA)      setTauxTVA(prefs.tauxTVA)
          if (prefs.nbParts)      setNbParts(prefs.nbParts)
          if (prefs.remuneration) setRem(prefs.remuneration)
        } else if (profilRes?.secteur) {
          const match = REGIMES.find(r => r.secteurs.includes(profilRes.secteur))
          if (match) setStatut(match.id)
        }
        const caArr = Array.isArray(caRes) ? caRes : []
        if (caArr.length > 0) {
          const totalCA = caArr.slice(-12).reduce((s: number, d: any) => s + (d.ca_ht || 0), 0)
          const totalCh = caArr.slice(-12).reduce((s: number, d: any) => s + (d.charges || 0), 0)
          if (totalCA > 0) {
            setCaAnnuel(Math.round(totalCA))
            if (!prefs?.charges && totalCh > 0) setCharges(Math.round(totalCh))
            setCaSource('auto')
          }
        }
      } catch {}
      setLoading(false)
    }
    init()
  }, [])

  const save = (patch: Partial<SimuPrefs> = {}) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const prefs: SimuPrefs = { statut, charges, tauxTVA, nbParts, remuneration, ...patch }
      try {
        const p = await fetch('/api/profil').then(r => r.json())
        await fetch('/api/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: { ...(p?.preferences || {}), simulateur: prefs } }) })
        setSavedOk(true); setTimeout(() => setSavedOk(false), 2000)
      } catch {}
    }, 1500)
  }

  const upStatut = (v: StatutId)  => { setStatut(v);  save({ statut: v }) }
  const upCharges = (v: number)   => { setCharges(v); save({ charges: v }) }
  const upTVA = (v: number)       => { setTauxTVA(v); save({ tauxTVA: v }) }
  const upParts = (v: number)     => { setNbParts(v); save({ nbParts: v }) }
  const upRem = (v: number)       => { setRem(v);     save({ remuneration: v }) }

  const rafraichirCA = async () => {
    const d = await fetch('/api/ca').then(r => r.ok ? r.json() : [])
    const a = Array.isArray(d) ? d : []
    if (a.length > 0) {
      const t = a.slice(-12).reduce((s: number, x: any) => s + (x.ca_ht || 0), 0)
      if (t > 0) { setCaAnnuel(Math.round(t)); setCaSource('auto') }
    }
  }

  const analyserIA = async () => {
    setLoadingIA(true); setConseil('')
    try {
      const res = await fetch('/api/simulateur/conseil', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, caAnnuel, charges, result: R, regime: rg.label + ' ' + rg.tag })
      })
      setConseil((await res.json()).conseil || '')
    } catch { setConseil('Service temporairement indisponible.') }
    setLoadingIA(false)
  }

  const rg = REGIMES.find(r => r.id === statut)!
  const isAE = statut === 'ae_bnc' || statut === 'ae_bic'
  const isSociete = statut === 'eurl_is' || statut === 'sasu'
  const R = simuler(caAnnuel, statut, charges, tauxTVA, nbParts, remuneration)

  // Données graphique
  const COLORS = ['#22C55E', '#4FC3F7', '#7C5CBF', '#F97316', '#10B981', '#64748B']
  const pieSlices = [
    { name: 'Net perçu',          value: R.net,    color: '#22C55E' },
    { name: 'URSSAF',             value: R.urssaf, color: '#4FC3F7' },
    ...(R.is > 0 ? [{ name: 'IS', value: R.is,    color: '#7C5CBF' }] : []),
    { name: 'IR',                 value: R.IR,     color: '#F97316' },
    ...(R.tvaN > 0 ? [{ name: 'TVA', value: R.tvaN, color: '#10B981' }] : []),
    ...(R.cfe > 0 ? [{ name: 'CFE', value: R.cfe,   color: '#64748B' }] : []),
  ].filter(d => d.value > 0)

  const PRELEVEMENTS = [
    { label: 'URSSAF / Charges sociales', val: R.urssaf, color: '#4FC3F7', icon: ShieldCheck,
      info: isAE ? `${rg.tauxURSSAF}% sur CA brut` : 'Sur bénéfice ou rémunération selon statut' },
    ...(R.is > 0 ? [{ label: "Impôt sur les sociétés", val: R.is, color: '#7C5CBF', icon: Landmark,
      info: '15% jusqu\'à 42 500 € de bénéfice, 25% au-delà' }] : []),
    { label: 'Impôt sur le revenu', val: R.IR, color: '#F97316', icon: Receipt,
      info: `Barème progressif 2025 — ${nbParts} ${nbParts > 1 ? 'parts' : 'part'} fiscale${nbParts > 1 ? 's' : ''}` },
    ...(R.tvaN > 0 ? [{ label: 'TVA nette à reverser', val: R.tvaN, color: '#10B981', icon: ArrowRight,
      info: `${fmt(R.tvaC)} collectée − ${fmt(R.tvaD)} déductible` }] : []),
    { label: 'CFE', val: R.cfe, color: '#64748B', icon: Landmark, info: 'Cotisation foncière des entreprises' },
  ].filter(d => d.val > 0)

  // Score de pression fiscale (0-100 → bon si bas)
  const scorePression = Math.min(100, R.taux)
  const scoreCouleur = scorePression < 35 ? '#22C55E' : scorePression < 50 ? '#F97316' : '#EF4444'
  const scoreLabel = scorePression < 35 ? 'Optimisé' : scorePression < 50 ? 'Moyen' : 'Élevé'

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-96">
      <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-hover)', borderTopColor: 'var(--cyan)' }} />
        <span className="text-sm">Chargement de vos données…</span>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(2,136,209,0.08))' }}>
              <Calculator size={17} style={{ color: 'var(--cyan)' }} />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: 'var(--navy)' }}>
              Simulateur fiscal 2025
            </h1>
          </div>
          <p className="text-sm ml-11.5" style={{ color: 'var(--text-muted)' }}>
            Estimation indicative — barèmes officiels 2025
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {caSource === 'auto' && (
            <button onClick={rafraichirCA}
              className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5">
              <RefreshCw size={12} /> Rafraîchir CA
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all"
            style={{ borderColor: savedOk ? '#22C55E' : 'var(--border)', color: savedOk ? '#22C55E' : 'var(--text-muted)', background: savedOk ? 'rgba(34,197,94,0.06)' : 'transparent' }}>
            {savedOk ? <Check size={12} /> : <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--cyan)' }} />}
            {savedOk ? 'Sauvegardé' : 'Auto-save'}
          </div>
        </div>
      </div>

      {/* ── Bandeau CA importé ── */}
      {caSource === 'auto' && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
          style={{ background: 'rgba(79,195,247,0.07)', border: '1px solid rgba(79,195,247,0.18)' }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(79,195,247,0.15)' }}>
            <Check size={12} style={{ color: 'var(--cyan)' }} />
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>
            CA importé automatiquement depuis vos <strong>12 derniers mois</strong> — aucune saisie nécessaire.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ════ COLONNE GAUCHE — Paramètres (2/5) ════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Statut juridique */}
          <div className="card-glass p-5">
            <p className="section-label mb-3">Statut juridique</p>
            <div className="space-y-2">
              {REGIMES.map(r => {
                const active = statut === r.id
                return (
                  <button key={r.id} onClick={() => upStatut(r.id)}
                    className="w-full text-left rounded-xl border p-3.5 transition-all group"
                    style={{
                      background: active ? 'rgba(79,195,247,0.07)' : 'transparent',
                      borderColor: active ? 'rgba(79,195,247,0.35)' : 'var(--border)',
                      boxShadow: active ? '0 0 0 3px rgba(79,195,247,0.08)' : 'none',
                    }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: active ? 'var(--navy)' : 'var(--text-secondary)' }}>
                          {r.label}
                        </span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: active ? 'rgba(79,195,247,0.15)' : 'var(--bg-secondary)', color: active ? 'var(--cyan-dark)' : 'var(--text-muted)' }}>
                          {r.tag}
                        </span>
                      </div>
                      {active && <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--cyan)' }}>
                        <Check size={9} style={{ color: 'white' }} />
                      </div>}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Revenus */}
          <div className="card-glass p-5">
            <p className="section-label mb-4">Revenus & charges</p>
            <div className="space-y-5">
              <Slider label="CA annuel HT" value={caAnnuel} min={0} max={300000} step={1000}
                onChange={setCaAnnuel}
                hint={`${fmt(Math.round(caAnnuel / 12))} / mois${caSource === 'auto' ? ' · depuis vos données' : ''}`} />

              {isAE ? (
                <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs leading-relaxed"
                  style={{ background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.12)', color: 'var(--text-muted)' }}>
                  <Info size={13} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 1 }} />
                  Abattement forfaitaire {rg.abattement}% appliqué en AE — les charges réelles ne sont pas déductibles.
                </div>
              ) : (
                <Slider label="Charges annuelles HT" value={charges} min={0} max={150000} step={500}
                  onChange={upCharges} hint="Loyer, matériel, abonnements, comptable…" />
              )}

              {isSociete && (
                <Slider label="Rémunération dirigeant / an" value={remuneration} min={0} max={200000} step={1000}
                  onChange={upRem} hint="Salaire brut versé par la société" />
              )}
            </div>
          </div>

          {/* Options avancées */}
          <div className="card-glass overflow-hidden">
            <button onClick={() => setShowAvance(!showAvance)}
              className="w-full flex items-center justify-between p-5 text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}>
              <span className="flex items-center gap-2">
                <span className="section-label">Options avancées</span>
              </span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center transition-transform"
                style={{ background: 'var(--bg-secondary)', transform: showAvance ? 'rotate(180deg)' : 'none' }}>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </div>
            </button>
            {showAvance && (
              <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="pt-4">
                  <p className="text-xs font-medium mb-2.5" style={{ color: 'var(--text-muted)' }}>Taux TVA applicable</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[{ v: 0, l: 'Exonéré' }, { v: 5.5, l: '5,5%' }, { v: 10, l: '10%' }, { v: 20, l: '20%' }].map(({ v, l }) => (
                      <button key={v} onClick={() => upTVA(v)}
                        className="py-2 rounded-lg text-xs font-medium transition-all border"
                        style={{
                          background: tauxTVA === v ? 'rgba(79,195,247,0.10)' : 'transparent',
                          borderColor: tauxTVA === v ? 'rgba(79,195,247,0.40)' : 'var(--border)',
                          color: tauxTVA === v ? 'var(--cyan-dark)' : 'var(--text-muted)',
                        }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    Quotient familial
                    <span title="1 = célibataire, 2 = couple marié, +0.5 par enfant à charge" className="cursor-help opacity-60">
                      <Info size={11} />
                    </span>
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 1.5, 2, 2.5, 3].map(p => (
                      <button key={p} onClick={() => upParts(p)}
                        className="py-2 rounded-lg text-xs font-medium transition-all border"
                        style={{
                          background: nbParts === p ? 'rgba(79,195,247,0.10)' : 'transparent',
                          borderColor: nbParts === p ? 'rgba(79,195,247,0.40)' : 'var(--border)',
                          color: nbParts === p ? 'var(--cyan-dark)' : 'var(--text-muted)',
                        }}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Avantages / limites du statut */}
          <div className="card-glass p-5">
            <p className="section-label mb-3">{rg.label} {rg.tag}</p>
            <div className="space-y-1.5 mb-3">
              {rg.avantages.map(a => (
                <div key={a} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Check size={11} className="mt-0.5 shrink-0" style={{ color: '#22C55E' }} /> {a}
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              {rg.limites.map(l => (
                <div key={l} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: '#F97316' }} /> {l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ COLONNE DROITE — Résultats (3/5) ════ */}
        <div className="lg:col-span-3 space-y-4">

          {/* Hero KPI */}
          <div className="card-glass p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(79,195,247,0.06) 0%, transparent 70%)' }} />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6">

              {/* Jauge pression fiscale */}
              <div className="relative shrink-0 flex flex-col items-center">
                <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="var(--border-hover)" strokeWidth="9" />
                  <circle cx="60" cy="60" r="46" fill="none"
                    stroke={scoreCouleur} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 46}`}
                    strokeDashoffset={`${2 * Math.PI * 46 * (1 - scorePression / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold" style={{ color: scoreCouleur }}>{R.taux}%</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>prélevé</span>
                </div>
                <span className="text-xs font-semibold mt-1" style={{ color: scoreCouleur }}>{scoreLabel}</span>
              </div>

              {/* Chiffres clés */}
              <div className="flex-1">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Net perçu estimé / an</p>
                <p className="font-display text-4xl md:text-5xl font-bold mb-1" style={{ color: '#22C55E' }}>
                  {fmt(R.net)}
                </p>
                <p className="text-base font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {fmt(Math.round(R.net / 12))} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.875rem' }}>/ mois</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-red flex items-center gap-1">
                    <TrendingDown size={10} /> {fmt(R.urssaf + R.is + R.IR + R.tvaN + R.cfe)} prélevés
                  </span>
                  {isAE && caAnnuel <= rg.seuilTVA && (
                    <span className="badge badge-cyan flex items-center gap-1">
                      <Check size={10} /> Franchise TVA
                    </span>
                  )}
                  {R.IR === 0 && <span className="badge badge-green flex items-center gap-1"><Check size={10} /> IR nul</span>}
                </div>
              </div>
            </div>
          </div>

          {/* KPIs secondaires */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiMini label="URSSAF" value={fmt(R.urssaf)} sub={`${Math.round(R.urssaf / (caAnnuel || 1) * 100)}% du CA`}
              color="#4FC3F7" icon={ShieldCheck} accent="linear-gradient(90deg,#4FC3F7,#0288D1)" />
            <KpiMini label={R.is > 0 ? 'IS' : 'IR'} value={fmt(R.is > 0 ? R.is : R.IR)}
              sub={R.is > 0 ? 'Impôt société' : 'Impôt revenu'}
              color="#F97316" icon={Receipt} accent="linear-gradient(90deg,#F97316,#EA580C)" />
            <KpiMini label="TVA nette" value={R.tvaN > 0 ? fmt(R.tvaN) : '—'} sub={R.tvaN > 0 ? 'à reverser' : 'Franchise active'}
              color="#10B981" icon={Landmark} accent="linear-gradient(90deg,#10B981,#059669)" />
            <KpiMini label="Revenu imposable" value={fmt(R.revImp)} sub="base de calcul IR"
              color="var(--text-primary)" icon={PiggyBank} accent="linear-gradient(90deg,var(--navy),var(--navy-muted))" />
          </div>

          {/* Graphique + Détail */}
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label">Répartition du CA</p>
              <button onClick={() => setShowDetail(!showDetail)}
                className="text-xs flex items-center gap-1 transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                {showDetail ? 'Masquer' : 'Voir le détail'}
                <ChevronDown size={12} style={{ transform: showDetail ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Pie chart */}
              <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieSlices} cx="50%" cy="50%" innerRadius={42} outerRadius={72}
                      dataKey="value" strokeWidth={2} stroke="transparent" paddingAngle={2}>
                      {pieSlices.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [fmt(v), '']}
                      contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Légende */}
              <div className="flex-1 w-full space-y-2.5">
                {pieSlices.map((d, i) => {
                  const pct = caAnnuel > 0 ? Math.round(d.value / caAnnuel * 100) : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(d.value)}</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: d.color, opacity: 0.8 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Détail ligne par ligne */}
            {showDetail && (
              <div className="mt-5 pt-5 border-t space-y-0" style={{ borderColor: 'var(--border)' }}>
                <div className="table-row flex items-center justify-between py-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>CA annuel HT</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(caAnnuel)}</span>
                </div>
                {!isAE && charges > 0 && (
                  <div className="table-row flex items-center justify-between py-3">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Charges déductibles</span>
                    <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>− {fmt(charges)}</span>
                  </div>
                )}
                {PRELEVEMENTS.map((p, i) => (
                  <div key={i} className="table-row py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${p.color}18` }}>
                          <p.icon size={11} style={{ color: p.color }} />
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.label}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.info}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>− {fmt(p.val)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Net perçu</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>après toutes charges et impôts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: '#22C55E' }}>{fmt(R.net)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(Math.round(R.net / 12))}/mois</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TVA si applicable */}
          {R.tvaC > 0 && (
            <div className="card-glass p-5">
              <p className="section-label mb-4">TVA</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Collectée', val: R.tvaC, color: 'var(--text-primary)', bg: 'var(--bg-secondary)' },
                  { label: 'Déductible', val: R.tvaD, color: '#22C55E', bg: 'rgba(34,197,94,0.07)' },
                  { label: 'À reverser', val: R.tvaN, color: '#EF4444', bg: 'rgba(239,68,68,0.07)' },
                ].map(({ label, val, color, bg }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-base font-bold" style={{ color }}>{fmt(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conseil IA */}
          <div className="card-glass p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, var(--cyan-dark), var(--cyan), transparent)' }} />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(2,136,209,0.08))' }}>
                  <Sparkles size={13} style={{ color: 'var(--cyan)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Analyse IA</p>
              </div>
              <button onClick={analyserIA} disabled={loadingIA}
                className="btn-cyan text-xs py-2 px-3.5 flex items-center gap-1.5"
                style={{ opacity: loadingIA ? 0.7 : 1 }}>
                {loadingIA
                  ? <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Analyse…</>
                  : <><Sparkles size={11} /> {conseil ? 'Relancer' : 'Analyser'}</>}
              </button>
            </div>
            {conseil ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{conseil}</p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Obtenez un conseil personnalisé sur votre statut, les seuils à surveiller et les optimisations possibles.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs mt-8 text-center" style={{ color: 'var(--text-light)' }}>
        Simulation indicative basée sur les barèmes fiscaux 2025 — non contractuelle. Consultez un expert-comptable pour votre situation personnelle.
      </p>
    </div>
  )
}