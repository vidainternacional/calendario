'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpenText,
  ChevronDown,
  GraduationCap,
  History,
  Keyboard,
  Languages,
  Library,
  Sparkles,
} from 'lucide-react'
import HebrewKeyboardDock from '@/components/hebreo/HebrewKeyboardDock'

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

function ProcessTestPreview() {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  const current = TEST_QUESTIONS[step]

  if (finished) {
    return (
      <div className="px-4 pb-4 pt-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">Resultado de práctica</p>
        <h3 className="mt-2 text-lg font-black text-slate-950">Repasa antes de avanzar</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-500">Esta prueba es una práctica breve; el progreso persistente todavía no está activo.</p>
        <button type="button" onClick={() => { setStep(0); setFinished(false) }} className="mt-4 min-h-11 rounded-full bg-indigo-600 px-5 text-sm font-black text-white">Volver a probar</button>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4 pt-2 text-center">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{step + 1} / {TEST_QUESTIONS.length}</p>
        <p className="text-[10px] font-black text-indigo-700">{current.type}</p>
      </div>
      <h3 className="mt-4 text-[15px] font-black text-slate-950">{current.prompt}</h3>
      {'hebrew' in current && <p lang="he" dir="rtl" className="my-5 text-[3.5rem] font-black leading-none text-slate-950">{current.hebrew}</p>}
      <div className="mt-4 grid gap-2">
        {current.options.map((option, index) => (
          <button key={`${option}-${index}`} type="button" onClick={() => step < TEST_QUESTIONS.length - 1 ? setStep(value => value + 1) : setFinished(true)} className={`min-h-11 rounded-[14px] border border-slate-200 bg-white px-4 font-black text-slate-800 ${['Reconocer', 'Distinguir', 'Sofit', 'Dagesh'].includes(current.type) ? 'text-[1.55rem]' : 'text-sm'}`}>
            {option}
          </button>
        ))}
      </div>
      <details className="mt-3 border-t border-slate-100 pt-1">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 text-[11px] font-black text-slate-500">Historial de progreso <History className="h-3.5 w-3.5" /></summary>
        <p className="pb-2 text-[10px] text-slate-400">La persistencia de progreso todavía no está activa.</p>
      </details>
    </div>
  )
}

function QuickLink({ href, icon, title, subtitle }: { href: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link href={href} className="flex min-h-[96px] flex-col items-center justify-center rounded-[20px] bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-200/80 transition active:scale-[0.98]">
      <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-indigo-50 text-indigo-700">{icon}</span>
      <span className="mt-2 text-[12px] font-black leading-tight text-slate-950">{title}</span>
      <span className="mt-0.5 text-[9px] font-semibold leading-tight text-slate-400">{subtitle}</span>
    </Link>
  )
}

export default function HebrewLearningHome() {
  const [keyboardEnabled, setKeyboardEnabled] = useState(false)

  return (
    <main className="min-h-screen bg-[#f9f9fb] text-slate-950">
      <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-3 sm:px-6">
        <header>
          <Link href="/estudios" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-black text-slate-600"><ArrowLeft className="h-4 w-4" /> Estudios</Link>
          <div className="mt-1 text-center">
            <p lang="he" dir="rtl" className="text-[2.25rem] font-black leading-none text-indigo-700">עברית מקראית</p>
            <h1 className="mt-1.5 text-[1.6rem] font-black tracking-[-0.035em]">Hebreo Bíblico</h1>
            <p className="mt-0.5 text-[12px] font-semibold text-slate-500">Aprende, practica y lee los textos originales.</p>
          </div>
        </header>

        <section aria-label="Comenzar a aprender" className="mt-5">
          <Link href="/estudios/hebreo/aprender" className="relative flex min-h-[104px] items-center gap-4 overflow-hidden rounded-[26px] bg-indigo-600 px-5 py-4 text-left text-white shadow-[0_14px_35px_rgba(79,70,229,0.22)] transition active:scale-[0.985]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[17px] bg-white/15"><GraduationCap className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]"><Sparkles className="mr-1 h-3 w-3" /> Empieza aquí</span>
              <span className="mt-1.5 block text-[18px] font-black">Aprender</span>
              <span className="block text-[11px] font-semibold text-indigo-100">Curso guiado en el orden correcto</span>
            </span>
            <span className="text-2xl font-light text-white/70">›</span>
          </Link>
        </section>

        <nav aria-label="Accesos de Hebreo Bíblico" className="mt-3 grid grid-cols-3 gap-2.5">
          <QuickLink href="/estudios/hebreo/traductor" icon={<Languages className="h-4.5 w-4.5" />} title="Traductor" subtitle="Español ⇄ Hebreo" />
          <QuickLink href="/estudios/hebreo/lectura" icon={<BookOpenText className="h-4.5 w-4.5" />} title="Biblia" subtitle="Leer en hebreo" />
          <QuickLink href="/estudios/hebreo/materiales" icon={<Library className="h-4.5 w-4.5" />} title="Materiales" subtitle="Curso y apoyo" />
        </nav>

        <section aria-label="Práctica y herramientas" className="mt-4 divide-y divide-slate-200 border-y border-slate-200 bg-white">
          <details>
            <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-3 px-1 text-left">
              <span><span className="block text-[13px] font-black text-slate-900">Prueba tu progreso</span><span className="block text-[10px] text-slate-400">Evaluación breve sin salir de Inicio</span></span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <ProcessTestPreview />
          </details>
          <details>
            <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-3 px-1 text-left">
              <span><span className="block text-[13px] font-black text-slate-900">Herramientas</span><span className="block text-[10px] text-slate-400">Teclado hebreo para practicar</span></span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <button type="button" onClick={() => setKeyboardEnabled(value => !value)} aria-pressed={keyboardEnabled} className="flex min-h-[58px] w-full items-center justify-between gap-3 border-t border-slate-100 px-2 text-left">
              <span className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-[13px] ${keyboardEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-700'}`}><Keyboard className="h-4 w-4" /></span><span><span className="block text-[12px] font-black text-slate-900">Teclado hebreo</span><span className="block text-[10px] text-slate-400">Práctica de escritura</span></span></span>
              <span className="text-[10px] font-black text-indigo-700">{keyboardEnabled ? 'Desactivar' : 'Activar'}</span>
            </button>
          </details>
        </section>

        <p className="mt-5 text-center text-[9px] leading-relaxed text-slate-400">FASE H · Aprendizaje en desarrollo · práctica sugerida de 5–10 minutos al día</p>
      </div>
      <HebrewKeyboardDock enabled={keyboardEnabled} onDisable={() => setKeyboardEnabled(false)} />
    </main>
  )
}
