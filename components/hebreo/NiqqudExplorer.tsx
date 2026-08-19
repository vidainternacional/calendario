'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type NiqqudGroup = 'basic' | 'reduced' | 'sheva'

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
}

const NIQQUD_MARKS: readonly NiqqudMark[] = [
  {
    id: 'patah',
    order: 1,
    name: 'Pataj',
    hebrewName: 'פתח',
    visibleSign: '◌ַ',
    example: 'לַ',
    reading: 'la',
    sound: 'a',
    family: 'A',
    group: 'basic',
    unicode: 'U+05B7',
    explanation: 'Una pequeña línea bajo la consonante. Para comenzar, léela como una a clara.',
    formula: 'ל + ◌ַ = לַ',
  },
  {
    id: 'qamats',
    order: 2,
    name: 'Qamats',
    hebrewName: 'קמץ',
    visibleSign: '◌ָ',
    example: 'לָ',
    reading: 'la',
    sound: 'a · a veces o',
    family: 'A',
    group: 'basic',
    unicode: 'U+05B8',
    explanation: 'Tiene forma de una pequeña T bajo la consonante. En la lectura pedagógica inicial normalmente se presenta como a.',
    caution: 'En determinados contextos aparece qamats qatan y suena o. La app lo enseñará por separado cuando trabajemos reglas de lectura.',
    formula: 'ל + ◌ָ = לָ',
  },
  {
    id: 'segol',
    order: 3,
    name: 'Segol',
    hebrewName: 'סגול',
    visibleSign: '◌ֶ',
    example: 'לֶ',
    reading: 'le',
    sound: 'e',
    family: 'E',
    group: 'basic',
    unicode: 'U+05B6',
    explanation: 'Tres puntos colocados como un pequeño triángulo debajo de la consonante. Para empezar, léelo como e.',
    formula: 'ל + ◌ֶ = לֶ',
  },
  {
    id: 'tsere',
    order: 4,
    name: 'Tsere',
    hebrewName: 'צירי',
    visibleSign: '◌ֵ',
    example: 'לֵ',
    reading: 'le',
    sound: 'e',
    family: 'E',
    group: 'basic',
    unicode: 'U+05B5',
    explanation: 'Dos puntos horizontales bajo la consonante. En la lectura pedagógica inicial se reconoce como e.',
    formula: 'ל + ◌ֵ = לֵ',
  },
  {
    id: 'hiriq',
    order: 5,
    name: 'Hiriq',
    hebrewName: 'חיריק',
    visibleSign: '◌ִ',
    example: 'לִ',
    reading: 'li',
    sound: 'i',
    family: 'I',
    group: 'basic',
    unicode: 'U+05B4',
    explanation: 'Un solo punto debajo de la consonante. Para comenzar, léelo como i.',
    formula: 'ל + ◌ִ = לִ',
  },
  {
    id: 'holam',
    order: 6,
    name: 'Holam',
    hebrewName: 'חולם',
    visibleSign: '◌ֹ',
    example: 'לֹ',
    reading: 'lo',
    sound: 'o',
    family: 'O',
    group: 'basic',
    unicode: 'U+05B9',
    explanation: 'Un punto situado arriba de la consonante. Para comenzar, léelo como o.',
    caution: 'También puede aparecer con vav, por ejemplo וֹ. Esa forma se verá con más detalle al leer palabras reales.',
    formula: 'ל + ◌ֹ = לֹ',
  },
  {
    id: 'qubuts',
    order: 7,
    name: 'Qubuts',
    hebrewName: 'קובוץ',
    visibleSign: '◌ֻ',
    example: 'לֻ',
    reading: 'lu',
    sound: 'u',
    family: 'U',
    group: 'basic',
    unicode: 'U+05BB',
    explanation: 'Tres puntos diagonales debajo de la consonante. Para comenzar, léelo como u.',
    formula: 'ל + ◌ֻ = לֻ',
  },
  {
    id: 'shuruq',
    order: 8,
    name: 'Shuruq',
    hebrewName: 'שורוק',
    visibleSign: 'וּ',
    example: 'לוּ',
    reading: 'lu',
    sound: 'u',
    family: 'U',
    group: 'basic',
    unicode: 'U+05D5 + U+05BC',
    explanation: 'Se escribe con vav y un punto dentro. En esta función vocálica representa u.',
    caution: 'El punto U+05BC también funciona como dagesh o mapiq en otros contextos. Aquí lo estamos viendo únicamente como parte de shuruq.',
    formula: 'ל + וּ = לוּ',
  },
  {
    id: 'sheva',
    order: 9,
    name: 'Sheva',
    hebrewName: 'שווא',
    visibleSign: '◌ְ',
    example: 'לְ',
    reading: 'lə · o sin vocal',
    sound: 'variable',
    family: 'Variable',
    group: 'sheva',
    unicode: 'U+05B0',
    explanation: 'Dos puntos verticales bajo la consonante. Puede representar una vocal muy breve o no pronunciarse.',
    caution: 'No conviene memorizarlo como una vocal fija. Aprenderemos a distinguir sheva vocal y sheva silencioso dentro de palabras reales.',
    formula: 'ל + ◌ְ = לְ',
  },
  {
    id: 'hataf-patah',
    order: 10,
    name: 'Hataf Pataj',
    hebrewName: 'חטף פתח',
    visibleSign: '◌ֲ',
    example: 'אֲ',
    reading: 'a breve',
    sound: 'a muy breve',
    family: 'A',
    group: 'reduced',
    unicode: 'U+05B2',
    explanation: 'Combina sheva con la cualidad de pataj. Se aprende como una a muy breve y aparece especialmente con consonantes guturales.',
    formula: 'א + ◌ֲ = אֲ',
  },
  {
    id: 'hataf-segol',
    order: 11,
    name: 'Hataf Segol',
    hebrewName: 'חטף סגול',
    visibleSign: '◌ֱ',
    example: 'אֱ',
    reading: 'e breve',
    sound: 'e muy breve',
    family: 'E',
    group: 'reduced',
    unicode: 'U+05B1',
    explanation: 'Combina sheva con la cualidad de segol. Se aprende como una e muy breve y aparece especialmente con consonantes guturales.',
    formula: 'א + ◌ֱ = אֱ',
  },
  {
    id: 'hataf-qamats',
    order: 12,
    name: 'Hataf Qamats',
    hebrewName: 'חטף קמץ',
    visibleSign: '◌ֳ',
    example: 'אֳ',
    reading: 'o breve',
    sound: 'o muy breve',
    family: 'O',
    group: 'reduced',
    unicode: 'U+05B3',
    explanation: 'Combina sheva con una vocal de cualidad o. Se aprende como una o muy breve y aparece especialmente con consonantes guturales.',
    formula: 'א + ◌ֳ = אֳ',
  },
]

