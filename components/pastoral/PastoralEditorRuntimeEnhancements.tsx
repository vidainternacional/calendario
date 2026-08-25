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

export default function PastoralEditorRuntimeEnhancements() {
  useEffect(() => {
    let frame = 0
    const sincronizar = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        asegurarEnBlanco()
        asegurarStepper('.pastoral-editor-v4 .panel-texto .pastoral-font-size', 1, 8, 160)
        asegurarStepper('.pastoral-editor-v4 .panel-texto .pastoral-line-height', 0.05, 0.9, 2, 2)
      })
    }

    sincronizar()
    const observer = new MutationObserver(sincronizar)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return null
}
