'use client'

import { useState } from 'react'
import { BookOpenCheck, ChevronDown, Languages, Link2, Rows3, Shapes } from 'lucide-react'
import GrammarExplorer from '@/components/hebreo/GrammarExplorer'

type GroupId = 'base' | 'prefixes' | 'nouns' | 'verbs' | 'phrase'
type Rule = { id: string; group: GroupId; form: string; title: string; summary: string; example: string; pronunciation: string; meaning: string }

const GROUPS = [
  { id: 'base' as const, label: 'Básicas', Icon: BookOpenCheck },
  { id: 'prefixes' as const, label: 'Prefijos', Icon: Link2 },
  { id: 'nouns' as const, label: 'Nombres', Icon: Shapes },
  { id: 'verbs' as const, label: 'Verbos', Icon: Languages },
  { id: 'phrase' as const, label: 'Frase', Icon: Rows3 },
]

const RULES: readonly Rule[] = [
  { id: 'article', group: 'base', form: 'הַ', title: 'Artículo definido', summary: 'Marca algo específico: el, la, los o las.', example: 'הַדָּבָר', pronunciation: 'ha-davár', meaning: 'la palabra / la cosa' },
  { id: 'conjunction', group: 'base', form: 'וְ', title: 'Conjunción', summary: 'Conecta palabras o ideas; normalmente equivale a «y».', example: 'וְהָאָרֶץ', pronunciation: 've-ha-árets', meaning: 'y la tierra' },
  { id: 'preposition-b', group: 'prefixes', form: 'בְּ', title: 'Preposición בְּ', summary: 'Puede expresar en, con, por u otras relaciones según el contexto.', example: 'בְּרֵאשִׁית', pronunciation: 'be-reshít', meaning: 'en el principio' },
  { id: 'prepositions', group: 'prefixes', form: 'בְּ · לְ · כְּ · מִן', title: 'Preposiciones frecuentes', summary: 'Introducen relaciones como en, a/para, como y desde/de.', example: 'לְאִישׁ', pronunciation: 'le-ish', meaning: 'a / para un hombre' },
  { id: 'preposition-article', group: 'prefixes', form: 'בַּ · לַ · כַּ', title: 'Preposición + artículo', summary: 'Combina una preposición con la idea de el o la.', example: 'בַּבַּיִת', pronunciation: 'ba-báyit', meaning: 'en la casa' },
  { id: 'gender', group: 'nouns', form: '־ָה · ־ֶת', title: 'Pistas de género', summary: 'Ayudan a reconocer muchas formas femeninas, sin ser una regla absoluta.', example: 'טוֹב · טוֹבָה', pronunciation: 'tov · tová', meaning: 'bueno · buena' },
  { id: 'plural', group: 'nouns', form: '־ִים · וֹת־', title: 'Pistas de plural', summary: 'Marcan con frecuencia formas plurales masculinas y femeninas.', example: 'טוֹבִים · טוֹבוֹת', pronunciation: 'tovím · tovót', meaning: 'buenos · buenas' },
  { id: 'verb-lemma-form', group: 'verbs', form: 'אָמַר → …', title: 'Lema y forma verbal', summary: 'El lema identifica el verbo; el texto muestra formas flexionadas.', example: 'אָמַר · יֹאמַר', pronunciation: 'amár · yomár', meaning: 'formas de «decir»' },
  { id: 'verb-qatal', group: 'verbs', form: 'אָמַר', title: 'Qal qatal', summary: 'Forma sufijada que presenta la situación desde una perspectiva completa.', example: 'אָמַר', pronunciation: 'amár', meaning: 'forma de «decir»' },
  { id: 'verb-yiqtol', group: 'verbs', form: 'יֹאמַר', title: 'Qal yiqtol', summary: 'Forma prefijada cuyo valor depende del contexto discursivo.', example: 'יֹאמַר', pronunciation: 'yomár', meaning: 'forma de «decir»' },
  { id: 'verb-imperative', group: 'verbs', form: 'אֱמֹר', title: 'Imperativo', summary: 'Presenta una orden o instrucción directa.', example: 'אֱמֹר', pronunciation: 'emór', meaning: 'di' },
  { id: 'verb-participle', group: 'verbs', form: 'אֹמֵר', title: 'Participio activo', summary: 'Combina rasgos verbales con funciones cercanas a nombres o adjetivos.', example: 'אֹמֵר', pronunciation: 'omér', meaning: 'que dice / diciendo, según contexto' },
  { id: 'verb-infinitive-construct', group: 'verbs', form: 'לֵאמֹר', title: 'Infinitivo constructo', summary: 'Forma no finita frecuente en construcciones con preposición.', example: 'לֵאמֹר', pronunciation: 'le-mór', meaning: 'para decir / a decir, según contexto' },
  { id: 'verb-wayyiqtol', group: 'verbs', form: 'וַיֹּאמֶר', title: 'Wayyiqtol', summary: 'Forma secuencial muy frecuente en narración bíblica.', example: 'וַיֹּאמֶר', pronunciation: 'va-yómer', meaning: 'forma narrativa de «decir»' },
  { id: 'verb-weqatal', group: 'verbs', form: 'וְאָמַרְתָּ', title: 'Weqatal', summary: 'Forma secuencial con וְ y qatal cuyo valor depende del discurso.', example: 'וְאָמַרְתָּ', pronunciation: 've-amartá', meaning: 'forma secuencial de «decir»' },
  { id: 'agreement', group: 'phrase', form: 'הַ… הַ…', title: 'Sustantivo + adjetivo', summary: 'El adjetivo normalmente concuerda con el nombre que describe.', example: 'הַדָּבָר הַטּוֹב', pronunciation: 'ha-davár ha-tóv', meaning: 'la cosa / palabra buena' },
  { id: 'construct', group: 'phrase', form: 'X + Y', title: 'Cadena constructa', summary: 'Une dos nombres con una relación que en español suele expresarse con «de».', example: 'בֵּית הַמֶּלֶךְ', pronunciation: 'beit ha-mélej', meaning: 'la casa del rey' },
]

