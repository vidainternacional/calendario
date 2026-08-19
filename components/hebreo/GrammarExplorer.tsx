'use client'

import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, List, Rows3 } from 'lucide-react'

type GrammarView = 'cards' | 'list' | 'detail'
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

const GROUPS: readonly { id: GrammarGroup; label: string }[] = [
  { id: 'base', label: 'Básicas' },
  { id: 'prefixes', label: 'Prefijos' },
  { id: 'nouns', label: 'Nombres' },
  { id: 'phrase', label: 'Frase' },
  { id: 'all', label: 'Todas' },
]

const RULES: readonly GrammarRule[] = [
  {
    id: 'article',
    group: 'base',
    form: 'הַ',
    title: 'Artículo definido',
    does: 'Marca algo específico: «el / la / los / las».',
    example: 'הַדָּבָר',
    pronunciation: 'ha-davár',
    meaning: 'la palabra / la cosa',
    explanation: 'El artículo se une al inicio de la palabra. Su forma normal es הַ y frecuentemente aparece un dagesh en la consonante siguiente.',
    caution: 'Con consonantes guturales la vocal y el dagesh pueden comportarse de otra manera; conviene reconocer primero la función y después estudiar las excepciones.',
    reference: 'Deuteronomio 1:23',
  },
  {
    id: 'conjunction',
    group: 'base',
    form: 'וְ',
    title: 'Conjunción',
    does: 'Conecta palabras o ideas: normalmente «y».',
    example: 'וְהָאָרֶץ',
    pronunciation: 've-ha-árets',
    meaning: 'y la tierra',
    explanation: 'La conjunción וְ no va separada: se pega a la palabra que sigue. Su vocal puede cambiar según el sonido que encuentre después.',
    caution: 'No siempre debe traducirse mecánicamente como «y»; el contexto de la frase determina su función final.',
    reference: 'Génesis 2:4',
  },
  {
    id: 'preposition-b',
    group: 'prefixes',
    form: 'בְּ',
    title: 'Preposición בְּ',
    does: 'Puede expresar «en», «con», «por» u otras relaciones según contexto.',
    example: 'בְּרֵאשִׁית',
    pronunciation: 'be-reshít',
    meaning: 'en el principio',
    explanation: 'Muchas preposiciones hebreas se unen directamente a la palabra. בְּ es una de las más frecuentes y por eso aprender a verla como una pieza ayuda a separar mentalmente la palabra.',
    caution: 'La traducción exacta de una preposición depende de la frase completa; no tiene una equivalencia española única en todos los casos.',
    reference: 'Génesis 1:1',
  },
  {
    id: 'prepositions',
    group: 'prefixes',
    form: 'בְּ · לְ · כְּ · מִן',
    title: 'Preposiciones frecuentes',
    does: 'Introducen relaciones como en, a/para, como y desde/de.',
    example: 'לְאִישׁ',
    pronunciation: 'le-ish',
    meaning: 'a / para un hombre',
    explanation: 'בְּ, לְ y כְּ suelen funcionar como prefijos inseparables. מִן «de / desde» también puede aparecer en una forma acortada unida a la palabra.',
    caution: 'Son piezas muy flexibles: la traducción cambia con el contexto y con la estructura de la oración.',
  },
  {
    id: 'preposition-article',
    group: 'prefixes',
    form: 'בַּ · לַ · כַּ',
    title: 'Preposición + artículo',
    does: 'Combina una preposición con la idea de «el / la».',
    example: 'בַבֹּקֶר',
    pronunciation: 'ba-bóker',
    meaning: 'en la mañana',
    explanation: 'Cuando בְּ, לְ o כְּ se combinan con el artículo definido, la ה del artículo deja de verse y la vocal de la preposición cambia. Así una sola pieza puede contener dos funciones.',
    caution: 'Las guturales y otras condiciones fonológicas producen variantes; esta ficha enseña el patrón básico, no todas las excepciones.',
    reference: 'Isaías 5:11',
  },
  {
    id: 'gender',
    group: 'nouns',
    form: '־ָה · ־ֶת',
    title: 'Pistas de género',
    does: 'Ayudan a reconocer muchas formas femeninas.',
    example: 'טוֹב · טוֹבָה',
    pronunciation: 'tov · tová',
    meaning: 'bueno · buena',
    explanation: 'En sustantivos y adjetivos, muchas formas femeninas llevan terminaciones visibles como ־ָה. Estas terminaciones son pistas útiles al leer.',
    caution: 'No son una garantía: existen palabras femeninas sin terminación femenina visible, como אֶרֶץ «tierra». El género real se confirma por el léxico y el contexto.',
  },
  {
    id: 'plural',
    group: 'nouns',
    form: '־ִים · וֹת־',
    title: 'Pistas de plural',
    does: 'Marcan con frecuencia masculino plural y femenino plural.',
    example: 'טוֹבִים · טוֹבוֹת',
    pronunciation: 'tovím · tovót',
    meaning: 'buenos · buenas',
    explanation: '־ִים aparece con mucha frecuencia en formas masculinas plurales y וֹת־ en formas femeninas plurales. Reconocer estas terminaciones permite anticipar número y concordancia.',
    caution: 'Hay sustantivos cuyo género gramatical no coincide con la terminación que parece esperarse; por eso se presentan como pistas y no como reglas absolutas.',
  },
  {
    id: 'agreement',
    group: 'phrase',
    form: 'הַ… הַ…',
    title: 'Sustantivo + adjetivo',
    does: 'El adjetivo normalmente concuerda con el nombre que describe.',
    example: 'הַדָּבָר הַטּוֹב',
    pronunciation: 'ha-davár ha-tóv',
    meaning: 'la cosa / palabra buena',
    explanation: 'En hebreo bíblico el adjetivo suele concordar con el sustantivo en género y número. Cuando el sustantivo es definido y el adjetivo lo describe atributivamente, ambos suelen llevar el artículo.',
    caution: 'Existen construcciones donde el adjetivo cumple otra función; esta ficha presenta el patrón atributivo básico.',
    reference: 'Josué 21:45',
  },
  {
    id: 'construct',
    group: 'phrase',
    form: 'X + Y',
    title: 'Cadena constructa',
    does: 'Une dos nombres con una relación que en español suele expresarse con «de».',
    example: 'אֶרֶץ מִצְרַיִם',
    pronunciation: 'érets mitsráyim',
    meaning: 'tierra de Egipto',
    explanation: 'El primer nombre queda ligado al que sigue y ambos funcionan como una unidad. Esta relación es una de las claves para entender cómo se forman muchas expresiones hebreas.',
    caution: 'La forma del primer sustantivo puede cambiar. Más adelante se estudiarán esos cambios cuando el patrón ya resulte familiar.',
    reference: 'Deuteronomio 10:19',
  },
]

