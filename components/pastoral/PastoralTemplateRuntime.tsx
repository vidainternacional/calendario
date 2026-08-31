'use client'

import { useEffect } from 'react'
import { PALETAS_PRESENTACION } from '@/components/pastoral/pastoral-editor-presets'
import type { PlantillaAdministrada } from '@/components/pastoral/pastoral-template-admin-model'

const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim().toLowerCase()

const COLORES_SOLIDOS = [
  '#FFFFFF','#F8FAFC','#F5F1E8','#FFF7ED','#FDECEC','#FCE7F3','#F3E8FF','#EDE9FE',
  '#DBEAFE','#CFFAFE','#CCFBF1','#DCFCE7','#ECFCCB','#FEF9C3','#FFEDD5','#FED7AA',
  '#FDA4AF','#F87171','#EF4444','#B91C1C','#7F1D1D','#F97316','#EA580C','#F59E0B',
  '#FACC15','#84CC16','#22C55E','#15803D','#0F766E','#14B8A6','#06B6D4','#0284C7',
  '#2563EB','#1D4ED8','#4338CA','#6D28D9','#9333EA','#C026D3','#DB2777','#BE123C',
  '#0F172A','#1E293B','#334155','#475569','#6B7280','#78716C','#3F3F46','#18181B',
]

const DEGRADADOS = [
  ['Amanecer','linear-gradient(135deg,#FFF6E8 0%,#FFD9C7 48%,#F3D5E8 100%)','#5A3134'],
  ['Océano','linear-gradient(135deg,#0EA5E9 0%,#2563EB 48%,#312E81 100%)','#FFFFFF'],
  ['Púrpura','linear-gradient(135deg,#312E81 0%,#6D28D9 52%,#A855F7 100%)','#FFFFFF'],
  ['Bosque','linear-gradient(135deg,#052E16 0%,#166534 55%,#4D7C0F 100%)','#FFFFFF'],
  ['Fuego','linear-gradient(135deg,#7F1D1D 0%,#EA580C 50%,#FACC15 100%)','#FFFFFF'],
  ['Atardecer','linear-gradient(135deg,#FB7185 0%,#C084FC 48%,#6366F1 100%)','#FFFFFF'],
  ['Hielo','linear-gradient(135deg,#F8FAFC 0%,#DBEAFE 45%,#A5F3FC 100%)','#0F172A'],
  ['Arena','linear-gradient(135deg,#FFF7ED 0%,#FED7AA 48%,#D6B98C 100%)','#3F2D20'],
  ['Grafito','linear-gradient(135deg,#111827 0%,#374151 50%,#0F172A 100%)','#FFFFFF'],
  ['Menta','linear-gradient(135deg,#ECFDF5 0%,#A7F3D0 48%,#2DD4BF 100%)','#064E3B'],
  ['Borgoña','linear-gradient(135deg,#3F0D1D 0%,#7F1D1D 55%,#BE123C 100%)','#FFFFFF'],
  ['Lavanda','linear-gradient(135deg,#FAF5FF 0%,#E9D5FF 50%,#C4B5FD 100%)','#3B1D60'],
]

