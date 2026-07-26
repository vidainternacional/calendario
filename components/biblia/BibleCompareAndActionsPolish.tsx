'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

const PREF_KEY = 'vida-biblia-preferencias'

type Tema = 'claro' | 'sepia' | 'oscuro'

function texto(elemento: Element | null) {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function temaActual(): Tema {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    const tema = raw ? JSON.parse(raw)?.modo : 'claro'
    return ['claro', 'sepia', 'oscuro'].includes(tema) ? tema : 'claro'
  } catch {
    return 'claro'
  }
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

    let iconosAplicados = 0
    acciones.forEach((accion) => {
      const nombre = accion.getAttribute('aria-label') || accion.getAttribute('title') || texto(accion)
      const svg = iconos[nombre]
      if (!svg) return

      accion.innerHTML = svg
      accion.dataset.vidaIconReady = 'true'
      iconosAplicados += 1

      const activo = nombre === 'Quitar'
      const esNota = nombre === 'Crear nota' || nombre === 'Crear nota de este versículo'
      accion.className = activo
        ? 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-amber-400 bg-amber-400 text-amber-950 shadow-sm transition-transform duration-150 active:scale-95'
        : esNota
          ? 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-violet-300 bg-violet-50 text-violet-700 shadow-sm transition-transform duration-150 active:scale-95 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-200'
          : 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-transform duration-150 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
    })

    if (iconosAplicados === acciones.length) {
      panel.dataset.vidaIconsReady = 'true'
      panel.style.visibility = 'visible'
      panel.style.opacity = '1'
      panel.style.pointerEvents = 'auto'
    }
  })
}

