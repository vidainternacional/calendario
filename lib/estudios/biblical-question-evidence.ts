import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/neon/biblical-client'
import { normalizeBiblicalSearchQuery, tokenizeBiblicalSearchQuery } from './biblical-search-ranking'
import { readStudyScripture } from './study-scripture'
import type { BiblicalQuestionSource } from './biblical-question-types'

const FRAME_WORDS = new Set(['respecto', 'significa', 'significado', 'explica', 'explicame', 'dime', 'hablame', 'saber', 'quiero', 'dice', 'biblia', 'favor', 'puedes', 'podrias', 'necesito', 'sirve', 'explicar', 'explicas'])

export function esPreguntaBiblica(query: string) {
  const text = normalizeBiblicalSearchQuery(query)
  return query.length <= 500 && (/^[¿?]/.test(query.trim()) || /\?$/.test(query.trim())
    || /^(que|como|por que|para que|cuando|donde|quien|cual|cuales|cuanto|cuantos|explica|explicame|dime|hablame|quiero saber|necesito saber|puedes explicar|me explicas|me puedes explicar)\b/.test(text))
}

export function palabrasDePregunta(query: string) {
  const words = tokenizeBiblicalSearchQuery(query).filter(word => !FRAME_WORDS.has(word))
  if (/\bfe\b/.test(normalizeBiblicalSearchQuery(query))) words.push('fe')
  return [...new Set(words)].filter(word => /^[a-z]{2,30}$/.test(word)).slice(0, 6)
}

function forms(word: string) {
  // Familias léxicas para recuperar texto; no son equivalencias doctrinales ni respuestas.
  if (/^(bautismo|bautizar|bautizo|bautizado|bautizarse)$/.test(word)) return ['bautism', 'bautiz', 'bautic']
  if (/^(odio|odiar|aborrecer|aborrecimiento)$/.test(word)) return ['odio', 'aborre']
  return [word]
}

function matchesForm(value: string, form: string) {
  if (form === 'bautism') return /^bautismos?$/.test(value)
  if (form === 'bautiz') return /^bautiz(?:ar|arse|ara|aran|are|aras|areis|aria|arian|ado|ados|ada|adas|ando|o|as|a|amos|ais|an|aba|aban|abas|abamos|abais|aste|asteis|aron|ad|ase|asen)(?:se|lo|la|los|las)?$/.test(value)
  if (form === 'bautic') return /^bautic(?:e|es|emos|eis|en)(?:se|lo|la|los|las)?$/.test(value)
  if (form === 'aborre') return /^aborre(?:cer|ce|ces|cen|cia|cian|cido|cidos|cimiento|cimientos|zco|zca|zcan|cere|cera|cieron|cio|ciendo|ced|ciese|ciste|cisteis)$/.test(value)
  return value === form
}

function patterns(word: string) {
  const values = new Set([word])
  const accents: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', n: 'ñ' }
  for (let i = 0; i < word.length; i += 1) {
    if (accents[word[i]]) values.add(word.slice(0, i) + accents[word[i]] + word.slice(i + 1))
  }
  return [...values].map(value => `original_text.ilike.%${value}%`)
}

