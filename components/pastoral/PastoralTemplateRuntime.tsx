'use client'

import { useEffect } from 'react'
import type {
  PlantillaAdministrada,
  RolPlantillaAdministrada,
} from '@/components/pastoral/pastoral-template-admin-model'

const ROLES: RolPlantillaAdministrada[] = ['titulo', 'subtitulo', 'cuerpo']
const BASE_WIDTH_16_9 = 1100

const normalizar = (valor: string) => valor
  .replace(/[•◦▪●]/g, ' ')
  .replace(/\.n\b/gi, '.')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

function alineacionCss(valor: string) {
  if (valor === 'centro') return 'center'
  if (valor === 'derecha') return 'right'
  if (valor === 'justificado') return 'justify'
  return 'left'
}

function pintarPreview(preview: HTMLElement, plantilla: PlantillaAdministrada) {
  const yaSincronizado = preview.querySelectorAll('[data-pastoral-template-preview-role]').length === ROLES.length
  if (yaSincronizado && preview.dataset.pastoralTemplatePreviewId === plantilla.id) return

  preview.replaceChildren()
  preview.dataset.pastoralTemplatePreviewId = plantilla.id
  preview.style.background = plantilla.fondo
  preview.style.color = plantilla.colorTexto
  preview.style.containerType = 'inline-size'

  ROLES.forEach((rol) => {
    const caja = plantilla[rol]
    const pixeles = (caja.pt * 4) / 3
    const escalaLienzo = (pixeles / BASE_WIDTH_16_9) * 100
    const texto = document.createElement('span')
    texto.dataset.pastoralTemplatePreviewRole = rol
    texto.textContent = plantilla.muestras[rol]
    texto.style.position = 'absolute'
    texto.style.left = `${caja.x}%`
    texto.style.top = `${caja.y}%`
    texto.style.width = `${caja.w}%`
    texto.style.height = `${caja.h}%`
    texto.style.overflow = 'hidden'
    texto.style.fontFamily = caja.fuente
    texto.style.fontSize = `min(${pixeles}px, ${escalaLienzo}cqw)`
    texto.style.fontWeight = rol === 'titulo' ? '800' : rol === 'subtitulo' ? '700' : '500'
    texto.style.lineHeight = String(caja.interlineado)
    texto.style.textAlign = alineacionCss(caja.alineacion)
    texto.style.color = plantilla.colorTexto
    texto.style.whiteSpace = 'pre-line'
    texto.style.wordBreak = 'break-word'
    texto.style.pointerEvents = 'none'
    preview.appendChild(texto)
  })
}

export default function PastoralTemplateRuntime({ catalogo }: { catalogo: PlantillaAdministrada[] }) {
  useEffect(() => {
    let frame = 0
    let timer = 0

    const buscarPlantillaPorBoton = (boton: HTMLButtonElement, grilla: HTMLElement) => {
      const etiqueta = boton.querySelectorAll('span')[1]?.textContent ?? boton.textContent ?? ''
      const porNombre = catalogo.find((item) => normalizar(item.nombre) === normalizar(etiqueta))
      if (porNombre) return porNombre
      const botones = Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const indice = botones.indexOf(boton) - 1
      return catalogo[indice] ?? null
    }

    const sincronizarMiniaturas = () => {
      const grilla = document.querySelector<HTMLElement>('.pastoral-editor-v4 [aria-label="Plantillas en filas de tres"]')
      if (!grilla) return

      const botones = Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button')).slice(1)
      botones.forEach((boton) => {
        const plantilla = buscarPlantillaPorBoton(boton, grilla)
        const preview = boton.querySelector<HTMLElement>('span')
        if (plantilla && preview) pintarPreview(preview, plantilla)
      })
    }

    const programarMiniaturas = () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(frame)
      timer = window.setTimeout(() => {
        frame = window.requestAnimationFrame(sincronizarMiniaturas)
      }, 0)
    }

    // Este runtime queda deliberadamente limitado a miniaturas.
    // No intercepta clics de plantilla, no toca el canvas y no dispara inputs sintéticos.
    programarMiniaturas()
    document.addEventListener('click', programarMiniaturas, false)

    return () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(frame)
      document.removeEventListener('click', programarMiniaturas, false)
    }
  }, [catalogo])

  return null
}
