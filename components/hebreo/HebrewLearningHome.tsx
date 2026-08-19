'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Accessibility,
  ArrowLeft,
  BookOpenText,
  ChevronDown,
  LockKeyhole,
} from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'

type SectionId = 'alef-bet' | 'vowels' | 'reading' | 'vocabulary' | 'grammar' | 'review'

type LearningSection = {
  id: SectionId
  he: string
  es: string
  short: string
  description: string
  available: boolean
}

const SECTIONS: readonly LearningSection[] = [
  {
    id: 'alef-bet',
    he: 'אָלֶף־בֵּית',
    es: 'Alef-bet',
    short: 'Letras',
    description: 'Reconoce las 22 letras, sus nombres, sonidos y formas especiales.',
    available: true,
  },
  {
    id: 'vowels',
    he: 'תְּנוּעוֹת',
    es: 'Vocales y sílabas',
    short: 'Vocales',
    description: 'Aprende los signos vocálicos y cómo se unen con las consonantes.',
    available: false,
  },
  {
    id: 'reading',
    he: 'קְרִיאָה',
    es: 'Lectura',
    short: 'Lectura',
    description: 'Pasa de sílabas a palabras y frases breves.',
    available: false,
  },
  {
    id: 'vocabulary',
    he: 'מִלִּים',
    es: 'Vocabulario',
    short: 'Palabras',
    description: 'Aprende palabras frecuentes sin cargar la pantalla de definiciones.',
    available: false,
  },
  {
    id: 'grammar',
    he: 'דִּקְדּוּק',
    es: 'Gramática',
    short: 'Reglas',
    description: 'Comprende reglas esenciales por capas y con ejemplos cortos.',
    available: false,
  },
  {
    id: 'review',
    he: 'חֲזָרָה',
    es: 'Repaso',
    short: 'Repaso',
    description: 'Refuerza lo que necesite más práctica en sesiones breves.',
    available: false,
  },
]

function StagePanel({
  section,
  simpleMode,
}: {
  section: LearningSection
  simpleMode: boolean
}) {
  return (
    <section
      id={`hebrew-panel-${section.id}`}
      aria-live="polite"
      className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <p lang="he" dir="rtl" className="text-[15px] font-bold text-indigo-700">
            {section.he}
          </p>
          <h2 className="mt-0.5 text-xl font-black tracking-[-0.02em] text-slate-950">
            {section.es}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            {section.description}
          </p>
        </div>
        {!section.available && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-500">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            Después
          </span>
        )}
      </div>

      {section.available ? (
        <div className="px-4 pb-5 pt-4 sm:px-5">
          {section.id === 'alef-bet' && <AlefBetExplorer simpleMode={simpleMode} />}
        </div>
      ) : (
        <div className="px-5 py-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Esta etapa se activará cuando corresponda en la ruta. No necesitas aprenderla todavía.
          </p>
        </div>
      )}
    </section>
  )
}

export default function HebrewLearningHome() {
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const [simpleMode, setSimpleMode] = useState(true)

  const activeSection = SECTIONS.find(section => section.id === openSection) ?? null

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f8f7f3] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <header className="mb-7">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/estudios"
            aria-label="Volver a Estudios"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-transform active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>

          <button
            type="button"
            aria-expanded={accessibilityOpen}
            onClick={() => setAccessibilityOpen(value => !value)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] active:scale-[0.98]"
          >
            <Accessibility className="h-4 w-4" aria-hidden="true" />
            Lectura
          </button>
        </div>

        <div className="mt-6">
          <p
            lang="he"
            dir="rtl"
            className="text-[2.8rem] font-black leading-[0.95] tracking-[-0.03em] text-slate-950"
          >
            עברית מקראית
          </p>
          <h1 className="mt-2 text-[1.75rem] font-black leading-tight tracking-[-0.025em] text-slate-950">
            Hebreo Bíblico
          </h1>
          <p className="mt-1 text-[15px] font-medium text-slate-500">
            Aprende a leer paso a paso.
          </p>
        </div>
      </header>

      {accessibilityOpen && (
        <section className="mb-6 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]" aria-label="Ajustes de lectura">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-slate-900">Modo sencillo</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                Deja visibles solo las ayudas esenciales.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={simpleMode}
              onClick={() => setSimpleMode(value => !value)}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                simpleMode ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  simpleMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
              <span className="sr-only">
                {simpleMode ? 'Desactivar modo sencillo' : 'Activar modo sencillo'}
              </span>
            </button>
          </div>
        </section>
      )}

      <section className="mb-8" aria-labelledby="areas-hebreo-title">
        <div className="mb-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            Tu camino
          </p>
          <h2 id="areas-hebreo-title" className="mt-0.5 text-xl font-black tracking-[-0.02em] text-slate-950">
            Elige qué quieres aprender
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SECTIONS.map(section => {
            const active = openSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                aria-pressed={active}
                aria-controls={`hebrew-panel-${section.id}`}
                onClick={() => setOpenSection(current => (current === section.id ? null : section.id))}
                className={`aspect-square min-h-[92px] rounded-full border px-2 py-3 text-center transition-all duration-200 active:scale-[0.97] motion-reduce:transition-none ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)]'
                    : 'border-slate-200 bg-white text-slate-800 shadow-[0_6px_20px_rgba(15,23,42,0.05)]'
                }`}
              >
                <span
                  lang="he"
                  dir="rtl"
                  className={`block text-[14px] font-bold ${active ? 'text-white/80' : 'text-indigo-700'}`}
                >
                  {section.he}
                </span>
                <span className="mt-1 block text-[12px] font-black leading-tight">
                  {section.short}
                </span>
                {!section.available && (
                  <span className={`mt-1 block text-[9px] font-bold ${active ? 'text-white/65' : 'text-slate-400'}`}>
                    después
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {activeSection && <StagePanel section={activeSection} simpleMode={simpleMode} />}
      </section>

      <section className="mb-8 border-y border-slate-200 bg-white/70 py-4" aria-labelledby="contexto-hebreo-title">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 marker:content-none">
            <BookOpenText className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p id="contexto-hebreo-title" className="text-sm font-black text-slate-900">
                <span lang="he" dir="rtl" className="mr-2 text-indigo-700">
                  על העברית
                </span>
                Conoce el hebreo
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                Historia, escritura y términos que puedes consultar cuando quieras.
              </p>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="pt-4 text-sm leading-relaxed text-slate-600">
            <p>
              El hebreo bíblico se lee de derecha a izquierda. Aquí aprenderás primero a reconocer lo que ves; después se incorporarán vocales, sílabas, palabras y reglas.
            </p>
          </div>
        </details>
      </section>

      <footer className="border-t border-slate-200 pt-5 text-[10px] leading-relaxed text-slate-400">
        Fuente textual para los próximos pasos: STEP Bible / STEPBible-Data, CC BY 4.0.
      </footer>
    </main>
  )
}
