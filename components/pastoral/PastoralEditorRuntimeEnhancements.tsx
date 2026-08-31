'use client'

import { useEffect } from 'react'

function renombrarTextoLibre() {
  const button = document.querySelector<HTMLButtonElement>('.pastoral-editor-v4 .panel-texto .pastoral-text-presets > button:first-child')
  if (button && button.textContent?.trim() === 'Caja') button.textContent = 'Texto libre'
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

  // Conserva la autoridad existente del editor, pero elimina el espacio elástico
  // que separaba Presentar de Compartir en móvil.
  nav.style.setProperty('display', 'grid', 'important')
  nav.style.setProperty('grid-template-columns', '54px 80px minmax(0, 1fr)', 'important')
  nav.style.setProperty('align-items', 'center', 'important')
  nav.style.setProperty('justify-content', 'stretch', 'important')
  nav.style.setProperty('gap', '0', 'important')
  nav.style.setProperty('overflow', 'visible', 'important')
  nav.style.setProperty('width', '100%', 'important')

  ;[editar, presentar].forEach((button) => {
    button.style.width = '100%'
    button.style.minWidth = '0'
    button.style.minHeight = '44px'
    button.style.padding = '0 1px'
    button.style.textAlign = 'center'
  })

  const grupo = Array.from(nav.children).find((elemento) => elemento.tagName === 'DIV') as HTMLElement | undefined
  if (!grupo) return

  grupo.style.display = 'flex'
  grupo.style.alignItems = 'center'
  grupo.style.justifyContent = 'space-between'
  grupo.style.minWidth = '0'
  grupo.style.gap = '0'
  grupo.style.marginLeft = '0'
  grupo.style.paddingInline = '0'
  grupo.style.overflow = 'visible'

  const compartir = Array.from(grupo.querySelectorAll<HTMLButtonElement>(':scope > button')).find((button) => button.textContent?.trim() === 'Compartir')
  if (compartir) {
    compartir.style.width = '66px'
    compartir.style.minWidth = '66px'
    compartir.style.minHeight = '44px'
    compartir.style.padding = '0 2px'
    compartir.style.flex = '0 0 66px'
    compartir.style.textAlign = 'center'
  }

  const selectorPagina = grupo.querySelector<HTMLSelectElement>('select[aria-label^="Página "]')
  if (!selectorPagina) return

  selectorPagina.style.width = '30px'
  selectorPagina.style.minWidth = '30px'
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
  selectorPagina.style.flex = '0 0 30px'
  selectorPagina.style.setProperty('appearance', 'none')
  selectorPagina.style.setProperty('-webkit-appearance', 'none')

  const crearNavegadorPagina = (delta: -1 | 1, label: string, simbolo: string) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.pastoralPageStep = String(delta)
    button.setAttribute('aria-label', label)
    button.textContent = simbolo
    button.style.width = '28px'
    button.style.minWidth = '28px'
    button.style.height = '44px'
    button.style.padding = '0'
    button.style.border = '0'
    button.style.background = 'transparent'
    button.style.color = '#64748b'
    button.style.fontSize = '22px'
    button.style.fontWeight = '400'
    button.style.lineHeight = '1'
    button.style.flex = '0 0 28px'
    button.addEventListener('click', () => {
      const actual = Number(selectorPagina.value)
      const maximo = Math.max(0, selectorPagina.options.length - 1)
      const siguiente = Math.min(maximo, Math.max(0, actual + delta))
      if (siguiente === actual) return
      selectorPagina.value = String(siguiente)
      selectorPagina.dispatchEvent(new Event('change', { bubbles: true }))
    })
    return button
  }

  let anterior = grupo.querySelector<HTMLButtonElement>('button[data-pastoral-page-step="-1"]')
  let siguiente = grupo.querySelector<HTMLButtonElement>('button[data-pastoral-page-step="1"]')
  if (!anterior) {
    anterior = crearNavegadorPagina(-1, 'Página anterior', '‹')
    grupo.insertBefore(anterior, selectorPagina)
  }
  if (!siguiente) {
    siguiente = crearNavegadorPagina(1, 'Página siguiente', '›')
    grupo.insertBefore(siguiente, selectorPagina.nextSibling)
  }

  const indice = Number(selectorPagina.value)
  const maximo = Math.max(0, selectorPagina.options.length - 1)
  anterior.disabled = indice <= 0
  siguiente.disabled = indice >= maximo
  anterior.style.opacity = anterior.disabled ? '.24' : '1'
  siguiente.style.opacity = siguiente.disabled ? '.24' : '1'

  grupo.querySelectorAll<HTMLButtonElement>(':scope > button[aria-label="Nueva página"], :scope > button[aria-label^="Eliminar Página "]').forEach((button) => {
    button.style.width = '32px'
    button.style.minWidth = '32px'
    button.style.height = '44px'
    button.style.padding = '0'
    button.style.flex = '0 0 32px'
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
        renombrarTextoLibre()
        recordarTemaActual()
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