'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, List, Rows3, Search } from 'lucide-react'
import type { HebrewReadingGroup, HebrewReadingItem } from '@/lib/hebreo/reading-catalog'

type ReadingMode = 'nikud' | 'plain'
type ReadingView = 'cards' | 'list' | 'detail'

type ReadingResponse = {
  status: 'ok' | 'sin-sesion' | 'no-disponible'
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  group: HebrewReadingGroup
  items: HebrewReadingItem[]
}

const EMPTY: ReadingResponse = { status: 'ok', page: 1, pageSize: 12, total: 0, totalPages: 0, search: '', group: 'starter', items: [] }
const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g

const GROUPS: readonly { id: HebrewReadingGroup; label: string; description: string }[] = [
  { id: 'starter', label: 'Iniciales', description: 'Frases y versículos conocidos para comenzar con lecturas reconocibles y de dificultad variada.' },
  { id: 'short', label: 'Cortas', description: 'Lecturas de hasta cinco palabras hebreas para ganar fluidez sin sobrecarga.' },
  { id: 'medium', label: 'Medias', description: 'Lecturas de seis a diez palabras para practicar continuidad y ritmo.' },
  { id: 'long', label: 'Largas', description: 'Oraciones y versículos extensos para una lectura más sostenida.' },
  { id: 'all', label: 'Todas', description: 'Acceso paginado al corpus hebreo aprobado completo del Antiguo Testamento.' },
]

function withoutNiqqud(value: string) {
  return value.normalize('NFD').replace(HEBREW_MARKS, '')
}

function HebrewText({ item, mode, className }: { item: HebrewReadingItem; mode: ReadingMode; className: string }) {
  return <span lang="he" dir="rtl" className={className}>{mode === 'nikud' ? item.hebrew : withoutNiqqud(item.hebrew)}</span>
}

function Introduction() {
  const [open, setOpen] = useState(false)
  return <section className="border-y border-slate-200 text-left"><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2"><span><span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">קְרִיאָה</span><span className="mt-0.5 block text-sm font-black text-slate-950">¿Cómo practicar lectura?</span></span><ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="border-t border-slate-200 p-4"><div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]"><p>Aquí no memorizamos palabras aisladas: leemos frases y oraciones reales del texto bíblico hebreo.</p><p>Empieza con <strong>Con niqqud</strong>. Cuando una lectura se vuelva familiar, pásala a <strong>Sin niqqud</strong> e intenta reconocerla solo por sus letras.</p><p>La comparación en español utiliza la RV1909 aprobada. La transliteración se mantiene como apoyo de pronunciación y puede ignorarse cuando ya no la necesites.</p></div></div>}</section>
}

