'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function referenciaActual() {
  const libro = document.querySelector<HTMLSelectElement>('select[aria-label="Libro de la Biblia"]')
  const capitulo = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
  const versiculo = document.querySelector<HTMLSelectElement>('select[aria-label="Versículo"]')

  const nombreLibro = libro?.selectedOptions[0]?.textContent?.trim() ?? ''
  const numeroCapitulo = capitulo?.value?.trim() ?? ''
  const numeroVersiculo = versiculo?.value?.trim() ?? ''

  if (!nombreLibro || !numeroCapitulo) return null
  return `${nombreLibro} ${numeroCapitulo}${numeroVersiculo ? `:${numeroVersiculo}` : ''}`
}

function hrefEstudio(referencia: string) {
  return `/estudios/profundo?pasaje=${encodeURIComponent(referencia)}&auto=1&from=biblia`
}

export default function BibliaDeepStudyEnhancer() {
  const router = useRouter()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return

      const directLink = target.closest<HTMLAnchorElement>('a[href*="/estudios/profundo?pasaje="]')
      if (directLink) {
        const url = new URL(directLink.href, window.location.origin)
        const referencia = (url.searchParams.get('pasaje') ?? '').split(' — ')[0]?.trim()
        if (!referencia) return

        event.preventDefault()
        event.stopPropagation()
        router.push(hrefEstudio(referencia))
        return
      }

      const button = target.closest<HTMLButtonElement>('button')
      if (!button || button.textContent?.trim() !== 'Estudio') return

      const siblings = Array.from(button.parentElement?.children ?? [])
        .filter((element): element is HTMLButtonElement => element instanceof HTMLButtonElement)
        .map(element => element.textContent?.trim())

      if (!['Leer', 'Estudio', 'Comparar', 'Notas'].every(label => siblings.includes(label))) return

      const referencia = referenciaActual()
      if (!referencia) return

      event.preventDefault()
      event.stopPropagation()
      router.push(hrefEstudio(referencia))
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [router])

  return null
}
