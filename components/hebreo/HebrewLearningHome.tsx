'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ExternalLink, History, Keyboard, PlayCircle } from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'
import GrammarExplorer from '@/components/hebreo/GrammarExplorer'
import HebrewKeyboardDock from '@/components/hebreo/HebrewKeyboardDock'
import NiqqudExplorer from '@/components/hebreo/NiqqudExplorer'
import HebrewBibleReader from '@/components/hebreo/HebrewBibleReader'
import HebrewWordsStudy from '@/components/hebreo/HebrewWordsStudy'
import ReviewExplorer from '@/components/hebreo/ReviewExplorer'
import { HEBREW_SUPPORT_COURSE } from '@/lib/hebreo/material-apoyo'

const ReadingWordsExplorer = HebrewWordsStudy
const ReadingSentencesExplorer = HebrewBibleReader

type TopMenuId = 'learn' | 'materials' | 'test' | 'bible'
type SectionId = 'alef-bet' | 'vowels' | 'vocabulary' | 'reading' | 'grammar' | 'review'

type LearningSection = { id: SectionId; he: string; short: string; description: string }

const SECTIONS: readonly LearningSection[] = [
  { id: 'alef-bet', he: 'אָלֶף־בֵּית', short: 'Alef-Bet', description: 'Letras, Sofit, Dagesh y diferencias visuales.' },
  { id: 'vowels', he: 'תְּנוּעוֹת', short: 'Vocales', description: 'Niqqud, Sheva y formación de sílabas.' },
  { id: 'vocabulary', he: 'מִלִּים', short: 'Palabras y frases', description: 'Vocabulario para memorizar y frases cotidianas separadas por registro.' },
  { id: 'reading', he: 'קְרִיאָה', short: 'Lectura bíblica', description: 'Versículos conocidos y Biblia en orden por libro y capítulo.' },
  { id: 'grammar', he: 'דִּקְדּוּק', short: 'Reglas', description: 'Prefijos, patrones y gramática por capas.' },
  { id: 'review', he: 'חֲזָרָה', short: 'Repaso', description: 'Sesiones breves con lo ya estudiado.' },
]

const MENU_LABELS: Record<TopMenuId, { he: string; es: string; sub: string }> = {
  learn: { he: 'לִמּוּד', es: 'Aprender', sub: 'Curso paso a paso' },
  materials: { he: 'חֹמֶר לִמּוּד', es: 'Materiales y curso', sub: 'Recursos complementarios' },
  test: { he: 'בְּחַן אֶת הַתַּהֲלִיךְ', es: 'Prueba tu progreso', sub: 'Evaluación breve' },
  bible: { he: 'תַּנַ״ךְ בְּעִבְרִית', es: 'Biblia en hebreo', sub: 'Lectura directa' },
}

const TEST_QUESTIONS = [
  { type: 'Reconocer', prompt: '¿Cuál de estas letras es Bet?', options: ['ב', 'כ', 'פ'] },
  { type: 'Reconocer', prompt: '¿Cuál de estas letras es Gimel?', options: ['נ', 'ג', 'ז'] },
  { type: 'Reconocer', prompt: 'Selecciona la letra Lamed.', options: ['ל', 'כ', 'מ'] },
  { type: 'Distinguir', prompt: 'Selecciona la letra diferente.', options: ['ד', 'ד', 'ר'] },
  { type: 'Distinguir', prompt: '¿Cuál es He y no Jet?', options: ['ח', 'ה', 'ת'] },
  { type: 'Distinguir', prompt: 'Encuentra Kaf entre estas formas.', options: ['ב', 'כ', 'פ'] },
  { type: 'Sofit', prompt: '¿Cuál es una forma final?', options: ['מ', 'ם', 'ס'] },
  { type: 'Dagesh', prompt: '¿Cuál opción contiene un punto dentro de la letra?', options: ['ב', 'בּ', 'כ'] },
  { type: 'Lectura', prompt: '¿Qué palabra estás viendo?', hebrew: 'מֶלֶךְ', options: ['Rey', 'Casa', 'Paz'] },
  { type: 'Lectura', prompt: 'Selecciona la lectura que corresponde.', hebrew: 'בַּיִת', options: ['báyit', 'mélej', 'shalom'] },
  { type: 'Comprensión', prompt: '¿Qué significa esta palabra?', hebrew: 'שָׁלוֹם', options: ['Paz', 'Agua', 'Tierra'] },
  { type: 'Comprensión', prompt: '¿Qué significa esta palabra?', hebrew: 'מֶלֶךְ', options: ['Casa', 'Rey', 'Nombre'] },
  { type: 'Integración', prompt: '¿Qué ayuda representa el punto dentro de algunas letras?', options: ['Dagesh', 'Sofit', 'Matre'] },
  { type: 'Integración', prompt: '¿Qué nombre recibe una forma usada al final de palabra?', options: ['Sofit', 'Nikud', 'Shewa'] },
  { type: 'Integración', prompt: '¿Qué conviene hacer antes de depender de la pronunciación escrita?', options: ['Reconocer las letras', 'Memorizar traducciones', 'Saltar a gramática'] },
] as const

