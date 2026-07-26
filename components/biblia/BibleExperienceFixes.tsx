'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const PREF_KEY = 'vida-biblia-preferencias'
type ModoBiblia = 'claro' | 'sepia' | 'oscuro'

function textoNormalizado(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function leerTema(): ModoBiblia {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    const modo = raw ? JSON.parse(raw)?.modo : 'claro'
    return ['claro', 'sepia', 'oscuro'].includes(modo) ? modo : 'claro'
  } catch { return 'claro' }
}

function dispararCambioTema(modo: ModoBiblia) {
  document.documentElement.dataset.bibliaTema = modo
  document.body.dataset.bibliaTema = modo
  window.dispatchEvent(new CustomEvent('vida-biblia-theme', { detail: { modo } }))
}

function estiloPanelVoz(panel: HTMLElement, modo: ModoBiblia) {
  const clases = modo === 'oscuro'
    ? 'mx-auto mb-5 max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-2 text-white shadow-xl'
    : modo === 'sepia'
      ? 'mx-auto mb-5 max-w-sm rounded-2xl border border-[#cdb991] bg-[#fff8e8] p-2 text-[#382d21] shadow-xl'
      : 'mx-auto mb-5 max-w-sm rounded-2xl border border-violet-200 bg-white p-2 text-slate-800 shadow-xl'
  panel.className = clases
}

