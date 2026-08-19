'use client'

import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, Rows3 } from 'lucide-react'

type GrammarView = 'tables' | 'cards' | 'detail'
type GrammarGroup = 'base' | 'prefixes' | 'nouns' | 'phrase' | 'all'

type GrammarRule = {
  id: string
  group: Exclude<GrammarGroup, 'all'>
  form: string
  title: string
  does: string
  example: string
  pronunciation: string
  meaning: string
  explanation: string
  caution?: string
  reference?: string
}

type TableRow = readonly string[]
type TeachingTable = {
  id: string
  he: string
  title: string
  description: string
  headers: readonly string[]
  rows: readonly TableRow[]
  note?: string
}

const GROUPS: readonly { id: GrammarGroup; label: string }[] = [
  { id: 'base', label: 'Básicas' },
  { id: 'prefixes', label: 'Prefijos' },
  { id: 'nouns', label: 'Nombres' },
  { id: 'phrase', label: 'Frase' },
  { id: 'all', label: 'Todas' },
]

const RULES: readonly GrammarRule[] = [
  { id: 'article', group: 'base', form: 'הַ', title: 'Artículo definido', does: 'Marca algo específico: «el / la / los / las».', example: 'הַדָּבָר', pronunciation: 'ha-davár', meaning: 'la palabra / la cosa', explanation: 'El artículo se une al inicio de la palabra. Su forma normal es הַ y con frecuencia aparece un dagesh en la consonante siguiente.', caution: 'Con consonantes guturales la vocal y el dagesh pueden comportarse de otra manera; primero reconoce la función y después las excepciones.', reference: 'Deuteronomio 1:23' },
  { id: 'conjunction', group: 'base', form: 'וְ', title: 'Conjunción', does: 'Conecta palabras o ideas: normalmente «y».', example: 'וְהָאָרֶץ', pronunciation: 've-ha-árets', meaning: 'y la tierra', explanation: 'La conjunción וְ se pega a la palabra que sigue. Su vocal puede cambiar según el sonido siguiente.', caution: 'No siempre debe traducirse mecánicamente como «y»; el contexto determina su función final.', reference: 'Génesis 2:4' },
  { id: 'preposition-b', group: 'prefixes', form: 'בְּ', title: 'Preposición בְּ', does: 'Puede expresar «en», «con», «por» u otras relaciones según contexto.', example: 'בְּרֵאשִׁית', pronunciation: 'be-reshít', meaning: 'en el principio', explanation: 'בְּ es una de las preposiciones inseparables más frecuentes. Aprender a verla como una pieza ayuda a separar mentalmente la palabra.', caution: 'La traducción exacta depende de la frase completa; no tiene una equivalencia española única.', reference: 'Génesis 1:1' },
  { id: 'prepositions', group: 'prefixes', form: 'בְּ · לְ · כְּ · מִן', title: 'Preposiciones frecuentes', does: 'Introducen relaciones como en, a/para, como y desde/de.', example: 'לְאִישׁ', pronunciation: 'le-ish', meaning: 'a / para un hombre', explanation: 'בְּ, לְ y כְּ suelen funcionar como prefijos inseparables. מִן «de / desde» también puede aparecer en forma reducida unida a la palabra.', caution: 'Son piezas flexibles: la traducción cambia con el contexto y la estructura de la oración.' },
  { id: 'preposition-article', group: 'prefixes', form: 'בַּ · לַ · כַּ', title: 'Preposición + artículo', does: 'Combina una preposición con la idea de «el / la».', example: 'בַּבַּיִת', pronunciation: 'ba-báyit', meaning: 'en la casa', explanation: 'Cuando בְּ, לְ o כְּ se combinan con el artículo definido, la ה del artículo deja de verse y la vocal de la preposición cambia.', caution: 'Las guturales y otras condiciones fonológicas producen variantes; esta ficha enseña el patrón básico.' },
  { id: 'gender', group: 'nouns', form: '־ָה · ־ֶת', title: 'Pistas de género', does: 'Ayudan a reconocer muchas formas femeninas.', example: 'טוֹב · טוֹבָה', pronunciation: 'tov · tová', meaning: 'bueno · buena', explanation: 'En sustantivos y adjetivos muchas formas femeninas llevan terminaciones visibles como ־ָה. Son pistas útiles al leer.', caution: 'No son una garantía: existen palabras femeninas sin terminación femenina visible. El género real se confirma por léxico y contexto.' },
  { id: 'plural', group: 'nouns', form: '־ִים · וֹת־', title: 'Pistas de plural', does: 'Marcan con frecuencia masculino plural y femenino plural.', example: 'טוֹבִים · טוֹבוֹת', pronunciation: 'tovím · tovót', meaning: 'buenos · buenas', explanation: '־ִים aparece frecuentemente en formas masculinas plurales y וֹת־ en formas femeninas plurales.', caution: 'Hay sustantivos cuyo género gramatical no coincide con la terminación esperada; son pistas, no reglas absolutas.' },
  { id: 'agreement', group: 'phrase', form: 'הַ… הַ…', title: 'Sustantivo + adjetivo', does: 'El adjetivo normalmente concuerda con el nombre que describe.', example: 'הַדָּבָר הַטּוֹב', pronunciation: 'ha-davár ha-tóv', meaning: 'la cosa / palabra buena', explanation: 'El adjetivo suele concordar con el sustantivo en género y número. Cuando el sustantivo es definido y el adjetivo es atributivo, ambos suelen llevar artículo.', caution: 'Existen construcciones donde el adjetivo cumple otra función; esta ficha presenta el patrón atributivo básico.' },
  { id: 'construct', group: 'phrase', form: 'X + Y', title: 'Cadena constructa', does: 'Une dos nombres con una relación que en español suele expresarse con «de».', example: 'בֵּית הַמֶּלֶךְ', pronunciation: 'beit ha-mélej', meaning: 'la casa del rey', explanation: 'El primer nombre queda ligado al que sigue y ambos funcionan como una unidad. La forma del primer sustantivo puede cambiar.', caution: 'La definitud de la cadena depende del segundo elemento; no se añade el artículo directamente al primer sustantivo constructo.' },
]

