'use client'

import { useEffect } from 'react'

type VistaElementos = 'lista' | 'compacta'

const VISTAS: Array<{ id: VistaElementos; label: string }> = [
  { id: 'lista', label: 'Lista' },
  { id: 'compacta', label: 'Miniaturas' },
]

export default function PastoralElementsViewEnhancements() {
  useEffect(() => {
    let vista: VistaElementos = 'compacta'
    let frame = 0

    const sincronizar = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const panel = document.querySelector<HTMLElement>('.pastoral-editor-v4 .pastoral-elements-panel')
        const grid = panel?.querySelector<HTMLElement>('.pastoral-elements-grid')
        if (!panel || !grid) return

        grid.dataset.view = vista

        grid.querySelectorAll<HTMLButtonElement>(':scope > button').forEach((button) => {
          if (button.querySelector('.pastoral-elements-list-label')) return
          const img = button.querySelector<HTMLImageElement>('img')
          const label = document.createElement('span')
          label.className = 'pastoral-elements-list-label'
          label.textContent = img?.alt?.trim() || 'Imagen'
          button.appendChild(label)
        })

        let controles = panel.querySelector<HTMLElement>('[data-pastoral-elements-view-toggle]')
        if (!controles) {
          controles = document.createElement('div')
          controles.dataset.pastoralElementsViewToggle = 'true'
          controles.className = 'pastoral-elements-view-toggle'
          controles.setAttribute('role', 'group')
          controles.setAttribute('aria-label', 'Vista de imágenes')

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