export default function BibleExperienceFixes() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname.startsWith('/biblia')) return
    let temaAnterior: ModoBiblia | null = null
    const sincronizarTema = () => {
      const modo = leerTema()
      if (modo !== temaAnterior) {
        temaAnterior = modo
        dispararCambioTema(modo)
        const panel = document.querySelector<HTMLElement>('[data-vida-voice-picker]')
        if (panel) estiloPanelVoz(panel, modo)
      }
    }
    sincronizarTema()
    const themeTimer = window.setInterval(sincronizarTema, 250)
    return () => window.clearInterval(themeTimer)
  }, [pathname])

  useEffect(() => {
    if (pathname !== '/biblia') return
    let intentos = 0
    const maxIntentos = 80

    const mejorar = () => {
      intentos += 1
      const modo = leerTema()

      document.querySelectorAll<HTMLElement>('body *').forEach((elemento) => {
        const texto = textoNormalizado(elemento.textContent)
        if (!/^(voz:\s*)?(m[oó]nica|paulina)$/i.test(texto)) return
        const estilo = window.getComputedStyle(elemento)
        const flotante = estilo.position === 'fixed' || estilo.position === 'sticky'
        if (flotante || elemento.closest('[class*="fixed"], [class*="bottom-"]')) {
          const contenedor = elemento.closest<HTMLElement>('[class*="fixed"], [class*="bottom-"]') ?? elemento
          contenedor.style.setProperty('display', 'none', 'important')
          contenedor.setAttribute('aria-hidden', 'true')
        }
      })

      const botones = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      const botonNotas = botones.find((boton) => textoNormalizado(boton.textContent) === 'Notas')
      if (botonNotas && botonNotas.dataset.vidaNotasReady !== 'true') {
        botonNotas.dataset.vidaNotasReady = 'true'
        botonNotas.addEventListener('click', (event) => {
          event.preventDefault(); event.stopImmediatePropagation(); router.push('/biblia/notas')
        }, { capture: true })
      }

      const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
      const versionPrincipal = selects.find((select) => /versi[oó]n de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
      if (versionPrincipal) {
        const grupoPrincipal = versionPrincipal.parentElement
        if (grupoPrincipal) {
          grupoPrincipal.style.maxWidth = '760px'
          grupoPrincipal.style.width = '100%'
          grupoPrincipal.classList.add('gap-2.5')
        }
        selects.slice(0, 4).forEach((select) => {
          select.style.minHeight = '44px'
          select.style.paddingInline = '10px'
          select.style.fontSize = '12px'
        })
      }

      const catalogo = new Map<string, string>()
      if (versionPrincipal) Array.from(versionPrincipal.options).forEach((option) => {
        const nombre = textoNormalizado(option.textContent)
        catalogo.set(option.value, nombre)
        const abreviatura = nombre.match(/\(([^)]+)\)$/)?.[1]
        if (abreviatura) catalogo.set(abreviatura.toUpperCase(), nombre)
      })

      const compararActivo = botones.some((boton) => textoNormalizado(boton.textContent) === 'Comparar' && boton.className.includes('bg-violet-600'))
      if (compararActivo && versionPrincipal) {
        const selectorSecundario = selects.find((select) => select !== versionPrincipal && Array.from(select.options).some((option) => catalogo.has(option.value)))
        if (selectorSecundario) {
          Array.from(selectorSecundario.options).forEach((option) => { const n = catalogo.get(option.value); if (n) option.textContent = n })
          selectorSecundario.setAttribute('aria-label', 'Biblia 2 para comparar')
          selectorSecundario.title = catalogo.get(selectorSecundario.value) ?? 'Biblia 2'
          const zonaComparar = selectorSecundario.closest<HTMLElement>('div.p-5, div.sm\:p-7, section') ?? selectorSecundario.parentElement
          if (zonaComparar && !zonaComparar.querySelector('[data-vida-dual-selector]')) {
            const bloque = document.createElement('div')
            bloque.dataset.vidaDualSelector = 'true'
            bloque.className = modo === 'oscuro'
              ? 'mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-700 bg-gradient-to-r from-violet-950/70 to-indigo-950/70 p-3'
              : modo === 'sepia'
                ? 'mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-[#cdb991] bg-gradient-to-r from-[#f3e3c2] to-[#ead6af] p-3'
                : 'mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-3'

            const crearCampo = (titulo: string, select: HTMLSelectElement) => {
              const label = document.createElement('label')
              label.className = 'min-w-0'
              const span = document.createElement('span')
              span.className = 'mb-1 block text-[11px] font-bold uppercase tracking-wide'
              span.textContent = titulo
              const copia = select.cloneNode(true) as HTMLSelectElement
              copia.className = modo === 'oscuro'
                ? 'min-h-11 w-full min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-2 text-xs font-semibold text-white'
                : modo === 'sepia'
                  ? 'min-h-11 w-full min-w-0 rounded-xl border border-[#cdb991] bg-[#fff8e8] px-2 text-xs font-semibold text-[#382d21]'
                  : 'min-h-11 w-full min-w-0 rounded-xl border border-violet-200 bg-white px-2 text-xs font-semibold text-slate-800'
              copia.addEventListener('change', () => {
                const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
                setter?.call(select, copia.value)
                select.dispatchEvent(new Event('change', { bubbles: true }))
              })
              label.append(span, copia)
              return label
            }
            bloque.append(crearCampo('Biblia 1', versionPrincipal), crearCampo('Biblia 2', selectorSecundario))
            zonaComparar.prepend(bloque)
            selectorSecundario.closest<HTMLElement>('label')?.style.setProperty('display', 'none')
          }
        }

        document.querySelectorAll<HTMLElement>('article').forEach((article) => {
          const supers = article.querySelectorAll('sup')
          if (!supers.length) return
          const numero = textoNormalizado(supers[0].textContent)
          const columnas = Array.from(article.children).filter((e) => e instanceof HTMLElement && e.tagName === 'DIV') as HTMLElement[]
          if (columnas[0] && !columnas[0].dataset.vidaTone) { columnas[0].dataset.vidaTone = '1'; columnas[0].className += ' rounded-2xl bg-gradient-to-br from-violet-50/80 to-violet-100/50 p-3 dark:from-violet-950/50 dark:to-violet-900/30' }
          if (columnas[1] && !columnas[1].dataset.vidaTone) { columnas[1].dataset.vidaTone = '2'; columnas[1].className += ' rounded-2xl bg-gradient-to-br from-indigo-50/80 to-sky-100/50 p-3 dark:from-indigo-950/50 dark:to-sky-900/30' }
          article.querySelectorAll<HTMLElement>('p, span').forEach((label) => {
            const texto = textoNormalizado(label.textContent)
            if (!texto || texto.length > 24) return
            const completo = catalogo.get(texto) ?? catalogo.get(texto.toUpperCase())
            if (completo && completo !== texto) { label.textContent = completo; label.title = completo; label.classList.remove('truncate') }
          })
          if (numero && !article.querySelector('[data-vida-comparison-reference]')) {
            const referencia = document.querySelector<HTMLElement>('h2')?.textContent?.trim()
            if (!referencia) return
            const etiqueta = document.createElement('p')
            etiqueta.dataset.vidaComparisonReference = 'true'
            etiqueta.className = 'col-span-full mb-1 text-center text-[11px] font-bold opacity-65'
            etiqueta.textContent = `${referencia}:${numero} · mismo versículo en dos Biblias`
            article.prepend(etiqueta)
          }
        })
      }

      const botonVoz = botones.find((boton) => /cambiar voz|voz\./i.test(boton.getAttribute('aria-label') ?? ''))
      if (botonVoz && botonVoz.dataset.vidaVoiceMenu !== 'true') {
        botonVoz.dataset.vidaVoiceMenu = 'true'
        botonVoz.setAttribute('aria-haspopup', 'listbox')
        botonVoz.addEventListener('click', (event) => {
          if (botonVoz.dataset.vidaCycling === 'true') return
          event.preventDefault(); event.stopImmediatePropagation()
          const existente = document.querySelector<HTMLElement>('[data-vida-voice-picker]')
          if (existente) { existente.remove(); return }
          const todas = window.speechSynthesis?.getVoices().filter((voz) => voz.lang.toLowerCase().startsWith('es')) ?? []
          const preferidas = todas.filter((voz) => /m[oó]nica|monica|paulina/i.test(voz.name))
          const opciones = (preferidas.length >= 2 ? preferidas : todas).slice(0, Math.max(2, Math.min(5, todas.length)))
          if (!opciones.length) return
          const panel = document.createElement('div')
          panel.dataset.vidaVoicePicker = 'true'; panel.setAttribute('role', 'listbox'); estiloPanelVoz(panel, leerTema())
          const titulo = document.createElement('p')
          titulo.className = 'px-2 pb-2 text-xs font-bold text-violet-500'; titulo.textContent = 'Seleccione una voz'
          panel.append(titulo)
          opciones.forEach((voz) => {
            const opcion = document.createElement('button')
            opcion.type = 'button'
            opcion.className = leerTema() === 'oscuro' ? 'flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm hover:bg-slate-800' : leerTema() === 'sepia' ? 'flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm hover:bg-[#ead9b5]' : 'flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm hover:bg-violet-50'
            const nombre = document.createElement('span'); nombre.innerHTML = `<strong>${voz.name}</strong><small class="ml-2 opacity-60">${voz.lang}</small>`
            const marca = document.createElement('span'); marca.textContent = '◉'
            opcion.append(nombre, marca)
            opcion.addEventListener('click', () => {
              let pasos = 0
              const avanzar = () => {
                const actual = botonVoz.title || botonVoz.getAttribute('aria-label') || ''
                if (actual.includes(voz.name) || pasos > todas.length + 2) { panel.remove(); return }
                pasos += 1; botonVoz.dataset.vidaCycling = 'true'; botonVoz.click(); botonVoz.dataset.vidaCycling = 'false'; window.setTimeout(avanzar, 80)
              }
              avanzar()
            })
            panel.append(opcion)
          })
          botonVoz.parentElement?.insertAdjacentElement('afterend', panel)
        }, { capture: true })
      }

      if (intentos >= maxIntentos) window.clearInterval(timer)
    }

    mejorar()
    const timer = window.setInterval(mejorar, 300)
    return () => window.clearInterval(timer)
  }, [pathname, router])

  return null
}
