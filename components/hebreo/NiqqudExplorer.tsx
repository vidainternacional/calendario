'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, List, Rows3 } from 'lucide-react'
import NiqqudReadingRules from './NiqqudReadingRules'

type NiqqudGroup = 'basic' | 'reduced' | 'sheva'
type NiqqudView = 'cards' | 'list' | 'detail'

type NiqqudMark = {
  id: string
  order: number
  name: string
  hebrewName: string
  visibleSign: string
  example: string
  reading: string
  sound: string
  family: 'A' | 'E' | 'I' | 'O' | 'U' | 'Variable'
  group: NiqqudGroup
  unicode: string
  explanation: string
  caution?: string
  formula: string
  functionLabel: string
}

const NIQQUD_MARKS: readonly NiqqudMark[] = [
  { id: 'patah', order: 1, name: 'Pataj', hebrewName: 'פתח', visibleSign: '◌ַ', example: 'לַ', reading: 'la', sound: 'a', family: 'A', group: 'basic', unicode: 'U+05B7', explanation: 'Una pequeña línea bajo la consonante. Para comenzar, léela como una a clara.', formula: 'ל + ◌ַ = לַ', functionLabel: 'Vocal a' },
  { id: 'qamats', order: 2, name: 'Qamats', hebrewName: 'קמץ', visibleSign: '◌ָ', example: 'לָ', reading: 'la', sound: 'a · a veces o', family: 'A', group: 'basic', unicode: 'U+05B8', explanation: 'Tiene forma de una pequeña T bajo la consonante. En la lectura pedagógica inicial normalmente se presenta como a.', caution: 'En determinados contextos aparece qamats qatan y suena o. La app lo enseñará por separado cuando trabajemos reglas de lectura.', formula: 'ל + ◌ָ = לָ', functionLabel: 'Vocal a / o según contexto' },
  { id: 'segol', order: 3, name: 'Segol', hebrewName: 'סגול', visibleSign: '◌ֶ', example: 'לֶ', reading: 'le', sound: 'e', family: 'E', group: 'basic', unicode: 'U+05B6', explanation: 'Tres puntos colocados como un pequeño triángulo debajo de la consonante. Para empezar, léelo como e.', formula: 'ל + ◌ֶ = לֶ', functionLabel: 'Vocal e' },
  { id: 'tsere', order: 4, name: 'Tsere', hebrewName: 'צירי', visibleSign: '◌ֵ', example: 'לֵ', reading: 'le', sound: 'e', family: 'E', group: 'basic', unicode: 'U+05B5', explanation: 'Dos puntos horizontales bajo la consonante. En la lectura pedagógica inicial se reconoce como e.', formula: 'ל + ◌ֵ = לֵ', functionLabel: 'Vocal e' },
  { id: 'hiriq', order: 5, name: 'Hiriq', hebrewName: 'חיריק', visibleSign: '◌ִ', example: 'לִ', reading: 'li', sound: 'i', family: 'I', group: 'basic', unicode: 'U+05B4', explanation: 'Un solo punto debajo de la consonante. Para comenzar, léelo como i.', formula: 'ל + ◌ִ = לִ', functionLabel: 'Vocal i' },
  { id: 'holam', order: 6, name: 'Holam', hebrewName: 'חולם', visibleSign: '◌ֹ', example: 'לֹ', reading: 'lo', sound: 'o', family: 'O', group: 'basic', unicode: 'U+05B9', explanation: 'Un punto situado arriba de la consonante. Para comenzar, léelo como o.', caution: 'También puede aparecer con vav, por ejemplo וֹ. Esa forma se verá con más detalle al leer palabras reales.', formula: 'ל + ◌ֹ = לֹ', functionLabel: 'Vocal o' },
  { id: 'qubuts', order: 7, name: 'Qubuts', hebrewName: 'קובוץ', visibleSign: '◌ֻ', example: 'לֻ', reading: 'lu', sound: 'u', family: 'U', group: 'basic', unicode: 'U+05BB', explanation: 'Tres puntos diagonales debajo de la consonante. Para comenzar, léelo como u.', formula: 'ל + ◌ֻ = לֻ', functionLabel: 'Vocal u' },
  { id: 'shuruq', order: 8, name: 'Shuruq', hebrewName: 'שורוק', visibleSign: 'וּ', example: 'לוּ', reading: 'lu', sound: 'u', family: 'U', group: 'basic', unicode: 'U+05D5 + U+05BC', explanation: 'Se escribe con vav y un punto dentro. En esta función vocálica representa u.', caution: 'El punto U+05BC también funciona como dagesh o mapiq en otros contextos. Aquí lo estamos viendo únicamente como parte de shuruq.', formula: 'ל + וּ = לוּ', functionLabel: 'Vocal u con Vav' },
  { id: 'sheva', order: 9, name: 'Sheva', hebrewName: 'שווא', visibleSign: '◌ְ', example: 'לְ', reading: 'lə · o sin vocal', sound: 'variable', family: 'Variable', group: 'sheva', unicode: 'U+05B0', explanation: 'Dos puntos verticales bajo la consonante. Puede representar una vocal muy breve o no pronunciarse.', caution: 'No conviene memorizarlo como una vocal fija. Aprenderemos a distinguir sheva vocal y sheva silencioso dentro de palabras reales.', formula: 'ל + ◌ְ = לְ', functionLabel: 'Vocal breve o silencio' },
  { id: 'hataf-patah', order: 10, name: 'Hataf Pataj', hebrewName: 'חטף פתח', visibleSign: '◌ֲ', example: 'אֲ', reading: 'a breve', sound: 'a muy breve', family: 'A', group: 'reduced', unicode: 'U+05B2', explanation: 'Combina sheva con la cualidad de pataj. Se aprende como una a muy breve y aparece especialmente con consonantes guturales.', formula: 'א + ◌ֲ = אֲ', functionLabel: 'Vocal a reducida' },
  { id: 'hataf-segol', order: 11, name: 'Hataf Segol', hebrewName: 'חטף סגול', visibleSign: '◌ֱ', example: 'אֱ', reading: 'e breve', sound: 'e muy breve', family: 'E', group: 'reduced', unicode: 'U+05B1', explanation: 'Combina sheva con la cualidad de segol. Se aprende como una e muy breve y aparece especialmente con consonantes guturales.', formula: 'א + ◌ֱ = אֱ', functionLabel: 'Vocal e reducida' },
  { id: 'hataf-qamats', order: 12, name: 'Hataf Qamats', hebrewName: 'חטף קמץ', visibleSign: '◌ֳ', example: 'אֳ', reading: 'o breve', sound: 'o muy breve', family: 'O', group: 'reduced', unicode: 'U+05B3', explanation: 'Combina sheva con una vocal de cualidad o. Se aprende como una o muy breve y aparece especialmente con consonantes guturales.', formula: 'א + ◌ֳ = אֳ', functionLabel: 'Vocal o reducida' },
]

