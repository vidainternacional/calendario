'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, BookOpenText, ChevronDown, Keyboard, Languages, Library, Mic } from 'lucide-react'
import HebrewBibleReader from '@/components/hebreo/HebrewBibleReader'
import HebrewKeyboardDock from '@/components/hebreo/HebrewKeyboardDock'
import HebrewProgressCoach from '@/components/hebreo/HebrewProgressCoach'
import HebrewSpeechPractice from '@/components/hebreo/HebrewSpeechPractice'
import HebrewSupportMaterials from '@/components/hebreo/HebrewSupportMaterials'
import HebrewTranslator from '@/components/hebreo/HebrewTranslator'

type QuickPanelId = 'translator' | 'bible' | 'materials'
type PracticePanelId = 'evaluation' | 'speech' | 'keyboard'

const QUICK_PANELS: Record<QuickPanelId, { title: string; subtitle: string }> = {
  translator: { title: 'Traductor', subtitle: 'Español ⇄ Hebreo' },
  bible: { title: 'Biblia', subtitle: 'Leer en hebreo' },
  materials: { title: 'Materiales', subtitle: 'Curso y apoyo' },
}

const PRACTICE_PANELS: Record<PracticePanelId, { title: string; subtitle: string }> = {
  evaluation: { title: 'Evaluación y progreso', subtitle: 'Nivel, pruebas, notas y recomendaciones' },
  speech: { title: 'Práctica oral', subtitle: 'Escucha, habla y compara tu pronunciación' },
  keyboard: { title: 'Teclado hebreo', subtitle: 'Escritura y reconocimiento de letras' },
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

function PracticeRow({ id, icon, active, onToggle }: { id: PracticePanelId; icon: React.ReactNode; active: boolean; onToggle: (id: PracticePanelId) => void }) {
  const panel = PRACTICE_PANELS[id]
  return (
    <button type="button" onClick={() => onToggle(id)} aria-expanded={active} className="relative flex min-h-[70px] w-full items-center justify-center px-12 text-center transition active:bg-slate-50">
      <span className={`absolute left-2.5 grid h-9 w-9 place-items-center rounded-[13px] ${active ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'}`}>{icon}</span>
      <span>
        <span className="block text-[13px] font-black text-slate-900">{panel.title}</span>
        <span className="mt-0.5 block text-[9px] font-semibold text-slate-400">{panel.subtitle}</span>
      </span>
      <ChevronDown className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${active ? 'rotate-180' : ''}`} />
    </button>
  )
}

export default function HebrewLearningHome() {
  const [progressOpen, setProgressOpen] = useState(true)
  const [openQuick, setOpenQuick] = useState<QuickPanelId | null>(null)
  const [openPractice, setOpenPractice] = useState<PracticePanelId | null>('evaluation')

  function toggleQuick(id: QuickPanelId) { setOpenQuick(current => current === id ? null : id) }
  function togglePractice(id: PracticePanelId) { setOpenPractice(current => current === id ? null : id) }

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
          <Link href="/estudios/hebreo/aprender" className="group relative flex min-h-[104px] items-center justify-center overflow-hidden rounded-[26px] bg-indigo-600 px-5 py-4 text-center text-white shadow-[0_14px_35px_rgba(79,70,229,0.22)] transition active:scale-[0.985]">
            <span aria-hidden="true" lang="he" dir="rtl" className="hebrew-glimmer pointer-events-none absolute inset-0 flex items-center justify-around px-4 text-[2.4rem] font-black tracking-[0.18em] text-white/[0.07]">א ב ג ד ה</span>
            <span className="relative z-10 text-[21px] font-black tracking-[-0.02em]">Empecemos</span>
          </Link>
        </section>

        <nav aria-label="Accesos desplegables de Hebreo Bíblico" className="mt-3 grid grid-cols-3 gap-2.5">
          <QuickButton id="translator" icon={<Languages className="h-4.5 w-4.5" />} title="Traductor" subtitle="Español ⇄ Hebreo" active={openQuick === 'translator'} onToggle={toggleQuick} />
          <QuickButton id="bible" icon={<BookOpenText className="h-4.5 w-4.5" />} title="Biblia" subtitle="Leer en hebreo" active={openQuick === 'bible'} onToggle={toggleQuick} />
          <QuickButton id="materials" icon={<Library className="h-4.5 w-4.5" />} title="Materiales" subtitle="Curso y apoyo" active={openQuick === 'materials'} onToggle={toggleQuick} />
        </nav>

        {openQuick && (
          <section aria-label={`${QUICK_PANELS[openQuick].title} desplegado`} className="mt-5 border-t border-slate-200 pt-5">
            {openQuick === 'translator' && <div><div className="mb-4 text-center"><p lang="he" dir="rtl" className="text-[1.05rem] font-black text-indigo-700">תַּרְגּוּם</p><h2 className="mt-1 text-[1.35rem] font-black tracking-[-0.02em]">Traductor</h2><p className="mt-1 text-[12px] leading-relaxed text-slate-500">Escribe una palabra o frase sin salir del inicio.</p></div><HebrewTranslator embedded /></div>}
            {openQuick === 'bible' && <HebrewBibleReader />}
            {openQuick === 'materials' && <div><div className="mb-4 text-center"><p lang="he" dir="rtl" className="text-[1.05rem] font-black text-indigo-700">חֹמֶר לִמּוּד</p><h2 className="mt-1 text-[1.35rem] font-black tracking-[-0.02em]">Materiales</h2><p className="mt-1 text-[12px] leading-relaxed text-slate-500">Recursos del curso organizados por etapas.</p></div><HebrewSupportMaterials embedded /></div>}
          </section>
        )}

        <section aria-label="Práctica" className="mt-5 border-t border-slate-200">
          <button type="button" onClick={() => setProgressOpen(value => !value)} aria-expanded={progressOpen} className="relative flex min-h-[76px] w-full items-center justify-center px-12 text-center">
            <span><span className="block text-[14px] font-black text-slate-900">Prueba tu progreso</span><span className="mt-0.5 block text-[10px] text-slate-400">Evalúa, practica y revisa tu avance</span></span>
            <ChevronDown className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${progressOpen ? 'rotate-180' : ''}`} />
          </button>

          {progressOpen && (
            <div className="border-t border-slate-100">
              <div className="divide-y divide-slate-100">
                <div>
                  <PracticeRow id="evaluation" icon={<BarChart3 className="h-4 w-4" />} active={openPractice === 'evaluation'} onToggle={togglePractice} />
                  {openPractice === 'evaluation' && <div className="border-t border-slate-100 px-1 pb-5 pt-3"><HebrewProgressCoach /></div>}
                </div>
                <div>
                  <PracticeRow id="speech" icon={<Mic className="h-4 w-4" />} active={openPractice === 'speech'} onToggle={togglePractice} />
                  {openPractice === 'speech' && <div className="border-t border-slate-100 pb-4"><HebrewSpeechPractice /></div>}
                </div>
                <div>
                  <PracticeRow id="keyboard" icon={<Keyboard className="h-4 w-4" />} active={openPractice === 'keyboard'} onToggle={togglePractice} />
                  {openPractice === 'keyboard' && <div className="border-t border-slate-100 pb-5 pt-4"><HebrewKeyboardDock enabled /></div>}
                </div>
              </div>
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-[9px] leading-relaxed text-slate-400">FASE H · Aprendizaje en desarrollo · práctica sugerida de 5–10 minutos al día</p>
      </div>
      <style jsx global>{`
        @keyframes hebrewGlimmer { 0%, 72%, 100% { opacity: .35; filter: brightness(1); } 80% { opacity: .72; filter: brightness(2.3); } 88% { opacity: .35; filter: brightness(1); } }
        .hebrew-glimmer { animation: hebrewGlimmer 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .hebrew-glimmer { animation: none; } }
      `}</style>
    </main>
  )
}
