'use client'
import { useState } from 'react'
import { Users, Flame, Minus, Snowflake, Mail, Phone, Plus, Pencil, Trash2, X, Check, Search, RefreshCw, Download } from 'lucide-react'
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
  chaud: { icon: Flame,     color: 'text-red-400',    bg: 'bg-red-500/10' },
  tiède: { icon: Minus,     color: 'text-orange-400', bg: 'bg-orange-500/10' },
  froid: { icon: Snowflake, color: 'text-blue-400',   bg: 'bg-blue-500/10' },
}

const statutColors: Record<string, string> = {
  nouveau:  'bg-blue-500/10 text-blue-400',
  contacté: 'bg-yellow-500/10 text-yellow-400',
  qualifié: 'bg-purple-500/10 text-purple-400',
  converti: 'bg-green-500/10 text-green-400',
  perdu:    'bg-white/5 text-white/30',
}

const emptyForm = { nom: '', email: '', telephone: '', entreprise: '', secteur: '', message: '', score: 'tiède' as const, source: 'Manuel' }

export default function LeadsPage() {
  const { data: leads, loading, lastUpdate, refresh } = useRealtimeData<Lead>('/api/leads', 'leads')

  const [filtre, setFiltre]       = useState('tous')
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLead, setEditLead]   = useState<Lead | null>(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)

  const filtered = leads
    .filter(l => filtre === 'tous' || l.statut === filtre)
    .filter(l => !search ||
      l.nom.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.entreprise || '').toLowerCase().includes(search.toLowerCase())
    )

  const openCreate = () => { setEditLead(null); setForm(emptyForm); setShowModal(true) }
  const openEdit   = (l: Lead) => {
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
    setSaving(false)
    setShowModal(false)
  }

  const changeStatut = async (id: string, statut: string) => {
    await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }) })
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Supprimer ce lead ?')) return
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
  }

  const chauds    = leads.filter(l => l.score === 'chaud').length
  const convertis = leads.filter(l => l.statut === 'converti').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Leads CRM</h1>
          <div className="flex items-center gap-3">
            <p className="text-white/40 text-sm">Créez, modifiez et suivez vos leads</p>
            {lastUpdate && (
              <span className="flex items-center gap-1.5 text-xs text-green-400/60">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Mis à jour {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="btn-ghost text-sm py-2.5 px-4"><RefreshCw size={14} /></button>
          <button onClick={() => exportCSV(leads, 'leads')} className="btn-ghost text-sm py-2.5 px-4" title="Exporter CSV"><Download size={14} /></button>
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Nouveau lead</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-blue-400" /><span className="text-white/40 text-xs">Total leads</span></div>
          <p className="font-display text-3xl font-bold text-white">{leads.length}</p>
        </div>
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-2"><Flame size={14} className="text-red-400" /><span className="text-white/40 text-xs">Leads chauds</span></div>
          <p className="font-display text-3xl font-bold text-white">{chauds}</p>
        </div>
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-green-400" /><span className="text-white/40 text-xs">Convertis</span></div>
          <p className="font-display text-3xl font-bold text-white">{convertis}</p>
        </div>
      </div>

      {/* Filtres + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['tous', 'nouveau', 'contacté', 'qualifié', 'converti', 'perdu'].map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                filtre === f ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-20 text-white/30 text-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <Users size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Aucun lead trouvé</p>
          <button onClick={openCreate} className="btn-primary mt-4 text-sm">+ Créer le premier lead</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => {
            const s = scoreConfig[l.score] || scoreConfig['tiède']
            return (
              <div key={l.id} className="card-glass p-4 flex items-center justify-between gap-4 hover:border-white/10 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full ${s.bg} border border-white/10 flex items-center justify-center ${s.color} font-bold text-sm shrink-0`}>
                    {l.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white text-sm font-medium truncate">{l.nom}</p>
                      <s.icon size={12} className={s.color} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <span className="flex items-center gap-1"><Mail size={10} />{l.email}</span>
                      {l.telephone && <span className="hidden sm:flex items-center gap-1"><Phone size={10} />{l.telephone}</span>}
                      {l.entreprise && <span className="hidden lg:block">{l.entreprise}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={l.statut} onChange={e => changeStatut(l.id, e.target.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl font-medium cursor-pointer focus:outline-none bg-transparent border-0 ${statutColors[l.statut]}`}>
                    {['nouveau','contacté','qualifié','converti','perdu'].map(s => (
                      <option key={s} value={s} className="bg-navy-900 text-white">{s}</option>
                    ))}
                  </select>
                  <span className="text-white/20 text-xs hidden xl:block">{l.date}</span>
                  <button onClick={() => openEdit(l)} className="text-white/20 hover:text-blue-400 transition-colors p-1.5"><Pencil size={13} /></button>
                  <button onClick={() => deleteLead(l.id)} className="text-white/20 hover:text-red-400 transition-colors p-1.5"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white">{editLead ? 'Modifier le lead' : 'Nouveau lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
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
                    <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Score</label>
                <div className="flex gap-2">
                  {(['chaud', 'tiède', 'froid'] as const).map(s => (
                    <button key={s} onClick={() => setForm({...form, score: s})}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                        form.score === s ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/50'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Notes</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  placeholder="Notes sur ce lead..." rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 resize-none" />
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
