'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PastoralEmbeddedBiblePolish() {
  const pathname = usePathname()

  useEffect(() => {
    const match = pathname.match(/^\/pastoral\/paquetes\/([^/]+)$/)
    if (!match) return

    const paqueteId = match[1]
    const destino = new URL('/biblia', window.location.origin)
    destino.searchParams.set('from', 'pastoral')
    destino.searchParams.set('workspace', '1')
    destino.searchParams.set('paqueteId', paqueteId)
    destino.searchParams.set('source', 'pastoral-workspace-v1')

    const aplicar = () => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Biblia integrada del Centro Pastoral"]')
      if (!iframe) return false

      const actual = new URL(iframe.src || iframe.getAttribute('src') || '/', window.location.origin)
      const esCorrecta = actual.pathname === '/biblia'
        && actual.searchParams.get('from') === 'pastoral'
        && actual.searchParams.get('workspace') === '1'
        && actual.searchParams.get('paqueteId') === paqueteId

      if (!esCorrecta) iframe.src = destino.toString()
      iframe.className = 'h-[82dvh] min-h-[640px] max-h-[980px] w-full border-0 bg-transparent'
      iframe.setAttribute('loading', 'eager')
      iframe.setAttribute('data-vida-pastoral-bible', 'general')
      return true
    }

    aplicar()
    const observer = new MutationObserver(aplicar)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(aplicar, 500)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [pathname])

  return null
}