const TABLES: readonly TeachingTable[] = [
  {
    id: 'inseparables', he: 'אוֹתִיּוֹת שִׁמּוּשׁ', title: 'Inseparables y prefijos frecuentes', description: 'Mira la pieza, su función y cómo queda pegada a una palabra. Aquí la comparación ayuda más que memorizar fichas aisladas.',
    headers: ['Pieza', 'Función', 'Se une como', 'Ejemplo', 'Pronunciación', 'Español'],
    rows: [
      ['הַ', 'Artículo definido', 'הַ + palabra', 'הַדָּבָר', 'ha-davár', 'la palabra / cosa'],
      ['וְ', 'Conjunción', 'וְ + palabra', 'וְהָאָרֶץ', 've-ha-árets', 'y la tierra'],
      ['בְּ', 'Preposición', 'בְּ + palabra', 'בְּרֵאשִׁית', 'be-reshít', 'en el principio'],
      ['לְ', 'Preposición', 'לְ + palabra', 'לְאִישׁ', 'le-ish', 'a / para un hombre'],
      ['כְּ', 'Preposición', 'כְּ + palabra', 'כְּמֶלֶךְ', 'ke-mélej', 'como un rey'],
      ['מִן', 'Preposición', 'מִן / forma unida', 'מִמֶּלֶךְ', 'mi-mélej', 'de / desde un rey'],
      ['בַּ · לַ · כַּ', 'Preposición + artículo', 'la ה deja de verse', 'בַּבַּיִת', 'ba-báyit', 'en la casa'],
    ],
    note: 'La vocalización exacta puede cambiar por el entorno fonológico. La tabla enseña primero el patrón visible y después las excepciones.'
  },
  {
    id: 'gender-number', he: 'מִין וּמִסְפָּר', title: 'Género y número', description: 'Compara las formas lado a lado. Las terminaciones ayudan a reconocer patrones, pero no sustituyen el género real de cada palabra.',
    headers: ['Categoría', 'Patrón frecuente', 'Ejemplo', 'Pronunciación', 'Español'],
    rows: [
      ['Masculino singular', 'forma base', 'טוֹב', 'tov', 'bueno'],
      ['Femenino singular', '־ָה frecuente', 'טוֹבָה', 'tová', 'buena'],
      ['Masculino plural', '־ִים frecuente', 'טוֹבִים', 'tovím', 'buenos'],
      ['Femenino plural', 'וֹת־ frecuente', 'טוֹבוֹת', 'tovót', 'buenas'],
    ],
    note: 'Existen excepciones. VIDA presentará estas terminaciones como pistas visuales, nunca como regla absoluta para todo sustantivo.'
  },
  {
    id: 'possessives', he: 'כִּנּוּיֵי קִנְיָן', title: 'Sufijos posesivos', description: 'La idea de mi, tu, su o nuestro puede quedar unida al final del sustantivo. La base puede cambiar al recibir el sufijo.',
    headers: ['Persona', 'Sufijo frecuente', 'Idea en español', 'Qué debes observar'],
    rows: [
      ['1ª singular', '־ִי', 'mi', 'se añade a la forma ligada del nombre'],
      ['2ª masc. singular', '־ְךָ', 'tu', 'la vocal del sustantivo puede ajustarse'],
      ['2ª fem. singular', '־ֵךְ', 'tu', 'distinguirla de la forma masculina'],
      ['3ª masc. singular', '־וֹ', 'su / de él', 'la וֹ forma parte del sufijo'],
      ['3ª fem. singular', '־ָהּ', 'su / de ella', 'la ה final lleva función posesiva'],
      ['1ª plural', '־ֵנוּ', 'nuestro/a', 'se une al sustantivo'],
      ['2ª masc. plural', '־ְכֶם', 'vuestro / de ustedes', 'forma plural masculina'],
      ['2ª fem. plural', '־ְכֶן', 'vuestro / de ustedes', 'forma plural femenina'],
      ['3ª masc. plural', '־ָם', 'su / de ellos', 'forma plural masculina'],
      ['3ª fem. plural', '־ָן', 'su / de ellas', 'forma plural femenina'],
    ],
    note: 'La tabla enseña los sufijos. Las transformaciones completas de cada tipo de sustantivo se practicarán con palabras reales del corpus.'
  },
  {
    id: 'construct', he: 'סְמִיכוּת', title: 'Estado constructo', description: 'Dos nombres pueden formar una unidad. El primero queda ligado al segundo y a menudo cambia de forma.',
    headers: ['Forma', 'Ejemplo', 'Pronunciación', 'Idea', 'Regla visual'],
    rows: [
      ['Absoluta', 'בַּיִת', 'báyit', 'casa', 'puede aparecer por sí sola'],
      ['Constructa', 'בֵּית', 'beit', 'casa de…', 'espera otro nombre después'],
      ['Cadena', 'בֵּית הַמֶּלֶךְ', 'beit ha-mélej', 'la casa del rey', 'el segundo elemento determina la definitud de la cadena'],
    ],
    note: 'Esta relación es central para leer sintagmas nominales del hebreo bíblico.'
  },
  {
    id: 'qere-ketiv', he: 'קְרֵי וּכְתִיב', title: 'Qere / Ketiv', description: 'Distingue lo que está escrito en la tradición consonántica de lo que la tradición masorética indica que debe leerse.',
    headers: ['Término', 'Hebreo', 'Qué significa', 'Qué haces al leer'],
    rows: [
      ['Ketiv', 'כְּתִיב', 'lo escrito', 'observas las consonantes conservadas en el texto'],
      ['Qere', 'קְרֵי', 'lo leído', 'sigues la lectura indicada por la tradición masorética'],
      ['Qere perpetuum', 'קְרֵי קָבוּעַ', 'lectura tradicional recurrente', 'se reconoce como convención estable de lectura'],
    ],
    note: 'VIDA lo enseñará de forma lingüística y textual, sin convertir una interpretación religiosa particular en regla gramatical.'
  },
]