function ModeControl({ mode, onChange }: { mode: ReadingMode; onChange: (mode: ReadingMode) => void }) {
  return <div className="grid grid-cols-2 rounded-[17px] bg-slate-100 p-1">{([{ id: 'nikud', label: 'Con niqqud' }, { id: 'plain', label: 'Sin niqqud' }] as const).map(item => <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => onChange(item.id)} className={`min-h-10 rounded-[14px] px-3 text-[12px] font-black ${mode === item.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item.label}</button>)}</div>
}

function ViewControl({ view, onChange }: { view: ReadingView; onChange: (view: ReadingView) => void }) {
  const views = [{ id: 'cards' as const, label: 'Tarjetas', Icon: Grid2X2 }, { id: 'list' as const, label: 'Lista', Icon: List }, { id: 'detail' as const, label: 'Detalle', Icon: Rows3 }]
  return <div className="grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1">{views.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[11px] font-black ${view === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
}

function ReadingCard({ item, mode, open, onToggle }: { item: HebrewReadingItem; mode: ReadingMode; open: boolean; onToggle: () => void }) {
  return <article className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]"><button type="button" aria-expanded={open} onClick={onToggle} className="block w-full px-4 py-3.5 text-center"><p className="text-[11px] font-black text-indigo-700">{item.reference}</p><HebrewText item={item} mode={mode} className="mt-1.5 block break-words text-[2.45rem] font-black leading-[1.55] text-slate-950" /><p className="mt-1.5 break-words text-[13px] font-bold leading-relaxed text-slate-500">{item.transliteration ?? 'Pronunciación pendiente'}</p></button>{open && <div className="border-t border-slate-100 px-4 py-3.5 text-center"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">En español</p><p className="mt-1.5 text-[14px] font-bold leading-relaxed text-slate-800">{item.spanish ?? 'Comparación española no disponible para esta referencia.'}</p></div>}</article>
}

function CardsView({ items, mode, openId, onToggle }: { items: HebrewReadingItem[]; mode: ReadingMode; openId: string | null; onToggle: (id: string) => void }) {
  return <div className="space-y-3">{items.map(item => <ReadingCard key={item.id} item={item} mode={mode} open={openId === item.id} onToggle={() => onToggle(item.id)} />)}</div>
}

function ListView({ items, mode }: { items: HebrewReadingItem[]; mode: ReadingMode }) {
  return <div className="-mx-4 divide-y divide-slate-200 border-y border-slate-200 bg-white px-4 sm:mx-0 sm:px-0">{items.map(item => <div key={item.id} className="py-3.5 sm:px-1"><div className="flex items-start justify-between gap-3"><p className="shrink-0 text-[12px] font-black text-indigo-700">{item.reference}</p><p className="max-w-[44%] text-right text-[12px] font-bold leading-snug text-slate-500">{item.spanish ?? '—'}</p></div><HebrewText item={item} mode={mode} className="mt-2 block break-words text-right text-[2.15rem] font-black leading-[1.5] text-slate-950" /></div>)}</div>
}

function DetailView({ item, mode }: { item: HebrewReadingItem; mode: ReadingMode }) {
  return <article className="rounded-[26px] border border-slate-200 bg-white p-4 text-center shadow-[0_12px_32px_rgba(15,23,42,0.07)] sm:p-5"><p className="text-[12px] font-black text-indigo-700">{item.reference}</p><HebrewText item={item} mode={mode} className="mt-3 block break-words text-[3.15rem] font-black leading-[1.55] text-slate-950" /><div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-left"><div className="py-3.5"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cómo se pronuncia</p><p className="mt-1 break-words text-[15px] font-bold leading-relaxed text-indigo-700">{item.transliteration ?? 'Pronunciación pendiente'}</p></div><div className="py-3.5"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">En español</p><p className="mt-1 text-[14px] font-bold leading-relaxed text-slate-800">{item.spanish ?? 'Comparación española no disponible para esta referencia.'}</p></div></div></article>
}

function Pagination({ result, loading, onPage }: { result: ReadingResponse; loading: boolean; onPage: (page: number) => void }) {
  if (result.totalPages <= 1) return null
  return <div className="flex items-center justify-between gap-2 rounded-[18px] bg-slate-50 px-2 py-2"><button type="button" disabled={result.page <= 1 || loading} onClick={() => onPage(Math.max(1, result.page - 1))} className="flex min-h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button><p className="text-center text-[11px] font-black text-slate-500">{result.page} / {result.totalPages}</p><button type="button" disabled={result.page >= result.totalPages || loading} onClick={() => onPage(result.page + 1)} className="flex min-h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button></div>
}

export default function ReadingSentencesExplorer() {
  const [mode, setMode] = useState<ReadingMode>('nikud')
  const [view, setView] = useState<ReadingView>('cards')
  const [group, setGroup] = useState<HebrewReadingGroup>('starter')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<ReadingResponse>(EMPTY)
  const [openId, setOpenId] = useState<string | null>(null)
  const [detailIndex, setDetailIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pageBeforeSearch = useRef(1)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true); setError(null)
    const params = new URLSearchParams({ page: String(page), pageSize: '12', group })
    if (search) params.set('q', search)
    fetch(`/api/estudios/hebreo/lecturas?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión necesita renovarse.' : 'No se pudieron cargar las lecturas.'); return response.json() as Promise<ReadingResponse> })
      .then(data => { if (!active) return; setResult(data); setOpenId(null); setDetailIndex(0) })
      .catch(cause => { if (!active || controller.signal.aborted) return; setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las lecturas.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [page, search, group])

  const activeGroup = GROUPS.find(item => item.id === group) ?? GROUPS[0]
  const detailItem = result.items[detailIndex] ?? null

  function changeGroup(next: HebrewReadingGroup) { setGroup(next); setPage(1); pageBeforeSearch.current = 1; setSearchInput(''); setSearch(''); setOpenId(null) }
  function clearSearch() { setSearchInput(''); setSearch(''); setPage(pageBeforeSearch.current); setOpenId(null) }
  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next = searchInput.trim(); if (!next) return clearSearch(); if (!search) pageBeforeSearch.current = page; setPage(1); setSearch(next); setOpenId(null) }
  function handleInput(value: string) { setSearchInput(value); if (value === '' && search) clearSearch() }
  function goPage(next: number) { setPage(next); setOpenId(null); setDetailIndex(0) }

  return <section aria-labelledby="reading-sentences-title" className="text-left"><div className="text-center"><p lang="he" dir="rtl" className="text-[1.25rem] font-black text-indigo-700">קְרִיאָה</p><h2 id="reading-sentences-title" className="mt-0.5 text-[1.65rem] font-black text-slate-950">Lectura de frases y oraciones</h2><p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">Lee hebreo bíblico real: comienza con frases conocidas y avanza hasta el corpus completo.</p></div><div className="mt-5"><Introduction /></div><div className="mt-4 space-y-2.5"><ModeControl mode={mode} onChange={setMode} /><ViewControl view={view} onChange={next => { setView(next); setOpenId(null); setDetailIndex(0) }} /></div><div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex min-w-max gap-2">{GROUPS.map(item => <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => changeGroup(item.id)} className={`min-h-11 rounded-full border px-4 text-[12px] font-black ${group === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}</div></div><p className="mt-2 text-center text-[12px] leading-relaxed text-slate-500">{activeGroup.description}</p><form onSubmit={submitSearch} className="mt-4 flex min-h-11 items-center gap-2 rounded-[17px] border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400" /><input value={searchInput} onChange={event => handleInput(event.target.value)} placeholder="Buscar frase en español o hebreo" className="min-w-0 flex-1 bg-transparent py-2 text-[13px] font-semibold outline-none" />{searchInput && <button type="submit" className="text-[11px] font-black text-indigo-700">Buscar</button>}</form><div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500"><span>{loading ? 'Cargando lecturas…' : `${result.total.toLocaleString('es-SV')} lecturas`}</span>{search && <button type="button" onClick={clearSearch} className="font-black text-indigo-700">Limpiar</button>}</div><div className="mt-3"><Pagination result={result} loading={loading} onPage={goPage} /></div>{error && <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">{error}</div>}{!error && !loading && result.items.length === 0 && <div className="mt-4 border-y border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No encontramos esa lectura. Borra la búsqueda para volver al listado anterior.</div>}{!error && result.items.length > 0 && <div className="mt-4">{view === 'cards' && <CardsView items={result.items} mode={mode} openId={openId} onToggle={id => setOpenId(current => current === id ? null : id)} />}{view === 'list' && <ListView items={result.items} mode={mode} />}{view === 'detail' && detailItem && <div><DetailView item={detailItem} mode={mode} /><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={detailIndex <= 0} onClick={() => setDetailIndex(value => Math.max(0, value - 1))} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button><button type="button" disabled={detailIndex >= result.items.length - 1} onClick={() => setDetailIndex(value => Math.min(result.items.length - 1, value + 1))} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button></div></div>}</div>}<div className="mt-5"><Pagination result={result} loading={loading} onPage={goPage} /></div><p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">“Todas” recorre el corpus hebreo aprobado por páginas; no es una selección manual limitada.</p></section>
}
