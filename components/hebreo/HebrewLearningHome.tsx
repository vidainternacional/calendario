'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpenText,
  ChevronDown,
  Keyboard,
  Languages,
  Library,
} from 'lucide-react'
import HebrewBibleReader from '@/components/hebreo/HebrewBibleReader'
import HebrewKeyboardDock from '@/components/hebreo/HebrewKeyboardDock'
import HebrewProgressCoach from '@/components/hebreo/HebrewProgressCoach'
import HebrewSupportMaterials from '@/components/hebreo/HebrewSupportMaterials'
import HebrewTranslator from '@/components/hebreo/HebrewTranslator'

type QuickPanelId = 'translator' | 'bible' | 'materials'

const QUICK_PANELS: Record<QuickPanelId, { title: string; subtitle: string }> = {
  translator: { title: 'Traductor', subtitle: 'Español ⇄ Hebreo' },
  bible: { title: 'Biblia', subtitle: 'Leer en hebreo' },
  materials: { title: 'Materiales', subtitle: 'Curso y apoyo' },
}

function QuickButton({ id, icon, title, subtitle, active, onToggle }: { id: QuickPanelId; icon: React.ReactNode; title: string; subtitle: string; active: boolean; onToggle: (id: QuickPanelId) => void }) {
  return (
    <button type="button" onClick={() => onToggle(id)} aria-expanded={active} className={`flex min-h-[96px] flex-col items-center justify-center rounded-[20px] px-2 py-3 text-center transition active:scale-[0.98] ${active ? 'bg-indigo-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.2)]' : 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80'}`}>
      <span className={`grid h-9 w-9 place-items-center rounded-[13px] ${active ? 'bg-white/15 text-white' : 'bg-indigo-50 text-indigo-700'}`}>{icon}</span>
      <span className="mt-2 text-[12px] font-black leading-tight">{title}</span>
      <span className={`mt-0.5 text-[9px] font-semibold leading-tight ${active ? 'text-indigo-100' : 'text-slate-400'}`}>{subtitle}</span>
    </button>
  )
}

export default function HebrewLearningHome() {
  const [keyboardEnabled, setKeyboardEnabled] = useState(false)
  const [openQuick, setOpenQuick] = useState<QuickPanelId | null>(null)

  function toggleQuick(id: QuickPanelId) {
    setOpenQuick(current => current === id ? null : id)
  }

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
          <Link href="/estudios/hebreo/aprender" className="flex min-h-[104px] items-center justify-center rounded-[26px] bg-indigo-600 px-5 py-4 text-center text-white shadow-[0_14px_35px_rgba(79,70,229,0.22)] transition active:scale-[0.985]">
            <span className="block w-full">
              <span className="mx-auto inline-flex rounded-full bg-white/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em]">Empieza aquí</span>
              <span className="mt-2 block text-[19px] font-black">Aprender</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-indigo-100">Curso guiado paso a paso</span>
            </span>
          </Link>
        </section>

        <nav aria-label="Accesos desplegables de Hebreo Bíblico" className="mt-3 grid grid-cols-3 gap-2.5">
          <QuickButton id="translator" icon={<Languages className="h-4.5 w-4.5" />} title="Traductor" subtitle="Español ⇄ Hebreo" active={openQuick === 'translator'} onToggle={toggleQuick} />
          <QuickButton id="bible" icon={<BookOpenText className="h-4.5 w-4.5" />} title="Biblia" subtitle="Leer en hebreo" active={openQuick === 'bible'} onToggle={toggleQuick} />
          <QuickButton id="materials" icon={<Library className="h-4.5 w-4.5" />} title="Materiales" subtitle="Curso y apoyo" active={openQuick === 'materials'} onToggle={toggleQuick} />
        </nav>

        {openQuick && (
          <section aria-label={`${QUICK_PANELS[openQuick].title} desplegado`} className="mt-5 border-t border-slate-200 pt-5">
            {openQuick === 'translator' && (
              <div>
                <div className="mb-4 text-center">
                  <p lang="he" dir="rtl" className="text-[1.05rem] font-black text-indigo-700">תַּרְגּוּם</p>
                  <h2 className="mt-1 text-[1.35rem] font-black tracking-[-0.02em]">Traductor</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Escribe una palabra o frase sin salir del inicio.</p>
                </div>
                <HebrewTranslator embedded />
              </div>
            )}
            {openQuick === 'bible' && <HebrewBibleReader />}
            {openQuick === 'materials' && (
              <div>
                <div className="mb-4 text-center">
                  <p lang="he" dir="rtl" className="text-[1.05rem] font-black text-indigo-700">חֹמֶר לִמּוּד</p>
                  <h2 className="mt-1 text-[1.35rem] font-black tracking-[-0.02em]">Materiales</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Recursos del curso organizados por etapas.</p>
                </div>
                <HebrewSupportMaterials embedded />
              </div>
            )}
          </section>
        )}

        <section aria-label="Práctica" className="mt-4 space-y-2.5">
          <details className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
            <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-left">
              <span><span className="block text-[13px] font-black text-slate-900">Prueba tu progreso</span><span className="block text-[10px] text-slate-400">Práctica personal según tu historial</span></span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="border-t border-slate-100 px-4 pb-4 pt-2"><HebrewProgressCoach /></div>
          </details>

          <div>
            <button type="button" onClick={() => setKeyboardEnabled(value => !value)} aria-expanded={keyboardEnabled} className={`flex min-h-[68px] w-full items-center justify-between gap-3 rounded-[22px] border px-4 text-left shadow-sm transition active:scale-[0.99] ${keyboardEnabled ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}>
              <span className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-[14px] ${keyboardEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-700'}`}><Keyboard className="h-4.5 w-4.5" /></span>
                <span><span className="block text-[13px] font-black text-slate-900">Teclado hebreo</span><span className="block text-[10px] text-slate-400">Practica tu escritura en hebreo</span></span>
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${keyboardEnabled ? 'rotate-180' : ''}`} />
            </button>
            {keyboardEnabled && (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <HebrewKeyboardDock enabled={keyboardEnabled} />
              </div>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-[9px] leading-relaxed text-slate-400">FASE H · Aprendizaje en desarrollo · práctica sugerida de 5–10 minutos al día</p>
      </div>
    </main>
  )
}
