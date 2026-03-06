'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, Users, FileText, Zap, AlertCircle, ChevronRight, TrendingDown } from 'lucide-react'

interface Notification {
  id: string
  type: 'lead' | 'warning' | 'erreur' | 'anomalie'
  anomalie?: boolean
  titre: string
  message: string
  date: string
  lu: boolean
  href: string
}

const typeConfig = {
  lead:    { icon: Users,       color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  warning: { icon: FileText,    color: 'text-orange-400', bg: 'bg-orange-500/10' },
  erreur:  { icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-500/10' },
  anomalie:{ icon: TrendingDown,  color: 'text-orange-400', bg: 'bg-orange-500/10' },
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(diff / 3600000)
  const d    = Math.floor(diff / 86400000)
  if (min < 1)  return 'à l\'instant'
  if (min < 60) return `il y a ${min}min`
  if (h < 24)   return `il y a ${h}h`
  return `il y a ${d}j`
}

export default function Notifications() {
  const [notifs, setNotifs]   = useState<Notification[]>([])
  const [open, setOpen]       = useState(false)
  const [lus, setLus]         = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = async () => {
    try {
      const res  = await fetch('/api/notifications')
      const data = await res.json()
      setNotifs(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fermer en cliquant dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const nonLus = notifs.filter(n => !lus.has(n.id)).length

  const handleOpen = () => {
    setOpen(o => !o)
    // Marquer tout comme lu à l'ouverture
    if (!open) setLus(new Set(notifs.map(n => n.id)))
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
        <Bell size={15} />
        {nonLus > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
            {nonLus > 9 ? '9+' : nonLus}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 card-glass border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-semibold text-white text-sm">Notifications</h3>
            {notifs.length > 0 && (
              <span className="text-xs text-white/30">{notifs.length} au total</span>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-xs">Aucune notification</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifs.map((n) => {
                const cfg = typeConfig[n.anomalie ? 'anomalie' : n.type] || typeConfig['warning']
                return (
                  <a key={n.id} href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <cfg.icon size={13} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium mb-0.5">{n.titre}</p>
                      <p className="text-white/40 text-xs truncate">{n.message}</p>
                      <p className="text-white/20 text-xs mt-1">{timeAgo(n.date)}</p>
                    </div>
                    <ChevronRight size={12} className="text-white/20 group-hover:text-white/40 shrink-0 mt-1" />
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
