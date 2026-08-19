'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, GalleryHorizontal, Grid2X2, RotateCcw } from 'lucide-react'
import { ALEF_BET, type AlefBetLetter } from '@/lib/hebreo/alef-bet'

type ViewMode = 'grid' | 'carousel'
type LearningGroup = 'all' | 'begadkefat' | 'sofit' | 'gutturals' | 'matres' | 'shin-sin'

const GUTTURAL_ORDERS = new Set([1, 5, 8, 16])
const MATRES_ORDERS = new Set([1, 5, 6, 10])

const HEBREW_NAMES: Readonly<Record<number, string>> = {
  1: 'אָלֶף',
  2: 'בֵּית',
  3: 'גִּימֶל',
  4: 'דָּלֶת',
  5: 'הֵא',
  6: 'וָו',
  7: 'זַיִן',
  8: 'חֵית',
  9: 'טֵית',
  10: 'יוֹד',
  11: 'כַּף',
  12: 'לָמֶד',
  13: 'מֵם',
  14: 'נוּן',
  15: 'סָמֶךְ',
  16: 'עַיִן',
  17: 'פֵּא',
  18: 'צָדִי',
  19: 'קוֹף',
  20: 'רֵישׁ',
  21: 'שִׁין / שִׂין',
  22: 'תָּו',
}

const LEARNING_GROUPS: readonly {
  id: LearningGroup
  label: string
  description: string
}[] = [
  { id: 'all', label: 'Todas', description: 'Las 22 letras en su orden.' },
  { id: 'begadkefat', label: 'Dagesh', description: 'Un punto que modifica el sonido de algunas letras.' },
  { id: 'sofit', label: 'Sofit', description: 'Cinco letras cambian de forma al final de palabra.' },
  { id: 'gutturals', label: 'Guturales', description: 'Un grupo con comportamiento especial de pronunciación y vocalización.' },
  { id: 'matres', label: 'Matres', description: 'Letras que también pueden ayudar a representar vocales.' },
  { id: 'shin-sin', label: 'Shin / Sin', description: 'La misma ש cambia de lectura según la posición del punto.' },
]

const SQUARE_FONT = "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif"
const BOOK_FONT = "'Times New Roman', 'Noto Serif Hebrew', 'Arial Hebrew', serif"
const HANDWRITTEN_FONT = "'Corsiva Hebrew', 'Arial Hebrew', sans-serif"

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

function hebrewDisplayName(letter: AlefBetLetter, group: LearningGroup) {
  const base = HEBREW_NAMES[letter.orden] ?? letter.letra
  if (group === 'sofit') return `${base} סוֹפִית`
  return base
}

