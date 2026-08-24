import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { HebrewLearningWord, HebrewWordCatalogPage } from '@/lib/hebreo/word-catalog'

type LexicalIdentityRow = {
  id: string
  lexical_id: string
}

const HEBREW_LETTER = /[\u05D0-\u05EA]/
const HEBREW_NIQQUD = /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/
const CANTILLATION_AND_ORTHOGRAPHIC_MARKS = /[\u0591-\u05AF\u05BD\u05BF\u05C4\u05C5]/g

function consonantalForm(value: string) {
  return Array.from(value.normalize('NFD'))
    .filter(character => HEBREW_LETTER.test(character))
    .join('')
}

function pointedForm(value: string) {
  return value.normalize('NFD').replace(CANTILLATION_AND_ORTHOGRAPHIC_MARKS, '').replace(/\s+/g, '')
}

function ambiguityNote({
  item,
  search,
  occurrences,
  primary,
  pointedMatch,
}: {
  item: HebrewLearningWord
  search: string
  occurrences: number
  primary: boolean
  pointedMatch: boolean
}) {
  const evidence = `${occurrences.toLocaleString('es-SV')} ocurrencia${occurrences === 1 ? '' : 's'} aprobada${occurrences === 1 ? '' : 's'}`
  const identity = item.strongNumber ? `Strong ${item.strongNumber}` : item.lexicalId

  if (primary) {
    return pointedMatch
      ? `Resultado principal para «${search}»: coincide con la vocalización buscada y se conserva como primera opción (${identity}; ${evidence}). Las demás entradas con las mismas consonantes permanecen visibles como alternativas reales.`
      : `Resultado principal para la escritura consonántica «${search}», priorizado por frecuencia en el corpus aprobado (${identity}; ${evidence}). Las demás entradas con las mismas consonantes permanecen visibles como alternativas reales.`
  }

  return `Alternativa real para la misma escritura consonántica «${consonantalForm(search)}» (${identity}; ${evidence}). La vocalización y el contexto determinan qué entrada corresponde; VIDA no infiere una raíz ni fusiona homógrafos distintos.`
}

export async function priorizarAmbiguedadHebrea(
  page: HebrewWordCatalogPage,
): Promise<HebrewWordCatalogPage> {
  if (page.status !== 'ok' || page.items.length < 2 || !/\p{Script=Hebrew}/u.test(page.search)) return page

  const consonants = consonantalForm(page.search)
  if (!consonants) return page

  const candidates = page.items.filter(item => consonantalForm(item.lemma) === consonants)
  if (candidates.length < 2 || candidates.length > 24) return page

  const supabase = await createClient()
  const { data: identities, error: identityError } = await (supabase as any)
    .from('biblical_lexical_entries')
    .select('id, lexical_id')
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .in('lexical_id', candidates.map(item => item.lexicalId))

  if (identityError) {
    console.error('[hebrew-ambiguity] No se pudieron resolver identidades léxicas:', identityError)
    return page
  }

  const rows = (identities ?? []) as LexicalIdentityRow[]
  const uuidByLexicalId = new Map(rows.map(row => [row.lexical_id, row.id]))

  const counts = await Promise.all(candidates.map(async item => {
    const lexicalEntryId = uuidByLexicalId.get(item.lexicalId)
    if (!lexicalEntryId) return [item.lexicalId, 0] as const

    const { count, error } = await (supabase as any)
      .from('biblical_word_occurrences')
      .select('id', { count: 'exact', head: true })
      .eq('lexical_entry_id', lexicalEntryId)
      .eq('enabled', true)
      .eq('review_status', 'approved')

    if (error) {
      console.error('[hebrew-ambiguity] No se pudo contar evidencia de ocurrencias:', error)
      return [item.lexicalId, 0] as const
    }

    return [item.lexicalId, count ?? 0] as const
  }))

  const occurrenceCount = new Map<string, number>(counts)
  const originalPosition = new Map(page.items.map((item, index) => [item.lexicalId, index]))
  const searchHasNiqqud = HEBREW_NIQQUD.test(page.search.normalize('NFD'))
  const requestedPointing = searchHasNiqqud ? pointedForm(page.search) : null

  const ranked = [...candidates].sort((a, b) => {
    if (requestedPointing) {
      const aExact = pointedForm(a.lemma) === requestedPointing ? 1 : 0
      const bExact = pointedForm(b.lemma) === requestedPointing ? 1 : 0
      if (aExact !== bExact) return bExact - aExact
    }

    const frequencyDiff = (occurrenceCount.get(b.lexicalId) ?? 0) - (occurrenceCount.get(a.lexicalId) ?? 0)
    if (frequencyDiff !== 0) return frequencyDiff
    return (originalPosition.get(a.lexicalId) ?? 999) - (originalPosition.get(b.lexicalId) ?? 999)
  })

  const rankedIds = new Set(ranked.map(item => item.lexicalId))
  const annotated = ranked.map((item, index) => {
    const pointedMatch = Boolean(requestedPointing && pointedForm(item.lemma) === requestedPointing)
    const note = ambiguityNote({
      item,
      search: page.search,
      occurrences: occurrenceCount.get(item.lexicalId) ?? 0,
      primary: index === 0,
      pointedMatch,
    })

    return {
      ...item,
      meaningNoteEs: [item.meaningNoteEs, note].filter(Boolean).join(' '),
    }
  })

  return {
    ...page,
    items: [...annotated, ...page.items.filter(item => !rankedIds.has(item.lexicalId))],
  }
}
