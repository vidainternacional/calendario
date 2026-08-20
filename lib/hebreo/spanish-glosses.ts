import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { HebrewWordCatalogPage } from '@/lib/hebreo/word-catalog'

type DerivedGlossRow = {
  lexical_entry_id: string
  display_gloss_es: string
  confidence: number
  status: 'verified_derived' | 'manual_approved'
}

export async function enriquecerCatalogoConGlosasEspanolas(
  page: HebrewWordCatalogPage,
): Promise<HebrewWordCatalogPage> {
  if (page.status !== 'ok' || page.items.length === 0) return page

  const ids = Array.from(new Set(page.items.map(item => item.lexicalId).filter(Boolean)))
  if (ids.length === 0) return page

  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('biblical_hebrew_spanish_glosses')
    .select('lexical_entry_id, display_gloss_es, confidence, status')
    .in('lexical_entry_id', ids)
    .in('status', ['verified_derived', 'manual_approved'])

  if (error) {
    console.error('[hebrew-spanish-glosses] No se pudo enriquecer el catálogo:', error)
    return page
  }

  const rows = (data ?? []) as DerivedGlossRow[]
  if (rows.length === 0) return page

  const byLexicalId = new Map(rows.map(row => [row.lexical_entry_id, row]))

  return {
    ...page,
    items: page.items.map(item => {
      if (item.spanish) return item
      const derived = byLexicalId.get(item.lexicalId)
      if (!derived) return item
      return {
        ...item,
        spanish: derived.display_gloss_es,
        meaningNoteEs: item.meaningNoteEs ?? `Glosa española de alta confianza derivada de una equivalencia fuente aprobada (${derived.confidence}%).`,
      }
    }),
  }
}
