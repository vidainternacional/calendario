import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/neon/biblical-client'
import { parseInternalBibleReference, type ParsedBibleReference } from './biblical-context-corpus'

export type StudyScripture = {
  canonicalReference: string
  sourceName: string
  sourceSlug: string
  providerVersion: string | null
  attribution: string | null
  verses: Array<{ chapter: number; verse: number; text: string; contentHash: string }>
}

export type StudyScriptureRead =
  | { status: 'not_reference' }
  | { status: 'unavailable' }
  | { status: 'missing'; reference: ParsedBibleReference }
  | { status: 'ready'; reference: ParsedBibleReference; translation: StudyScripture }

/** Comprueba la cita con el texto editorial existente; no guarda consultas ni duplica datos. */
export async function readStudyScripture(query: string): Promise<StudyScriptureRead> {
  const reference = await parseInternalBibleReference(query)
  if (!reference) return { status: 'not_reference' }
  const db = await createClient() as unknown as SupabaseClient
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { status: 'unavailable' }
  const { data: source, error: sourceError } = await db.from('biblical_sources')
    .select('id,slug,name,provider_version,attribution').eq('slug', 'rv1909-ebible')
    .eq('enabled', true).eq('review_status', 'approved').eq('license_status', 'verified').maybeSingle()
  if (sourceError || !source) return { status: 'unavailable' }

  const endChapter = reference.endChapter ?? reference.chapter
  const verses: StudyScripture['verses'] = []
  // Páginas pequeñas evitan truncamientos del Data API y del lector editorial.
  for (let offset = 0; ; offset += 500) {
    let page = db.from('biblical_verse_texts')
      .select('chapter,verse,original_text,content_hash').eq('source_id', source.id)
      .eq('book_code', reference.book.code).gte('chapter', reference.chapter).lte('chapter', endChapter)
      .eq('language', 'spanish').eq('enabled', true).eq('review_status', 'approved').gt('verse', 0)
      .order('chapter').order('verse')
    if (reference.verse !== null && endChapter === reference.chapter) {
      page = page.gte('verse', reference.verse).lte('verse', reference.endVerse ?? reference.verse)
    }
    const { data, error } = await page.range(offset, offset + 499)
    if (error || !Array.isArray(data)) return { status: 'unavailable' }
    for (const row of data) {
      const text = String(row.original_text ?? '').trim()
      if (!text) continue
      verses.push({ chapter: Number(row.chapter), verse: Number(row.verse), text, contentHash: String(row.content_hash ?? '') })
    }
    if (data.length < 500) break
  }

  const hasVerse = (chapter: number, verse: number) => verses.some(row => row.chapter === chapter && row.verse === verse)
  for (let chapter = reference.chapter; chapter <= endChapter; chapter += 1) {
    if (!verses.some(row => row.chapter === chapter)) return { status: 'missing', reference }
  }
  if (reference.verse !== null && (!hasVerse(reference.chapter, reference.verse) || !hasVerse(endChapter, reference.endVerse ?? reference.verse))) {
    return { status: 'missing', reference }
  }
  const selected = verses.filter(row => reference.verse === null || (
    (row.chapter > reference.chapter || row.verse >= reference.verse)
    && (row.chapter < endChapter || row.verse <= (reference.endVerse ?? reference.verse))
  ))
  // Un hueco interno del rango tampoco se presenta como una lectura completa.
  for (let index = 1; index < selected.length; index += 1) {
    const previous = selected[index - 1], current = selected[index]
    if ((current.chapter === previous.chapter && current.verse !== previous.verse + 1)
      || (current.chapter !== previous.chapter && current.verse !== 1)) return { status: 'unavailable' }
  }

  return {
    status: 'ready', reference,
    translation: {
      canonicalReference: reference.canonicalReference, sourceName: String(source.name), sourceSlug: String(source.slug),
      providerVersion: source.provider_version ? String(source.provider_version) : null,
      attribution: source.attribution ? String(source.attribution) : null, verses: selected,
    },
  }
}
