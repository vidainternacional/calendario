'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

const claseBase = 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-0 text-[0px] leading-none text-slate-700 shadow-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
const claseFavorito = 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-0 text-[0px] leading-none text-amber-400 shadow-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-95 dark:border-slate-700 dark:bg-slate-800'

const accionesValidas = ['Guardar', 'Quitar', 'Escuchar', 'Compartir', 'Profundo', 'Estudiar']

function texto(elemento: Element | null) {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function nombreAccion(accion: HTMLElement) {
  const visible = texto(accion)
  if (accionesValidas.includes(visible)) return visible
  return accion.getAttribute('aria-label') || accion.getAttribute('title') || visible
}

function estilizarIconoOriginal(accion: HTMLElement, favoritoActivo: boolean) {
  accion.querySelectorAll<SVGElement>('svg').forEach((svg) => {
    svg.classList.remove('h-3.5', 'w-3.5', 'h-4', 'w-4', 'h-5', 'w-5')
    svg.classList.add('block', 'h-[19px]', 'w-[19px]', 'shrink-0')
    svg.style.display = 'block'
    svg.style.margin = '0'
    svg.style.transform = 'translateY(0)'

    if (favoritoActivo) {
      svg.setAttribute('fill', 'currentColor')
      svg.style.color = 'rgb(251 191 36)'
    } else {
      svg.setAttribute('fill', 'none')
      svg.style.color = ''
    }
  })
}

export default function BibleVerseActionsPersistent() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    let frame = 0
    const reintentos = new Set<number>()

    const preparar = () => {
      frame = 0

      document.querySelectorAll<HTMLElement>('button, a').forEach((accionInicial) => {
        const etiquetaInicial = nombreAccion(accionInicial)
        if (!accionesValidas.includes(etiquetaInicial)) return

        const panel = accionInicial.parentElement
        if (!panel) return

        const acciones = Array.from(panel.querySelectorAll<HTMLElement>(':scope > button, :scope > a'))
        const etiquetas = acciones.map(nombreAccion)
        if (!etiquetas.includes('Compartir')) return

        panel.dataset.vidaVerseActions = 'true'
        panel.className = 'mb-4 mt-2 flex flex-wrap items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm backdrop-blur-sm transition-[opacity,transform] duration-150 ease-out dark:border-slate-700 dark:bg-slate-900/70'

        acciones.forEach((accion, indice) => {
          const nombre = etiquetas[indice]

          if (accionesValidas.includes(nombre)) {
            const favoritoActivo = nombre === 'Quitar'
            accion.dataset.vidaActionName = nombre
            accion.setAttribute('aria-label', nombre)
            accion.setAttribute('title', nombre)
            accion.className = favoritoActivo ? claseFavorito : claseBase
            estilizarIconoOriginal(accion, favoritoActivo)
          }

          if ((nombre === 'Guardar' || nombre === 'Quitar') && accion.dataset.vidaFavoriteRefresh !== 'true') {
            accion.dataset.vidaFavoriteRefresh = 'true'
            accion.addEventListener('click', () => {
              ;[0, 180, 500, 1000].forEach((delay) => {
                const timer = window.setTimeout(preparar, delay)
                reintentos.add(timer)
              })
            })
          }
        })

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
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'title'],
    })

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      reintentos.forEach((timer) => window.clearTimeout(timer))
      reintentos.clear()
    }
  }, [pathname])

  return null
}
