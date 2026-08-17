'use client'

import { useLayoutEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { agregarNotaBiblicaDelUsuario } from '@/lib/biblia/notes-local'

type TemaBiblia = 'claro' | 'sepia' | 'oscuro'

const accionesValidas = ['Guardar', 'Quitar', 'Escuchar', 'Compartir', 'Profundo', 'Estudiar']
const iconoNota = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/></svg>'
const iconoFavoritoVersiculo = '<svg data-vida-optimistic-verse-star="true" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="ml-1.5 inline h-3 w-3 text-amber-400"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>'

function temaBibliaActual(): TemaBiblia {
  const dataset = document.body.dataset.bibliaTema || document.documentElement.dataset.bibliaTema
  if (dataset === 'oscuro' || dataset === 'sepia' || dataset === 'claro') return dataset

  try {
    const raw = localStorage.getItem('vida-biblia-preferencias')
    const guardado = raw ? JSON.parse(raw)?.modo : 'claro'
    return guardado === 'oscuro' || guardado === 'sepia' ? guardado : 'claro'
  } catch {
    return 'claro'
  }
}

function clasePanel(tema: TemaBiblia) {
  if (tema === 'oscuro') {
    return 'mb-4 mt-2 flex flex-wrap items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-600 bg-slate-700 p-3 shadow-sm transition-[opacity,transform] duration-150 ease-out'
  }
  if (tema === 'sepia') {
    return 'mb-4 mt-2 flex flex-wrap items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[#cdb991] bg-[#ead9b5] p-3 shadow-sm transition-[opacity,transform] duration-150 ease-out'
  }
  return 'mb-4 mt-2 flex flex-wrap items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-sm transition-[opacity,transform] duration-150 ease-out'
}

function claseBase(tema: TemaBiblia) {
  if (tema === 'oscuro') {
    return 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 p-0 text-[0px] leading-none text-white shadow-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-95'
  }
  if (tema === 'sepia') {
    return 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#cdb991] bg-[#fff8e8] p-0 text-[0px] leading-none text-[#493c2d] shadow-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-95'
  }
  return 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-0 text-[0px] leading-none text-slate-700 shadow-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-95'
}

function claseFavorito(tema: TemaBiblia) {
  const base = claseBase(tema)
  return `${base} text-amber-400`
}

function claseNota(tema: TemaBiblia) {
  return claseBase(tema).replace('text-[0px] ', '')
}

function texto(elemento: Element | null) {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function normalizarReferencia(referencia: string) {
  return referencia
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
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
    svg.style.transform = 'translate(0, 0)'

    if (favoritoActivo) {
      svg.setAttribute('fill', 'currentColor')
      svg.style.color = 'rgb(251 191 36)'
    } else {
      svg.setAttribute('fill', 'none')
      svg.style.color = ''
    }
  })
}

function aplicarFavoritoVisual(accion: HTMLElement, activo: boolean) {
  const tema = temaBibliaActual()
  accion.className = activo ? claseFavorito(tema) : claseBase(tema)
  estilizarIconoOriginal(accion, activo)
}

function estrellasReales(parrafo: HTMLElement) {
  return Array.from(parrafo.querySelectorAll<SVGElement>('svg')).filter((svg) =>
    svg.dataset.vidaOptimisticVerseStar !== 'true' &&
    (svg.classList.contains('fill-amber-400') || svg.classList.contains('text-amber-400'))
  )
}

function aplicarFavoritoEnVersiculo(panel: HTMLElement, activo: boolean) {
  const parrafo = panel.parentElement?.querySelector<HTMLElement>(':scope > p') ?? null
  if (!parrafo) return

  const optimista = parrafo.querySelector<SVGElement>('[data-vida-optimistic-verse-star="true"]')
  const reales = estrellasReales(parrafo)

  if (activo) {
    reales.forEach((estrella) => {
      estrella.style.display = ''
      estrella.removeAttribute('data-vida-star-hidden')
    })
    if (reales.length) optimista?.remove()
    else if (!optimista) parrafo.insertAdjacentHTML('beforeend', iconoFavoritoVersiculo)
    return
  }

  optimista?.remove()
  reales.forEach((estrella) => {
    estrella.dataset.vidaStarHidden = 'true'
    estrella.style.display = 'none'
  })
}

async function guardarNotaBiblica(referencia: string, contenido: string) {
  return agregarNotaBiblicaDelUsuario({
    titulo: referencia,
    contenido,
    tipo: 'versiculo',
    referencia,
    origen: 'biblia_notas',
    pasajeNormalizado: normalizarReferencia(referencia),
    contexto: { superficieOrigen: 'biblia' },
  })
}

