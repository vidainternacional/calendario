'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const API = 'https://bible.helloao.org/api'
const MODE_KEY = 'vida-biblia-modo-comparacion'

type VersoApi = { type?: string; number?: number; content?: unknown[] }

type Resultado = {
  id: string
  nombre: string
  texto: string
  disponible: boolean
}

function normalizar(valor: string | null | undefined) {
  return (valor ?? '').replace(/\s+/g, ' ').trim()
}

function textoVerso(verso: VersoApi) {
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
  return document.documentElement.dataset.bibliaTema || document.body.dataset.bibliaTema || 'claro'
}

function clasePanel() {
  const tema = temaActual()
  if (tema === 'oscuro') return 'border-slate-700 bg-slate-950 text-slate-100'
  if (tema === 'sepia') return 'border-[#cdb991] bg-[#fff8e8] text-[#382d21]'
  return 'border-slate-200 bg-white text-slate-800'
}

function parametrosContexto() {
  const actual = new URLSearchParams(window.location.search)
  const params = new URLSearchParams()
  ;['from', 'workspace', 'paqueteId'].forEach((clave) => {
    const valor = actual.get(clave)
    if (valor) params.set(clave, valor)
  })
  params.set('inline', '1')
  return params
}

function buscarZonaPanel(elemento: Element | null) {
  if (!elemento) return null

  return elemento.closest<HTMLElement>('[class~="p-5"], [class~="sm:p-7"]')
    ?? elemento.parentElement?.parentElement
    ?? elemento.parentElement
    ?? null
}

