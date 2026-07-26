'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

const ICONOS: Record<string, string> = {
  Guardar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
  Quitar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
  Escuchar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a9 9 0 0 1 0 12"/></svg>',
  Compartir: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',
  Profundo: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></svg>',
  'Crear nota de este versículo': '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/></svg>',
}

function preparar(panel: HTMLElement) {
  const acciones = Array.from(panel.querySelectorAll<HTMLElement>(':scope > button, :scope > a'))
  if (!acciones.length) return

  for (const accion of acciones) {
    const nombre = accion.getAttribute('aria-label') || accion.getAttribute('title') || ''
    const svg = ICONOS[nombre]
    if (!svg) return
    accion.innerHTML = svg
  }

  panel.dataset.vidaIconsReady = 'true'
}

export default function BibleVerseActionIconsReady() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    const revisar = (raiz: ParentNode = document) => {
      raiz.querySelectorAll<HTMLElement>('[data-vida-verse-actions="true"]').forEach(preparar)
    }

    revisar()
    const observer = new MutationObserver((mutaciones) => {
      for (const mutacion of mutaciones) {
        mutacion.addedNodes.forEach((nodo) => {
          if (!(nodo instanceof HTMLElement)) return
          if (nodo.matches('[data-vida-verse-actions="true"]')) preparar(nodo)
          revisar(nodo)
        })
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname])

  return null
}