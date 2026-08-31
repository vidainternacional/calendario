'use client'

import { useEffect } from 'react'

function textoBoton(boton: HTMLButtonElement) {
  return (boton.textContent ?? '').replace(/\s+/g, ' ').trim()
}

export default function PastoralFondosRuntime() {
  useEffect(() => {
    let frame = 0

    const sincronizar = () => {
      const root = document.querySelector<HTMLElement>('.pastoral-editor-v4')
      if (!root) return

      const dock = root.querySelector<HTMLElement>('[aria-label="Herramientas del lienzo"]')
      const botonFondos = dock
        ? Array.from(dock.querySelectorAll<HTMLButtonElement>('button')).find((boton) => {
            const etiqueta = boton.getAttribute('aria-label')
            return etiqueta === 'Plantillas' || etiqueta === 'Fondos' || boton.dataset.vidaFondosTool === 'true'
          })
        : null

      if (botonFondos) {
        botonFondos.dataset.vidaFondosTool = 'true'
        botonFondos.setAttribute('aria-label', 'Fondos')
        botonFondos.setAttribute('title', 'Fondos')
        const etiqueta = botonFondos.querySelector('small')
        if (etiqueta) etiqueta.textContent = 'Fondos'
      }

      const panel = root.querySelector<HTMLElement>('aside[aria-label]')
      if (panel) {
        if (panel.getAttribute('aria-label') === 'Panel plantillas') panel.setAttribute('aria-label', 'Panel fondos')
        const opciones = panel.querySelector<HTMLElement>('[aria-label^="Opciones de "]')
        if (opciones) {
          opciones.setAttribute('aria-label', 'Opciones de fondos')
          const botones = Array.from(opciones.querySelectorAll<HTMLButtonElement>('button'))
          const antiguaPlantilla = botones.find((boton) => boton.dataset.vidaPlantillasOculta === 'true' || textoBoton(boton) === 'Plantillas')
          if (antiguaPlantilla) {
            antiguaPlantilla.dataset.vidaPlantillasOculta = 'true'
            antiguaPlantilla.hidden = true
            antiguaPlantilla.style.display = 'none'
          }

          const fondos = botones.find((boton) => boton.dataset.vidaFondosPanel === 'true' || textoBoton(boton) === 'Temas')
          if (fondos) {
            fondos.dataset.vidaFondosPanel = 'true'
            fondos.textContent = 'Fondos'
            fondos.setAttribute('aria-label', 'Fondos')

            if (botonFondos?.getAttribute('aria-expanded') === 'true' && fondos.getAttribute('aria-pressed') !== 'true') {
              fondos.click()
              return
            }
          }
        }
      }

      const grilla = root.querySelector<HTMLElement>('[aria-label="Temas en filas de tres"], [aria-label="Fondos disponibles"]')
      if (grilla) {
        grilla.setAttribute('aria-label', 'Fondos disponibles')
        grilla.style.gridTemplateColumns = 'repeat(5,minmax(0,1fr))'
        grilla.style.columnGap = '10px'
        grilla.style.rowGap = '14px'

        Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button')).forEach((boton) => {
          boton.setAttribute('title', textoBoton(boton))
          const muestra = boton.querySelector<HTMLElement>(':scope > span:first-child')
          if (muestra) {
            muestra.style.aspectRatio = '1 / 1'
            muestra.style.width = '100%'
            muestra.style.maxWidth = '58px'
            muestra.style.marginInline = 'auto'
            muestra.style.borderRadius = '9999px'
            muestra.style.boxShadow = 'inset 0 0 0 1px rgba(15,23,42,.08)'
            Array.from(muestra.querySelectorAll<HTMLElement>('i')).forEach((decoracion) => {
              decoracion.style.display = 'none'
            })
          }
        })
      }

      Array.from(root.querySelectorAll<HTMLElement>('small')).forEach((texto) => {
        if (texto.textContent?.includes('Tema o plantilla · bloqueado')) texto.textContent = 'Fondo · bloqueado'
      })
    }

    const programar = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(sincronizar)
    }

    const observador = new MutationObserver(programar)
    observador.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded', 'aria-pressed'] })
    document.addEventListener('click', programar, true)
    programar()

    return () => {
      window.cancelAnimationFrame(frame)
      observador.disconnect()
      document.removeEventListener('click', programar, true)
    }
  }, [])

  return null
}
