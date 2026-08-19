'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Accessibility,
  ArrowLeft,
  BookOpenText,
  ChevronDown,
  ChevronRight,
  Clock3,
  LockKeyhole,
} from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'

type SectionId = 'alef-bet' | 'vowels' | 'vocabulary' | 'grammar' | 'reading' | 'review'

type LearningStage = {
  order: number
  he: string
  es: string
  description: string
  status: 'current' | 'locked'
}

type LearningSection = {
  id: SectionId
  he: string
  es: string
  description: string
  available: boolean
}

const ROADMAP: readonly LearningStage[] = [
  { order: 1, he: 'אָלֶף־בֵּית', es: 'Alef-bet', description: 'Reconoce las 22 letras y sus sonidos.', status: 'current' },
  { order: 2, he: 'תְּנוּעוֹת', es: 'Vocales y sílabas', description: 'Une consonantes y vocales para empezar a leer.', status: 'locked' },
  { order: 3, he: 'קְרִיאַת מִלִּים', es: 'Lectura de palabras', description: 'Lee palabras breves con apoyo gradual.', status: 'locked' },
  { order: 4, he: 'אוֹצַר מִלִּים', es: 'Vocabulario básico', description: 'Aprende palabras frecuentes por tema.', status: 'locked' },
  { order: 5, he: 'אוֹתִיּוֹת סוֹפִיּוֹת', es: 'Letras finales', description: 'Reconoce las cinco formas usadas al final.', status: 'locked' },
  { order: 6, he: 'דָּגֵשׁ וּשְׁוָא', es: 'Dagesh y shewa', description: 'Comprende dos marcas comunes de lectura.', status: 'locked' },
  { order: 7, he: 'שֹׁרֶשׁ', es: 'Raíces hebreas', description: 'Empieza a reconocer familias de palabras.', status: 'locked' },
  { order: 8, he: 'דִּקְדּוּק', es: 'Gramática esencial', description: 'Aprende patrones útiles sin tablas pesadas.', status: 'locked' },
  { order: 9, he: 'מִשְׁפָּטִים קְצָרִים', es: 'Frases cortas', description: 'Combina lectura, vocabulario y gramática.', status: 'locked' },
  { order: 10, he: 'קְרִיאָה מוּדְרֶכֶת', es: 'Lectura guiada', description: 'Lee pasajes bíblicos con ayudas graduadas.', status: 'locked' },
]

const SECTIONS: readonly LearningSection[] = [
  { id: 'alef-bet', he: 'אָלֶף־בֵּית', es: 'Alef-bet', description: 'Reconoce las 22 letras y sus formas especiales.', available: true },
  { id: 'vowels', he: 'תְּנוּעוֹת וַהֲבָרוֹת', es: 'Vocales y sílabas', description: 'Aprende nikud y combina sonidos paso a paso.', available: false },
  { id: 'vocabulary', he: 'אוֹצַר מִלִּים', es: 'Vocabulario', description: 'Palabras frecuentes, cortas y agrupadas por tema.', available: false },
  { id: 'grammar', he: 'דִּקְדּוּק', es: 'Gramática', description: 'Reglas esenciales explicadas por capas.', available: false },
  { id: 'reading', he: 'קְרִיאָה', es: 'Lecturas', description: 'Palabras, frases y textos bíblicos seleccionados.', available: false },
  { id: 'review', he: 'חֲזָרָה', es: 'Repaso', description: 'Práctica breve de lo que necesite más refuerzo.', available: false },
]

