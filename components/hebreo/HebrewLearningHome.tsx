'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpenText, ChevronDown, ExternalLink, History, PlayCircle } from 'lucide-react'
import AlefBetExplorer from '@/components/hebreo/AlefBetExplorer'
import NiqqudExplorer from '@/components/hebreo/NiqqudExplorer'
import ReadingWordsExplorer from '@/components/hebreo/ReadingWordsExplorer'
import { HEBREW_SUPPORT_COURSE } from '@/lib/hebreo/material-apoyo'

type TopMenuId = 'learn' | 'materials' | 'test' | 'bible'
type SectionId = 'alef-bet' | 'vowels' | 'reading' | 'vocabulary' | 'grammar' | 'review'

type LearningSection = {
  id: SectionId
  he: string
  short: string
  description: string
  example?: string
  focus?: string
  practice?: string
  available: boolean
}

const SECTIONS: readonly LearningSection[] = [
  { id: 'alef-bet', he: 'אָלֶף־בֵּית', short: 'Alef-Bet', description: 'Reconoce las 22 letras, sus nombres, sonidos, formas finales y diferencias visuales.', available: true },
  { id: 'vowels', he: 'תְּנוּעוֹת', short: 'Vocales', description: 'Comprende los signos vocálicos y cómo cambian la lectura de una consonante.', example: 'ב + ַ = בַ', focus: 'Identificar el signo, asociarlo con su sonido y combinarlo con una consonante.', practice: 'Una vocal por vez, luego pequeñas combinaciones antes de pasar a palabras.', available: true },
  { id: 'reading', he: 'קְרִיאָה', short: 'Lectura', description: 'Combina letras y vocales hasta poder leer sílabas, palabras y frases breves.', example: 'מֶלֶךְ', focus: 'Leer primero con ayudas y reducirlas gradualmente hasta reconocer la palabra por sí sola.', practice: 'Sílabas cortas → palabras frecuentes → fragmentos bíblicos breves.', available: true },
  { id: 'vocabulary', he: 'מִלִּים', short: 'Palabras', description: 'Construye vocabulario bíblico de forma progresiva y dentro de contexto.', example: 'מֶלֶךְ · rey', focus: 'Reconocer forma, lectura y significado sin convertir la transliteración en una muleta permanente.', practice: 'Palabras frecuentes, repaso contextual y reconocimiento dentro de versículos reales.', available: false },
  { id: 'grammar', he: 'דִּקְדּוּק', short: 'Reglas', description: 'Comprende patrones esenciales por capas, sin comenzar con tablas extensas.', example: 'הַ  ·  מ־ל־ך', focus: 'Ver una regla, observarla en un ejemplo y solo después ampliar los detalles técnicos.', practice: 'Una regla breve por sesión, seguida de reconocimiento dentro de palabras reales.', available: false },
  { id: 'review', he: 'חֲזָרָה', short: 'Repaso', description: 'Vuelve a lo que necesita refuerzo mediante sesiones breves y enfocadas.', example: 'ב  ·  כ  ·  פ', focus: 'Priorizar lo que el estudiante confunde, olvida o tarda demasiado en reconocer.', practice: 'Sesiones cortas de 5–10 elementos combinando reconocimiento, lectura y significado.', available: false },
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

const MENU_LABELS: Record<TopMenuId, { he: string; es: string }> = {
  learn: { he: 'לִמּוּד', es: 'Aprender' },
  materials: { he: 'חֹמֶר לִמּוּד', es: 'Materiales y curso' },
  test: { he: 'בְּחַן אֶת הַתַּהֲלִיךְ', es: 'Prueba tu progreso' },
  bible: { he: 'תַּנַ״ךְ בְּעִבְרִית', es: 'Biblia en hebreo' },
}

function MenuButton({ id, open, onClick }: { id: TopMenuId; open: boolean; onClick: () => void }) {
  const label = MENU_LABELS[id]
  return (
    <button type="button" onClick={onClick} aria-expanded={open} className={`flex min-h-[74px] w-full flex-col items-center justify-center rounded-[22px] border px-3 py-2.5 text-center transition-all active:scale-[0.98] motion-reduce:transition-none ${open ? 'border-indigo-600 bg-indigo-600 text-white shadow-[0_8px_24px_rgba(79,70,229,0.18)]' : 'border-slate-200 bg-white text-slate-900 shadow-[0_4px_16px_rgba(15,23,42,0.04)]'}`}>
      <span lang="he" dir="rtl" className={`text-[1.05rem] font-black leading-tight ${open ? 'text-white' : 'text-indigo-700'}`}>{label.he}</span>
      <span className="mt-1 text-[12px] font-black leading-tight">{label.es}</span>
      <ChevronDown className={`mt-1 h-3.5 w-3.5 transition-transform ${open ? 'rotate-180 text-indigo-100' : 'text-slate-400'}`} aria-hidden="true" />
    </button>
  )
}

function LearningAreaButton({ section, active, onClick }: { section: LearningSection; active: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-expanded={active} aria-controls={`hebrew-panel-${section.id}`} onClick={onClick} className={`flex min-h-[66px] flex-col items-center justify-center rounded-[20px] border px-2.5 py-2 text-center transition-all active:scale-[0.98] motion-reduce:transition-none ${active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
      <span lang="he" dir="rtl" className={`text-[1.08rem] font-black leading-none ${active ? 'text-white' : 'text-indigo-700'}`}>{section.he}</span>
      <span className="mt-1 text-[12px] font-black leading-tight">{section.short}</span>
      <ChevronDown className={`mt-1 h-3 w-3 transition-transform ${active ? 'rotate-180 text-indigo-100' : 'text-slate-400'}`} aria-hidden="true" />
    </button>
  )
}

function ScrollableDisclosure({ he, es, children }: { he: string; es: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full flex-col items-center justify-center px-3 py-2 text-center">
        <span lang="he" dir="rtl" className="text-[12px] font-black leading-tight text-indigo-700">{he}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-sm font-black text-slate-900">{es}<ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" /></span>
      </button>
      {open && (
        <section className="border-t border-slate-100 p-4">
          <div className="max-h-72 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">{children}</div>
        </section>
      )}
    </div>
  )
}

function ArchitecturePreview({ section }: { section: LearningSection }) {
  return (
    <div className="border-t border-slate-200 text-center">
      <ScrollableDisclosure he="מַה נִלְמַד" es="Qué aprenderás">
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">{section.description}</p>
      </ScrollableDisclosure>
      <ScrollableDisclosure he="דֻּגְמָה" es="Ejemplo">
        <p lang="he" dir="rtl" className="my-4 text-[3.2rem] font-black leading-tight text-slate-950">{section.example}</p>
      </ScrollableDisclosure>
      <ScrollableDisclosure he="בַּמֶּה לְהִתְמַקֵּד" es="En qué enfocarte">
        <p className="mx-auto max-w-xl text-[13px] leading-relaxed text-slate-600">{section.focus}</p>
      </ScrollableDisclosure>
      <ScrollableDisclosure he="אֵיךְ לְתַרְגֵּל" es="Cómo practicar">
        <p className="mx-auto max-w-xl text-[13px] leading-relaxed text-slate-600">{section.practice}</p>
      </ScrollableDisclosure>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Vista previa de una etapa posterior. Aún no guarda actividad ni desbloquea contenido.</p>
    </div>
  )
}

function LearnPanel() {
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  const activeSection = SECTIONS.find(section => section.id === openSection)
  return (
    <section className="text-center" aria-labelledby="areas-hebreo-title">
      <div className="mb-3">
        <h2 id="areas-hebreo-title" className="text-lg font-black">Aprender paso a paso</h2>
        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">Elige un tema. Solo se abre lo que vas a estudiar.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SECTIONS.map(section => <LearningAreaButton key={section.id} section={section} active={openSection === section.id} onClick={() => setOpenSection(current => current === section.id ? null : section.id)} />)}
      </div>
      {activeSection && (
        <div id={`hebrew-panel-${activeSection.id}`} className="mt-4 border-t border-slate-200 pt-4">
          {activeSection.id === 'alef-bet'
            ? <AlefBetExplorer simpleMode={false} />
            : activeSection.id === 'vowels'
              ? <NiqqudExplorer />
              : activeSection.id === 'reading'
                ? <ReadingWordsExplorer />
                : <ArchitecturePreview section={activeSection} />}
        </div>
      )}
    </section>
  )
}

function ProcessTestPreview() {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  const current = TEST_QUESTIONS[step]

  if (finished) {
    return (
      <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5 text-center shadow-[0_16px_40px_rgba(15,23,42,0.09)]" aria-labelledby="resultado-prueba-title">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">Ficha de resultado · ejemplo</p>
        <h3 id="resultado-prueba-title" className="mt-1 text-2xl font-black text-slate-950">Tu maestro recomienda reforzar antes de avanzar</h3>
        <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
          <div className="py-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Lo que ya reconoces</p><p className="mt-1 text-sm font-bold text-slate-800">La evaluación combinará tus aciertos de reconocimiento, distinción, lectura y comprensión.</p></div>
          <div className="py-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Conviene reforzar</p><p className="mt-1 text-sm font-bold text-slate-800">Aquí aparecerán únicamente las áreas donde tus respuestas reales muestren dificultad.</p></div>
        </div>
        <div className="mt-5 rounded-[20px] bg-indigo-50 p-4"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-indigo-700">Consejo de estudio</p><p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">La recomendación se redactará a partir del resultado completo, como una orientación breve de un maestro: qué mantener, qué repasar y cuál debería ser tu siguiente práctica.</p></div>
        <div className="mt-5 flex justify-center gap-3 border-t border-slate-200 pt-4 text-[12px] leading-relaxed text-slate-500"><History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>Cuando exista persistencia autorizada, cada ficha quedará en Historial para comparar pruebas anteriores.</p></div>
        <button type="button" onClick={() => { setStep(0); setFinished(false) }} className="mt-5 min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white">Volver a probar</button>
      </section>
    )
  }

  return (
    <section className="mt-4 rounded-[26px] border border-slate-200 bg-white p-5 text-center" aria-labelledby="prueba-title">
      <div className="flex items-center justify-between gap-3"><p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Pregunta {step + 1} de {TEST_QUESTIONS.length}</p><p className="text-[11px] font-black text-indigo-700">{current.type}</p></div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-[width] motion-reduce:transition-none" style={{ width: `${((step + 1) / TEST_QUESTIONS.length) * 100}%` }} /></div>
      <h3 id="prueba-title" className="mt-7 text-xl font-black leading-snug text-slate-950">{current.prompt}</h3>
      {'hebrew' in current && <p lang="he" dir="rtl" className="my-8 text-[5rem] font-black leading-none text-slate-950">{current.hebrew}</p>}
      <div className="mt-6 grid gap-3">
        {current.options.map((option, index) => (
          <button key={`${option}-${index}`} type="button" onClick={() => step < TEST_QUESTIONS.length - 1 ? setStep(value => value + 1) : setFinished(true)} className={`min-h-14 rounded-[18px] border border-slate-200 bg-white px-5 font-black text-slate-800 active:bg-slate-50 ${['Reconocer', 'Distinguir', 'Sofit', 'Dagesh'].includes(current.type) ? 'text-[2rem]' : 'text-base'}`}>{option}</button>
        ))}
      </div>
      <p className="mt-5 text-[11px] leading-relaxed text-slate-400">Este prototipo tiene 15 preguntas para validar el recorrido. Todavía no califica ni guarda respuestas.</p>
    </section>
  )
}

function SupportMaterialSection() {
  const groups = [
    { title: 'Fundamentos', range: [1, 5] },
    { title: 'Vocales y lectura', range: [6, 8] },
    { title: 'Lectura bíblica y reglas', range: [9, 11] },
  ] as const

  return (
    <div className="text-center">
      <p className="text-[12px] leading-relaxed text-slate-500">Curso externo recomendado como complemento. Los 11 enlaces permanecen pendientes de corroboración visual.</p>
      <div className="mt-3 space-y-2">
        {groups.map(group => (
          <details key={group.title} className="rounded-[18px] border border-slate-200 bg-white">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 px-4 text-sm font-black text-slate-900">{group.title} · Clases {group.range[0]}–{group.range[1]} <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" /></summary>
            <div className="max-h-72 space-y-3 overflow-y-auto border-t border-slate-100 p-3 [-webkit-overflow-scrolling:touch]">
              {HEBREW_SUPPORT_COURSE.filter(item => item.orden >= group.range[0] && item.orden <= group.range[1]).map(item => (
                <article key={item.orden} className="overflow-hidden rounded-[16px] border border-slate-200 bg-white text-left">
                  <div className="flex gap-3 p-3">
                    <div className="relative h-[68px] w-[106px] shrink-0 overflow-hidden rounded-[11px] bg-slate-100"><img src={item.miniatura} alt={`Miniatura del enlace de la clase ${item.orden}`} className="h-full w-full object-cover" loading="lazy" /><span className="absolute inset-0 grid place-items-center bg-slate-950/10"><PlayCircle className="h-7 w-7 text-white" aria-hidden="true" /></span></div>
                    <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-amber-700">Clase {item.orden} · Pendiente</p><h3 className="mt-1 text-[13px] font-black leading-snug text-slate-900">{item.titulo}</h3><p className="mt-1 text-[11px] text-slate-500">{item.tema}</p></div>
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between border-t border-slate-100 px-4 text-[12px] font-black text-indigo-700">Abrir video <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
                </article>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function BibleHebrewPreview() {
  return (
    <section className="text-center">
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-indigo-700">Modelo del lector guiado</p>
        <h2 className="mt-1 text-lg font-black text-slate-950">Génesis 1:1</h2>
        <p lang="he" dir="rtl" className="mt-5 text-[2.25rem] font-black leading-[1.65] text-slate-950">בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ</p>
        <div className="mt-4 border-t border-slate-200">
          <ScrollableDisclosure he="עֶזְרֵי קְרִיאָה" es="Ayudas de lectura"><p className="text-[12px] leading-relaxed text-slate-600">Aquí podrán activarse transliteración y ayudas de pronunciación cuando exista una metodología aprobada. No sustituirán aprender a leer el hebreo.</p></ScrollableDisclosure>
          <ScrollableDisclosure he="מִלָּה בְּמִלָּה" es="Palabra por palabra"><p className="text-[12px] leading-relaxed text-slate-600">Reutilizará las ocurrencias, lemas, morfología y glosas ya versionadas en el motor bíblico existente.</p></ScrollableDisclosure>
          <ScrollableDisclosure he="הַשְׁוָאָה בִּסְפָרַדִּית" es="Comparar en español"><p className="text-[12px] leading-relaxed text-slate-600">La comparación española utilizará RV1909 cuando corresponda; no se fabricará una traducción literal del Antiguo Testamento.</p></ScrollableDisclosure>
        </div>
        <div className="mt-4 flex items-start justify-center gap-3 rounded-[18px] bg-white p-4 text-[11px] leading-relaxed text-slate-500"><BookOpenText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" aria-hidden="true" /><p>Esta vista define la experiencia. Durante FASE H no crea otro motor bíblico ni nuevas tablas.</p></div>
      </div>
    </section>
  )
}

export default function HebrewLearningHome() {
  const [openMenu, setOpenMenu] = useState<TopMenuId | null>(null)

  return (
    <main className="min-h-screen bg-[#f9f9fb] text-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6">
        <header className="mb-4">
          <Link href="/estudios" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-black text-slate-600"><ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" /> Estudios</Link>
          <div className="mt-3 text-center"><p lang="he" dir="rtl" className="text-[2.6rem] font-black leading-none text-indigo-700">עברית מקראית</p><h1 className="mt-1.5 text-[1.75rem] font-black tracking-[-0.035em]">Hebreo Bíblico</h1><p className="mt-0.5 text-[13px] font-semibold text-slate-500">Aprende a leer paso a paso.</p></div>
        </header>

        <section className="grid grid-cols-2 gap-2.5" aria-label="Navegación principal de Hebreo Bíblico">
          {(['learn', 'materials', 'test', 'bible'] as const).map(id => <MenuButton key={id} id={id} open={openMenu === id} onClick={() => setOpenMenu(current => current === id ? null : id)} />)}
        </section>

        {openMenu && (
          <section className="mt-5 border-t border-slate-200 pt-4">
            {openMenu === 'learn' && <LearnPanel />}
            {openMenu === 'materials' && <SupportMaterialSection />}
            {openMenu === 'test' && (
              <div className="text-center">
                <h2 className="text-lg font-black">Comprueba lo aprendido</h2>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">15 preguntas variadas ofrecen una base más amplia para evaluar tu proceso.</p>
                <ProcessTestPreview />
                <details className="mt-4 border-y border-slate-200 py-1"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 text-sm font-black text-slate-700">Historial de progreso <History className="h-4 w-4 text-slate-400" aria-hidden="true" /></summary><p className="pb-4 text-[12px] leading-relaxed text-slate-500">Aquí se consultarán tus fichas anteriores para comparar resultados y recomendaciones. Aún no existe persistencia de progreso en FASE H.</p></details>
              </div>
            )}
            {openMenu === 'bible' && <BibleHebrewPreview />}
          </section>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-4"><p className="text-center text-[10px] leading-relaxed text-slate-400">FASE H · Aprendizaje en desarrollo. Sin audio, progreso persistente ni desbloqueos automáticos.</p></footer>
      </div>
    </main>
  )
}
