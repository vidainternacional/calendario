'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

type TraduccionApi = {
  id: string
  name?: string
  shortName?: string
  language?: string
  languageName?: string
  languageEnglishName?: string
}

const API = 'https://bible.helloao.org/api/available_translations.json'

export default function BibleSelectorPolish() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/biblia' && !pathname.startsWith('/pastoral/paquetes/')) return

    let cancelado = false
    let traducciones = new Map<string, TraduccionApi>()

    const mejorarSelectores = () => {
      const selects = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
      const grupos = selects
        .map((select) => select.parentElement)
        .filter((parent): parent is HTMLElement => Boolean(parent))
        .filter((parent, index, parents) => parents.indexOf(parent) === index)
        .filter((parent) => parent.querySelectorAll('select').length === 3)

      grupos.forEach((grupo) => {
        const [version, libro, capitulo] = Array.from(grupo.querySelectorAll<HTMLSelectElement>('select'))
        if (!version || !libro || !capitulo) return
        if (!Array.from(capitulo.options).every((option) => /^\d+$/.test(option.value))) return
        if (grupo.dataset.bibleSelectorPolished === 'true' && traducciones.size === 0) return

        grupo.dataset.bibleSelectorPolished = 'true'
        grupo.className = 'grid grid-cols-1 gap-2 sm:grid-cols-[minmax(270px,1.5fr)_minmax(170px,1fr)_minmax(160px,.75fr)]'

        version.setAttribute('aria-label', 'Versión de la Biblia')
        version.setAttribute('title', 'Versión de la Biblia')
        version.classList.add('w-full')

        libro.setAttribute('aria-label', 'Libro de la Biblia')
        libro.setAttribute('title', 'Libro de la Biblia')
        libro.classList.add('w-full')

        capitulo.setAttribute('aria-label', 'Capítulo')
        capitulo.setAttribute('title', 'Capítulo')
        capitulo.classList.add('w-full')

        Array.from(version.options).forEach((option) => {
          const item = traducciones.get(option.value)
          if (!item?.name) return
          option.textContent = item.shortName && item.shortName !== item.name
            ? `${item.name} (${item.shortName})`
            : item.name
        })

        Array.from(capitulo.options).forEach((option) => {
          const numero = option.value
          option.textContent = `Capítulo ${numero}`
        })
      })
    }

    mejorarSelectores()
    const observer = new MutationObserver(mejorarSelectores)
    observer.observe(document.body, { childList: true, subtree: true })

    fetch(API)
      .then((response) => response.json())
      .then((data) => {
        if (cancelado) return
        const lista = (data.translations ?? []) as TraduccionApi[]
        traducciones = new Map(lista.map((item) => [item.id, item]))
        mejorarSelectores()
      })
      .catch(() => {})

    return () => {
      cancelado = true
      observer.disconnect()
    }
  }, [pathname])

  return null
}
