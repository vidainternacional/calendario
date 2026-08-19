'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, List, Rows3, Search } from 'lucide-react'

type ReadingMode = 'nikud' | 'plain'
type WordView = 'cards' | 'list' | 'detail'

type CatalogWord = {
  lexicalId: string
  strongNumber: string | null
  lemma: string
  transliteration: string | null
  partOfSpeech: string | null
  sourceGloss: string | null
  displayGlossEs: string | null
  sourceLocator: string
  providerVersion: string | null
  contentHash: string | null
}

type CatalogResponse = {
  status: 'ok' | 'sin-sesion' | 'no-disponible'
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  items: CatalogWord[]
}

const EMPTY_RESULT: CatalogResponse = {
  status: 'ok',
  page: 1,
  pageSize: 24,
  total: 0,
  totalPages: 0,
  search: '',
  items: [],
}

// Contrato anterior: “Sin ayuda” fue sustituido por “Sin niqqud”.

function withoutNiqqud(value: string) {
  return value.normalize('NFD').replace(/[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, '')
}

function ReadingIntroduction() {
  const [open, setOpen] = useState(false)
  return (
    <section className="border-y border-slate-200 text-left">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left">
        <span>
          <span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">קְרִיאָה</span>
          <span className="mt-0.5 block text-sm font-black text-slate-950">¿Cómo usamos las palabras?</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-slate-200 p-4">
          <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]">
            <p><strong>Con niqqud</strong> ves la palabra con sus puntos y signos vocálicos. Es la vista para aprender a reconocer cómo se lee.</p>
            <p><strong>Sin niqqud</strong> ves únicamente las letras, como una lectura sin ayuda. El objetivo es poder pasar de una vista a la otra sin perder la palabra.</p>
            <p>El catálogo reutiliza las entradas hebreas ya aprobadas del motor bíblico de VIDA. No duplica el léxico ni crea una segunda base de palabras.</p>
          </div>
        </div>
      )}
    </section>
  )
}

function ModeControl({ mode, onChange }: { mode: ReadingMode; onChange: (mode: ReadingMode) => void }) {
  const modes: readonly { id: ReadingMode; label: string }[] = [
    { id: 'nikud', label: 'Con niqqud' },
    { id: 'plain', label: 'Sin niqqud' },
  ]
  return (
    <div className="grid grid-cols-2 rounded-[17px] bg-slate-100 p-1" aria-label="Modo de lectura">
      {modes.map(item => (
        <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => onChange(item.id)} className={`min-h-10 rounded-[14px] px-3 text-[12px] font-black transition-colors ${mode === item.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item.label}</button>
      ))}
    </div>
  )
}

function ViewControl({ view, onChange }: { view: WordView; onChange: (view: WordView) => void }) {
  const views = [
    { id: 'cards' as const, label: 'Tarjetas', Icon: Grid2X2 },
    { id: 'list' as const, label: 'Lista', Icon: List },
    { id: 'detail' as const, label: 'Detalle', Icon: Rows3 },
  ]
  return (
    <div className="grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1" aria-label="Vista de palabras">
      {views.map(({ id, label, Icon }) => (
        <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[11px] font-black transition-colors ${view === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</button>
      ))}
    </div>
  )
}

function WordText({ word, mode, className }: { word: CatalogWord; mode: ReadingMode; className: string }) {
  return <span lang="he" dir="rtl" className={className}>{mode === 'nikud' ? word.lemma : withoutNiqqud(word.lemma)}</span>
}

function CardsView({ words, mode, selectedId, onSelect }: { words: CatalogWord[]; mode: ReadingMode; selectedId: string | null; onSelect: (word: CatalogWord) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {words.map(word => (
        <button key={word.lexicalId} type="button" aria-pressed={selectedId === word.lexicalId} onClick={() => onSelect(word)} className={`min-h-[116px] min-w-0 rounded-[22px] border px-3 py-3 text-center transition active:scale-[0.98] motion-reduce:transition-none ${selectedId === word.lexicalId ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_26px_rgba(79,70,229,0.18)]' : 'border-slate-200 bg-white text-slate-950'}`}>
          <span className={`block text-[9px] font-black uppercase tracking-[0.08em] ${selectedId === word.lexicalId ? 'text-indigo-100' : 'text-slate-400'}`}>{word.strongNumber ?? word.lexicalId}</span>
          <WordText word={word} mode={mode} className="mt-2 block break-words text-[2.4rem] font-black leading-tight" />
          <span className={`mt-2 block min-h-4 break-words text-[11px] font-bold leading-tight ${selectedId === word.lexicalId ? 'text-indigo-100' : 'text-slate-500'}`}>{word.displayGlossEs ?? 'Abrir detalle'}</span>
        </button>
      ))}
    </div>
  )
}

