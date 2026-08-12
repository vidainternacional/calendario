import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type LugarBiblicoBusqueda = {
  id: string
  name: string
  kind: string
  latitude: number | null
  longitude: number | null
  coordinatePrecision: string
  certainty: string
  provider: string | null
  sourceLocator: string | null
  matchedFrom: string
  score: number
  references: Array<{
    bookCode: string
    bookName: string
    chapter: number
    verse: number
    reference: string
  }>
}

export type SugerenciaLugarBiblico = {
  label: string
  query: string
  detail: string
  score: number
}

export type ResultadoBusquedaLugar =
  | { kind: 'place'; place: LugarBiblicoBusqueda }
  | { kind: 'suggestions'; suggestions: SugerenciaLugarBiblico[] }
  | null

const GENERIC_WORDS = new Set([
  'a', 'al', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'un', 'una', 'y',
  'isla', 'islas', 'ciudad', 'pueblo', 'aldea', 'region', 'zona', 'lugar',
  'monte', 'montana', 'rio', 'mar', 'lago', 'valle', 'desierto', 'tierra',
])

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function meaningful(value: string) {
  const normalized = normalize(value)
  const tokens = normalized.split(' ').filter(token => token && !GENERIC_WORDS.has(token))
  return tokens.join(' ') || normalized
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  const current = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j]
  }

  return previous[b.length]
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0
  const longest = Math.max(a.length, b.length)
  return longest === 0 ? 1 : 1 - (levenshtein(a, b) / longest)
}

function scoreName(rawQuery: string, rawName: string) {
  const query = meaningful(rawQuery)
  const name = meaningful(rawName)
  if (!query || !name) return 0
  if (query === name) return 1
  if (query.includes(name) || name.includes(query)) return 0.96

  const queryTokens = query.split(' ')
  const nameTokens = name.split(' ')
  let score = similarity(query, name)

  for (const queryToken of queryTokens) {
    for (const nameToken of nameTokens) {
      if (queryToken === nameToken) score = Math.max(score, 0.98)
      else if (queryToken.length >= 4 && nameToken.length >= 4) {
        score = Math.max(score, similarity(queryToken, nameToken))
      }
    }
  }

  return score
}

export async function buscarLugarBiblico(rawQuery: string): Promise<ResultadoBusquedaLugar> {
  const query = rawQuery.trim()
  if (!query || query.length > 180) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: places, error: placesError } = await (supabase as any)
    .from('biblical_places')
    .select('id, canonical_name_es, alternate_names, place_kind, latitude, longitude, coordinate_precision, certainty_level, external_provider, source_locator')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .limit(1500)

  if (placesError) {
    console.error('[biblical-place-search] No se pudieron cargar lugares:', placesError)
    return null
  }

  const ranked = (places ?? [])
    .map((place: any) => {
      const names = [place.canonical_name_es, ...(place.alternate_names ?? [])].filter(Boolean)
      let bestScore = 0
      let matchedFrom = place.canonical_name_es
      for (const name of names) {
        const score = scoreName(query, String(name))
        if (score > bestScore) {
          bestScore = score
          matchedFrom = String(name)
        }
      }
      return { place, score: bestScore, matchedFrom }
    })
    .filter((candidate: any) => candidate.score >= 0.62)
    .sort((a: any, b: any) => b.score - a.score || String(a.place.canonical_name_es).localeCompare(String(b.place.canonical_name_es), 'es'))
    .slice(0, 5)

  if (ranked.length === 0) return null

  const candidateIds = ranked.map((candidate: any) => candidate.place.id)
  const { data: refs, error: refsError } = await (supabase as any)
    .from('biblical_place_references')
    .select('place_id, book_code, chapter, verse')
    .in('place_id', candidateIds)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .limit(120)

  if (refsError) {
    console.error('[biblical-place-search] No se pudieron cargar referencias:', refsError)
    return null
  }

  const bookCodes = Array.from(new Set((refs ?? []).map((row: any) => row.book_code)))
  const { data: books, error: booksError } = bookCodes.length
    ? await (supabase as any)
        .from('biblical_books')
        .select('code, name_es, canonical_order')
        .in('code', bookCodes)
        .eq('enabled', true)
        .eq('review_status', 'approved')
    : { data: [], error: null }

  if (booksError) {
    console.error('[biblical-place-search] No se pudieron resolver libros:', booksError)
    return null
  }

  const booksByCode = new Map((books ?? []).map((book: any) => [book.code, book]))
  const refsByPlace = new Map<string, any[]>()
  for (const row of refs ?? []) {
    const current = refsByPlace.get(row.place_id) ?? []
    current.push(row)
    refsByPlace.set(row.place_id, current)
  }

  const buildReferences = (placeId: string) => (refsByPlace.get(placeId) ?? [])
    .map((row: any) => {
      const book = booksByCode.get(row.book_code) as any
      const bookName = book?.name_es ?? row.book_code
      return {
        bookCode: row.book_code,
        bookName,
        chapter: Number(row.chapter),
        verse: Number(row.verse),
        reference: `${bookName} ${row.chapter}:${row.verse}`,
        canonicalOrder: Number(book?.canonical_order ?? 999),
      }
    })
    .sort((a: any, b: any) => a.canonicalOrder - b.canonicalOrder || a.chapter - b.chapter || a.verse - b.verse)
    .filter((row: any, index: number, all: any[]) => index === all.findIndex(other => other.reference === row.reference))
    .slice(0, 24)
    .map(({ canonicalOrder: _canonicalOrder, ...row }: any) => row)

  const best = ranked[0]
  const runnerUp = ranked[1]
  const bestReferences = buildReferences(best.place.id)
  const confident = best.score >= 0.82 && (best.score >= 0.96 || !runnerUp || best.score - runnerUp.score >= 0.06)

  if (confident && bestReferences.length > 0) {
    return {
      kind: 'place',
      place: {
        id: best.place.id,
        name: best.place.canonical_name_es,
        kind: best.place.place_kind,
        latitude: best.place.latitude == null ? null : Number(best.place.latitude),
        longitude: best.place.longitude == null ? null : Number(best.place.longitude),
        coordinatePrecision: best.place.coordinate_precision,
        certainty: best.place.certainty_level,
        provider: best.place.external_provider,
        sourceLocator: best.place.source_locator,
        matchedFrom: best.matchedFrom,
        score: best.score,
        references: bestReferences,
      },
    }
  }

  const suggestions: SugerenciaLugarBiblico[] = ranked.flatMap((candidate: any) => {
    const references = buildReferences(candidate.place.id)
    const firstReference = references[0]
    if (!firstReference) return []
    return [{
      label: candidate.place.canonical_name_es,
      query: candidate.place.canonical_name_es,
      detail: `Lugar bíblico · ${firstReference.reference}`,
      score: candidate.score,
    }]
  }).slice(0, 4)

  return suggestions.length > 0 ? { kind: 'suggestions', suggestions } : null
}
