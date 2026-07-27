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

      const url = new URL(iframe.src, window.location.origin)
      url.searchParams.set('from', 'pastoral')
      url.searchParams.set('embed', '1')
      url.searchParams.set('paqueteId', paqueteId)

      if (iframe.src !== url.toString()) iframe.src = url.toString()
      iframe.className = 'h-[70dvh] min-h-[520px] max-h-[760px] w-full border-0 bg-transparent'
      iframe.setAttribute('loading', 'lazy')
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