function Introduction() {
  const [open, setOpen] = useState(false)
  return <section className="border-y border-slate-200 text-left"><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2"><span><span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">דִּקְדּוּק</span><span className="mt-0.5 block text-sm font-black text-slate-950">¿Cómo vamos a aprender las reglas?</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="border-t border-slate-200 p-4"><div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]"><p>No todo se aprende de la misma manera. Las fichas sirven para memorizar una regla individual; las tablas sirven para comparar cambios y reconocer patrones.</p><p>El recorrido será: explicación breve → tabla o ficha → transformación visible → ejemplo → práctica en palabras y frases reales.</p><p>Las excepciones se muestran cuando importan. No deduciremos raíces, traducciones o pronunciaciones que nuestras fuentes no tengan verificadas.</p></div></div>}</section>
}

function ViewControl({ view, onChange }: { view: GrammarView; onChange: (view: GrammarView) => void }) {
  const views = [
    { id: 'tables' as const, label: 'Tablas', Icon: Rows3 },
    { id: 'cards' as const, label: 'Fichas', Icon: Grid2X2 },
    { id: 'detail' as const, label: 'Detalle', Icon: Rows3 },
  ]
  return <div className="grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1" aria-label="Forma de estudiar reglas">{views.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[11px] font-black ${view === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
}

function RuleDetail({ rule, compact = false }: { rule: GrammarRule; compact?: boolean }) {
  return <article className={`${compact ? 'mt-3' : ''} overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.07)]`}><div className="p-5 text-center"><p lang="he" dir="rtl" className={`${compact ? 'text-[3.4rem]' : 'text-[4.2rem]'} break-words font-black leading-tight text-indigo-700`}>{rule.form}</p><h3 className="mt-2 text-xl font-black text-slate-950">{rule.title}</h3><p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">{rule.does}</p><div className="mt-5 rounded-[20px] bg-slate-50 px-4 py-4"><p lang="he" dir="rtl" className="text-[2.7rem] font-black leading-tight text-slate-950">{rule.example}</p><p className="mt-2 text-[13px] font-black text-indigo-700">{rule.pronunciation}</p><p className="mt-1 text-sm font-black text-slate-800">{rule.meaning}</p>{rule.reference && <p className="mt-2 text-[10px] font-bold text-slate-400">Ejemplo: {rule.reference}</p>}</div><div className="mt-5 divide-y divide-slate-200 border-y border-slate-200 text-left"><div className="py-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cómo funciona</p><p className="mt-1 text-[14px] font-semibold leading-relaxed text-slate-700">{rule.explanation}</p></div>{rule.caution && <div className="py-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">Ten en cuenta</p><p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-600">{rule.caution}</p></div>}</div></div></article>
}

function chunkRules(rules: readonly GrammarRule[], size: number) {
  const rows: GrammarRule[][] = []
  for (let index = 0; index < rules.length; index += size) rows.push(rules.slice(index, index + size) as GrammarRule[])
  return rows
}

function CardsView({ rules, selectedId, closingId, onToggle }: { rules: readonly GrammarRule[]; selectedId: string | null; closingId: string | null; onToggle: (rule: GrammarRule) => void }) {
  return <div className="space-y-4">{chunkRules(rules, 2).map((row, rowIndex) => { const selected = row.find(rule => rule.id === selectedId) ?? null; return <div key={`grammar-row-${rowIndex}`}><div className="grid grid-cols-2 gap-3">{row.map(rule => { const active = rule.id === selectedId; return <button key={rule.id} type="button" aria-pressed={active} onClick={() => onToggle(rule)} className={`min-h-[132px] min-w-0 rounded-[22px] border px-3 py-3 text-center transition active:scale-[0.98] motion-reduce:transition-none ${active ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-950'}`}><span lang="he" dir="rtl" className={`block break-words text-[2.25rem] font-black leading-tight ${active ? 'text-white' : 'text-indigo-700'}`}>{rule.form}</span><span className="mt-2 block break-words text-[13px] font-black leading-tight">{rule.title}</span><span className={`mt-1 block text-[10px] font-bold leading-snug ${active ? 'text-indigo-100' : 'text-slate-400'}`}>{rule.does}</span></button> })}</div>{selected && <div className={closingId === selected.id ? 'scale-[0.96] opacity-0 transition duration-150 motion-reduce:transition-none' : 'scale-100 opacity-100 transition duration-200 motion-reduce:transition-none'}><RuleDetail rule={selected} compact /></div>}</div> })}</div>
}

function TeachingTables() {
  return <div className="space-y-3">{TABLES.map((table, index) => <details key={table.id} open={index === 0} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3"><span className="min-w-0"><span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">{table.he}</span><span className="mt-0.5 block text-[14px] font-black text-slate-950">{table.title}</span></span><ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /></summary><div className="border-t border-slate-100 px-3 pb-4 pt-3"><p className="mb-3 text-[12px] font-semibold leading-relaxed text-slate-500">{table.description}</p><div className="overflow-x-auto rounded-[16px] border border-slate-200 [-webkit-overflow-scrolling:touch]"><table className="w-full min-w-[720px] border-collapse text-left text-[12px]"><thead className="bg-slate-50"><tr>{table.headers.map(header => <th key={header} className="border-b border-slate-200 px-3 py-2.5 font-black text-slate-600">{header}</th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={`${table.id}-${rowIndex}`} className="border-b border-slate-100 last:border-b-0">{row.map((cell, cellIndex) => { const hebrew = /[\u0590-\u05FF]/.test(cell); return <td key={`${table.id}-${rowIndex}-${cellIndex}`} className={`px-3 py-3 align-top font-semibold leading-relaxed ${cellIndex === 0 || hebrew ? 'text-slate-950' : 'text-slate-600'}`}><span dir={hebrew ? 'rtl' : undefined} lang={hebrew ? 'he' : undefined} className={hebrew ? 'text-[15px] font-black' : ''}>{cell}</span></td> })}</tr>)}</tbody></table></div>{table.note && <p className="mt-3 text-[11px] font-semibold leading-relaxed text-amber-800">{table.note}</p>}</div></details>)}</div>
}

function DetailView({ rule, onPrevious, onNext, hasPrevious, hasNext }: { rule: GrammarRule; onPrevious: () => void; onNext: () => void; hasPrevious: boolean; hasNext: boolean }) {
  return <div><RuleDetail rule={rule} /><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" disabled={!hasPrevious} onClick={onPrevious} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-[12px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Anterior</button><button type="button" disabled={!hasNext} onClick={onNext} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-[12px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" /></button></div></div>
}

export default function GrammarExplorer() {
  const [group, setGroup] = useState<GrammarGroup>('base')
  const [view, setView] = useState<GrammarView>('tables')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [detailIndex, setDetailIndex] = useState(0)

  const filtered = group === 'all' ? RULES : RULES.filter(rule => rule.group === group)
  const detailRule = filtered[detailIndex] ?? filtered[0]

  function changeGroup(next: GrammarGroup) { setGroup(next); setSelectedId(null); setClosingId(null); setDetailIndex(0) }
  function toggleRule(rule: GrammarRule) {
    if (selectedId !== rule.id) { setClosingId(null); setSelectedId(rule.id); return }
    setClosingId(rule.id)
    window.setTimeout(() => { setSelectedId(current => current === rule.id ? null : current); setClosingId(null) }, 160)
  }

  return <section aria-labelledby="grammar-title" className="text-left"><div className="text-center"><p lang="he" dir="rtl" className="text-[1rem] font-black text-indigo-700">דִּקְדּוּק</p><h2 id="grammar-title" className="mt-0.5 text-[1.65rem] font-black tracking-[-0.025em] text-slate-950">Reglas para entender lo que lees</h2><p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">Compara transformaciones en tablas y usa fichas cuando necesites memorizar una regla concreta.</p></div><div className="mt-5"><Introduction /></div><div className="mt-4"><ViewControl view={view} onChange={next => { setView(next); setSelectedId(null); setClosingId(null); setDetailIndex(0) }} /></div>{view !== 'tables' && <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex min-w-max gap-2">{GROUPS.map(item => <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => changeGroup(item.id)} className={`min-h-11 rounded-full border px-4 text-[12px] font-black ${group === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}</div></div>}<div className="mt-5">{view === 'tables' && <TeachingTables />}{view === 'cards' && <CardsView rules={filtered} selectedId={selectedId} closingId={closingId} onToggle={toggleRule} />}{view === 'detail' && detailRule && <DetailView rule={detailRule} hasPrevious={detailIndex > 0} hasNext={detailIndex < filtered.length - 1} onPrevious={() => setDetailIndex(value => Math.max(0, value - 1))} onNext={() => setDetailIndex(value => Math.min(filtered.length - 1, value + 1))} />}</div><p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">Referencia pedagógica mixta: fichas para memoria; tablas para comparación. Raíces y sistema verbal se incorporarán por capas y con datos verificados.</p></section>
}
