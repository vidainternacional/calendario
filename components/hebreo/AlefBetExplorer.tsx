'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, GalleryHorizontal, Grid2X2, RotateCcw } from 'lucide-react'
import { ALEF_BET, type AlefBetLetter } from '@/lib/hebreo/alef-bet'

type ViewMode = 'grid' | 'carousel'
type LearningGroup = 'all' | 'part-1' | 'part-2' | 'begadkefat' | 'sofit' | 'gutturals' | 'matres' | 'shin-sin'

const GUTTURAL_ORDERS = new Set([1, 5, 8, 16])
const MATRES_ORDERS = new Set([1, 5, 6, 10])

const HEBREW_NAMES: Readonly<Record<number, string>> = {
  1: 'אָלֶף', 2: 'בֵּית', 3: 'גִּימֶל', 4: 'דָּלֶת', 5: 'הֵא', 6: 'וָו', 7: 'זַיִן', 8: 'חֵית', 9: 'טֵית', 10: 'יוֹד', 11: 'כַּף', 12: 'לָמֶד', 13: 'מֵם', 14: 'נוּן', 15: 'סָמֶךְ', 16: 'עַיִן', 17: 'פֵּא', 18: 'צָדִי', 19: 'קוֹף', 20: 'רֵישׁ', 21: 'שִׁין / שִׂין', 22: 'תָּו',
}

const LEARNING_GROUPS: readonly { id: LearningGroup; label: string; description: string }[] = [
  { id: 'all', label: 'Todas', description: 'Las 22 letras en su orden.' },
  { id: 'part-1', label: 'Alef–Yod', description: 'Primer tramo de aprendizaje: las letras 1 a 10, desde Alef hasta Yod.' },
  { id: 'part-2', label: 'Kaf–Tav', description: 'Segundo tramo de aprendizaje: las letras 11 a 22, desde Kaf hasta Tav.' },
  { id: 'begadkefat', label: 'Dagesh', description: 'Un punto dentro de algunas letras que puede cambiar su sonido.' },
  { id: 'sofit', label: 'Sofit', description: 'Cinco letras cambian de forma cuando aparecen al final de una palabra.' },
  { id: 'gutturals', label: 'Guturales', description: 'Letras articuladas en la garganta que siguen algunas reglas especiales de pronunciación y vocalización.' },
  { id: 'matres', label: 'Matres', description: 'Letras que, además de ser consonantes, pueden ayudar a representar una vocal.' },
  { id: 'shin-sin', label: 'Shin / Sin', description: 'La misma ש se lee Shin o Sin según la posición del punto.' },
]

const SQUARE_FONT = "'Arial Hebrew Scholar', 'Arial Hebrew', sans-serif"
const BOOK_FONT = "'Times New Roman', 'Noto Serif Hebrew', 'Arial Hebrew', serif"
const HANDWRITTEN_FONT = "'Corsiva Hebrew', 'Arial Hebrew', sans-serif"

function matchesGroup(letter: AlefBetLetter, group: LearningGroup) {
  if (group === 'all') return true
  if (group === 'part-1') return letter.orden <= 10
  if (group === 'part-2') return letter.orden >= 11
  if (group === 'begadkefat') return letter.grupo === 'begadkefat'
  if (group === 'sofit') return Boolean(letter.formaFinal)
  if (group === 'gutturals') return GUTTURAL_ORDERS.has(letter.orden)
  if (group === 'matres') return MATRES_ORDERS.has(letter.orden)
  return letter.orden === 21
}

function chunkLetters(letters: readonly AlefBetLetter[], size: number) {
  const rows: AlefBetLetter[][] = []
  for (let index = 0; index < letters.length; index += size) rows.push(letters.slice(index, index + size) as AlefBetLetter[])
  return rows
}

