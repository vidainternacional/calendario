'use client'

import { useEffect } from 'react'

function selectionElement() {
  const selection = window.getSelection()
  if (!selection?.anchorNode || selection.rangeCount === 0) return null
  return selection.anchorNode.nodeType === Node.ELEMENT_NODE
    ? selection.anchorNode as Element
    : selection.anchorNode.parentElement
}

function headingBoldState() {
  const anchor = selectionElement()
  const editor = anchor?.closest<HTMLElement>('.note-rich-editor')
  const heading = anchor?.closest<HTMLElement>('h1,h2,h3')
  if (!anchor || !editor || !heading || !editor.contains(heading)) return null

  const weight = window.getComputedStyle(anchor).fontWeight.trim().toLowerCase()
  const numericWeight = Number.parseInt(weight, 10)
  return weight === 'bold' || (!Number.isNaN(numericWeight) && numericWeight >= 600)
}

export default function NotebookEditorBehavior() {
  useEffect(() => {
    let frame = 0

    const syncBoldButton = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          const toolbar = document.querySelector<HTMLElement>('[aria-label="Herramientas de edición"]')
          const button = toolbar?.querySelector<HTMLButtonElement>('button[aria-label="Negrita"]')
          if (!button) return

          const active = headingBoldState()
          if (active === null) {
            delete button.dataset.headingBoldVisual
            return
          }

          // Título, Encabezado y Subtítulo ya poseen un peso fuerte por diseño.
          // En esos bloques el botón B debe reflejar lo que realmente ve el
          // usuario: si el texto está en negrita, B aparece activo; si el usuario
          // la quita, B vuelve a estado normal. No invertimos la lógica del botón.
          button.dataset.headingBoldVisual = active ? 'true' : 'false'
          button.setAttribute('aria-pressed', active ? 'true' : 'false')
        })
      })
    }

    document.addEventListener('selectionchange', syncBoldButton)
    document.addEventListener('click', syncBoldButton)
    document.addEventListener('input', syncBoldButton, true)
    document.addEventListener('keyup', syncBoldButton, true)
    document.addEventListener('focusin', syncBoldButton, true)
    syncBoldButton()

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('selectionchange', syncBoldButton)
      document.removeEventListener('click', syncBoldButton)
      document.removeEventListener('input', syncBoldButton, true)
      document.removeEventListener('keyup', syncBoldButton, true)
      document.removeEventListener('focusin', syncBoldButton, true)
    }
  }, [])

  return (
    <style>{`
      button[data-heading-bold-visual="true"] {
        background: rgb(124 58 237) !important;
        color: white !important;
        box-shadow: 0 1px 3px rgb(124 58 237 / .22) !important;
      }

      button[data-heading-bold-visual="false"] {
        background: color-mix(in srgb, currentColor 5%, transparent) !important;
        color: inherit !important;
        box-shadow: none !important;
      }
    `}</style>
  )
}
