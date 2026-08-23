'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'
import GrammarNavigator from '@/components/hebreo/GrammarNavigator'
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
  shortTitle: string
  description: string
}

const SECTIONS: readonly LearningSection[] = [
  { id: 'alef-bet', number: 1, he: 'אָלֶף־בֵּית', title: 'Alef-Bet y Sofit', shortTitle: 'Alef-Bet', description: 'Letras, formas finales, Dagesh y diferencias de sonido.' },
  { id: 'vowels', number: 2, he: 'תְּנוּעוֹת', title: 'Vocales y Sheva', shortTitle: 'Vocales', description: 'A · E · I, después O · U, Sheva y formación de sílabas.' },
  { id: 'vocabulary', number: 3, he: 'מִלִּים', title: 'Palabras y frases', shortTitle: 'Palabras', description: 'Memorización por categorías y frases útiles claramente separadas.' },
  { id: 'reading', number: 4, he: 'קְרִיאָה', title: 'Lectura bíblica', shortTitle: 'Lectura', description: 'Shemá, versículos conocidos y lectura continua de la Biblia.' },
  { id: 'grammar', number: 5, he: 'דִּקְדּוּק', title: 'Reglas', shortTitle: 'Reglas', description: 'Reglas del curso en orden, una por una.' },
  { id: 'review', number: 6, he: 'חֲזָרָה', title: 'Repaso', shortTitle: 'Repaso', description: 'Practica lo aprendido antes de avanzar.' },
]

function SectionContent({ id }: { id: SectionId }) {
  if (id === 'alef-bet') return <AlefBetExplorer simpleMode={false} />
  if (id === 'vowels') return <NiqqudExplorer />
  if (id === 'vocabulary') return <HebrewWordsStudy />
  if (id === 'reading') return <HebrewBibleReader />
  if (id === 'grammar') return <GrammarNavigator />
  return <ReviewExplorer />
}

export default function HebrewCourseCenter() {
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  const activeSection = SECTIONS.find(section => section.id === openSection) ?? null

  return (
    <main className="min-h-screen bg-[#f9f9fb] text-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-3 sm:px-6">
        <header>
          <Link href="/estudios/hebreo" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-black text-slate-600"><ArrowLeft className="h-4 w-4" /> Hebreo Bíblico</Link>
          <div className="mx-auto mt-1 max-w-lg text-center">
            <p lang="he" dir="rtl" className="text-[2rem] font-black leading-none text-indigo-700">לִמּוּד</p>
            <h1 className="mt-1.5 text-[1.55rem] font-black tracking-[-0.03em]">Aprender</h1>
            <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">Este es el inicio del curso. Avanza en orden y abre únicamente el tema que vas a practicar.</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">5–10 min al día · de arriba hacia abajo</p>
          </div>
        </header>

        <section aria-label="Ruta de aprendizaje" className="mx-auto mt-5 grid w-full max-w-md grid-cols-3 gap-2.5">
          {SECTIONS.map(section => {
            const open = openSection === section.id
            return (
              <button key={section.id} type="button" onClick={() => setOpenSection(current => current === section.id ? null : section.id)} aria-expanded={open} className={`flex min-h-[116px] flex-col items-center justify-center rounded-[22px] px-2 py-3 text-center transition active:scale-[0.98] ${open ? 'bg-indigo-600 text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)]' : 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80'}`}>
                <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-black ${open ? 'bg-white/15 text-white' : 'bg-indigo-50 text-indigo-700'}`}>{section.number}</span>
                <span lang="he" dir="rtl" className={`mt-2 text-[16px] font-black leading-none ${open ? 'text-white' : 'text-indigo-700'}`}>{section.he}</span>
                <span className="mt-2 text-[11px] font-black leading-tight">{section.shortTitle}</span>
              </button>
            )
          })}
        </section>

        {activeSection && (
          <section aria-live="polite" className="mt-6 border-t border-slate-200 pt-5">
            <header className="mx-auto mb-5 max-w-md text-center">
              <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-[11px] font-black text-white">{activeSection.number}</span>
              <p lang="he" dir="rtl" className="mt-2 text-[1.4rem] font-black leading-none text-indigo-700">{activeSection.he}</p>
              <h2 className="mt-1.5 text-[1.45rem] font-black tracking-[-0.025em] text-slate-950">{activeSection.title}</h2>
              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">{activeSection.description}</p>
            </header>
            <div className="mx-auto w-full"><SectionContent id={activeSection.id} /></div>
          </section>
        )}

        {!activeSection && <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-400">Selecciona una etapa para comenzar. El contenido se abrirá debajo sin abandonar el curso.</p>}
      </div>
    </main>
  )
}
