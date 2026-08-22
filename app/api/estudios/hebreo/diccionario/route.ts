import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchGeneralDictionary } from '@/lib/hebreo/general-dictionary'

export const dynamic = 'force-dynamic'

function cleanQuery(value: string | null) {
  return (value ?? '').trim().slice(0, 80)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const url = new URL(request.url)
  const query = cleanQuery(url.searchParams.get('q'))
  if (!query) return NextResponse.json({ status: 'ok', query, total: 0, items: [] })

  const items = await searchGeneralDictionary(query, 24)
  return NextResponse.json({
    status: 'ok',
    query,
    total: items.length,
    items: items.map(item => ({
      lexicalId: item.id,
      lemma: item.hebrew,
      spanish: item.spanish,
      pronunciation: item.pronunciation,
      meaningNoteEs: item.source === 'curated-pilot'
        ? `Entrada léxica general curada para el piloto Hebreo ↔ Español.`
        : `Entrada general Hebreo ↔ Español procedente de WikiDict CC0.`,
      source: item.source,
    })),
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
