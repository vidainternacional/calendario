'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function BibleNotesInlinePolish() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/biblia/notas') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('inline') !== '1') return

    document.documentElement.dataset.vidaNotasInline = 'true'
    document.body.dataset.vidaNotasInline = 'true'

    const aplicar = () => {
      document.querySelector<HTMLElement>('.app-bottom-nav')?.style.setProperty('display', 'none', 'important')
      const main = document.querySelector<HTMLElement>('main')
      if (main) {
        main.style.minHeight = '100%'
        main.style.paddingTop = '0.5rem'
        main.style.paddingBottom = '1rem'
      }
      const header = main?.querySelector<HTMLElement>('header')
      if (header) header.style.display = 'none'
    }

    aplicar()
    const observer = new MutationObserver(aplicar)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname])

  return null
}
