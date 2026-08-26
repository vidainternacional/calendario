'use client'

import { useEffect } from 'react'

type VistaElementos = 'grande' | 'mosaico' | 'compacta'

const VISTAS: Array<{ id: VistaElementos; label: string }> = [
  { id: 'grande', label: 'Grande' },
  { id: 'mosaico', label: 'Mosaico' },
  { id: 'compacta', label: 'Compacta' },
]

export default function PastoralElementsViewEnhancements() {
  useEffect(() => {
    let vista: VistaElementos = 'mosaico'
    let frame = 0

    const sincronizar = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const panel = document.querySelector<HTMLElement>('.pastoral-editor-v4 .pastoral-elements-panel')
        const grid = panel?.querySelector<HTMLElement>('.pastoral-elements-grid')
        if (!panel || !grid) return

        grid.dataset.view = vista

        let controles = panel.querySelector<HTMLElement>('[data-pastoral-elements-view-toggle]')
        if (!controles) {
          controles = document.createElement('div')
          controles.dataset.pastoralElementsViewToggle = 'true'
          controles.className = 'pastoral-elements-view-toggle'
          controles.setAttribute('role', 'group')
          controles.setAttribute('aria-label', 'Vista de miniaturas')

          for (const opcion of VISTAS) {
            const button = document.createElement('button')
            button.type = 'button'
            button.dataset.view = opcion.id
            button.textContent = opcion.label
            button.setAttribute('aria-label', `Vista ${opcion.label.toLowerCase()}`)
            button.addEventListener('click', () => {
              vista = opcion.id
              grid.dataset.view = vista
              controles?.querySelectorAll<HTMLButtonElement>('button').forEach((item) => {
                const activo = item.dataset.view === vista
                item.classList.toggle('is-active', activo)
                item.setAttribute('aria-pressed', String(activo))
              })
            })
            controles.appendChild(button)
          }

          grid.before(controles)
        }

        controles.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
          const activo = button.dataset.view === vista
          button.classList.toggle('is-active', activo)
          button.setAttribute('aria-pressed', String(activo))
        })
      })
    }

    sincronizar()
    const observer = new MutationObserver(sincronizar)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return null
}
