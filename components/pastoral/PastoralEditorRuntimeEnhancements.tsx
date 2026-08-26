'use client'

import { useEffect } from 'react'

function setNativeInputValue(input: HTMLInputElement, value: number, decimals = 0) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  const nextValue = decimals ? value.toFixed(decimals) : String(Math.round(value))
  descriptor?.set?.call(input, nextValue)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

function asegurarStepper(selector: string, step: number, min: number, max: number, decimals = 0) {
  const label = document.querySelector<HTMLElement>(selector)
  if (!label || label.querySelector('[data-pastoral-stepper]')) return
  const input = label.querySelector<HTMLInputElement>('input[type="number"]')
  if (!input) return

  const grupo = document.createElement('span')
  grupo.dataset.pastoralStepper = 'true'
  grupo.className = 'pastoral-number-stepper'

  const crearBoton = (delta: number, ariaLabel: string) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'pastoral-step-button'
    button.textContent = delta < 0 ? '−' : '+'
    button.setAttribute('aria-label', ariaLabel)
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (input.disabled) return
      const actual = Number(input.value || min)
      const siguiente = Math.min(max, Math.max(min, actual + delta))
      setNativeInputValue(input, siguiente, decimals)
    })
    return button
  }

  grupo.append(
    crearBoton(-step, selector.includes('font-size') ? 'Reducir tamaño de letra' : 'Reducir interlineado'),
    crearBoton(step, selector.includes('font-size') ? 'Aumentar tamaño de letra' : 'Aumentar interlineado'),
  )
  label.appendChild(grupo)
}

function asegurarEnBlanco() {
  const grid = document.querySelector<HTMLElement>('.pastoral-editor-v4 .panel-plantillas .pastoral-template-grid')
  if (!grid || grid.querySelector('[data-pastoral-blank-template]')) return

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'pastoral-template-option pastoral-template-blank-option'
  button.dataset.pastoralBlankTemplate = 'true'
  button.setAttribute('aria-label', 'Empezar con una página en blanco')

  const preview = document.createElement('span')
  preview.className = 'pastoral-template-preview pastoral-template-preview-blank'
  preview.style.background = '#ffffff'
  preview.style.color = '#94a3b8'
  preview.innerHTML = '<i></i><i></i>'

  const label = document.createElement('span')
  label.textContent = 'En blanco'
  button.append(preview, label)

  button.addEventListener('click', () => {
    document.querySelector<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-pages-strip > button[aria-label="Nueva página"]')?.click()
  })

  grid.prepend(button)
}

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

export default function PastoralEditorRuntimeEnhancements() {
  useEffect(() => {
    let frame = 0
    let ultimoEditor: HTMLElement | null = null
    let ultimoRango: Range | null = null
    let ultimoTema: HTMLButtonElement | null = null
    let heredandoTema = false

    const guardarSeleccion = () => {
      const selection = window.getSelection()
      if (!selection?.rangeCount) return
      const range = selection.getRangeAt(0)
      const node = range.commonAncestorContainer
      const element = node.nodeType === Node.ELEMENT_NODE
        ? node as Element
        : node.parentNode instanceof Element
          ? node.parentNode
          : null
      const editor = element?.closest<HTMLElement>('.pastoral-visual-canvas [contenteditable="true"]')
      if (!editor) return
      ultimoEditor = editor
      ultimoRango = range.cloneRange()
    }

    const restaurarSeleccion = () => {
      if (!ultimoEditor?.isConnected) return false
      ultimoEditor.focus({ preventScroll: true })
      if (ultimoRango) {
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(ultimoRango)
      }
      return true
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

    const aplicarListaEnCursor = (button: HTMLButtonElement) => {
      if (!restaurarSeleccion() || !ultimoEditor) return false
      const command = button.getAttribute('aria-label') === 'Lista numerada' ? 'insertOrderedList' : 'insertUnorderedList'
      document.execCommand(command)
      ultimoEditor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: command === 'insertOrderedList' ? 'insertOrderedList' : 'insertUnorderedList' }))
      guardarSeleccion()
      return true
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
        asegurarEnBlanco()
        asegurarStepper('.pastoral-editor-v4 .panel-texto .pastoral-font-size', 1, 8, 160)
        asegurarStepper('.pastoral-editor-v4 .panel-texto .pastoral-line-height', 0.05, 0.9, 2, 2)
        limpiarFondosDuplicados()
        renombrarTextoLibre()
        recordarTemaActual()
        posicionarControlesFlotantes()
      })
    }

    const onSelectionChange = () => guardarSeleccion()
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.matches('.pastoral-visual-canvas [contenteditable="true"]')) {
        ultimoEditor = target
        guardarSeleccion()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const lista = target?.closest<HTMLButtonElement>('button[aria-label="Lista con viñetas"], button[aria-label="Lista numerada"]')
      if (lista) {
        event.preventDefault()
        restaurarSeleccion()
        return
      }

      const tema = target?.closest<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-theme-option')
      if (tema) ultimoTema = tema
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const lista = target?.closest<HTMLButtonElement>('button[aria-label="Lista con viñetas"], button[aria-label="Lista numerada"]')
      if (lista) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        aplicarListaEnCursor(lista)
        return
      }

      const nuevaPagina = target?.closest<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-pages-strip > button[aria-label="Nueva página"]')
      if (nuevaPagina) {
        heredarTemaEnNuevaPagina()
        return
      }

      const blancoNativo = target?.closest<HTMLButtonElement>('.pastoral-editor-v4 .pastoral-template-blank-option:not([data-pastoral-blank-template])')
      if (blancoNativo) heredarTemaEnNuevaPagina()
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

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', sincronizar, true)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('resize', sincronizar)
    }
  }, [])

  return null
}
