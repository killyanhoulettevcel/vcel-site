'use client'
import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  Plus, Trash2, Save, ArrowLeft, Check, AlertCircle,
  ChevronDown, Info, Copy, FileText
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ligne {
  id: string
  description: string
  quantite: number
  prix_unitaire: number
  taux_tva: number
  total_ht: number
}

interface FormFacture {
  type_facture:          'facture' | 'avoir' | 'acompte' | 'proforma'
  numero_facture:        string
  date_facture:          string
  date_echeance:         string
  objet:                 string
  // Client
  client_nom:            string
  client_email:          string
  client_adresse:        string
  client_siret:          string
  client_tva_intra:      string
  // Lignes
  lignes:                Ligne[]
  // Montants (calculés)
  montant_ht:            number
  tva:                   number
  montant_ttc:           number
  acompte_pct:           string
  facture_ref_id:        string
  // Conditions
  conditions_paiement:   string
  mentions_legales:      string
  statut:                'payée' | 'en attente' | 'en retard'
}

interface Produit {
  id: string; nom: string; prix_vente: number
  description?: string; categorie?: string
}

interface Profil {
  nom: string; email: string; telephone?: string; site_web?: string
  siret?: string; forme_juridique?: string; adresse?: string
  code_postal?: string; ville?: string; tva_intracom?: string; iban?: string
}

const TVA_RATES = [0, 5.5, 10, 20]

const newLigne = (): Ligne => ({
  id: Math.random().toString(36).slice(2),
  description: '', quantite: 1, prix_unitaire: 0, taux_tva: 20, total_ht: 0,
})

const DEFAULT_CONDITIONS = 'Paiement à 30 jours fin de mois'
const PENALITES = "Tout retard de paiement entraîne des pénalités de retard au taux de 3 fois le taux d'intérêt légal en vigueur, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €."

// ─── Numérotation auto ────────────────────────────────────────────────────────

async function genererNumero(profil: Profil | null): Promise<string> {
  const now  = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  try {
    const res  = await fetch('/api/factures')
    const list = await res.json()
    const prefix = `F-${year}${month}-`
    const existing = (list as any[])
      .map(f => f.numero_facture)
      .filter((n: string) => n?.startsWith(prefix))
      .map((n: string) => parseInt(n.replace(prefix, '')) || 0)
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
    return `${prefix}${String(next).padStart(3, '0')}`
  } catch {
    return `F-${year}${month}-001`
  }
}

// ─── Composants ──────────────────────────────────────────────────────────────

