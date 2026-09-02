'use client'

import { useEffect } from 'react'
import { PLANTILLAS_VISUALES } from '@/components/pastoral/pastoral-editor-presets'

/*
 * Compatibilidad temporal con el conversor de tamaño que ya usa el editor al
 * aplicar una plantilla. La salida visible queda anclada a la escala aprobada
 * de Texto: Título 42 · Subtítulo 28 · Cuerpo 22. Las plantillas administradas
 * ya llegan convertidas desde su única fuente de verdad y no deben reescribirse aquí.
 */
const PUNTOS_ENTRADA_POR_ROL = {
  titulo: 75,    // 75 × .56 = 42
  subtitulo: 50, // 50 × .56 = 28
  cuerpo: 39,    // 39 × .56 ≈ 22
} as const

PLANTILLAS_VISUALES.forEach((plantilla) => {
  if ((plantilla as PlantillaConMarca).__vidaAdministrada) return
  plantilla.titulo.pt = PUNTOS_ENTRADA_POR_ROL.titulo
  if (plantilla.subtitulo) plantilla.subtitulo.pt = PUNTOS_ENTRADA_POR_ROL.subtitulo
  if (plantilla.cuerpo) plantilla.cuerpo.pt = PUNTOS_ENTRADA_POR_ROL.cuerpo
})

type PlantillaConMarca = (typeof PLANTILLAS_VISUALES)[number] & { __vidaAdministrada?: boolean }

type SwipeActivo = {
  canvas: HTMLElement
  seccion: HTMLElement
  inicioX: number
  inicioY: number
  ultimoX: number
  horizontal: boolean
}

function esPresentacion(seccion: HTMLElement) {
  const titulo = seccion.querySelector('h2')?.textContent?.trim()
  return titulo === 'Presentación' || Boolean(seccion.querySelector('button[aria-label="Salir de presentación"]'))
}

function limpiarCanvasSwipe(canvas: HTMLElement) {
  canvas.style.transition = 'transform 120ms cubic-bezier(.32,.72,0,1), opacity 120ms cubic-bezier(.32,.72,0,1)'
  canvas.style.transform = 'translate3d(0,0,0)'
  canvas.style.opacity = '1'
  canvas.style.removeProperty('will-change')
  window.setTimeout(() => canvas.style.removeProperty('transition'), 140)
}

export default function PastoralEditorBehaviorGuard() {
  useEffect(() => {
    let swipe: SwipeActivo | null = null

    const iniciar = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const target = event.target instanceof Element ? event.target : null
      const canvas = target?.closest<HTMLElement>('.pastoral-editor-v4 .pastoral-visual-canvas')
      const seccion = canvas?.closest<HTMLElement>('section')
      const toque = event.touches[0]
      if (!canvas || !seccion || !toque || !esPresentacion(seccion)) return
      swipe = {
        canvas,
        seccion,
        inicioX: toque.clientX,
        inicioY: toque.clientY,
        ultimoX: toque.clientX,
        horizontal: false,
      }
      canvas.style.transition = 'none'
      canvas.style.willChange = 'transform'
      canvas.style.touchAction = 'pan-y'
    }

    const mover = (event: TouchEvent) => {
      const actual = swipe
      const toque = event.touches[0]
      if (!actual || !toque) return
      const dx = toque.clientX - actual.inicioX
      const dy = toque.clientY - actual.inicioY
      actual.ultimoX = toque.clientX
      if (!actual.horizontal) {
        if (Math.abs(dx) < 6 || Math.abs(dx) <= Math.abs(dy)) return
        actual.horizontal = true
      }
      event.preventDefault()
      event.stopPropagation()
      const limite = Math.max(48, actual.canvas.getBoundingClientRect().width * .28)
      const desplazamiento = Math.max(-limite, Math.min(limite, dx))
      actual.canvas.style.transform = `translate3d(${desplazamiento}px,0,0)`
      actual.canvas.style.opacity = String(Math.max(.82, 1 - Math.abs(desplazamiento) / Math.max(1, limite) * .18))
    }

    const terminar = (event: TouchEvent) => {
      const actual = swipe
      swipe = null
      if (!actual) return
      actual.canvas.style.removeProperty('touch-action')
      const dx = actual.ultimoX - actual.inicioX
      if (!actual.horizontal) {
        limpiarCanvasSwipe(actual.canvas)
        return
      }
      event.preventDefault()
      event.stopPropagation()
      const umbral = Math.min(48, Math.max(28, actual.canvas.getBoundingClientRect().width * .08))
      const botones = Array.from(actual.seccion.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const anterior = botones.at(-2)
      const siguiente = botones.at(-1)
      limpiarCanvasSwipe(actual.canvas)
      if (dx <= -umbral && siguiente && !siguiente.disabled) siguiente.click()
      else if (dx >= umbral && anterior && !anterior.disabled) anterior.click()
    }

    const cancelar = () => {
      const actual = swipe
      swipe = null
      if (!actual) return
      actual.canvas.style.removeProperty('touch-action')
      limpiarCanvasSwipe(actual.canvas)
    }

    document.addEventListener('touchstart', iniciar, { capture: true, passive: true })
    document.addEventListener('touchmove', mover, { capture: true, passive: false })
    document.addEventListener('touchend', terminar, { capture: true, passive: false })
    document.addEventListener('touchcancel', cancelar, { capture: true, passive: true })

    return () => {
      document.removeEventListener('touchstart', iniciar, true)
      document.removeEventListener('touchmove', mover, true)
      document.removeEventListener('touchend', terminar, true)
      document.removeEventListener('touchcancel', cancelar, true)
    }
  }, [])

  return null
}
