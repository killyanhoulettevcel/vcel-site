'use client'
import { useState, useEffect } from 'react'
import { Activity, ArrowUpRight, Clock, Wrench } from 'lucide-react'

// ── Récupère le status depuis Uptime Kuma ─────────────────────────────────────
function useVcelStatus() {
  const [status, setStatus] = useState<'up' | 'down' | 'maintenance' | 'loading'>('loading')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('https://status.vcel.fr/api/status-page/heartbeat/vcel', {
          cache: 'no-store',
        })
        if (!res.ok) { setStatus('maintenance'); return }
        const data = await res.json()
        const allUp = data?.heartbeatList && Object.values(data.heartbeatList).every(
          (beats: any) => beats?.[beats.length - 1]?.status === 1
        )
        setStatus(allUp ? 'up' : 'down')
      } catch {
        setStatus('maintenance')
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  return status
}

// ── Compteur de secondes écoulées ─────────────────────────────────────────────
function useElapsed() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MaintenancePage() {
  const status  = useVcelStatus()
  const elapsed = useElapsed()
  const [dots,  setDots]  = useState('.')

  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(i)
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#0D1B2A', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Fond animé ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grille subtile */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(79,195,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Glow cyan en haut */}
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(79,195,247,0.08) 0%, transparent 70%)',
        }} />
        {/* Glow bas droite */}
        <div style={{
          position: 'absolute', bottom: -100, right: -100,
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(2,136,209,0.06) 0%, transparent 70%)',
        }} />
      </div>

      {/* ── Contenu ── */}
      <div className="relative z-10 text-center px-6 max-w-lg w-full">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <img src="/logo.png" alt="VCEL" className="h-8 w-auto" style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        </div>

        {/* Icône maintenance animée */}
        <div className="flex items-center justify-center mb-8">
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(2,136,209,0.1))',
            border: '1px solid rgba(79,195,247,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <Wrench size={32} style={{ color: '#4FC3F7' }} />
          </div>
        </div>

        {/* Titre */}
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 36, fontWeight: 400,
          color: '#ffffff', marginBottom: 12, lineHeight: 1.2,
        }}>
          Maintenance en cours
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
          On améliore VCEL pour vous offrir une meilleure expérience.
          <br />On revient très vite{dots}
        </p>

        {/* Timer + status */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40,
          flexWrap: 'wrap',
        }}>
          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Clock size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>En maintenance depuis</span>
            <span style={{ color: '#4FC3F7', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {elapsed}
            </span>
          </div>

          {/* Status live */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Activity size={14} style={{
              color: status === 'up' ? '#22c55e' : status === 'loading' ? '#4FC3F7' : '#f97316',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {status === 'loading' ? 'Vérification...' :
               status === 'up'      ? 'Services opérationnels' :
               status === 'down'    ? 'Incident détecté' :
               'Maintenance active'}
            </span>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: status === 'up' ? '#22c55e' : status === 'loading' ? '#4FC3F7' : '#f97316',
              animation: 'pulse 1.5s ease-in-out infinite',
              display: 'inline-block',
            }} />
          </div>
        </div>

        {/* CTA status page */}
        <a
          href="https://status.vcel.fr/status/vcel"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 12,
            background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
            color: '#ffffff', textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 24px rgba(79,195,247,0.25)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
        >
          <Activity size={15} />
          Voir le statut en temps réel
          <ArrowUpRight size={14} />
        </a>

        {/* Contact */}
        <p style={{ marginTop: 32, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          Une urgence ?{' '}
          <a href="mailto:sav@vcel.fr" style={{ color: 'rgba(79,195,247,0.6)', textDecoration: 'none' }}>
            sav@vcel.fr
          </a>
        </p>

      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute', bottom: 24,
        color: 'rgba(255,255,255,0.12)', fontSize: 11,
        textAlign: 'center',
      }}>
        © {new Date().getFullYear()} VCEL · vcel.fr
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}