function ListView({ words, mode, onSelect }: { words: CatalogWord[]; mode: ReadingMode; onSelect: (word: CatalogWord) => void }) {
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {words.map(word => (
        <button key={word.lexicalId} type="button" onClick={() => onSelect(word)} className="flex min-h-[70px] w-full items-center justify-between gap-4 py-2.5 text-left">
          <div className="min-w-0">
            <WordText word={word} mode={mode} className="block break-words text-[2rem] font-black leading-tight text-slate-950" />
            <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{word.displayGlossEs ?? (word.sourceGloss ? `Glosa fuente: ${word.sourceGloss}` : 'Sin glosa disponible')}</p>
          </div>
          <div className="shrink-0 text-right"><p className="text-[10px] font-black text-indigo-700">{word.strongNumber ?? word.lexicalId}</p><p className="mt-1 text-[10px] text-slate-400">Ver detalle</p></div>
        </button>
      ))}
    </div>
  )
}

function DetailView({ word, mode, onPrevious, onNext, hasPrevious, hasNext }: { word: CatalogWord | null; mode: ReadingMode; onPrevious: () => void; onNext: () => void; hasPrevious: boolean; hasNext: boolean }) {
  if (!word) return <div className="rounded-[24px] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">Selecciona una palabra para verla en detalle.</div>

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
      <div className="p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">{word.strongNumber ?? word.lexicalId}</p>
        <WordText word={word} mode={mode} className="mt-5 block break-words text-[5rem] font-black leading-[1.25] text-slate-950" />
        <p className="mt-2 text-[12px] font-semibold text-slate-400">{mode === 'nikud' ? 'Forma con signos' : 'Forma sin niqqud'}</p>

        <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200 text-left">
          <div className="py-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Significado en español</p><p className="mt-1 text-sm font-bold text-slate-800">{word.displayGlossEs ?? 'Aún no hay una glosa española editorial aprobada.'}</p></div>
          <div className="py-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Glosa de la fuente</p><p className="mt-1 text-sm font-bold text-slate-800">{word.sourceGloss ?? 'No disponible'} <span className="font-semibold text-slate-400">{word.sourceGloss ? '(EN)' : ''}</span></p></div>
          <div className="grid grid-cols-2 gap-4 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Categoría</p><p className="mt-1 break-words text-sm font-bold text-slate-800">{word.partOfSpeech ?? 'No especificada'}</p></div><div><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Transliteración</p><p className="mt-1 break-words text-sm font-bold text-slate-800">{word.transliteration ?? 'Pendiente de versión pedagógica'}</p></div></div>
          <div className="py-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Fuente</p><p className="mt-1 break-words text-[12px] leading-relaxed text-slate-600">{word.sourceLocator}</p></div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={!hasPrevious} onClick={onPrevious} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button><button type="button" disabled={!hasNext} onClick={onNext} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button></div>
      </div>
    </article>
  )
}

