'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Accessibility, ArrowLeft, BookOpenText, ChevronDown, ExternalLink, History, PlayCircle, X } from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'
import { HEBREW_SUPPORT_COURSE } from '@/lib/hebreo/material-apoyo'

type TopMenuId = 'learn' | 'materials' | 'test' | 'bible'
type SectionId = 'alef-bet' | 'vowels' | 'reading' | 'vocabulary' | 'grammar' | 'review'
type LearningSection = { id: SectionId; he: string; short: string; description: string; available: boolean }

const SECTIONS: readonly LearningSection[] = [
  { id: 'alef-bet', he: 'אָלֶף־בֵּית', short: 'Letras', description: 'Reconoce las 22 letras, sus nombres, sonidos, formas finales y diferencias visuales.', available: true },
  { id: 'vowels', he: 'תְּנוּעוֹת', short: 'Vocales', description: 'Comprende los signos vocálicos y cómo cambian la lectura de una consonante.', available: false },
  { id: 'reading', he: 'קְרִיאָה', short: 'Lectura', description: 'Combina letras y vocales hasta poder leer sílabas, palabras y frases breves.', available: false },
  { id: 'vocabulary', he: 'מִלִּים', short: 'Palabras', description: 'Construye vocabulario bíblico de forma progresiva y dentro de contexto.', available: false },
  { id: 'grammar', he: 'דִּקְדּוּק', short: 'Reglas', description: 'Comprende patrones esenciales por capas, sin comenzar con tablas extensas.', available: false },
  { id: 'review', he: 'חֲזָרָה', short: 'Repaso', description: 'Vuelve a lo que necesita refuerzo mediante sesiones breves y enfocadas.', available: false },
]

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
  { type: 'Integración', prompt: '¿Qué conviene hacer antes de depender de la transliteración?', options: ['Reconocer las letras', 'Memorizar traducciones', 'Saltar a gramática'] },
] as const