function Introduction() {
  const [open, setOpen] = useState(false)
  return (
    <section className="border-y border-slate-200 text-left">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2">
        <span>
          <span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">דִּקְדּוּק</span>
          <span className="mt-0.5 block text-sm font-black text-slate-950">¿Cómo funcionan las reglas?</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-slate-200 p-4">
          <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]">
            <p>En hebreo varias palabras se forman añadiendo pequeñas piezas al principio o al final. Aprender a reconocerlas permite dejar de ver una palabra como un bloque desconocido.</p>
            <p>Primero estudiaremos patrones muy frecuentes. Las excepciones aparecen dentro de la ficha correspondiente y no se presentan como reglas absolutas.</p>
            <p>La raíz verbal y los patrones verbales requieren una etapa propia. No se deducirán raíces automáticamente cuando nuestra base no las tenga verificadas.</p>
          </div>
        </div>
      )}
    </section>
  )
}

function ViewControl({ view, onChange }: { view: GrammarView; onChange: (view: GrammarView) => void }) {
  const views = [
    { id: 'cards' as const, label: 'Tarjetas', Icon: Grid2X2 },
    { id: 'list' as const, label: 'Lista', Icon: List },
    { id: 'detail' as const, label: 'Detalle', Icon: Rows3 },
  ]
  return (
    <div className="grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1" aria-label="Vista de reglas">
      {views.map(({ id, label, Icon }) => (
        <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[11px] font-black ${view === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</button>
      ))}
    </div>
  )
}

function RuleDetail({ rule, compact = false }: { rule: GrammarRule; compact?: boolean }) {
  return (
    <article className={`${compact ? 'mt-3' : ''} overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.07)]`}>
      <div className="p-5 text-center">
        <p lang="he" dir="rtl" className={`${compact ? 'text-[3.4rem]' : 'text-[4.2rem]'} break-words font-black leading-tight text-indigo-700`}>{rule.form}</p>
        <h3 className="mt-2 text-xl font-black text-slate-950">{rule.title}</h3>
        <p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-500">{rule.does}</p>
        <div className="mt-5 rounded-[20px] bg-slate-50 px-4 py-4">
          <p lang="he" dir="rtl" className="text-[2.7rem] font-black leading-tight text-slate-950">{rule.example}</p>
          <p className="mt-2 text-[13px] font-black text-indigo-700">{rule.pronunciation}</p>
          <p className="mt-1 text-sm font-black text-slate-800">{rule.meaning}</p>
          {rule.reference && <p className="mt-2 text-[10px] font-bold text-slate-400">Ejemplo: {rule.reference}</p>}
        </div>
        <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200 text-left">
          <div className="py-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cómo funciona</p><p className="mt-1 text-[14px] font-semibold leading-relaxed text-slate-700">{rule.explanation}</p></div>
          {rule.caution && <div className="py-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">Ten en cuenta</p><p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-600">{rule.caution}</p></div>}
        </div>
      </div>
    </article>
  )
}

function chunkRules(rules: readonly GrammarRule[], size: number) {
  const rows: GrammarRule[][] = []
  for (let index = 0; index < rules.length; index += size) rows.push(rules.slice(index, index + size) as GrammarRule[])
  return rows
}

function CardsView({ rules, selectedId, closingId, onToggle }: { rules: readonly GrammarRule[]; selectedId: string | null; closingId: string | null; onToggle: (rule: GrammarRule) => void }) {
  return (
    <div className="space-y-4">
      {chunkRules(rules, 2).map((row, rowIndex) => {
        const selected = row.find(rule => rule.id === selectedId) ?? null
        return (
          <div key={`grammar-row-${rowIndex}`}>
            <div className="grid grid-cols-2 gap-3">
              {row.map(rule => {
                const active = rule.id === selectedId
                return (
                  <button key={rule.id} type="button" aria-pressed={active} onClick={() => onToggle(rule)} className={`min-h-[132px] min-w-0 rounded-[22px] border px-3 py-3 text-center transition active:scale-[0.98] motion-reduce:transition-none ${active ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-950'}`}>
                    <span lang="he" dir="rtl" className={`block break-words text-[2.25rem] font-black leading-tight ${active ? 'text-white' : 'text-indigo-700'}`}>{rule.form}</span>
                    <span className="mt-2 block break-words text-[13px] font-black leading-tight">{rule.title}</span>
                    <span className={`mt-1 block text-[10px] font-bold leading-snug ${active ? 'text-indigo-100' : 'text-slate-400'}`}>{rule.does}</span>
                  </button>
                )
              })}
            </div>
            {selected && <div className={closingId === selected.id ? 'scale-[0.96] opacity-0 transition duration-150 motion-reduce:transition-none' : 'scale-100 opacity-100 transition duration-200 motion-reduce:transition-none'}><RuleDetail rule={selected} compact /></div>}
          </div>
        )
      })}
    </div>
  )
}

function ListView({ rules }: { rules: readonly GrammarRule[] }) {
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {rules.map(rule => (
        <div key={rule.id} className="grid min-h-[82px] grid-cols-[86px_minmax(0,1fr)] items-center gap-3 py-3">
          <div className="text-center"><p lang="he" dir="rtl" className="break-words text-[1.7rem] font-black leading-tight text-indigo-700">{rule.form}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">Forma</p></div>
          <div className="min-w-0"><p className="text-[13px] font-black text-slate-900">{rule.title}</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">{rule.does}</p><p className="mt-1 text-[12px] font-black text-slate-700"><span lang="he" dir="rtl">{rule.example}</span> · {rule.meaning}</p></div>
        </div>
      ))}
    </div>
  )
}

function DetailView({ rule, onPrevious, onNext, hasPrevious, hasNext }: { rule: GrammarRule; onPrevious: () => void; onNext: () => void; hasPrevious: boolean; hasNext: boolean }) {
  return (
    <div>
      <RuleDetail rule={rule} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" disabled={!hasPrevious} onClick={onPrevious} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-[12px] font-black text-slate-600 disabled:opacity-30"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Anterior</button>
        <button type="button" disabled={!hasNext} onClick={onNext} className="flex min-h-11 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-[12px] font-black text-slate-600 disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </div>
  )
}

export default function GrammarExplorer() {
  const [group, setGroup] = useState<GrammarGroup>('base')
  const [view, setView] = useState<GrammarView>('cards')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [detailIndex, setDetailIndex] = useState(0)

  const filtered = group === 'all' ? RULES : RULES.filter(rule => rule.group === group)
  const detailRule = filtered[detailIndex] ?? filtered[0]

  function changeGroup(next: GrammarGroup) {
    setGroup(next)
    setSelectedId(null)
    setClosingId(null)
    setDetailIndex(0)
  }

  function toggleRule(rule: GrammarRule) {
    if (selectedId !== rule.id) {
      setClosingId(null)
      setSelectedId(rule.id)
      return
    }
    setClosingId(rule.id)
    window.setTimeout(() => {
      setSelectedId(current => current === rule.id ? null : current)
      setClosingId(null)
    }, 160)
  }

  return (
    <section aria-labelledby="grammar-title" className="text-left">
      <div className="text-center">
        <p lang="he" dir="rtl" className="text-[1rem] font-black text-indigo-700">דִּקְדּוּק</p>
        <h2 id="grammar-title" className="mt-0.5 text-[1.65rem] font-black tracking-[-0.025em] text-slate-950">Reglas para entender lo que lees</h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">Aprende a reconocer las piezas que se unen a una palabra y las relaciones que forman una frase.</p>
      </div>

      <div className="mt-5"><Introduction /></div>
      <div className="mt-4"><ViewControl view={view} onChange={next => { setView(next); setSelectedId(null); setClosingId(null); setDetailIndex(0) }} /></div>

      <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {GROUPS.map(item => <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => changeGroup(item.id)} className={`min-h-11 rounded-full border px-4 text-[12px] font-black ${group === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}
        </div>
      </div>

      <div className="mt-5">
        {view === 'cards' && <CardsView rules={filtered} selectedId={selectedId} closingId={closingId} onToggle={toggleRule} />}
        {view === 'list' && <ListView rules={filtered} />}
        {view === 'detail' && detailRule && <DetailView rule={detailRule} hasPrevious={detailIndex > 0} hasNext={detailIndex < filtered.length - 1} onPrevious={() => setDetailIndex(value => Math.max(0, value - 1))} onNext={() => setDetailIndex(value => Math.min(filtered.length - 1, value + 1))} />}
      </div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">Este bloque enseña patrones básicos de lectura. Raíces y sistema verbal se incorporarán por capas, sin deducir información que la base no tenga verificada.</p>
    </section>
  )
}