function ScrollToAlefBet({ onOpen }: { onOpen: () => void }) {
  function openAndScroll() {
    onOpen()
    window.setTimeout(() => {
      document.getElementById('hebrew-section-alef-bet')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  return (
    <button
      type="button"
      onClick={openAndScroll}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-black text-white transition-transform active:scale-[0.97]"
    >
      Continuar
      <ChevronRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
    </button>
  )
}

function LearningRoute() {
  return (
    <details className="group border-y border-slate-200 bg-white/80">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 py-3.5 marker:content-none">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-black text-indigo-700">1/10</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">Ruta de aprendizaje</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">De reconocer letras a leer textos bíblicos.</p>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <ol className="border-t border-slate-100 pb-2">
        {ROADMAP.map(stage => (
          <li key={stage.order} className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${stage.status === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {String(stage.order).padStart(2, '0')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span lang="he" dir="rtl" className={`text-[13px] font-bold ${stage.status === 'current' ? 'text-indigo-700' : 'text-slate-400'}`}>{stage.he}</span>
                <span className={`text-sm font-bold ${stage.status === 'current' ? 'text-slate-950' : 'text-slate-600'}`}>{stage.es}</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{stage.description}</p>
            </div>
            {stage.status === 'current' ? (
              <span className="mt-1 text-[11px] font-bold text-indigo-600">Ahora</span>
            ) : (
              <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-slate-300" aria-label="Bloqueado" />
            )}
          </li>
        ))}
      </ol>
    </details>
  )
}

function LearningAccordion({
  section,
  open,
  onToggle,
  simpleMode,
}: {
  section: LearningSection
  open: boolean
  onToggle: () => void
  simpleMode: boolean
}) {
  return (
    <section id={`hebrew-section-${section.id}`} className="scroll-mt-4 border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`hebrew-panel-${section.id}`}
        onClick={onToggle}
        disabled={!section.available}
        className="flex min-h-[76px] w-full items-center gap-3 py-3.5 text-left disabled:cursor-default"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span lang="he" dir="rtl" className={`text-[13px] font-bold ${section.available ? 'text-indigo-700' : 'text-slate-400'}`}>{section.he}</span>
            <span className={`text-base font-black ${section.available ? 'text-slate-950' : 'text-slate-600'}`}>{section.es}</span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{section.description}</p>
        </div>
        {section.available ? (
          <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" /> Bloqueado
          </span>
        )}
      </button>

      {open && section.available && (
        <div id={`hebrew-panel-${section.id}`} className="pb-6">
          {section.id === 'alef-bet' && <AlefBetExplorer simpleMode={simpleMode} />}
        </div>
      )}
    </section>
  )
}

export default function HebrewLearningHome() {
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const [simpleMode, setSimpleMode] = useState(true)

  function toggleSection(section: LearningSection) {
    if (!section.available) return
    setOpenSection(current => (current === section.id ? null : section.id))
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f8f7f3] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/estudios"
          aria-label="Volver a Estudios"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-800 transition-transform active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <p lang="he" dir="rtl" className="text-[12px] font-bold text-indigo-700">עברית מקראית</p>
          <h1 className="truncate text-[1.65rem] font-black leading-tight tracking-[-0.025em] text-slate-950">Hebreo Bíblico</h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">Aprende a leer paso a paso</p>
        </div>
        <button
          type="button"
          aria-expanded={accessibilityOpen}
          onClick={() => setAccessibilityOpen(value => !value)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 active:scale-[0.98]"
        >
          <Accessibility className="h-4 w-4" aria-hidden="true" />
          Lectura
        </button>
      </header>

      {accessibilityOpen && (
        <section className="mb-5 border-y border-slate-200 bg-white/80 py-3" aria-label="Ajustes de lectura">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-slate-900">Modo sencillo</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Deja visibles solo las ayudas esenciales.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={simpleMode}
              onClick={() => setSimpleMode(value => !value)}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${simpleMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${simpleMode ? 'translate-x-7' : 'translate-x-1'}`} />
              <span className="sr-only">{simpleMode ? 'Desactivar modo sencillo' : 'Activar modo sencillo'}</span>
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">El tamaño base ya prioriza lectura cómoda. El control de escala persistente se activará cuando se defina la preferencia de usuario del módulo.</p>
        </section>
      )}

      <section className="mb-6" aria-label="Siguiente paso">
        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-indigo-600">Continúa tu camino</p>
              <p className="mt-1 text-[11px] font-bold text-slate-400"><span lang="he" dir="rtl">אָלֶף־בֵּית</span> · Etapa 1 de 10</p>
            </div>
            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700">Ahora</span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.02em] text-slate-950">Reconoce las primeras letras</h2>
          <p className="mt-1.5 max-w-[31rem] text-[15px] leading-relaxed text-slate-600">Empieza por su forma, nombre y sonido. Lo demás aparecerá cuando lo necesites.</p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Sesión breve
            </div>
            <ScrollToAlefBet onOpen={() => setOpenSection('alef-bet')} />
          </div>
        </div>
      </section>

      {!simpleMode && (
        <section className="mb-6" aria-label="Ruta completa">
          <LearningRoute />
        </section>
      )}

      <section className="mb-7" aria-labelledby="areas-hebreo-title">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Lecciones</p>
            <h2 id="areas-hebreo-title" className="mt-0.5 text-xl font-black text-slate-950">Aprende por áreas</h2>
          </div>
          {!simpleMode && <span className="text-[11px] font-bold text-slate-400">1 disponible</span>}
        </div>

        <div className="border-y border-slate-200 bg-white/80 px-1 sm:px-2">
          {SECTIONS.map(section => (
            <LearningAccordion
              key={section.id}
              section={section}
              open={openSection === section.id}
              onToggle={() => toggleSection(section)}
              simpleMode={simpleMode}
            />
          ))}
        </div>
      </section>

      <section className="mb-8 border-y border-slate-200 bg-white/70 py-4" aria-labelledby="contexto-hebreo-title">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 marker:content-none">
            <BookOpenText className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p id="contexto-hebreo-title" className="text-sm font-black text-slate-900"><span lang="he" dir="rtl" className="mr-2 text-indigo-700">על העברית</span>Conoce el hebreo</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Historia, escritura y términos que puedes consultar cuando quieras.</p>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="pt-4 text-sm leading-relaxed text-slate-600">
            <p>El hebreo bíblico se lee de derecha a izquierda. En esta ruta aprenderás primero a reconocer lo que ves; después se incorporarán vocales, sílabas, palabras y reglas.</p>
            <p className="mt-2 text-xs text-slate-400">Cuando aparezca un término técnico, la interfaz mostrará primero una explicación sencilla y dejará el detalle académico como información opcional.</p>
          </div>
        </details>
      </section>

      <footer className="border-t border-slate-200 pt-5 text-[11px] leading-relaxed text-slate-400">
        Fuente textual para los próximos pasos: STEP Bible / STEPBible-Data, CC BY 4.0. El audio y el progreso persistente no se mostrarán hasta contar con su contrato y fuente aprobados.
      </footer>
    </main>
  )
}
