import type { HebrewWordCatalogPage } from '@/lib/hebreo/word-catalog'

const CONTEXTUAL_LABEL = /^Relacionado con «.+»$/
const CONTEXTUAL_NOTE = /^Resultado contextual principal:/
const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g

function visibleKey(item: HebrewWordCatalogPage['items'][number]) {
  const hebrew = item.lemma.normalize('NFD').replace(HEBREW_MARKS, '').normalize('NFC').trim()
  const spanish = (item.spanish ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()
  return `${hebrew}::${spanish}`
}

/**
 * La búsqueda contextual sirve para descubrir una entrada, no para definirla.
 * Además, el diccionario pedagógico no repite fichas visualmente equivalentes:
 * conserva la primera identidad léxica como representante sin alterar la base.
 */
export function limpiarPresentacionPedagogica(
  page: HebrewWordCatalogPage,
): HebrewWordCatalogPage {
  if (page.status !== 'ok') return page

  const cleaned = page.items.map(item => {
    const contextualLabel = Boolean(item.spanish && CONTEXTUAL_LABEL.test(item.spanish))
    const contextualNote = Boolean(item.meaningNoteEs && CONTEXTUAL_NOTE.test(item.meaningNoteEs))

    if (!contextualLabel && !contextualNote) return item

    return {
      ...item,
      spanish: contextualLabel ? null : item.spanish,
      meaningNoteEs: contextualNote ? null : item.meaningNoteEs,
    }
  })

  const seen = new Set<string>()
  const items = cleaned.filter(item => {
    const key = visibleKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { ...page, items }
}
