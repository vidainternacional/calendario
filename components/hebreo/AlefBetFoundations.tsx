'use client'

import { useState } from 'react'

type FoundationTab = 'sofit' | 'dagesh' | 'matres'

type TableSpec = {
  id: FoundationTab
  label: string
  he: string
  title: string
  intro: string
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  note: string
}

const TABLES: readonly TableSpec[] = [
  {
    id: 'sofit',
    label: 'Sofit',
    he: 'אוֹתִיּוֹת סוֹפִיּוֹת',
    title: 'Las cinco formas finales',
    intro: 'Compara la forma normal con la que aparece únicamente al final de una palabra. La letra sigue siendo la misma.',
    headers: ['Normal', 'Final', 'Nombre', 'Sonido', 'Valor ordinario', 'Convención ampliada'],
    rows: [
      ['כ', 'ך', 'Kaf', 'k / j según dagesh', '20', '500'],
      ['מ', 'ם', 'Mem', 'm', '40', '600'],
      ['נ', 'ן', 'Nun', 'n', '50', '700'],
      ['פ', 'ף', 'Pe', 'p / f según dagesh', '80', '800'],
      ['צ', 'ץ', 'Tsadi', 'ts', '90', '900'],
    ],
    note: '500–900 es una convención extendida de gematría para las formas finales. El valor ordinario de la letra sigue siendo 20, 40, 50, 80 o 90.',
  },
  {
    id: 'dagesh',
    label: 'Dagesh',
    he: 'דָּגֵשׁ',
    title: 'Begadkefat y el punto interior',
    intro: 'El dagesh es un punto dentro de una consonante. En las letras begadkefat puede señalar una realización más “fuerte”; además existe dagesh fuerte con otra función gramatical.',
    headers: ['Sin punto', 'Con dagesh', 'Nombre', 'Lectura inicial', 'Qué observar'],
    rows: [
      ['ב', 'בּ', 'Bet', 'v → b', 'Contraste muy útil desde el inicio.'],
      ['ג', 'גּ', 'Gimel', 'g', 'La diferencia histórica depende de la tradición de lectura.'],
      ['ד', 'דּ', 'Dalet', 'd', 'La diferencia histórica depende de la tradición de lectura.'],
      ['כ', 'כּ', 'Kaf', 'j / kh → k', 'Contraste muy útil desde el inicio.'],
      ['פ', 'פּ', 'Pe', 'f → p', 'Contraste muy útil desde el inicio.'],
      ['ת', 'תּ', 'Tav', 't', 'La realización sin dagesh varía entre tradiciones.'],
    ],
    note: 'No todo dagesh hace exactamente lo mismo. Más adelante VIDA separará dagesh qal (begadkefat) y dagesh fuerte dentro de palabras reales.',
  },
  {
    id: 'matres',
    label: 'Matres',
    he: 'אִמּוֹת קְרִיאָה',
    title: 'Letras que también pueden ayudar a leer vocales',
    intro: 'Alef, He, Vav y Yod siguen siendo letras consonánticas, pero en determinados contextos también ayudan a representar o sostener una vocal.',
    headers: ['Letra', 'Nombre', 'Como consonante', 'Como ayuda vocálica', 'Ejemplo visual'],
    rows: [
      ['א', 'Alef', 'cierre/glotal o silenciosa según contexto', 'puede quedar quiescente y apoyar la escritura de una vocal', 'רֹאשׁ'],
      ['ה', 'He', 'h', 'al final puede acompañar una vocal final', 'תּוֹרָה'],
      ['ו', 'Vav', 'v', 'וֹ puede apoyar o; וּ representa u como shuruq', 'אוֹר · שׁוּב'],
      ['י', 'Yod', 'y', 'puede apoyar vocales i/e en ciertas escrituras', 'שִׁיר'],
    ],
    note: '“Mater lectionis” describe una función de lectura, no una categoría de vocal independiente. Para el aprendizaje inicial del curso, Vav se enseña con sonido v.',
  },
]

function isHebrewOnly(value: string) {
  const compact = value.trim()
  return compact.length > 0 && /[\u0590-\u05FF]/u.test(compact) && /^[\s·\u0590-\u05FF]+$/u.test(compact)
}

function FoundationTable({ table }: { table: TableSpec }) {
  return (
    <div>
      <p lang="he" dir="rtl" className="text-[1.35rem] font-black text-indigo-700">{table.he}</p>
      <h4 className="mt-0.5 text-[1.15rem] font-black text-slate-950">{table.title}</h4>
      <p className="mx-auto mt-1 max-w-xl text-[13px] font-semibold leading-relaxed text-slate-500">{table.intro}</p>
      <div className="-mx-4 mt-4 overflow-x-auto border-y border-slate-200 bg-white [-webkit-overflow-scrolling:touch] sm:mx-0 sm:rounded-[20px] sm:border">
        <table className="w-full min-w-[720px] border-collapse text-center">
          <thead className="bg-slate-50">
            <tr>{table.headers.map(header => <th key={header} className="border-b border-slate-200 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.05em] text-slate-500">{header}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.id}-${rowIndex}`} className="border-b border-slate-100 last:border-b-0">
                {row.map((cell, cellIndex) => {
                  const hebrewOnly = isHebrewOnly(cell)
                  const primaryHebrew = hebrewOnly && (cellIndex === 0 || cellIndex === 1)
                  return <td key={`${table.id}-${rowIndex}-${cellIndex}`} className="px-3 py-3.5 align-middle text-[12px] font-semibold leading-relaxed text-slate-700"><span lang={hebrewOnly ? 'he' : undefined} dir={hebrewOnly ? 'rtl' : undefined} className={primaryHebrew ? 'text-[3rem] font-black leading-none text-indigo-700' : hebrewOnly ? 'text-[1.45rem] font-black text-slate-950' : cellIndex === 2 ? 'font-black text-slate-950' : ''}>{cell}</span></td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mx-auto mt-3 max-w-xl text-[11px] font-semibold leading-relaxed text-amber-800">{table.note}</p>
    </div>
  )
}

export default function AlefBetFoundations() {
  const [tab, setTab] = useState<FoundationTab>('sofit')
  const active = TABLES.find(table => table.id === tab) ?? TABLES[0]

  return (
    <section aria-labelledby="alef-foundations-title" className="mb-5 border-y border-slate-200 py-4 text-center">
      <p lang="he" dir="rtl" className="text-[12px] font-black text-indigo-700">יְסוֹדוֹת קְרִיאָה</p>
      <h3 id="alef-foundations-title" className="mt-0.5 text-[1.05rem] font-black text-slate-950">Tablas fundamentales</h3>
      <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-slate-500">Fichas para memorizar; estas tablas para comparar formas que cambian al leer.</p>
      <div className="mx-auto mt-3 grid max-w-md grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1">
        {TABLES.map(table => <button key={table.id} type="button" aria-pressed={tab === table.id} onClick={() => setTab(table.id)} className={`min-h-10 rounded-[14px] px-2 text-[11px] font-black ${tab === table.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{table.label}</button>)}
      </div>
      <div className="mt-4"><FoundationTable table={active} /></div>
    </section>
  )
}
