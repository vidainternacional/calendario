'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PastoralEmbeddedBiblePolish() {
  const pathname = usePathname()

  useEffect(() => {
    const match = pathname.match(/^\/pastoral\/paquetes\/([^/]+)$/)
    if (!match) return

    const paqueteId = match[1]
    const aplicar = () => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Biblia integrada del Centro Pastoral"]')
      if (!iframe) return false

      const url = new URL('/biblia', window.location.origin)
      url.searchParams.set('from', 'pastoral')
      url.searchParams.set('workspace', '1')
      url.searchParams.set('paqueteId', paqueteId)
      url.searchParams.set('full', '4')

      if (iframe.src !== url.toString()) iframe.src = url.toString()
      iframe.className = 'h-[78dvh] min-h-[600px] max-h-[900px] w-full border-0 bg-transparent'
      iframe.setAttribute('loading', 'eager')
      return true
    }

    if (aplicar()) return
    const observer = new MutationObserver(() => {
      if (aplicar()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname])

  return null
}
