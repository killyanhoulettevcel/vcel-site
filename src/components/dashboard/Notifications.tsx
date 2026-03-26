'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, X, AlertTriangle, CheckCircle, Zap, Calendar, Clock, ExternalLink, RefreshCw } from 'lucide-react'

interface Notif {
  id: string
  type: 'erreur' | 'warning' | 'info' | 'succes' | 'lead' | 'rdv'
  // L'API renvoie "titre" (pas "title") — on accepte les deux
  titre?: string
  title?: string
  message?: string
  date?: string
  href?: string
  link?: string
  time?: string
  lu?: boolean
  anomalie?: boolean
}

export default function Notifications() {
  const [open,    setOpen]    = useState(false)
  const [notifs,  setNotifs]  = useState<Notif[]>([])
  const [count,   setCount]   = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchAll = async () => {
    setLoading(true)
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
            id:    `cal-${e.id}`,
            type:  'rdv',
            titre: e.summary || 'Événement',
            message: time + (e.location ? ` — ${e.location}` : ''),
            link:  e.htmlLink,
            time,
            lu: false,
          })
        })
      }
    } catch {}

    setNotifs(all)
    setCount(all.filter(n => !n.lu).length)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Fermer en cliquant en dehors
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    // Délai pour éviter que le click d'ouverture ferme immédiatement
    setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const dismiss = (id: string) => {
    setNotifs(prev => {
      const next = prev.filter(n => n.id !== id)
      setCount(next.filter(n => !n.lu).length)
      return next
    })
  }

  const dismissAll = () => {
    setNotifs([])
    setCount(0)
  }

  const getLabel = (n: Notif) => n.titre || n.title || ''

  const ICON: Record<string, React.ReactNode> = {
    erreur:  <AlertTriangle size={13} style={{ color: '#EF4444', flexShrink: 0 }} />,
    warning: <AlertTriangle size={13} style={{ color: '#F97316', flexShrink: 0 }} />,
    info:    <Zap           size={13} style={{ color: 'var(--cyan)', flexShrink: 0 }} />,
    succes:  <CheckCircle   size={13} style={{ color: '#22C55E', flexShrink: 0 }} />,
    lead:    <Zap           size={13} style={{ color: 'var(--cyan)', flexShrink: 0 }} />,
    rdv:     <Calendar      size={13} style={{ color: '#7C5CBF', flexShrink: 0 }} />,
  }

  const BORDER: Record<string, string> = {
    erreur:  'rgba(239,68,68,0.20)',
    warning: 'rgba(249,115,22,0.18)',
    info:    'rgba(79,195,247,0.15)',
    succes:  'rgba(34,197,94,0.18)',
    lead:    'rgba(79,195,247,0.15)',
    rdv:     'rgba(124,92,191,0.18)',
  }

  const rdvs    = notifs.filter(n => n.type === 'rdv')
  const systeme = notifs.filter(n => n.type !== 'rdv')

  return (
    // position relative sur le wrapper pour ancrer le panneau
    <div className="relative" ref={panelRef}>

      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(v => !v)}
        className="btn-ghost p-2.5 relative"
        aria-label="Notifications"
      >
        <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
            style={{ background: '#EF4444', fontSize: 9 }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Panneau — position absolute par rapport au wrapper, z-index élevé */}
      {open && (
        <div
          className="absolute right-0 w-80 card-glass shadow-xl"
          style={{
            top: 'calc(100% + 8px)',
            zIndex: 9999,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              Notifications
              {notifs.length > 0 && (
                <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  ({notifs.length})
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchAll}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                title="Actualiser"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-muted)' }} />
              </button>
              {notifs.length > 0 && (
                <button
                  onClick={dismissAll}
                  className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Tout effacer
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <X size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>

          {/* Corps scrollable */}
          <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
            {notifs.length === 0 ? (
              <div className="text-center py-8">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <Bell size={18} style={{ color: 'var(--text-light)' }} />
                </div>
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Aucune notification
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Tout est calme pour l'instant
                </p>
              </div>
            ) : (
              <>
                {/* RDV du jour */}
                {rdvs.length > 0 && (
                  <>
                    <p className="section-label px-1 pt-1 pb-0.5">📅 Aujourd'hui</p>
                    {rdvs.map(n => (
                      <NotifRow key={n.id} n={n} label={getLabel(n)} icon={ICON[n.type]} border={BORDER[n.type]} onDismiss={dismiss} onClose={() => setOpen(false)} />
                    ))}
                  </>
                )}

                {/* Système */}
                {systeme.length > 0 && (
                  <>
                    <p className="section-label px-1 pt-2 pb-0.5">⚡ Système</p>
                    {systeme.map(n => (
                      <NotifRow key={n.id} n={n} label={getLabel(n)} icon={ICON[n.type] || ICON['info']} border={BORDER[n.type] || BORDER['info']} onDismiss={dismiss} onClose={() => setOpen(false)} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <a
              href="/dashboard/client/alertes"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 text-xs font-medium transition-colors"
              style={{ color: 'var(--cyan-dark)' }}
            >
              Voir toutes les alertes IA →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sous-composant ligne ────────────────────────────────────────────────────

function NotifRow({ n, label, icon, border, onDismiss, onClose }: {
  n: Notif; label: string; icon: React.ReactNode
  border: string; onDismiss: (id: string) => void; onClose: () => void
}) {
  const dest = n.href || n.link

  return (
    <div
      className="group flex items-start gap-2.5 p-3 rounded-xl border transition-all"
      style={{
        borderColor: border,
        background: 'transparent',
      }}
    >
      <div className="mt-0.5">{icon}</div>

      <div className="flex-1 min-w-0">
        {dest ? (
          <a
            href={dest}
            target={n.link ? '_blank' : undefined}
            rel={n.link ? 'noreferrer' : undefined}
            onClick={n.href ? onClose : undefined}
            className="text-xs font-medium leading-snug block hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            {label}
          </a>
        ) : (
          <p className="text-xs font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
            {label}
          </p>
        )}
        {n.message && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
            {n.time && <Clock size={9} className="inline mr-1" />}
            {n.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {n.link && (
          <a href={n.link} target="_blank" rel="noreferrer"
            className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors">
            <ExternalLink size={11} style={{ color: 'var(--text-muted)' }} />
          </a>
        )}
        <button
          onClick={() => onDismiss(n.id)}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-secondary)] transition-all"
          title="Supprimer"
        >
          <X size={11} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </div>
  )
}