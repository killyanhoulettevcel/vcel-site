// src/components/Notifications.tsx
// Notifs enrichies avec événements Google Calendar du jour
'use client'
import { useState, useEffect } from 'react'
import { Bell, X, AlertTriangle, CheckCircle, Zap, Calendar, Clock, ExternalLink } from 'lucide-react'

interface Notif {
  id: string
  type: 'erreur' | 'info' | 'succes' | 'rdv'
  title: string
  message: string
  link?: string
  time?: string
}

export default function Notifications() {
  const [open,  setOpen]  = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [count,  setCount]  = useState(0)

  useEffect(() => {
    const fetchAll = async () => {
      const all: Notif[] = []

      // Notifs système
      try {
        const res  = await fetch('/api/notifications')
        const data = await res.json()
        if (Array.isArray(data)) all.push(...data)
      } catch {}

      // Événements du jour depuis Google Calendar
      try {
        const res    = await fetch('/api/calendar/today')
        const events = await res.json()
        if (Array.isArray(events)) {
          events.forEach((e: any) => {
            const time = e.start?.dateTime
              ? new Date(e.start.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : 'Journée entière'
            all.push({
              id:      `cal-${e.id}`,
              type:    'rdv',
              title:   e.summary || 'Événement',
              message: time + (e.location ? ` — ${e.location}` : ''),
              link:    e.htmlLink,
              time,
            })
          })
        }
      } catch {}

      setNotifs(all)
      setCount(all.filter(n => n.type === 'erreur' || n.type === 'rdv').length)
    }

    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000) // refresh toutes les 5 min
    return () => clearInterval(interval)
  }, [])

  const iconMap = {
    erreur: <AlertTriangle size={14} className="text-red-400 shrink-0" />,
    info:   <Zap          size={14} className="text-blue-400 shrink-0" />,
    succes: <CheckCircle  size={14} className="text-green-400 shrink-0" />,
    rdv:    <Calendar     size={14} className="text-purple-400 shrink-0" />,
  }

  const bgMap = {
    erreur: 'bg-red-500/5 border-red-500/15',
    info:   'bg-blue-500/5 border-blue-500/15',
    succes: 'bg-green-500/5 border-green-500/15',
    rdv:    'bg-purple-500/5 border-purple-500/15',
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative btn-ghost p-2.5">
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 card-glass p-4 z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white text-sm">
                Notifications {notifs.length > 0 && <span className="text-white/30 font-normal">({notifs.length})</span>}
              </h3>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white"><X size={14} /></button>
            </div>

            {notifs.length === 0 ? (
              <div className="text-center py-6">
                <Bell size={24} className="text-white/10 mx-auto mb-2" />
                <p className="text-white/20 text-xs">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {/* RDV du jour en premier */}
                {notifs.filter(n => n.type === 'rdv').length > 0 && (
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-1 pt-1">
                    📅 Aujourd'hui
                  </p>
                )}
                {notifs.filter(n => n.type === 'rdv').map(n => (
                  <div key={n.id} className={`flex items-start gap-2.5 p-3 rounded-xl border ${bgMap[n.type]}`}>
                    {iconMap[n.type]}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{n.title}</p>
                      <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                        <Clock size={9} /> {n.message}
                      </p>
                    </div>
                    {n.link && (
                      <a href={n.link} target="_blank" rel="noreferrer"
                        className="text-white/20 hover:text-purple-400 shrink-0">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}

                {/* Autres notifs */}
                {notifs.filter(n => n.type !== 'rdv').length > 0 && (
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-1 pt-2">
                    ⚡ Système
                  </p>
                )}
                {notifs.filter(n => n.type !== 'rdv').map(n => (
                  <div key={n.id} className={`flex items-start gap-2.5 p-3 rounded-xl border ${bgMap[n.type]}`}>
                    {iconMap[n.type]}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">{n.title}</p>
                      <p className="text-white/40 text-xs mt-0.5">{n.message}</p>
                    </div>
                    {n.link && (
                      <a href={n.link} className="text-white/20 hover:text-blue-400 shrink-0text-xs">→</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <a href="/dashboard/client/agenda"
              className="mt-3 flex items-center justify-center gap-2 text-xs text-white/30 hover:text-blue-400 transition-colors pt-3 border-t border-white/5">
              <Calendar size={12} /> Voir l'agenda complet
            </a>
          </div>
        </>
      )}
    </div>
  )
}
