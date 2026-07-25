'use client'

import { useEffect } from 'react'

export default function PastoralWorkspaceBridge({ paqueteId }: { paqueteId: string }) {
  useEffect(() => {
    let recargaProgramada = false

    const prepararInterfaz = () => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Biblia integrada del Centro Pastoral"]')
      if (iframe) {
        const url = new URL(iframe.src, window.location.origin)
        if (url.searchParams.get('paqueteId') !== paqueteId) {
          url.searchParams.set('paqueteId', paqueteId)
          iframe.src = url.toString()
        }
      }

      document.querySelectorAll<HTMLButtonElement>('button').forEach((boton) => {
        if (boton.textContent?.includes('Actualizar versículos')) boton.style.display = 'none'
      })

      document.querySelectorAll<HTMLLabelElement>('label').forEach((label) => {
        if (!label.textContent?.includes('Colección de versículos')) return
        label.style.display = 'none'
      })

      document.querySelectorAll<HTMLParagraphElement>('p').forEach((parrafo) => {
        if (parrafo.textContent?.includes('Busque un pasaje, agréguelo a una colección pastoral')) {
          parrafo.textContent = 'Busque un pasaje, toque el versículo y agréguelo directamente a este proyecto.'
        }
      })
    }

    const manejarMensaje = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!['vida:pastoral-versiculo-agregado', 'vida:pastoral-versiculo-eliminado'].includes(event.data?.type)) return
      if (recargaProgramada) return
      recargaProgramada = true
      window.setTimeout(() => window.location.reload(), 250)
    }

    prepararInterfaz()
    const observer = new MutationObserver(prepararInterfaz)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('message', manejarMensaje)

    return () => {
      observer.disconnect()
      window.removeEventListener('message', manejarMensaje)
    }
  }, [paqueteId])

  return null
}
