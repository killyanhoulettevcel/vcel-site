'use client'
import { useState, useEffect, useRef } from 'react'
import { Calculator, Info, TrendingDown, RefreshCw, ChevronDown, ChevronUp, Lightbulb, Save, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

type StatutJuridique = 'ae_bic' | 'ae_bnc' | 'eurl_is' | 'sasu' | 'ei_ir'

interface Regime {
  id: StatutJuridique; label: string; description: string; tauxURSSAF: number
  abattementForfaitaire?: number; tvaFranchise: boolean; seuilTVA: number; secteurs: string[]
}

interface SimuResult {
  caHT: number; urssaf: number; cfe: number; tvaCollectee: number; tvaDeductible: number
  tvaNette: number; revenuImposable: number; ir: number; netApresCharges: number
  tauxPrelevementGlobal: number; details: { label: string; montant: number; couleur: string; info: string }[]
}

interface SimuPrefs { statut: StatutJuridique; charges: number; tauxTVA: number; nbParts: number; remuneration: number }

const REGIMES: Regime[] = [
  { id: 'ae_bnc', label: 'Auto-entrepreneur (BNC)', description: 'Prestation de services, consultant, coach, freelance',
    tauxURSSAF: 21.2, abattementForfaitaire: 34, tvaFranchise: true, seuilTVA: 36800,
    secteurs: ['Coach / Formateur', 'Freelance', 'Consultant'] },
  { id: 'ae_bic', label: 'Auto-entrepreneur (BIC)', description: 'Vente de marchandises, e-commerce, artisan',
    tauxURSSAF: 12.3, abattementForfaitaire: 71, tvaFranchise: true, seuilTVA: 91900,
    secteurs: ['E-commerce'] },
  { id: 'ei_ir', label: 'EI / Entreprise individuelle (IR)', description: 'Régime réel — charges déductibles',
    tauxURSSAF: 45, tvaFranchise: false, seuilTVA: 0, secteurs: [] },
  { id: 'eurl_is', label: 'EURL / IS', description: 'Société à responsabilité limitée, imposition sur les sociétés',
    tauxURSSAF: 45, tvaFranchise: false, seuilTVA: 0, secteurs: ['Immobilier', 'PME'] },
  { id: 'sasu', label: 'SASU', description: 'Société par actions simplifiée unipersonnelle',
    tauxURSSAF: 75, tvaFranchise: false, seuilTVA: 0, secteurs: [] },
]

const BAREME_IR = [
  { plancher: 0, plafond: 11497, taux: 0 }, { plancher: 11497, plafond: 29315, taux: 0.11 },
  { plancher: 29315, plafond: 83823, taux: 0.30 }, { plancher: 83823, plafond: 180294, taux: 0.41 },
  { plancher: 180294, plafond: Infinity, taux: 0.45 },
]

function calculIR(rev: number, parts: number = 1) {
  const base = rev / parts
  let impot = 0
  for (const t of BAREME_IR) {
    if (base <= t.plancher) break
    impot += (Math.min(base, t.plafond) - t.plancher) * t.taux
  }
  return Math.max(0, Math.round(impot * parts))
}

function buildDetails(urssaf: number, is: number | null, ir: number, tva: number, cfe: number) {
  return [
    { label: 'URSSAF / Charges sociales', montant: urssaf, couleur: '#4FC3F7', info: 'Cotisations retraite, maladie, allocations familiales' },
    ...(is != null ? [{ label: 'Impôt sur les sociétés (IS)', montant: is, couleur: '#7C5CBF', info: "Taux réduit 15% jusqu'à 42 500 €, puis 25%" }] : []),
    { label: 'Impôt sur le revenu (IR)', montant: ir, couleur: '#F97316', info: 'Barème progressif 2025 selon quotient familial' },
    { label: 'TVA nette à reverser', montant: tva, couleur: '#10B981', info: 'TVA collectée − TVA déductible sur achats' },
    { label: 'CFE (taxe entreprise)', montant: cfe, couleur: '#64748B', info: 'Cotisation foncière des entreprises, montant moyen' },
  ].filter(d => d.montant > 0)
}

function simuler(caHT: number, statutId: StatutJuridique, charges: number, tauxTVA: number, nbParts: number, remuneration: number): SimuResult {
  const regime = REGIMES.find(r => r.id === statutId)!
  const assujetti = !regime.tvaFranchise || caHT > regime.seuilTVA
  const tvaCollectee = assujetti ? Math.round(caHT * tauxTVA / 100) : 0
  const tvaDeductible = assujetti ? Math.round(charges * tauxTVA / 100 * 0.6) : 0
  const tvaNette = Math.max(0, tvaCollectee - tvaDeductible)
  const cfe = 750

  if (statutId === 'ae_bic' || statutId === 'ae_bnc') {
    const urssaf = Math.round(caHT * regime.tauxURSSAF / 100)
    const revenuImposable = Math.max(0, caHT * (1 - (regime.abattementForfaitaire ?? 34) / 100) - urssaf)
    const ir = calculIR(revenuImposable, nbParts)
    const net = Math.max(0, caHT - urssaf - ir - tvaNette - cfe)
    const total = urssaf + ir + tvaNette + cfe
    return { caHT, urssaf, cfe, tvaCollectee, tvaDeductible, tvaNette, revenuImposable, ir, netApresCharges: net,
      tauxPrelevementGlobal: caHT > 0 ? Math.round(total / caHT * 100) : 0, details: buildDetails(urssaf, null, ir, tvaNette, cfe) }
  }
  if (statutId === 'ei_ir') {
    const benefice = Math.max(0, caHT - charges)
    const urssaf = Math.round(benefice * 0.45)
    const revenuImposable = Math.max(0, benefice - urssaf)
    const ir = calculIR(revenuImposable, nbParts)
    const net = Math.max(0, caHT - charges - urssaf - ir - tvaNette - cfe)
    const total = urssaf + ir + tvaNette + cfe
    return { caHT, urssaf, cfe, tvaCollectee, tvaDeductible, tvaNette, revenuImposable, ir, netApresCharges: net,
      tauxPrelevementGlobal: caHT > 0 ? Math.round(total / caHT * 100) : 0, details: buildDetails(urssaf, null, ir, tvaNette, cfe) }
  }
  const tauxCharges = statutId === 'sasu' ? 0.75 : 0.45
  const urssaf = Math.round(remuneration * tauxCharges)
  const beneficeAvantIS = Math.max(0, caHT - charges - remuneration - urssaf)
  const is = beneficeAvantIS <= 42500 ? Math.round(beneficeAvantIS * 0.15) : Math.round(42500 * 0.15 + (beneficeAvantIS - 42500) * 0.25)
  const revenuImposable = Math.max(0, remuneration - urssaf * 0.5)
  const ir = calculIR(revenuImposable, nbParts)
  const net = Math.max(0, caHT - charges - urssaf - is - ir - tvaNette - cfe)
  const total = urssaf + is + ir + tvaNette + cfe
  return { caHT, urssaf, cfe, tvaCollectee, tvaDeductible, tvaNette, revenuImposable, ir, netApresCharges: net,
    tauxPrelevementGlobal: caHT > 0 ? Math.round(total / caHT * 100) : 0, details: buildDetails(urssaf, is, ir, tvaNette, cfe) }
}

export default function SimulateurPage() {
  const [statut, setStatut] = useState<StatutJuridique>('ae_bnc')
  const [caAnnuel, setCaAnnuel] = useState(40000)
  const [charges, setCharges] = useState(5000)
  const [tauxTVA, setTauxTVA] = useState(20)
  const [nbParts, setNbParts] = useState(1)
  const [remuneration, setRemuneration] = useState(24000)
  const [showAvance, setShowAvance] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savedOk, setSavedOk] = useState(false)
  const [caSource, setCaSource] = useState<'manual' | 'auto'>('manual')
  const [conseil, setConseil] = useState('')
  const [loadingConseil, setLoadingConseil] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Chargement initial : profil + CA en parallèle ────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [profilRes, caRes] = await Promise.all([
          fetch('/api/profil').then(r => r.ok ? r.json() : null),
          fetch('/api/ca').then(r => r.ok ? r.json() : []),
        ])

        // 1. Restaurer les préfs sauvegardées
        const simuPrefs: SimuPrefs | undefined = profilRes?.preferences?.simulateur
        if (simuPrefs) {
          if (simuPrefs.statut)       setStatut(simuPrefs.statut)
          if (simuPrefs.charges)      setCharges(simuPrefs.charges)
          if (simuPrefs.tauxTVA)      setTauxTVA(simuPrefs.tauxTVA)
          if (simuPrefs.nbParts)      setNbParts(simuPrefs.nbParts)
          if (simuPrefs.remuneration) setRemuneration(simuPrefs.remuneration)
        } else if (profilRes?.secteur) {
          // 2. Déduire le statut depuis le secteur du profil
          const match = REGIMES.find(r => r.secteurs.includes(profilRes.secteur))
          if (match) setStatut(match.id)
        }

        // 3. CA réel importé automatiquement (12 derniers mois)
        const caArr = Array.isArray(caRes) ? caRes : []
        if (caArr.length > 0) {
          const totalCA = caArr.slice(-12).reduce((s: number, d: any) => s + (d.ca_ht || 0), 0)
          const totalCharges = caArr.slice(-12).reduce((s: number, d: any) => s + (d.charges || 0), 0)
          if (totalCA > 0) {
            setCaAnnuel(Math.round(totalCA))
            if (!simuPrefs?.charges && totalCharges > 0) setCharges(Math.round(totalCharges))
            setCaSource('auto')
          }
        }
      } catch {}
      setLoading(false)
    }
    init()
  }, [])

  // ── Sauvegarde auto debouncée 1.5s ───────────────────────────────────────
  const savePrefs = (patch: Partial<SimuPrefs> = {}) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const prefs: SimuPrefs = { statut, charges, tauxTVA, nbParts, remuneration, ...patch }
      try {
        const profilRes = await fetch('/api/profil').then(r => r.json())
        const existingPrefs = profilRes?.preferences || {}
        await fetch('/api/profil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: { ...existingPrefs, simulateur: prefs } }),
        })
        setSavedOk(true)
        setTimeout(() => setSavedOk(false), 2000)
      } catch {}
    }, 1500)
  }

  const updateStatut = (v: StatutJuridique) => { setStatut(v);       savePrefs({ statut: v }) }
  const updateCharges = (v: number)          => { setCharges(v);     savePrefs({ charges: v }) }
  const updateTauxTVA = (v: number)          => { setTauxTVA(v);    savePrefs({ tauxTVA: v }) }
  const updateNbParts = (v: number)          => { setNbParts(v);    savePrefs({ nbParts: v }) }
  const updateRem = (v: number)              => { setRemuneration(v); savePrefs({ remuneration: v }) }

  const rafraichirCA = async () => {
    const caRes = await fetch('/api/ca').then(r => r.ok ? r.json() : [])
    const caArr = Array.isArray(caRes) ? caRes : []
    if (caArr.length > 0) {
      const totalCA = caArr.slice(-12).reduce((s: number, d: any) => s + (d.ca_ht || 0), 0)
      if (totalCA > 0) { setCaAnnuel(Math.round(totalCA)); setCaSource('auto') }
    }
  }

  const demanderConseil = async () => {
    setLoadingConseil(true); setConseil('')
    try {
      const res = await fetch('/api/simulateur/conseil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, caAnnuel, charges, result, regime: regime.label }),
      })
      const data = await res.json()
      setConseil(data.conseil || '')
    } catch { setConseil('Impossible de charger le conseil pour le moment.') }
    setLoadingConseil(false)
  }

  const result = simuler(caAnnuel, statut, charges, tauxTVA, nbParts, remuneration)
  const regime = REGIMES.find(r => r.id === statut)!
  const isSociete = ['eurl_is', 'sasu'].includes(statut)
  const isAE = ['ae_bic', 'ae_bnc'].includes(statut)
  const pieData = [
    { name: 'Net perçu', value: result.netApresCharges, color: '#22C55E' },
    ...result.details.map(d => ({ name: d.label, value: d.montant, color: d.couleur })),
  ].filter(d => d.value > 0)
  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm">Chargement de vos données…</span>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,195,247,0.12)' }}>
            <Calculator size={20} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Simulateur charges & impôts</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Barèmes 2025 — paramètres sauvegardés automatiquement</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs transition-all" style={{ color: savedOk ? '#22C55E' : 'var(--text-muted)' }}>
          {savedOk ? <Check size={13} /> : <Save size={13} />}
          {savedOk ? 'Sauvegardé' : 'Auto-save actif'}
        </div>
      </div>

      {/* Bandeau CA importé */}
      {caSource === 'auto' && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.20)' }}>
          <span style={{ color: 'var(--cyan)' }}>
            ✓ CA importé automatiquement depuis vos données financières (12 derniers mois)
          </span>
          <button onClick={rafraichirCA} className="text-xs underline" style={{ color: 'var(--cyan)' }}>Rafraîchir</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Colonne gauche : Paramètres ── */}
        <div className="space-y-4">

          {/* Statut juridique */}
          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Statut juridique</h2>
            <div className="space-y-2">
              {REGIMES.map(r => (
                <button key={r.id} onClick={() => updateStatut(r.id)}
                  className="w-full text-left p-3 rounded-xl border transition-all"
                  style={{ background: statut === r.id ? 'rgba(79,195,247,0.08)' : 'transparent', borderColor: statut === r.id ? 'var(--cyan)' : 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.label}</span>
                    {statut === r.id && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--cyan)' }} />}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Revenus & charges */}
          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenus & charges</h2>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>CA annuel HT</label>
                  {caSource === 'manual' && (
                    <button onClick={rafraichirCA} className="text-xs flex items-center gap-1" style={{ color: 'var(--cyan)' }}>
                      <RefreshCw size={11} /> Importer depuis mes finances
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={300000} step={1000} value={caAnnuel}
                    onChange={e => setCaAnnuel(+e.target.value)} className="flex-1" />
                  <input type="number" value={caAnnuel} onChange={e => setCaAnnuel(+e.target.value)}
                    className="w-28 text-right text-sm font-semibold rounded-lg px-3 py-2 border"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  soit {fmt(Math.round(caAnnuel / 12))} / mois{caSource === 'auto' && ' · depuis vos données CA'}
                </p>
              </div>

              {isAE ? (
                <div className="px-3 py-2.5 rounded-lg text-xs" style={{ background: 'rgba(79,195,247,0.06)', color: 'var(--text-muted)' }}>
                  Abattement forfaitaire {regime.abattementForfaitaire}% appliqué — pas besoin de saisir vos charges réelles en AE.
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                    Charges annuelles HT <span className="font-normal">(loyer, matériel, abonnements…)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100000} step={500} value={charges}
                      onChange={e => updateCharges(+e.target.value)} className="flex-1" />
                    <input type="number" value={charges} onChange={e => updateCharges(+e.target.value)}
                      className="w-28 text-right text-sm font-semibold rounded-lg px-3 py-2 border"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
              )}

              {isSociete && (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Rémunération annuelle du dirigeant</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={150000} step={1000} value={remuneration}
                      onChange={e => updateRem(+e.target.value)} className="flex-1" />
                    <input type="number" value={remuneration} onChange={e => updateRem(+e.target.value)}
                      className="w-28 text-right text-sm font-semibold rounded-lg px-3 py-2 border"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options avancées */}
          <div className="card-glass p-5">
            <button onClick={() => setShowAvance(!showAvance)}
              className="w-full flex items-center justify-between text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}>
              <span>Options avancées</span>
              {showAvance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showAvance && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Taux TVA applicable</label>
                  <div className="flex gap-2">
                    {[0, 5.5, 10, 20].map(t => (
                      <button key={t} onClick={() => updateTauxTVA(t)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium transition-all border"
                        style={{ background: tauxTVA === t ? 'rgba(79,195,247,0.10)' : 'transparent', borderColor: tauxTVA === t ? 'var(--cyan)' : 'var(--border)', color: tauxTVA === t ? 'var(--cyan)' : 'var(--text-muted)' }}>
                        {t === 0 ? 'Exonéré' : `${t}%`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    Quotient familial <span title="1 = célibataire, 2 = couple, +0.5 par enfant"><Info size={12} /></span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 1.5, 2, 2.5, 3].map(p => (
                      <button key={p} onClick={() => updateNbParts(p)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium transition-all border"
                        style={{ background: nbParts === p ? 'rgba(79,195,247,0.10)' : 'transparent', borderColor: nbParts === p ? 'var(--cyan)' : 'var(--border)', color: nbParts === p ? 'var(--cyan)' : 'var(--text-muted)' }}>
                        {p} {p <= 1 ? 'part' : 'parts'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : Résultats ── */}
        <div className="space-y-4">
          <div className="card-glass p-6 text-center">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Net perçu estimé / an</p>
            <p className="text-4xl font-bold mb-1" style={{ color: '#22C55E' }}>{fmt(result.netApresCharges)}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>soit {fmt(Math.round(result.netApresCharges / 12))} / mois</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>
              <TrendingDown size={12} />{result.tauxPrelevementGlobal}% de prélèvements sur votre CA
            </div>
          </div>

          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Répartition de votre CA</h2>
            <div className="flex items-center gap-4">
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card-glass p-5">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Détail des prélèvements</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>CA annuel HT</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(result.caHT)}</span>
              </div>
              {result.details.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.couleur }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{d.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.info}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>− {fmt(d.montant)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Net perçu</span>
                <span className="text-sm font-bold" style={{ color: '#22C55E' }}>{fmt(result.netApresCharges)}</span>
              </div>
            </div>
          </div>

          {result.tvaCollectee > 0 && (
            <div className="card-glass p-5">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>TVA</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[{ label: 'Collectée', val: result.tvaCollectee, color: 'var(--text-primary)' },
                  { label: 'Déductible', val: result.tvaDeductible, color: '#22C55E' },
                  { label: 'À reverser', val: result.tvaNette, color: '#EF4444' }].map(({ label, val, color }) => (
                  <div key={label}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-base font-bold" style={{ color }}>{fmt(val)}</p>
                  </div>
                ))}
              </div>
              {isAE && caAnnuel <= regime.seuilTVA && (
                <p className="text-xs mt-3 p-2 rounded-lg" style={{ background: 'rgba(79,195,247,0.08)', color: 'var(--cyan)' }}>
                  Franchise en base de TVA active (CA &lt; {regime.seuilTVA.toLocaleString('fr-FR')} €)
                </p>
              )}
            </div>
          )}

          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Lightbulb size={15} style={{ color: 'var(--cyan)' }} /> Conseil IA personnalisé
              </h2>
              <button onClick={demanderConseil} disabled={loadingConseil}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(79,195,247,0.12)', color: 'var(--cyan)' }}>
                {loadingConseil ? 'Analyse…' : conseil ? 'Relancer' : 'Analyser'}
              </button>
            </div>
            {conseil
              ? <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{conseil}</p>
              : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Clique sur "Analyser" pour un conseil personnalisé selon ton statut et ton CA.</p>
            }
          </div>
        </div>
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-muted)' }}>
        Simulation indicative basée sur les barèmes fiscaux 2025. Non contractuelle. Consultez un comptable pour votre situation exacte.
      </p>
    </div>
  )
}