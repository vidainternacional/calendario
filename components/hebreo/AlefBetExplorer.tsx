'use client'

import { useMemo, useState } from 'react'
import { GalleryHorizontal, Grid2X2, RotateCcw } from 'lucide-react'
import { ALEF_BET, type AlefBetLetter } from '@/lib/hebreo/alef-bet'

type ViewMode = 'grid' | 'carousel'
type LearningGroup = 'all' | 'begadkefat' | 'sofit' | 'gutturals' | 'matres' | 'shin-sin'

const GUTTURAL_ORDERS = new Set([1, 5, 8, 16])
const MATRES_ORDERS = new Set([1, 5, 6, 10])

const LEARNING_GROUPS: readonly {
  id: LearningGroup
  label: string
  description: string
}[] = [
  { id: 'all', label: 'Todas', description: 'Las 22 letras en su orden.' },
  { id: 'begadkefat', label: 'Dagesh', description: 'Letras que cambian de sonido con el punto.' },
  { id: 'sofit', label: 'Sofit', description: 'Cinco formas usadas al final de palabra.' },
  { id: 'gutturals', label: 'Guturales', description: 'א ה ח ע como grupo de lectura.' },
  { id: 'matres', label: 'Matres', description: 'א ה ו י y su relación con vocales.' },
  { id: 'shin-sin', label: 'Shin / Sin', description: 'ש con dos lecturas según el punto.' },
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
      className={`relative shrink-0 rounded-[22px] border px-2 py-3 text-center transition-all duration-200 active:scale-[0.97] ${
        carousel ? 'w-[108px] snap-center' : 'min-h-[118px] w-full'
      } ${
        selected
          ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_28px_rgba(79,70,229,0.22)]'
          : 'border-slate-200 bg-white text-slate-950 shadow-[0_2px_10px_rgba(15,23,42,0.035)] hover:border-indigo-200'
      }`}
    >
      <span className={`absolute left-2.5 top-2 text-[10px] font-bold tabular-nums ${selected ? 'text-white/60' : 'text-slate-400'}`}>
        {letter.orden}
      </span>
      <span className={`absolute right-2.5 top-2 text-[10px] font-black tabular-nums ${selected ? 'text-white/70' : 'text-indigo-500'}`}>
        {letter.valor}
      </span>
      <span
        lang="he"
        dir="rtl"
        className="block text-[3.85rem] font-medium leading-[0.95]"
        style={{ fontFamily: "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif" }}
        aria-hidden="true"
      >
        {tileGlyph(letter, group)}
      </span>
      <span className={`mt-2 block truncate text-[11px] font-black ${selected ? 'text-white' : 'text-slate-800'}`}>
        {tileLabel(letter, group)}
      </span>
    </button>
  )
}

function LetterForms({ letter }: { letter: AlefBetLetter }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 py-4">
      <div className="px-2 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Cuadrada</p>
        <p
          lang="he"
          dir="rtl"
          className="mt-2 text-[4.2rem] font-medium leading-none text-slate-950"
          style={{ fontFamily: "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif" }}
        >
          {letter.letra}
        </p>
      </div>
      <div className="px-2 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Manuscrita</p>
        <p
          lang="he"
          dir="rtl"
          className="mt-2 text-[4.2rem] leading-none text-slate-950"
          style={{ fontFamily: "'Corsiva Hebrew', 'Arial Hebrew', sans-serif" }}
        >
          {letter.letra}
        </p>
      </div>
      <div className="px-2 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Histórica</p>
        <p dir="rtl" className="mt-2 text-[4rem] font-medium leading-none text-slate-950">
          {letter.fenicio}
        </p>
      </div>
    </div>
  )
}

function FlipButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform active:scale-90"
    >
      <RotateCcw className="h-5 w-5" aria-hidden="true" />
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
        className={`relative min-h-[310px] transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <article
          className={`absolute inset-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.07)] [backface-visibility:hidden] ${
            flipped ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex h-full flex-col px-5 py-4">
            <div className="flex items-center justify-between text-[11px] font-black tabular-nums">
              <span className="text-slate-400">{String(letter.orden).padStart(2, '0')} / 22</span>
              <span className="text-indigo-600">Valor {letter.valor}</span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center py-2 text-center">
              <span
                lang="he"
                dir="rtl"
                className="text-[8.8rem] font-medium leading-[0.82] text-slate-950 sm:text-[10rem]"
                style={{ fontFamily: "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif" }}
              >
                {glyph}
              </span>
              <h3 className="mt-3 text-2xl font-black text-slate-950">{name}</h3>
            </div>

            <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Sonido</p>
                <p className="mt-1 text-[15px] font-bold leading-snug text-slate-800">{shortSound(letter)}</p>
              </div>
              <FlipButton onClick={() => setFlipped(true)} label={`Voltear ficha de ${letter.nombre}`} />
            </div>
          </div>
        </article>

        <article
          className={`absolute inset-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.07)] [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            flipped ? '' : 'pointer-events-none'
          }`}
        >
          <div className="flex h-full flex-col px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-600">{letter.nombre}</p>
                <p className="mt-0.5 text-sm font-bold text-slate-500">Valor {letter.valor}</p>
              </div>
              <FlipButton onClick={() => setFlipped(false)} label={`Volver a la cara principal de ${letter.nombre}`} />
            </div>

            <div className="mt-3">
              <LetterForms letter={letter} />
            </div>

            <div className="mt-auto pt-4">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Significado histórico</p>
              <p className="mt-1 text-xl font-black leading-tight text-slate-950">{historicalMeaning(letter)}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">Origen del nombre o del signo; no es el significado automático de una palabra.</p>
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
    <section aria-live="polite" aria-label={`Ficha completa de ${name}`} className="my-3 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_34px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0 pt-1">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Letra {letter.orden} · Valor {letter.valor}</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">{name}</h3>
        </div>
        <span
          lang="he"
          dir="rtl"
          className="shrink-0 text-[8rem] font-medium leading-[0.8] text-slate-950"
          style={{ fontFamily: "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif" }}
        >
          {glyph}
        </span>
      </div>

      <div className="mt-4">
        <LetterForms letter={letter} />
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="py-4 sm:pr-4">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Sonido</p>
          <p className="mt-1 text-lg font-bold leading-snug text-slate-900">{shortSound(letter)}</p>
        </div>
        <div className="py-4 sm:pl-4">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Significado histórico</p>
          <p className="mt-1 text-lg font-black leading-snug text-slate-950">{historicalMeaning(letter)}</p>
        </div>
      </div>
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

export default function AlefBetExplorer() {
  const [selectedOrder, setSelectedOrder] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [learningGroup, setLearningGroup] = useState<LearningGroup>('all')

  const filteredLetters = useMemo(() => ALEF_BET.filter(letter => matchesGroup(letter, learningGroup)), [learningGroup])
  const selected = filteredLetters.find(letter => letter.orden === selectedOrder) ?? filteredLetters[0] ?? ALEF_BET[0]
  const mobileRows = useMemo(() => chunkLetters(filteredLetters, 3), [filteredLetters])
  const desktopRows = useMemo(() => chunkLetters(filteredLetters, 5), [filteredLetters])
  const activeGroup = LEARNING_GROUPS.find(group => group.id === learningGroup) ?? LEARNING_GROUPS[0]
  const selectedIndex = Math.max(0, filteredLetters.findIndex(letter => letter.orden === selected.orden))

  function changeGroup(group: LearningGroup) {
    setLearningGroup(group)
    const first = ALEF_BET.find(letter => matchesGroup(letter, group))
    if (first) setSelectedOrder(first.orden)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500">Forma · nombre · valor · sonido · significado</p>
        <span className="shrink-0 text-[10px] font-bold text-slate-400">22 · 5 Sofit</span>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-[18px] bg-slate-200/80 p-1" aria-label="Vista del Alef-bet">
        <button type="button" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} className={`flex min-h-10 items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          <Grid2X2 className="h-4 w-4" aria-hidden="true" /> Fichas
        </button>
        <button type="button" aria-pressed={viewMode === 'carousel'} onClick={() => setViewMode('carousel')} className={`flex min-h-10 items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-all ${viewMode === 'carousel' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          <GalleryHorizontal className="h-4 w-4" aria-hidden="true" /> Carrusel
        </button>
      </div>

      <div className="mb-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {LEARNING_GROUPS.map(group => {
            const active = learningGroup === group.id
            return (
              <button key={group.id} type="button" aria-pressed={active} onClick={() => changeGroup(group.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {group.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{activeGroup.description}</p>
      </div>

      {viewMode === 'grid' ? (
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
            <p className="text-[11px] font-semibold text-slate-500">Desliza y toca una letra.</p>
            <span className="shrink-0 text-[10px] font-bold text-indigo-600">{selectedIndex + 1} / {filteredLetters.length}</span>
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