export default function BibleUnifiedWorkspacePanels() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/biblia') return

    let solicitud = 0
    let modo: 'dos' | 'todas' = localStorage.getItem(MODE_KEY) === 'todas' ? 'todas' : 'dos'

    const prepararNotas = () => {
      const botones = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      const activo = botones.find((boton) => normalizar(boton.textContent) === 'Notas' && boton.className.includes('bg-violet-600'))
      if (!activo) return

      const titulo = Array.from(document.querySelectorAll<HTMLElement>('h2')).find((elemento) => /^Notas de /i.test(normalizar(elemento.textContent)))
      const zona = buscarZonaPanel(titulo)
      if (!zona || zona.dataset.vidaUnifiedNotes === 'true') return

      zona.dataset.vidaUnifiedNotes = 'true'
      zona.innerHTML = ''
      zona.className = 'p-0'

      const contenedor = document.createElement('section')
      contenedor.className = `overflow-hidden border-t ${clasePanel()}`
      contenedor.style.opacity = '0'
      contenedor.style.transform = 'translateY(-10px)'
      contenedor.style.transition = 'opacity 220ms ease, transform 220ms ease'

      const iframe = document.createElement('iframe')
      iframe.title = 'Notas bíblicas integradas'
      iframe.src = `/biblia/notas?${parametrosContexto().toString()}`
      iframe.className = 'h-[72dvh] min-h-[560px] w-full border-0 bg-transparent'
      iframe.setAttribute('loading', 'eager')
      contenedor.append(iframe)
      zona.append(contenedor)

      requestAnimationFrame(() => {
        contenedor.style.opacity = '1'
        contenedor.style.transform = 'translateY(0)'
      })
    }

    const cargarTodas = async (zona: HTMLElement, traduccion: HTMLSelectElement, libro: HTMLSelectElement, capitulo: HTMLSelectElement, versiculo: HTMLSelectElement) => {
      const panel = zona.querySelector<HTMLElement>('[data-vida-unified-all]')
      if (!panel || modo !== 'todas') return

      const idSolicitud = ++solicitud
      const numero = Number(versiculo.value) || 1
      panel.innerHTML = '<p class="py-10 text-center text-sm font-semibold opacity-70">Cargando versiones…</p>'

      const traducciones = Array.from(traduccion.options)
        .filter((opcion) => Boolean(opcion.value))
        .map((opcion) => ({ id: opcion.value, nombre: normalizar(opcion.textContent) || opcion.value }))

      const resultados: Resultado[] = new Array(traducciones.length)
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
            const texto = verso ? textoVerso(verso) : ''
            resultados[actual] = { ...item, texto: texto || 'No disponible en esta traducción.', disponible: Boolean(texto) }
          } catch {
            resultados[actual] = { ...item, texto: 'No disponible en esta traducción.', disponible: false }
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(4, traducciones.length) }, () => trabajador()))
      if (idSolicitud !== solicitud || modo !== 'todas') return

      panel.innerHTML = ''
      const encabezado = document.createElement('div')
      encabezado.className = 'mb-3 px-1'
      encabezado.innerHTML = `<p class="text-sm font-bold">Todas las versiones · versículo ${numero}</p><p class="mt-1 text-xs opacity-65">El mismo versículo en todas las traducciones disponibles.</p>`
      panel.append(encabezado)

      const lista = document.createElement('div')
      lista.className = 'max-h-[62vh] space-y-2 overflow-y-auto overscroll-contain pr-1'
      resultados.forEach((resultado) => {
        const tarjeta = document.createElement('article')
        tarjeta.className = `rounded-2xl border p-4 ${clasePanel()}`
        tarjeta.innerHTML = `<p class="text-[11px] font-black uppercase tracking-wide text-violet-600">${resultado.nombre}</p><p class="mt-2 text-sm leading-6 ${resultado.disponible ? '' : 'opacity-55'}"><sup class="mr-1.5 font-black text-[#C0392B]">${numero}</sup>${resultado.texto}</p>`
        lista.append(tarjeta)
      })
      panel.append(lista)
    }

    const prepararComparar = () => {
      const botones = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      const activo = botones.find((boton) => normalizar(boton.textContent) === 'Comparar' && boton.className.includes('bg-violet-600'))
      if (!activo) return

      const etiqueta = Array.from(document.querySelectorAll<HTMLLabelElement>('label')).find((label) => /Segunda traducci[oó]n/i.test(normalizar(label.textContent)))
      const zona = buscarZonaPanel(etiqueta)
      if (!zona) return

      const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
      const traduccion = selects.find((select) => /versi[oó]n de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
      const libro = selects.find((select) => /libro de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
      const capitulo = selects.find((select) => /cap[ií]tulo/i.test(select.getAttribute('aria-label') ?? ''))
      const versiculo = selects.find((select) => /vers[ií]culo/i.test(select.getAttribute('aria-label') ?? ''))
      if (!traduccion || !libro || !capitulo || !versiculo) return

      let controles = zona.querySelector<HTMLElement>('[data-vida-unified-compare]')
      if (!controles) {
        controles = document.createElement('section')
        controles.dataset.vidaUnifiedCompare = 'true'
        controles.className = `mb-4 rounded-2xl border p-3 ${clasePanel()}`
        controles.innerHTML = '<p class="mb-2 px-1 text-[11px] font-black uppercase tracking-wide opacity-65">Modo de comparación</p>'
        const fila = document.createElement('div')
        fila.className = 'flex gap-2'
        ;(['dos', 'todas'] as const).forEach((id) => {
          const boton = document.createElement('button')
          boton.type = 'button'
          boton.dataset.modo = id
          boton.textContent = id === 'dos' ? 'Dos Biblias' : 'Todas las versiones'
          boton.addEventListener('click', () => {
            modo = id
            localStorage.setItem(MODE_KEY, modo)
            solicitud += 1
            prepararComparar()
          })
          fila.append(boton)
        })
        controles.append(fila)
        zona.prepend(controles)

        const panel = document.createElement('section')
        panel.dataset.vidaUnifiedAll = 'true'
        panel.className = `mt-3 rounded-2xl border p-3 ${clasePanel()}`
        zona.append(panel)

        ;[traduccion, libro, capitulo, versiculo].forEach((select) => select.addEventListener('change', () => {
          if (modo === 'todas') void cargarTodas(zona, traduccion, libro, capitulo, versiculo)
        }))
      }

      controles.className = `mb-4 rounded-2xl border p-3 ${clasePanel()}`
      controles.querySelectorAll<HTMLButtonElement>('button[data-modo]').forEach((boton) => {
        const activo = boton.dataset.modo === modo
        boton.className = activo
          ? 'min-h-11 flex-1 rounded-full bg-violet-600 px-4 text-xs font-bold text-white shadow-sm'
          : `min-h-11 flex-1 rounded-full border px-4 text-xs font-bold ${clasePanel()}`
      })

      const panel = zona.querySelector<HTMLElement>('[data-vida-unified-all]')
      Array.from(zona.children).forEach((hijo) => {
        if (!(hijo instanceof HTMLElement)) return
        if (hijo === controles || hijo === panel) return
        hijo.style.display = modo === 'todas' ? 'none' : ''
      })

      if (panel) {
        panel.style.display = modo === 'todas' ? '' : 'none'
        if (modo === 'todas') void cargarTodas(zona, traduccion, libro, capitulo, versiculo)
      }
    }

    const actualizar = () => {
      try {
        prepararNotas()
      } catch (error) {
        console.error('[Biblia] No se pudo preparar el cuaderno de notas', error)
      }

      try {
        prepararComparar()
      } catch (error) {
        console.error('[Biblia] No se pudo preparar la comparación', error)
      }
    }

    const observer = new MutationObserver(actualizar)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(actualizar, 250)
    actualizar()

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      solicitud += 1
    }
  }, [pathname])

  return null
}