function MenuButton({ id, open, onClick }: { id: TopMenuId; open: boolean; onClick: () => void }) {
  const item = MENU_LABELS[id]
  return <button type="button" onClick={onClick} aria-expanded={open} className={`flex min-h-[64px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${open ? 'bg-indigo-50' : 'bg-white active:bg-slate-50'}`}><span className="min-w-0"><span lang="he" dir="rtl" className="block text-[11px] font-black text-indigo-700">{item.he}</span><span className="mt-0.5 block text-[14px] font-black text-slate-950">{item.es}</span><span className="block text-[10px] font-semibold text-slate-400">{item.sub}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
}

function LearningAreaButton({ section, active, onClick }: { section: LearningSection; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-expanded={active} className={`flex min-h-[58px] w-full items-center justify-between gap-3 px-3 py-2 text-left ${active ? 'bg-indigo-50' : 'bg-white active:bg-slate-50'}`}><span className="min-w-0"><span className="flex items-baseline gap-2"><span lang="he" dir="rtl" className="text-[1rem] font-black text-indigo-700">{section.he}</span><span className="text-[13px] font-black text-slate-900">{section.short}</span></span><span className="mt-0.5 block text-[10px] leading-relaxed text-slate-400">{section.description}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${active ? 'rotate-180' : ''}`} /></button>
}

function LearnPanel() {
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  return <section aria-labelledby="areas-hebreo-title"><div className="mb-3 text-center"><h2 id="areas-hebreo-title" className="text-[1.25rem] font-black text-slate-950">Aprender paso a paso</h2><p className="mt-1 text-[11px] text-slate-500">Abre solo el tema que vas a estudiar.</p></div><div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">{SECTIONS.map((section, index) => { const active = openSection === section.id; return <div key={section.id} className={index ? 'border-t border-slate-100' : ''}><LearningAreaButton section={section} active={active} onClick={() => setOpenSection(current => current === section.id ? null : section.id)} />{active && <div className="border-t border-slate-100 px-3 py-4">{section.id === 'alef-bet' ? <AlefBetExplorer simpleMode={false} /> : section.id === 'vowels' ? <NiqqudExplorer /> : section.id === 'vocabulary' ? <ReadingWordsExplorer /> : section.id === 'reading' ? <ReadingSentencesExplorer /> : section.id === 'grammar' ? <GrammarExplorer /> : <ReviewExplorer />}</div>}</div>})}</div></section>
}

function SupportMaterialSection() {
  const groups = [{ title: 'Fundamentos', range: [1, 5] }, { title: 'Vocales y lectura', range: [6, 8] }, { title: 'Lectura bíblica y reglas', range: [9, 11] }] as const
  return <section className="text-center"><p className="text-[11px] leading-relaxed text-slate-500">Material complementario. Los enlaces externos permanecen separados del contenido propio de VIDA.</p><div className="mt-3 space-y-2">{groups.map(group => <details key={group.title} className="rounded-[18px] border border-slate-200 bg-white"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 px-4 text-sm font-black text-slate-900">{group.title} · Clases {group.range[0]}–{group.range[1]} <ChevronDown className="h-4 w-4 text-slate-400" /></summary><div className="max-h-72 space-y-3 overflow-y-auto border-t border-slate-100 p-3">{HEBREW_SUPPORT_COURSE.filter(item => item.orden >= group.range[0] && item.orden <= group.range[1]).map(item => <article key={item.orden} className="overflow-hidden rounded-[16px] border border-slate-200 bg-white text-left"><div className="flex gap-3 p-3"><div className="relative h-[68px] w-[106px] shrink-0 overflow-hidden rounded-[11px] bg-slate-100"><img src={item.miniatura} alt={`Miniatura de la clase ${item.orden}`} className="h-full w-full object-cover" loading="lazy" /><span className="absolute inset-0 grid place-items-center bg-slate-950/10"><PlayCircle className="h-7 w-7 text-white" /></span></div><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-amber-700">Clase {item.orden}</p><h3 className="mt-1 text-[13px] font-black leading-snug text-slate-900">{item.titulo}</h3><p className="mt-1 text-[11px] text-slate-500">{item.tema}</p></div></div><a href={item.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between border-t border-slate-100 px-4 text-[12px] font-black text-indigo-700">Abrir video <ExternalLink className="h-3.5 w-3.5" /></a></article>)}</div></details>)}</div></section>
}

function ProcessTestPreview() {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  const current = TEST_QUESTIONS[step]
  if (finished) return <section className="rounded-[22px] border border-slate-200 bg-white p-5 text-center"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">Ficha de resultado · ejemplo</p><h3 className="mt-2 text-xl font-black text-slate-950">Tu maestro recomienda reforzar antes de avanzar</h3><p className="mt-3 text-[12px] leading-relaxed text-slate-500">La evaluación definitiva distinguirá lo que reconoces de lo que necesitas volver a practicar.</p><button type="button" onClick={() => { setStep(0); setFinished(false) }} className="mt-5 min-h-11 w-full rounded-full bg-indigo-600 text-sm font-black text-white">Volver a probar</button></section>
  return <section className="rounded-[22px] border border-slate-200 bg-white p-5 text-center"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Pregunta {step + 1} de {TEST_QUESTIONS.length}</p><p className="text-[10px] font-black text-indigo-700">{current.type}</p></div><h3 className="mt-6 text-lg font-black text-slate-950">{current.prompt}</h3>{'hebrew' in current && <p lang="he" dir="rtl" className="my-7 text-[4.5rem] font-black leading-none text-slate-950">{current.hebrew}</p>}<div className="mt-5 grid gap-2">{current.options.map((option, index) => <button key={`${option}-${index}`} type="button" onClick={() => step < TEST_QUESTIONS.length - 1 ? setStep(value => value + 1) : setFinished(true)} className={`min-h-13 rounded-[16px] border border-slate-200 bg-white px-4 font-black text-slate-800 ${['Reconocer','Distinguir','Sofit','Dagesh'].includes(current.type) ? 'text-[1.8rem]' : 'text-sm'}`}>{option}</button>)}</div></section>
}

function KeyboardToolToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return <button type="button" onClick={onToggle} aria-pressed={enabled} className="flex min-h-[58px] w-full items-center justify-between gap-3 px-4 text-left"><span className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-[13px] ${enabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-700'}`}><Keyboard className="h-4 w-4" /></span><span><span className="block text-[13px] font-black text-slate-900">Teclado hebreo</span><span className="block text-[10px] text-slate-400">Práctica de escritura</span></span></span><span className="text-[10px] font-black text-indigo-700">{enabled ? 'Desactivar' : 'Activar'}</span></button>
}