export default function ReadingWordsExplorer() {
  const [mode, setMode] = useState<ReadingMode>('nikud')
  const [view, setView] = useState<WordView>('cards')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<CatalogResponse>(EMPTY_RESULT)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ page: String(page), pageSize: '24' })
    if (search) params.set('q', search)

    fetch(`/api/estudios/hebreo/palabras?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión necesita renovarse.' : 'No se pudo cargar el catálogo.')
        return response.json() as Promise<CatalogResponse>
      })
      .then(data => {
        if (!active) return
        setResult(data)
        setSelectedId(current => data.items.some(item => item.lexicalId === current) ? current : data.items[0]?.lexicalId ?? null)
      })
      .catch(cause => {
        if (!active || controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false; controller.abort() }
  }, [page, search])

  const selectedIndex = useMemo(() => result.items.findIndex(item => item.lexicalId === selectedId), [result.items, selectedId])
  const selected = selectedIndex >= 0 ? result.items[selectedIndex] : null

  function chooseWord(word: CatalogWord) {
    setSelectedId(word.lexicalId)
    setView('detail')
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <section aria-labelledby="reading-words-title" className="text-left">
      <div className="text-center">
        <p lang="he" dir="rtl" className="text-[1rem] font-black text-indigo-700">קְרִיאַת מִלִּים</p>
        <h2 id="reading-words-title" className="mt-0.5 text-[1.65rem] font-black tracking-[-0.025em] text-slate-950">Lectura y palabras</h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">Practica la misma palabra con signos o sin ellos y explora el catálogo hebreo ya existente en VIDA.</p>
      </div>

      <div className="mt-5"><ReadingIntroduction /></div>

      <div className="mt-4 space-y-2.5">
        <ModeControl mode={mode} onChange={setMode} />
        <ViewControl view={view} onChange={setView} />
      </div>

      <form onSubmit={submitSearch} className="mt-4 flex min-h-11 items-center gap-2 rounded-[17px] border border-slate-200 bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Buscar hebreo, Strong o glosa fuente" className="min-w-0 flex-1 bg-transparent py-2 text-[13px] font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
        {searchInput && <button type="submit" className="text-[11px] font-black text-indigo-700">Buscar</button>}
      </form>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
        <span>{loading ? 'Cargando palabras…' : `${result.total.toLocaleString('es-SV')} entradas hebreas`}</span>
        {search && <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }} className="font-black text-indigo-700">Limpiar búsqueda</button>}
      </div>

      {error && <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-center text-[12px] font-semibold text-amber-900">{error}</div>}

      {!error && !loading && result.items.length === 0 && <div className="mt-5 rounded-[20px] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No encontramos palabras con ese criterio.</div>}

      {!error && result.items.length > 0 && (
        <div className="mt-5">
          {view === 'cards' && <CardsView words={result.items} mode={mode} selectedId={selectedId} onSelect={chooseWord} />}
          {view === 'list' && <ListView words={result.items} mode={mode} onSelect={chooseWord} />}
          {view === 'detail' && <DetailView word={selected} mode={mode} hasPrevious={selectedIndex > 0} hasNext={selectedIndex >= 0 && selectedIndex < result.items.length - 1} onPrevious={() => selectedIndex > 0 && setSelectedId(result.items[selectedIndex - 1].lexicalId)} onNext={() => selectedIndex >= 0 && selectedIndex < result.items.length - 1 && setSelectedId(result.items[selectedIndex + 1].lexicalId)} />}
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(value => Math.max(1, value - 1))} className="flex min-h-10 items-center gap-1 rounded-full border border-slate-200 px-3 text-[11px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button>
          <p className="text-center text-[11px] font-black text-slate-500">Página {result.page} de {result.totalPages}</p>
          <button type="button" disabled={page >= result.totalPages || loading} onClick={() => setPage(value => value + 1)} className="flex min-h-10 items-center gap-1 rounded-full border border-slate-200 px-3 text-[11px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">Catálogo de lectura sobre el léxico hebreo aprobado existente. No registra dominio ni inventa traducciones españolas.</p>
    </section>
  )
}