function InputField({ label, required, children, hint }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider flex items-center gap-1"
        style={{ color: 'var(--text-muted)' }}>
        {label}{required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>{hint}</p>}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

function FormulaireFactureInner({ isEdit = false }: { isEdit?: boolean }) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const factureId = params?.id as string | undefined
  const typeParam        = (searchParams?.get('type')          || 'facture') as FormFacture['type_facture']
  const clientNomParam   = searchParams?.get('client_nom')    || ''
  const clientEmailParam = searchParams?.get('client_email')  || ''
  const clientAdrParam   = searchParams?.get('client_adresse') || ''

  const [profil,   setProfil]   = useState<Profil | null>(null)
  const [produits,  setProduits]  = useState<any[]>([])
  const [leads,     setLeads]     = useState<any[]>([])
  const [showProduits, setShowProduits] = useState<string | null>(null)
  const [showLeads, setShowLeads]   = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState('')
  const [error,    setError]    = useState('')
  const [factures, setFactures] = useState<any[]>([])  // Pour la liste des refs (avoir/acompte)

  const [form, setForm] = useState<FormFacture>({
    type_facture:        typeParam,
    numero_facture:      '',
    date_facture:        new Date().toISOString().split('T')[0],
    date_echeance:       '',
    objet:               '',
    client_nom:          '',
    client_email:        '',
    client_adresse:      '',
    client_siret:        '',
    client_tva_intra:    '',
    lignes:              [newLigne()],
    montant_ht:          0,
    tva:                 0,
    montant_ttc:         0,
    acompte_pct:         '',
    facture_ref_id:      '',
    conditions_paiement: DEFAULT_CONDITIONS,
    mentions_legales:    '',
    statut:              'en attente',
  })

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const [profilRes, facturesRes, produitsRes, leadsRes] = await Promise.all([
        fetch('/api/profil').then(r => r.ok ? r.json() : null),
        fetch('/api/factures').then(r => r.ok ? r.json() : []),
        fetch('/api/produits').then(r => r.ok ? r.json() : []),
        fetch('/api/leads').then(r => r.ok ? r.json() : []),
      ])
      setProduits(Array.isArray(produitsRes) ? produitsRes : [])
      setLeads(Array.isArray(leadsRes) ? leadsRes : [])
      setProfil(profilRes)
      setFactures(Array.isArray(facturesRes) ? facturesRes : [])

      // Mentions légales auto
      const mentions = profilRes?.tva_intracom
        ? `N° TVA intracommunautaire : ${profilRes.tva_intracom}`
        : "TVA non applicable — Article 293B du CGI"

      // Pré-remplir depuis un lead (bouton leads → créer facture)
      if (clientNomParam && !factureId) {
        setForm(prev => ({
          ...prev,
          client_nom:     clientNomParam,
          client_email:   clientEmailParam,
          client_adresse: clientAdrParam,
        }))
      }

      if (factureId) {
        // Mode édition : charger la facture existante
        const f = facturesRes.find((f: any) => f.id === factureId)
        if (f) {
          setForm({
            type_facture:        f.type_facture        || 'facture',
            numero_facture:      f.numero_facture      || '',
            date_facture:        f.date_facture        || '',
            date_echeance:       f.date_echeance       || '',
            objet:               f.objet               || '',
            client_nom:          f.client_nom          || '',
            client_email:        f.client_email        || '',
            client_adresse:      f.client_adresse      || '',
            client_siret:        f.client_siret        || '',
            client_tva_intra:    f.client_tva_intra    || '',
            lignes:              Array.isArray(f.lignes) && f.lignes.length > 0 ? f.lignes : [newLigne()],
            montant_ht:          f.montant_ht          || 0,
            tva:                 f.tva                 || 0,
            montant_ttc:         f.montant_ttc         || 0,
            acompte_pct:         f.acompte_pct         ? String(f.acompte_pct) : '',
            facture_ref_id:      f.facture_ref_id      || '',
            conditions_paiement: f.conditions_paiement || DEFAULT_CONDITIONS,
            mentions_legales:    f.mentions_legales    || mentions,
            statut:              f.statut              || 'en attente',
          })
        }
      } else {
        // Mode création : numéro auto + mentions légales
        const numero = await genererNumero(profilRes)
        const echeance = new Date()
        echeance.setDate(echeance.getDate() + 30)
        setForm(prev => ({
          ...prev,
          numero_facture:   numero,
          date_echeance:    echeance.toISOString().split('T')[0],
          mentions_legales: mentions,
        }))
      }
    }
    init()
  }, [factureId])

  // ── Calculs automatiques ──────────────────────────────────────────────────
  const recalculer = useCallback((lignes: Ligne[]) => {
    const updatedLignes = lignes.map(l => ({
      ...l,
      total_ht: Math.round(l.quantite * l.prix_unitaire * 100) / 100,
    }))
    const ht  = updatedLignes.reduce((s, l) => s + l.total_ht, 0)
    const tva = updatedLignes.reduce((s, l) => s + Math.round(l.total_ht * l.taux_tva / 100 * 100) / 100, 0)
    const ttc = Math.round((ht + tva) * 100) / 100

    // Si acompte : appliquer le %
    let montant_ht = ht, montant_tva = tva, montant_ttc = ttc
    if (form.type_facture === 'acompte' && form.acompte_pct) {
      const pct = parseFloat(form.acompte_pct) / 100
      montant_ht  = Math.round(ht  * pct * 100) / 100
      montant_tva = Math.round(tva * pct * 100) / 100
      montant_ttc = Math.round(ttc * pct * 100) / 100
    }
    // Si avoir : montants négatifs
    if (form.type_facture === 'avoir') {
      montant_ht  = -Math.abs(montant_ht)
      montant_tva = -Math.abs(montant_tva)
      montant_ttc = -Math.abs(montant_ttc)
    }

    setForm(prev => ({
      ...prev, lignes: updatedLignes,
      montant_ht, tva: montant_tva, montant_ttc,
    }))
    return updatedLignes
  }, [form.type_facture, form.acompte_pct])

  const updateLigne = (id: string, field: keyof Ligne, value: any) => {
    const lignes = form.lignes.map(l => l.id === id ? { ...l, [field]: value } : l)
    recalculer(lignes)
  }

  const addLigne     = () => recalculer([...form.lignes, newLigne()])
  const removeLigne  = (id: string) => recalculer(form.lignes.filter(l => l.id !== id))

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.numero_facture || !form.date_facture) {
      setError('Numéro et date obligatoires'); return
    }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        acompte_pct:    form.acompte_pct ? parseFloat(form.acompte_pct) : null,
        facture_ref_id: form.facture_ref_id || null,
      }
      const res = factureId
        ? await fetch('/api/factures', { method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: factureId, ...payload }) })
        : await fetch('/api/factures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      setSuccess('Facture sauvegardée !')
      setTimeout(() => router.push('/dashboard/client/factures'), 1000)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const TYPE_LABELS = { facture: 'Facture', avoir: 'Avoir', acompte: 'Acompte', proforma: 'Proforma' }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost p-2">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--navy)' }}>
              {factureId ? 'Modifier la facture' : 'Nouvelle facture'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {form.numero_facture || 'Numérotation automatique'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check size={14} /> {success}
            </span>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            Sauvegarder
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#DC2626' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="space-y-5">

        {/* ── Type + En-tête ── */}
        <div className="card-glass p-5 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {(['facture', 'acompte', 'avoir', 'proforma'] as const).map(t => (
              <button key={t}
                onClick={() => setForm(prev => ({ ...prev, type_facture: t }))}
                className="py-2.5 rounded-xl text-xs font-semibold transition-all border"
                style={{
                  background: form.type_facture === t ? 'var(--navy)' : 'transparent',
                  borderColor: form.type_facture === t ? 'var(--navy)' : 'var(--border)',
                  color: form.type_facture === t ? 'white' : 'var(--text-muted)',
                }}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField label="N° Facture" required>
              <div className="flex gap-2">
                <input value={form.numero_facture}
                  onChange={e => setForm(prev => ({ ...prev, numero_facture: e.target.value }))}
                  className="input-field font-mono" placeholder="F-202601-001" />
              </div>
            </InputField>
            <InputField label="Date" required>
              <input type="date" value={form.date_facture}
                onChange={e => setForm(prev => ({ ...prev, date_facture: e.target.value }))}
                className="input-field" />
            </InputField>
            <InputField label="Date d'échéance">
              <input type="date" value={form.date_echeance}
                onChange={e => setForm(prev => ({ ...prev, date_echeance: e.target.value }))}
                className="input-field" />
            </InputField>
          </div>

          {/* Objet */}
          <div className="mt-4">
            <InputField label="Objet / référence">
              <input value={form.objet}
                onChange={e => setForm(prev => ({ ...prev, objet: e.target.value }))}
                placeholder="Ex : Développement site web — Mission mars 2026"
                className="input-field" />
            </InputField>
          </div>

          {/* Avoir ou acompte : référence + % */}
          {form.type_facture === 'avoir' && (
            <div className="mt-4">
              <InputField label="Facture originale référencée">
                <select value={form.facture_ref_id}
                  onChange={e => setForm(prev => ({ ...prev, facture_ref_id: e.target.value }))}
                  className="input-field">
                  <option value="">Sélectionner une facture...</option>
                  {factures.filter(f => f.type_facture === 'facture' || !f.type_facture).map(f => (
                    <option key={f.id} value={f.id}>{f.numero_facture} — {f.client_nom || f.client_email}</option>
                  ))}
                </select>
              </InputField>
            </div>
          )}
          {form.type_facture === 'acompte' && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <InputField label="Facture associée">
                <select value={form.facture_ref_id}
                  onChange={e => setForm(prev => ({ ...prev, facture_ref_id: e.target.value }))}
                  className="input-field">
                  <option value="">Optionnel...</option>
                  {factures.map(f => (
                    <option key={f.id} value={f.id}>{f.numero_facture} — {f.client_nom}</option>
                  ))}
                </select>
              </InputField>
              <InputField label="Pourcentage d'acompte" hint="Ex : 30 pour un acompte de 30%">
                <div className="flex items-center gap-2">
                  <input type="number" min="1" max="100" value={form.acompte_pct}
                    onChange={e => {
                      setForm(prev => ({ ...prev, acompte_pct: e.target.value }))
                      recalculer(form.lignes)
                    }}
                    placeholder="30" className="input-field" />
                  <span className="text-sm font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>%</span>
                </div>
              </InputField>
            </div>
          )}
        </div>

        {/* ── Vendeur + Client ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Vendeur (depuis profil) */}
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label">Émetteur</p>
              <a href="/dashboard/client/parametres" className="text-xs" style={{ color: 'var(--cyan-dark)' }}>
                Modifier →
              </a>
            </div>
            {profil ? (
              <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {profil.nom}{profil.forme_juridique ? ` — ${profil.forme_juridique}` : ''}
                </p>
                {profil.adresse && <p>{profil.adresse}</p>}
                {(profil.code_postal || profil.ville) && <p>{profil.code_postal} {profil.ville}</p>}
                {profil.siret && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SIRET : {profil.siret}</p>}
                {profil.tva_intracom && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>TVA : {profil.tva_intracom}</p>}
                {profil.email && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{profil.email}</p>}
                {profil.telephone && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{profil.telephone}</p>}
                {!profil.siret && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs p-2 rounded-lg"
                    style={{ background: 'rgba(249,115,22,0.07)', color: '#EA580C' }}>
                    <AlertCircle size={11} className="mt-0.5 shrink-0" />
                    Complétez vos infos dans Paramètres → Facturation
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement…</p>
            )}
          </div>

          {/* Client */}
          <div className="card-glass p-5">
            <p className="section-label mb-4">Client</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Nom / Société" required>
                  <div className="relative">
                    <div className="flex gap-1.5">
                      <input value={form.client_nom}
                        onChange={e => {
                          setForm(prev => ({ ...prev, client_nom: e.target.value }))
                          setShowLeads(e.target.value.length >= 2)
                        }}
                        onFocus={() => setShowLeads(form.client_nom.length >= 2 || leads.length > 0)}
                        onBlur={() => setTimeout(() => setShowLeads(false), 200)}
                        placeholder="Jean Dupont ou sélectionner un lead…"
                        className="input-field flex-1" />
                    </div>
                    {showLeads && leads.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-full rounded-xl border shadow-lg z-20 overflow-auto"
                        style={{ background: 'white', borderColor: 'var(--border)', maxHeight: 200 }}>
                        {leads
                          .filter((l: any) => !form.client_nom || l.nom?.toLowerCase().includes(form.client_nom.toLowerCase()) || l.email?.toLowerCase().includes(form.client_nom.toLowerCase()))
                          .slice(0, 8)
                          .map((l: any) => (
                          <button key={l.id} type="button"
                            onMouseDown={() => {
                              setForm(prev => ({
                                ...prev,
                                client_nom:     l.nom || '',
                                client_email:   l.email || '',
                                client_adresse: l.entreprise || '',
                              }))
                              setShowLeads(false)
                            }}
                            className="w-full text-left px-3 py-2.5 text-xs hover:bg-[var(--bg-secondary)] transition-colors border-b last:border-0"
                            style={{ borderColor: 'var(--border)' }}>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{l.nom}</p>
                            <p style={{ color: 'var(--text-muted)' }}>{l.email}{l.entreprise ? ` · ${l.entreprise}` : ''}{l.score ? ` · ${l.score}` : ''}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </InputField>
                <InputField label="Email">
                  <input type="email" value={form.client_email}
                    onChange={e => setForm(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="jean@exemple.fr" className="input-field" />
                </InputField>
              </div>
              <InputField label="Adresse">
                <input value={form.client_adresse}
                  onChange={e => setForm(prev => ({ ...prev, client_adresse: e.target.value }))}
                  placeholder="12 rue de la Paix, 75001 Paris" className="input-field" />
              </InputField>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="SIRET client">
                  <input value={form.client_siret}
                    onChange={e => setForm(prev => ({ ...prev, client_siret: e.target.value }))}
                    placeholder="B2B uniquement" className="input-field" />
                </InputField>
                <InputField label="N° TVA client">
                  <input value={form.client_tva_intra}
                    onChange={e => setForm(prev => ({ ...prev, client_tva_intra: e.target.value }))}
                    placeholder="FR12..." className="input-field" />
                </InputField>
              </div>
            </div>
          </div>
        </div>

        {/* ── Lignes de facturation ── */}
        <div className="card-glass p-5 md:p-6">
          <p className="section-label mb-4">Prestations / Produits</p>

          {/* En-têtes */}
          <div className="hidden md:grid grid-cols-12 gap-3 mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-light)' }}>
            <div className="col-span-5">Description</div>
            <div className="col-span-1 text-right">Qté</div>
            <div className="col-span-2 text-right">P.U. HT</div>
            <div className="col-span-1 text-right">TVA</div>
            <div className="col-span-2 text-right">Total HT</div>
            <div className="col-span-1" />
          </div>

          <div className="space-y-2">
            {form.lignes.map((ligne, i) => (
              <div key={ligne.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl"
                style={{ background: 'var(--bg-secondary)' }}>
                <div className="col-span-12 md:col-span-5 relative">
                  <div className="flex gap-1.5">
                    <input value={ligne.description}
                      onChange={e => updateLigne(ligne.id, 'description', e.target.value)}
                      placeholder={`Prestation ${i + 1}…`}
                      className="input-field bg-white text-sm flex-1" />
                    {produits.length > 0 && (
                      <button type="button"
                        onClick={() => setShowProduits(showProduits === ligne.id ? null : ligne.id)}
                        title="Importer un produit"
                        className="px-2.5 rounded-lg border transition-colors shrink-0"
                        style={{ borderColor: 'var(--border)', background: showProduits === ligne.id ? 'rgba(79,195,247,0.10)' : 'var(--bg-secondary)', color: showProduits === ligne.id ? 'var(--cyan-dark)' : 'var(--text-muted)' }}>
                        <ShoppingBag size={13} />
                      </button>
                    )}
                  </div>
                  {showProduits === ligne.id && (
                    <div className="absolute top-full left-0 mt-1 w-full rounded-xl border shadow-lg z-20 overflow-auto"
                      style={{ background: 'white', borderColor: 'var(--border)', maxHeight: 180 }}>
                      {produits.map((p: any) => (
                        <button key={p.id} type="button"
                          onClick={() => {
                            updateLigne(ligne.id, 'description', p.nom)
                            updateLigne(ligne.id, 'prix_unitaire', p.prix_vente || 0)
                            setShowProduits(null)
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs hover:bg-[var(--bg-secondary)] transition-colors border-b last:border-0"
                          style={{ borderColor: 'var(--border)' }}>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.nom}</p>
                          <p style={{ color: 'var(--text-muted)' }}>{(p.prix_vente || 0).toLocaleString('fr-FR')} € HT{p.categorie ? ` · ${p.categorie}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-4 md:col-span-1">
                  <input type="number" min="0" step="0.5" value={ligne.quantite}
                    onChange={e => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                    className="input-field bg-white text-sm text-right" />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input type="number" min="0" step="0.01" value={ligne.prix_unitaire}
                    onChange={e => updateLigne(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                    className="input-field bg-white text-sm text-right" />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <select value={ligne.taux_tva}
                    onChange={e => updateLigne(ligne.id, 'taux_tva', parseInt(e.target.value))}
                    className="input-field bg-white text-sm">
                    {TVA_RATES.map(t => <option key={t} value={t}>{t}%</option>)}
                  </select>
                </div>
                <div className="col-span-10 md:col-span-2 text-right font-semibold text-sm"
                  style={{ color: 'var(--text-primary)' }}>
                  {fmt(ligne.total_ht)} €
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  {form.lignes.length > 1 && (
                    <button onClick={() => removeLigne(ligne.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: 'var(--text-light)' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button onClick={addLigne}
            className="mt-3 flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--cyan-dark)' }}>
            <Plus size={14} /> Ajouter une ligne
          </button>

          {/* Totaux */}
          <div className="mt-5 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span>Total HT</span>
              <span className="font-semibold">{fmt(form.montant_ht)} €</span>
            </div>
            {/* TVA par taux */}
            {TVA_RATES.filter(t => t > 0).map(taux => {
              const base = form.lignes.filter(l => l.taux_tva === taux).reduce((s, l) => s + l.total_ht, 0)
              if (base === 0) return null
              return (
                <div key={taux} className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>TVA {taux}%</span>
                  <span>{fmt(base * taux / 100)} €</span>
                </div>
              )
            })}
            {form.montant_ht !== 0 && form.tva === 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>TVA</span><span>Non applicable</span>
              </div>
            )}
            {form.type_facture === 'acompte' && form.acompte_pct && (
              <div className="flex justify-between text-sm font-medium" style={{ color: '#EA580C' }}>
                <span>Acompte {form.acompte_pct}%</span>
                <span>appliqué</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total TTC</span>
              <span className="font-display text-xl font-bold" style={{ color: 'var(--navy)' }}>
                {fmt(Math.abs(form.montant_ttc))} €{form.type_facture === 'avoir' ? ' (avoir)' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ── Conditions + Mentions légales ── */}
        <div className="card-glass p-5 md:p-6">
          <p className="section-label mb-4">Conditions & mentions légales</p>
          <div className="space-y-4">
            <InputField label="Conditions de paiement">
              <input value={form.conditions_paiement}
                onChange={e => setForm(prev => ({ ...prev, conditions_paiement: e.target.value }))}
                className="input-field" />
            </InputField>

            <InputField label="Mentions légales" hint="Pré-rempli selon votre statut TVA. Modifiable.">
              <textarea value={form.mentions_legales} rows={3}
                onChange={e => setForm(prev => ({ ...prev, mentions_legales: e.target.value }))}
                className="input-field resize-none" />
            </InputField>

            <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)', color: 'var(--text-muted)' }}>
              <Info size={12} className="shrink-0 mt-0.5" style={{ color: 'var(--cyan-dark)' }} />
              <span>
                Pénalités de retard automatiquement incluses sur le PDF : 3× le taux légal + indemnité forfaitaire 40 € (obligation légale B2B France).
              </span>
            </div>
          </div>
        </div>

        {/* ── Statut ── */}
        <div className="card-glass p-5">
          <p className="section-label mb-3">Statut de la facture</p>
          <div className="flex gap-2 flex-wrap">
            {(['en attente', 'payée', 'en retard'] as const).map(s => (
              <button key={s}
                onClick={() => setForm(prev => ({ ...prev, statut: s }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all border"
                style={{
                  background: form.statut === s
                    ? s === 'payée' ? 'rgba(34,197,94,0.10)' : s === 'en retard' ? 'rgba(239,68,68,0.10)' : 'rgba(79,195,247,0.10)'
                    : 'transparent',
                  borderColor: form.statut === s
                    ? s === 'payée' ? 'rgba(34,197,94,0.30)' : s === 'en retard' ? 'rgba(239,68,68,0.25)' : 'rgba(79,195,247,0.30)'
                    : 'var(--border)',
                  color: form.statut === s
                    ? s === 'payée' ? '#16A34A' : s === 'en retard' ? '#DC2626' : 'var(--cyan-dark)'
                    : 'var(--text-muted)',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pb-8">
          <button onClick={() => router.back()} className="btn-ghost flex-1 justify-center">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex-1 justify-center flex items-center gap-2">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save size={14} />}
            {factureId ? 'Enregistrer les modifications' : 'Créer la facture'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FormulaireFacture(props: { isEdit?: boolean }) {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>Chargement…</div>}>
      <FormulaireFactureInner {...props} />
    </Suspense>
  )
}