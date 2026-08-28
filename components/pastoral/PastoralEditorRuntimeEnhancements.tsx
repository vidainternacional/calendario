'use client'

import { useEffect } from 'react'

function limpiarFondosDuplicados() {
  document.querySelectorAll<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-tool-button').forEach((button) => {
    const label = (button.getAttribute('aria-label') || button.title || '').trim().toLowerCase()
    if (label === 'fondo' || label === 'fondos') button.remove()
  })
}

function renombrarTextoLibre() {
  const button = document.querySelector<HTMLButtonElement>('.pastoral-editor-v4 .panel-texto .pastoral-text-presets > button:first-child')
  if (button && button.textContent?.trim() === 'Caja') button.textContent = 'Texto libre'
}

function posicionarControlesFlotantes() {
  document.querySelectorAll<HTMLElement>('.pastoral-editor-v4 [data-canvas-floating-controls="true"]').forEach((toolbar) => {
    const elemento = toolbar.closest<HTMLElement>('[data-canvas-element-id]')
    const canvas = toolbar.closest<HTMLElement>('.pastoral-visual-canvas')
    if (!elemento || !canvas) return

    const elementoRect = elemento.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()
    const espacioArriba = elementoRect.top - canvasRect.top
    const espacioAbajo = canvasRect.bottom - elementoRect.bottom
    const espacioDerecha = canvasRect.right - elementoRect.right
    const espacioIzquierda = elementoRect.left - canvasRect.left
    const gap = 6

    toolbar.style.removeProperty('left')
    toolbar.style.removeProperty('right')
    toolbar.style.removeProperty('top')
    toolbar.style.removeProperty('bottom')

    if (espacioArriba >= 52) {
      toolbar.style.right = '0'
      toolbar.style.bottom = `calc(100% + ${gap}px)`
      toolbar.style.flexDirection = 'row'
      return
    }

    if (espacioAbajo >= 52) {
      toolbar.style.right = '0'
      toolbar.style.top = `calc(100% + ${gap}px)`
      toolbar.style.flexDirection = 'row'
      return
    }

    if (espacioDerecha >= 52) {
      toolbar.style.left = `calc(100% + ${gap}px)`
      toolbar.style.top = '0'
      toolbar.style.flexDirection = 'column'
      return
    }

    if (espacioIzquierda >= 52) {
      toolbar.style.right = `calc(100% + ${gap}px)`
      toolbar.style.top = '0'
      toolbar.style.flexDirection = 'column'
      return
    }

    /* Último recurso para elementos casi a pantalla completa: se coloca sobre el
       borde inferior, nunca encima de las primeras líneas del texto. */
    toolbar.style.right = '4px'
    toolbar.style.top = `calc(100% + ${gap}px)`
    toolbar.style.flexDirection = 'row'
  })
}

const PROPIEDADES_CARRIL_FLOTANTE = [
  'position', 'left', 'top', 'right', 'bottom', 'width', 'z-index',
  'background', 'padding', 'border', 'border-radius', 'box-shadow',
] as const

function prepararCarrilColores() {
  const carril = document.querySelector<HTMLElement>('.pastoral-editor-v4 .panel-texto [aria-label="Colores de texto"]')
  if (!carril) return

  carril.style.overflowX = 'auto'
  carril.style.overflowY = 'hidden'
  carril.style.touchAction = 'pan-x'
  carril.style.paddingInlineEnd = '7rem'
  carril.style.scrollPaddingInlineEnd = '7rem'
  carril.style.setProperty('-webkit-overflow-scrolling', 'touch')

  const viewport = window.visualViewport
  const insetTeclado = viewport ? Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)) : 0
  const tecladoVisible = Boolean(viewport && insetTeclado > 100)

  if (!tecladoVisible || !viewport) {
    PROPIEDADES_CARRIL_FLOTANTE.forEach((propiedad) => carril.style.removeProperty(propiedad))
    return
  }

  const alto = Math.max(48, Math.round(carril.getBoundingClientRect().height || 48))
  const izquierda = Math.max(8, Math.round(viewport.offsetLeft + 12))
  const arriba = Math.max(Math.round(viewport.offsetTop + 8), Math.round(viewport.offsetTop + viewport.height - alto - 12))
  const ancho = Math.max(180, Math.round(viewport.width - 24))

  carril.style.position = 'fixed'
  carril.style.left = `${izquierda}px`
  carril.style.top = `${arriba}px`
  carril.style.right = 'auto'
  carril.style.bottom = 'auto'
  carril.style.width = `${ancho}px`
  carril.style.zIndex = '190'
  carril.style.background = '#f4f5f9'
  carril.style.padding = '8px 10px'
  carril.style.border = '1px solid #e2e8f0'
  carril.style.borderRadius = '999px'
  carril.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.14)'
}

const SELECTOR_CONTROL_TEXTO = [
  '.pastoral-editor-v4 .panel-texto button',
  '.pastoral-editor-v4 .panel-texto summary',
].join(', ')

