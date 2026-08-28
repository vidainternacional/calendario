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

    toolbar.style.right = '4px'
    toolbar.style.top = `calc(100% + ${gap}px)`
    toolbar.style.flexDirection = 'row'
  })
}

const PROPIEDADES_PANEL_FORMATO_MOVIL = [
  'position', 'left', 'top', 'right', 'bottom', 'width', 'z-index',
  'background', 'padding', 'border', 'border-radius', 'box-shadow',
] as const

function prepararFormatoSobreTeclado() {
  const carril = document.querySelector<HTMLElement>('.pastoral-editor-v4 .panel-texto [aria-label="Colores de texto"]')
  const seccion = document.querySelector<HTMLElement>('.pastoral-editor-v4 .panel-texto [data-pastoral-format-section="true"]')

  if (carril) {
    carril.style.overflowX = 'auto'
    carril.style.overflowY = 'hidden'
    carril.style.touchAction = 'pan-x'
    carril.style.paddingInlineEnd = '7rem'
    carril.style.scrollPaddingInlineEnd = '7rem'
    carril.style.setProperty('-webkit-overflow-scrolling', 'touch')
  }

  if (!seccion) return

  const viewport = window.visualViewport
  const insetTeclado = viewport ? Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)) : 0
  const tecladoVisible = Boolean(viewport && insetTeclado > 100)

  if (!tecladoVisible || !viewport) {
    PROPIEDADES_PANEL_FORMATO_MOVIL.forEach((propiedad) => seccion.style.removeProperty(propiedad))
    return
  }

  const alto = Math.max(64, Math.round(seccion.getBoundingClientRect().height || 64))
  const izquierda = Math.max(8, Math.round(viewport.offsetLeft + 12))
  const arriba = Math.max(Math.round(viewport.offsetTop + 6), Math.round(viewport.offsetTop + viewport.height - alto - 6))
  const ancho = Math.max(180, Math.round(viewport.width - 24))

  seccion.style.position = 'fixed'
  seccion.style.left = `${izquierda}px`
  seccion.style.top = `${arriba}px`
  seccion.style.right = 'auto'
  seccion.style.bottom = 'auto'
  seccion.style.width = `${ancho}px`
  seccion.style.zIndex = '190'
  seccion.style.background = '#f4f5f9'
  seccion.style.padding = '4px 0 6px'
  seccion.style.border = '0'
  seccion.style.borderRadius = '0'
  seccion.style.boxShadow = 'none'
}

function unificarVistaPresentacion() {
  const nav = document.querySelector<HTMLElement>('.pastoral-editor-v4 > header nav')
  if (!nav) return

  nav.querySelector('details[data-pastoral-view-menu="true"]')?.remove()

  const botonesDirectos = Array.from(nav.querySelectorAll<HTMLButtonElement>(':scope > button'))
  const editar = botonesDirectos.find((button) => button.textContent?.trim() === 'Editar')
  const presentar = botonesDirectos.find((button) => button.textContent?.trim() === 'Presentar')
  const congregacion = botonesDirectos.find((button) => button.textContent?.trim() === 'Congregación')
  if (!editar || !presentar || !congregacion) return

  congregacion.hidden = true
  congregacion.style.display = 'none'

  nav.style.display = 'flex'
  nav.style.alignItems = 'center'
  nav.style.justifyContent = 'space-between'
  nav.style.gap = '0'
  nav.style.overflow = 'visible'
  nav.style.width = '100%'
  nav.style.removeProperty('grid-template-columns')

  ;[editar, presentar].forEach((button) => {
    button.style.flex = '1 1 0'
    button.style.minWidth = '0'
    button.style.minHeight = '44px'
    button.style.textAlign = 'center'
  })

  const grupo = Array.from(nav.children).find((elemento) => elemento.tagName === 'DIV') as HTMLElement | undefined
  if (!grupo) return

  grupo.style.display = 'flex'
  grupo.style.alignItems = 'center'
  grupo.style.justifyContent = 'space-between'
  grupo.style.flex = '2.35 1 0'
  grupo.style.minWidth = '0'
  grupo.style.gap = '0'

  const compartir = Array.from(grupo.querySelectorAll<HTMLButtonElement>(':scope > button')).find((button) => button.textContent?.trim() === 'Compartir')
  if (compartir) {
    compartir.style.flex = '1 1 0'
    compartir.style.minWidth = '0'
    compartir.style.minHeight = '44px'
    compartir.style.textAlign = 'center'
  }

  const selectorPagina = grupo.querySelector<HTMLSelectElement>('select[aria-label^="Página "]')
  if (selectorPagina) {
    selectorPagina.style.width = '44px'
    selectorPagina.style.minWidth = '44px'
    selectorPagina.style.height = '44px'
    selectorPagina.style.padding = '0'
    selectorPagina.style.border = '0'
    selectorPagina.style.borderRadius = '0'
    selectorPagina.style.background = 'transparent'
    selectorPagina.style.boxShadow = 'none'
    selectorPagina.style.color = '#475569'
    selectorPagina.style.fontSize = '12px'
    selectorPagina.style.fontWeight = '800'
    selectorPagina.style.textAlign = 'center'
    selectorPagina.style.setProperty('appearance', 'none')
    selectorPagina.style.setProperty('-webkit-appearance', 'none')
  }

  grupo.querySelectorAll<HTMLButtonElement>(':scope > button[aria-label="Nueva página"], :scope > button[aria-label^="Eliminar Página "]').forEach((button) => {
    button.style.width = '44px'
    button.style.minWidth = '44px'
    button.style.height = '44px'
    button.style.padding = '0'
    button.style.flex = '0 0 44px'
  })
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
        prepararFormatoSobreTeclado()
        unificarVistaPresentacion()
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