const GROUPS: readonly { id: 'all' | NiqqudGroup; label: string; explanation: string }[] = [
  { id: 'basic', label: 'Básicas', explanation: 'Empieza aquí: las vocales completas que necesitas reconocer antes de leer palabras.' },
  { id: 'reduced', label: 'Reducidas', explanation: 'Tres signos breves, frecuentes especialmente junto a consonantes guturales.' },
  { id: 'sheva', label: 'Sheva', explanation: 'Un signo especial que puede sonar brevemente o quedar silencioso según el contexto.' },
  { id: 'all', label: 'Todas', explanation: 'Las doce formas que trabajaremos en esta primera base de niqqud.' },
]

function NiqqudIntroduction() {
  const [open, setOpen] = useState(false)
  return (
    <section className="border-y border-slate-200 text-left">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left">
        <span>
          <span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">נִקּוּד</span>
          <span className="mt-0.5 block text-sm font-black text-slate-950">¿Qué es el niqqud?</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-slate-200 p-4">
          <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]">
            <p>El hebreo se lee de derecha a izquierda. El niqqud son puntos y pequeñas marcas añadidas a las consonantes para ayudar a indicar cómo se vocaliza el texto.</p>
            <p>No son letras nuevas. Primero reconoce la forma del signo; después combínalo con una consonante y lee una sílaba sencilla.</p>
            <p>En este bloque usamos una pronunciación pedagógica inicial para hispanohablantes. No pretende reconstruir de manera infalible la pronunciación histórica del hebreo bíblico.</p>
          </div>
        </div>
      )}
    </section>
  )
}

function NiqqudTile({ mark, selected, onSelect }: { mark: NiqqudMark; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onSelect} className={`min-h-[132px] min-w-0 rounded-[22px] border px-2.5 pb-3 pt-3 text-center transition active:scale-[0.98] ${selected ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_26px_rgba(79,70,229,0.18)]' : 'border-slate-200 bg-white text-slate-950'}`}>
      <span className={`block text-[10px] font-black uppercase tracking-[0.1em] ${selected ? 'text-white/70' : 'text-slate-400'}`}>{mark.family}</span>
      <span lang="he" dir="rtl" className="mt-1 block text-[3.75rem] font-black leading-none" aria-hidden="true">{mark.example}</span>
      <span className="mt-2 block break-words text-[13px] font-black leading-tight">{mark.name}</span>
      <span className={`mt-1 block text-[12px] font-bold ${selected ? 'text-indigo-100' : 'text-slate-500'}`}>{mark.sound}</span>
    </button>
  )
}

