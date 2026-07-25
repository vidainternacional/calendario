'use client'

import { createElement, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import PastoralBibleNative from '@/components/pastoral/PastoralBibleNative'

export default function PastoralWorkspaceBridge({ paqueteId }: { paqueteId: string }) {
  useEffect(() => {
    let root: Root | null = null
    let mount: HTMLDivElement | null = null

    const prepararInterfaz = () => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Biblia integrada del Centro Pastoral"]')
      if (!iframe) return

      const section = iframe.closest('section')
      if (!section || section.dataset.bibliaNativa === 'true') return
      section.dataset.bibliaNativa = 'true'

      Array.from(section.children).forEach((child) => {
        if (child instanceof HTMLElement) child.style.display = 'none'
      })

      mount = document.createElement('div')
      mount.dataset.pastoralBibleNative = 'true'
      mount.className = 'w-full'
      section.appendChild(mount)
      section.className = 'w-full'

      root = createRoot(mount)
      root.render(createElement(PastoralBibleNative, { paqueteId }))

      document.querySelectorAll<HTMLLabelElement>('label').forEach((label) => {
        if (label.textContent?.includes('Colección de versículos')) label.style.display = 'none'
      })
    }

    prepararInterfaz()
    const observer = new MutationObserver(prepararInterfaz)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      root?.unmount()
      mount?.remove()
    }
  }, [paqueteId])

  return null
}
