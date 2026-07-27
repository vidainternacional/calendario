'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

const API = 'https://bible.helloao.org/api'
const MODE_KEY = 'vida-biblia-modo-comparacion'

type Modo = 'dos' | 'todas'
type VersoApi = { type?: string; number?: number; content?: unknown[] }

type TraduccionDisponible = {
  id: string
  nombre: string
}

function texto(elemento: Element | null) {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function textoDeVerso(verso: VersoApi): string {
  if (!Array.isArray(verso.content)) return ''
  return verso.content.map((parte) => {
    if (typeof parte === 'string') return parte
    if (parte && typeof parte === 'object' && 'text' in (parte as Record<string, unknown>)) {
      return String((parte as Record<string, unknown>).text)
    }
    return ''
  }).join(' ').replace(/\s+/g, ' ').trim()
}

function temaActual() {
  return document.documentElement.getAttribute('data-biblia-tema') || 'claro'
}

function clasePanel() {
  const tema = temaActual()
  if (tema === 'oscuro') return 'rounded-3xl border border-slate-700 bg-slate-900/90 p-3 text-slate-100'
  if (tema === 'sepia') return 'rounded-3xl border border-[#cdb991] bg-[#f8edd6] p-3 text-[#382d21]'
  return 'rounded-3xl border border-violet-200 bg-violet-50/70 p-3 text-slate-800'
}

function claseBoton(activo: boolean) {
  if (activo) return 'min-h-11 flex-1 rounded-full bg-violet-600 px-4 text-xs font-bold text-white shadow-sm'
  const tema = temaActual()
  if (tema === 'oscuro') return 'min-h-11 flex-1 rounded-full border border-slate-700 bg-slate-950 px-4 text-xs font-bold text-slate-200'
  if (tema === 'sepia') return 'min-h-11 flex-1 rounded-full border border-[#cdb991] bg-[#fff8e8] px-4 text-xs font-bold text-[#493c2d]'
  return 'min-h-11 flex-1 rounded-full border border-violet-200 bg-white px-4 text-xs font-bold text-slate-700'
}

function claseTarjeta() {
  const tema = temaActual()
  if (tema === 'oscuro') return 'rounded-2xl border border-slate-700 bg-slate-950/70 p-4'
  if (tema === 'sepia') return 'rounded-2xl border border-[#d7c49c] bg-[#fff8e8] p-4'
  return 'rounded-2xl border border-slate-200 bg-white p-4'
}

function buscarContexto() {
  const botones = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
  const compararActivo = botones.some((boton) => texto(boton) === 'Comparar' && boton.className.includes('bg-violet-600'))
  if (!compararActivo) return null

  const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
  const traduccion = selects.find((select) => /versi[oó]n de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
  const libro = selects.find((select) => /libro de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
  const capitulo = selects.find((select) => /cap[ií]tulo/i.test(select.getAttribute('aria-label') ?? ''))
  const versiculo = selects.find((select) => /vers[ií]culo/i.test(select.getAttribute('aria-label') ?? ''))
  const etiquetaSegunda = Array.from(document.querySelectorAll<HTMLLabelElement>('label')).find((label) => /segunda traducci[oó]n/i.test(texto(label)))
  const zona = etiquetaSegunda?.closest<HTMLElement>('div.p-5') ?? etiquetaSegunda?.parentElement ?? null

  if (!traduccion || !libro || !capitulo || !versiculo || !zona) return null
  return { traduccion, libro, capitulo, versiculo, zona }
}

export default function BibleCompareAllVersions() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    let modo: Modo = localStorage.getItem(MODE_KEY) === 'todas' ? 'todas' : 'dos'
    let firmaCargada = ''
    let solicitud = 0

    const restaurarContenidoOriginal = (zona: HTMLElement) => {
      Array.from(zona.children).forEach((hijo) => {
        if (!(hijo instanceof HTMLElement)) return
        if (hijo.dataset.vidaCompareModes === 'true' || hijo.dataset.vidaAllVersions === 'true') return
        if (hijo.dataset.vidaHiddenByAllVersions === 'true') {
          hijo.style.display = hijo.dataset.vidaPreviousDisplay ?? ''
          delete hijo.dataset.vidaHiddenByAllVersions
          delete hijo.dataset.vidaPreviousDisplay
        }
      })
    }

    const ocultarContenidoOriginal = (zona: HTMLElement) => {
      Array.from(zona.children).forEach((hijo) => {
        if (!(hijo instanceof HTMLElement)) return
        if (hijo.dataset.vidaCompareModes === 'true' || hijo.dataset.vidaAllVersions === 'true') return
        if (hijo.dataset.vidaHiddenByAllVersions !== 'true') {
          hijo.dataset.vidaPreviousDisplay = hijo.style.display
          hijo.dataset.vidaHiddenByAllVersions = 'true'
        }
        hijo.style.display = 'none'
      })
    }

    const traduccionesDelSelect = (select: HTMLSelectElement): TraduccionDisponible[] => {
      return Array.from(select.options)
        .filter((opcion) => Boolean(opcion.value))
        .map((opcion) => ({ id: opcion.value, nombre: opcion.textContent?.trim() || opcion.value }))
    }

    const cargarTodas = async (forzar = false) => {
      const contexto = buscarContexto()
      if (!contexto || modo !== 'todas') return
      const { traduccion, libro, capitulo, versiculo, zona } = contexto
      const numero = Number(versiculo.value) || 1
      const firma = `${libro.value}:${capitulo.value}:${numero}:${traduccion.options.length}`
      if (!forzar && firma === firmaCargada) return
      firmaCargada = firma
      const idSolicitud = ++solicitud

      let panel = zona.querySelector<HTMLElement>('[data-vida-all-versions="true"]')
      if (!panel) {
        panel = document.createElement('section')
        panel.dataset.vidaAllVersions = 'true'
        zona.append(panel)
      }

      panel.className = `${clasePanel()} mt-3`
      panel.innerHTML = ''

      const encabezado = document.createElement('div')
      encabezado.className = 'mb-3 flex items-start justify-between gap-3 px-1'
      const textos = document.createElement('div')
      const titulo = document.createElement('p')
      titulo.className = 'text-sm font-bold'
      titulo.textContent = `Todas las versiones · versículo ${numero}`
      const ayuda = document.createElement('p')
      ayuda.className = 'mt-1 text-xs opacity-65'
      ayuda.textContent = 'El mismo versículo en todas las traducciones disponibles.'
      textos.append(titulo, ayuda)
      encabezado.append(textos)

      const estado = document.createElement('p')
      estado.className = 'py-10 text-center text-sm font-semibold opacity-70'
      estado.textContent = 'Cargando versiones…'
      panel.append(encabezado, estado)

      const traducciones = traduccionesDelSelect(traduccion)
      const resultados: Array<{ traduccion: TraduccionDisponible; texto: string; disponible: boolean }> = new Array(traducciones.length)
      let indice = 0

      const trabajador = async () => {
        while (indice < traducciones.length) {
          const actual = indice++
          const item = traducciones[actual]
          try {
            const respuesta = await fetch(`${API}/${item.id}/${libro.value}/${capitulo.value}.json`)
            if (!respuesta.ok) throw new Error('chapter')
            const data = await respuesta.json()
            const contenido: VersoApi[] = data.chapter?.content ?? []
            const verso = contenido.find((entrada) => entrada.type === 'verse' && entrada.number === numero)
            const contenidoTexto = verso ? textoDeVerso(verso) : ''
            resultados[actual] = { traduccion: item, texto: contenidoTexto || 'No disponible en esta traducción.', disponible: Boolean(contenidoTexto) }
          } catch {
            resultados[actual] = { traduccion: item, texto: 'No disponible en esta traducción.', disponible: false }
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(4, traducciones.length) }, () => trabajador()))
      if (idSolicitud !== solicitud || modo !== 'todas') return

      panel.innerHTML = ''
      panel.append(encabezado)
      const lista = document.createElement('div')
      lista.className = 'max-h-[62vh] space-y-2 overflow-y-auto overscroll-contain pr-1'

      resultados.forEach((resultado) => {
        const tarjeta = document.createElement('article')
        tarjeta.className = claseTarjeta()
        const nombre = document.createElement('p')
        nombre.className = 'text-[11px] font-black uppercase tracking-wide text-violet-600'
        nombre.textContent = resultado.traduccion.nombre
        const contenido = document.createElement('p')
        contenido.className = `mt-2 text-sm leading-6 ${resultado.disponible ? '' : 'opacity-55'}`
        const numeroSup = document.createElement('sup')
        numeroSup.className = 'mr-1.5 font-black text-[#C0392B]'
        numeroSup.textContent = String(numero)
        contenido.append(numeroSup, document.createTextNode(resultado.texto))
        tarjeta.append(nombre, contenido)
        lista.append(tarjeta)
      })

      panel.append(lista)
    }

    const renderizar = () => {
      const contexto = buscarContexto()
      if (!contexto) return
      const { zona, traduccion, libro, capitulo, versiculo } = contexto

      let controles = zona.querySelector<HTMLElement>('[data-vida-compare-modes="true"]')
      if (!controles) {
        controles = document.createElement('section')
        controles.dataset.vidaCompareModes = 'true'
        controles.className = `${clasePanel()} mb-3`
        const titulo = document.createElement('p')
        titulo.className = 'mb-2 px-1 text-[11px] font-black uppercase tracking-wide opacity-65'
        titulo.textContent = 'Modo de comparación'
        const fila = document.createElement('div')
        fila.className = 'flex gap-2'
        const dos = document.createElement('button')
        dos.type = 'button'
        dos.dataset.vidaMode = 'dos'
        dos.textContent = 'Dos Biblias'
        const todas = document.createElement('button')
        todas.type = 'button'
        todas.dataset.vidaMode = 'todas'
        todas.textContent = 'Todas las versiones'
        dos.addEventListener('click', () => {
          modo = 'dos'
          localStorage.setItem(MODE_KEY, modo)
          solicitud += 1
          renderizar()
        })
        todas.addEventListener('click', () => {
          modo = 'todas'
          localStorage.setItem(MODE_KEY, modo)
          firmaCargada = ''
          renderizar()
        })
        fila.append(dos, todas)
        controles.append(titulo, fila)
        zona.prepend(controles)

        ;[traduccion, libro, capitulo, versiculo].forEach((select) => {
          select.addEventListener('change', () => {
            firmaCargada = ''
            void cargarTodas(true)
          })
        })
      }

      controles.className = `${clasePanel()} mb-3`
      controles.querySelectorAll<HTMLButtonElement>('button[data-vida-mode]').forEach((boton) => {
        boton.className = claseBoton(boton.dataset.vidaMode === modo)
      })

      const panelTodas = zona.querySelector<HTMLElement>('[data-vida-all-versions="true"]')
      if (modo === 'todas') {
        ocultarContenidoOriginal(zona)
        controles.style.display = ''
        if (panelTodas) panelTodas.style.display = ''
        void cargarTodas()
      } else {
        restaurarContenidoOriginal(zona)
        controles.style.display = ''
        if (panelTodas) panelTodas.style.display = 'none'
      }
    }

    const observer = new MutationObserver(() => renderizar())
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(renderizar, 400)
    renderizar()

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      solicitud += 1
    }
  }, [pathname])

  return null
}
