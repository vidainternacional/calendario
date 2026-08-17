'use client'

import { useEffect } from 'react'

export default function NotebookEditorBehavior() {
  useEffect(() => {
    const normalizeHeadingBoldBaseline = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const button = target.closest<HTMLButtonElement>('button[aria-label="Negrita"]')
      if (!button || !button.closest('[aria-label="Herramientas de edición"]')) return

      const selection = window.getSelection()
      if (!selection?.anchorNode || selection.rangeCount === 0) return

      const anchor = selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? selection.anchorNode as Element
        : selection.anchorNode.parentElement
      const editor = anchor?.closest<HTMLElement>('.note-rich-editor')
      const heading = anchor?.closest<HTMLElement>('h1,h2,h3')
      if (!editor || !heading || !editor.contains(heading)) return

      const previousWeight = heading.style.getPropertyValue('font-weight')
      const previousPriority = heading.style.getPropertyPriority('font-weight')

      // Título/Encabezado/Subtítulo tienen peso propio. Antes de ejecutar el
      // comando Negrita normalizamos solo durante un frame para que el navegador
      // alterne la negrita explícita, no la negrita visual propia del encabezado.
      // Así: Título + B agrega énfasis; otro toque en B lo quita y vuelve al peso
      // normal de Título, sin convertir el encabezado en texto liviano.
      heading.dataset.noteBoldBaseline = 'normalized'
      heading.style.setProperty('font-weight', '400', 'important')

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!heading.isConnected) return
          if (previousWeight) heading.style.setProperty('font-weight', previousWeight, previousPriority)
          else heading.style.removeProperty('font-weight')
          delete heading.dataset.noteBoldBaseline
        })
      })
    }

    document.addEventListener('pointerdown', normalizeHeadingBoldBaseline, true)
    return () => document.removeEventListener('pointerdown', normalizeHeadingBoldBaseline, true)
  }, [])

  return (
    <style>{`
      .note-rich-editor h1 strong,
      .note-rich-editor h1 b,
      .note-rich-editor h2 strong,
      .note-rich-editor h2 b,
      .note-rich-editor h3 strong,
      .note-rich-editor h3 b {
        font-weight: 900 !important;
      }
    `}</style>
  )
}
