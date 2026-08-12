'use server'

import { createClient } from '@/lib/supabase/server'
import { parseInternalBibleReference } from '@/lib/estudios/biblical-context-corpus'

export type TraduccionEspanolaEstudio = {
  canonicalReference: string
  sourceName: string
  sourceSlug: string
  providerVersion: string | null
  attribution: string | null
  verses: Array<{
    verse: number
    text: string
    contentHash: string
  }>
}

export async function cargarTraduccionEspanolaEstudio(
  pasaje: string
): Promise<TraduccionEspanolaEstudio | null> {
  const query = pasaje.trim()
  if (!query || query.length > 120) return null

  const reference = await parseInternalBibleReference(query)
  if (!reference) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sourceData, error: sourceError } = await (supabase as any)
    .from('biblical_sources')
    .select('id, slug, name, provider_version, attribution')
    .eq('slug', 'rv1909-ebible')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('license_status', 'verified')
    .maybeSingle()

  if (sourceError || !sourceData) {
    if (sourceError) console.error('[traduccion-espanola-estudio] Fuente RV1909 no disponible:', sourceError)
    return null
  }

  let verseQuery = (supabase as any)
    .from('biblical_verse_texts')
    .select('verse, original_text, content_hash')
    .eq('source_id', sourceData.id)
    .eq('book_code', reference.book.code)
    .eq('chapter', reference.chapter)
    .eq('language', 'spanish')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .gt('verse', 0)
    .order('verse')

  if (reference.verse !== null) verseQuery = verseQuery.eq('verse', reference.verse)

  const { data: verseData, error: verseError } = await verseQuery
  if (verseError) {
    console.error('[traduccion-espanola-estudio] No se pudo recuperar RV1909:', verseError)
    return null
  }

  const verses = (verseData ?? [])
    .map((row: any) => ({
      verse: Number(row.verse),
      text: String(row.original_text ?? '').trim(),
      contentHash: String(row.content_hash ?? ''),
    }))
    .filter((row: { verse: number; text: string }) => row.text.length > 0)

  if (verses.length === 0) return null

  return {
    canonicalReference: reference.canonicalReference,
    sourceName: String(sourceData.name),
    sourceSlug: String(sourceData.slug),
    providerVersion: sourceData.provider_version ? String(sourceData.provider_version) : null,
    attribution: sourceData.attribution ? String(sourceData.attribution) : null,
    verses,
  }
}