function LetterForms({
  glyph,
  compact = false,
}: {
  glyph: string
  compact?: boolean
}) {
  const size = compact ? 'text-[2.05rem]' : 'text-[4.35rem] sm:text-[4.7rem]'
  const label = compact ? 'sr-only' : 'text-[9px] font-black uppercase tracking-[0.1em] text-slate-400'

  return (
    <div className={`grid grid-cols-3 ${compact ? 'gap-1' : 'divide-x divide-slate-100 border-y border-slate-100 py-3.5'}`}>
      <div className="text-center">
        <p className={label}>Cuadrada</p>
        <span
          lang="he"
          dir="rtl"
          className={`${compact ? '' : 'mt-2 block'} ${size} font-medium leading-none`}
          style={{ fontFamily: SQUARE_FONT }}
        >
          {glyph}
        </span>
      </div>
      <div className="text-center">
        <p className={label}>Libro</p>
        <span
          lang="he"
          dir="rtl"
          className={`${compact ? '' : 'mt-2 block'} ${size} font-medium leading-none`}
          style={{ fontFamily: BOOK_FONT }}
        >
          {glyph}
        </span>
      </div>
      <div className="text-center">
        <p className={label}>Manuscrita</p>
        <span
          lang="he"
          dir="rtl"
          className={`${compact ? '' : 'mt-2 block'} ${size} leading-none`}
          style={{ fontFamily: HANDWRITTEN_FONT }}
        >
          {glyph}
        </span>
      </div>
    </div>
  )
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
  const glyph = tileGlyph(letter, group)
  const name = tileLabel(letter, group)

  return (
    <button
      type="button"
      dir="ltr"
      aria-pressed={selected}
      aria-label={`${name}, valor ${letter.valor}`}
      onClick={onSelect}
      className={`relative shrink-0 rounded-[24px] border px-2.5 pb-3 pt-4 text-center transition-all duration-200 active:scale-[0.97] motion-reduce:transition-none ${
        carousel ? 'w-[118px] snap-center' : 'min-h-[138px] w-full'
      } ${
        selected
          ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.22)]'
          : 'border-slate-200 bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
      }`}
    >
      <span className={`absolute left-3 top-2.5 text-[11px] font-black tabular-nums ${selected ? 'text-white/60' : 'text-slate-400'}`}>
        {letter.orden}
      </span>
      <span className={`absolute right-3 top-2.5 text-sm font-black tabular-nums ${selected ? 'text-white' : 'text-indigo-600'}`}>
        {letter.valor}
      </span>

      <span
        lang="he"
        dir="rtl"
        className="block text-[3.8rem] font-medium leading-[0.92]"
        style={{ fontFamily: SQUARE_FONT }}
        aria-hidden="true"
      >
        {glyph}
      </span>

      <div className={`mx-auto mt-1 max-w-[88px] ${selected ? 'text-white/80' : 'text-slate-500'}`} aria-hidden="true">
        <LetterForms glyph={glyph} compact />
      </div>

      <span className={`mt-1.5 block truncate text-[11px] font-black ${selected ? 'text-white' : 'text-slate-800'}`}>
        {name}
      </span>
    </button>
  )
}