function MenuButton({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-expanded={open} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-[18px] border px-4 text-left text-sm font-black transition-colors ${open ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-800'}`}><span>{label}</span><ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
}

function LearningAreaButton({ section, active, onClick }: { section: LearningSection; active: boolean; onClick: () => void }) {
  return <button type="button" aria-expanded={active} aria-controls={`hebrew-panel-${section.id}`} onClick={onClick} className={`flex min-h-[74px] items-center justify-between gap-3 rounded-[22px] border px-4 py-3 text-left transition-colors ${active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-900'}`}><div className="min-w-0"><p lang="he" dir="rtl" className={`text-[1.35rem] font-black ${active ? 'text-white' : 'text-indigo-700'}`}>{section.he}</p><p className="mt-0.5 text-sm font-black">{section.short}</p></div><div className="flex shrink-0 items-center gap-2"><span className={`text-[9px] font-black uppercase tracking-[0.08em] ${active ? 'text-indigo-100' : section.available ? 'text-emerald-700' : 'text-slate-400'}`}>{section.available ? 'Disponible' : 'Vista'}</span><ChevronDown className={`h-4 w-4 transition-transform ${active ? 'rotate-180' : ''}`} /></div></button>
}

function ArchitecturePreview({ section }: { section: Exclude<LearningSection, { id: 'alef-bet' }> | LearningSection }) {
  const examples: Record<string, string> = { vowels: 'ב + ַ = בַ', reading: 'מֶלֶךְ', vocabulary: 'מֶלֶךְ · rey', grammar: 'הַ  ·  מ־ל־ך', review: 'ב' }
  return <div className="pt-2"><p className="text-sm font-black text-slate-950">Qué aprenderás</p><p className="mt-1 text-sm leading-relaxed text-slate-600">{section.description}</p><details className="mt-4 border-y border-slate-200 py-1"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-black text-indigo-700">Ver explicación y ejemplo <ChevronDown className="h-4 w-4" /></summary><div className="pb-4"><p lang="he" dir="rtl" className="my-4 text-center text-[3.6rem] font-black leading-none text-slate-950">{examples[section.id]}</p><p className="text-[12px] leading-relaxed text-slate-500">El contenido completo de este sector se presentará por partes. Cada explicación, ejemplo y detalle adicional podrá abrirse cuando haga falta, sin llenar la pantalla desde el inicio.</p></div></details><p className="mt-4 text-[11px] leading-relaxed text-slate-400">Vista de arquitectura del Bloque 1. Todavía no guarda actividad ni desbloquea contenido.</p></div>
}

function LearnPanel({ simpleMode }: { simpleMode: boolean }) {
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  return <section className="mt-4" aria-labelledby="areas-hebreo-title"><div className="mb-4"><h2 id="areas-hebreo-title" className="text-xl font-black">Aprender paso a paso</h2><p className="mt-1 text-[13px] leading-relaxed text-slate-500">Abre solo el tema que quieras estudiar. Las explicaciones y ejemplos permanecen agrupados dentro de cada sector.</p></div><div className="grid gap-2.5">{SECTIONS.map(section => <div key={section.id}><LearningAreaButton section={section} active={openSection === section.id} onClick={() => setOpenSection(current => current === section.id ? null : section.id)} />{openSection === section.id && <div id={`hebrew-panel-${section.id}`} className="px-2 pb-5 pt-4">{section.id === 'alef-bet' ? <AlefBetExplorer simpleMode={simpleMode} /> : <ArchitecturePreview section={section} />}</div>}</div>)}</div></section>
}

function ProcessTestPreview() {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  const current = TEST_QUESTIONS[step]
  if (finished) return <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.09)]" aria-labelledby="resultado-prueba-title"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">Ficha de resultado · ejemplo</p><h3 id="resultado-prueba-title" className="mt-1 text-2xl font-black text-slate-950">Tu maestro recomienda reforzar antes de avanzar</h3><div className="mt-5 divide-y divide-slate-200 border-y border-slate-200"><div className="py-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Lo que ya reconoces</p><p className="mt-1 text-sm font-bold text-slate-800">La evaluación combinará tus aciertos de reconocimiento, distinción, lectura y comprensión.</p></div><div className="py-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Conviene reforzar</p><p className="mt-1 text-sm font-bold text-slate-800">Aquí aparecerán únicamente las áreas donde tus respuestas reales muestren dificultad.</p></div></div><div className="mt-5 rounded-[20px] bg-indigo-50 p-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-indigo-700">Consejo de estudio</p><p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">La recomendación se redactará a partir del resultado completo, como una orientación breve de un maestro: qué mantener, qué repasar y cuál debería ser tu siguiente práctica.</p></div><div className="mt-5 flex gap-3 border-t border-slate-200 pt-4 text-[12px] leading-relaxed text-slate-500"><History className="mt-0.5 h-4 w-4 shrink-0" /><p>Cuando exista persistencia autorizada, cada ficha quedará en Historial para comparar pruebas anteriores.</p></div><button type="button" onClick={() => { setStep(0); setFinished(false) }} className="mt-5 min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white">Volver a probar</button></section>
  return <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5" aria-labelledby="prueba-title"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Pregunta {step + 1} de {TEST_QUESTIONS.length}</p><p className="text-[11px] font-black text-indigo-700">{current.type}</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-[width] motion-reduce:transition-none" style={{ width: `${((step + 1) / TEST_QUESTIONS.length) * 100}%` }} /></div><h3 id="prueba-title" className="mt-7 text-xl font-black leading-snug text-slate-950">{current.prompt}</h3>{'hebrew' in current && <p lang="he" dir="rtl" className="my-8 text-center text-[5rem] font-black leading-none text-slate-950">{current.hebrew}</p>}<div className="mt-6 grid gap-3">{current.options.map((option, index) => <button key={`${option}-${index}`} type="button" onClick={() => step < TEST_QUESTIONS.length - 1 ? setStep(value => value + 1) : setFinished(true)} className={`min-h-14 rounded-[18px] border border-slate-200 bg-white px-5 font-black text-slate-800 active:bg-slate-50 ${['Reconocer','Distinguir','Sofit','Dagesh'].includes(current.type) ? 'text-[2rem]' : 'text-base'}`}>{option}</button>)}</div><p className="mt-5 text-[11px] leading-relaxed text-slate-400">Este prototipo tiene 15 preguntas para validar el recorrido. Todavía no califica ni guarda respuestas.</p></section>
}