function shortSound(letter: AlefBetLetter) { return letter.sonidoPedagogico.split(/[.;]/)[0]?.trim() || letter.sonidoPedagogico }
function historicalMeaning(letter: AlefBetLetter) { const quoted = letter.origenNombre.match(/[“"]([^”"]+)[”"]/); return quoted?.[1]?.trim() || letter.ideaHistorica.split(/[.;]/)[0]?.trim() || letter.ideaHistorica }
function dageshGlyph(letter: AlefBetLetter) { return `${letter.letra}ּ` }
function tileGlyph(letter: AlefBetLetter, group: LearningGroup) { if (group === 'sofit' && letter.formaFinal) return letter.formaFinal; if (group === 'begadkefat') return dageshGlyph(letter); if (group === 'shin-sin') return 'שׁ'; return letter.letra }
function tileLabel(letter: AlefBetLetter, group: LearningGroup) { if (group === 'sofit') return `${letter.nombre} sofit`; if (group === 'begadkefat') return `${letter.nombre} + dagesh`; return letter.nombre }
function hebrewDisplayName(letter: AlefBetLetter, group: LearningGroup) { const base = HEBREW_NAMES[letter.orden] ?? letter.letra; return group === 'sofit' ? `${base} סוֹפִית` : base }

function PrimaryLetterForms({ glyph }: { glyph: string }) {
  return <div className="grid w-full grid-cols-[1fr_1.45fr_1fr] items-end gap-3 py-2 text-center"><div className="flex min-h-[128px] flex-col items-center justify-end"><span lang="he" dir="rtl" className="block text-[4.8rem] font-semibold leading-none text-slate-700" style={{ fontFamily: BOOK_FONT }}>{glyph}</span><span className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Libro</span></div><div className="flex min-h-[174px] flex-col items-center justify-end"><span lang="he" dir="rtl" className="block text-[9.6rem] font-medium leading-[0.78] text-slate-950 sm:text-[10.5rem]" style={{ fontFamily: SQUARE_FONT }}>{glyph}</span><span className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">Cuadrada</span></div><div className="flex min-h-[128px] flex-col items-center justify-end"><span lang="he" dir="rtl" className="block text-[4.8rem] leading-none text-slate-700" style={{ fontFamily: HANDWRITTEN_FONT }}>{glyph}</span><span className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Manuscrita</span></div></div>
}

function LetterTile({ letter, selected, onSelect, group, carousel = false }: { letter: AlefBetLetter; selected: boolean; onSelect: () => void; group: LearningGroup; carousel?: boolean }) {
  const glyph = tileGlyph(letter, group); const name = tileLabel(letter, group)
  return <button type="button" dir="ltr" aria-pressed={selected} aria-label={`${name}, letra ${letter.orden}, valor ${letter.valor}`} onClick={onSelect} className={`relative shrink-0 rounded-[24px] border px-2.5 pb-3 pt-5 text-center transition-all duration-200 active:scale-[0.97] motion-reduce:transition-none ${carousel ? 'w-[120px] snap-center' : 'min-h-[142px] w-full'} ${selected ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.22)]' : 'border-slate-200 bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'}`}><span className={`absolute left-3 top-2.5 text-[11px] font-black tabular-nums ${selected ? 'text-white/70' : 'text-slate-400'}`}>{letter.orden}</span><span lang="he" dir="rtl" className="block text-[4.55rem] font-medium leading-[0.95]" style={{ fontFamily: SQUARE_FONT }} aria-hidden="true">{glyph}</span><span className={`mt-3 block truncate text-[13px] font-black ${selected ? 'text-white' : 'text-slate-800'}`}>{name}</span></button>
}

function ExpandedLetterCard({ letter, group, closing = false }: { letter: AlefBetLetter; group: LearningGroup; closing?: boolean }) {
  const [flipped, setFlipped] = useState(false)
  const cardRef = useRef<HTMLButtonElement>(null)
  const glyph = tileGlyph(letter, group); const name = tileLabel(letter, group); const hebrewName = hebrewDisplayName(letter, group); const meaning = historicalMeaning(letter)

  useEffect(() => {
    const node = cardRef.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    node.animate(closing ? [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.94)' }] : [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: closing ? 180 : 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' })
  }, [closing, letter.orden])

  return <button ref={cardRef} type="button" aria-pressed={flipped} aria-label={`Voltear ficha de ${name}`} onClick={() => setFlipped(value => !value)} className="my-6 block w-full origin-top rounded-[30px] text-left [perspective:1400px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"><span className="sr-only">Toca cualquier parte de la ficha para voltearla.</span><span className={`relative block min-h-[455px] transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
    <span className={`absolute inset-0 flex flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_52px_rgba(15,23,42,0.14)] ring-1 ring-white [backface-visibility:hidden] ${flipped ? 'pointer-events-none' : ''}`}><span className="mb-3 block h-1 w-14 rounded-full bg-indigo-500/85" aria-hidden="true" /><span className="flex items-start justify-between gap-4"><span className="min-w-0"><span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1"><span className="text-[2rem] font-black leading-none tracking-[-0.025em] text-slate-950">{name}</span><span lang="he" dir="rtl" className="text-[1.55rem] font-bold leading-none text-indigo-700">{hebrewName}</span></span></span><span className="shrink-0 text-right"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Valor</span><span className="mt-1 block text-[2.8rem] font-black tabular-nums leading-none text-indigo-600">{letter.valor}</span></span></span><span className="flex flex-1 items-center justify-center py-2"><PrimaryLetterForms glyph={glyph} /></span><span className="grid grid-cols-2 gap-5 border-t border-slate-200 pt-5"><span><span className="mb-2 block h-1 w-7 rounded-full bg-indigo-500" /><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Sonido</span><span className="mt-1.5 block text-[17px] font-bold leading-snug text-slate-900">{shortSound(letter)}</span></span><span><span className="mb-2 block h-1 w-7 rounded-full bg-amber-500" /><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Significado</span><span className="mt-1.5 block text-[18px] font-black leading-snug text-slate-950">{meaning}</span></span></span><RotateCcw className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 text-slate-400" /></span>
    <span className={`absolute inset-0 flex flex-col overflow-y-auto overscroll-contain rounded-[30px] border border-slate-200 bg-white px-5 pb-8 pt-5 shadow-[0_20px_52px_rgba(15,23,42,0.14)] ring-1 ring-white [backface-visibility:hidden] [transform:rotateY(180deg)] [-webkit-overflow-scrolling:touch] touch-pan-y ${flipped ? '' : 'pointer-events-none'}`}><span className="sticky top-0 z-10 -mx-1 -mt-1 block bg-white/95 px-1 pb-3 pt-1 backdrop-blur-sm"><span className="mb-3 block h-1 w-14 rounded-full bg-indigo-500/85" /><span className="flex items-start justify-between gap-4"><span><span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1"><span className="text-[2rem] font-black leading-none text-slate-950">{name}</span><span lang="he" dir="rtl" className="text-[1.55rem] font-bold leading-none text-indigo-700">{hebrewName}</span></span><span className="mt-2 block text-sm font-bold text-slate-500">Valor {letter.valor}</span></span><RotateCcw className="pointer-events-none mt-1 h-5 w-5 shrink-0 text-slate-400" /></span></span><span className="mt-2 block border-t border-slate-100 pt-4"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Significado del nombre</span><span className="mt-1 block text-[1.65rem] font-black leading-tight text-slate-950">{meaning}</span><span className="mt-2 block text-[15px] leading-relaxed text-slate-600">{letter.origenNombre}</span></span><span className="mt-4 block border-t border-slate-100 pt-4"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Pronunciación</span><span className="mt-1 block text-[16px] font-bold leading-relaxed text-slate-800">{letter.pronunciacion}</span></span><span className="mt-4 block border-t border-slate-100 pt-4"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Ejemplo</span><span className="mt-2 flex items-baseline justify-between gap-4"><span lang="he" dir="rtl" className="text-[2.3rem] font-bold leading-none text-slate-950">{letter.ejemplo.palabra}</span><span className="text-right text-[15px] font-bold text-slate-700">{letter.ejemplo.significado}</span></span><span className="mt-3 block text-[13px] leading-relaxed text-slate-500"><span className="font-black text-slate-700">Pronunciación aproximada:</span>{' '}{letter.ejemplo.transliteracion}</span></span>{(letter.formaFinal || letter.variantes?.length) && <span className="mt-4 block border-t border-slate-100 pt-4"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Formas relacionadas</span><span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] font-bold text-slate-700">{letter.formaFinal && <span>Sofit:<span lang="he" dir="rtl" className="ml-2 text-[1.8rem] text-slate-950">{letter.formaFinal}</span></span>}{letter.variantes?.map(variant => <span key={variant}>{variant}</span>)}</span></span>}</span>
  </span></button>
}

function GroupExplanation({ item }: { item: (typeof LEARNING_GROUPS)[number] }) {
  const isLong = item.description.length > 88
  if (!isLong) return <p className="mb-5 border-l-2 border-indigo-200 pl-3 text-[13px] leading-relaxed text-slate-600"><span className="font-black text-slate-900">{item.label}</span><span aria-hidden="true"> · </span>{item.description}</p>
  return <details className="group mb-5 border-l-2 border-indigo-200 pl-3"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-[13px] font-black text-slate-900 marker:content-none">¿Qué es {item.label}?<ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" /></summary><p className="pb-1 text-[13px] leading-relaxed text-slate-600">{item.description}</p></details>
}

function AlefBetIntroduction() {
  return <details className="group mb-5 rounded-[20px] border border-slate-200 bg-white px-4"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-left marker:content-none"><span><span lang="he" dir="rtl" className="mr-2 font-black text-indigo-700">אָלֶף־בֵּית</span><span className="text-sm font-black text-slate-900">¿Qué es el Alef-Bet?</span></span><ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" /></summary><div className="border-t border-slate-100 pb-4 pt-3 text-left text-[13px] leading-relaxed text-slate-600"><p>El Alef-Bet es el alfabeto hebreo. Está formado por 22 letras consonánticas y se lee de derecha a izquierda. Cinco letras cambian de forma cuando aparecen al final de una palabra.</p><p className="mt-2">Primero aprenderás a reconocer cada signo y distinguir letras parecidas. Después combinarás las letras con vocales hasta comenzar a leer palabras reales.</p></div></details>
}

export default function AlefBetExplorer({ simpleMode = true }: { simpleMode?: boolean }) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [group, setGroup] = useState<LearningGroup>('all')
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null)
  const [closingOrder, setClosingOrder] = useState<number | null>(null)
  const filteredLetters = useMemo(() => ALEF_BET.filter(letter => matchesGroup(letter, group)), [group])
  const selectedLetter = selectedOrder == null ? null : filteredLetters.find(letter => letter.orden === selectedOrder) ?? null
  const rows = useMemo(() => chunkLetters(filteredLetters, 3), [filteredLetters])
  const activeGroup = LEARNING_GROUPS.find(item => item.id === group) ?? LEARNING_GROUPS[0]

  function selectGroup(nextGroup: LearningGroup) { setGroup(nextGroup); setSelectedOrder(null); setClosingOrder(null) }
  function toggleLetter(order: number) {
    if (selectedOrder !== order) { setClosingOrder(null); setSelectedOrder(order); return }
    setClosingOrder(order)
    window.setTimeout(() => { setSelectedOrder(current => current === order ? null : current); setClosingOrder(null) }, 190)
  }

  return <section id="alef-bet" aria-labelledby="alef-bet-title" className="pt-1"><div className="mb-4 flex items-end justify-between gap-4"><div><p lang="he" dir="rtl" className="text-[15px] font-bold text-indigo-700">אָלֶף־בֵּית</p><h3 id="alef-bet-title" className="mt-0.5 text-[1.55rem] font-black tracking-[-0.025em] text-slate-950">Alef-Bet</h3></div>{!simpleMode && <div className="inline-flex shrink-0 rounded-full bg-slate-200/70 p-1" aria-label="Vista del Alef-bet"><button type="button" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Grid2X2 className="h-4.5 w-4.5" /><span className="sr-only">Vista de fichas</span></button><button type="button" aria-pressed={viewMode === 'carousel'} onClick={() => setViewMode('carousel')} className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${viewMode === 'carousel' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><GalleryHorizontal className="h-4.5 w-4.5" /><span className="sr-only">Vista carrusel</span></button></div>}</div>
    <AlefBetIntroduction />
    <div className="mb-3 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{LEARNING_GROUPS.map(item => <button key={item.id} type="button" onClick={() => selectGroup(item.id)} aria-pressed={group === item.id} className={`min-h-11 shrink-0 snap-start rounded-full px-4 text-sm font-bold transition-colors ${group === item.id ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{item.label}</button>)}</div><GroupExplanation item={activeGroup} />
    {(simpleMode || viewMode === 'grid') ? <div className="space-y-4">{rows.map((row, rowIndex) => { const selectedInRow = selectedLetter ? row.some(letter => letter.orden === selectedLetter.orden) : false; return <div key={`${group}-${rowIndex}`}><div className="grid grid-cols-3 gap-4">{row.map(letter => <LetterTile key={`${group}-${letter.orden}`} letter={letter} selected={letter.orden === selectedOrder} onSelect={() => toggleLetter(letter.orden)} group={group} />)}</div>{selectedInRow && selectedLetter && <ExpandedLetterCard letter={selectedLetter} group={group} closing={closingOrder === selectedLetter.orden} />}</div>})}</div> : <div><div dir="rtl" className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{filteredLetters.map(letter => <LetterTile key={`${group}-${letter.orden}`} letter={letter} selected={letter.orden === selectedOrder} onSelect={() => toggleLetter(letter.orden)} group={group} carousel />)}</div>{selectedLetter && <ExpandedLetterCard letter={selectedLetter} group={group} closing={closingOrder === selectedLetter.orden} />}</div>}
  </section>
}