export default function GrammarNavigator() {
  const [group, setGroup] = useState<GroupId>('base')
  const [openRule, setOpenRule] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const rules = RULES.filter(rule => rule.group === group)

  return (
    <section aria-labelledby="grammar-title" className="text-center">
      <p lang="he" dir="rtl" className="text-[1rem] font-black text-indigo-700">דִּקְדּוּק</p>
      <h2 id="grammar-title" className="mt-0.5 text-[1.65rem] font-black tracking-[-0.025em] text-slate-950">Reglas</h2>
      <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">Elige un grupo y abre solo la regla que necesitas.</p>

      <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max justify-center gap-2">
          {GROUPS.map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => { setGroup(id); setOpenRule(null) }} aria-pressed={group === id} className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[10px] font-black ${group === id ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {rules.map(rule => {
          const active = openRule === rule.id
          return <button key={rule.id} type="button" onClick={() => setOpenRule(current => current === rule.id ? null : rule.id)} aria-expanded={active} className={`min-h-[92px] rounded-[18px] border px-3 py-3 text-center transition ${active ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}><span lang="he" dir="rtl" className="block text-[2rem] font-black leading-tight text-indigo-700">{rule.form}</span><span className="mt-1 block text-[11px] font-black leading-tight text-slate-800">{rule.title}</span></button>
        })}
      </div>

      {openRule && (() => {
        const rule = RULES.find(item => item.id === openRule)
        if (!rule) return null
        return <article className="mt-3 rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-center"><p className="text-[12px] font-semibold leading-relaxed text-slate-600">{rule.summary}</p><div className="mt-3 border-y border-slate-100 py-3"><p lang="he" dir="rtl" className="text-[2.8rem] font-black leading-tight text-slate-950">{rule.example}</p><p className="mt-1 text-[12px] font-black text-indigo-700">{rule.pronunciation}</p><p className="mt-1 text-[12px] font-semibold text-slate-600">{rule.meaning}</p></div></article>
      })()}

      <div className="mt-5 border-t border-slate-200 pt-3">
        <button type="button" onClick={() => setAdvancedOpen(value => !value)} aria-expanded={advancedOpen} className="mx-auto flex min-h-10 items-center gap-2 rounded-full px-4 text-[10px] font-black text-slate-500"><Rows3 className="h-4 w-4" />Comparaciones y tablas<ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} /></button>
        {advancedOpen && <div className="mt-4 text-left"><GrammarExplorer /></div>}
      </div>
    </section>
  )
}
