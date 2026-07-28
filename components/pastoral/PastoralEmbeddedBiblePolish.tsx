'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PastoralEmbeddedBiblePolish() {
  const pathname = usePathname()

  useEffect(() => {
    if (!/^\/pastoral\/paquetes\/[^/]+$/.test(pathname)) return

    const aplicar = () => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Biblia integrada del Centro Pastoral"]')
      if (!iframe) return false

      const url = new URL('/biblia', window.location.origin).toString()
      if (iframe.src !== url) iframe.src = url

      iframe.className = 'h-[82dvh] min-h-[640px] max-h-[980px] w-full border-0 bg-transparent'
      iframe.setAttribute('loading', 'eager')
      return true
    }

    if (aplicar()) return

    const observer = new MutationObserver(() => {
      aplicar()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
