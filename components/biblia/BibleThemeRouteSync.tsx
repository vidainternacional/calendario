'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

const PREF_KEY = 'vida-biblia-preferencias'
type ModoBiblia = 'claro' | 'sepia' | 'oscuro'

function leerTemaGuardado(): ModoBiblia {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    const modo = raw ? JSON.parse(raw)?.modo : 'claro'
    return modo === 'sepia' || modo === 'oscuro' ? modo : 'claro'
  } catch {
    return 'claro'
  }
}

function aplicarTema(modo: ModoBiblia) {
  document.documentElement.dataset.bibliaTema = modo
  document.body.dataset.bibliaTema = modo
}

function retirarTema() {
  delete document.documentElement.dataset.bibliaTema
  delete document.body.dataset.bibliaTema
}

/**
 * Mantiene la paleta bíblica únicamente dentro de las rutas /biblia.
 * Se ejecuta en layout effect para que la navegación cliente no pinte primero
 * el fondo claro general de la aplicación.
 */
export default function BibleThemeRouteSync() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (!pathname.startsWith('/biblia')) {
      retirarTema()
      return
    }

    const sincronizar = () => aplicarTema(leerTemaGuardado())
    const actualizarDesdeEvento = (event: Event) => {
      const modo = (event as CustomEvent<{ modo?: ModoBiblia }>).detail?.modo
      aplicarTema(modo === 'claro' || modo === 'sepia' || modo === 'oscuro' ? modo : leerTemaGuardado())
    }

    sincronizar()
    window.addEventListener('vida-biblia-theme', actualizarDesdeEvento)
    window.addEventListener('storage', sincronizar)

    return () => {
      window.removeEventListener('vida-biblia-theme', actualizarDesdeEvento)
      window.removeEventListener('storage', sincronizar)
    }
  }, [pathname])

  return null
}