const TEXTURAS = [
  ['Papel','repeating-linear-gradient(0deg,rgba(92,69,54,.04) 0 1px,transparent 1px 5px),linear-gradient(#FBF7EE,#F2E7D4)','#403329'],
  ['Lino claro','repeating-linear-gradient(0deg,rgba(15,23,42,.025) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(15,23,42,.02) 0 1px,transparent 1px 5px),#F8FAFC','#0F172A'],
  ['Grafito','repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 2px,transparent 2px 7px),linear-gradient(145deg,#20262F,#353D49)','#FFFFFF'],
  ['Puntos','radial-gradient(circle,rgba(15,23,42,.12) 1px,transparent 1.5px),#F8FAFC','#0F172A'],
  ['Puntos noche','radial-gradient(circle,rgba(255,255,255,.13) 1px,transparent 1.5px),#111827','#FFFFFF'],
  ['Rayas suaves','repeating-linear-gradient(135deg,rgba(37,99,235,.06) 0 8px,transparent 8px 16px),#F8FAFC','#172554'],
  ['Luz central','radial-gradient(circle at 50% 42%,rgba(255,255,255,.34),transparent 34%),linear-gradient(145deg,#1E3A8A,#312E81)','#FFFFFF'],
  ['Luz lateral','radial-gradient(circle at 78% 18%,rgba(96,165,250,.30),transparent 28%),linear-gradient(145deg,#07111F,#172554)','#FFFFFF'],
  ['Bruma','radial-gradient(circle at 18% 20%,rgba(255,255,255,.55),transparent 30%),radial-gradient(circle at 82% 78%,rgba(255,255,255,.28),transparent 34%),linear-gradient(145deg,#CFFAFE,#EDE9FE)','#24324A'],
  ['Orgánico','radial-gradient(circle at 82% 16%,rgba(180,83,9,.13),transparent 26%),radial-gradient(circle at 18% 80%,rgba(120,53,15,.10),transparent 30%),linear-gradient(145deg,#FBF5E9,#EAD8BD)','#4A3525'],
  ['Neón','radial-gradient(circle at 80% 20%,rgba(163,230,53,.28),transparent 25%),radial-gradient(circle at 18% 78%,rgba(34,211,238,.18),transparent 28%),linear-gradient(145deg,#071A18,#0D2B26)','#F7FEE7'],
  ['Vitral','conic-gradient(from 210deg at 55% 45%,#312E81,#7C3AED,#DB2777,#F97316,#FACC15,#0F766E,#2563EB,#312E81)','#FFFFFF'],
]

function panelActual() {
  return document.querySelector<HTMLElement>('.pastoral-editor-v4 .pastoral-tool-panel-flow')
}

function barraSubmenus() {
  return panelActual()?.querySelector<HTMLElement>('[aria-label^="Opciones de "]') ?? null
}

function botonSubmenu(indice: number) {
  return barraSubmenus()?.querySelectorAll<HTMLButtonElement>(':scope > button')[indice] ?? null
}

function contraste(hex: string) {
  const limpio = hex.replace('#','')
  if (limpio.length !== 6) return '#FFFFFF'
  const r = Number.parseInt(limpio.slice(0,2),16)
  const g = Number.parseInt(limpio.slice(2,4),16)
  const b = Number.parseInt(limpio.slice(4,6),16)
  const luminancia = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminancia > .58 ? '#0F172A' : '#FFFFFF'
}

function crearBotonFondo(nombre: string, fondo: string, texto: string, compacto = false) {
  const boton = document.createElement('button')
  boton.type = 'button'
  boton.dataset.vidaBackgroundCss = fondo
  boton.dataset.vidaBackgroundText = texto
  boton.className = compacto ? 'grid min-w-0 gap-1 text-center' : 'grid min-w-0 gap-1 text-center'
  boton.setAttribute('aria-label', `Aplicar fondo ${nombre}`)

  const preview = document.createElement('span')
  preview.className = compacto
    ? 'mx-auto block h-12 w-12 rounded-full border border-slate-200 shadow-sm'
    : 'relative block aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm'
  preview.style.background = fondo

  const etiqueta = document.createElement('span')
  etiqueta.className = 'truncate px-0.5 text-[10px] font-semibold text-slate-600'
  etiqueta.textContent = nombre
  boton.append(preview, etiqueta)
  return boton
}

function tituloSeccion(texto: string) {
  const p = document.createElement('p')
  p.className = 'px-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500'
  p.textContent = texto
  return p
}