const GROUPS: readonly { id: 'all' | NiqqudGroup; label: string; explanation: string }[] = [
  { id: 'basic', label: 'Básicas', explanation: 'Empieza aquí: las ocho vocales completas que necesitas reconocer antes de leer palabras.' },
  { id: 'reduced', label: 'Reducidas', explanation: 'Tres signos breves, frecuentes especialmente junto a consonantes guturales.' },
  { id: 'sheva', label: 'Sheva', explanation: 'Un signo especial que puede sonar brevemente o quedar silencioso según el contexto.' },
  { id: 'all', label: 'Todas', explanation: 'Las doce formas de esta primera base: ocho básicas, tres reducidas y sheva.' },
]

function chunkMarks(marks: readonly NiqqudMark[], size: number) {
  const rows: NiqqudMark[][] = []
  for (let index = 0; index < marks.length; index += size) rows.push(marks.slice(index, index + size) as NiqqudMark[])
  return rows
}

function NiqqudIntroduction() {
  const [open, setOpen] = useState(false)
  return (
    <section className="border-y border-slate-200 text-left">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left">
        <span><span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">נִקּוּד</span><span className="mt-0.5 block text-sm font-black text-slate-950">¿Qué es el niqqud?</span></span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <div className="border-t border-slate-200 p-4"><div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]"><p>El hebreo se lee de derecha a izquierda. El niqqud son puntos y pequeñas marcas añadidas a las consonantes para ayudar a indicar cómo se vocaliza el texto.</p><p>No son letras nuevas. Primero reconoce la forma del signo; después combínalo con una consonante y lee una sílaba sencilla.</p><p>En este bloque usamos una pronunciación pedagógica inicial para hispanohablantes. No pretende reconstruir de manera infalible la pronunciación histórica del hebreo bíblico.</p></div></div>}
    </section>
  )
}

