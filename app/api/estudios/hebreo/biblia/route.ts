import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HEBREW_BIBLE_BOOKS, hebrewBibleBook } from '@/lib/hebreo/bible-books'

const RV1909_SOURCE_ID = 'b6fef01a-f304-4fd0-98aa-5fe070279946'

type VerseRow = { verse: number; original_text: string }

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const url = new URL(request.url)
  const requestedBook = url.searchParams.get('book') ?? 'GEN'
  const book = hebrewBibleBook(requestedBook)
  const chapterParam = Number.parseInt(url.searchParams.get('chapter') ?? '1', 10)
  const chapter = Number.isFinite(chapterParam) && chapterParam > 0 ? chapterParam : 1
  const includeSpanish = url.searchParams.get('spanish') === '1'

  const { data: chapterRows, error: chapterError } = await (supabase as any)
    .from('biblical_verse_texts')
    .select('chapter')
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('book_code', book.code)
    .order('chapter', { ascending: true })

  if (chapterError) return NextResponse.json({ error: 'No se pudieron cargar los capítulos.' }, { status: 500 })
  const chapters = Array.from(new Set((chapterRows ?? []).map((row: any) => Number(row.chapter)).filter((value: number) => Number.isFinite(value)))).sort((a, b) => a - b)
  const safeChapter = chapters.includes(chapter) ? chapter : (chapters[0] ?? 1)

  const { data: hebrewRows, error: hebrewError } = await (supabase as any)
    .from('biblical_verse_texts')
    .select('verse, original_text')
    .eq('language', 'hebrew')
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .eq('book_code', book.code)
    .eq('chapter', safeChapter)
    .order('verse', { ascending: true })

  if (hebrewError) return NextResponse.json({ error: 'No se pudo cargar el texto hebreo.' }, { status: 500 })

  const byVerse = new Map<number, VerseRow>()
  for (const row of (hebrewRows ?? []) as VerseRow[]) if (!byVerse.has(row.verse)) byVerse.set(row.verse, row)

  let spanish = new Map<number, string>()
  if (includeSpanish) {
    const { data: spanishRows } = await (supabase as any)
      .from('biblical_verse_texts')
      .select('verse, original_text')
      .eq('source_id', RV1909_SOURCE_ID)
      .eq('language', 'spanish')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .eq('book_code', book.code)
      .eq('chapter', safeChapter)
      .order('verse', { ascending: true })
    spanish = new Map(((spanishRows ?? []) as VerseRow[]).map(row => [row.verse, row.original_text]))
  }

  return NextResponse.json({
    book,
    books: HEBREW_BIBLE_BOOKS,
    chapter: safeChapter,
    chapters,
    verses: Array.from(byVerse.values()).map(row => ({ verse: row.verse, hebrew: row.original_text, spanish: spanish.get(row.verse) ?? null })),
  })
}
