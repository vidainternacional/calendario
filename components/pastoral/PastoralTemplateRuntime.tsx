'use client'

import { useEffect } from 'react'
import { escaparHtmlCanvas } from '@/components/pastoral/pastoral-canvas-model'
import type {
  PlantillaAdministrada,
  RolPlantillaAdministrada,
} from '@/components/pastoral/pastoral-template-admin-model'

const ROLES: RolPlantillaAdministrada[] = ['titulo', 'subtitulo', 'cuerpo']
const BASE_WIDTH_16_9 = 1100
const TEXTOS_PLACEHOLDER = ['Título', 'Subtítulo', 'Escribe el contenido', 'Escribe aquí']

const normalizar = (valor: string) => valor
  .replace(/[•◦▪●]/g, ' ')
  .replace(/\.n\b/gi, '.')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

function htmlMuestra(texto: string, interlineado: number) {
  const seguro = escaparHtmlCanvas(texto).replace(/\n/g, '<br>')
  return `<span data-vida-template-sample="true" data-vida-line-height="${interlineado}">${seguro}</span>`
}

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
    let muestrasAntesDelClick = false

    const conocidas = new Set<string>()
    TEXTOS_PLACEHOLDER.forEach((texto) => conocidas.add(normalizar(texto)))
    catalogo.forEach((plantilla) => {
      conocidas.add(normalizar(plantilla.nombre))
      conocidas.add(normalizar(`Estilo ${plantilla.categoria.toLowerCase()}`))
      conocidas.add(normalizar(`Composición ${plantilla.nombre.toLowerCase()}`))
      ROLES.forEach((rol) => conocidas.add(normalizar(plantilla.muestras[rol])))
    })

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

    const programarMiniaturas = () => window.setTimeout(() => window.requestAnimationFrame(sincronizarMiniaturas), 0)

    const editoresPorRol = () => new Map(
      ROLES.map((rol) => {
        const contenedor = document.querySelector<HTMLElement>(`.pastoral-editor-v4 .pastoral-visual-canvas [data-canvas-text-role="${rol}"]`)
        return [rol, contenedor?.querySelector<HTMLElement>('[contenteditable="true"]') ?? null] as const
      }),
    )

    const tieneTextoUsuario = () => {
      const editores = Array.from(document.querySelectorAll<HTMLElement>('.pastoral-editor-v4 .pastoral-visual-canvas [data-canvas-text-role] [contenteditable="true"]'))
      return editores.some((editor) => {
        const texto = normalizar(editor.innerText || '')
        return Boolean(texto) && !conocidas.has(texto)
      })
    }

    const aplicarMuestras = (plantilla: PlantillaAdministrada) => {
      const editores = editoresPorRol()
      ROLES.forEach((rol) => {
        const editor = editores.get(rol)
        if (!editor) return
        const caja = plantilla[rol]
        editor.innerHTML = htmlMuestra(plantilla.muestras[rol], caja.interlineado)
        editor.dispatchEvent(new Event('input', { bubbles: true }))
      })
    }

    const alHacerClickCaptura = (event: MouseEvent) => {
      const objetivo = event.target instanceof Element ? event.target : null
      const boton = objetivo?.closest<HTMLButtonElement>('button')
      const grilla = boton?.closest<HTMLElement>('[aria-label="Plantillas en filas de tres"]')

      if (!boton || !grilla) {
        programarMiniaturas()
        return
      }

      const plantilla = buscarPlantillaPorBoton(boton, grilla)
      if (!plantilla) return

      // Solo recordamos si el lienzo contenía muestras antes del clic.
      // No cancelamos, no re-disparamos el botón y no tocamos la geometría.
      muestrasAntesDelClick = !tieneTextoUsuario()
    }

    const alHacerClickBurbuja = (event: MouseEvent) => {
      const objetivo = event.target instanceof Element ? event.target : null
      const boton = objetivo?.closest<HTMLButtonElement>('button')
      const grilla = boton?.closest<HTMLElement>('[aria-label="Plantillas en filas de tres"]')
      if (!boton || !grilla) return

      const plantilla = buscarPlantillaPorBoton(boton, grilla)
      if (!plantilla) return

      const reemplazarMuestras = muestrasAntesDelClick
      muestrasAntesDelClick = false

      window.setTimeout(() => window.requestAnimationFrame(() => {
        // Workspace ya creó/reubicó Título/Subtítulo/Cuerpo con la geometría guardada.
        // Aquí solo colocamos el texto de muestra personalizado. El tamaño, fuente,
        // posición y ancho/alto siguen siendo los del elemento React del canvas.
        if (reemplazarMuestras) aplicarMuestras(plantilla)
        sincronizarMiniaturas()
      }), 0)
    }

    programarMiniaturas()
    document.addEventListener('click', alHacerClickCaptura, true)
    document.addEventListener('click', alHacerClickBurbuja, false)

    return () => {
      document.removeEventListener('click', alHacerClickCaptura, true)
      document.removeEventListener('click', alHacerClickBurbuja, false)
    }
  }, [catalogo])

  return null
}
