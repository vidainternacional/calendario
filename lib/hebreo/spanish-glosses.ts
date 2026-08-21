import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import type { HebrewWordCatalogPage } from '@/lib/hebreo/word-catalog'

type LexicalIdentityRow = {
  id: string
  lexical_id: string
}

type DerivedGlossRow = {
  lexical_entry_id: string
  display_gloss_es: string
  confidence: number
  status: 'verified_derived' | 'manual_approved'
}

const CONTEXTUAL_SPANISH_PLACEHOLDER = /^Relacionado con «.+»$/

function hasFinalSpanish(value: string | null) {
  return Boolean(value && !CONTEXTUAL_SPANISH_PLACEHOLDER.test(value))
}

export async function enriquecerCatalogoConGlosasEspanolas(
  page: HebrewWordCatalogPage,
): Promise<HebrewWordCatalogPage> {
  if (page.status !== 'ok' || page.items.length === 0) return page

  const lexicalIds = Array.from(new Set(page.items.map(item => item.lexicalId).filter(Boolean)))
  if (lexicalIds.length === 0) return page

  // Esta función solo se ejecuta del lado servidor y después de que el catálogo
  // haya validado la sesión activa. La cobertura española es editorial y no
  // depende de permisos del cliente; usar service role evita que una lectura RLS
  // intermedia convierta una glosa existente en un falso "Español pendiente".
  const supabase = createServiceClient()

  // `page.items[].lexicalId` conserva el identificador fuente/Strong (H...),
  // mientras `biblical_hebrew_spanish_glosses.lexical_entry_id` referencia el UUID
  // interno de `biblical_lexical_entries`. Resolver primero esa identidad evita que
  // una glosa aprobada aparezca erróneamente como ausente.
  const { data: lexicalRows, error: lexicalError } = await (supabase as any)
    .from('biblical_lexical_entries')
    .select('id, lexical_id')
    .in('lexical_id', lexicalIds)
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')

  if (lexicalError) {
    console.error('[hebrew-spanish-glosses] No se pudo resolver la identidad léxica:', lexicalError)
    return page
  }

  const identities = (lexicalRows ?? []) as LexicalIdentityRow[]
  if (identities.length === 0) return page

  const uuidByLexicalId = new Map(identities.map(row => [row.lexical_id, row.id]))
  const lexicalIdByUuid = new Map(identities.map(row => [row.id, row.lexical_id]))
  const entryIds = identities.map(row => row.id)

  const { data, error } = await (supabase as any)
    .from('biblical_hebrew_spanish_glosses')
    .select('lexical_entry_id, display_gloss_es, confidence, status')
    .in('lexical_entry_id', entryIds)
    .in('status', ['verified_derived', 'manual_approved'])

  if (error) {
    console.error('[hebrew-spanish-glosses] No se pudo enriquecer el catálogo:', error)
    return page
  }

  const rows = (data ?? []) as DerivedGlossRow[]
  if (rows.length === 0) return page

  const byLexicalId = new Map(
    rows.flatMap(row => {
      const lexicalId = lexicalIdByUuid.get(row.lexical_entry_id)
      return lexicalId ? [[lexicalId, row] as const] : []
    }),
  )

  return {
    ...page,
    items: page.items.map(item => {
      if (hasFinalSpanish(item.spanish)) return item
      const entryId = uuidByLexicalId.get(item.lexicalId)
      if (!entryId) return item
      const derived = byLexicalId.get(item.lexicalId)
      if (!derived) return item
      return {
        ...item,
        spanish: derived.display_gloss_es,
        meaningNoteEs: item.meaningNoteEs ?? `Glosa española editorial aprobada (${derived.confidence}% de confianza).`,
      }
    }),
  }
}
