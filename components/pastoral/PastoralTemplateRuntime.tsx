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

function importante(elemento: HTMLElement, propiedad: string, valor: string) {
  elemento.style.setProperty(propiedad, valor, 'important')
}

export default function PastoralTemplateRuntime({ catalogo }: { catalogo: PlantillaAdministrada[] }) {
  useLayoutEffect(() => {
    void catalogo
    let frame = 0
    let cambiandoPanel = false

    let estilos = document.getElementById('pastoral-background-toolbar-clean') as HTMLStyleElement | null
    if (!estilos) {
      estilos = document.createElement('style')
      estilos.id = 'pastoral-background-toolbar-clean'
      estilos.textContent = `
        .pastoral-editor-v4 .pastoral-primary-tool-pill .pastoral-tool-button,
        .pastoral-editor-v4 .pastoral-primary-tool-pill .pastoral-tool-button.is-active,
        .pastoral-editor-v4 .pastoral-primary-tool-pill .pastoral-tool-button[aria-pressed="true"] {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
          color: #475569 !important;
        }
        .pastoral-editor-v4 .pastoral-primary-tool-pill .pastoral-tool-button::before,
        .pastoral-editor-v4 .pastoral-primary-tool-pill .pastoral-tool-button::after {
          display: none !important;
          content: none !important;
        }
        .pastoral-editor-v4 .pastoral-primary-tool-pill .pastoral-tool-button[aria-pressed="true"] > svg {
          color: #4f46e5 !important;
          stroke: currentColor !important;
        }
        .pastoral-editor-v4 .pastoral-primary-tool-pill .pastoral-tool-button[aria-pressed="false"] > svg {
          color: #475569 !important;
          stroke: currentColor !important;
        }
        .pastoral-editor-v4 .pastoral-primary-tool-pill .pastoral-tool-button > small {
          color: #334155 !important;
        }
      `
      document.head.appendChild(estilos)
    }

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

      importante(dock, 'display', 'flex')
      importante(dock, 'flex-direction', 'row')
      importante(dock, 'align-items', 'center')
      importante(dock, 'gap', '8px')
      importante(dock, 'width', '100%')
      importante(dock, 'min-height', '0')

      pildora.className = 'pastoral-primary-tool-pill'
      importante(pildora, 'display', 'flex')
      importante(pildora, 'flex-direction', 'row')
      importante(pildora, 'align-items', 'stretch')
      importante(pildora, 'gap', '2px')
      importante(pildora, 'flex', '1 1 0')
      importante(pildora, 'min-width', '0')
      importante(pildora, 'height', '52px')
      importante(pildora, 'padding', '3px')
      importante(pildora, 'overflow', 'hidden')
      importante(pildora, 'border', '1px solid #e2e8f0')
      importante(pildora, 'border-radius', '999px')
      importante(pildora, 'background', '#ffffff')
      importante(pildora, 'box-shadow', 'none')

      herramientas.slice(0, 3).forEach((boton) => {
        boton.classList.remove('is-active')
        importante(boton, 'display', 'flex')
        importante(boton, 'flex-direction', 'column')
        importante(boton, 'align-items', 'center')
        importante(boton, 'justify-content', 'center')
        importante(boton, 'gap', '1px')
        importante(boton, 'flex', '1 1 0')
        importante(boton, 'grid-column', 'auto')
        importante(boton, 'grid-row', 'auto')
        importante(boton, 'width', 'auto')
        importante(boton, 'min-width', '0')
        importante(boton, 'height', '46px')
        importante(boton, 'min-height', '46px')
        importante(boton, 'padding', '2px 6px')
        importante(boton, 'border', '0')
        importante(boton, 'border-radius', '999px')
        importante(boton, 'box-shadow', 'none')
        importante(boton, 'background', 'transparent')
        importante(boton, 'color', '#475569')

        const activo = boton.getAttribute('aria-pressed') === 'true'
        const icono = boton.querySelector<SVGElement>('svg')
        if (icono) icono.style.setProperty('color', activo ? '#4f46e5' : '#475569', 'important')
        const etiqueta = boton.querySelector<HTMLElement>('small')
        if (etiqueta) etiqueta.style.setProperty('color', '#334155', 'important')
      })

      return herramientas
    }

    const crearProxy = (source: HTMLButtonElement) => {
      const boton = document.createElement('button')
      boton.type = 'button'
      boton.className = 'grid w-[62px] shrink-0 gap-1.5 text-center'
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
        contenedor.className = 'grid gap-5 pb-2 pt-1'
        grilla.insertAdjacentElement('afterend', contenedor)
      }

      const firma = fuentes.map((boton) => `${boton.textContent?.trim() ?? ''}:${boton.querySelector<HTMLElement>('span')?.getAttribute('style') ?? ''}`).join('|')
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

      const barra = panel.querySelector<HTMLElement>('[aria-label^="Opciones de "]')
      if (!barra) return

      const botonesNativos = Array.from(barra.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const temas = botonesNativos.find((boton) => normalizar(boton.textContent ?? '') === 'temas') ?? botonesNativos[1] ?? null

      importante(barra, 'display', 'none')
      barra.setAttribute('aria-hidden', 'true')

      if (temas && temas.getAttribute('aria-pressed') !== 'true' && !cambiandoPanel) {
        cambiandoPanel = true
        temas.click()
        window.requestAnimationFrame(() => {
          cambiandoPanel = false
          sincronizar()
        })
        return
      }

      const grilla = panel.querySelector<HTMLElement>('[aria-label="Temas en filas de tres"]')
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

    const reintento = window.setInterval(sincronizar, 250)
    const pararReintento = window.setTimeout(() => window.clearInterval(reintento), 2500)

    return () => {
      window.cancelAnimationFrame(frame)
      observador.disconnect()
      window.clearInterval(reintento)
      window.clearTimeout(pararReintento)
      estilos?.remove()
    }
  }, [catalogo])

  return null
}