/** Recuperación acotada solo del corpus RV1909 aprobado. Nunca acepta citas propuestas por un modelo. */
export async function recuperarFuentesPregunta(query: string): Promise<BiblicalQuestionSource[]> {
  const db = await createClient() as unknown as SupabaseClient
  const { data: { user } } = await db.auth.getUser()
  if (!user) return []

  const explicit = query.match(/\b((?:[1-3]\s+)?[\p{L}]+\s+\d{1,3}:\d{1,3}(?:\s*[-–]\s*\d{1,3}(?::\d{1,3})?)?)/u)?.[1]
  if (explicit) {
    const result = await readStudyScripture(explicit)
    if (result.status === 'ready') {
      const verses = result.translation.verses
      // Un rango grande no se recorta silenciosamente para explicar solo una parte.
      if (verses.length > 12) return []
      return verses.map((row, index) => ({
        id: `P${index + 1}`, reference: `${result.reference.book.nameEs} ${row.chapter}:${row.verse}`,
        bookCode: result.reference.book.code, chapter: row.chapter, verse: row.verse,
        text: row.text, sourceName: result.translation.sourceName, context: verses,
      }))
    }
    if (result.status !== 'not_reference') return []
  }

  const words = palabrasDePregunta(query)
  if (!words.length) return []
  const { data: source, error: sourceError } = await db.from('biblical_sources')
    .select('id,name').eq('slug', 'rv1909-ebible').eq('enabled', true)
    .eq('review_status', 'approved').eq('license_status', 'verified').maybeSingle()
  if (sourceError || !source) return []
  const expanded = words.flatMap(forms)
  const [{ data, error }, { data: books, error: booksError }] = await Promise.all([
    db.from('biblical_verse_texts').select('book_code,chapter,verse,original_text')
      .eq('source_id', source.id).eq('language', 'spanish').eq('enabled', true).eq('review_status', 'approved').gt('verse', 0)
      .or([...new Set(expanded.flatMap(patterns))].join(','))
      .order('book_code').order('chapter').order('verse').limit(160),
    db.from('biblical_books').select('code,name_es,canonical_order').eq('enabled', true).eq('review_status', 'approved'),
  ])
  if (error || booksError || !data || !books) return []
  const bookIndex = new Map(books.map(book => [String(book.code), book]))
  const ranked = data.flatMap(row => {
    const book = bookIndex.get(String(row.book_code))
    if (!book || !/^[A-Z0-9]{2,5}$/.test(String(row.book_code))) return []
    const text = String(row.original_text ?? '').trim()
    const completeWords = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z]+/g) ?? []
    const matched = words.filter(word => forms(word).some(form => completeWords.some(value => matchesForm(value, form))))
    if (!matched.length) return []
    const density = completeWords.filter(value => expanded.some(form => matchesForm(value, form))).length
    return [{ row, book, text, score: matched.length * 100 + Math.min(density, 9) }]
  }).sort((a, b) => b.score - a.score || Number(a.book.canonical_order) - Number(b.book.canonical_order) || Number(a.row.chapter) - Number(b.row.chapter) || Number(a.row.verse) - Number(b.row.verse))

  // Una fuente por libro primero: no llenar toda la respuesta con un solo capítulo.
  const selected: typeof ranked = []
  for (const item of ranked) {
    if (selected.some(previous => previous.row.book_code === item.row.book_code)) continue
    selected.push(item)
    if (selected.length === 8) break
  }
  if (selected.length < 8) {
    for (const item of ranked) {
      if (selected.includes(item)) continue
      selected.push(item)
      if (selected.length === 8) break
    }
  }
  if (!selected.length) return []
  // Anclas del caso solicitado y comprobado con el usuario; solo orientan la recuperación.
  // No contienen respuestas ni sustituyen las otras fuentes o la pregunta completa.
  const anchors = words.includes('bautismo') ? [
    { book: 'MAT', chapter: 28, verse: 19 },
    { book: 'ACT', chapter: 2, verse: 38 },
    { book: 'ROM', chapter: 6, verse: 4 },
  ] : []
  const ranges = [
    ...selected.map(({ row }) => ({ book: String(row.book_code), chapter: Number(row.chapter), verse: Number(row.verse) })),
    ...anchors,
  ]
  const { data: surrounding, error: contextError } = await db.from('biblical_verse_texts')
    .select('book_code,chapter,verse,original_text').eq('source_id', source.id)
    .eq('language', 'spanish').eq('enabled', true).eq('review_status', 'approved').gt('verse', 0)
    .or(ranges.map(row => `and(book_code.eq.${row.book},chapter.eq.${row.chapter},verse.gte.${Math.max(1, row.verse - 1)},verse.lte.${row.verse + 1})`).join(','))
    .order('book_code').order('chapter').order('verse').limit(48)
  if (contextError || !surrounding) return []
  const preferred = anchors.flatMap(anchor => {
    const row = surrounding.find(row => row.book_code === anchor.book && Number(row.chapter) === anchor.chapter && Number(row.verse) === anchor.verse)
    const book = bookIndex.get(anchor.book)
    return row && book && String(row.original_text ?? '').trim()
      ? [{ row, book, text: String(row.original_text).trim(), score: 0 }] : []
  })
  const final = [...new Map([...preferred, ...selected].map(item => [`${item.row.book_code}:${item.row.chapter}:${item.row.verse}`, item])).values()].slice(0, 8)
  return final.map((item, index) => ({
    id: `P${index + 1}`, reference: `${item.book.name_es} ${item.row.chapter}:${item.row.verse}`,
    bookCode: String(item.row.book_code), chapter: Number(item.row.chapter), verse: Number(item.row.verse),
    text: item.text, sourceName: String(source.name),
    context: surrounding.filter(row => row.book_code === item.row.book_code && Number(row.chapter) === Number(item.row.chapter)
      && Math.abs(Number(row.verse) - Number(item.row.verse)) <= 1)
      .map(row => ({ chapter: Number(row.chapter), verse: Number(row.verse), text: String(row.original_text ?? '') })),
  }))
}
