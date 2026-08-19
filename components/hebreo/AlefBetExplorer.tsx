'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, List, RotateCcw, Rows3 } from 'lucide-react'
import { ALEF_BET, type AlefBetLetter } from '@/lib/hebreo/alef-bet'

type ViewMode = 'cards' | 'list' | 'detail'
type LearningGroup = 'all' | 'part-1' | 'part-2' | 'begadkefat' | 'sofit' | 'gutturals' | 'matres' | 'shin-sin'

const GUTTURAL_ORDERS = new Set([1, 5, 8, 16])
const MATRES_ORDERS = new Set([1, 5, 6, 10])

const HEBREW_NAMES: Readonly<Record<number, string>> = {
  1: 'אָלֶף', 2: 'בֵּית', 3: 'גִּימֶל', 4: 'דָּלֶת', 5: 'הֵא', 6: 'וָו', 7: 'זַיִן', 8: 'חֵית', 9: 'טֵית', 10: 'יוֹד',
  11: 'כַּף', 12: 'לָמֶד', 13: 'מֵם', 14: 'נוּן', 15: 'סָמֶךְ', 16: 'עַיִן', 17: 'פֵּא', 18: 'צָדִי', 19: 'קוֹף', 20: 'רֵישׁ', 21: 'שִׁין / שִׂין', 22: 'תָּו',
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

function shortSound(letter: AlefBetLetter) {
  return letter.sonidoPedagogico.split(/[.;]/)[0]?.trim() || letter.sonidoPedagogico
}

function historicalMeaning(letter: AlefBetLetter) {
  const quoted = letter.origenNombre.match(/[“"]([^”"]+)[”"]/)
  return quoted?.[1]?.trim() || letter.ideaHistorica.split(/[.;]/)[0]?.trim() || letter.ideaHistorica
}

function dageshGlyph(letter: AlefBetLetter) { return `${letter.letra}ּ` }
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
  return group === 'sofit' ? `${base} סוֹפִית` : base
}

function PrimaryLetterForms({ glyph }: { glyph: string }) {
  return <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-end gap-1.5 py-2 text-center sm:gap-3"><div className="flex min-h-[106px] min-w-0 flex-col items-center justify-end overflow-hidden sm:min-h-[126px]"><span lang="he" dir="rtl" className="block text-[3.55rem] font-semibold leading-none text-slate-700 sm:text-[4.7rem]" style={{ fontFamily: BOOK_FONT }}>{glyph}</span><span className="mt-3 text-[9px] font-black uppercase tracking-[0.08em] text-slate-500 sm:text-[10px] sm:tracking-[0.12em]">Libro</span></div><div className="flex min-h-[142px] min-w-0 flex-col items-center justify-end overflow-hidden sm:min-h-[170px]"><span lang="he" dir="rtl" className="block text-[7.45rem] font-medium leading-[0.78] text-slate-950 sm:text-[9.4rem]" style={{ fontFamily: SQUARE_FONT }}>{glyph}</span><span className="mt-4 text-[9px] font-black uppercase tracking-[0.08em] text-indigo-700 sm:text-[10px] sm:tracking-[0.12em]">Cuadrada</span></div><div className="flex min-h-[106px] min-w-0 flex-col items-center justify-end overflow-hidden sm:min-h-[126px]"><span lang="he" dir="rtl" className="block text-[3.55rem] leading-none text-slate-700 sm:text-[4.7rem]" style={{ fontFamily: HANDWRITTEN_FONT }}>{glyph}</span><span className="mt-3 text-[9px] font-black uppercase tracking-[0.08em] text-slate-500 sm:text-[10px] sm:tracking-[0.12em]">Manuscrita</span></div></div>
}

function ViewControl({ view, onChange }: { view: ViewMode; onChange: (view: ViewMode) => void }) {
  const views = [{ id: 'cards' as const, label: 'Tarjetas', Icon: Grid2X2 }, { id: 'list' as const, label: 'Lista', Icon: List }, { id: 'detail' as const, label: 'Detalle', Icon: Rows3 }]
  return <div className="grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1" aria-label="Vista del Alef-Bet">{views.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[11px] font-black ${view === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
}

function LetterTile({ letter, selected, onSelect, group }: { letter: AlefBetLetter; selected: boolean; onSelect: () => void; group: LearningGroup }) {
  const glyph = tileGlyph(letter, group)
  const name = tileLabel(letter, group)
  return <button type="button" dir="ltr" aria-pressed={selected} aria-label={`${name}, letra ${letter.orden}, valor ${letter.valor}`} onClick={onSelect} className={`relative min-h-[146px] w-full min-w-0 rounded-[24px] border px-2.5 pb-3 pt-5 text-center transition-all duration-200 active:scale-[0.97] motion-reduce:transition-none ${selected ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.22)]' : 'border-slate-200 bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'}`}><span className={`absolute left-3 top-2.5 text-[11px] font-black tabular-nums ${selected ? 'text-white/70' : 'text-slate-400'}`}>{letter.orden}</span><span lang="he" dir="rtl" className="block text-[4.35rem] font-medium leading-[0.95]" style={{ fontFamily: SQUARE_FONT }}>{glyph}</span><span className={`mx-auto mt-3 flex min-h-[34px] max-w-full items-center justify-center break-words px-0.5 text-[12px] font-black leading-tight ${selected ? 'text-white' : 'text-slate-800'}`}>{name}</span></button>
}

function ExpandedLetterCard({ letter, group, closing = false }: { letter: AlefBetLetter; group: LearningGroup; closing?: boolean }) {
  const [flipped, setFlipped] = useState(false)
  const cardRef = useRef<HTMLButtonElement>(null)
  const glyph = tileGlyph(letter, group)
  const name = tileLabel(letter, group)
  const hebrewName = hebrewDisplayName(letter, group)
  const meaning = historicalMeaning(letter)

  useEffect(() => {
    const node = cardRef.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    node.animate(closing ? [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.94)' }] : [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: closing ? 180 : 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' })
  }, [closing, letter.orden])

  return <button ref={cardRef} type="button" aria-pressed={flipped} aria-label={`Voltear ficha de ${name}`} onClick={() => setFlipped(value => !value)} className="my-6 block w-full origin-top rounded-[30px] text-left [perspective:1400px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"><span className="sr-only">Toca cualquier parte de la ficha para voltearla.</span><span className={`relative block h-[490px] transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none sm:h-[505px] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}><span className={`absolute inset-0 flex flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white px-4 py-5 shadow-[0_20px_52px_rgba(15,23,42,0.14)] ring-1 ring-white [backface-visibility:hidden] sm:px-5 ${flipped ? 'pointer-events-none' : ''}`}><span className="mb-3 block h-1 w-14 rounded-full bg-indigo-500/85" /><span className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><span className="min-w-0"><span className="block break-words text-[1.55rem] font-black leading-tight tracking-[-0.025em] text-slate-950 sm:text-[1.9rem]">{name}</span><span lang="he" dir="rtl" className="mt-1.5 block break-words text-[1.25rem] font-bold leading-tight text-indigo-700 sm:text-[1.45rem]">{hebrewName}</span></span><span className="shrink-0 text-right"><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Valor</span><span className="mt-1 block text-[2.35rem] font-black tabular-nums leading-none text-indigo-600 sm:text-[2.65rem]">{letter.valor}</span></span></span><span className="flex min-h-0 flex-1 items-center justify-center py-1"><PrimaryLetterForms glyph={glyph} /></span><span className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 sm:gap-5 sm:pt-5"><span className="min-w-0"><span className="mb-2 block h-1 w-7 rounded-full bg-indigo-500" /><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Sonido</span><span className="mt-1.5 block break-words text-[15px] font-bold leading-snug text-slate-900 sm:text-[17px]">{shortSound(letter)}</span></span><span className="min-w-0 pr-6"><span className="mb-2 block h-1 w-7 rounded-full bg-amber-500" /><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Significado</span><span className="mt-1.5 block break-words text-[15px] font-black leading-snug text-slate-950 sm:text-[17px]">{meaning}</span></span></span><RotateCcw className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 text-slate-400" /></span><span className={`absolute inset-0 overflow-y-auto overscroll-contain rounded-[30px] border border-slate-200 bg-white px-4 pb-8 pt-5 shadow-[0_20px_52px_rgba(15,23,42,0.14)] ring-1 ring-white [backface-visibility:hidden] [transform:rotateY(180deg)] [-webkit-overflow-scrolling:touch] touch-pan-y sm:px-5 ${flipped ? '' : 'pointer-events-none'}`}><span className="mb-3 block h-1 w-14 rounded-full bg-indigo-500/85" /><span className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><span className="min-w-0"><span className="block break-words text-[1.55rem] font-black leading-tight text-slate-950 sm:text-[1.9rem]">{name}</span><span lang="he" dir="rtl" className="mt-1.5 block break-words text-[1.25rem] font-bold leading-tight text-indigo-700 sm:text-[1.45rem]">{hebrewName}</span><span className="mt-2 block text-sm font-bold text-slate-500">Valor {letter.valor}</span></span><RotateCcw className="pointer-events-none mt-1 h-5 w-5 shrink-0 text-slate-400" /></span><span className="mt-4 block border-t border-slate-100 pt-4"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Significado del nombre</span><span className="mt-1 block break-words text-[1.45rem] font-black leading-tight text-slate-950 sm:text-[1.65rem]">{meaning}</span><span className="mt-2 block break-words text-[15px] leading-relaxed text-slate-600">{letter.origenNombre}</span></span><span className="mt-4 block border-t border-slate-100 pt-4"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Pronunciación</span><span className="mt-1 block break-words text-[15px] font-bold leading-relaxed text-slate-800 sm:text-[16px]">{letter.pronunciacion}</span></span><span className="mt-4 block border-t border-slate-100 pt-4"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Ejemplo</span><span className="mt-2 grid grid-cols-2 items-baseline gap-3"><span lang="he" dir="rtl" className="min-w-0 break-words text-[2.05rem] font-bold leading-tight text-slate-950 sm:text-[2.3rem]">{letter.ejemplo.palabra}</span><span className="min-w-0 break-words text-right text-[14px] font-bold leading-snug text-slate-700 sm:text-[15px]">{letter.ejemplo.significado}</span></span><span className="mt-3 block break-words text-[13px] leading-relaxed text-slate-500"><span className="font-black text-slate-700">Pronunciación aproximada:</span> {letter.ejemplo.transliteracion}</span></span>{(letter.formaFinal || letter.variantes?.length) && <span className="mt-4 block border-t border-slate-100 pt-4"><span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Formas relacionadas</span><span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 break-words text-[15px] font-bold text-slate-700">{letter.formaFinal && <span>Sofit:<span lang="he" dir="rtl" className="ml-2 text-[1.8rem] text-slate-950">{letter.formaFinal}</span></span>}{letter.variantes?.map(variant => <span key={variant}>{variant}</span>)}</span></span>}</span></span></button>
}

function ListView({ letters, group }: { letters: readonly AlefBetLetter[]; group: LearningGroup }) {
  return <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white"><div className="grid grid-cols-[46px_minmax(66px,1fr)_44px_72px_minmax(78px,1.2fr)] gap-2 border-b border-slate-200 bg-slate-50 px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.05em] text-slate-400"><span>Signo</span><span>Nombre</span><span>Valor</span><span>Sonido</span><span>Significado</span></div>{letters.map(letter => <div key={`${group}-${letter.orden}`} className="grid min-h-[68px] grid-cols-[46px_minmax(66px,1fr)_44px_72px_minmax(78px,1.2fr)] items-center gap-2 border-b border-slate-100 px-2 py-2 text-center last:border-b-0"><span lang="he" dir="rtl" className="text-[2.2rem] font-medium leading-none text-indigo-700" style={{ fontFamily: SQUARE_FONT }}>{tileGlyph(letter, group)}</span><span className="break-words text-[11px] font-black leading-tight text-slate-900">{tileLabel(letter, group)}</span><span className="text-[13px] font-black text-indigo-700">{letter.valor}</span><span className="break-words text-[10px] font-bold leading-tight text-slate-700">{shortSound(letter)}</span><span className="break-words text-[10px] font-bold leading-tight text-slate-600">{historicalMeaning(letter)}</span></div>)}</div>
}

function GroupExplanation({ item }: { item: (typeof LEARNING_GROUPS)[number] }) {
  return <p className="mb-5 border-l-2 border-indigo-200 pl-3 text-left text-[13px] leading-relaxed text-slate-600"><span className="font-black text-slate-900">{item.label}</span><span aria-hidden="true"> · </span>{item.description}</p>
}

function AlefBetIntroduction() {
  const [open, setOpen] = useState(false)
  return <div className="mb-5 border-y border-slate-200"><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-center gap-2 px-3 text-sm font-black text-indigo-700">¿Qué es el Alef-Bet?<ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <section className="border-t border-slate-200 p-4 text-left"><div className="max-h-72 space-y-4 overflow-y-auto overscroll-contain pr-1 text-[13px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]"><p><strong className="text-slate-900">Alef-Bet</strong> es el nombre tradicional del alfabeto hebreo. El hebreo bíblico se escribe con 22 letras base y se lee de derecha a izquierda.</p><p>La escritura que estudiarás aquí comienza por reconocer cada letra y distinguirla de formas parecidas. Después se incorporan vocales, combinaciones, palabras y lectura bíblica.</p><p>Cinco letras tienen una forma especial cuando aparecen al final de una palabra. También encontrarás signos como el dagesh y los puntos vocálicos; se explicarán progresivamente para no sobrecargar el aprendizaje.</p><p>La meta no es memorizar una tabla: <strong className="text-slate-900">reconocer → distinguir → combinar → leer → comprender</strong>.</p></div></section>}</div>
}

export default function AlefBetExplorer({ simpleMode = true }: { simpleMode?: boolean }) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [group, setGroup] = useState<LearningGroup>('all')
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null)
  const [closingOrder, setClosingOrder] = useState<number | null>(null)
  const [detailIndex, setDetailIndex] = useState(0)
  const filteredLetters = useMemo(() => ALEF_BET.filter(letter => matchesGroup(letter, group)), [group])
  const selectedLetter = selectedOrder == null ? null : filteredLetters.find(letter => letter.orden === selectedOrder) ?? null
  const rows = useMemo(() => chunkLetters(filteredLetters, 3), [filteredLetters])
  const activeGroup = LEARNING_GROUPS.find(item => item.id === group) ?? LEARNING_GROUPS[0]
  const detailLetter = filteredLetters[detailIndex] ?? null

  function selectGroup(nextGroup: LearningGroup) { setGroup(nextGroup); setSelectedOrder(null); setClosingOrder(null); setDetailIndex(0) }
  function changeView(next: ViewMode) { setViewMode(next); setSelectedOrder(null); setClosingOrder(null); setDetailIndex(0) }
  function toggleLetter(order: number) {
    if (selectedOrder !== order) { setClosingOrder(null); setSelectedOrder(order); return }
    setClosingOrder(order)
    window.setTimeout(() => { setSelectedOrder(current => current === order ? null : current); setClosingOrder(null) }, 190)
  }

  return <section id="alef-bet" aria-labelledby="alef-bet-title" className="pt-1"><div className="mb-4 text-center"><p lang="he" dir="rtl" className="text-[15px] font-bold text-indigo-700">אָלֶף־בֵּית</p><h3 id="alef-bet-title" className="mt-0.5 text-[1.55rem] font-black tracking-[-0.025em] text-slate-950">Alef-Bet</h3></div><AlefBetIntroduction />{!simpleMode && <div className="mb-4"><ViewControl view={viewMode} onChange={changeView} /></div>}<div className="mb-3 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{LEARNING_GROUPS.map(item => <button key={item.id} type="button" onClick={() => selectGroup(item.id)} aria-pressed={group === item.id} className={`min-h-11 shrink-0 snap-start rounded-full px-4 text-sm font-bold ${group === item.id ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{item.label}</button>)}</div><GroupExplanation item={activeGroup} />{(simpleMode || viewMode === 'cards') && <div className="space-y-4">{rows.map((row, rowIndex) => { const selectedInRow = selectedLetter ? row.some(letter => letter.orden === selectedLetter.orden) : false; return <div key={`${group}-${rowIndex}`}><div className="grid grid-cols-3 gap-4">{row.map(letter => <LetterTile key={`${group}-${letter.orden}`} letter={letter} selected={letter.orden === selectedOrder} onSelect={() => toggleLetter(letter.orden)} group={group} />)}</div>{selectedInRow && selectedLetter && <ExpandedLetterCard letter={selectedLetter} group={group} closing={closingOrder === selectedLetter.orden} />}</div> })}</div>}{!simpleMode && viewMode === 'list' && <ListView letters={filteredLetters} group={group} />}{!simpleMode && viewMode === 'detail' && detailLetter && <div><ExpandedLetterCard letter={detailLetter} group={group} /><div className="mt-1 grid grid-cols-2 gap-2"><button type="button" disabled={detailIndex <= 0} onClick={() => setDetailIndex(value => Math.max(0, value - 1))} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button><button type="button" disabled={detailIndex >= filteredLetters.length - 1} onClick={() => setDetailIndex(value => Math.min(filteredLetters.length - 1, value + 1))} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button></div></div>}</section>
}
