'use client'

import { useEffect } from 'react'
import { PALETAS_PRESENTACION } from '@/components/pastoral/pastoral-editor-presets'

const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim().toLowerCase()

function textoBoton(boton: HTMLButtonElement) {
  return normalizar(boton.textContent ?? '')
}

function contrasteHex(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#FFFFFF'
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const luminancia = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminancia > 0.58 ? '#0F172A' : '#FFFFFF'
}

export default function PastoralFondosRuntime() {
  useEffect(() => {
    let frame = 0

    const programar = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(sincronizar)
    }

    const sincronizar = () => {
      const root = document.querySelector<HTMLElement>('.pastoral-editor-v4')
      if (!root) return

      const dock = root.querySelector<HTMLElement>('[aria-label="Herramientas del lienzo"]')
      if (!dock) return

      const principales = Array.from(dock.querySelectorAll<HTMLButtonElement>(':scope > button.pastoral-tool-button'))
      const fondos = principales.find((boton) => {
        const etiqueta = normalizar(boton.getAttribute('aria-label') ?? '')
        return etiqueta === 'plantillas' || etiqueta === 'fondos'
      }) ?? principales[0]
      const texto = principales.find((boton) => normalizar(boton.getAttribute('aria-label') ?? '') === 'texto')
      const capas = principales.find((boton) => normalizar(boton.getAttribute('aria-label') ?? '') === 'capas')

      if (!fondos || !texto || !capas) return

      fondos.setAttribute('aria-label', 'Fondos')
      fondos.setAttribute('title', 'Fondos')
      const etiquetaFondos = fondos.querySelector('small')
      if (etiquetaFondos) etiquetaFondos.textContent = 'Fondos'

      const borrar = Array.from(dock.querySelectorAll<HTMLButtonElement>(':scope > button'))
        .find((boton) => !boton.classList.contains('pastoral-tool-button')) ?? null

      dock.insertBefore(fondos, texto)
      dock.insertBefore(texto, capas)
      if (borrar) dock.insertBefore(capas, borrar)
      dock.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr)) 44px'
      dock.style.gap = '8px'
      ;[fondos, texto, capas].forEach((boton) => {
        boton.style.gridColumn = 'auto'
        boton.style.width = '100%'
        boton.style.minWidth = '0'
      })

      const aside = root.querySelector<HTMLElement>('aside[aria-label^="Panel "]')
      if (!aside) return
      const opciones = aside.querySelector<HTMLElement>('[aria-label^="Opciones de "]')

      const fondosAbierto = fondos.getAttribute('aria-expanded') === 'true'
      if (!fondosAbierto) {
        if (opciones) {
          opciones.style.removeProperty('display')
          opciones.removeAttribute('aria-hidden')
        }
        return
      }

      aside.setAttribute('aria-label', 'Panel fondos')
      if (!opciones) return

      const botonesOpciones = Array.from(opciones.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const plantillas = botonesOpciones.find((boton) => textoBoton(boton) === 'plantillas') ?? botonesOpciones[0]
      const temas = botonesOpciones.find((boton) => textoBoton(boton) === 'temas') ?? botonesOpciones[1]
      const imagenes = botonesOpciones.find((boton) => textoBoton(boton) === 'imágenes') ?? botonesOpciones[2]

      opciones.style.display = 'none'
      opciones.setAttribute('aria-hidden', 'true')

      const panelImagenes = aside.querySelector<HTMLElement>('.pastoral-elements-panel')
      if (panelImagenes) {
        const botones = Array.from(panelImagenes.querySelectorAll<HTMLButtonElement>('button'))
        const comoFondo = botones.find((boton) => textoBoton(boton) === 'como fondo')
        if (comoFondo?.getAttribute('aria-pressed') !== 'true') {
          comoFondo?.click()
          programar()
          return
        }

        const selectorModo = comoFondo?.parentElement
        if (selectorModo instanceof HTMLElement) selectorModo.style.display = 'none'

        if (!panelImagenes.querySelector('[data-vida-volver-fondos="true"]')) {
          const volver = document.createElement('button')
          volver.type = 'button'
          volver.dataset.vidaVolverFondos = 'true'
          volver.textContent = '← Fondos'
          volver.className = 'min-h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700'
          volver.addEventListener('click', () => {
            temas?.click()
            programar()
          })
          panelImagenes.prepend(volver)
        }
        return
      }

      if (temas && temas.getAttribute('aria-pressed') !== 'true') {
        temas.click()
        programar()
        return
      }

      const contenido = aside.querySelector<HTMLElement>('.pastoral-start-panel')
      if (!contenido) return

      const titulo = contenido.querySelector<HTMLElement>('.pastoral-panel-label')
      if (titulo) titulo.textContent = 'Fondos'

      const grilla = contenido.querySelector<HTMLElement>('[aria-label="Temas en filas de tres"], [aria-label="Fondos disponibles"]')
      if (grilla) {
        grilla.setAttribute('aria-label', 'Fondos disponibles')
        grilla.style.gridTemplateColumns = 'repeat(5,minmax(0,1fr))'
        grilla.style.columnGap = '10px'
        grilla.style.rowGap = '14px'

        Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button')).forEach((boton) => {
          const muestra = boton.querySelector<HTMLElement>(':scope > span:first-child')
          if (!muestra) return
          muestra.style.aspectRatio = '1 / 1'
          muestra.style.width = '100%'
          muestra.style.maxWidth = '58px'
          muestra.style.marginInline = 'auto'
          muestra.style.borderRadius = '9999px'
          muestra.style.boxShadow = 'inset 0 0 0 1px rgba(15,23,42,.08)'
          Array.from(muestra.querySelectorAll<HTMLElement>('i')).forEach((decoracion) => {
            decoracion.style.display = 'none'
          })
        })
      }

      if (!contenido.querySelector('[data-vida-fondos-actions="true"]')) {
        const acciones = document.createElement('div')
        acciones.dataset.vidaFondosActions = 'true'
        acciones.className = 'mb-3 flex flex-wrap items-center gap-2'

        const etiquetaColor = document.createElement('label')
        etiquetaColor.className = 'inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700'
        etiquetaColor.textContent = 'Color '

        const color = document.createElement('input')
        color.type = 'color'
        color.value = '#FFFFFF'
        color.setAttribute('aria-label', 'Elegir color de fondo')
        color.className = 'h-7 w-9 cursor-pointer border-0 bg-transparent p-0'
        color.addEventListener('change', () => {
          if (!grilla) return
          const primerBoton = grilla.querySelector<HTMLButtonElement>(':scope > button')
          const primeraPaleta = PALETAS_PRESENTACION[0]
          if (!primerBoton || !primeraPaleta) return
          const original = { ...primeraPaleta }
          const textoContraste = contrasteHex(color.value)
          Object.assign(primeraPaleta, {
            fondo: color.value,
            titulo: textoContraste,
            texto: textoContraste,
            acento: textoContraste,
          })
          primerBoton.click()
          Object.assign(primeraPaleta, original)
        })
        etiquetaColor.appendChild(color)

        const biblioteca = document.createElement('button')
        biblioteca.type = 'button'
        biblioteca.className = 'min-h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700'
        biblioteca.textContent = 'Subir imagen / Biblioteca'
        biblioteca.addEventListener('click', () => {
          imagenes?.click()
          programar()
        })

        acciones.append(etiquetaColor, biblioteca)
        contenido.prepend(acciones)
      }

      if (plantillas) {
        plantillas.hidden = true
        plantillas.style.display = 'none'
      }
    }

    const observador = new MutationObserver(programar)
    observador.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded', 'aria-pressed'],
    })
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
