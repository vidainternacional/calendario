'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

type TraduccionApi = {
  id: string
  name?: string
  shortName?: string
  englishName?: string
  language?: string
}

const API = 'https://bible.helloao.org/api/available_translations.json'
const POS_KEY = 'vida-biblia-posicion'
const MAX_INTENTOS = 24

function esReinaValera1909(item?: TraduccionApi) {
  if (!item) return false
  const texto = `${item.id} ${item.name ?? ''} ${item.shortName ?? ''} ${item.englishName ?? ''}`.toLowerCase()
  return texto.includes('1909') || texto.includes('rv09') || texto.includes('rv1909')
}

export default function BibleSelectorPolish() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/biblia' && !pathname.startsWith('/pastoral/paquetes/')) return

    let cancelado = false
    let intento = 0
    let traducciones = new Map<string, TraduccionApi>()

    const mejorarSelectores = () => {
      const grupos = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
        .map((select) => select.parentElement)
        .filter((parent): parent is HTMLElement => Boolean(parent))
        .filter((parent, index, parents) => parents.indexOf(parent) === index)
        .filter((parent) => parent.querySelectorAll('select').length === 3)

      let encontrado = false

      grupos.forEach((grupo) => {
        const [version, libro, capitulo] = Array.from(grupo.querySelectorAll<HTMLSelectElement>('select'))
        if (!version || !libro || !capitulo) return
        if (!Array.from(capitulo.options).every((option) => /^\d+$/.test(option.value))) return

        encontrado = true
        grupo.className = 'grid grid-cols-1 gap-2 sm:grid-cols-[minmax(270px,1.5fr)_minmax(170px,1fr)_minmax(160px,.75fr)]'

        version.setAttribute('aria-label', 'Versión de la Biblia')
        version.setAttribute('title', 'Versión de la Biblia')
        version.classList.add('w-full')

        libro.setAttribute('aria-label', 'Libro de la Biblia')
        libro.setAttribute('title', 'Libro de la Biblia')
        libro.classList.add('w-full')

        capitulo.setAttribute('aria-label', 'Capítulo de la Biblia')
        capitulo.setAttribute('title', 'Capítulo de la Biblia')
        capitulo.classList.add('w-full')

        Array.from(version.options).forEach((option) => {
          const item = traducciones.get(option.value)
          if (!item?.name) return
          option.textContent = item.shortName && item.shortName !== item.name
            ? `${item.name} (${item.shortName})`
            : item.name
        })

        Array.from(capitulo.options).forEach((option) => {
          option.textContent = `Capítulo ${option.value}`
        })

        let posicionGuardada: { trad?: string } | null = null
        try {
          const raw = localStorage.getItem(POS_KEY)
          posicionGuardada = raw ? JSON.parse(raw) as { trad?: string } : null
        } catch {}

        if (!posicionGuardada?.trad && grupo.dataset.rv1909Selected !== 'true') {
          const rv1909 = Array.from(version.options).find((option) => esReinaValera1909(traducciones.get(option.value)))
          if (rv1909 && version.value !== rv1909.value) {
            version.value = rv1909.value
            version.dispatchEvent(new Event('change', { bubbles: true }))
          }
          if (rv1909) grupo.dataset.rv1909Selected = 'true'
        }
      })

      return encontrado
    }

    fetch(API)
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar el catálogo bíblico')
        return response.json()
      })
      .then((data) => {
        if (cancelado) return
        const lista = (data.translations ?? []) as TraduccionApi[]
        traducciones = new Map(lista.map((item) => [item.id, item]))
      })
      .catch(() => {})
      .finally(() => {
        if (cancelado) return
        const timer = window.setInterval(() => {
          intento += 1
          const listo = mejorarSelectores()
          if (listo || intento >= MAX_INTENTOS) window.clearInterval(timer)
        }, 250)
        mejorarSelectores()
      })

    return () => {
      cancelado = true
    }
  }, [pathname])

  return null
}
