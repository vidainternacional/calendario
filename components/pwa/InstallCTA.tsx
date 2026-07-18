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

    // Detect any iOS device (Safari, Chrome, Firefox — all WebKit on iOS)
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

  // Already installed — show "Abrir la app" link
  if (isStandalone) {
    return (
      <a
        href="/inicio"
        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#C0392B] text-white font-bold text-lg shadow-lg shadow-red-900/30 hover:bg-[#a93226] active:scale-95 transition-all"
      >
        Abrir la App →
      </a>
    )
  }

  // iOS — show hint panel
  if (isIOS) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setShowIOSHint(v => !v)}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#C0392B] text-white font-bold text-lg shadow-lg shadow-red-900/30 hover:bg-[#a93226] active:scale-95 transition-all"
        >
          <Download className="w-5 h-5" />
          Descargar la App
        </button>

        {showIOSHint && (
          <div className="mt-2 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl px-5 py-4 max-w-xs shadow-xl text-sm text-slate-700 text-left animate-in slide-in-from-top-3">
            <p className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <Share className="w-4 h-4 text-blue-500" />
              Cómo instalar en iOS
            </p>
            <ol className="list-decimal list-inside space-y-1.5 leading-snug">
              <li>Toca el botón <strong>Compartir</strong> (cuadrado con flecha ↑) en Safari.</li>
              <li>Desplázate y toca <strong>"Añadir a la pantalla de inicio"</strong>.</li>
              <li>Confirma tocando <strong>"Añadir"</strong>.</li>
            </ol>
            <p className="text-xs text-slate-400 mt-2">* Debes abrirlo en Safari para que esta opción aparezca.</p>
          </div>
        )}
      </div>
    )
  }

  // Android / Desktop Chrome — native prompt
  if (deferredPrompt) {
    return (
      <button
        onClick={async () => {
          deferredPrompt.prompt()
          await deferredPrompt.userChoice
          setDeferredPrompt(null)
        }}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#C0392B] text-white font-bold text-lg shadow-lg shadow-red-900/30 hover:bg-[#a93226] active:scale-95 transition-all"
      >
        <Download className="w-5 h-5" />
        Descargar la App
      </button>
    )
  }

  // Fallback — browser doesn't support install prompt yet, link to /inicio
  return (
    <a
      href="/inicio"
      className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#C0392B] text-white font-bold text-lg shadow-lg shadow-red-900/30 hover:bg-[#a93226] active:scale-95 transition-all"
    >
      <Download className="w-5 h-5" />
      Descargar la App
    </a>
  )
}