export default function PastoralEditorRuntimeEnhancements() {
  useEffect(() => {
    let frame = 0
    let ultimoEditor: HTMLElement | null = null
    let ultimoRango: Range | null = null
    let ultimoTema: HTMLButtonElement | null = null
    let heredandoTema = false

    const rangoPerteneceAlEditor = (range: Range, editor: HTMLElement) => {
      try {
        return range.startContainer.isConnected && range.endContainer.isConnected && editor.contains(range.commonAncestorContainer)
      } catch {
        return false
      }
    }

    const guardarSeleccion = () => {
      const selection = window.getSelection()
      if (!selection?.rangeCount) return false
      const range = selection.getRangeAt(0)
      if (range.collapsed) return false
      const node = range.commonAncestorContainer
      const element = node.nodeType === Node.ELEMENT_NODE
        ? node as Element
        : node.parentNode instanceof Element
          ? node.parentNode
          : null
      const editor = element?.closest<HTMLElement>('.pastoral-visual-canvas [contenteditable="true"]')
      if (!editor) return false
      ultimoEditor = editor
      ultimoRango = range.cloneRange()
      return true
    }

    const restaurarSeleccion = () => {
      if (!ultimoEditor?.isConnected) return false
      ultimoEditor.focus({ preventScroll: true })
      if (!ultimoRango || !rangoPerteneceAlEditor(ultimoRango, ultimoEditor)) return true
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(ultimoRango.cloneRange())
      return true
    }

    const mantenerSeleccionTrasControl = () => {
      window.requestAnimationFrame(() => {
        if (guardarSeleccion()) return
        restaurarSeleccion()
      })
    }

    const cerrarColorAlSalirDelTexto = () => {
      window.setTimeout(() => {
        const botonColor = document.querySelector<HTMLButtonElement>('.pastoral-editor-v4 .panel-texto button[aria-label="Color de texto"][aria-expanded="true"]')
        botonColor?.click()
      }, 0)
    }

    const recordarTemaActual = () => {
      const canvas = document.querySelector<HTMLElement>('.pastoral-editor-v4 .pastoral-visual-canvas')
      if (!canvas) return
      const fondoCanvas = getComputedStyle(canvas).backgroundColor
      let encontrado: HTMLButtonElement | null = null
      document.querySelectorAll<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-theme-option').forEach((button) => {
        const muestra = button.querySelector<HTMLElement>('.pastoral-theme-swatches')
        if (muestra && getComputedStyle(muestra).backgroundColor === fondoCanvas) encontrado = button
      })
      if (encontrado) ultimoTema = encontrado
    }

    const heredarTemaEnNuevaPagina = () => {
      recordarTemaActual()
      const tema = ultimoTema
      if (!tema?.isConnected || heredandoTema) return
      heredandoTema = true
      window.setTimeout(() => {
        if (tema.isConnected) tema.click()
        heredandoTema = false
      }, 80)
    }

    const sincronizar = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        limpiarFondosDuplicados()
        renombrarTextoLibre()
        recordarTemaActual()
        posicionarControlesFlotantes()
        prepararCarrilColores()
      })
    }

    const onSelectionChange = () => guardarSeleccion()
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.matches('.pastoral-visual-canvas [contenteditable="true"]')) {
        if (target !== ultimoEditor) ultimoRango = null
        ultimoEditor = target
        guardarSeleccion()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const controlTexto = target?.closest<HTMLElement>(SELECTOR_CONTROL_TEXTO)
      if (controlTexto) {
        guardarSeleccion()
        event.preventDefault()
        restaurarSeleccion()
        return
      }

      const dentroTexto = target?.closest<HTMLElement>('.pastoral-visual-canvas [contenteditable="true"]')
      const dentroHerramientasTexto = target?.closest<HTMLElement>('.pastoral-editor-v4 .panel-texto')
      if (!dentroTexto && !dentroHerramientasTexto) {
        ultimoEditor = null
        ultimoRango = null
        cerrarColorAlSalirDelTexto()
      }

      const tema = target?.closest<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-theme-option')
      if (tema) ultimoTema = tema
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const controlTexto = target?.closest<HTMLElement>(SELECTOR_CONTROL_TEXTO)
      if (controlTexto) {
        restaurarSeleccion()
        mantenerSeleccionTrasControl()
        sincronizar()
        return
      }

      const blancoNativo = target?.closest<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-template-blank-option:not([data-pastoral-blank-template])')
      if (blancoNativo) return

      const nuevaPagina = target?.closest<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-pages-strip > button[aria-label="Nueva página"]')
      if (nuevaPagina) {
        heredarTemaEnNuevaPagina()
        return
      }
    }

    sincronizar()
    const observer = new MutationObserver(sincronizar)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointerup', sincronizar, true)
    document.addEventListener('click', onClick, true)
    window.addEventListener('resize', sincronizar)
    window.visualViewport?.addEventListener('resize', sincronizar)
    window.visualViewport?.addEventListener('scroll', sincronizar)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', sincronizar, true)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('resize', sincronizar)
      window.visualViewport?.removeEventListener('resize', sincronizar)
      window.visualViewport?.removeEventListener('scroll', sincronizar)
    }
  }, [])

  return null
}
