'use client'

import { useEffect } from 'react'
import { PALETAS_PRESENTACION } from '@/components/pastoral/pastoral-editor-presets'
import type { PlantillaAdministrada } from '@/components/pastoral/pastoral-template-admin-model'

const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim().toLowerCase()

function botonSubmenu(indice: number) {
  const panel = document.querySelector<HTMLElement>('.pastoral-editor-v4 .pastoral-tool-panel-flow')
  if (!panel) return null
  const barra = panel.querySelector<HTMLElement>('[aria-label^="Opciones de "]')
  return barra?.querySelectorAll<HTMLButtonElement>(':scope > button')[indice] ?? null
}

function construirTarjetaFondo(paleta: (typeof PALETAS_PRESENTACION)[number]) {
  const boton = document.createElement('button')
  boton.type = 'button'
  boton.dataset.vidaFondoId = paleta.id
  boton.className = 'grid min-w-0 gap-1 text-center'
  boton.setAttribute('aria-label', `Aplicar fondo ${paleta.label}`)

  const preview = document.createElement('span')
  preview.className = 'relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200'
  preview.style.background = paleta.fondo
  preview.style.color = paleta.titulo

  const lineaPrincipal = document.createElement('i')
  lineaPrincipal.className = 'absolute left-[10%] top-[35%] h-[5px] w-[68%] rounded-full bg-current opacity-90'
  const lineaSecundaria = document.createElement('i')
  lineaSecundaria.className = 'absolute left-[10%] top-[61%] h-[3px] w-[46%] rounded-full bg-current opacity-55'
  preview.append(lineaPrincipal, lineaSecundaria)

  const etiqueta = document.createElement('span')
  etiqueta.className = 'truncate px-1 text-[11px] font-semibold text-slate-700'
  etiqueta.textContent = paleta.label
  boton.append(preview, etiqueta)
  return boton
}

export default function PastoralTemplateRuntime({ catalogo }: { catalogo: PlantillaAdministrada[] }) {
  useEffect(() => {
    void catalogo
    let frame = 0
    let observadorPanel: MutationObserver | null = null

    const sincronizarEtiquetas = () => {
      const dock = Array.from(document.querySelectorAll<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-tool-dock button'))
        .find((boton) => normalizar(boton.getAttribute('aria-label') ?? '') === 'plantillas')
      if (dock) {
        dock.setAttribute('aria-label', 'Fondos')
        dock.title = 'Fondos'
        const texto = dock.querySelector('small')
        if (texto) texto.textContent = 'Fondos'
      }

      const fondos = botonSubmenu(0)
      if (fondos) fondos.textContent = 'Fondos'
      const temas = botonSubmenu(1)
      if (temas) {
        temas.style.display = 'none'
        temas.setAttribute('aria-hidden', 'true')
        temas.tabIndex = -1
      }
      const imagenes = botonSubmenu(2)
      if (imagenes && normalizar(imagenes.textContent ?? '') === 'imágenes') imagenes.textContent = 'Imágenes'
    }

    const sincronizarGaleria = () => {
      const original = document.querySelector<HTMLElement>('.pastoral-editor-v4 [aria-label="Plantillas en filas de tres"]')
      if (!original) return
      original.style.display = 'none'

      const seccion = original.parentElement
      if (!seccion) return
      let galeria = seccion.querySelector<HTMLElement>('[data-vida-fondos-grid="true"]')
      if (!galeria) {
        galeria = document.createElement('div')
        galeria.dataset.vidaFondosGrid = 'true'
        galeria.className = 'grid grid-cols-3 gap-x-2 gap-y-3'
        galeria.setAttribute('aria-label', 'Fondos en filas de tres')
        PALETAS_PRESENTACION.forEach((paleta) => galeria?.appendChild(construirTarjetaFondo(paleta)))
        original.insertAdjacentElement('afterend', galeria)
      }

      const titulo = seccion.querySelector<HTMLElement>('.pastoral-panel-label')
      if (titulo) titulo.textContent = 'Fondos'
    }

    const sincronizar = () => {
      sincronizarEtiquetas()
      sincronizarGaleria()
    }

    const programarSincronizacion = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(sincronizar)
    }

    const aplicarFondoConControlExistente = (id: string) => {
      const paleta = PALETAS_PRESENTACION.find((item) => item.id === id)
      if (!paleta) return

      const temas = botonSubmenu(1)
      if (!temas) return
      temas.click()

      observadorPanel?.disconnect()
      const raiz = document.querySelector<HTMLElement>('.pastoral-editor-v4')
      if (!raiz) return

      const intentarAplicar = () => {
        const grilla = document.querySelector<HTMLElement>('.pastoral-editor-v4 [aria-label="Temas en filas de tres"]')
        if (!grilla) return false
        const boton = Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button')).find((item) => {
          const etiqueta = item.querySelectorAll('span')[1]?.textContent ?? item.textContent ?? ''
          return normalizar(etiqueta) === normalizar(paleta.label)
        })
        if (!boton) return false

        observadorPanel?.disconnect()
        observadorPanel = null
        boton.click()
        window.requestAnimationFrame(() => {
          const volverFondos = botonSubmenu(0)
          volverFondos?.click()
          programarSincronizacion()
        })
        return true
      }

      if (intentarAplicar()) return
      observadorPanel = new MutationObserver(() => { intentarAplicar() })
      observadorPanel.observe(raiz, { childList: true, subtree: true })
    }

    const capturarFondos = (event: MouseEvent) => {
      const objetivo = event.target instanceof Element ? event.target : null
      const boton = objetivo?.closest<HTMLButtonElement>('button[data-vida-fondo-id]')
      if (!boton?.dataset.vidaFondoId) return
      event.preventDefault()
      event.stopImmediatePropagation()
      aplicarFondoConControlExistente(boton.dataset.vidaFondoId)
    }

    const raiz = document.querySelector<HTMLElement>('.pastoral-editor-v4')
    const observador = raiz ? new MutationObserver(programarSincronizacion) : null
    if (raiz) observador?.observe(raiz, { childList: true, subtree: true })

    sincronizar()
    document.addEventListener('click', capturarFondos, true)

    return () => {
      window.cancelAnimationFrame(frame)
      observador?.disconnect()
      observadorPanel?.disconnect()
      document.removeEventListener('click', capturarFondos, true)
    }
  }, [catalogo])

  return null
}
