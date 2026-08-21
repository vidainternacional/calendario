'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, List, Rows3, Search } from 'lucide-react'
import { HEBREW_LEARNING_GROUPS, type HebrewLearningGroupId } from '@/lib/hebreo/word-learning'

type ReadingMode = 'nikud' | 'plain'
type WordView = 'cards' | 'list' | 'detail'

type CatalogWord = {
  lexicalId: string
  lemma: string
  spanish: string | null
  pronunciation: string | null
  meaningNoteEs: string | null
}

type CatalogResponse = {
  status: 'ok' | 'sin-sesion' | 'no-disponible'
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  group: HebrewLearningGroupId
  items: CatalogWord[]
}

const EMPTY_RESULT: CatalogResponse = { status: 'ok', page: 1, pageSize: 24, total: 0, totalPages: 0, search: '', group: 'essentials', items: [] }

const LETTER_NAMES: Record<string, string> = {
  א: 'Alef', ב: 'Bet', ג: 'Guímel', ד: 'Dálet', ה: 'He', ו: 'Vav', ז: 'Zayin', ח: 'Jet', ט: 'Tet', י: 'Yod',
  כ: 'Kaf', ך: 'Kaf final', ל: 'Lamed', מ: 'Mem', ם: 'Mem final', נ: 'Nun', ן: 'Nun final', ס: 'Sámej', ע: 'Ayin',
  פ: 'Pe', ף: 'Pe final', צ: 'Tsadi', ץ: 'Tsadi final', ק: 'Qof', ר: 'Resh', ש: 'Shin / Sin', ת: 'Tav',
}

const MARK_NAMES: Record<string, string> = {
  '\u05B0': 'Sheva', '\u05B1': 'Hataf Segol', '\u05B2': 'Hataf Pataj', '\u05B3': 'Hataf Qamats',
  '\u05B4': 'Hiriq', '\u05B5': 'Tsere', '\u05B6': 'Segol', '\u05B7': 'Pataj', '\u05B8': 'Qamats', '\u05B9': 'Holam',
  '\u05BB': 'Qubuts', '\u05BC': 'Dagesh', '\u05C1': 'punto de Shin', '\u05C2': 'punto de Sin', '\u05C7': 'Qamats qatan',
}

const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g
const HEBREW_LETTER = /[\u05D0-\u05EA]/

function withoutNiqqud(value: string) { return value.normalize('NFD').replace(HEBREW_MARKS, '') }

function formationParts(value: string) {
  const parts: string[] = []
  for (const char of Array.from(value.normalize('NFD'))) {
    if (LETTER_NAMES[char]) parts.push(`${char} ${LETTER_NAMES[char]}`)
    else if (MARK_NAMES[char]) parts.push(MARK_NAMES[char])
  }
  return parts
}

function pronunciationFromHebrew(value: string) {
  const clusters: { letter: string; marks: string[] }[] = []
  for (const char of Array.from(value.normalize('NFD'))) {
    if (HEBREW_LETTER.test(char)) clusters.push({ letter: char, marks: [] })
    else if (clusters.length > 0 && MARK_NAMES[char]) clusters[clusters.length - 1].marks.push(char)
  }
  return clusters.map((cluster, index) => {
    const { letter, marks } = cluster
    const has = (mark: string) => marks.includes(mark)
    const last = index === clusters.length - 1
    if (letter === 'ו' && has('\u05BC') && !marks.some(mark => ['\u05B0','\u05B1','\u05B2','\u05B3','\u05B4','\u05B5','\u05B6','\u05B7','\u05B8','\u05B9','\u05BB','\u05C7'].includes(mark))) return 'u'
    if (letter === 'ו' && has('\u05B9')) return 'o'
    let consonant = ''
    switch (letter) {
      case 'א': case 'ע': consonant = ''; break
      case 'ב': consonant = has('\u05BC') ? 'b' : 'v'; break
      case 'ג': consonant = 'g'; break
      case 'ד': consonant = 'd'; break
      case 'ה': consonant = last && marks.length === 0 ? '' : 'h'; break
      case 'ו': consonant = 'v'; break
      case 'ז': consonant = 'z'; break
      case 'ח': consonant = 'j'; break
      case 'ט': consonant = 't'; break
      case 'י': consonant = 'y'; break
      case 'כ': case 'ך': consonant = has('\u05BC') ? 'k' : 'j'; break
      case 'ל': consonant = 'l'; break
      case 'מ': case 'ם': consonant = 'm'; break
      case 'נ': case 'ן': consonant = 'n'; break
      case 'ס': consonant = 's'; break
      case 'פ': case 'ף': consonant = has('\u05BC') ? 'p' : 'f'; break
      case 'צ': case 'ץ': consonant = 'ts'; break
      case 'ק': consonant = 'k'; break
      case 'ר': consonant = 'r'; break
      case 'ש': consonant = has('\u05C2') ? 's' : 'sh'; break
      case 'ת': consonant = 't'; break
    }
    let vowel = ''
    if (has('\u05B4')) vowel = 'i'
    else if (has('\u05B5') || has('\u05B6') || has('\u05B1')) vowel = 'e'
    else if (has('\u05B7') || has('\u05B8') || has('\u05B2')) vowel = 'a'
    else if (has('\u05C7') || has('\u05B3') || has('\u05B9')) vowel = 'o'
    else if (has('\u05BB')) vowel = 'u'
    else if (has('\u05B0') && !last) vowel = 'e'
    return consonant + vowel
  }).join('').replace(/yy/g, 'y')
}