function ViewControl({ view, onChange }: { view: NiqqudView; onChange: (view: NiqqudView) => void }) {
  const views = [
    { id: 'cards' as const, label: 'Tarjetas', Icon: Grid2X2 },
    { id: 'list' as const, label: 'Lista', Icon: List },
    { id: 'detail' as const, label: 'Detalle', Icon: Rows3 },
  ]
  return <div className="mt-4 grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1" aria-label="Vista de vocales">{views.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[11px] font-black ${view === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</button>)}</div>
}

function NiqqudTile({ mark, selected, onSelect }: { mark: NiqqudMark; selected: boolean; onSelect: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onSelect} className={`min-h-[136px] min-w-0 rounded-[22px] border px-2 pb-3 pt-3 text-center transition active:scale-[0.98] motion-reduce:transition-none ${selected ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_26px_rgba(79,70,229,0.18)]' : 'border-slate-200 bg-white text-slate-950 shadow-[0_6px_18px_rgba(15,23,42,0.04)]'}`}><span className={`block text-[10px] font-black uppercase tracking-[0.1em] ${selected ? 'text-white/70' : 'text-slate-400'}`}>{mark.family}</span><span lang="he" dir="rtl" className="mt-0.5 block text-[4.5rem] font-black leading-none" aria-hidden="true">{mark.example}</span><span className="mt-1.5 block break-words text-[13px] font-black leading-tight">{mark.name}</span><span className={`mt-1 block text-[12px] font-bold ${selected ? 'text-indigo-100' : 'text-slate-500'}`}>{mark.sound}</span></button>
}

function NiqqudCard({ mark, closing = false, compact = false }: { mark: NiqqudMark; closing?: boolean; compact?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    node.animate(closing ? [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.94)' }] : [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: closing ? 170 : 230, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' })
  }, [closing, mark.id])

  return <article ref={ref} className={`${compact ? 'mt-4' : ''} origin-top overflow-hidden rounded-[26px] border border-slate-200 bg-white text-left shadow-[0_12px_32px_rgba(15,23,42,0.07)]`}><div className="p-4 sm:p-5"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"><div className="min-w-0"><p className="text-[12px] font-black text-slate-950">{mark.name}</p><p lang="he" dir="rtl" className="mt-0.5 break-words text-[1.6rem] font-black text-indigo-700">{mark.hebrewName}</p></div><div className="text-right"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Valor</p><p className="mt-1 text-xl font-black text-slate-500">—</p></div></div><div className="mt-3 grid grid-cols-2 items-center gap-3 border-y border-slate-100 py-4"><div className="text-center"><p lang="he" dir="rtl" className="text-[6.1rem] font-black leading-none text-indigo-700">{mark.example}</p><p className="mt-1 text-[11px] font-bold text-slate-400">Signo aplicado</p></div><div className="text-center"><p lang="he" dir="rtl" className="text-[3rem] font-black leading-tight text-slate-950">{mark.formula}</p><p className="mt-1.5 text-[1.1rem] font-black text-indigo-700">{mark.reading}</p></div></div><div className="mt-3 grid grid-cols-2 gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Sonido</p><p className="mt-1 text-[16px] font-black text-slate-900">{mark.sound}</p></div><div><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Función</p><p className="mt-1 text-[15px] font-black leading-snug text-slate-900">{mark.functionLabel}</p></div></div><p className="mt-3 text-[14px] leading-relaxed text-slate-700">{mark.explanation}</p>{mark.caution && <p className="mt-3 border-t border-slate-100 pt-3 text-[12px] font-semibold leading-relaxed text-slate-600">{mark.caution}</p>}</div></article>
}

function CardsView({ marks, selectedId, closingId, onToggle }: { marks: readonly NiqqudMark[]; selectedId: string | null; closingId: string | null; onToggle: (id: string) => void }) {
  const rows = chunkMarks(marks, 3)
  return <div className="space-y-4">{rows.map((row, rowIndex) => { const selected = row.find(mark => mark.id === selectedId) ?? null; return <div key={`niqqud-row-${rowIndex}`}><div className="grid grid-cols-3 gap-3">{row.map(mark => <NiqqudTile key={mark.id} mark={mark} selected={mark.id === selectedId} onSelect={() => onToggle(mark.id)} />)}</div>{selected && <NiqqudCard mark={selected} closing={closingId === selected.id} compact />}</div> })}</div>
}

