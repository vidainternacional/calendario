'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'
import GrammarExplorer from '@/components/hebreo/GrammarExplorer'
import HebrewBibleReader from '@/components/hebreo/HebrewBibleReader'
import HebrewWordsStudy from '@/components/hebreo/HebrewWordsStudy'
import NiqqudExplorer from '@/components/hebreo/NiqqudExplorer'
import ReviewExplorer from '@/components/hebreo/ReviewExplorer'

type SectionId = 'alef-bet' | 'vowels' | 'vocabulary' | 'reading' | 'grammar' | 'review'

type LearningSection = {
  id: SectionId
  number: number
  he: string
  title: string
  description: string
}

const SECTIONS: readonly LearningSection[] = [
  { id: 'alef-bet', number: 1, he: 'אָלֶף־בֵּית', title: 'Alef-Bet y Sofit', description: 'Letras, formas finales, Dagesh y diferencias de sonido.' },
  { id: 'vowels', number: 2, he: 'תְּנוּעוֹת', title: 'Vocales y Sheva', description: 'A · E · I, después O · U, Sheva y formación de sílabas.' },
  { id: 'vocabulary', number: 3, he: 'מִלִּים', title: 'Palabras y frases', description: 'Memorización por categorías y frases útiles claramente separadas.' },
  { id: 'reading', number: 4, he: 'קְרִיאָה', title: 'Lectura bíblica', description: 'Shemá, versículos conocidos y lectura continua de la Biblia.' },
  { id: 'grammar', number: 5, he: 'דִּקְדּוּק', title: 'Reglas', description: 'Prefijos, patrones y gramática progresiva por capas.' },
  { id: 'review', number: 6, he: 'חֲזָרָה', title: 'Repaso', description: 'Practica lo aprendido antes de avanzar.' },
]

function SectionContent({ id }: { id: SectionId }) {
  if (id === 'alef-bet') return <AlefBetExplorer simpleMode={false} />
  if (id === 'vowels') return <NiqqudExplorer />
  if (id === 'vocabulary') return <HebrewWordsStudy />
  if (id === 'reading') return <HebrewBibleReader />
  if (id === 'grammar') return <GrammarExplorer />
  return <ReviewExplorer />
}

export default function HebrewCourseCenter() {
  const [openSection, setOpenSection] = useState<SectionId | null>(null)

  return (
    <main className="min-h-screen bg-[#f9f9fb] text-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-3 sm:px-6">
        <header>
          <Link href="/estudios/hebreo" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-black text-slate-600"><ArrowLeft className="h-4 w-4" /> Hebreo Bíblico</Link>
          <div className="mt-1 text-center">
            <p lang="he" dir="rtl" className="text-[2rem] font-black leading-none text-indigo-700">לִמּוּד</p>
            <h1 className="mt-1.5 text-[1.55rem] font-black tracking-[-0.03em]">Aprender</h1>
            <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">Sigue el orden del curso. Abre únicamente el tema que vas a practicar hoy.</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">5–10 min al día · de arriba hacia abajo</p>
          </div>
        </header>

        <section aria-label="Ruta de aprendizaje" className="mt-5 divide-y divide-slate-200 border-y border-slate-200 bg-white">
          {SECTIONS.map(section => {
            const open = openSection === section.id
            return (
              <div key={section.id}>
                <button type="button" onClick={() => setOpenSection(current => current === section.id ? null : section.id)} aria-expanded={open} className={`flex min-h-[70px] w-full items-center gap-3 px-1 py-2.5 text-left transition ${open ? 'bg-indigo-50/60' : 'bg-white active:bg-slate-50'}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black ${open ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'}`}>{section.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2"><span lang="he" dir="rtl" className="text-[15px] font-black text-indigo-700">{section.he}</span><span className="text-[13px] font-black text-slate-950">{section.title}</span></span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-400">{section.description}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && <div className="border-t border-slate-100 bg-[#fdfdfe] px-1 py-5 sm:px-3"><SectionContent id={section.id} /></div>}
              </div>
            )
          })}
        </section>

        <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-400">No necesitas abrir todos los módulos a la vez. La ruta está pensada para aprender una capa y luego practicarla.</p>
      </div>
    </main>
  )
}
