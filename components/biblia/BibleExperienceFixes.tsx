'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

function textoNormalizado(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export default function BibleExperienceFixes() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname !== '/biblia') return

    let intentos = 0
    const maxIntentos = 24

    const mejorar = () => {
      intentos += 1

      // Elimina cualquier control flotante de voz heredado sin tocar
      // el nuevo botón circular de voz, que no contiene una etiqueta visible.
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
          event.preventDefault()
          event.stopImmediatePropagation()
          router.push('/biblia/notas')
        }, { capture: true })
      }

      // Obtiene el catálogo visible de traducciones para sustituir abreviaturas
      // dentro de Comparar por nombres comprensibles.
      const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
      const versiones = selects.find((select) => /versi[oó]n de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
      const catalogo = new Map<string, string>()
      if (versiones) {
        Array.from(versiones.options).forEach((option) => {
          catalogo.set(option.value, textoNormalizado(option.textContent))
          const abreviatura = textoNormalizado(option.textContent).match(/\(([^)]+)\)$/)?.[1]
          if (abreviatura) catalogo.set(abreviatura.toUpperCase(), textoNormalizado(option.textContent))
        })
      }

      const compararActivo = botones.some((boton) => textoNormalizado(boton.textContent) === 'Comparar' && boton.className.includes('bg-violet-600'))
      if (compararActivo) {
        document.querySelectorAll<HTMLElement>('article p, article span').forEach((label) => {
          const texto = textoNormalizado(label.textContent)
          if (!texto || texto.length > 18) return
          const completo = catalogo.get(texto) ?? catalogo.get(texto.toUpperCase())
          if (!completo || completo === texto) return
          label.textContent = completo
          label.setAttribute('title', completo)
          label.classList.remove('truncate')
        })

        document.querySelectorAll<HTMLElement>('article').forEach((article) => {
          const supers = article.querySelectorAll('sup')
          if (!supers.length) return
          const numero = textoNormalizado(supers[0].textContent)
          if (!numero || article.querySelector('[data-vida-comparison-reference]')) return
          const referencia = document.querySelector<HTMLElement>('h2')?.textContent?.trim()
          if (!referencia) return
          const etiqueta = document.createElement('p')
          etiqueta.dataset.vidaComparisonReference = 'true'
          etiqueta.className = 'col-span-full mb-1 text-center text-[11px] font-bold text-slate-500'
          etiqueta.textContent = `${referencia}:${numero} · Comparación del mismo versículo`
          article.prepend(etiqueta)
        })
      }

      if (intentos >= maxIntentos) window.clearInterval(timer)
    }

    mejorar()
    const timer = window.setInterval(mejorar, 350)
    return () => window.clearInterval(timer)
  }, [pathname, router])

  return null
}