export default function PastoralTemplateRuntime({ catalogo }: { catalogo: PlantillaAdministrada[] }) {
  useEffect(() => {
    void catalogo
    let frame = 0
    let observadorPanel: MutationObserver | null = null

    const sincronizarDock = () => {
      const dock = document.querySelector<HTMLElement>('.pastoral-editor-v4 .pastoral-tool-dock')
      if (!dock) return
      const botones = Array.from(dock.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const fondos = botones.find((boton) => {
        const aria = normalizar(boton.getAttribute('aria-label') ?? '')
        const texto = normalizar(boton.querySelector('small')?.textContent ?? '')
        return aria === 'plantillas' || aria === 'fondos' || texto === 'plantillas' || texto === 'fondos'
      })
      const texto = botones.find((boton) => normalizar(boton.getAttribute('aria-label') ?? '') === 'texto')
      const capas = botones.find((boton) => normalizar(boton.getAttribute('aria-label') ?? '') === 'capas')
      const borrar = botones.find((boton) => normalizar(boton.getAttribute('aria-label') ?? '').includes('borrar'))

      if (fondos) {
        fondos.hidden = false
        fondos.style.display = ''
        fondos.removeAttribute('aria-hidden')
        fondos.tabIndex = 0
        fondos.setAttribute('aria-label', 'Fondos')
        fondos.title = 'Fondos'
        fondos.style.order = '1'
        const etiqueta = fondos.querySelector('small')
        if (etiqueta) etiqueta.textContent = 'Fondos'
      }
      if (texto) texto.style.order = '2'
      if (capas) capas.style.order = '3'
      if (borrar) borrar.style.order = '4'

      dock.style.display = 'grid'
      dock.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr)) 44px'
      dock.style.gap = '8px'
      botones.forEach((boton) => {
        boton.style.gridColumn = 'auto'
        if (boton.classList.contains('pastoral-tool-button')) boton.style.width = '100%'
      })
    }

    const aplicarCssPorTema = (fondo: string, colorTexto: string) => {
      const transportador = PALETAS_PRESENTACION[0]
      if (!transportador) return
      const original = { fondo: transportador.fondo, titulo: transportador.titulo, texto: transportador.texto, acento: transportador.acento }
      transportador.fondo = fondo
      transportador.titulo = colorTexto
      transportador.texto = colorTexto
      transportador.acento = colorTexto

      const temas = botonSubmenu(1)
      if (!temas) {
        Object.assign(transportador, original)
        return
      }
      temas.click()

      observadorPanel?.disconnect()
      const raiz = document.querySelector<HTMLElement>('.pastoral-editor-v4')
      if (!raiz) {
        Object.assign(transportador, original)
        return
      }

      const intentar = () => {
        const grilla = document.querySelector<HTMLElement>('.pastoral-editor-v4 [aria-label="Temas en filas de tres"]')
        if (!grilla) return false
        const botones = Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button'))
        const boton = botones[0]
        if (!boton) return false
        observadorPanel?.disconnect()
        observadorPanel = null
        boton.click()
        Object.assign(transportador, original)
        window.requestAnimationFrame(() => {
          botonSubmenu(0)?.click()
          programarSincronizacion()
        })
        return true
      }

      if (intentar()) return
      observadorPanel = new MutationObserver(() => { intentar() })
      observadorPanel.observe(raiz, { childList: true, subtree: true })
    }

    const abrirImagenes = (subirDirecto: boolean) => {
      const imagenes = botonSubmenu(2)
      if (!imagenes) return
      imagenes.click()
      window.requestAnimationFrame(() => {
        const panel = panelActual()
        const comoFondo = Array.from(panel?.querySelectorAll<HTMLButtonElement>('button') ?? [])
          .find((boton) => normalizar(boton.textContent ?? '') === 'como fondo')
        comoFondo?.click()
        if (subirDirecto) {
          window.setTimeout(() => {
            const subir = Array.from(panelActual()?.querySelectorAll<HTMLButtonElement>('button') ?? [])
              .find((boton) => normalizar(boton.textContent ?? '').startsWith('subir'))
            subir?.click()
          }, 0)
        }
      })
    }

    const construirPanelFondos = (seccion: HTMLElement, original: HTMLElement) => {
      let contenedor = seccion.querySelector<HTMLElement>('[data-vida-background-studio="true"]')
      if (contenedor) return

      original.style.display = 'none'
      contenedor = document.createElement('div')
      contenedor.dataset.vidaBackgroundStudio = 'true'
      contenedor.className = 'grid gap-5 pb-2'

      const accionesImagen = document.createElement('div')
      accionesImagen.className = 'grid grid-cols-2 gap-2'
      const subir = document.createElement('button')
      subir.type = 'button'
      subir.dataset.vidaBackgroundUpload = 'true'
      subir.className = 'min-h-11 rounded-full border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700'
      subir.textContent = 'Subir imagen'
      const biblioteca = document.createElement('button')
      biblioteca.type = 'button'
      biblioteca.dataset.vidaBackgroundLibrary = 'true'
      biblioteca.className = 'min-h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700'
      biblioteca.textContent = 'Biblioteca'
      accionesImagen.append(subir, biblioteca)
      contenedor.append(tituloSeccion('Imagen como fondo'), accionesImagen)

      const selector = document.createElement('div')
      selector.className = 'grid grid-cols-[64px_1fr] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3'
      const color = document.createElement('input')
      color.type = 'color'
      color.value = '#FFFFFF'
      color.dataset.vidaBackgroundPicker = 'true'
      color.className = 'h-12 w-16 cursor-pointer rounded-xl border-0 bg-transparent p-0'
      color.setAttribute('aria-label','Elegir cualquier color de fondo')
      const info = document.createElement('div')
      info.innerHTML = '<strong class="block text-xs text-slate-700">Color libre</strong><small class="text-[10px] leading-4 text-slate-400">Abre el espectro completo y elige cualquier tono.</small>'
      selector.append(color, info)
      contenedor.append(tituloSeccion('Selector libre'), selector)

      const paleta = document.createElement('div')
      paleta.className = 'grid grid-cols-6 gap-x-2 gap-y-3'
      paleta.setAttribute('aria-label','Paleta amplia de colores')
      COLORES_SOLIDOS.forEach((hex) => paleta.appendChild(crearBotonFondo(hex, hex, contraste(hex), true)))
      contenedor.append(tituloSeccion('Colores'), paleta)

      const degradados = document.createElement('div')
      degradados.className = 'grid grid-cols-3 gap-2'
      DEGRADADOS.forEach(([nombre, fondo, texto]) => degradados.appendChild(crearBotonFondo(nombre, fondo, texto)))
      contenedor.append(tituloSeccion('Degradados'), degradados)

      const textura = document.createElement('div')
      textura.className = 'grid grid-cols-3 gap-2'
      TEXTURAS.forEach(([nombre, fondo, texto]) => textura.appendChild(crearBotonFondo(nombre, fondo, texto)))
      contenedor.append(tituloSeccion('Texturas y efectos'), textura)

      const mezcla = document.createElement('div')
      mezcla.className = 'grid gap-3 rounded-2xl border border-slate-200 bg-white p-3'
      const fila = document.createElement('div')
      fila.className = 'grid grid-cols-[1fr_1fr_80px] gap-2'
      const a = document.createElement('input')
      a.type = 'color'; a.value = '#2563EB'; a.dataset.vidaGradientA = 'true'; a.className = 'h-10 w-full rounded-lg'
      const b = document.createElement('input')
      b.type = 'color'; b.value = '#7C3AED'; b.dataset.vidaGradientB = 'true'; b.className = 'h-10 w-full rounded-lg'
      const angulo = document.createElement('input')
      angulo.type = 'number'; angulo.min = '0'; angulo.max = '360'; angulo.value = '135'; angulo.dataset.vidaGradientAngle = 'true'; angulo.className = 'h-10 rounded-lg border border-slate-200 px-2 text-xs'
      fila.append(a,b,angulo)
      const aplicar = document.createElement('button')
      aplicar.type = 'button'; aplicar.dataset.vidaGradientApply = 'true'; aplicar.className = 'min-h-10 rounded-full bg-slate-900 px-4 text-xs font-bold text-white'; aplicar.textContent = 'Aplicar mezcla personalizada'
      mezcla.append(fila, aplicar)
      contenedor.append(tituloSeccion('Mezcla personalizada'), mezcla)

      original.insertAdjacentElement('afterend', contenedor)
      const titulo = seccion.querySelector<HTMLElement>('.pastoral-panel-label')
      if (titulo) titulo.textContent = 'Fondos'
    }

    const sincronizarPanel = () => {
      const panel = panelActual()
      const barra = barraSubmenus()
      const esFondos = normalizar(panel?.getAttribute('aria-label') ?? '') === 'panel plantillas'
      if (barra) barra.style.display = esFondos ? 'none' : ''
      if (!esFondos) return

      const original = document.querySelector<HTMLElement>('.pastoral-editor-v4 [aria-label="Plantillas en filas de tres"]')
      if (!original) return
      const seccion = original.parentElement
      if (!seccion) return
      construirPanelFondos(seccion, original)
    }

    const sincronizar = () => {
      sincronizarDock()
      sincronizarPanel()
    }

    const programarSincronizacion = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(sincronizar)
    }

    const capturar = (event: Event) => {
      const objetivo = event.target instanceof Element ? event.target : null
      if (!objetivo) return

      const fondo = objetivo.closest<HTMLButtonElement>('button[data-vida-background-css]')
      if (fondo?.dataset.vidaBackgroundCss) {
        event.preventDefault()
        event.stopPropagation()
        aplicarCssPorTema(fondo.dataset.vidaBackgroundCss, fondo.dataset.vidaBackgroundText ?? '#FFFFFF')
        return
      }

      const subir = objetivo.closest<HTMLButtonElement>('button[data-vida-background-upload="true"]')
      if (subir) { event.preventDefault(); abrirImagenes(true); return }
      const biblioteca = objetivo.closest<HTMLButtonElement>('button[data-vida-background-library="true"]')
      if (biblioteca) { event.preventDefault(); abrirImagenes(false); return }

      const aplicarMezcla = objetivo.closest<HTMLButtonElement>('button[data-vida-gradient-apply="true"]')
      if (aplicarMezcla) {
        event.preventDefault()
        const raiz = panelActual()
        const a = raiz?.querySelector<HTMLInputElement>('[data-vida-gradient-a="true"]')?.value ?? '#2563EB'
        const b = raiz?.querySelector<HTMLInputElement>('[data-vida-gradient-b="true"]')?.value ?? '#7C3AED'
        const angulo = Number(raiz?.querySelector<HTMLInputElement>('[data-vida-gradient-angle="true"]')?.value ?? 135)
        aplicarCssPorTema(`linear-gradient(${Math.max(0,Math.min(360,angulo))}deg,${a},${b})`, contraste(a))
      }
    }

    const cambiarColorLibre = (event: Event) => {
      const input = event.target instanceof HTMLInputElement ? event.target : null
      if (!input?.matches('[data-vida-background-picker="true"]')) return
      aplicarCssPorTema(input.value, contraste(input.value))
    }

    const raiz = document.querySelector<HTMLElement>('.pastoral-editor-v4')
    const observador = raiz ? new MutationObserver(programarSincronizacion) : null
    if (raiz) observador?.observe(raiz, { childList: true, subtree: true })

    sincronizar()
    document.addEventListener('click', capturar, true)
    document.addEventListener('change', cambiarColorLibre, true)

    return () => {
      window.cancelAnimationFrame(frame)
      observador?.disconnect()
      observadorPanel?.disconnect()
      document.removeEventListener('click', capturar, true)
      document.removeEventListener('change', cambiarColorLibre, true)
    }
  }, [catalogo])

  return null
}
