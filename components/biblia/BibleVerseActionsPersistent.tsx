'use client'

import { useLayoutEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const NOTAS_KEY = 'vida-biblia-notas-v2'

const iconos: Record<string, string> = {
  Guardar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
  Quitar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
  Escuchar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a9 9 0 0 1 0 12"/></svg>',
  Compartir: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',
  Profundo: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></svg>',
  Estudiar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></svg>',
  'Crear nota de este versículo': '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/></svg>',
}

function texto(elemento: Element | null) {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function guardarNota(referencia: string, contenido: string) {
  const ahora = new Date().toISOString()
  const id = crypto.randomUUID()
  const nota = {
    id,
    titulo: referencia,
    contenido,
    tipo: 'versiculo',
    referencia,
    paquete: '',
    creadaEn: ahora,
    actualizadaEn: ahora,
  }

  try {
    const raw = localStorage.getItem(NOTAS_KEY)
    const actuales = raw ? JSON.parse(raw) : []
    localStorage.setItem(NOTAS_KEY, JSON.stringify([nota, ...actuales]))
  } catch {
    localStorage.setItem(NOTAS_KEY, JSON.stringify([nota]))
  }

  return id
}

export default function BibleVerseActionsPersistent() {
  const pathname = usePathname()
  const router = useRouter()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    let frame = 0

    const preparar = () => {
      frame = 0

      document.querySelectorAll<HTMLElement>('button, a').forEach((accionInicial) => {
        const etiquetaInicial = accionInicial.getAttribute('aria-label') || accionInicial.getAttribute('title') || texto(accionInicial)
        if (!['Guardar', 'Quitar', 'Escuchar', 'Compartir', 'Profundo', 'Estudiar'].includes(etiquetaInicial)) return

        const panel = accionInicial.parentElement
        if (!panel) return

        const acciones = Array.from(panel.querySelectorAll<HTMLElement>(':scope > button, :scope > a'))
          .filter((accion) => accion.dataset.vidaNoteAction !== 'true')
        const etiquetas = acciones.map((accion) => accion.getAttribute('aria-label') || accion.getAttribute('title') || texto(accion))
        if (!etiquetas.includes('Compartir')) return

        const firma = etiquetas.join('|')
        if (panel.dataset.vidaIconsReady === 'true' && panel.dataset.vidaActionsSignature === firma) return

        panel.dataset.vidaVerseActions = 'true'
        panel.dataset.vidaActionsSignature = firma
        panel.className = 'mb-4 mt-2 flex flex-wrap items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm backdrop-blur-sm transition-[opacity,transform] duration-150 ease-out dark:border-slate-700 dark:bg-slate-900/70'

        acciones.forEach((accion, indice) => {
          const nombre = etiquetas[indice]
          const svg = iconos[nombre]
          if (!svg) return
          accion.setAttribute('aria-label', nombre)
          accion.setAttribute('title', nombre)
          accion.innerHTML = svg
          const activo = nombre === 'Quitar'
          accion.className = activo
            ? 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-amber-400 bg-amber-400 text-amber-950 shadow-sm transition-transform duration-150 active:scale-95'
            : 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-transform duration-150 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
        })

        if (!panel.querySelector('[data-vida-note-action="true"]')) {
          const contenedorVerso = panel.parentElement
          const parrafo = contenedorVerso?.querySelector<HTMLElement>(':scope > p') ?? null
          const numero = texto(parrafo?.querySelector('sup') ?? null)
          const pasaje = texto(document.querySelector('h2'))

          if (parrafo && numero && pasaje) {
            const botonNota = document.createElement('button')
            botonNota.type = 'button'
            botonNota.dataset.vidaNoteAction = 'true'
            botonNota.setAttribute('aria-label', 'Crear nota de este versículo')
            botonNota.setAttribute('title', 'Crear nota de este versículo')
            botonNota.innerHTML = iconos['Crear nota de este versículo']
            botonNota.className = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-violet-300 bg-violet-50 text-violet-700 shadow-sm transition-transform duration-150 active:scale-95 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-200'
            botonNota.addEventListener('click', () => {
              const copia = parrafo.cloneNode(true) as HTMLElement
              copia.querySelectorAll('sup, svg').forEach((elemento) => elemento.remove())
              const id = guardarNota(`${pasaje}:${numero}`, texto(copia))
              router.push(`/biblia/notas?nota=${encodeURIComponent(id)}`)
            })
            panel.append(botonNota)
          }
        }

        panel.dataset.vidaIconsReady = 'true'
        panel.style.visibility = 'visible'
        panel.style.opacity = '1'
        panel.style.pointerEvents = 'auto'
      })
    }

    const programar = () => {
      if (frame) return
      frame = window.requestAnimationFrame(preparar)
    }

    preparar()
    const observer = new MutationObserver(programar)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [pathname, router])

  return null
}
