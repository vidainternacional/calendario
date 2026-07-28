'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

function texto(elemento: Element) {
  return (elemento.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export default function BibleNotesInlineMode() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    const preparar = () => {
      const boton = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
        .find((item) => texto(item) === 'Notas')

      if (!boton) return false
      boton.dataset.vidaNotasReady = 'true'
      boton.dataset.vidaNotesInline = 'true'
      return true
    }

    preparar()
    const observer = new MutationObserver(preparar)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
