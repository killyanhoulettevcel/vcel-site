'use client'
import { useState, useEffect } from 'react'
import { Activity, ArrowUpRight, Clock, Wrench } from 'lucide-react'

function useVcelStatus() {
  const [status, setStatus] = useState<'up' | 'down' | 'maintenance' | 'loading'>('loading')
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('https://status.vcel.fr/api/status-page/heartbeat/vcel', { cache: 'no-store' })
        if (!res.ok) { setStatus('maintenance'); return }
        const data = await res.json()
        const allUp = data?.heartbeatList && Object.values(data.heartbeatList).every(
          (beats: any) => beats?.[beats.length - 1]?.status === 1
        )
        setStatus(allUp ? 'up' : 'down')
      } catch { setStatus('maintenance') }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])
  return status
}

function useElapsed() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const KEY       = 'vcel_maintenance_start'
    const BUILD_KEY = 'vcel_maintenance_build'

    // VERCEL_DEPLOYMENT_ID change à chaque déploiement → reset automatique du compteur
    // On injecte la build ID via une meta tag dans le HTML (voir layout.tsx)
    const currentBuild = document.querySelector('meta[name="build-id"]')?.getAttribute('content') || ''
    const savedBuild   = localStorage.getItem(BUILD_KEY) || ''

    // Si nouvelle build (nouveau déploiement avec MAINTENANCE_MODE=true) → reset
    if (currentBuild && currentBuild !== savedBuild) {
      localStorage.removeItem(KEY)
      localStorage.setItem(BUILD_KEY, currentBuild)
    }

    let start = parseInt(localStorage.getItem(KEY) || '0')
    if (!start) {
      start = Date.now()
      localStorage.setItem(KEY, String(start))
    }

    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MaintenancePage() {
  const status  = useVcelStatus()
  const elapsed = useElapsed()
  const [dots, setDots] = useState('.')

  useEffect(() => {
    // Forcer le fond dark sur html et body
    document.documentElement.style.backgroundColor = '#0D1B2A'
    document.body.style.backgroundColor = '#0D1B2A'
    return () => {
      document.documentElement.style.backgroundColor = ''
      document.body.style.backgroundColor = ''
    }
  }, [])

  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(i)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0D1B2A', fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Fond animé */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(79,195,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse, rgba(79,195,247,0.10) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: -100,
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(2,136,209,0.08) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 520, width: '100%' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 48 }}>
          <img src="/logo.png" alt="VCEL" style={{ height: 32, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        </div>

        {/* Icône */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(2,136,209,0.1))',
            border: '1px solid rgba(79,195,247,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'breathe 2.5s ease-in-out infinite',
          }}>
            <Wrench size={32} color="#4FC3F7" />
          </div>
        </div>

        {/* Titre */}
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 38, fontWeight: 400, color: '#ffffff',
          marginBottom: 14, lineHeight: 1.2,
        }}>
          Maintenance en cours
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.8, marginBottom: 44 }}>
          On améliore VCEL pour vous offrir une meilleure expérience.<br />
          On revient très vite{dots}
        </p>

        {/* Timer + Status */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 44, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Clock size={13} color="rgba(255,255,255,0.3)" />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>En cours depuis</span>
            <span style={{ color: '#4FC3F7', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {elapsed}
            </span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
              background: status === 'up' ? '#22c55e' : status === 'loading' ? '#4FC3F7' : '#f97316',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <Activity size={13} color={status === 'up' ? '#22c55e' : status === 'loading' ? '#4FC3F7' : '#f97316'} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              {status === 'loading'     ? 'Vérification...' :
               status === 'up'          ? 'Services opérationnels' :
               status === 'down'        ? 'Incident détecté' :
               'Maintenance active'}
            </span>
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://status.vcel.fr/status/vcel"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
            color: '#ffffff', textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 24px rgba(79,195,247,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 32px rgba(79,195,247,0.4)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(79,195,247,0.3)'
          }}
        >
          <Activity size={15} />
          Voir le statut en temps réel
          <ArrowUpRight size={14} />
        </a>

        <p style={{ marginTop: 28, color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>
          Une urgence ?{' '}
          <a href="mailto:sav@vcel.fr" style={{ color: 'rgba(79,195,247,0.5)', textDecoration: 'none' }}>
            sav@vcel.fr
          </a>
        </p>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 24,
        color: 'rgba(255,255,255,0.12)', fontSize: 11, textAlign: 'center',
      }}>
        © {new Date().getFullYear()} VCEL · vcel.fr
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.06); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}