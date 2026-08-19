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
  document.documentElement.style.colorScheme = modo === 'oscuro' ? 'dark' : 'light'
}

function retirarTema() {
  delete document.documentElement.dataset.bibliaTema
  delete document.body.dataset.bibliaTema
  document.documentElement.style.removeProperty('color-scheme')
}

function esRutaCuaderno(pathname: string) {
  return pathname === '/biblia/notas'
    || pathname.startsWith('/biblia/notas/')
    || pathname === '/biblia/notas-offline'
    || pathname.startsWith('/biblia/notas-offline/')
}

/**
 * Mantiene la paleta bíblica únicamente dentro de las superficies de lectura
 * de /biblia. El Cuaderno vive bajo esa URL por compatibilidad histórica, pero
 * visualmente es una superficie independiente y siempre debe abandonar el tema
 * oscuro/sepia de Biblia al abrirse.
 */
export default function BibleThemeRouteSync() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (!pathname.startsWith('/biblia') || esRutaCuaderno(pathname)) {
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
