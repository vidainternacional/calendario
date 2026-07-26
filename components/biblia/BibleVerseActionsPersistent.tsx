'use client'

import { useLayoutEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const NOTAS_KEY = 'vida-biblia-notas-v2'

const iconoNota = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/></svg>'

const claseNeutral = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white p-0 text-[0px] text-slate-700 shadow-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
const claseFavorito = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-amber-400 bg-amber-400 p-0 text-[0px] text-amber-950 shadow-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-95'
const claseNotaActiva = 'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-violet-500 bg-violet-600 p-0 text-white shadow-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-95'

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

function nombreAccion(accion: HTMLElement) {
  const visible = texto(accion)
  if (['Guardar', 'Quitar', 'Escuchar', 'Compartir', 'Profundo', 'Estudiar'].includes(visible)) return visible
  return accion.getAttribute('aria-label') || accion.getAttribute('title') || visible
}

function estilizarIconoOriginal(accion: HTMLElement) {
  accion.querySelectorAll<SVGElement>('svg').forEach((svg) => {
    svg.classList.remove('h-3.5', 'w-3.5', 'h-4', 'w-4', 'h-5', 'w-5')
    svg.classList.add('h-[19px]', 'w-[19px]', 'shrink-0')
  })
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
        const etiquetaInicial = nombreAccion(accionInicial)
        if (!['Guardar', 'Quitar', 'Escuchar', 'Compartir', 'Profundo', 'Estudiar'].includes(etiquetaInicial)) return

        const panel = accionInicial.parentElement
        if (!panel) return

        const acciones = Array.from(panel.querySelectorAll<HTMLElement>(':scope > button, :scope > a'))
          .filter((accion) => accion.dataset.vidaNoteAction !== 'true')
        const etiquetas = acciones.map(nombreAccion)
        if (!etiquetas.includes('Compartir')) return

        const firma = etiquetas.join('|')
        if (panel.dataset.vidaIconsReady === 'true' && panel.dataset.vidaActionsSignature === firma) return

        panel.dataset.vidaVerseActions = 'true'
        panel.dataset.vidaActionsSignature = firma
        panel.className = 'mb-4 mt-2 flex flex-wrap items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm backdrop-blur-sm transition-[opacity,transform] duration-150 ease-out dark:border-slate-700 dark:bg-slate-900/70'

        acciones.forEach((accion, indice) => {
          const nombre = etiquetas[indice]
          accion.dataset.vidaActionName = nombre
          accion.setAttribute('aria-label', nombre)
          accion.setAttribute('title', nombre)
          accion.className = nombre === 'Quitar' ? claseFavorito : claseNeutral
          estilizarIconoOriginal(accion)
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
            botonNota.innerHTML = iconoNota
            botonNota.className = claseNeutral
            botonNota.addEventListener('click', () => {
              botonNota.className = claseNotaActiva
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
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [pathname, router])

  return null
}
