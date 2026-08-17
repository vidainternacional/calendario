'use client'

import { useEffect } from 'react'

function numeroPositivo(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizar(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function dispararCambio(select: HTMLSelectElement, value: string) {
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

async function esperarHasta<T>(resolver: () => T | null, timeout = 6000): Promise<T | null> {
  const inicio = Date.now()
  while (Date.now() - inicio < timeout) {
    const resultado = resolver()
    if (resultado) return resultado
    await new Promise(resolve => window.setTimeout(resolve, 60))
  }
  return null
}

export default function BibliaDeepLinkNavigation() {
  useEffect(() => {
    let cancelado = false

    const navegar = async () => {
      const params = new URLSearchParams(window.location.search)
      const book = params.get('book')?.trim() ?? ''
      const chapter = numeroPositivo(params.get('chapter'))
      const verse = numeroPositivo(params.get('verse'))
      if (!book || !chapter) return

      const bookSelect = await esperarHasta(() => {
        const select = document.querySelector<HTMLSelectElement>('select[aria-label="Libro de la Biblia"]')
        return select && select.options.length > 0 ? select : null
      })
      if (!bookSelect || cancelado) return

      const objetivo = normalizar(book)
      const bookOption = Array.from(bookSelect.options).find(option => option.value.toLowerCase() === book.toLowerCase())
        ?? Array.from(bookSelect.options).find(option => normalizar(option.textContent ?? '') === objetivo)
      if (!bookOption) return

      const previousVerseNode = verse ? document.getElementById(`versiculo-${verse}`) : null
      const bookChanged = bookSelect.value !== bookOption.value
      if (bookChanged) dispararCambio(bookSelect, bookOption.value)

      const chapterOption = await esperarHasta(() => {
        const select = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
        if (!select) return null
        return Array.from(select.options).find(option => Number(option.value) === chapter) ?? null
      })
      const chapterSelect = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
      if (!chapterOption || !chapterSelect || cancelado) return

      const chapterChanged = Number(chapterSelect.value) !== chapter
      if (chapterChanged) dispararCambio(chapterSelect, String(chapter))

      if (!verse || cancelado) return

      if ((bookChanged || chapterChanged) && previousVerseNode) {
        await esperarHasta(() => previousVerseNode.isConnected ? null : true)
      }

      const verseSelect = await esperarHasta(() => {
        const select = document.querySelector<HTMLSelectElement>('select[aria-label="Versículo"]')
        const verseNode = document.getElementById(`versiculo-${verse}`)
        if (!select || select.disabled || !verseNode) return null
        return Array.from(select.options).some(option => Number(option.value) === verse) ? select : null
      }, 8000)
      if (!verseSelect || cancelado) return

      dispararCambio(verseSelect, String(verse))
    }

    void navegar()
    return () => { cancelado = true }
  }, [])

  return null
}
