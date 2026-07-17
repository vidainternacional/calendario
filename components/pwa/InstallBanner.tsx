'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true)

  useEffect(() => {
    // Check if running as PWA already
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsStandalone(isRunningStandalone)

    if (isRunningStandalone) return // Already installed

    // Detect iOS for specific instructions (iOS doesn't support beforeinstallprompt)
    const ua = window.navigator.userAgent
    const isIPad = !!ua.match(/iPad/i)
    const isIPhone = !!ua.match(/iPhone/i)
    const isWebKit = !!ua.match(/WebKit/i)
    const isIOSDevice = (isIPad || isIPhone) && isWebKit && !ua.match(/CriOS/i)
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      // For iOS, just show a hint banner, as we can't trigger an install prompt programmatically
      const hasDismissed = sessionStorage.getItem('pwa_dismissed')
      if (!hasDismissed) {
        setShowBanner(true)
      }
    }

    // For Android / Desktop Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault() // Prevent automatic prompt
      setDeferredPrompt(e)
      const hasDismissed = sessionStorage.getItem('pwa_dismissed')
      if (!hasDismissed) {
        setShowBanner(true) // Show our custom UI
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    const handleAppInstalled = () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (isStandalone || !showBanner) return null

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const dismissBanner = () => {
    sessionStorage.setItem('pwa_dismissed', 'true')
    setShowBanner(false)
  }

  if (isIOS) {
    return (
      <div className="bg-indigo-600 text-white rounded-[18px] p-4 mb-8 shadow-lg flex items-start gap-3 relative animate-in slide-in-from-top-4">
        <button onClick={dismissBanner} className="absolute top-2 right-2 p-1 text-indigo-200 hover:text-white rounded-full">
          <X className="w-4 h-4" />
        </button>
        <div className="bg-white/20 p-2 rounded-xl shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="pr-4">
          <h3 className="font-bold text-sm">Instala la App de Vida</h3>
          <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
            Para instalar en iOS: toca el botón <strong>Compartir</strong> y luego <strong>"Añadir a la pantalla de inicio"</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-indigo-600 text-white rounded-[18px] p-4 mb-8 shadow-[0_6px_24px_rgba(79,70,229,0.30)] flex items-center justify-between gap-4 relative animate-in slide-in-from-top-4 pr-10">
      <button onClick={dismissBanner} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-indigo-200 hover:text-white rounded-full">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-xl shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Instala la App de Vida</h3>
          <p className="text-[11px] text-indigo-200 mt-0.5">Acceso rápido y mejor experiencia</p>
        </div>
      </div>
      <button 
        onClick={handleInstallClick}
        className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform shrink-0"
      >
        Instalar
      </button>
    </div>
  )
}
