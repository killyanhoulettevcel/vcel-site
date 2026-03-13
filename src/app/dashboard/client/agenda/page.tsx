'use client'
import { useState, useEffect, useCallback } from 'react'
import { Calendar, Plus, Trash2, X, Check, ChevronLeft, ChevronRight, Clock, MapPin, Users, AlertCircle, ExternalLink } from 'lucide-react'

interface CalEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: { dateTime?: string, date?: string }
  end:   { dateTime?: string, date?: string }
  attendees?: { email: string }[]
  htmlLink?: string
}

const emptyForm = {
  summary: '', description: '', location: '',
  start: '', end: '', attendees: '',
}

function formatTime(dt?: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dt?: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function isSameDay(date1: Date, dateStr?: string) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.toDateString() === date1.toDateString()
}

export default function AgendaPage() {
  const [events,      setEvents]      = useState<CalEvent[]>([])
  const [loading,     setLoading]     = useState(true)
  const [connected,   setConnected]   = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [form,        setForm]        = useState(emptyForm)
  const [saving,      setSaving]      = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [error,       setError]       = useState('')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      // Récupérer 3 mois d'événements
      const timeMin = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString()
      const timeMax = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString()
      const res  = await fetch(`/api/calendar?timeMin=${timeMin}&timeMax=${timeMax}`)
      const data = await res.json()
      if (data.error === 'not_connected') { setConnected(false); setLoading(false); return }
      setEvents(Array.isArray(data) ? data : [])
      setConnected(true)
    } catch { setConnected(false) }
    setLoading(false)
  }, [currentDate])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Jours du mois courant
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startPad = (firstDay + 6) % 7 // Lundi = 0

  const daysArray = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]

  const eventsForDay = (day: Date) =>
    events.filter(e => isSameDay(day, e.start.dateTime || e.start.date))

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []

  const handleSave = async () => {
    if (!form.summary || !form.start || !form.end) return
    setSaving(true)
    setError('')
    try {
      const body: any = {
        summary:     form.summary,
        description: form.description,
        location:    form.location,
        start:       new Date(form.start).toISOString(),
        end:         new Date(form.end).toISOString(),
      }
      if (form.attendees) body.attendees = form.attendees.split(',').map(e => e.trim()).filter(Boolean)
      const res = await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur'); setSaving(false); return }
      setShowModal(false)
      setForm(emptyForm)
      fetchEvents()
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  const openCreate = () => {
    const base = selectedDay || new Date()
    const start = new Date(base)
    start.setHours(9, 0, 0, 0)
    const end = new Date(base)
    end.setHours(10, 0, 0, 0)
    setForm({
      ...emptyForm,
      start: start.toISOString().slice(0, 16),
      end:   end.toISOString().slice(0, 16),
    })
    setShowModal(true)
  }

  if (!connected) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="card-glass p-10 text-center max-w-md">
        <Calendar size={40} className="text-white/10 mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-white mb-2">Connecter Google Calendar</h2>
        <p className="text-white/40 text-sm mb-6">Synchronisez vos rendez-vous et événements directement dans votre dashboard VCEL.</p>
        <a href="/api/auth/google-calendar"
          className="btn-primary inline-flex items-center gap-2">
          <Calendar size={16} /> Connecter mon Google Calendar
        </a>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Agenda</h1>
          <p className="text-white/40 text-sm">Synchronisé avec Google Calendar</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nouvel événement
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <div className="lg:col-span-2 card-glass p-6">
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="btn-ghost p-2">
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-display font-semibold text-white capitalize">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="btn-ghost p-2">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Jours semaine */}
          <div className="grid grid-cols-7 mb-2">
            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
              <div key={d} className="text-center text-xs text-white/30 font-medium py-2">{d}</div>
            ))}
          </div>

          {/* Grille jours */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const dayEvents = eventsForDay(day)
              const isToday   = day.toDateString() === new Date().toDateString()
              const isSelected = selectedDay?.toDateString() === day.toDateString()
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                  className={`relative p-2 rounded-xl text-center transition-all min-h-[52px] ${
                    isSelected ? 'bg-blue-500 text-white' :
                    isToday    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}>
                  <span className="text-xs font-medium">{day.getDate()}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                      ))}
                      {dayEvents.length > 3 && <span className="text-xs opacity-60">+{dayEvents.length - 3}</span>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel événements du jour */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white text-sm">
              {selectedDay ? formatDate(selectedDay.toISOString()) : 'Sélectionnez un jour'}
            </h3>
            <button onClick={openCreate} className="text-blue-400 hover:text-blue-300 transition-colors">
              <Plus size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : selectedEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/20 text-xs">Aucun événement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map(e => (
                <div key={e.id} className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-white text-sm font-medium leading-tight">{e.summary}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {e.htmlLink && (
                        <a href={e.htmlLink} target="_blank" rel="noreferrer"
                          className="text-white/20 hover:text-blue-400 transition-colors p-1">
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <button onClick={() => handleDelete(e.id)}
                        className="text-white/20 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {(e.start.dateTime || e.start.date) && (
                    <div className="flex items-center gap-1 text-xs text-white/40 mb-1">
                      <Clock size={10} />
                      {e.start.dateTime
                        ? `${formatTime(e.start.dateTime)} → ${formatTime(e.end.dateTime)}`
                        : 'Journée entière'
                      }
                    </div>
                  )}
                  {e.location && (
                    <div className="flex items-center gap-1 text-xs text-white/30 mb-1">
                      <MapPin size={10} /> {e.location}
                    </div>
                  )}
                  {e.attendees && e.attendees.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-white/30">
                      <Users size={10} /> {e.attendees.map(a => a.email).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-white">Nouvel événement</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Titre *</label>
                <input value={form.summary} onChange={e => setForm({...form, summary: e.target.value})}
                  placeholder="Réunion client"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Début *</label>
                  <input type="datetime-local" value={form.start} onChange={e => setForm({...form, start: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Fin *</label>
                  <input type="datetime-local" value={form.end} onChange={e => setForm({...form, end: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Lieu</label>
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  placeholder="Paris, visio..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Participants (emails séparés par ,)</label>
                <input value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})}
                  placeholder="client@exemple.fr, partenaire@ex.fr"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-semibold">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Notes sur cet événement..." rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.summary || !form.start || !form.end}
                className="btn-primary flex-1 justify-center disabled:opacity-40">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={15} /> Créer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
