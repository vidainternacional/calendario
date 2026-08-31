'use client'

import { useLayoutEffect } from 'react'
import type { PlantillaAdministrada } from '@/components/pastoral/pastoral-template-admin-model'

const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim().toLowerCase()
type CategoriaFondo = 'color' | 'degradado' | 'textura' | 'imagen'

const OPCIONES_FONDO: Array<{ id: CategoriaFondo; label: string }> = [
  { id: 'color', label: 'Colores lisos' },
  { id: 'degradado', label: 'Degradados' },
  { id: 'textura', label: 'Texturas' },
  { id: 'imagen', label: 'Imágenes' },
]

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
            return etiqueta === 'plantillas' || etiqueta === 'fondo' || etiqueta === 'fondos' || etiqueta === 'fondo del lienzo'
          })
        : null

      if (!fondos) return

      // El aria-label deliberadamente no es solo "Fondo": evita que un parche legado
      // que eliminaba botones duplicados vuelva a quitar este control principal.
      fondos.setAttribute('aria-label', 'Fondo del lienzo')
      fondos.setAttribute('title', 'Fondo')
      const textoFondos = fondos.querySelector('small')
      if (textoFondos) textoFondos.textContent = 'Fondo'

      if (fondos.getAttribute('aria-expanded') !== 'true') return

      const panel = root.querySelector<HTMLElement>('aside[aria-label="Panel plantillas"], aside[aria-label="Panel fondos"], aside[aria-label="Panel fondo"]')
      if (!panel) return
      panel.setAttribute('aria-label', 'Panel fondo')

      const barra = panel.querySelector<HTMLElement>('[aria-label^="Opciones de "]')
      if (!barra) return
      barra.setAttribute('aria-label', 'Opciones de fondo')

      const botones = Array.from(barra.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const plantillas = botones[0] ?? null
      const temas = botones[1] ?? null
      const imagenes = botones[2] ?? null

      ;[plantillas, temas, imagenes].forEach((boton) => {
        if (!boton) return
        boton.hidden = true
        boton.style.display = 'none'
        boton.setAttribute('aria-hidden', 'true')
        boton.tabIndex = -1
      })

      let categoria = (root.dataset.pastoralFondoCategoria as CategoriaFondo | undefined) ?? 'color'
      if (!OPCIONES_FONDO.some((opcion) => opcion.id === categoria)) categoria = 'color'
      root.dataset.pastoralFondoCategoria = categoria

      let categorias = panel.querySelector<HTMLElement>('[data-pastoral-background-categories="true"]')
      if (!categorias) {
        categorias = document.createElement('div')
        categorias.dataset.pastoralBackgroundCategories = 'true'
        categorias.className = 'flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        categorias.setAttribute('aria-label', 'Tipos de fondo')
        barra.insertAdjacentElement('afterend', categorias)
      }

      OPCIONES_FONDO.forEach((opcion) => {
        let boton = categorias!.querySelector<HTMLButtonElement>(`button[data-pastoral-background-category="${opcion.id}"]`)
        if (!boton) {
          boton = document.createElement('button')
          boton.type = 'button'
          boton.dataset.pastoralBackgroundCategory = opcion.id
          boton.className = 'min-h-10 shrink-0 rounded-full px-3 text-xs font-bold'
          boton.textContent = opcion.label
          boton.addEventListener('click', () => {
            root.dataset.pastoralFondoCategoria = opcion.id
            if (opcion.id === 'imagen') {
              if (imagenes && imagenes.getAttribute('aria-pressed') !== 'true') imagenes.click()
            } else if (temas && temas.getAttribute('aria-pressed') !== 'true') {
              temas.click()
            }
            window.requestAnimationFrame(sincronizar)
          })
          categorias!.appendChild(boton)
        }
        const activo = categoria === opcion.id
        boton.setAttribute('aria-pressed', String(activo))
        boton.className = `min-h-10 shrink-0 rounded-full px-3 text-xs font-bold ${activo ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`
      })

      if (categoria === 'imagen') {
        if (imagenes && imagenes.getAttribute('aria-pressed') !== 'true' && !cambiandoPanel) {
          cambiandoPanel = true
          imagenes.click()
          window.requestAnimationFrame(() => {
            cambiandoPanel = false
            sincronizar()
          })
        }
        return
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

      const grilla = root.querySelector<HTMLElement>('[aria-label="Temas en filas de tres"], [aria-label^="Fondos · "]')
      if (!grilla) return

      grilla.setAttribute('aria-label', `Fondos · ${OPCIONES_FONDO.find((opcion) => opcion.id === categoria)?.label ?? 'Fondos'}`)
      const seccion = grilla.parentElement
      const titulo = seccion?.querySelector<HTMLElement>('.pastoral-panel-label')
      if (titulo) titulo.textContent = OPCIONES_FONDO.find((opcion) => opcion.id === categoria)?.label ?? 'Fondos'

      Array.from(grilla.children).forEach((elemento) => {
        const boton = elemento as HTMLButtonElement
        const muestra = boton.querySelector<HTMLElement>('span')
        const fondo = `${muestra?.getAttribute('style') ?? ''} ${muestra?.style.background ?? ''}`.toLowerCase()
        const esTextura = fondo.includes('repeating-')
        const esDegradado = fondo.includes('gradient') && !esTextura
        const esColor = !fondo.includes('gradient')
        const mostrar = categoria === 'textura' ? esTextura : categoria === 'degradado' ? esDegradado : esColor
        boton.hidden = !mostrar
        boton.style.display = mostrar ? '' : 'none'
      })
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
