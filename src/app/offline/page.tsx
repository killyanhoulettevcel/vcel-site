'use client'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0D1B2A', fontFamily: "'DM Sans', sans-serif",
      padding: '24px', textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: 'rgba(79,195,247,0.1)',
        border: '1px solid rgba(79,195,247,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
      }}>
        <WifiOff size={30} color="#4FC3F7" />
      </div>

      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: '#ffffff', marginBottom: 10 }}>
        Pas de connexion
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, marginBottom: 36, maxWidth: 300 }}>
        Vérifiez votre connexion internet et réessayez.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', borderRadius: 12,
          background: 'linear-gradient(135deg, #4FC3F7, #0288D1)',
          color: '#ffffff', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600,
        }}
      >
        <RefreshCw size={15} />
        Réessayer
      </button>

      <div style={{ marginTop: 48 }}>
        <img src="/logo.png" alt="VCEL" style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.3 }} />
      </div>
    </div>
  )
}