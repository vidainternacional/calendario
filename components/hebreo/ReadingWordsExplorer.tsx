'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type ReadingLevel = 'nikud' | 'guided' | 'plain'
type WordGroup = 'all' | 'short' | 'common' | 'contrast'

type ReadingWord = {
  id: string
  order: number
  hebrew: string
  plain: string
  transliteration: string
  spanish: string
  syllables: string[]
  group: Exclude<WordGroup, 'all'>
  focus: string
  note?: string
}

const WORDS: readonly ReadingWord[] = [
  { id: 'av', order: 1, hebrew: 'אָב', plain: 'אב', transliteration: 'av', spanish: 'padre', syllables: ['אָב'], group: 'short', focus: 'Reconoce Alef + Bet y observa cómo Qamats ayuda a leer la vocal.' },
  { id: 'em', order: 2, hebrew: 'אֵם', plain: 'אם', transliteration: 'em', spanish: 'madre', syllables: ['אֵם'], group: 'short', focus: 'Distingue Tsere bajo Alef y la Mem final ם.' },
  { id: 'yom', order: 3, hebrew: 'יוֹם', plain: 'יום', transliteration: 'yom', spanish: 'día', syllables: ['יוֹם'], group: 'short', focus: 'Observa Holam con Vav y la forma final de Mem.' },
  { id: 'mayim', order: 4, hebrew: 'מַיִם', plain: 'מים', transliteration: 'máyim', spanish: 'agua', syllables: ['מַ', 'יִם'], group: 'common', focus: 'Lee primero dos partes y después une la palabra completa.' },
  { id: 'bayit', order: 5, hebrew: 'בַּיִת', plain: 'בית', transliteration: 'báyit', spanish: 'casa', syllables: ['בַּ', 'יִת'], group: 'common', focus: 'Distingue Bet con punto y lee la palabra en dos unidades.' },
  { id: 'melekh', order: 6, hebrew: 'מֶלֶךְ', plain: 'מלך', transliteration: 'mélej', spanish: 'rey', syllables: ['מֶ', 'לֶךְ'], group: 'common', focus: 'Observa Segol y la forma final de Kaf ך.', note: 'La transliteración “mélej” es una ayuda aproximada para hispanohablantes; no sustituye leer las letras.' },
  { id: 'shalom', order: 7, hebrew: 'שָׁלוֹם', plain: 'שלום', transliteration: 'shalom', spanish: 'paz', syllables: ['שָׁ', 'לוֹם'], group: 'common', focus: 'Reconoce Shin con punto a la derecha y Holam en la segunda parte.' },
  { id: 'erets', order: 8, hebrew: 'אֶרֶץ', plain: 'ארץ', transliteration: 'érets', spanish: 'tierra', syllables: ['אֶ', 'רֶץ'], group: 'contrast', focus: 'Distingue Resh y Tsadi final mientras mantienes la lectura de Segol.' },
  { id: 'shem', order: 9, hebrew: 'שֵׁם', plain: 'שם', transliteration: 'shem', spanish: 'nombre', syllables: ['שֵׁם'], group: 'contrast', focus: 'Compara Shin con otras consonantes parecidas y reconoce Tsere.' },
  { id: 'lev', order: 10, hebrew: 'לֵב', plain: 'לב', transliteration: 'lev', spanish: 'corazón', syllables: ['לֵב'], group: 'contrast', focus: 'Lee una palabra breve con Tsere y termina en Bet.' },
]

const GROUPS: readonly { id: WordGroup; es: string; description: string }[] = [
  { id: 'short', es: 'Cortas', description: 'Palabras de una sola unidad o muy breves para ganar seguridad al leer.' },
  { id: 'common', es: 'Frecuentes', description: 'Palabras sencillas que permiten practicar varias vocales y formas finales.' },
  { id: 'contrast', es: 'Distinguir', description: 'Palabras útiles para entrenar letras y terminaciones que pueden confundirse.' },
  { id: 'all', es: 'Todas', description: 'Muestra las diez palabras de esta primera práctica de lectura.' },
]

function ReadingIntroduction() {
  const [open, setOpen] = useState(false)
  return (
    <section className="border-y border-slate-200 text-left">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left">
        <span>
          <span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">קְרִיאָה</span>
          <span className="mt-0.5 block text-sm font-black text-slate-950">¿Cómo empezamos a leer?</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-slate-200 p-4">
          <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]">
            <p>Lee de derecha a izquierda. Primero identifica las consonantes y el niqqud; después combina pequeñas unidades hasta reconocer la palabra completa.</p>
            <p>La transliteración aparece únicamente como apoyo temporal. El objetivo es poder quitarla y leer directamente el hebreo.</p>
            <p>No necesitas memorizar diez palabras de una vez. Abre una ficha, léela varias veces y cambia el nivel de ayuda cuando te resulte cómoda.</p>
          </div>
        </div>
      )}
    </section>
  )
}