function NiqqudCard({ mark }: { mark: NiqqudMark }) {
  return (
    <article className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
      <div className="p-5">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">Vocal {mark.order} de {NIQQUD_MARKS.length}</span>
            <h3 className="mt-1 break-words text-[1.75rem] font-black leading-tight text-slate-950">{mark.name}</h3>
            <p lang="he" dir="rtl" className="mt-1 text-[1.25rem] font-black text-indigo-700">{mark.hebrewName}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Sonido</span>
            <span className="mt-1 block text-[1.45rem] font-black text-slate-950">{mark.sound}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-4 border-y border-slate-100 py-5">
          <div className="text-center">
            <span lang="he" dir="rtl" className="block text-[5.4rem] font-black leading-none text-indigo-700">{mark.visibleSign}</span>
            <span className="mt-2 block text-[11px] font-bold text-slate-400">{mark.unicode}</span>
          </div>
          <div className="min-w-0 text-center">
            <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Consonante + vocal</span>
            <span lang="he" dir="rtl" className="mt-2 block break-words text-[2.4rem] font-black leading-tight text-slate-950">{mark.formula}</span>
            <span className="mt-2 block text-[1.1rem] font-black text-indigo-700">{mark.reading}</span>
          </div>
        </div>

        <p className="mt-5 text-[15px] leading-relaxed text-slate-700">{mark.explanation}</p>
        {mark.caution && <p className="mt-3 rounded-[18px] bg-slate-50 px-4 py-3 text-[13px] font-semibold leading-relaxed text-slate-600">{mark.caution}</p>}
        <p className="mt-4 text-[12px] leading-relaxed text-slate-400">El sonido puede variar ligeramente según la tradición de pronunciación. Aquí se muestra una ayuda inicial de lectura, no una reconstrucción histórica absoluta.</p>
      </div>
    </article>
  )
}

export default function NiqqudExplorer() {
  const [group, setGroup] = useState<'all' | NiqqudGroup>('basic')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const visibleMarks = useMemo(() => group === 'all' ? NIQQUD_MARKS : NIQQUD_MARKS.filter(mark => mark.group === group), [group])
  const activeGroup = GROUPS.find(item => item.id === group) ?? GROUPS[0]
  const selected = NIQQUD_MARKS.find(mark => mark.id === selectedId) ?? null

  function selectGroup(next: 'all' | NiqqudGroup) {
    setGroup(next)
    const selectedMark = NIQQUD_MARKS.find(mark => mark.id === selectedId)
    if (selectedMark && next !== 'all' && selectedMark.group !== next) setSelectedId(null)
  }

  return (
    <section aria-labelledby="niqqud-title" className="text-left">
      <div className="text-center">
        <p lang="he" dir="rtl" className="text-[1.35rem] font-black text-indigo-700">נִקּוּד</p>
        <h2 id="niqqud-title" className="mt-0.5 text-[1.75rem] font-black text-slate-950">Vocales y sílabas</h2>
        <p className="mx-auto mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">Toca un signo, reconoce su sonido y mira cómo se combina con una consonante.</p>
      </div>

      <div className="mt-4"><NiqqudIntroduction /></div>

      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GROUPS.map(item => (
          <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => selectGroup(item.id)} className={`min-h-11 shrink-0 rounded-full border px-4 text-[13px] font-black transition ${group === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{item.label}</button>
        ))}
      </div>
      <p className="mt-2 text-center text-[12px] leading-relaxed text-slate-500">{activeGroup.explanation}</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {visibleMarks.map(mark => <NiqqudTile key={mark.id} mark={mark} selected={selectedId === mark.id} onSelect={() => setSelectedId(current => current === mark.id ? null : mark.id)} />)}
      </div>

      {selected && <NiqqudCard mark={selected} />}

      <div className="mt-5 border-t border-slate-200 pt-4 text-center">
        <p className="text-[12px] font-black text-slate-700">Idea clave</p>
        <p className="mx-auto mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">Una sílaba sencilla se forma al leer una consonante junto con la vocal que la acompaña. Primero identifica; después combina.</p>
      </div>
    </section>
  )
}
