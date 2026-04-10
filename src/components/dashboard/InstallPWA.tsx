'use client'
// src/components/dashboard/InstallPWA.tsx
import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner, setShowBanner]       = useState(false)
  const [installed, setInstalled]         = useState(false)

  useEffect(() => {
    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Vérifier si l'utilisateur a déjà refusé
    const dismissed = localStorage.getItem('vcel_pwa_dismissed')
    if (dismissed) return

    // Intercepter l'événement beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Détecter quand l'app est installée
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setShowBanner(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setShowBanner(false)
    }
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('vcel_pwa_dismissed', '1')
  }

  if (installed || !showBanner) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 rounded-2xl p-4 shadow-xl"
      style={{
        background: 'linear-gradient(135deg, #0D1B2A, #1e3a5f)',
        border: '1px solid rgba(79,195,247,0.2)',
        boxShadow: '0 8px 32px rgba(13,27,42,0.4)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(79,195,247,0.15)', border: '1px solid rgba(79,195,247,0.2)' }}>
          <Smartphone size={18} style={{ color: '#4FC3F7' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-0.5" style={{ color: '#ffffff' }}>
            Installer VCEL
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Accédez à votre dashboard directement depuis votre écran d'accueil.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #4FC3F7, #0288D1)', color: '#ffffff' }}
            >
              <Download size={12} />
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              Plus tard
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} style={{ color: 'rgba(255,255,255,0.3)' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  )
}