function SupportMaterialSection() {
  return <div className="mt-4"><p className="text-[13px] leading-relaxed text-slate-500">Curso externo recomendado como complemento. Los 11 enlaces permanecen pendientes de corroboración visual.</p><div className="mt-4 space-y-2"><details className="rounded-[18px] border border-slate-200 bg-white"><summary className="flex min-h-13 cursor-pointer list-none items-center justify-between px-4 text-sm font-black text-slate-900">Curso recomendado · 11 clases <ChevronDown className="h-4 w-4 text-slate-400" /></summary><div className="space-y-3 border-t border-slate-100 p-3">{HEBREW_SUPPORT_COURSE.map(item => <article key={item.orden} className="overflow-hidden rounded-[16px] border border-slate-200 bg-white"><div className="flex gap-3 p-3"><div className="relative h-[68px] w-[106px] shrink-0 overflow-hidden rounded-[11px] bg-slate-100"><img src={item.miniatura} alt={`Miniatura del enlace de la clase ${item.orden}`} className="h-full w-full object-cover" loading="lazy" /><span className="absolute inset-0 grid place-items-center bg-slate-950/10"><PlayCircle className="h-7 w-7 text-white" /></span></div><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-amber-700">Clase {item.orden} · Pendiente</p><h3 className="mt-1 text-[13px] font-black leading-snug text-slate-900">{item.titulo}</h3><p className="mt-1 text-[11px] text-slate-500">{item.tema}</p></div></div><a href={item.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between border-t border-slate-100 px-4 text-[12px] font-black text-indigo-700">Abrir video <ExternalLink className="h-3.5 w-3.5" /></a></article>)}</div></details></div></div>
}

function BibleHebrewPreview() {
  return <section className="mt-4"><div className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-white p-4"><BookOpenText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" /><div><h2 className="text-base font-black text-slate-950">Biblia en hebreo</h2><p className="mt-1 text-[13px] leading-relaxed text-slate-600">Aquí vivirá el acceso al texto bíblico hebreo y, más adelante, al lector guiado que reutilizará las fuentes textuales ya aprobadas de VIDA.</p><p className="mt-3 text-[11px] leading-relaxed text-slate-400">Durante Bloque 1 esta entrada define el recorrido; no crea un segundo motor bíblico.</p></div></div></section>
}

export default function HebrewLearningHome() {
  const [simpleMode, setSimpleMode] = useState(false)
  const [openMenu, setOpenMenu] = useState<TopMenuId | null>('learn')
  return <main className="min-h-screen bg-[#fbfaf6] text-slate-950"><div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6"><header className="mb-6"><div className="flex items-center justify-between"><Link href="/estudios" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-slate-600"><ArrowLeft className="h-5 w-5" /> Estudios</Link><button type="button" onClick={() => setSimpleMode(value => !value)} aria-pressed={simpleMode} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-black ${simpleMode ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}><Accessibility className="h-4 w-4" /> Lectura</button></div><div className="mt-7"><p lang="he" dir="rtl" className="text-[2.35rem] font-black leading-none text-indigo-700">עברית מקראית</p><h1 className="mt-2 text-[2.3rem] font-black tracking-[-0.04em]">Hebreo Bíblico</h1><p className="mt-1 text-base font-semibold text-slate-600">Aprende a leer paso a paso.</p></div></header>

<section className="grid gap-2" aria-label="Navegación principal de Hebreo Bíblico">
  <div><MenuButton label="Aprender" open={openMenu === 'learn'} onClick={() => setOpenMenu(current => current === 'learn' ? null : 'learn')} />{openMenu === 'learn' && <LearnPanel simpleMode={simpleMode} />}</div>
  <div><MenuButton label="Materiales y curso recomendado" open={openMenu === 'materials'} onClick={() => setOpenMenu(current => current === 'materials' ? null : 'materials')} />{openMenu === 'materials' && <SupportMaterialSection />}</div>
  <div><MenuButton label="Prueba tu progreso" open={openMenu === 'test'} onClick={() => setOpenMenu(current => current === 'test' ? null : 'test')} />{openMenu === 'test' && <div><div className="mt-4 flex items-center justify-between gap-4"><div><h2 className="text-xl font-black">Comprueba lo aprendido</h2><p className="mt-1 text-[13px] leading-relaxed text-slate-500">15 preguntas variadas ofrecen una base más amplia para evaluar tu proceso.</p></div></div><ProcessTestPreview /><details className="mt-4 border-y border-slate-200 py-1"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-black text-slate-700">Historial de progreso <History className="h-4 w-4 text-slate-400" /></summary><p className="pb-4 text-[12px] leading-relaxed text-slate-500">Aquí se consultarán tus fichas anteriores para comparar resultados y recomendaciones. No existe persistencia durante Bloque 1.</p></details></div>}</div>
  <div><MenuButton label="Biblia en hebreo" open={openMenu === 'bible'} onClick={() => setOpenMenu(current => current === 'bible' ? null : 'bible')} />{openMenu === 'bible' && <BibleHebrewPreview />}</div>
</section>

<footer className="mt-10 border-t border-slate-200 pt-5"><p className="text-[11px] leading-relaxed text-slate-400">FASE H · Bloque 1 · Arquitectura visual. Sin audio, progreso persistente ni desbloqueos automáticos.</p></footer></div></main>
}
