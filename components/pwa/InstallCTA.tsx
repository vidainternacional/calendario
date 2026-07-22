'use client'

import { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'

/**
 * Hero CTA button that triggers the PWA install prompt on Android/Chrome,
 * or shows step-by-step instructions on iOS (all WebKit browsers).
 */
export default function InstallCTA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    const ua = window.navigator.userAgent
    const isIPadOS =
      window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1
    const ios = /iPad|iPhone|iPod/i.test(ua) || isIPadOS
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!mounted) return null

  const buttonClass =
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#C0392B] px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-[#a93226] active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4 sm:text-lg'

  if (isStandalone) {
    return (
      <a href="/inicio" className={buttonClass}>
        Abrir la App →
      </a>
    )
  }

  if (isIOS) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <button
          onClick={() => setShowIOSHint(v => !v)}
          className={buttonClass}
          aria-expanded={showIOSHint}
        >
          <Download className="h-5 w-5 shrink-0" />
          Descargar la App
        </button>

        {showIOSHint && (
          <div className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 text-left text-sm text-slate-700 shadow-xl backdrop-blur animate-in slide-in-from-top-3 sm:px-5">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-slate-900">
              <Share className="h-4 w-4 shrink-0 text-blue-500" />
              Cómo instalar en iOS
            </p>
            <ol className="list-inside list-decimal space-y-1.5 leading-relaxed">
              <li>Toca el botón <strong>Compartir</strong> en Safari.</li>
              <li>Busca <strong>Añadir a la pantalla de inicio</strong>.</li>
              <li>Confirma tocando <strong>Añadir</strong>.</li>
            </ol>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">Debes abrir la página en Safari para ver esta opción.</p>
          </div>
        )}
      </div>
    )
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={async () => {
          deferredPrompt.prompt()
          await deferredPrompt.userChoice
          setDeferredPrompt(null)
        }}
        className={buttonClass}
      >
        <Download className="h-5 w-5 shrink-0" />
        Descargar la App
      </button>
    )
  }

  return (
    <a href="/inicio" className={buttonClass}>
      <Download className="h-5 w-5 shrink-0" />
      Descargar la App
    </a>
  )
}