export default function BibleVerseActionsPersistent() {
  const pathname = usePathname()
  const router = useRouter()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    let frame = 0
    const expiraciones = new Map<HTMLElement, number>()

    const limpiarOptimista = (accion: HTMLElement, panel: HTMLElement, estadoReal: boolean) => {
      accion.removeAttribute('data-vida-favorite-optimistic')
      accion.removeAttribute('data-vida-favorite-expected')
      aplicarFavoritoVisual(accion, estadoReal)
      aplicarFavoritoEnVersiculo(panel, estadoReal)
      const timer = expiraciones.get(accion)
      if (timer) window.clearTimeout(timer)
      expiraciones.delete(accion)
    }

    const preparar = () => {
      frame = 0
      const tema = temaBibliaActual()

      document.querySelectorAll<HTMLElement>('button, a').forEach((accionInicial) => {
        const etiquetaInicial = nombreAccion(accionInicial)
        if (!accionesValidas.includes(etiquetaInicial)) return

        const panel = accionInicial.parentElement
        if (!panel) return

        const acciones = Array.from(panel.querySelectorAll<HTMLElement>(':scope > button, :scope > a'))
          .filter((accion) => accion.dataset.vidaNoteAction !== 'true')
        const etiquetas = acciones.map(nombreAccion)
        if (!etiquetas.includes('Compartir')) return

        panel.dataset.vidaVerseActions = 'true'
        panel.className = clasePanel(tema)

        acciones.forEach((accion, indice) => {
          const nombre = etiquetas[indice]
          if (!accionesValidas.includes(nombre)) return

          const favoritoActivoReal = nombre === 'Quitar'
          accion.dataset.vidaActionName = nombre
          accion.setAttribute('aria-label', nombre)
          accion.setAttribute('title', nombre)

          if (nombre === 'Guardar' || nombre === 'Quitar') {
            const esperado = accion.dataset.vidaFavoriteExpected
            const esperadoActivo = esperado === 'true'

            if (esperado !== undefined && favoritoActivoReal === esperadoActivo) {
              limpiarOptimista(accion, panel, favoritoActivoReal)
            }

            const optimista = accion.dataset.vidaFavoriteOptimistic
            const activoVisual = optimista === undefined ? favoritoActivoReal : optimista === 'true'
            aplicarFavoritoVisual(accion, activoVisual)
            aplicarFavoritoEnVersiculo(panel, activoVisual)

            if (accion.dataset.vidaFavoriteRefresh !== 'true') {
              accion.dataset.vidaFavoriteRefresh = 'true'
              accion.addEventListener('click', () => {
                if ('disabled' in accion && (accion as HTMLButtonElement).disabled) return

                const realActual = nombreAccion(accion) === 'Quitar'
                const visualActual = accion.dataset.vidaFavoriteOptimistic === undefined
                  ? realActual
                  : accion.dataset.vidaFavoriteOptimistic === 'true'
                const siguiente = !visualActual

                accion.dataset.vidaFavoriteOptimistic = siguiente ? 'true' : 'false'
                accion.dataset.vidaFavoriteExpected = siguiente ? 'true' : 'false'
                aplicarFavoritoVisual(accion, siguiente)
                aplicarFavoritoEnVersiculo(panel, siguiente)

                const anterior = expiraciones.get(accion)
                if (anterior) window.clearTimeout(anterior)

                const timer = window.setTimeout(() => {
                  const estadoReal = nombreAccion(accion) === 'Quitar'
                  limpiarOptimista(accion, panel, estadoReal)
                  preparar()
                }, 5000)
                expiraciones.set(accion, timer)
              })
            }
          } else {
            accion.className = claseBase(tema)
            estilizarIconoOriginal(accion, false)
          }
        })

        const notaExistente = panel.querySelector<HTMLElement>('[data-vida-note-action="true"]')
        if (notaExistente) notaExistente.className = claseNota(tema)

        if (!notaExistente) {
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
            botonNota.className = claseNota(tema)
            botonNota.innerHTML = iconoNota
            botonNota.addEventListener('click', async () => {
              if (botonNota.dataset.vidaNoteSaving === 'true') return
              botonNota.dataset.vidaNoteSaving = 'true'
              const copia = parrafo.cloneNode(true) as HTMLElement
              copia.querySelectorAll('sup, svg').forEach((elemento) => elemento.remove())
              try {
                const nota = await guardarNotaBiblica(`${pasaje}:${numero}`, texto(copia))
                router.push(`/biblia/notas?nota=${encodeURIComponent(nota.id)}`)
              } finally {
                delete botonNota.dataset.vidaNoteSaving
              }
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
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'title', 'data-biblia-tema'],
    })

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      expiraciones.forEach((timer) => window.clearTimeout(timer))
      expiraciones.clear()
    }
  }, [pathname, router])

  return null
}
