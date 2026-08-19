'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, GalleryHorizontal, Grid2X2, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { ALEF_BET, type AlefBetLetter } from '@/lib/hebreo/alef-bet'

type ViewMode = 'grid' | 'carousel'
type LearningGroup = 'all' | 'begadkefat' | 'sofit' | 'gutturals' | 'matres' | 'shin-sin'

const GUTTURAL_ORDERS = new Set([1, 5, 8, 16])
const MATRES_ORDERS = new Set([1, 5, 6, 10])

const LEARNING_GROUPS: readonly {
  id: Exclude<LearningGroup, 'all'>
  label: string
  description: string
}[] = [
  { id: 'begadkefat', label: 'Dagesh', description: 'Un punto que puede cambiar el sonido de algunas letras.' },
  { id: 'sofit', label: 'Sofit', description: 'Cinco letras con una forma especial al final de una palabra.' },
  { id: 'gutturals', label: 'Guturales', description: 'Letras que se producen más hacia la garganta.' },
  { id: 'matres', label: 'Matres', description: 'Letras que, en ciertos contextos, ayudan a indicar vocales.' },
  { id: 'shin-sin', label: 'Shin / Sin', description: 'Una misma letra con dos lecturas según la posición del punto.' },
]

function matchesGroup(letter: AlefBetLetter, group: LearningGroup) {
  if (group === 'all') return true
  if (group === 'begadkefat') return letter.grupo === 'begadkefat'
  if (group === 'sofit') return Boolean(letter.formaFinal)
  if (group === 'gutturals') return GUTTURAL_ORDERS.has(letter.orden)
  if (group === 'matres') return MATRES_ORDERS.has(letter.orden)
  return letter.orden === 21
}

function chunkLetters(letters: readonly AlefBetLetter[], size: number) {
  const rows: AlefBetLetter[][] = []
  for (let index = 0; index < letters.length; index += size) {
    rows.push(letters.slice(index, index + size) as AlefBetLetter[])
  }
  return rows
}

function shortSound(letter: AlefBetLetter) {
  return letter.sonidoPedagogico.split(/[.;]/)[0]?.trim() || letter.sonidoPedagogico
}

function beginnerSound(letter: AlefBetLetter) {
  if (letter.orden === 1) return 'Generalmente no tiene un sonido propio fuerte; ayuda a sostener la vocal.'
  if (letter.orden === 5) return 'Suena como una h suave aspirada; no como la h muda del español.'
  if (letter.orden === 8) return 'Es un sonido de garganta. No tiene un equivalente exacto en español.'
  if (letter.orden === 16) return 'Es una consonante gutural y puede sentirse más profunda que una vocal española.'
  if (letter.orden === 21) return 'Con punto a la derecha suena sh; con punto a la izquierda suena s.'
  return letter.pronunciacion
}