function ExpandedLetterCard({
  letter,
  group,
}: {
  letter: AlefBetLetter
  group: LearningGroup
}) {
  const [flipped, setFlipped] = useState(false)
  const glyph = tileGlyph(letter, group)
  const name = tileLabel(letter, group)
  const hebrewName = hebrewDisplayName(letter, group)
  const meaning = historicalMeaning(letter)

  return (
    <button
      type="button"
      aria-pressed={flipped}
      aria-label={`Voltear ficha de ${name}`}
      onClick={() => setFlipped(value => !value)}
      className="my-4 block w-full rounded-[30px] text-left [perspective:1400px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <span className="sr-only">Toca cualquier parte de la ficha para voltearla.</span>

      <span
        className={`relative block min-h-[440px] transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <span
          className={`absolute inset-0 flex flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.13)] ring-1 ring-white [backface-visibility:hidden] ${
            flipped ? 'pointer-events-none' : ''
          }`}
        >
          <span className="mb-3 block h-1 w-12 rounded-full bg-indigo-500/80" aria-hidden="true" />

          <span className="flex items-start justify-between gap-4">
            <span className="min-w-0">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-2xl font-black tracking-[-0.02em] text-slate-950">{name}</span>
                <span lang="he" dir="rtl" className="text-xl font-bold text-indigo-700">
                  {hebrewName}
                </span>
              </span>
            </span>

            <span className="shrink-0 text-right">
              <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Valor</span>
              <span className="mt-0.5 block text-3xl font-black tabular-nums leading-none text-indigo-600">
                {letter.valor}
              </span>
            </span>
          </span>

          <span className="flex flex-1 flex-col items-center justify-center py-2 text-center">
            <span
              lang="he"
              dir="rtl"
              className="block text-[9.8rem] font-medium leading-[0.78] text-slate-950 sm:text-[10.8rem]"
              style={{ fontFamily: SQUARE_FONT }}
            >
              {glyph}
            </span>

            <span className="mt-4 block w-full">
              <LetterForms glyph={glyph} />
            </span>
          </span>

          <span className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-4">
            <span className="pr-4">
              <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Sonido</span>
              <span className="mt-1 block text-[15px] font-bold leading-snug text-slate-800">
                {shortSound(letter)}
              </span>
            </span>
            <span className="pl-4">
              <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Significado</span>
              <span className="mt-1 block text-[15px] font-black leading-snug text-slate-950">
                {meaning}
              </span>
            </span>
          </span>

          <RotateCcw className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 text-slate-300" aria-hidden="true" />
        </span>

        <span
          className={`absolute inset-0 flex flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.13)] ring-1 ring-white [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            flipped ? '' : 'pointer-events-none'
          }`}
        >
          <span className="mb-3 block h-1 w-12 rounded-full bg-indigo-500/80" aria-hidden="true" />

          <span className="flex items-start justify-between gap-4">
            <span>
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-2xl font-black text-slate-950">{name}</span>
                <span lang="he" dir="rtl" className="text-xl font-bold text-indigo-700">
                  {hebrewName}
                </span>
              </span>
              <span className="mt-1 block text-sm font-bold text-slate-500">Valor {letter.valor}</span>
            </span>
            <RotateCcw className="pointer-events-none mt-1 h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
          </span>

          <span className="mt-5 block border-t border-slate-100 pt-4">
            <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Significado del nombre</span>
            <span className="mt-1 block text-2xl font-black leading-tight text-slate-950">{meaning}</span>
            <span className="mt-2 block text-sm leading-relaxed text-slate-600">{letter.origenNombre}</span>
          </span>

          <span className="mt-4 block border-t border-slate-100 pt-4">
            <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Pronunciación</span>
            <span className="mt-1 block text-[15px] font-bold leading-relaxed text-slate-800">{letter.pronunciacion}</span>
          </span>

          <span className="mt-4 block border-t border-slate-100 pt-4">
            <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Ejemplo</span>
            <span className="mt-2 flex items-baseline justify-between gap-4">
              <span lang="he" dir="rtl" className="text-[2.6rem] font-medium leading-none text-slate-950" style={{ fontFamily: SQUARE_FONT }}>
                {letter.ejemplo.palabra}
              </span>
              <span className="text-right text-sm font-bold text-slate-600">{letter.ejemplo.significado}</span>
            </span>
          </span>

          {(letter.formaFinal || letter.variantes?.length) && (
            <span className="mt-4 block border-t border-slate-100 pt-4">
              <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Formas relacionadas</span>
              <span className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
                {letter.formaFinal && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
                    Final
                    <span lang="he" dir="rtl" className="text-xl text-slate-950">{letter.formaFinal}</span>
                  </span>
                )}
                {letter.variantes?.slice(0, 2).map(variant => (
                  <span key={variant} className="rounded-full bg-slate-100 px-3 py-1.5">
                    {variant}
                  </span>
                ))}
              </span>
            </span>
          )}
        </span>
      </span>
    </button>
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
    <div className="space-y-3">
      {rows.map(row => {
        const selectedInRow = row.some(letter => letter.orden === selected.orden)
        return (
          <div key={row[0]?.orden}>
            <div dir="rtl" className={`grid gap-3 ${columnsClass}`}>
              {row.map(letter => (
                <LetterTile
                  key={letter.orden}
                  letter={letter}
                  selected={selected.orden === letter.orden}
                  onSelect={() => onSelect(letter.orden)}
                  group={group}
                />
              ))}
            </div>
            {selectedInRow && (
              <ExpandedLetterCard key={`${selected.orden}-${group}`} letter={selected} group={group} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AlefBetExplorer({ simpleMode = true }: { simpleMode?: boolean }) {
  const [selectedOrder, setSelectedOrder] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [learningGroup, setLearningGroup] = useState<LearningGroup>('all')
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  const filteredLetters = useMemo(
    () => ALEF_BET.filter(letter => matchesGroup(letter, learningGroup)),
    [learningGroup],
  )
  const selected =
    filteredLetters.find(letter => letter.orden === selectedOrder) ??
    filteredLetters[0] ??
    ALEF_BET[0]
  const mobileRows = useMemo(() => chunkLetters(filteredLetters, 3), [filteredLetters])
  const desktopRows = useMemo(() => chunkLetters(filteredLetters, 5), [filteredLetters])
  const activeGroup =
    LEARNING_GROUPS.find(group => group.id === learningGroup) ?? LEARNING_GROUPS[0]
  const selectedIndex = Math.max(
    0,
    filteredLetters.findIndex(letter => letter.orden === selected.orden),
  )

  const visibleGroups =
    !simpleMode || moreFiltersOpen ? LEARNING_GROUPS : LEARNING_GROUPS.filter(group => group.id === 'all')

  function changeGroup(group: LearningGroup) {
    setLearningGroup(group)
    const first = ALEF_BET.find(letter => matchesGroup(letter, group))
    if (first) setSelectedOrder(first.orden)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-500">
          Toca una letra para abrir su ficha.
        </p>
        <span className="shrink-0 text-[11px] font-black text-slate-400">22 · 5 Sofit</span>
      </div>

      {!simpleMode && (
        <div className="mb-4 grid grid-cols-2 rounded-[18px] bg-slate-200/80 p-1" aria-label="Vista del Alef-bet">
          <button
            type="button"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Grid2X2 className="h-4 w-4" aria-hidden="true" />
            Fichas
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'carousel'}
            onClick={() => setViewMode('carousel')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-all ${
              viewMode === 'carousel' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
            }`}
          >
            <GalleryHorizontal className="h-4 w-4" aria-hidden="true" />
            Carrusel
          </button>
        </div>
      )}

      <div className="mb-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {visibleGroups.map(group => {
            const active = learningGroup === group.id
            return (
              <button
                key={group.id}
                type="button"
                aria-pressed={active}
                onClick={() => changeGroup(group.id)}
                className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-bold transition-colors ${
                  active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {group.label}
              </button>
            )
          })}

          {simpleMode && (
            <button
              type="button"
              aria-expanded={moreFiltersOpen}
              onClick={() => setMoreFiltersOpen(value => !value)}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-4 text-xs font-bold text-slate-600"
            >
              Más filtros
              <ChevronDown className={`h-4 w-4 transition-transform ${moreFiltersOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{activeGroup.description}</p>
      </div>

      {viewMode === 'grid' || simpleMode ? (
        <>
          <div className="sm:hidden" aria-label="Alef-bet hebreo en fichas">
            <GridRows
              rows={mobileRows}
              selected={selected}
              onSelect={setSelectedOrder}
              columnsClass="grid-cols-3"
              group={learningGroup}
            />
          </div>
          <div className="hidden sm:block" aria-label="Alef-bet hebreo en fichas">
            <GridRows
              rows={desktopRows}
              selected={selected}
              onSelect={setSelectedOrder}
              columnsClass="grid-cols-5"
              group={learningGroup}
            />
          </div>
        </>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold text-slate-500">Desliza y toca una letra.</p>
            <span className="shrink-0 text-[11px] font-bold text-indigo-600">
              {selectedIndex + 1} / {filteredLetters.length}
            </span>
          </div>

          <div
            dir="rtl"
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-1 sm:px-1"
            aria-label="Alef-bet hebreo en carrusel"
          >
            {filteredLetters.map(letter => (
              <LetterTile
                key={letter.orden}
                letter={letter}
                selected={selected.orden === letter.orden}
                onSelect={() => setSelectedOrder(letter.orden)}
                group={learningGroup}
                carousel
              />
            ))}
          </div>

          <ExpandedLetterCard key={`${selected.orden}-${learningGroup}`} letter={selected} group={learningGroup} />
        </div>
      )}
    </div>
  )
}
