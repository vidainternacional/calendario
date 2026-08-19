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

function marcarObjetivoCuaderno(activo: boolean) {
  if (activo) {
    document.documentElement.dataset.vidaCuadernoTarget = 'true'
    document.documentElement.style.colorScheme = 'light'
    return
  }
  delete document.documentElement.dataset.vidaCuadernoTarget
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
    const cuaderno = esRutaCuaderno(pathname)
    marcarObjetivoCuaderno(cuaderno)

    if (!pathname.startsWith('/biblia') || cuaderno) {
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

  useLayoutEffect(() => {
    const prepararNavegacion = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest('a[href]')
      if (!link) return

      try {
        const url = new URL(link.getAttribute('href') || '', window.location.href)
        if (url.origin !== window.location.origin || !esRutaCuaderno(url.pathname)) return
        marcarObjetivoCuaderno(true)
        retirarTema()
      } catch {}
    }

    document.addEventListener('click', prepararNavegacion, true)
    return () => document.removeEventListener('click', prepararNavegacion, true)
  }, [])

  return null
}
