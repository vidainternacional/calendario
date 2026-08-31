'use client'

import { useLayoutEffect } from 'react'
import type { PlantillaAdministrada } from '@/components/pastoral/pastoral-template-admin-model'

const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim().toLowerCase()
type TipoFondo = 'flat' | 'degradado' | 'textura' | 'temas'

const SECCIONES_FONDO: Array<{ id: TipoFondo; label: string }> = [
  { id: 'flat', label: 'Colores flat' },
  { id: 'degradado', label: 'Degradados' },
  { id: 'textura', label: 'Texturas' },
  { id: 'temas', label: 'Temas' },
]

function tipoFondoDesdeMuestra(muestra: HTMLElement | null): Exclude<TipoFondo, 'temas'> {
  const fondo = `${muestra?.getAttribute('style') ?? ''} ${muestra?.style.background ?? ''}`.toLowerCase()
  if (fondo.includes('repeating-')) return 'textura'
  if (fondo.includes('gradient')) return 'degradado'
  return 'flat'
}

function estiloImportante(elemento: HTMLElement, propiedad: string, valor: string) {
  elemento.style.setProperty(propiedad, valor, 'important')
}

export default function PastoralTemplateRuntime({ catalogo }: { catalogo: PlantillaAdministrada[] }) {
  useLayoutEffect(() => {
    void catalogo
    let frame = 0
    let cambiandoPanel = false

    const asegurarPildoraPrincipal = (dock: HTMLElement) => {
      const herramientas = Array.from(dock.querySelectorAll<HTMLButtonElement>('button.pastoral-tool-button'))
      if (herramientas.length < 3) return herramientas

      let pildora = dock.querySelector<HTMLElement>('[data-pastoral-primary-pill="true"]')
      if (!pildora) {
        pildora = document.createElement('div')
        pildora.dataset.pastoralPrimaryPill = 'true'
        herramientas[0]?.insertAdjacentElement('beforebegin', pildora)
        herramientas.slice(0, 3).forEach((boton) => pildora?.appendChild(boton))
      }

      pildora.className = 'pastoral-primary-tool-pill'
      estiloImportante(pildora, 'display', 'grid')
      estiloImportante(pildora, 'grid-template-columns', 'repeat(3,minmax(0,1fr))')
      estiloImportante(pildora, 'align-items', 'center')
      estiloImportante(pildora, 'gap', '2px')
      estiloImportante(pildora, 'flex', '1 1 auto')
      estiloImportante(pildora, 'min-width', '0')
      estiloImportante(pildora, 'padding', '3px')
      estiloImportante(pildora, 'border', '1px solid #e2e8f0')
      estiloImportante(pildora, 'border-radius', '999px')
      estiloImportante(pildora, 'background', '#ffffff')
      estiloImportante(pildora, 'box-shadow', '0 1px 2px rgba(15,23,42,.04)')

      herramientas.slice(0, 3).forEach((boton) => {
        const activo = boton.getAttribute('aria-pressed') === 'true'
        estiloImportante(boton, 'width', '100%')
        estiloImportante(boton, 'min-width', '0')
        estiloImportante(boton, 'height', '42px')
        estiloImportante(boton, 'min-height', '42px')
        estiloImportante(boton, 'padding', '0 8px')
        estiloImportante(boton, 'border', '0')
        estiloImportante(boton, 'border-radius', '999px')
        estiloImportante(boton, 'box-shadow', 'none')
        estiloImportante(boton, 'background', activo ? '#eef2ff' : 'transparent')
        estiloImportante(boton, 'color', activo ? '#4338ca' : '#475569')
      })

      return herramientas
    }

    const crearProxy = (source: HTMLButtonElement) => {
      const boton = document.createElement('button')
      boton.type = 'button'
      boton.className = 'grid w-[58px] shrink-0 gap-1.5 text-center'
      boton.setAttribute('aria-label', source.textContent?.trim() || 'Aplicar fondo')

      const muestraSource = source.querySelector<HTMLElement>('span')
      const muestra = document.createElement('span')
      muestra.className = 'mx-auto block h-12 w-12 rounded-full border border-slate-200 shadow-sm'
      muestra.style.background = muestraSource?.style.background || muestraSource?.style.backgroundColor || '#ffffff'

      const label = document.createElement('small')
      label.className = 'block truncate text-[9px] font-semibold text-slate-500'
      label.textContent = source.textContent?.trim() || 'Fondo'

      boton.append(muestra, label)
      boton.addEventListener('click', () => source.click())
      return boton
    }

    const construirSecciones = (panel: HTMLElement, grilla: HTMLElement) => {
      const fuentes = Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button'))
      if (!fuentes.length) return

      const seccionNativa = grilla.parentElement
      const tituloNativo = seccionNativa?.querySelector<HTMLElement>('.pastoral-panel-label')
      if (tituloNativo) tituloNativo.style.display = 'none'
      grilla.style.display = 'none'

      let contenedor = panel.querySelector<HTMLElement>('[data-pastoral-background-sections="true"]')
      if (!contenedor) {
        contenedor = document.createElement('div')
        contenedor.dataset.pastoralBackgroundSections = 'true'
        contenedor.className = 'grid gap-4 pb-2'
        grilla.insertAdjacentElement('afterend', contenedor)
      }

      const firma = fuentes.map((boton) => boton.textContent?.trim() ?? '').join('|')
      if (contenedor.dataset.sourceSignature === firma) return
      contenedor.dataset.sourceSignature = firma
      contenedor.replaceChildren()

      SECCIONES_FONDO.forEach((seccion) => {
        const candidatas = seccion.id === 'temas'
          ? fuentes
          : fuentes.filter((boton) => tipoFondoDesdeMuestra(boton.querySelector<HTMLElement>('span')) === seccion.id)
        if (!candidatas.length) return

        const bloque = document.createElement('section')
        bloque.className = 'grid gap-2'

        const titulo = document.createElement('p')
        titulo.className = 'px-1 text-[10px] font-black uppercase tracking-[.12em] text-slate-400'
        titulo.textContent = seccion.label

        const carril = document.createElement('div')
        carril.className = 'flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        carril.setAttribute('aria-label', seccion.label)
        candidatas.forEach((source) => carril.appendChild(crearProxy(source)))

        bloque.append(titulo, carril)
        contenedor?.appendChild(bloque)
      })
    }

    const sincronizar = () => {
      const root = document.querySelector<HTMLElement>('.pastoral-editor-v4')
      if (!root) return

      const dock = root.querySelector<HTMLElement>('[aria-label="Herramientas del lienzo"]')
      if (!dock) return
      const herramientas = asegurarPildoraPrincipal(dock)
      const fondos = herramientas.find((boton) => {
        const etiqueta = normalizar(boton.getAttribute('aria-label') ?? boton.textContent ?? '')
        return etiqueta === 'plantillas' || etiqueta === 'fondo' || etiqueta === 'fondos' || etiqueta === 'fondo del lienzo' || etiqueta === 'fondos del lienzo'
      }) ?? herramientas[0] ?? null
      if (!fondos) return

      fondos.setAttribute('aria-label', 'Fondos del lienzo')
      fondos.setAttribute('title', 'Fondos')
      const textoFondos = fondos.querySelector('small')
      if (textoFondos) textoFondos.textContent = 'Fondos'

      if (fondos.getAttribute('aria-expanded') !== 'true') return

      const panel = root.querySelector<HTMLElement>('aside[aria-label="Panel plantillas"], aside[aria-label="Panel fondos"], aside[aria-label="Panel fondo"]')
      if (!panel) return
      panel.setAttribute('aria-label', 'Panel fondos')

      const barra = panel.querySelector<HTMLElement>('[aria-label^="Opciones de "]')
      if (!barra) return
      barra.setAttribute('aria-label', 'Opciones de fondos')

      const botonesNativos = Array.from(barra.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const temas = botonesNativos[1] ?? null
      botonesNativos.forEach((boton) => {
        boton.hidden = true
        boton.style.display = 'none'
        boton.setAttribute('aria-hidden', 'true')
        boton.tabIndex = -1
      })

      let unicaPestana = barra.querySelector<HTMLButtonElement>('[data-pastoral-background-only-tab="true"]')
      if (!unicaPestana) {
        unicaPestana = document.createElement('button')
        unicaPestana.type = 'button'
        unicaPestana.dataset.pastoralBackgroundOnlyTab = 'true'
        unicaPestana.className = 'min-h-10 rounded-full bg-indigo-50 px-4 text-xs font-bold text-indigo-700'
        unicaPestana.textContent = 'Fondos'
        unicaPestana.setAttribute('aria-pressed', 'true')
        unicaPestana.addEventListener('click', () => temas?.click())
        barra.appendChild(unicaPestana)
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
      if (!grilla) return
      construirSecciones(panel, grilla)
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
