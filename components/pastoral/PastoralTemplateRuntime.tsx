'use client'

import { useLayoutEffect } from 'react'
import type { PlantillaAdministrada } from '@/components/pastoral/pastoral-template-admin-model'

const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim().toLowerCase()

export default function PastoralTemplateRuntime({ catalogo }: { catalogo: PlantillaAdministrada[] }) {
  useLayoutEffect(() => {
    void catalogo
    let frame = 0
    let cambiandoPanel = false

    const sincronizar = () => {
      const root = document.querySelector<HTMLElement>('.pastoral-editor-v4')
      if (!root) return

      const dock = root.querySelector<HTMLElement>('[aria-label="Herramientas del lienzo"]')
      const fondos = dock
        ? Array.from(dock.querySelectorAll<HTMLButtonElement>(':scope > button.pastoral-tool-button')).find((boton) => {
            const etiqueta = normalizar(boton.getAttribute('aria-label') ?? boton.textContent ?? '')
            return etiqueta === 'plantillas' || etiqueta === 'fondos'
          })
        : null

      if (!fondos) return

      fondos.setAttribute('aria-label', 'Fondos')
      fondos.setAttribute('title', 'Fondos')
      const textoFondos = fondos.querySelector('small')
      if (textoFondos) textoFondos.textContent = 'Fondos'

      if (fondos.getAttribute('aria-expanded') !== 'true') return

      const panel = root.querySelector<HTMLElement>('aside[aria-label="Panel plantillas"], aside[aria-label="Panel fondos"]')
      if (!panel) return
      panel.setAttribute('aria-label', 'Panel fondos')

      const barra = panel.querySelector<HTMLElement>('[aria-label^="Opciones de "]')
      if (!barra) return
      barra.setAttribute('aria-label', 'Opciones de fondos')

      const botones = Array.from(barra.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const plantillas = botones[0] ?? null
      const temas = botones[1] ?? null
      const imagenes = botones[2] ?? null

      if (plantillas) {
        plantillas.hidden = true
        plantillas.style.display = 'none'
        plantillas.setAttribute('aria-hidden', 'true')
        plantillas.tabIndex = -1
      }

      if (temas) {
        temas.textContent = 'Colores y texturas'
        temas.setAttribute('aria-label', 'Colores, degradados y texturas')
      }

      if (imagenes) {
        imagenes.textContent = 'Imágenes'
        imagenes.setAttribute('aria-label', 'Imágenes de fondo')
      }

      if (temas && temas.getAttribute('aria-pressed') !== 'true' && !cambiandoPanel) {
        cambiandoPanel = true
        temas.click()
        window.requestAnimationFrame(() => {
          cambiandoPanel = false
          sincronizar()
        })
        return
      }

      const grilla = root.querySelector<HTMLElement>('[aria-label="Temas en filas de tres"]')
      if (grilla) {
        grilla.setAttribute('aria-label', 'Fondos disponibles')
        const seccion = grilla.parentElement
        const titulo = seccion?.querySelector<HTMLElement>('.pastoral-panel-label')
        if (titulo) titulo.textContent = 'Fondos'
      }
    }

    const programar = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(sincronizar)
    }

    sincronizar()
    const observador = new MutationObserver(programar)
    observador.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded', 'aria-pressed'],
    })

    return () => {
      window.cancelAnimationFrame(frame)
      observador.disconnect()
    }
  }, [catalogo])

  return null
}
