'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

function texto(elemento: Element | null) {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

const iconos: Record<string, string> = {
  Guardar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
  Quitar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
  Escuchar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a9 9 0 0 1 0 12"/></svg>',
  Compartir: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',
  Profundo: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></svg>',
  Estudiar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></svg>',
  'Crear nota': '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/></svg>',
  'Crear nota de este versículo': '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/></svg>',
}

function ocultarMenuAnteriorMientrasSePrepara() {
  document.querySelectorAll<HTMLElement>('article > div.relative > div.grid.grid-cols-2.rounded-2xl').forEach((panel) => {
    if (panel.dataset.vidaIconsReady === 'true') return
    panel.style.opacity = '0'
    panel.style.visibility = 'hidden'
    panel.style.pointerEvents = 'none'
  })
}

function estilizarAcciones() {
  document.querySelectorAll<HTMLElement>('[data-vida-verse-actions="true"]').forEach((panel) => {
    const acciones = Array.from(panel.querySelectorAll<HTMLElement>(':scope > button, :scope > a'))
    if (!acciones.length) return

    let aplicados = 0
    acciones.forEach((accion) => {
      const nombre = accion.getAttribute('aria-label') || accion.getAttribute('title') || texto(accion)
      const svg = iconos[nombre]
      if (!svg) return
      accion.innerHTML = svg
      accion.dataset.vidaIconReady = 'true'
      aplicados += 1

      const activo = nombre === 'Quitar'
      const esNota = nombre === 'Crear nota' || nombre === 'Crear nota de este versículo'
      accion.className = activo
        ? 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-amber-400 bg-amber-400 text-amber-950 shadow-sm transition-transform duration-150 active:scale-95'
        : esNota
          ? 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-violet-300 bg-violet-50 text-violet-700 shadow-sm transition-transform duration-150 active:scale-95 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-200'
          : 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-transform duration-150 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
    })

    if (aplicados === acciones.length) {
      panel.dataset.vidaIconsReady = 'true'
      panel.style.visibility = 'visible'
      panel.style.opacity = '1'
      panel.style.pointerEvents = 'auto'
    }
  })
}

function mejorarSelectores() {
  document.querySelectorAll<HTMLSelectElement>('select').forEach((select) => {
    select.style.textAlign = 'center'
    ;(select.style as CSSStyleDeclaration & { textAlignLast?: string }).textAlignLast = 'center'

    Array.from(select.options).forEach((opcion) => {
      const etiqueta = opcion.textContent?.trim()
      if (etiqueta) opcion.title = etiqueta
    })
  })
}

function mejorarComparacion() {
  const compararActivo = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .some((boton) => texto(boton) === 'Comparar' && boton.className.includes('bg-violet-600'))
  if (!compararActivo) return

  const principal = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
    .find((select) => /versi[oó]n de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
  const etiquetaSegunda = Array.from(document.querySelectorAll<HTMLLabelElement>('label'))
    .find((label) => /segunda traducci[oó]n/i.test(texto(label)))
  const secundaria = etiquetaSegunda?.querySelector<HTMLSelectElement>('select') ?? null
  if (!principal || !etiquetaSegunda || !secundaria) return

  etiquetaSegunda.style.display = ''
  etiquetaSegunda.dataset.vidaSelectorSecundario = 'true'

  const rotulo = etiquetaSegunda.querySelector('span')
  if (rotulo) rotulo.textContent = 'Biblia 2'

  const nombrePrincipal = principal.options[principal.selectedIndex]?.textContent?.trim() || 'Biblia 1'
  const nombreSecundario = secundaria.options[secundaria.selectedIndex]?.textContent?.trim() || 'Biblia 2'

  principal.setAttribute('title', `Biblia 1: ${nombrePrincipal}`)
  secundaria.setAttribute('title', `Biblia 2: ${nombreSecundario}`)
  secundaria.setAttribute('aria-label', `Biblia 2: ${nombreSecundario}`)

  const zona = etiquetaSegunda.closest<HTMLElement>('div.p-5') ?? etiquetaSegunda.parentElement
  if (!zona) return

  zona.querySelectorAll<HTMLElement>('[data-vida-comparador-real]').forEach((bloque) => bloque.remove())

  zona.querySelectorAll<HTMLElement>('article').forEach((article) => {
    const columnas = Array.from(article.children)
      .filter((elemento): elemento is HTMLElement => elemento instanceof HTMLElement && elemento.tagName === 'DIV')
    if (columnas.length < 2) return

    const rotulo1 = columnas[0].querySelector<HTMLElement>('p')
    const rotulo2 = columnas[1].querySelector<HTMLElement>('p')
    if (rotulo1) {
      rotulo1.textContent = nombrePrincipal
      rotulo1.title = nombrePrincipal
      rotulo1.className = 'text-[11px] font-bold leading-4 text-violet-700 dark:text-violet-300'
    }
    if (rotulo2) {
      rotulo2.textContent = nombreSecundario
      rotulo2.title = nombreSecundario
      rotulo2.className = 'text-[11px] font-bold leading-4 text-indigo-700 dark:text-indigo-300'
    }
  })
}

export default function BibleCompareAndActionsPolish() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    const aplicar = () => {
      ocultarMenuAnteriorMientrasSePrepara()
      mejorarSelectores()
      estilizarAcciones()
      mejorarComparacion()
    }

    aplicar()
    const observer = new MutationObserver(aplicar)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(aplicar, 300)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [pathname])

  return null
}
