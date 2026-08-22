'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HEBREW_BIBLE_BOOKS } from '@/lib/hebreo/bible-books'
import { pronounceHebrewForSpanish, withoutHebrewMarks } from '@/lib/hebreo/pronunciation'

type Verse = { verse: number; hebrew: string; spanish: string | null }
type ReaderResponse = { book: { code: string; name: string }; chapter: number; chapters: number[]; verses: Verse[] }

const KNOWN = [
  { label: 'Génesis 1:1', book: 'GEN', chapter: 1, verse: 1 },
  { label: 'Shemá · Dt 6:4', book: 'DEU', chapter: 6, verse: 4 },
  { label: 'Salmo 23:1', book: 'PSA', chapter: 23, verse: 1 },
  { label: 'Salmo 119:105', book: 'PSA', chapter: 119, verse: 105 },
  { label: 'Isaías 40:8', book: 'ISA', chapter: 40, verse: 8 },
] as const

export default function HebrewBibleReader() {
  const [book, setBook] = useState('GEN')
  const [chapter, setChapter] = useState(1)
  const [showNiqqud, setShowNiqqud] = useState(true)
  const [showSpanish, setShowSpanish] = useState(false)
  const [result, setResult] = useState<ReaderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [focusVerse, setFocusVerse] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    const params = new URLSearchParams({ book, chapter: String(chapter) })
    if (showSpanish) params.set('spanish', '1')
    fetch(`/api/estudios/hebreo/biblia?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('No se pudo cargar la lectura.'); return response.json() as Promise<ReaderResponse> })
      .then(data => { setResult(data); if (data.chapter !== chapter) setChapter(data.chapter) })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la lectura.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [book, chapter, showSpanish])

  useEffect(() => {
    if (focusVerse === null || loading) return
    window.setTimeout(() => document.getElementById(`hebrew-verse-${focusVerse}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
  }, [focusVerse, loading, result])

  const chapterIndex = result?.chapters.indexOf(result.chapter) ?? -1
  const canPrevious = chapterIndex > 0
  const canNext = Boolean(result && chapterIndex >= 0 && chapterIndex < result.chapters.length - 1)
  const visibleTitle = useMemo(() => `${result?.book.name ?? HEBREW_BIBLE_BOOKS.find(item => item.code === book)?.name ?? book} ${result?.chapter ?? chapter}`, [result, book, chapter])

  function openKnown(item: typeof KNOWN[number]) {
    setBook(item.book); setChapter(item.chapter); setFocusVerse(item.verse)
  }

  return (
    <section aria-labelledby="hebrew-bible-reader-title" className="text-center">
      <div>
        <p lang="he" dir="rtl" className="text-[1.25rem] font-black text-indigo-700">קְרִיאָה בַּתַּנַ״ךְ</p>
        <h2 id="hebrew-bible-reader-title" className="mt-0.5 text-[1.45rem] font-black text-slate-950">Lectura bíblica</h2>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-slate-500">Practica versículos conocidos o abre la Biblia en orden por libro y capítulo.</p>
      </div>

      <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">{KNOWN.map(item => <button key={item.label} type="button" onClick={() => openKnown(item)} className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-[11px] font-black text-slate-700">{item.label}</button>)}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-left"><span className="block text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">Libro</span><select value={book} onChange={event => { setBook(event.target.value); setChapter(1); setFocusVerse(null) }} className="mt-1 w-full bg-transparent text-[13px] font-black text-slate-800 outline-none">{HEBREW_BIBLE_BOOKS.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <label className="rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-left"><span className="block text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">Capítulo</span><select value={result?.chapter ?? chapter} onChange={event => { setChapter(Number(event.target.value)); setFocusVerse(null) }} className="mt-1 w-full bg-transparent text-[13px] font-black text-slate-800 outline-none">{(result?.chapters ?? [chapter]).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1">
        <button type="button" onClick={() => setShowNiqqud(true)} className={`min-h-10 rounded-[14px] px-2 text-[11px] font-black ${showNiqqud ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Con niqqud</button>
        <button type="button" onClick={() => setShowNiqqud(false)} className={`min-h-10 rounded-[14px] px-2 text-[11px] font-black ${!showNiqqud ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Sin niqqud</button>
        <button type="button" onClick={() => setShowSpanish(value => !value)} className={`min-h-10 rounded-[14px] px-2 text-[11px] font-black ${showSpanish ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Español</button>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-400">La pronunciación es una ayuda orientativa. La comparación española es opcional y no sustituye leer el hebreo.</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-y border-slate-200 py-2.5">
        <button type="button" disabled={!canPrevious} onClick={() => canPrevious && result && setChapter(result.chapters[chapterIndex - 1])} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Capítulo anterior"><ChevronLeft className="h-5 w-5" /></button>
        <p className="text-[13px] font-black text-slate-800">{visibleTitle}</p>
        <button type="button" disabled={!canNext} onClick={() => canNext && result && setChapter(result.chapters[chapterIndex + 1])} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Capítulo siguiente"><ChevronRight className="h-5 w-5" /></button>
      </div>

      {loading && <p className="py-10 text-sm font-semibold text-slate-400">Cargando texto hebreo…</p>}
      {error && <p className="mt-4 rounded-[18px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
      {!loading && !error && result && <div className="divide-y divide-slate-200 border-b border-slate-200">{result.verses.map(item => <article id={`hebrew-verse-${item.verse}`} key={item.verse} className={`py-5 transition ${focusVerse === item.verse ? 'bg-indigo-50/70' : ''}`}><p className="text-[10px] font-black text-indigo-600">{result.book.name} {result.chapter}:{item.verse}</p><p lang="he" dir="rtl" className="mx-auto mt-2 max-w-3xl break-words text-[2rem] font-black leading-[1.7] text-slate-950">{showNiqqud ? item.hebrew : withoutHebrewMarks(item.hebrew)}</p><p className="mx-auto mt-2 max-w-2xl break-words text-[12px] font-bold leading-relaxed text-indigo-700">{pronounceHebrewForSpanish(item.hebrew) || 'Pronunciación pendiente'}</p>{showSpanish && item.spanish && <p className="mx-auto mt-3 max-w-2xl border-t border-slate-100 pt-3 text-[12px] leading-relaxed text-slate-600">{item.spanish}</p>}</article>)}</div>}
    </section>
  )
}