function historicalMeaning(letter: AlefBetLetter) {
  const quoted = letter.origenNombre.match(/[“"]([^”"]+)[”"]/)
  return quoted?.[1]?.trim() || letter.ideaHistorica.split(/[.;]/)[0]?.trim() || letter.ideaHistorica
}

function dageshGlyph(letter: AlefBetLetter) {
  return `${letter.letra}ּ`
}

function tileGlyph(letter: AlefBetLetter, group: LearningGroup) {
  if (group === 'sofit' && letter.formaFinal) return letter.formaFinal
  if (group === 'begadkefat') return dageshGlyph(letter)
  if (group === 'shin-sin') return 'שׁ'
  return letter.letra
}

function tileLabel(letter: AlefBetLetter, group: LearningGroup) {
  if (group === 'sofit') return `${letter.nombre} sofit`
  if (group === 'begadkefat') return `${letter.nombre} + dagesh`
  return letter.nombre
}

function LetterTile({
  letter,
  selected,
  onSelect,
  group,
  carousel = false,
}: {
  letter: AlefBetLetter
  selected: boolean
  onSelect: () => void
  group: LearningGroup
  carousel?: boolean
}) {
  return (
    <button
      type="button"
      dir="ltr"
      aria-pressed={selected}
      aria-label={`${tileLabel(letter, group)}, valor ${letter.valor}`}
      onClick={onSelect}
      className={`relative shrink-0 rounded-[22px] border px-2 py-3 text-center transition-all duration-200 active:scale-[0.97] motion-reduce:transition-none ${
        carousel ? 'w-[112px] snap-center' : 'min-h-[124px] w-full'
      } ${
        selected
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-200 bg-white text-slate-950 hover:border-indigo-200'
      }`}
    >
      <span className={`absolute left-3 top-2.5 text-xs font-bold tabular-nums ${selected ? 'text-white/70' : 'text-slate-400'}`}>
        {letter.orden}
      </span>
      <span className={`absolute right-3 top-2.5 text-xs font-black tabular-nums ${selected ? 'text-white/80' : 'text-indigo-600'}`}>
        {letter.valor}
      </span>
      <span
        lang="he"
        dir="rtl"
        className="block pt-1 text-[4rem] font-medium leading-[0.95]"
        style={{ fontFamily: "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif" }}
        aria-hidden="true"
      >
        {tileGlyph(letter, group)}
      </span>
      <span className={`mt-2 block truncate text-[13px] font-black ${selected ? 'text-white' : 'text-slate-800'}`}>
        {tileLabel(letter, group)}
      </span>
    </button>
  )
}

function LetterForms({ letter }: { letter: AlefBetLetter }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 py-4">
      <div className="px-2 text-center">
        <p className="text-xs font-bold text-slate-500">Cuadrada</p>
        <p
          lang="he"
          dir="rtl"
          className="mt-2 text-[4.5rem] font-medium leading-none text-slate-950"
          style={{ fontFamily: "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif" }}
        >
          {letter.letra}
        </p>
      </div>
      <div className="px-2 text-center">
        <p className="text-xs font-bold text-slate-500">Manuscrita</p>
        <p
          lang="he"
          dir="rtl"
          className="mt-2 text-[4.5rem] leading-none text-slate-950"
          style={{ fontFamily: "'Corsiva Hebrew', 'Arial Hebrew', sans-serif" }}
        >
          {letter.letra}
        </p>
      </div>
      <div className="px-2 text-center">
        <p className="text-xs font-bold text-slate-500">Histórica</p>
        <p dir="rtl" className="mt-2 text-[4.25rem] font-medium leading-none text-slate-950">
          {letter.fenicio}
        </p>
      </div>
    </div>
  )
}

function FlipButton({ onClick, label, text }: { onClick: () => void; label: string; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-black text-slate-700 transition-transform active:scale-[0.97] motion-reduce:transition-none"
    >
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      {text}
    </button>
  )
}