function pronunciationFor(word: CatalogWord) {
  const generated = pronunciationFromHebrew(word.lemma)
  return word.pronunciation ?? (generated || '—')
}
function spanishFor(word: CatalogWord) { return word.spanish ?? 'Español pendiente' }

function chunkWords(words: CatalogWord[], size: number) {
  const rows: CatalogWord[][] = []
  for (let index = 0; index < words.length; index += size) rows.push(words.slice(index, index + size))
  return rows
}

function WordsIntroduction() {
  const [open, setOpen] = useState(false)
  return <section className="border-y border-slate-200 text-left"><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"><span><span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">מִלִּים</span><span className="mt-0.5 block text-sm font-black text-slate-950">¿Cómo aprendemos las palabras?</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="border-t border-slate-200 p-4"><div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]"><p><strong>Con niqqud</strong> ves todos los signos de la palabra. <strong>Sin niqqud</strong> practicas la misma palabra solo con sus letras.</p><p>Las palabras se organizan por significado y por tipo para aprenderlas en grupos pequeños antes de recorrer el catálogo completo.</p><p>Desliza horizontalmente el catálogo: cuando hay más páginas avanza entre ellas y, si un grupo cabe en una sola página, continúa al grupo siguiente.</p></div></div>}</section>
}

function ModeControl({ mode, onChange }: { mode: ReadingMode; onChange: (mode: ReadingMode) => void }) {
  return <div className="grid grid-cols-2 rounded-[17px] bg-slate-100 p-1" aria-label="Modo de lectura">{([{ id: 'nikud', label: 'Con niqqud' }, { id: 'plain', label: 'Sin niqqud' }] as const).map(item => <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => onChange(item.id)} className={`min-h-10 rounded-[14px] px-3 text-[12px] font-black ${mode === item.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item.label}</button>)}</div>
}

function ViewControl({ view, onChange }: { view: WordView; onChange: (view: WordView) => void }) {
  const views = [{ id: 'cards' as const, label: 'Tarjetas', Icon: Grid2X2 }, { id: 'list' as const, label: 'Lista', Icon: List }, { id: 'detail' as const, label: 'Detalle', Icon: Rows3 }]
  return <div className="grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1" aria-label="Vista de palabras">{views.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[11px] font-black ${view === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
}

function WordText({ word, mode, className }: { word: CatalogWord; mode: ReadingMode; className: string }) {
  return <span lang="he" dir="rtl" className={className}>{mode === 'nikud' ? word.lemma : withoutNiqqud(word.lemma)}</span>
}

function LearningDetail({ word, mode, compact = false }: { word: CatalogWord; mode: ReadingMode; compact?: boolean }) {
  const pronunciation = pronunciationFor(word)
  const spanish = spanishFor(word)
  const formation = formationParts(word.lemma)
  return <article className={`${compact ? 'mt-3' : ''} overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]`}><div className="p-4 text-center sm:p-5"><WordText word={word} mode={mode} className={`${compact ? 'text-[4.65rem]' : 'text-[5.5rem]'} block break-words font-black leading-[1.2] text-slate-950`} /><p className="mt-1.5 text-[1.05rem] font-black text-indigo-700">{pronunciation}</p><p className="mt-1 text-xl font-black text-slate-950">{spanish}</p><div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-left"><div className="py-3.5"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cómo se pronuncia</p><p className="mt-1 text-[16px] font-black text-slate-800">{pronunciation}</p></div><div className="py-3.5"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cómo se forma</p><p className="mt-1 text-[13px] leading-relaxed text-slate-700">{formation.length > 0 ? formation.join(' + ') : 'Se conserva la escritura hebrea aprobada de la palabra.'}</p></div><div className="py-3.5"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Qué significa</p><p className="mt-1 text-[14px] font-bold leading-relaxed text-slate-800">{word.meaningNoteEs ?? (word.spanish ? `Significa «${word.spanish}».` : 'El significado español de esta entrada todavía no está preparado editorialmente.')}</p></div></div></div></article>
}

function CardsView({ words, mode, selectedId, closingId, onToggle }: { words: CatalogWord[]; mode: ReadingMode; selectedId: string | null; closingId: string | null; onToggle: (word: CatalogWord) => void }) {
  const rows = chunkWords(words, 2)
  return <div className="space-y-4">{rows.map((row, rowIndex) => { const selected = row.find(word => word.lexicalId === selectedId) ?? null; return <div key={`word-row-${rowIndex}`}><div className="grid grid-cols-2 gap-3">{row.map(word => { const active = word.lexicalId === selectedId; return <button key={word.lexicalId} type="button" aria-pressed={active} onClick={() => onToggle(word)} className={`min-h-[140px] min-w-0 rounded-[22px] border px-3 py-3 text-center transition active:scale-[0.98] motion-reduce:transition-none ${active ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_26px_rgba(79,70,229,0.18)]' : 'border-slate-200 bg-white text-slate-950 shadow-[0_6px_18px_rgba(15,23,42,0.04)]'}`}><WordText word={word} mode={mode} className="block break-words text-[3.05rem] font-black leading-tight" /><span className={`mt-1.5 block text-[13px] font-black ${active ? 'text-indigo-100' : 'text-indigo-700'}`}>{pronunciationFor(word)}</span><span className={`mt-1 block break-words text-[14px] font-black leading-tight ${active ? 'text-white' : 'text-slate-800'}`}>{spanishFor(word)}</span></button>})}</div>{selected && <div className={closingId === selected.lexicalId ? 'scale-[0.96] opacity-0 transition duration-150' : 'scale-100 opacity-100 transition duration-200'}><LearningDetail word={selected} mode={mode} compact /></div>}</div> })}</div>
}

function ListView({ words, mode }: { words: CatalogWord[]; mode: ReadingMode }) {
  return <div className="-mx-4 divide-y divide-slate-200 border-y border-slate-200 bg-white px-4 sm:mx-0 sm:px-0">{words.map(word => <div key={word.lexicalId} className="flex min-h-[88px] items-center justify-between gap-4 py-3 sm:px-1"><div className="min-w-0"><WordText word={word} mode={mode} className="block break-words text-[2.6rem] font-black leading-tight text-slate-950" /><p className="mt-1 text-[13px] font-black text-indigo-700">{pronunciationFor(word)}</p></div><p className="max-w-[44%] shrink-0 text-right text-[14px] font-black leading-tight text-slate-800">{spanishFor(word)}</p></div>)}</div>
}

function DetailView({ word, mode, onPrevious, onNext, hasPrevious, hasNext }: { word: CatalogWord | null; mode: ReadingMode; onPrevious: () => void; onNext: () => void; hasPrevious: boolean; hasNext: boolean }) {
  if (!word) return <div className="border-y border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">No hay palabras en este grupo.</div>
  return <div><LearningDetail word={word} mode={mode} /><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={!hasPrevious} onClick={onPrevious} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button><button type="button" disabled={!hasNext} onClick={onNext} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button></div></div>
}

function PageControl({ result, loading, onPage }: { result: CatalogResponse; loading: boolean; onPage: (page: number) => void }) {
  if (result.totalPages <= 1) return null
  return <div className="flex items-center justify-between gap-2 rounded-[18px] bg-slate-50 px-2 py-2"><button type="button" disabled={result.page <= 1 || loading} onClick={() => onPage(Math.max(1, result.page - 1))} className="flex min-h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button><p className="text-center text-[10px] font-black leading-tight text-slate-500">Página {result.page}<br />de {result.totalPages}</p><button type="button" disabled={result.page >= result.totalPages || loading} onClick={() => onPage(result.page + 1)} className="flex min-h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button></div>
}

export default function ReadingWordsExplorer() {
  const [mode, setMode] = useState<ReadingMode>('nikud')
  const [view, setView] = useState<WordView>('cards')
  const [group, setGroup] = useState<HebrewLearningGroupId>('essentials')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<CatalogResponse>(EMPTY_RESULT)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const pageBeforeSearch = useRef(1)
  const swipeStartX = useRef<number | null>(null)
  const swipeCurrentX = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true); setError(null)
    const params = new URLSearchParams({ page: String(page), pageSize: '24', group })
    if (search) params.set('q', search)
    fetch(`/api/estudios/hebreo/palabras?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión necesita renovarse.' : 'No se pudo cargar el catálogo.'); return response.json() as Promise<CatalogResponse> })
      .then(data => { if (!active) return; setResult(data); setSelectedId(current => data.items.some(item => item.lexicalId === current) ? current : null); setClosingId(null); setSwipeOffset(0) })
      .catch(cause => { if (!active || controller.signal.aborted) return; setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [page, search, group])

  const selectedIndex = useMemo(() => result.items.findIndex(item => item.lexicalId === selectedId), [result.items, selectedId])
  const effectiveIndex = selectedIndex >= 0 ? selectedIndex : (result.items.length > 0 ? 0 : -1)
  const selectedForDetail = effectiveIndex >= 0 ? result.items[effectiveIndex] : null
  const activeGroup = HEBREW_LEARNING_GROUPS.find(item => item.id === group) ?? HEBREW_LEARNING_GROUPS[0]

  function toggleCard(word: CatalogWord) {
    if (selectedId !== word.lexicalId) { setClosingId(null); setSelectedId(word.lexicalId); return }
    setClosingId(word.lexicalId)
    window.setTimeout(() => { setSelectedId(current => current === word.lexicalId ? null : current); setClosingId(null) }, 160)
  }
  function changeView(next: WordView) { setView(next); setClosingId(null); if (next === 'list') setSelectedId(null); if (next === 'detail' && selectedId === null && result.items[0]) setSelectedId(result.items[0].lexicalId) }
  function changeGroup(next: HebrewLearningGroupId) { setGroup(next); setPage(1); pageBeforeSearch.current = 1; setSearchInput(''); setSearch(''); setSelectedId(null); setClosingId(null) }
  function clearSearch() { setSearchInput(''); setSearch(''); setPage(pageBeforeSearch.current); setSelectedId(null) }
  function handleSearchInput(value: string) { setSearchInput(value); if (value === '' && search) clearSearch() }
  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next = searchInput.trim(); if (!next) return clearSearch(); if (!search) pageBeforeSearch.current = page; setPage(1); setSelectedId(null); setSearch(next) }
  function goPage(next: number) { if (next < 1 || next > result.totalPages || loading) return; setSelectedId(null); setClosingId(null); setSwipeOffset(0); setPage(next) }
  function beginSwipe(clientX: number) { if (loading) return; swipeStartX.current = clientX; swipeCurrentX.current = clientX }
  function moveSwipe(clientX: number) {
    if (swipeStartX.current === null) return
    swipeCurrentX.current = clientX
    const delta = clientX - swipeStartX.current
    setSwipeOffset(Math.max(-84, Math.min(84, delta * 0.38)))
  }
  function finishSwipe() {
    const start = swipeStartX.current
    const current = swipeCurrentX.current
    swipeStartX.current = null
    swipeCurrentX.current = null
    setSwipeOffset(0)
    if (start === null || current === null || loading) return

    const delta = current - start
    const groupIndex = HEBREW_LEARNING_GROUPS.findIndex(item => item.id === group)
    if (delta <= -48) {
      if (result.page < result.totalPages) goPage(result.page + 1)
      else if (!search && groupIndex >= 0 && groupIndex < HEBREW_LEARNING_GROUPS.length - 1) changeGroup(HEBREW_LEARNING_GROUPS[groupIndex + 1].id)
    } else if (delta >= 48) {
      if (result.page > 1) goPage(result.page - 1)
      else if (!search && groupIndex > 0) changeGroup(HEBREW_LEARNING_GROUPS[groupIndex - 1].id)
    }
  }

  return <section aria-labelledby="reading-words-title" className="text-left"><div className="text-center"><p lang="he" dir="rtl" className="text-[1.25rem] font-black text-indigo-700">מִלִּים</p><h2 id="reading-words-title" className="mt-0.5 text-[1.65rem] font-black tracking-[-0.025em] text-slate-950">Palabras</h2><p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">Aprende vocabulario como un diccionario visual: hebreo, pronunciación, español, formación y significado.</p></div><div className="mt-5"><WordsIntroduction /></div><div className="mt-4 space-y-2.5"><ModeControl mode={mode} onChange={setMode} /><ViewControl view={view} onChange={changeView} /></div><div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex min-w-max gap-2">{HEBREW_LEARNING_GROUPS.map(item => <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => changeGroup(item.id)} className={`min-h-11 shrink-0 rounded-full border px-4 text-[12px] font-black ${group === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}</div></div><p className="mt-2 text-center text-[12px] leading-relaxed text-slate-500">{activeGroup.description}</p><form onSubmit={submitSearch} className="mt-4 flex min-h-11 items-center gap-2 rounded-[17px] border border-slate-200 bg-white px-3"><Search className="h-4 w-4 shrink-0 text-slate-400" /><input value={searchInput} onChange={event => handleSearchInput(event.target.value)} placeholder="Buscar en español o hebreo" className="min-w-0 flex-1 bg-transparent py-2 text-[13px] font-semibold text-slate-800 outline-none placeholder:text-slate-400" />{searchInput && <button type="submit" className="text-[11px] font-black text-indigo-700">Buscar</button>}</form><div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500"><span>{loading ? 'Cargando palabras…' : `${result.total.toLocaleString('es-SV')} palabras`}</span>{search && <button type="button" onClick={clearSearch} className="font-black text-indigo-700">Limpiar búsqueda</button>}</div><div className="mt-3"><PageControl result={result} loading={loading} onPage={goPage} /></div>{error && <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-center text-[12px] font-semibold text-amber-900">{error}</div>}{!error && !loading && result.items.length === 0 && <div className="mt-5 border-y border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No encontramos esa palabra. Borra la búsqueda para volver al listado anterior.</div>}{!error && result.items.length > 0 && <div className="mt-5 overflow-hidden"><div className="touch-pan-y transition-transform duration-200 ease-out motion-reduce:transition-none" style={{ transform: `translate3d(${swipeOffset}px,0,0)` }} onTouchStart={event => beginSwipe(event.touches[0].clientX)} onTouchMove={event => moveSwipe(event.touches[0].clientX)} onTouchEnd={finishSwipe} onTouchCancel={finishSwipe}>{view === 'cards' && <CardsView words={result.items} mode={mode} selectedId={selectedId} closingId={closingId} onToggle={toggleCard} />}{view === 'list' && <ListView words={result.items} mode={mode} />}{view === 'detail' && <DetailView word={selectedForDetail} mode={mode} hasPrevious={effectiveIndex > 0} hasNext={effectiveIndex >= 0 && effectiveIndex < result.items.length - 1} onPrevious={() => effectiveIndex > 0 && setSelectedId(result.items[effectiveIndex - 1].lexicalId)} onNext={() => effectiveIndex >= 0 && effectiveIndex < result.items.length - 1 && setSelectedId(result.items[effectiveIndex + 1].lexicalId)} />}</div></div>}<div className="mt-5"><PageControl result={result} loading={loading} onPage={goPage} /></div><p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">Cada página muestra 24 palabras. “Todas” conserva acceso al catálogo hebreo aprobado completo. Desliza a izquierda o derecha para recorrer páginas y grupos sin perder el scroll vertical.</p></section>
}
