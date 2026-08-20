import type { HebrewWordCatalogPage } from '@/lib/hebreo/word-catalog'

const CONTEXTUAL_LABEL = /^Relacionado con «.+»$/
const CONTEXTUAL_NOTE = /^Resultado contextual principal:/

/**
 * La búsqueda contextual sirve para descubrir una entrada, no para definirla.
 * Nunca exponemos una co-ocurrencia como traducción ni texto técnico del resolver
 * dentro de una ficha pedagógica. Si aún no existe glosa aprobada, la UI conserva
 * el estado "Español pendiente" que ya usa el catálogo.
 */
export function limpiarPresentacionPedagogica(
  page: HebrewWordCatalogPage,
): HebrewWordCatalogPage {
  if (page.status !== 'ok') return page

  return {
    ...page,
    items: page.items.map(item => {
      const contextualLabel = Boolean(item.spanish && CONTEXTUAL_LABEL.test(item.spanish))
      const contextualNote = Boolean(item.meaningNoteEs && CONTEXTUAL_NOTE.test(item.meaningNoteEs))

      if (!contextualLabel && !contextualNote) return item

      return {
        ...item,
        spanish: contextualLabel ? null : item.spanish,
        meaningNoteEs: contextualNote ? null : item.meaningNoteEs,
      }
    }),
  }
}