function WordTile({ word, selected, onSelect }: { word: ReadingWord; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onSelect} className={`min-h-[116px] min-w-0 rounded-[22px] border px-2.5 py-3 text-center transition active:scale-[0.98] motion-reduce:transition-none ${selected ? 'border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_26px_rgba(79,70,229,0.18)]' : 'border-slate-200 bg-white text-slate-950'}`}>
      <span className={`block text-[10px] font-black tabular-nums ${selected ? 'text-indigo-100' : 'text-slate-400'}`}>{word.order}</span>
      <span lang="he" dir="rtl" className="mt-1 block break-words text-[2.25rem] font-black leading-tight">{word.hebrew}</span>
      <span className={`mt-1.5 block text-[12px] font-black leading-tight ${selected ? 'text-white' : 'text-slate-800'}`}>{word.spanish}</span>
    </button>
  )
}

function ReadingCard({ word }: { word: ReadingWord }) {
  const [level, setLevel] = useState<ReadingLevel>('nikud')
  const levels: readonly { id: ReadingLevel; label: string }[] = [
    { id: 'nikud', label: 'Con niqqud' },
    { id: 'guided', label: 'Con ayuda' },
    { id: 'plain', label: 'Sin ayuda' },
  ]

  return (
    <article className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
      <div className="p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">Lectura {word.order} de {WORDS.length}</p>
        <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {levels.map(item => <button key={item.id} type="button" aria-pressed={level === item.id} onClick={() => setLevel(item.id)} className={`min-h-10 shrink-0 rounded-full border px-3.5 text-[12px] font-black ${level === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}
        </div>

        <div className="mt-7 min-h-[118px]">
          <p lang="he" dir="rtl" className="break-words text-[4.6rem] font-black leading-[1.25] text-slate-950 sm:text-[5.5rem]">{level === 'plain' ? word.plain : word.hebrew}</p>
          {level === 'guided' && <p className="mt-3 text-lg font-black text-indigo-700">{word.syllables.join(' · ')}</p>}
          {level !== 'plain' && <p className="mt-2 text-base font-black text-slate-600">{word.transliteration}</p>}
        </div>

        <div className="mt-6 border-y border-slate-200 py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Significado</p>
          <p className="mt-1 text-xl font-black text-slate-950">{word.spanish}</p>
        </div>

        <div className="mt-5 text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">En qué fijarte</p>
          <p className="mt-1 text-[14px] leading-relaxed text-slate-700">{word.focus}</p>
          {word.note && <p className="mt-3 rounded-[16px] bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed text-amber-900">{word.note}</p>}
        </div>
      </div>
    </article>
  )
}

export default function ReadingWordsExplorer() {
  const [group, setGroup] = useState<WordGroup>('short')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeGroup = GROUPS.find(item => item.id === group) ?? GROUPS[0]
  const visibleWords = useMemo(() => group === 'all' ? WORDS : WORDS.filter(word => word.group === group), [group])
  const selected = WORDS.find(word => word.id === selectedId) ?? null

  function chooseGroup(next: WordGroup) {
    setGroup(next)
    setSelectedId(null)
  }

  return (
    <section aria-labelledby="reading-words-title" className="text-left">
      <div className="text-center">
        <p lang="he" dir="rtl" className="text-[1rem] font-black text-indigo-700">קְרִיאַת מִלִּים</p>
        <h2 id="reading-words-title" className="mt-0.5 text-[1.65rem] font-black tracking-[-0.025em] text-slate-950">Lectura de palabras</h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">Empieza con palabras cortas. Reduce las ayudas cuando puedas leerlas sin depender de la transliteración.</p>
      </div>

      <div className="mt-5"><ReadingIntroduction /></div>

      <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {GROUPS.map(item => <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => chooseGroup(item.id)} className={`min-h-11 rounded-full border px-4 text-[12px] font-black ${group === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item.es}</button>)}
        </div>
      </div>
      <p className="mt-2 text-center text-[12px] leading-relaxed text-slate-500">{activeGroup.description}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleWords.map(word => <WordTile key={word.id} word={word} selected={selectedId === word.id} onSelect={() => setSelectedId(current => current === word.id ? null : word.id)} />)}
      </div>

      {selected && <ReadingCard word={selected} />}

      <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">Primera práctica de lectura. No registra dominio ni califica resultados todavía.</p>
    </section>
  )
}
