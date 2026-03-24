'use client'
import { useState, useRef } from 'react'
import { Users, Flame, Minus, Snowflake, Mail, Phone, Plus, Pencil, Trash2, X, Check, Search, RefreshCw, Download, Loader, AlertCircle, LayoutList, Kanban } from 'lucide-react'
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
  score: 'chaud' | 'tiède' | 'froid'
  statut: 'nouveau' | 'contacté' | 'qualifié' | 'converti' | 'perdu'
  source: string
  date: string
}

const scoreConfig = {
  chaud: { icon: Flame,     color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-100' },
  tiède: { icon: Minus,     color: 'text-orange-500', bg: 'bg-orange-50',  border: 'border-orange-100' },
  froid: { icon: Snowflake, color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-100' },
}

const colonnes: { id: Lead['statut']; label: string; color: string; bg: string; dot: string }[] = [
  { id: 'nouveau',  label: 'Nouveau',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100',    dot: 'bg-blue-400' },
  { id: 'contacté', label: 'Contacté', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',  dot: 'bg-amber-400' },
  { id: 'qualifié', label: 'Qualifié', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100',dot: 'bg-purple-400' },
  { id: 'converti', label: 'Converti', color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100',dot: 'bg-emerald-400' },
  { id: 'perdu',    label: 'Perdu',    color: 'text-[var(--text-light)]', bg: 'bg-[var(--bg-secondary)] border-[var(--border)]', dot: 'bg-[var(--border-hover)]' },
]

const emptyForm = { nom: '', email: '', telephone: '', entreprise: '', secteur: '', message: '', score: 'tiède' as const, source: 'Manuel' }

export default function LeadsPage() {
  const { data: leads, loading, lastUpdate, refresh } = useRealtimeData<Lead>('/api/leads', 'leads')

  const [vue,       setVue]       = useState<'kanban' | 'liste'>('kanban')
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLead,  setEditLead]  = useState<Lead | null>(null)
  const [form,      setForm]      = useState(emptyForm)
  const [saving,    setSaving]    = useState(false)
  const [dragId,    setDragId]    = useState<string | null>(null)
  const [dragOver,  setDragOver]  = useState<string | null>(null)

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

  const openCreate = (statut?: Lead['statut']) => {
    setEditLead(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }
  const openEdit = (l: Lead) => {
    setEditLead(l)
    setForm({ nom: l.nom, email: l.email, telephone: l.telephone, entreprise: l.entreprise, secteur: l.secteur, message: l.message, score: l.score, source: l.source })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    if (editLead) {
      await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editLead.id, ...form }) })
    } else {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false); setShowModal(false); refresh()
  }

  const changeStatut = async (id: string, statut: string) => {
    await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }) })
    refresh()
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Supprimer ce lead ?')) return
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
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

  // Drag & drop
  const onDragStart = (id: string) => setDragId(id)
  const onDragEnd   = () => { setDragId(null); setDragOver(null) }
  const onDrop      = async (statut: string) => {
    if (dragId && statut) { await changeStatut(dragId, statut) }
    setDragId(null); setDragOver(null)
  }

  const chauds    = leads.filter(l => l.score === 'chaud').length
  const convertis = leads.filter(l => l.statut === 'converti').length
  const tauxConv  = leads.length > 0 ? Math.round(convertis / leads.length * 100) : 0

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
          {/* Toggle vue */}
          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-1">
            <button onClick={() => setVue('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vue === 'kanban' ? 'bg-white shadow-sm text-[var(--navy)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
              <Kanban size={13} /> Kanban
            </button>
            <button onClick={() => setVue('liste')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vue === 'liste' ? 'bg-white shadow-sm text-[var(--navy)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
              <LayoutList size={13} /> Liste
            </button>
          </div>
          <button onClick={refresh} className="btn-ghost text-sm py-2.5 px-3"><RefreshCw size={14} /></button>
          <button onClick={() => exportCSV(leads, 'leads')} className="btn-ghost text-sm py-2.5 px-3"><Download size={14} /></button>
          <button onClick={() => openCreate()} className="btn-primary"><Plus size={16} /> Nouveau lead</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-cyan-600" /><span className="text-[var(--text-muted)] text-xs">Total leads</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{leads.length}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2"><Flame size={14} className="text-red-500" /><span className="text-[var(--text-muted)] text-xs">Leads chauds</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{chauds}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[var(--text-muted)] text-xs">Taux conversion</span></div>
          <p className="font-display text-3xl font-bold text-[var(--navy)]">{tauxConv}<span className="text-[var(--text-muted)] text-lg font-normal">%</span></p>
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
            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-2xl border min-w-[240px] w-[240px] shrink-0 transition-all duration-200 ${isOver ? 'ring-2 ring-cyan-400 ring-offset-1 scale-[1.01]' : ''} ${col.bg}`}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => onDrop(col.id)}
              >
                {/* En-tête colonne */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${col.color}`}>{col.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[var(--text-muted)] bg-white/80 border border-[var(--border)] rounded-full px-2 py-0.5">{colLeads.length}</span>
                    <button onClick={() => openCreate(col.id)} className="w-5 h-5 rounded-full bg-white/80 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--navy)] hover:border-[var(--border-hover)] transition-colors">
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colLeads.length === 0 && (
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${isOver ? 'border-cyan-400 bg-cyan-50' : 'border-[var(--border)] bg-transparent'}`}>
                      <p className="text-[var(--text-light)] text-xs">Déposer ici</p>
                    </div>
                  )}
                  {colLeads.map(l => {
                    const s = scoreConfig[l.score] || scoreConfig['tiède']
                    return (
                      <div
                        key={l.id}
                        draggable
                        onDragStart={() => onDragStart(l.id)}
                        onDragEnd={onDragEnd}
                        className={`bg-white border border-[var(--border)] rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-[var(--border-hover)] transition-all group ${dragId === l.id ? 'opacity-40 rotate-1 scale-95' : ''}`}
                      >
                        {/* Nom + score */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full ${s.bg} border ${s.border} flex items-center justify-center text-xs font-bold ${s.color} shrink-0`}>
                              {l.nom.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-[var(--text-primary)] text-xs font-semibold truncate">{l.nom}</p>
                          </div>
                          <s.icon size={11} className={`${s.color} shrink-0 mt-0.5`} />
                        </div>

                        {/* Infos */}
                        {l.entreprise && (
                          <p className="text-[var(--text-muted)] text-xs truncate mb-1.5">{l.entreprise}</p>
                        )}
                        <div className="flex items-center gap-1.5 text-[var(--text-light)] text-xs mb-3">
                          <Mail size={9} />
                          <span className="truncate">{l.email}</span>
                        </div>

                        {/* Source + date */}
                        <div className="flex items-center justify-between">
                          {l.source && (
                            <span className="text-[10px] text-[var(--text-light)] bg-[var(--bg-secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded-md">{l.source}</span>
                          )}
                          <span className="text-[10px] text-[var(--text-light)] ml-auto">{l.date ? new Date(l.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</span>
                        </div>

                        {/* Actions (au hover) */}
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--border)] opacity-0 group-hover:opacity-100 transition-opacity">
                          {!['converti','perdu'].includes(l.statut) && (
                            <button onClick={() => openRelance(l)} title="Relancer" disabled={relancing === l.id}
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
            <button onClick={() => openCreate()} className="btn-primary mt-4 text-sm">+ Créer le premier lead</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(l => {
              const s = scoreConfig[l.score] || scoreConfig['tiède']
              const col = colonnes.find(c => c.id === l.statut)
              return (
                <div key={l.id} className="card-glass p-4 flex items-center justify-between gap-4 hover:border-[var(--border-hover)] transition-all">
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${col?.bg} ${col?.color}`}>{l.statut}</span>
                    <select value={l.statut} onChange={e => changeStatut(l.id, e.target.value)}
                      className="text-xs border border-[var(--border)] rounded-lg px-2 py-1 bg-white text-[var(--text-secondary)] focus:outline-none cursor-pointer">
                      {colonnes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    {!['converti','perdu'].includes(l.statut) && (
                      <button onClick={() => openRelance(l)} disabled={relancing === l.id}
                        className={`p-1.5 transition-colors ${relanceOk === l.id ? 'text-emerald-600' : 'text-[var(--text-light)] hover:text-orange-500'}`}>
                        {relancing === l.id ? <Loader size={13} className="animate-spin" /> : relanceOk === l.id ? <Check size={13} /> : <Mail size={13} />}
                      </button>
                    )}
                    <button onClick={() => openEdit(l)} className="text-[var(--text-light)] hover:text-cyan-600 transition-colors p-1.5"><Pencil size={13} /></button>
                    <button onClick={() => deleteLead(l.id)} className="text-[var(--text-light)] hover:text-red-500 transition-colors p-1.5"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )
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
                  placeholder="Laissez vide pour utiliser le message par défaut..." rows={3}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-light)] focus:outline-none focus:border-cyan-400 resize-none" />
              </div>
              <p className="text-[var(--text-light)] text-xs">Le statut passera automatiquement à "contacté" après l'envoi.</p>
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
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-semibold">Score</label>
                <div className="flex gap-2">
                  {(['chaud', 'tiède', 'froid'] as const).map(s => {
                    const scoreStyle = {
                      chaud: { active: 'bg-red-500 border-red-500 text-white', inactive: 'bg-red-50 border-red-100 text-red-500' },
                      tiède: { active: 'bg-orange-500 border-orange-500 text-white', inactive: 'bg-orange-50 border-orange-100 text-orange-500' },
                      froid: { active: 'bg-blue-500 border-blue-500 text-white', inactive: 'bg-blue-50 border-blue-100 text-blue-500' },
                    }
                    const icons = { chaud: '🔥', tiède: '➖', froid: '❄️' }
                    return (
                    <button key={s} onClick={() => setForm({...form, score: s})}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize flex items-center justify-center gap-1.5 ${
                        form.score === s ? scoreStyle[s].active : scoreStyle[s].inactive
                      }`}>
                      <span>{icons[s]}</span> {s}
                    </button>
                  )})
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-semibold">Notes</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
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