export default function HebrewLearningHome() {
  const [openMenu, setOpenMenu] = useState<TopMenuId | null>(null)
  const [keyboardEnabled, setKeyboardEnabled] = useState(false)

  return <main className="min-h-screen bg-[#f9f9fb] text-slate-950"><div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-3 sm:px-6"><header className="mb-4"><Link href="/estudios" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-black text-slate-600"><ArrowLeft className="h-4 w-4" /> Estudios</Link><div className="mt-2 text-center"><p lang="he" dir="rtl" className="text-[2.35rem] font-black leading-none text-indigo-700">עברית מקראית</p><h1 className="mt-1.5 text-[1.65rem] font-black tracking-[-0.035em]">Hebreo Bíblico</h1><p className="mt-0.5 text-[12px] font-semibold text-slate-500">Aprende, memoriza y lee paso a paso.</p></div></header>

  <section aria-label="Navegación principal" className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">{(['learn','materials','test','bible'] as const).map((id, index) => { const open = openMenu === id; return <div key={id} className={index ? 'border-t border-slate-100' : ''}><MenuButton id={id} open={open} onClick={() => setOpenMenu(current => current === id ? null : id)} />{open && <div className="border-t border-slate-100 px-3 py-4">{id === 'learn' ? <LearnPanel /> : id === 'materials' ? <SupportMaterialSection /> : id === 'test' ? <div><ProcessTestPreview /><details className="mt-3 border-y border-slate-100 py-1"><summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 text-[12px] font-black text-slate-600">Historial de progreso <History className="h-4 w-4" /></summary><p className="pb-3 text-[11px] text-slate-400">La persistencia de progreso todavía no está activa.</p></details></div> : <HebrewBibleReader />}</div>}</div>})}</section>

  <details className="mt-3 overflow-hidden rounded-[22px] border border-slate-200 bg-white"><summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between px-4"><span><span className="block text-[13px] font-black text-slate-900">Herramientas</span><span className="block text-[10px] text-slate-400">Teclado hebreo</span></span><ChevronDown className="h-4 w-4 text-slate-400" /></summary><div className="border-t border-slate-100"><KeyboardToolToggle enabled={keyboardEnabled} onToggle={() => setKeyboardEnabled(value => !value)} /></div></details>

  <footer className="mt-6 border-t border-slate-200 pt-4"><p className="text-center text-[10px] leading-relaxed text-slate-400">FASE H · Aprendizaje en desarrollo. Sin progreso persistente ni desbloqueos automáticos.</p></footer></div><HebrewKeyboardDock enabled={keyboardEnabled} onDisable={() => setKeyboardEnabled(false)} /></main>
}
