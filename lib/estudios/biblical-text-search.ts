import 'server-only'

import { createClient } from '@/lib/neon/biblical-client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { tokenizeBiblicalSearchQuery } from './biblical-search-ranking'
import type { ConcordanciaResultado } from './biblical-concordance'

const PREGUNTA = new Set(['dime', 'hablame', 'explicame', 'quiero', 'saber', 'tema', 'acerca'])
const ODIO = new Set(['odio', 'odiar', 'odias', 'odian', 'odiamos', 'odiando', 'odiado', 'odiaba', 'aborrecer', 'aborrece', 'aborrezco', 'aborrecimiento'])
const CONTEXTO_ODIO = new Set(['alguien', 'hermano', 'hermana', 'hermanos', 'persona', 'personas', 'gente'])

export function planBusquedaLiteral(rawQuery: string) {
  if (rawQuery.length > 180) return null
  let tokens = [...new Set(tokenizeBiblicalSearchQuery(rawQuery).filter(t => !PREGUNTA.has(t)))]
  const verboOdio = tokens.find(token => ODIO.has(token))
  if (verboOdio && tokens.every(token => ODIO.has(token) || CONTEXTO_ODIO.has(token))) tokens = [verboOdio]
  if (tokens.length !== 1 || !/^[a-z]{3,30}$/.test(tokens[0])) return null
  const odio = ODIO.has(tokens[0])
  return { palabra: tokens[0], label: odio ? 'Odio y aborrecimiento' : rawQuery.trim(), patrones: odio ? ['%odio%', '%aborre%'] : [`%${tokens[0]}%`], odio }
}

export function coincidePalabraBuscada(text: string, plan: NonNullable<ReturnType<typeof planBusquedaLiteral>>) {
  // No usar el normalizador de consultas para un versículo: recorta a180 caracteres.
  const allWords = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z]+/g) || []
  return allWords.some(word => plan.odio ? word.startsWith('aborre') || word.startsWith('odio') || ODIO.has(word) : word === plan.palabra)
}

/** Lectura literal del corpus aprobado, sin generar referencias ni crear concordancias editoriales. */
export async function buscarTextoBiblico(rawQuery: string): Promise<ConcordanciaResultado[]> {
  const plan = planBusquedaLiteral(rawQuery)
  if (!plan) return []
  const db = await createClient() as unknown as SupabaseClient
  const { data: { user } } = await db.auth.getUser()
  if (!user) return []
  const { data: source, error: sourceError } = await db.from('biblical_sources')
    .select('id,name').eq('slug', 'rv1909-ebible').eq('enabled', true)
    .eq('review_status', 'approved').eq('license_status', 'verified').maybeSingle()
  if (sourceError || !source) return []
  const { data: verses, error } = await db.from('biblical_verse_texts')
    .select('book_code,chapter,verse,original_text').eq('source_id', source.id)
    .eq('language', 'spanish').eq('enabled', true).eq('review_status', 'approved').gt('verse', 0)
    .or(plan.patrones.map(pattern => `original_text.ilike.${pattern}`).join(','))
    .order('book_code').order('chapter').order('verse').limit(80)
  if (error || !Array.isArray(verses)) return []
  const rows = (verses as { book_code: string; chapter: number; verse: number; original_text: string }[])
    .filter(row => coincidePalabraBuscada(row.original_text, plan)).slice(0, 12)
  if (!rows.length) return []
  const { data: books, error: booksError } = await db.from('biblical_books')
    .select('code,name_es').in('code', [...new Set(rows.map(row => row.book_code))])
    .eq('enabled', true).eq('review_status', 'approved')
  if (booksError || !Array.isArray(books)) return []
  const names = new Map((books as { code: string; name_es: string }[]).map(book => [book.code, book.name_es]))
  const matches = rows.filter(row => names.has(row.book_code)).map(row => ({
    reference: `${names.get(row.book_code)} ${row.chapter}:${row.verse}`,
    bookCode: row.book_code, chapter: row.chapter, verse: row.verse,
    excerpt: row.original_text, relevance: 1, relationKind: 'direct' as const,
  }))
  return matches.length ? [{
    termId: `texto-rv1909-${plan.palabra}`, term: plan.label,
    description: `Pasajes del texto aprobado ${source.name}. ${plan.odio ? 'Incluye las formas de «odio» y «aborrecer» usadas en esta traducción.' : 'Coincidencias de la palabra buscada.'} Abre cada pasaje para leer su contexto.`,
    score: 1, matches,
  }] : []
}
