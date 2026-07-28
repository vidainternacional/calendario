'use client'

import { useLayoutEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const PREF_KEY = 'vida-biblia-preferencias'

function texto(elemento: Element | null) {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function fondoNotas() {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    const modo = raw ? JSON.parse(raw)?.modo : 'claro'
    if (modo === 'oscuro') return '#020617'
    if (modo === 'sepia') return '#efe5d0'
  } catch {}
  return '#f7f7f4'
}

export default function BibleNotesNavigationFix() {
  const pathname = usePathname()
  const router = useRouter()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    const destino = '/biblia/notas'
    router.prefetch(destino)

    const manejarClick = (event: MouseEvent) => {
      const objetivo = event.target as HTMLElement | null
      const boton = objetivo?.closest<HTMLButtonElement>('button')
      if (!boton || texto(boton) !== 'Notas') return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      document.querySelectorAll<HTMLElement>('[data-vida-notes-transition="true"], [data-vida-route-overlay="true"]')
        .forEach((elemento) => elemento.remove())

      const fondo = fondoNotas()
      document.documentElement.style.backgroundColor = fondo
      document.body.style.backgroundColor = fondo

      router.push(destino)
    }

    document.addEventListener('click', manejarClick, true)
    return () => document.removeEventListener('click', manejarClick, true)
  }, [pathname, router])

  return null
}
