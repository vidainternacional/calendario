'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Accessibility,
  ArrowLeft,
  BookOpenText,
  ChevronDown,
  ExternalLink,
  PlayCircle,
} from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'
import { HEBREW_SUPPORT_COURSE } from '@/lib/hebreo/material-apoyo'

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

function FlowPreview() {
  return (
    <section className="mb-8" aria-labelledby="flujo-hebreo-title">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Cómo vas a avanzar</p>
      <h2 id="flujo-hebreo-title" className="mt-0.5 text-xl font-black tracking-[-0.02em] text-slate-950">
        De reconocer a comprender
      </h2>
      <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-2">
          {['Reconozco', 'Distingo', 'Combino', 'Leo', 'Comprendo'].map((item, index) => (
            <span key={item} className="flex items-center gap-2">
              <span className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-black ${index === 0 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                {item}
              </span>
              {index < 4 && <span className="text-slate-300" aria-hidden="true">→</span>}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
        Esta secuencia muestra la lógica general del curso. No representa progreso guardado todavía.
      </p>
    </section>
  )
}

function VowelsArchitecturePreview() {
  return (
    <div className="border-t border-slate-200 pt-5">
      <p className="text-sm font-black text-slate-900">Una vocal, una combinación, una lectura.</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">La pantalla enseñará una sola idea antes de pedir combinar signos.</p>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Pataj</p>
          <p lang="he" dir="rtl" className="mt-2 text-[5.5rem] font-medium leading-none text-indigo-700">ַ</p>
          <p className="mt-3 text-base font-bold text-slate-700">Sonido parecido a “a”.</p>
        </div>
        <div className="min-w-[150px] text-right">
          <p className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Combina</p>
          <p lang="he" dir="rtl" className="mt-3 text-[2.6rem] font-black leading-none text-slate-950">ב + ַ = בַ</p>
          <p className="mt-3 text-lg font-black text-indigo-700">ba</p>
        </div>
      </div>

      <p className="mt-6 border-t border-slate-200 pt-4 text-[12px] leading-relaxed text-slate-500">
        El sonido puede variar ligeramente según la tradición de pronunciación. Audio se añadirá únicamente cuando exista una fuente aprobada.
      </p>
    </div>
  )
}

function ReadingArchitecturePreview() {
  return (
    <div className="border-t border-slate-200 pt-5">
      <p className="text-sm font-black text-slate-900">De partes pequeñas a una palabra completa.</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">Primero se reconoce la forma; después se reducen las ayudas.</p>

      <div className="mt-7 text-center">
        <p lang="he" dir="rtl" className="text-[4.6rem] font-black leading-none text-slate-950">מֶלֶךְ</p>
        <p className="mt-4 text-lg font-black text-indigo-700">mélej</p>
        <p className="mt-1 text-base font-bold text-slate-700">rey</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-center">
        {['Con nikud', 'Con ayuda', 'Sin ayuda'].map((item, index) => (
          <div key={item} className="py-2">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Paso {index + 1}</p>
            <p className="mt-1 text-sm font-black text-slate-800">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function VocabularyArchitecturePreview() {
  return (
    <div className="border-t border-slate-200 pt-5">
      <p className="text-sm font-black text-slate-900">Palabras que ya puedes reconocer al leer.</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">Vocabulario será aprendizaje progresivo; el diccionario será una herramienta separada de consulta.</p>

      <div className="mt-7">
        <p lang="he" dir="rtl" className="text-[4.4rem] font-black leading-none text-slate-950">מֶלֶךְ</p>
        <div className="mt-4 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Significado</p>
            <p className="mt-1 text-xl font-black text-slate-900">Rey</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Categoría</p>
            <p className="mt-1 text-sm font-bold text-slate-700">Persona / título</p>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-slate-500">La transliteración será ayuda opcional y no sustituirá aprender a leer las letras.</p>
      </div>
    </div>
  )
}

function GrammarArchitecturePreview() {
  return (
    <div className="border-t border-slate-200 pt-5">
      <p className="text-sm font-black text-slate-900">Reglas por capas, no tablas de golpe.</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">La primera vista muestra solo lo necesario para entender una estructura.</p>

      <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-black text-slate-900">Artículo definido</p>
            <p className="mt-0.5 text-[12px] text-slate-500">Una pieza pequeña que cambia cómo lees la palabra.</p>
          </div>
          <p lang="he" dir="rtl" className="text-[2.6rem] font-black text-indigo-700">הַ</p>
        </div>
        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-black text-slate-900">Raíz</p>
            <p className="mt-0.5 text-[12px] text-slate-500">Reconoce consonantes relacionadas antes de entrar en detalles.</p>
          </div>
          <p lang="he" dir="rtl" className="text-[2rem] font-black text-slate-950">מ־ל־ך</p>
        </div>
      </div>

      <button type="button" className="mt-4 min-h-11 text-sm font-black text-indigo-700" aria-label="Vista de diseño de detalles gramaticales">
        Ver cómo se ampliarán los detalles
      </button>
    </div>
  )
}

function ReviewArchitecturePreview() {
  return (
    <div className="border-t border-slate-200 pt-5">
      <p className="text-sm font-black text-slate-900">Repasos cortos y sin presión.</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">Más adelante cada respuesta ayudará a decidir qué conviene volver a practicar.</p>

      <div className="mt-7 text-center">
        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Ejemplo de repaso</p>
        <p lang="he" dir="rtl" className="mt-3 text-[6.5rem] font-medium leading-none text-slate-950">ב</p>
        <p className="mt-3 text-sm font-bold text-slate-600">¿Reconoces esta letra?</p>
      </div>

      <div className="mt-6 grid gap-2">
        {['Lo sé', 'Necesito practicar', 'Repasar después'].map(item => (
          <div key={item} className="flex min-h-12 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
            {item}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-slate-500">Esta vista no guarda resultados ni calcula dominio durante Bloque 1.</p>
    </div>
  )
}

function ArchitecturePreview({ section }: { section: LearningSection }) {
  if (section.id === 'vowels') return <VowelsArchitecturePreview />
  if (section.id === 'reading') return <ReadingArchitecturePreview />
  if (section.id === 'vocabulary') return <VocabularyArchitecturePreview />
  if (section.id === 'grammar') return <GrammarArchitecturePreview />
  return <ReviewArchitecturePreview />
}

function StagePanel({
  section,
  simpleMode,
}: {
  section: LearningSection
  simpleMode: boolean
}) {
  return (
    <section id={`hebrew-panel-${section.id}`} aria-live="polite" className="mt-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p lang="he" dir="rtl" className="text-[15px] font-bold text-indigo-700">{section.he}</p>
          <h2 className="mt-0.5 text-[1.55rem] font-black tracking-[-0.025em] text-slate-950">{section.es}</h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">{section.description}</p>
        </div>
        {!section.available && (
          <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-500">
            Diseño
          </span>
        )}
      </div>

      {section.id === 'alef-bet' ? <AlefBetExplorer simpleMode={simpleMode} /> : <ArchitecturePreview section={section} />}
    </section>
  )
}

function LearningScrollButton({
  section,
  active,
  onClick,
}: {
  section: LearningSection
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-controls={`hebrew-panel-${section.id}`}
      onClick={onClick}
      className="relative min-h-[108px] px-2 py-2 text-center transition-transform duration-200 active:scale-[0.97] motion-reduce:transition-none"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-2 inset-y-1 rounded-[18px] border shadow-[0_7px_20px_rgba(15,23,42,0.06)] transition-colors ${active ? 'border-indigo-600 bg-indigo-600' : 'border-[#ded8c9] bg-[#fffdfa]'}`}
      >
        <span className={`absolute -left-1.5 bottom-2 top-2 w-3 rounded-full border ${active ? 'border-indigo-500 bg-indigo-500' : 'border-[#ded8c9] bg-[#f4efe3]'}`} />
        <span className={`absolute -right-1.5 bottom-2 top-2 w-3 rounded-full border ${active ? 'border-indigo-500 bg-indigo-500' : 'border-[#ded8c9] bg-[#f4efe3]'}`} />
      </span>

      <span className="relative z-10 flex min-h-[92px] flex-col items-center justify-center px-1">
        <span lang="he" dir="rtl" className={`block text-[1.35rem] font-black leading-tight ${active ? 'text-white' : 'text-indigo-700'}`}>{section.he}</span>
        <span className={`mt-1.5 block text-[12px] font-black leading-tight ${active ? 'text-white' : 'text-slate-800'}`}>{section.short}</span>
        {!section.available && <span className={`mt-1 block text-[9px] font-bold ${active ? 'text-white/70' : 'text-slate-400'}`}>vista</span>}
      </span>
    </button>
  )
}

function verificationLabel(status: 'pendiente' | 'verificado' | 'corregir') {
  if (status === 'verificado') return 'Verificado'
  if (status === 'corregir') return 'Revisar enlace'
  return 'Pendiente'
}

function SupportMaterialSection() {
  return (
    <section className="mb-8 border-y border-slate-200 bg-white/70 py-4" aria-labelledby="material-apoyo-hebreo-title">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 marker:content-none">
          <PlayCircle className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p id="material-apoyo-hebreo-title" className="text-sm font-black text-slate-900">
              <span lang="he" dir="rtl" className="mr-2 text-indigo-700">חומר עזר</span>
              Material de apoyo
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">11 clases externas en YouTube para acompañar tu aprendizaje.</p>
          </div>
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="pt-4">
          <div className="mb-4">
            <p className="text-sm font-black text-slate-900">Curso de apoyo · 11 clases</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Las miniaturas quedan visibles para corroborar cada enlace antes de marcarlo como verificado.</p>
          </div>

          <div className="space-y-3">
            {HEBREW_SUPPORT_COURSE.map(item => (
              <a
                key={item.orden}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[92px] items-start gap-3 rounded-[18px] border border-slate-200 bg-white p-2.5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-transform active:scale-[0.99]"
                aria-label={`Abrir clase ${item.orden}: ${item.titulo} en YouTube`}
              >
                <span className="relative h-[72px] w-[116px] shrink-0 overflow-hidden rounded-[12px] bg-slate-100">
                  <img src={item.miniatura} alt={`Miniatura del enlace de la clase ${item.orden}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  <span className="absolute left-1.5 top-1.5 flex h-7 min-w-7 items-center justify-center rounded-full bg-black/70 px-1.5 text-[11px] font-black tabular-nums text-white">{item.orden}</span>
                </span>

                <span className="min-w-0 flex-1 py-0.5">
                  <span className="flex items-start justify-between gap-2">
                    <span className="block text-[14px] font-black leading-tight text-slate-900">{item.titulo}</span>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-slate-500">{item.tema}</span>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-black ${item.verificacion === 'verificado' ? 'bg-emerald-50 text-emerald-700' : item.verificacion === 'corregir' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {verificationLabel(item.verificacion)}
                  </span>
                </span>
              </a>
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Hasta corroborarlos visualmente, los enlaces permanecen como material en revisión. VIDA no reproduce ni modifica su contenido.</p>
        </div>
      </details>
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
          <Link href="/estudios" aria-label="Volver a Estudios" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-transform active:scale-95">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>

          <button type="button" aria-expanded={accessibilityOpen} onClick={() => setAccessibilityOpen(value => !value)} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] active:scale-[0.98]">
            <Accessibility className="h-4 w-4" aria-hidden="true" />
            Lectura
          </button>
        </div>

        <div className="mt-6">
          <p lang="he" dir="rtl" className="text-[2.8rem] font-black leading-[0.95] tracking-[-0.03em] text-slate-950">עברית מקראית</p>
          <h1 className="mt-2 text-[1.75rem] font-black leading-tight tracking-[-0.025em] text-slate-950">Hebreo Bíblico</h1>
          <p className="mt-1 text-[15px] font-medium text-slate-500">Aprende a leer paso a paso.</p>
        </div>
      </header>

      {accessibilityOpen && (
        <section className="mb-6 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]" aria-label="Ajustes de lectura">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-slate-900">Modo sencillo</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Deja visibles solo las ayudas esenciales.</p>
            </div>
            <button type="button" role="switch" aria-checked={simpleMode} onClick={() => setSimpleMode(value => !value)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${simpleMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${simpleMode ? 'translate-x-7' : 'translate-x-1'}`} />
              <span className="sr-only">{simpleMode ? 'Desactivar modo sencillo' : 'Activar modo sencillo'}</span>
            </button>
          </div>
        </section>
      )}

      <FlowPreview />

      <section className="mb-8" aria-labelledby="areas-hebreo-title">
        <div className="mb-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Tu camino</p>
          <h2 id="areas-hebreo-title" className="mt-0.5 text-xl font-black tracking-[-0.02em] text-slate-950">Elige qué quieres explorar</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Alef-bet es el contenido activo. Las demás áreas muestran su arquitectura para decidir el flujo antes de implementarlas.</p>
        </div>

        <div className="grid grid-cols-3 gap-x-2 gap-y-3">
          {SECTIONS.map(section => {
            const active = openSection === section.id
            return <LearningScrollButton key={section.id} section={section} active={active} onClick={() => setOpenSection(current => (current === section.id ? null : section.id))} />
          })}
        </div>

        {activeSection && <StagePanel section={activeSection} simpleMode={simpleMode} />}
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
            <p>El hebreo bíblico se lee de derecha a izquierda. Aquí aprenderás primero a reconocer lo que ves; después se incorporarán vocales, sílabas, palabras y reglas.</p>
          </div>
        </details>
      </section>

      <SupportMaterialSection />

      <footer className="border-t border-slate-200 pt-5 text-[10px] leading-relaxed text-slate-400">Fuente textual para los próximos pasos: STEP Bible / STEPBible-Data, CC BY 4.0.</footer>
    </main>
  )
}
