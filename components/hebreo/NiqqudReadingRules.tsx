'use client'

import { useState } from 'react'

type ReadingRule = 'sheva' | 'qamats' | 'furtive' | 'syllables'

type RuleSpec = {
  id: ReadingRule
  label: string
  he: string
  title: string
  intro: string
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  note: string
}

const RULES: readonly RuleSpec[] = [
  {
    id: 'sheva',
    label: 'Sheva',
    he: 'שְׁוָא',
    title: 'Sheva: puede sonar o quedar silencioso',
    intro: 'Los dos puntos verticales no representan siempre una vocal fija. Primero aprende a reconocer dos funciones y después aplicaremos reglas de contexto.',
    headers: ['Función', 'Qué ocurre', 'Ejemplo', 'Lectura orientativa', 'Qué debes observar'],
    rows: [
      ['Sheva vocal', 'abre una sílaba con vocal muy breve', 'בְּרֵאשִׁית', 'be / bə-reshít', 'al inicio de palabra suele estudiarse como vocal'],
      ['Sheva silencioso', 'cierra la sílaba anterior y no añade vocal', 'מַלְכָּה', 'mal-ká', 'el sheva bajo ל no se lee como una e independiente'],
    ],
    note: 'La clasificación completa del sheva depende de estructura silábica y tradición de lectura. VIDA no convertirá una regla inicial en una fórmula absoluta.',
  },
  {
    id: 'qamats',
    label: 'Qamats',
    he: 'קָמָץ',
    title: 'Qamats: a y qamats qatan',
    intro: 'La forma de qamats suele leerse a, pero existe qamats qatan con valor o. El contexto y la edición del texto ayudan a distinguirlos.',
    headers: ['Tipo', 'Signo', 'Ejemplo', 'Lectura', 'Idea'],
    rows: [
      ['Qamats común', 'לָ', 'דָּבָר', 'davár', 'en esta palabra el qamats se lee a'],
      ['Qamats qatan', 'ׇ', 'כָּל', 'kol', 'en כָּל la tradición de lectura conserva o'],
    ],
    note: 'Algunas ediciones codifican qamats qatan con un signo específico y otras dependen del contexto. No se debe convertir todo qamats en a de forma automática.',
  },
  {
    id: 'furtive',
    label: 'Pataj furtivo',
    he: 'פַּתַח גְּנוּבָה',
    title: 'Pataj furtivo: se oye antes de la consonante final',
    intro: 'Cuando ciertas guturales cierran una palabra, un pataj escrito debajo puede pronunciarse antes de esa consonante aunque visualmente aparezca debajo de ella.',
    headers: ['Palabra', 'Final', 'Cómo se lee', 'Qué sucede'],
    rows: [
      ['רוּחַ', 'חַ', 'rúaj / rúaḥ', 'la a se pronuncia antes del sonido final de ח'],
      ['גָּבוֹהַּ', 'הַּ', 'gavóah', 'la a se oye antes de la consonante final'],
    ],
    note: 'El pataj furtivo no crea una sílaba posterior a la consonante final: la vocal se anticipa en la pronunciación.',
  },
  {
    id: 'syllables',
    label: 'Sílabas',
    he: 'הֲבָרוֹת',
    title: 'Del signo a la sílaba y de la sílaba a la palabra',
    intro: 'La meta no es memorizar puntos aislados. Une consonante + niqqud, reconoce la sílaba y después lee la secuencia completa.',
    headers: ['Paso', 'Forma', 'Lectura', 'Qué haces'],
    rows: [
      ['1 · consonante', 'מ', 'm', 'reconoces la letra'],
      ['2 · consonante + vocal', 'מֶ', 'me', 'lees una sílaba'],
      ['3 · otra sílaba', 'לֶ', 'le', 'mantienes el ritmo sin nombrar cada signo'],
      ['4 · palabra', 'מֶלֶךְ', 'mélej', 'unes las sílabas y reconoces «rey»'],
      ['5 · sin ayudas', 'מלך', 'mélej', 'intentas reconocer la misma palabra sin niqqud'],
    ],
    note: 'La división silábica completa del hebreo bíblico tiene reglas adicionales. Esta tabla enseña el tránsito visual necesario para empezar a leer palabras.',
  },
]

function isHebrewOnly(value: string) {
  const compact = value.trim()
  return compact.length > 0 && /[\u0590-\u05FF]/u.test(compact) && /^[\s·\u0590-\u05FF]+$/u.test(compact)
}

function RuleTable({ rule }: { rule: RuleSpec }) {
  return (
    <div>
      <p lang="he" dir="rtl" className="text-[1.35rem] font-black text-indigo-700">{rule.he}</p>
      <h4 className="mt-0.5 text-[1.15rem] font-black text-slate-950">{rule.title}</h4>
      <p className="mx-auto mt-1 max-w-xl text-[13px] font-semibold leading-relaxed text-slate-500">{rule.intro}</p>
      <div className="-mx-4 mt-4 overflow-x-auto border-y border-slate-200 bg-white [-webkit-overflow-scrolling:touch] sm:mx-0 sm:rounded-[20px] sm:border">
        <table className="w-full min-w-[690px] border-collapse text-center">
          <thead className="bg-slate-50"><tr>{rule.headers.map(header => <th key={header} className="border-b border-slate-200 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.05em] text-slate-500">{header}</th>)}</tr></thead>
          <tbody>{rule.rows.map((row, rowIndex) => <tr key={`${rule.id}-${rowIndex}`} className="border-b border-slate-100 last:border-b-0">{row.map((cell, cellIndex) => { const hebrewOnly = isHebrewOnly(cell); return <td key={`${rule.id}-${rowIndex}-${cellIndex}`} className="px-3 py-3.5 align-middle text-[12px] font-semibold leading-relaxed text-slate-700"><span lang={hebrewOnly ? 'he' : undefined} dir={hebrewOnly ? 'rtl' : undefined} className={hebrewOnly ? 'text-[2rem] font-black leading-tight text-indigo-700' : cellIndex === 0 ? 'font-black text-slate-950' : ''}>{cell}</span></td> })}</tr>)}</tbody>
        </table>
      </div>
      <p className="mx-auto mt-3 max-w-xl text-[11px] font-semibold leading-relaxed text-amber-800">{rule.note}</p>
    </div>
  )
}

export default function NiqqudReadingRules() {
  const [activeId, setActiveId] = useState<ReadingRule>('sheva')
  const active = RULES.find(rule => rule.id === activeId) ?? RULES[0]

  return (
    <section aria-labelledby="niqqud-rules-title" className="mb-5 border-y border-slate-200 py-4 text-center">
      <p lang="he" dir="rtl" className="text-[12px] font-black text-indigo-700">כְּלָלֵי קְרִיאָה</p>
      <h3 id="niqqud-rules-title" className="mt-0.5 text-[1.05rem] font-black text-slate-950">Reglas para empezar a leer</h3>
      <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-slate-500">Reconoce el signo, entiende qué cambia y aplícalo dentro de una palabra real.</p>
      <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex w-max gap-2">{RULES.map(rule => <button key={rule.id} type="button" aria-pressed={activeId === rule.id} onClick={() => setActiveId(rule.id)} className={`min-h-10 rounded-full border px-4 text-[11px] font-black ${activeId === rule.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{rule.label}</button>)}</div>
      </div>
      <div className="mt-4"><RuleTable rule={active} /></div>
    </section>
  )
}