function mejorarSelectores() {
  const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
  const principal = selects.find((select) => /versi[oó]n de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
  if (!principal) return
  const grupo = principal.parentElement
  if (grupo) {
    grupo.style.maxWidth = '780px'
    grupo.style.width = '100%'
    grupo.style.columnGap = '10px'
  }
  selects.slice(0, 4).forEach((select) => {
    select.style.minHeight = '46px'
    select.style.height = '46px'
    select.style.paddingInline = '11px'
    select.style.fontSize = '12.5px'
    select.style.lineHeight = '46px'
    select.style.textAlign = 'center'
    ;(select.style as CSSStyleDeclaration & { textAlignLast?: string }).textAlignLast = 'center'
  })
}

function mejorarComparacion() {
  const botones = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
  const activo = botones.some((boton) => texto(boton) === 'Comparar' && boton.className.includes('bg-violet-600'))
  if (!activo) return

  const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
  const principal = selects.find((select) => /versi[oó]n de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
  const etiquetaSegunda = Array.from(document.querySelectorAll<HTMLLabelElement>('label')).find((label) => /segunda traducci[oó]n/i.test(texto(label)))
  const secundaria = etiquetaSegunda?.querySelector('select') ?? null
  if (!principal || !secundaria || !etiquetaSegunda) return

  const zona = etiquetaSegunda.closest<HTMLElement>('div.p-5') ?? etiquetaSegunda.parentElement
  if (!zona) return
  etiquetaSegunda.style.display = 'none'

  let bloque = zona.querySelector<HTMLElement>('[data-vida-comparador-real]')
  if (!bloque) {
    bloque = document.createElement('section')
    bloque.dataset.vidaComparadorReal = 'true'
    zona.prepend(bloque)
  }

  const tema = temaActual()
  bloque.className = tema === 'oscuro'
    ? 'mb-5 rounded-3xl border border-slate-700 bg-slate-900/80 p-3'
    : tema === 'sepia'
      ? 'mb-5 rounded-3xl border border-[#cdb991] bg-[#f3e3c2]/80 p-3'
      : 'mb-5 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-3'

  if (!bloque.querySelector('select')) {
    const titulo = document.createElement('p')
    titulo.className = 'mb-3 text-center text-xs font-bold uppercase tracking-wide opacity-70'
    titulo.textContent = 'Comparar el mismo versículo en dos Biblias'
    const fila = document.createElement('div')
    fila.className = 'grid grid-cols-2 gap-3'

    const campo = (nombre: string, original: HTMLSelectElement) => {
      const label = document.createElement('label')
      label.className = 'min-w-0'
      const span = document.createElement('span')
      span.className = 'mb-1 block text-[11px] font-bold'
      span.textContent = nombre
      const copia = original.cloneNode(true) as HTMLSelectElement
      copia.removeAttribute('aria-label')
      copia.setAttribute('aria-label', nombre)
      copia.className = tema === 'oscuro'
        ? 'h-12 w-full min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-3 text-center text-xs font-semibold text-white'
        : tema === 'sepia'
          ? 'h-12 w-full min-w-0 rounded-2xl border border-[#cdb991] bg-[#fff8e8] px-3 text-center text-xs font-semibold text-[#382d21]'
          : 'h-12 w-full min-w-0 rounded-2xl border border-violet-200 bg-white px-3 text-center text-xs font-semibold text-slate-800'
      ;(copia.style as CSSStyleDeclaration & { textAlignLast?: string }).textAlignLast = 'center'
      copia.addEventListener('change', () => {
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
        setter?.call(original, copia.value)
        original.dispatchEvent(new Event('change', { bubbles: true }))
      })
      label.append(span, copia)
      return label
    }

    fila.append(campo('Biblia 1', principal), campo('Biblia 2', secundaria))
    bloque.append(titulo, fila)
  }

  const nombre1 = principal.options[principal.selectedIndex]?.textContent?.trim() || 'Biblia 1'
  const nombre2 = secundaria.options[secundaria.selectedIndex]?.textContent?.trim() || 'Biblia 2'
  const referenciaBase = Array.from(document.querySelectorAll('h2')).map((h) => texto(h)).find((t) => /\d/.test(t)) || ''

  zona.querySelectorAll<HTMLElement>('article').forEach((article) => {
    const columnas = Array.from(article.children).filter((e): e is HTMLElement => e instanceof HTMLElement && e.tagName === 'DIV')
    if (columnas.length < 2) return
    const numero = texto(article.querySelector('sup'))
    article.className = tema === 'oscuro'
      ? 'grid gap-3 rounded-3xl border border-slate-700 bg-slate-900 p-3 sm:grid-cols-2'
      : tema === 'sepia'
        ? 'grid gap-3 rounded-3xl border border-[#cdb991] bg-[#fff8e8] p-3 sm:grid-cols-2'
        : 'grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 sm:grid-cols-2'

    columnas[0].className = tema === 'oscuro' ? 'rounded-2xl bg-violet-950/55 p-4' : tema === 'sepia' ? 'rounded-2xl bg-[#ead9b5] p-4' : 'rounded-2xl bg-violet-50 p-4'
    columnas[1].className = tema === 'oscuro' ? 'rounded-2xl bg-indigo-950/55 p-4' : tema === 'sepia' ? 'rounded-2xl bg-[#e0c99d] p-4' : 'rounded-2xl bg-indigo-50 p-4'
    const rotulo1 = columnas[0].querySelector<HTMLElement>('p')
    const rotulo2 = columnas[1].querySelector<HTMLElement>('p')
    if (rotulo1) { rotulo1.textContent = nombre1; rotulo1.title = nombre1; rotulo1.className = 'text-[11px] font-bold leading-4 text-violet-700 dark:text-violet-300' }
    if (rotulo2) { rotulo2.textContent = nombre2; rotulo2.title = nombre2; rotulo2.className = 'text-[11px] font-bold leading-4 text-indigo-700 dark:text-indigo-300' }

    let referencia = article.querySelector<HTMLElement>('[data-vida-referencia-completa]')
    if (!referencia) {
      referencia = document.createElement('p')
      referencia.dataset.vidaReferenciaCompleta = 'true'
      article.prepend(referencia)
    }
    referencia.className = 'col-span-full text-center text-[11px] font-bold opacity-60'
    referencia.textContent = `${referenciaBase}${numero ? `:${numero}` : ''} · mismo versículo`
  })
}

export default function BibleCompareAndActionsPolish() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return
    let intentos = 0
    const aplicar = () => {
      intentos += 1
      ocultarMenuAnteriorMientrasSePrepara()
      mejorarSelectores()
      estilizarAcciones()
      mejorarComparacion()
      if (intentos >= 100) window.clearInterval(timer)
    }
    aplicar()
    const timer = window.setInterval(aplicar, 100)
    return () => window.clearInterval(timer)
  }, [pathname])

  return null
}
