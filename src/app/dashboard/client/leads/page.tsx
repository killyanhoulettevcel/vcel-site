'use client'
import React, { useState, useEffect } from 'react'
import {
  Users, Flame, Minus, Snowflake, Mail, Phone, Plus, Pencil, Trash2, X, Check,
  Search, RefreshCw, Download, Loader, AlertCircle, LayoutList, Kanban,
  Euro, TrendingUp, Clock, MessageSquare, PhoneCall, ArrowRight, Activity,
  ChevronRight, StickyNote, Star
} from 'lucide-react'
import { useRealtimeData } from '@/lib/useRealtimeData'
import { exportCSV } from '@/lib/exportCSV'

interface Lead {
  id: string
  nom: string
  email: string
  telephone: string
  entreprise: string
  secteur: string
  message: string
  notes: string
  score: 'chaud' | 'tiède' | 'froid'
  statut: 'nouveau' | 'contacté' | 'qualifié' | 'converti' | 'perdu'
  source: string
  date: string
  valeur_estimee: number
  probabilite: number
  created_at: string
  updated_at: string
}

interface Activite {
  id: string
  type: 'creation' | 'statut' | 'score' | 'note' | 'email' | 'appel' | 'relance'
  contenu: string
  meta?: any
  created_at: string
}

const scoreConfig = {
  chaud: { icon: Flame,     color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-100' },
  tiède: { icon: Minus,     color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  froid: { icon: Snowflake, color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100' },
}

const colonnes: { id: Lead['statut']; label: string; color: string; bg: string; dot: string; prob: number }[] = [
  { id: 'nouveau',  label: 'Nouveau',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100',     dot: 'bg-blue-400',   prob: 10 },
  { id: 'contacté', label: 'Contacté', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',   dot: 'bg-amber-400',  prob: 25 },
  { id: 'qualifié', label: 'Qualifié', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', dot: 'bg-purple-400', prob: 60 },
  { id: 'converti', label: 'Converti', color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100',dot: 'bg-emerald-400',prob: 100 },
  { id: 'perdu',    label: 'Perdu',    color: 'text-[var(--text-light)]', bg: 'bg-[var(--bg-secondary)] border-[var(--border)]', dot: 'bg-[var(--border-hover)]', prob: 0 },
]

const activiteConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  creation: { icon: Plus,          color: 'text-cyan-600',   label: 'Création' },
  statut:   { icon: ArrowRight,    color: 'text-purple-600', label: 'Statut' },
  score:    { icon: Star,          color: 'text-amber-600',  label: 'Score' },
  note:     { icon: StickyNote,    color: 'text-blue-600',   label: 'Note' },
  email:    { icon: Mail,          color: 'text-orange-600', label: 'Email' },
  appel:    { icon: PhoneCall,     color: 'text-emerald-600',label: 'Appel' },
  relance:  { icon: RefreshCw,     color: 'text-violet-600', label: 'Relance' },
}

const emptyForm = {
  nom: '', email: '', telephone: '', entreprise: '', secteur: '',
  message: '', notes: '', score: 'tiède' as const, source: 'Manuel',
  valeur_estimee: '', probabilite: '',
}

// ── Composant Fiche Lead ──────────────────────────────────────────────────────
function FicheLead({ lead, onClose, onUpdate, onDelete }: {
  lead: Lead
  onClose: () => void
  onUpdate: (id: string, updates: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [activites,    setActivites]    = useState<Activite[]>([])
  const [loadingActs,  setLoadingActs]  = useState(true)
  const [newNote,      setNewNote]      = useState('')
  const [newType,      setNewType]      = useState<'note' | 'appel' | 'email'>('note')
  const [savingNote,   setSavingNote]   = useState(false)
  const [editNotes,    setEditNotes]    = useState(false)
  const [notesVal,     setNotesVal]     = useState(lead.notes || '')
  const [valeur,       setValeur]       = useState(String(lead.valeur_estimee || ''))
  const [prob,         setProb]         = useState(String(lead.probabilite || ''))
  const [savingField,  setSavingField]  = useState(false)

  const col = colonnes.find(c => c.id === lead.statut)
  const sc  = scoreConfig[lead.score] || scoreConfig['tiède']

  useEffect(() => {
    fetch(`/api/lead-activites?lead_id=${lead.id}`)
      .then(r => r.json())
      .then(d => { setActivites(Array.isArray(d) ? d : []); setLoadingActs(false) })
  }, [lead.id])

  const addActivite = async () => {
    if (!newNote.trim()) return
    setSavingNote(true)
    const res = await fetch('/api/lead-activites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id, type: newType, contenu: newNote }),
    })
    const act = await res.json()
    setActivites(prev => [act, ...prev])
    setNewNote('')
    setSavingNote(false)
  }

  const saveField = async (field: string, value: any) => {
    setSavingField(true)
    await onUpdate(lead.id, { [field]: value })
    setSavingField(false)
  }

  const caPrevu = (parseFloat(valeur) || 0) * ((parseFloat(prob) || col?.prob || 0) / 100)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-xl h-full max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${sc.bg} border ${sc.border} flex items-center justify-center font-bold text-lg ${sc.color}`}>
              {lead.nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-bold text-[var(--navy)] text-lg">{lead.nom}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {lead.entreprise && <p className="text-[var(--text-muted)] text-xs">{lead.entreprise}</p>}
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${col?.bg} ${col?.color}`}>{lead.statut}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} font-medium`}>{lead.score}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onDelete(lead.id)} className="p-2 rounded-xl text-[var(--text-light)] hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-[var(--text-light)] hover:text-[var(--navy)] hover:bg-[var(--bg-secondary)] transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Infos de contact */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail, label: 'Email', val: lead.email },
                { icon: Phone, label: 'Téléphone', val: lead.telephone || '—' },
                { icon: Users, label: 'Secteur', val: lead.secteur || '—' },
                { icon: Activity, label: 'Source', val: lead.source || '—' },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-2">
                  <f.icon size={13} className="text-[var(--text-light)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[var(--text-light)] uppercase tracking-wide font-semibold">{f.label}</p>
                    <p className="text-[var(--text-secondary)] text-xs font-medium">{f.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Valeur estimée + Probabilité */}
          <div className="p-6 border-b border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">💰 Valeur commerciale</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">
                <p className="text-[var(--text-light)] text-xs mb-1">Valeur du deal</p>
                <div className="flex items-center gap-1">
                  <Euro size={12} className="text-[var(--text-muted)]" />
                  <input
                    type="number" value={valeur}
                    onChange={e => setValeur(e.target.value)}
                    onBlur={() => saveField('valeur_estimee', parseFloat(valeur) || 0)}
                    placeholder="0"
                    className="w-full bg-transparent text-[var(--navy)] text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">
                <p className="text-[var(--text-light)] text-xs mb-1">Proba. de signature</p>
                <div className="flex items-center gap-1">
                  <input
                    type="number" value={prob} min={0} max={100}
                    onChange={e => setProb(e.target.value)}
                    onBlur={() => saveField('probabilite', parseInt(prob) || 0)}
                    placeholder={String(col?.prob || 0)}
                    className="w-full bg-transparent text-[var(--navy)] text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[var(--text-muted)] text-xs shrink-0">%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-blue-600 text-xs mb-1">Valeur brute</p>
                <p className="text-blue-700 text-sm font-bold">{(parseFloat(valeur) || 0).toLocaleString('fr-FR')}€</p>
                <p className="text-blue-400 text-[10px]">Si le deal se signe</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <p className="text-emerald-600 text-xs mb-1">Valeur pondérée</p>
                <p className="text-emerald-700 text-sm font-bold">{caPrevu.toLocaleString('fr-FR')}€</p>
                <p className="text-emerald-400 text-[10px]">Valeur × probabilité</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">📝 Notes</p>
              <button onClick={() => setEditNotes(!editNotes)} className="text-xs text-cyan-600 hover:text-cyan-700">
                {editNotes ? 'Fermer' : 'Modifier'}
              </button>
            </div>
            {editNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesVal}
                  onChange={e => setNotesVal(e.target.value)}
                  rows={4}
                  placeholder="Notes internes sur ce lead..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-light)] focus:outline-none focus:border-cyan-400 resize-none"
                />
                <button
                  onClick={async () => { await saveField('notes', notesVal); setEditNotes(false) }}
                  disabled={savingField}
                  className="btn-primary text-xs py-2"
                >
                  {savingField ? <Loader size={12} className="animate-spin" /> : <><Check size={12} /> Sauvegarder</>}
                </button>
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-sm leading-relaxed whitespace-pre-wrap">
                {notesVal || <span className="text-[var(--text-light)] italic">Aucune note</span>}
              </p>
            )}
          </div>

          {/* Timeline activités */}
          <div className="p-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">⚡ Activité</p>

            {/* Ajouter une activité */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)] mb-4">
              <div className="flex gap-2 mb-2">
                {(['note', 'appel', 'email'] as const).map(t => {
                    const typeStyles = {
                      note:  { active: 'bg-blue-500 border-blue-500 text-white',   inactive: 'bg-blue-50 border-blue-100 text-blue-600' },
                      appel: { active: 'bg-emerald-500 border-emerald-500 text-white', inactive: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                      email: { active: 'bg-orange-500 border-orange-500 text-white',  inactive: 'bg-orange-50 border-orange-100 text-orange-600' },
                    }
                    const typeIcons = { note: <StickyNote size={10} />, appel: <PhoneCall size={10} />, email: <Mail size={10} /> }
                    return (
                    <button key={t} onClick={() => setNewType(t)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${
                        newType === t ? typeStyles[t].active : typeStyles[t].inactive
                      }`}>
                      {typeIcons[t]} {t}
                    </button>
                  )})}
              </div>
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addActivite()}
                  placeholder={`Ajouter une ${newType}...`}
                  className="flex-1 bg-white border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-cyan-400"
                />
                <button onClick={addActivite} disabled={savingNote || !newNote.trim()}
                  className="btn-primary px-3 py-2 text-xs disabled:opacity-40">
                  {savingNote ? <Loader size={12} className="animate-spin" /> : <Plus size={13} />}
                </button>
              </div>
            </div>

            {/* Liste activités */}
            {loadingActs ? (
              <div className="flex items-center gap-2 text-[var(--text-light)] text-xs py-4">
                <div className="w-3 h-3 border-2 border-[var(--border)] border-t-cyan-400 rounded-full animate-spin" />
                Chargement...
              </div>
            ) : activites.length === 0 ? (
              <p className="text-[var(--text-light)] text-xs italic">Aucune activité enregistrée</p>
            ) : (
              <div className="space-y-3">
                {activites.map(act => {
                  const cfg = activiteConfig[act.type] || activiteConfig.note
                  const isAuto = ['creation', 'statut', 'score'].includes(act.type)
                  return (
                    <div key={act.id} className="flex items-start gap-3 group">
                      <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                        <cfg.icon size={12} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{act.contenu}</p>
                        <p className="text-[var(--text-light)] text-[10px] mt-0.5">
                          {new Date(act.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!isAuto && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/lead-activites?id=${act.id}`, { method: 'DELETE' })
                            setActivites(prev => prev.filter(a => a.id !== act.id))
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[var(--text-light)] hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function LeadsPage() {
  const { data: leads, loading, lastUpdate, refresh } = useRealtimeData<Lead>('/api/leads', 'leads')

  const [vue,        setVue]        = useState<'kanban' | 'liste'>('kanban')
  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [editLead,   setEditLead]   = useState<Lead | null>(null)
  const [ficheLead,  setFicheLead]  = useState<Lead | null>(null)
  const [form,       setForm]       = useState(emptyForm)
  const [saving,     setSaving]     = useState(false)
  const [dragId,     setDragId]     = useState<string | null>(null)
  const [dragOver,   setDragOver]   = useState<string | null>(null)

  // Relance
  const [relancing,        setRelancing]        = useState<string | null>(null)
  const [relanceOk,        setRelanceOk]        = useState<string | null>(null)
  const [relanceErr,       setRelanceErr]       = useState<string | null>(null)
  const [showRelanceModal, setShowRelanceModal] = useState(false)
  const [relanceLead,      setRelanceLead]      = useState<Lead | null>(null)
  const [relanceMessage,   setRelanceMessage]   = useState('')

  const filtered = leads.filter(l =>
    !search ||
    l.nom.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    (l.entreprise || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditLead(null); setForm(emptyForm); setShowModal(true) }
  const openEdit   = (l: Lead) => {
    setEditLead(l)
    setForm({
      nom: l.nom, email: l.email, telephone: l.telephone, entreprise: l.entreprise,
      secteur: l.secteur, message: l.message, notes: l.notes || '', score: l.score,
      source: l.source, valeur_estimee: String(l.valeur_estimee || ''),
      probabilite: String(l.probabilite || ''),
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...form,
      valeur_estimee: parseFloat(form.valeur_estimee) || 0,
      probabilite:    parseInt(form.probabilite) || 0,
    }
    if (editLead) {
      await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editLead.id, ...payload }) })
    } else {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false); setShowModal(false); refresh()
  }

  const changeStatut = async (id: string, statut: string) => {
    await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }) })
    // Mettre à jour la fiche ouverte si c'est ce lead
    if (ficheLead?.id === id) setFicheLead(prev => prev ? { ...prev, statut: statut as Lead['statut'] } : null)
    refresh()
  }

  const updateLead = async (id: string, updates: any) => {
    await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
    refresh()
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Supprimer ce lead ?')) return
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
    if (ficheLead?.id === id) setFicheLead(null)
    refresh()
  }

  const openRelance = (l: Lead) => { setRelanceLead(l); setRelanceMessage(''); setRelanceErr(null); setShowRelanceModal(true) }

  const handleRelance = async () => {
    if (!relanceLead) return
    setRelancing(relanceLead.id); setRelanceErr(null)
    try {
      const res = await fetch('/api/emails', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'relance_lead', to: relanceLead.email, data: { nomLead: relanceLead.nom, message: relanceMessage || undefined } }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur envoi')
      setRelanceOk(relanceLead.id); setShowRelanceModal(false)
      await changeStatut(relanceLead.id, 'contacté')
      setTimeout(() => setRelanceOk(null), 3000)
    } catch (e: any) { setRelanceErr(e.message) }
    setRelancing(null)
  }

  const [isDragging, setIsDragging] = useState(false)
  const dragMoved = React.useRef(false)

  const onDragStart = (id: string) => { setDragId(id); setIsDragging(true); dragMoved.current = false }
  const onDragEnd   = () => { setDragId(null); setDragOver(null); setTimeout(() => setIsDragging(false), 50) }
  const onDrop      = async (statut: string) => {
    if (dragId) await changeStatut(dragId, statut)
    setDragId(null); setDragOver(null)
  }

  // Stats
  const chauds    = leads.filter(l => l.score === 'chaud').length
  const convertis = leads.filter(l => l.statut === 'converti').length
  const tauxConv  = leads.length > 0 ? Math.round(convertis / leads.length * 100) : 0
  const caPrevisionnel = leads
    .filter(l => l.statut !== 'perdu')
    .reduce((s, l) => {
      const prob = l.probabilite || colonnes.find(c => c.id === l.statut)?.prob || 0
      return s + (l.valeur_estimee || 0) * prob / 100
    }, 0)

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-[var(--navy)] mb-1">Leads CRM</h1>
          <div className="flex items-center gap-3">
            <p className="text-[var(--text-muted)] text-sm">Gérez et suivez vos prospects</p>
            {lastUpdate && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Temps réel
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-1">
            <button onClick={() => setVue('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vue === 'kanban' ? 'bg-white shadow-sm text-[var(--navy)]' : 'text-[var(--text-muted)]'}`}>
              <Kanban size={13} /> Kanban
            </button>
            <button onClick={() => setVue('liste')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vue === 'liste' ? 'bg-white shadow-sm text-[var(--navy)]' : 'text-[var(--text-muted)]'}`}>
              <LayoutList size={13} /> Liste
            </button>
          </div>
          <button onClick={refresh} className="btn-ghost text-sm py-2.5 px-3"><RefreshCw size={14} /></button>
          <button onClick={() => exportCSV(leads, 'leads')} className="btn-ghost text-sm py-2.5 px-3"><Download size={14} /></button>
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Nouveau lead</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-cyan-600" /><span className="text-[var(--text-muted)] text-xs">Total leads</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{leads.length}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2"><Flame size={14} className="text-red-500" /><span className="text-[var(--text-muted)] text-xs">Leads chauds</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{chauds}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2"><Check size={14} className="text-emerald-500" /><span className="text-[var(--text-muted)] text-xs">Taux conv.</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{tauxConv}<span className="text-[var(--text-muted)] text-lg font-normal">%</span></p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} className="text-violet-600" /><span className="text-[var(--text-muted)] text-xs">CA prévisionnel</span></div>
          <p className="font-display text-2xl font-bold text-[var(--navy)]">{caPrevisionnel.toLocaleString('fr-FR')}€</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-light)]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un lead..."
          className="w-full bg-white border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-light)] focus:outline-none focus:border-cyan-400 transition-colors" />
      </div>

      {/* ── VUE KANBAN ── */}
      {vue === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {colonnes.map(col => {
            const colLeads = filtered.filter(l => l.statut === col.id)
            const isOver   = dragOver === col.id
            const colCA    = colLeads.reduce((s, l) => {
              const p = l.probabilite || col.prob
              return s + (l.valeur_estimee || 0) * p / 100
            }, 0)

            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-2xl border min-w-[240px] w-[240px] shrink-0 transition-all duration-200 ${isOver ? 'ring-2 ring-cyan-400 scale-[1.01]' : ''} ${col.bg}`}
                onDragOver={e => { e.preventDefault(); if (dragOver !== col.id) setDragOver(col.id) }}
                onDragLeave={e => {
                  // Ne réinitialiser que si on quitte vraiment la colonne (pas juste un enfant)
                  const related = e.relatedTarget as Node
                  if (!e.currentTarget.contains(related)) setDragOver(null)
                }}
                onDrop={e => { e.preventDefault(); onDrop(col.id) }}
              >
                {/* En-tête */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${col.color}`}>{col.label}</span>
                    <span className="text-xs font-semibold text-[var(--text-muted)] bg-white/80 border border-[var(--border)] rounded-full px-2 py-0.5">{colLeads.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {colCA > 0 && (
                      <span className="text-[10px] text-emerald-600 font-semibold">{colCA.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</span>
                    )}
                    <button onClick={openCreate} className="w-5 h-5 rounded-full bg-white/80 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--navy)] transition-colors">
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colLeads.length === 0 && (
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center ${isOver ? 'border-cyan-400 bg-cyan-50' : 'border-[var(--border)]'}`}>
                      <p className="text-[var(--text-light)] text-xs">Déposer ici</p>
                    </div>
                  )}
                  {colLeads.map(l => {
                    const s = scoreConfig[l.score] || scoreConfig['tiède']
                    return (
                      <div
                        key={l.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); onDragStart(l.id) }}
                        onDragEnd={onDragEnd}
                        onClick={() => { if (!isDragging) setFicheLead(l) }}
                        className={`bg-white border border-[var(--border)] rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-[var(--border-hover)] transition-all group select-none ${dragId === l.id ? 'opacity-40 rotate-1 scale-95' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full ${s.bg} border ${s.border} flex items-center justify-center text-xs font-bold ${s.color} shrink-0`}>
                              {l.nom.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-[var(--text-primary)] text-xs font-semibold truncate">{l.nom}</p>
                          </div>
                          <s.icon size={11} className={`${s.color} shrink-0`} />
                        </div>
                        {l.entreprise && <p className="text-[var(--text-muted)] text-xs truncate mb-1.5">{l.entreprise}</p>}
                        {l.valeur_estimee > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <Euro size={10} className="text-emerald-600" />
                            <span className="text-emerald-600 text-xs font-semibold">{l.valeur_estimee.toLocaleString('fr-FR')}€</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          {l.source && <span className="text-[10px] text-[var(--text-light)] bg-[var(--bg-secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded-md">{l.source}</span>}
                          <span className="text-[10px] text-[var(--text-light)] ml-auto">{l.date ? new Date(l.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--border)] opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          {!['converti','perdu'].includes(l.statut) && (
                            <button onClick={() => openRelance(l)} disabled={relancing === l.id}
                              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs transition-colors ${relanceOk === l.id ? 'text-emerald-600 bg-emerald-50' : 'text-[var(--text-muted)] hover:text-orange-600 hover:bg-orange-50'}`}>
                              {relancing === l.id ? <Loader size={11} className="animate-spin" /> : relanceOk === l.id ? <Check size={11} /> : <Mail size={11} />}
                              <span>{relanceOk === l.id ? 'Envoyé' : 'Relancer'}</span>
                            </button>
                          )}
                          <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Pencil size={11} /></button>
                          <button onClick={() => deleteLead(l.id)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={11} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── VUE LISTE ── */}
      {vue === 'liste' && (
        loading ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[var(--border-hover)] border-t-navy-700 rounded-full animate-spin" />
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <Users size={32} className="text-[var(--text-light)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] text-sm">Aucun lead trouvé</p>
            <button onClick={openCreate} className="btn-primary mt-4 text-sm">+ Créer le premier lead</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(l => {
              const s   = scoreConfig[l.score] || scoreConfig['tiède']
              const col = colonnes.find(c => c.id === l.statut)
              return (
                <div key={l.id} onClick={() => setFicheLead(l)}
                  className="card-glass p-4 flex items-center justify-between gap-4 hover:border-[var(--border-hover)] transition-all cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full ${s.bg} border ${s.border} flex items-center justify-center font-bold text-sm shrink-0 ${s.color}`}>
                      {l.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[var(--text-primary)] text-sm font-semibold truncate">{l.nom}</p>
                        <s.icon size={12} className={s.color} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><Mail size={10} />{l.email}</span>
                        {l.telephone && <span className="hidden sm:flex items-center gap-1"><Phone size={10} />{l.telephone}</span>}
                        {l.entreprise && <span className="hidden lg:block">{l.entreprise}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {l.valeur_estimee > 0 && (
                      <span className="text-emerald-600 text-xs font-bold hidden md:block">{l.valeur_estimee.toLocaleString('fr-FR')}€</span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${col?.bg} ${col?.color}`}>{l.statut}</span>
                    <ChevronRight size={14} className="text-[var(--text-light)]" />
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Fiche lead */}
      {ficheLead && (
        <FicheLead
          lead={ficheLead}
          onClose={() => setFicheLead(null)}
          onUpdate={updateLead}
          onDelete={async (id) => { await deleteLead(id); setFicheLead(null) }}
        />
      )}

      {/* Modal relance */}
      {showRelanceModal && relanceLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-[var(--navy)] text-sm">Relancer {relanceLead.nom}</h2>
              <button onClick={() => setShowRelanceModal(false)} className="text-[var(--text-muted)] hover:text-[var(--navy)]"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-xs text-[var(--text-muted)] space-y-1 border border-[var(--border)]">
                <p><span className="font-medium text-[var(--text-secondary)]">Email :</span> {relanceLead.email}</p>
                {relanceLead.entreprise && <p><span className="font-medium text-[var(--text-secondary)]">Entreprise :</span> {relanceLead.entreprise}</p>}
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-semibold">Message personnalisé (optionnel)</label>
                <textarea value={relanceMessage} onChange={e => setRelanceMessage(e.target.value)}
                  placeholder="Laissez vide pour le message par défaut..." rows={3}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-light)] focus:outline-none focus:border-cyan-400 resize-none" />
              </div>
              {relanceErr && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
                  <AlertCircle size={13} /> {relanceErr}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRelanceModal(false)} className="btn-ghost flex-1 justify-center text-sm">Annuler</button>
              <button onClick={handleRelance} disabled={!!relancing} className="btn-primary flex-1 justify-center text-sm disabled:opacity-40">
                {relancing ? <Loader size={14} className="animate-spin" /> : <><Mail size={14} /> Envoyer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-[var(--navy)]">{editLead ? 'Modifier le lead' : 'Nouveau lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--navy)]"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'nom',        label: 'Nom *',      placeholder: 'Sophie Renard' },
                  { key: 'email',      label: 'Email *',    placeholder: 'sophie@renard.fr' },
                  { key: 'telephone',  label: 'Téléphone',  placeholder: '06 12 34 56 78' },
                  { key: 'entreprise', label: 'Entreprise', placeholder: 'Renard Conseil' },
                  { key: 'secteur',    label: 'Secteur',    placeholder: 'Consulting' },
                  { key: 'source',     label: 'Source',     placeholder: 'LinkedIn' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-semibold">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      placeholder={f.placeholder}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-light)] focus:outline-none focus:border-cyan-400" />
                  </div>
                ))}
              </div>
              {/* Valeur + Probabilité */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-semibold">Valeur estimée (€)</label>
                  <input type="number" value={form.valeur_estimee} onChange={e => setForm({...form, valeur_estimee: e.target.value})}
                    placeholder="0"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-semibold">Probabilité (%)</label>
                  <input type="number" min={0} max={100} value={form.probabilite} onChange={e => setForm({...form, probabilite: e.target.value})}
                    placeholder="50"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400" />
                </div>
              </div>
              {/* Score */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-semibold">Score</label>
                <div className="flex gap-2">
                  {(['chaud', 'tiède', 'froid'] as const).map(s => {
                    const styles = {
                      chaud: { active: 'bg-red-500 border-red-500 text-white', inactive: 'bg-red-50 border-red-100 text-red-500' },
                      tiède: { active: 'bg-orange-500 border-orange-500 text-white', inactive: 'bg-orange-50 border-orange-100 text-orange-500' },
                      froid: { active: 'bg-blue-500 border-blue-500 text-white', inactive: 'bg-blue-50 border-blue-100 text-blue-500' },
                    }
                    const icons = { chaud: '🔥', tiède: '➖', froid: '❄️' }
                    return (
                      <button key={s} onClick={() => setForm({...form, score: s})}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          form.score === s ? styles[s].active : styles[s].inactive
                        }`}>
                        <span>{icons[s]}</span> {s}
                      </button>
                    )
                  })}
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-semibold">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Notes sur ce lead..." rows={3}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-light)] focus:outline-none focus:border-cyan-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.nom || !form.email}
                className="btn-primary flex-1 justify-center disabled:opacity-40">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={15} />{editLead ? 'Modifier' : 'Créer'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}