function ListView({ marks }: { marks: readonly NiqqudMark[] }) {
  const columns = 'grid-cols-[92px_110px_60px_116px_minmax(180px,1fr)]'
  return <div className="-mx-4 overflow-x-auto border-y border-slate-200 bg-white [-webkit-overflow-scrolling:touch] sm:mx-0 sm:rounded-[22px] sm:border"><div className={`grid min-w-[620px] ${columns} items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.06em] text-slate-400`}><span>Signo</span><span>Nombre</span><span>Valor</span><span>Sonido</span><span>Función</span></div>{marks.map(mark => <div key={mark.id} className={`grid min-h-[88px] min-w-[620px] ${columns} items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-center last:border-b-0`}><span lang="he" dir="rtl" className="text-[3.65rem] font-black leading-none text-indigo-700">{mark.example}</span><span className="break-words text-[13px] font-black leading-tight text-slate-900">{mark.name}</span><span className="text-[14px] font-black text-slate-400">—</span><span className="break-words text-[13px] font-black leading-tight text-indigo-700">{mark.sound}</span><span className="break-words text-[12px] font-bold leading-snug text-slate-700">{mark.functionLabel}</span></div>)}</div>
}

function DetailView({ marks, index, onPrevious, onNext }: { marks: readonly NiqqudMark[]; index: number; onPrevious: () => void; onNext: () => void }) {
  const mark = marks[index]
  if (!mark) return null
  return <div><NiqqudCard mark={mark} /><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={index <= 0} onClick={onPrevious} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button><button type="button" disabled={index >= marks.length - 1} onClick={onNext} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 text-[12px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button></div></div>
}

export default function NiqqudExplorer() {
  const [group, setGroup] = useState<'all' | NiqqudGroup>('basic')
  const [view, setView] = useState<NiqqudView>('cards')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [detailIndex, setDetailIndex] = useState(0)

  const visibleMarks = useMemo(() => group === 'all' ? NIQQUD_MARKS : NIQQUD_MARKS.filter(mark => mark.group === group), [group])
  const activeGroup = GROUPS.find(item => item.id === group) ?? GROUPS[0]

  function selectGroup(next: 'all' | NiqqudGroup) {
    setGroup(next); setSelectedId(null); setClosingId(null); setDetailIndex(0)
  }

  function toggleMark(id: string) {
    if (selectedId !== id) { setClosingId(null); setSelectedId(id); return }
    setClosingId(id)
    window.setTimeout(() => { setSelectedId(current => current === id ? null : current); setClosingId(null) }, 170)
  }

  function changeView(next: NiqqudView) {
    setView(next); setSelectedId(null); setClosingId(null); setDetailIndex(0)
  }

  return <section aria-labelledby="niqqud-title" className="text-left"><div className="text-center"><p lang="he" dir="rtl" className="text-[1.35rem] font-black text-indigo-700">נִקּוּד</p><h2 id="niqqud-title" className="mt-0.5 text-[1.75rem] font-black text-slate-950">Vocales y sílabas</h2><p className="mx-auto mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">Reconoce cada signo, compáralo en lista o recórrelo uno por uno.</p></div><div className="mt-4"><NiqqudIntroduction /></div><NiqqudReadingRules /><ViewControl view={view} onChange={changeView} /><div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{GROUPS.map(item => <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => selectGroup(item.id)} className={`min-h-11 shrink-0 rounded-full border px-4 text-[13px] font-black ${group === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{item.label}</button>)}</div><p className="mt-2 text-center text-[12px] leading-relaxed text-slate-500">{activeGroup.explanation}</p><div className="mt-4">{view === 'cards' && <CardsView marks={visibleMarks} selectedId={selectedId} closingId={closingId} onToggle={toggleMark} />}{view === 'list' && <ListView marks={visibleMarks} />}{view === 'detail' && <DetailView marks={visibleMarks} index={detailIndex} onPrevious={() => setDetailIndex(value => Math.max(0, value - 1))} onNext={() => setDetailIndex(value => Math.min(visibleMarks.length - 1, value + 1))} />}</div><div className="mt-5 border-t border-slate-200 pt-4 text-center"><p className="text-[12px] font-black text-slate-700">Idea clave</p><p className="mx-auto mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">Las vocales no tienen valor gemátrico propio. En la vista Lista se marca “—” en Valor para no inventar un dato que no aplica.</p></div></section>
}