function CompactLetterCard({ letter, group }: { letter: AlefBetLetter; group: LearningGroup }) {
  const [flipped, setFlipped] = useState(false)
  const glyph = tileGlyph(letter, group)
  const name = tileLabel(letter, group)

  return (
    <section className="my-3 [perspective:1200px]" aria-live="polite" aria-label={`Ficha de ${name}`}>
      <div
        className={`relative min-h-[430px] transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <article
          className={`absolute inset-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white [backface-visibility:hidden] ${
            flipped ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex h-full flex-col px-5 py-5">
            <div className="flex items-center justify-between text-[13px] font-black tabular-nums">
              <span className="text-slate-500">{letter.orden} de 22</span>
              <span className="text-indigo-700">Valor {letter.valor}</span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center py-3 text-center">
              <span
                lang="he"
                dir="rtl"
                className="text-[9.5rem] font-medium leading-[0.8] text-slate-950 sm:text-[11rem]"
                style={{ fontFamily: "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif" }}
              >
                {glyph}
              </span>
              <h3 className="mt-4 text-[1.7rem] font-black text-slate-950">{name}</h3>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">Sonido</p>
              <p className="mt-1 text-base font-black leading-snug text-slate-900">{shortSound(letter)}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{beginnerSound(letter)}</p>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">Ejemplo</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span lang="he" dir="rtl" className="text-3xl font-medium text-slate-950">{letter.ejemplo.palabra}</span>
                  <span className="text-[15px] font-bold text-slate-600">{letter.ejemplo.significado}</span>
                </div>
              </div>
              <FlipButton onClick={() => setFlipped(true)} label={`Ver formas y significado de ${letter.nombre}`} text="Ver formas" />
            </div>
          </div>
        </article>

        <article
          className={`absolute inset-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            flipped ? '' : 'pointer-events-none'
          }`}
        >
          <div className="flex h-full flex-col px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold text-indigo-700" lang="he" dir="rtl">{letter.letra}</p>
                <p className="text-xl font-black text-slate-950">{letter.nombre}</p>
              </div>
              <FlipButton onClick={() => setFlipped(false)} label={`Volver a la cara principal de ${letter.nombre}`} text="Volver" />
            </div>

            <div className="mt-5">
              <LetterForms letter={letter} />
            </div>

            <div className="mt-auto border-t border-slate-100 pt-5">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">Significado histórico</p>
              <p className="mt-2 text-2xl font-black leading-tight text-slate-950">{historicalMeaning(letter)}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">Describe el origen del nombre o del signo. No es el significado automático de una palabra bíblica.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

function CarouselLetterDetail({ letter, group }: { letter: AlefBetLetter; group: LearningGroup }) {
  const glyph = tileGlyph(letter, group)
  const name = tileLabel(letter, group)

  return (
    <section aria-live="polite" aria-label={`Ficha completa de ${name}`} className="my-3 rounded-[28px] border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0 pt-1">
          <p className="text-[13px] font-bold text-slate-500">{letter.orden} de 22 · Valor {letter.valor}</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">{name}</h3>
        </div>
        <span
          lang="he"
          dir="rtl"
          className="shrink-0 text-[9rem] font-medium leading-[0.8] text-slate-950"
          style={{ fontFamily: "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif" }}
        >
          {glyph}
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">Sonido</p>
        <p className="mt-1 text-lg font-black leading-snug text-slate-900">{shortSound(letter)}</p>
        <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{beginnerSound(letter)}</p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">Ejemplo</p>
          <p lang="he" dir="rtl" className="mt-1 text-4xl font-medium text-slate-950">{letter.ejemplo.palabra}</p>
          <p className="mt-1 text-[15px] font-bold text-slate-600">{letter.ejemplo.significado}</p>
        </div>
        <p className="max-w-[45%] text-right text-sm font-bold text-slate-500">{historicalMeaning(letter)}</p>
      </div>

      <details className="group mt-4 border-t border-slate-100 pt-1">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-black text-slate-800 marker:content-none">
          Ver formas de escritura
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <LetterForms letter={letter} />
      </details>
    </section>
  )
}

function GridRows({
  rows,
  selected,
  onSelect,
  columnsClass,
  group,
}: {
  rows: AlefBetLetter[][]
  selected: AlefBetLetter
  onSelect: (order: number) => void
  columnsClass: string
  group: LearningGroup
}) {
  return (
    <div className="space-y-2.5">
      {rows.map(row => {
        const selectedInRow = row.some(letter => letter.orden === selected.orden)
        return (
          <div key={row[0]?.orden}>
            <div dir="rtl" className={`grid gap-2.5 ${columnsClass}`}>
              {row.map(letter => (
                <LetterTile key={letter.orden} letter={letter} selected={selected.orden === letter.orden} onSelect={() => onSelect(letter.orden)} group={group} />
              ))}
            </div>
            {selectedInRow && <CompactLetterCard key={`${selected.orden}-${group}`} letter={selected} group={group} />}
          </div>
        )
      })}
    </div>
  )
}

export default function AlefBetExplorer({ simpleMode = false }: { simpleMode?: boolean }) {
  const [selectedOrder, setSelectedOrder] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [learningGroup, setLearningGroup] = useState<LearningGroup>('all')
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  const filteredLetters = useMemo(() => ALEF_BET.filter(letter => matchesGroup(letter, learningGroup)), [learningGroup])
  const selected = filteredLetters.find(letter => letter.orden === selectedOrder) ?? filteredLetters[0] ?? ALEF_BET[0]
  const mobileRows = useMemo(() => chunkLetters(filteredLetters, 3), [filteredLetters])
  const desktopRows = useMemo(() => chunkLetters(filteredLetters, 5), [filteredLetters])
  const activeGroup = LEARNING_GROUPS.find(group => group.id === learningGroup)
  const selectedIndex = Math.max(0, filteredLetters.findIndex(letter => letter.orden === selected.orden))

  function changeGroup(group: LearningGroup) {
    setLearningGroup(group)
    const first = ALEF_BET.find(letter => matchesGroup(letter, group))
    if (first) setSelectedOrder(first.orden)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">Toca una letra para estudiarla.</p>
        <span className="shrink-0 text-xs font-bold text-slate-400">22 letras</span>
      </div>

      {!simpleMode && (
        <div className="mb-4 grid grid-cols-2 rounded-[18px] bg-slate-200/80 p-1" aria-label="Vista del Alef-bet">
          <button type="button" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-bold transition-all motion-reduce:transition-none ${viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
            <Grid2X2 className="h-4 w-4" aria-hidden="true" /> Fichas
          </button>
          <button type="button" aria-pressed={viewMode === 'carousel'} onClick={() => setViewMode('carousel')} className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-bold transition-all motion-reduce:transition-none ${viewMode === 'carousel' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
            <GalleryHorizontal className="h-4 w-4" aria-hidden="true" /> Carrusel
          </button>
        </div>
      )}

      {!simpleMode && (
        <div className="mb-5">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              aria-pressed={learningGroup === 'all'}
              onClick={() => changeGroup('all')}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${learningGroup === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Todas
            </button>
            <button
              type="button"
              aria-expanded={moreFiltersOpen}
              onClick={() => setMoreFiltersOpen(value => !value)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold ${moreFiltersOpen || learningGroup !== 'all' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Más filtros
            </button>
          </div>

          {moreFiltersOpen && (
            <div className="mt-3 border-y border-slate-200 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {LEARNING_GROUPS.map(group => {
                  const active = learningGroup === group.id
                  return (
                    <button
                      key={group.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => changeGroup(group.id)}
                      className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200'}`}
                    >
                      {group.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{activeGroup?.description ?? 'Elige un grupo para estudiarlo por separado.'}</p>
            </div>
          )}
        </div>
      )}

      {simpleMode || viewMode === 'grid' ? (
        <>
          <div className="sm:hidden" aria-label="Alef-bet hebreo en fichas">
            <GridRows rows={mobileRows} selected={selected} onSelect={setSelectedOrder} columnsClass="grid-cols-3" group={learningGroup} />
          </div>
          <div className="hidden sm:block" aria-label="Alef-bet hebreo en fichas">
            <GridRows rows={desktopRows} selected={selected} onSelect={setSelectedOrder} columnsClass="grid-cols-5" group={learningGroup} />
          </div>
        </>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-slate-500">Desliza y toca una letra.</p>
            <span className="shrink-0 text-xs font-bold text-indigo-600">{selectedIndex + 1} / {filteredLetters.length}</span>
          </div>
          <div dir="rtl" className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-1 sm:px-1" aria-label="Alef-bet hebreo en carrusel">
            {filteredLetters.map(letter => (
              <LetterTile key={letter.orden} letter={letter} selected={selected.orden === letter.orden} onSelect={() => setSelectedOrder(letter.orden)} group={learningGroup} carousel />
            ))}
          </div>
          <CarouselLetterDetail key={`${selected.orden}-${learningGroup}`} letter={selected} group={learningGroup} />
        </div>
      )}
    </div>
  )
}
