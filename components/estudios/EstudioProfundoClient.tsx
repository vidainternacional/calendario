'use client'

import Link from 'next/link'
import { mostrarToast } from '@/lib/ui/toast'
import { useActionState, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  BookOpenText,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Edit3,
  FileText,
  LayoutList,
  Loader2,
  PanelsTopLeft,
  RefreshCw,
  Save,
  Search,
  Share2,
} from 'lucide-react'
import {
  analizarPasaje,
  obtenerHistorial,
  obtenerNota,
  guardarNota,
  type EstudioResultado,
  type EstudioState,
} from '@/app/actions/estudio-interno'
import TextualEvidencePanel from '@/components/estudios/TextualEvidencePanel'
import ChronologyMapPanel from '@/components/estudios/ChronologyMapPanel'

const SECTIONS: { key: keyof EstudioResultado; label: string }[] = [
  { key: 'comparacion_versiones', label: 'Traducción en español' },
  { key: 'traduccion_interpretativa', label: 'Síntesis del pasaje' },
  { key: 'contexto_historico', label: 'Contexto histórico y judío' },
  { key: 'analisis_linguistico', label: 'Idioma y análisis lingüístico' },
  { key: 'que_quiso_comunicar', label: 'Qué quiso comunicar el texto' },
  { key: 'que_no_quiso_decir', label: 'Qué no quiso decir' },
  { key: 'explicacion', label: 'Explicación del pasaje' },
  { key: 'reflexion', label: 'Reflexión espiritual' },
]

const RELATION_LABELS = {
  direct: 'Mención directa',
  conceptual: 'Relación temática',
  cross_reference: 'Referencia relacionada',
  original_language: 'Idioma original',
} as const

type Tab = 'study' | 'concordance'
type StudyView = 'sections' | 'all'

type DashboardItem = {
  id: string
  label: string
  content: ReactNode
  plainText?: string
  defaultOpen?: boolean
}

function hasContent(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function AccordionItem({
  item,
  onCopy,
}: {
  item: DashboardItem
  onCopy: (key: string, text: string) => void
}) {
  return (
    <details open={item.defaultOpen} className="group border-b border-slate-100 last:border-b-0">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4 sm:px-7 [&::-webkit-details-marker]:hidden">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <BookOpenText className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-left text-[15px] font-bold text-slate-900">{item.label}</span>
        {item.plainText && (
          <button
            type="button"
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()
              onCopy(item.id, item.plainText || '')
            }}
            className="hidden min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700 sm:inline-flex"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar
          </button>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-5 sm:px-7">
        {item.content}
      </div>
    </details>
  )
}

export default function EstudioProfundoClient({
  initialPasaje = '',
  initialTab = 'study',
}: {
  initialPasaje?: string
  initialTab?: Tab
}) {
  const [state, formAction, isPending] = useActionState<EstudioState, FormData>(analizarPasaje, { status: 'idle' })
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [studyView, setStudyView] = useState<StudyView>('sections')
  const [historial, setHistorial] = useState<{ pasaje: string; created_at: string }[]>([])
  const [nota, setNota] = useState('')
  const [notaGuardando, setNotaGuardando] = useState(false)
  const [notaSuccess, setNotaSuccess] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const sectionsWithContent = useMemo(() => {
    if (state.status !== 'success' || state.kind !== 'study') return []
    return SECTIONS.filter(section => hasContent(state.resultado[section.key]))
  }, [state])

  const dashboardItems = useMemo<DashboardItem[]>(() => {
    if (state.status !== 'success' || state.kind !== 'study') return []

    const items: DashboardItem[] = []
    const isSingleVerse = /:\d+\b/.test(state.pasaje)

    const spanish = sectionsWithContent.find(section => section.key === 'comparacion_versiones')
    if (spanish) {
      const content = String(state.resultado[spanish.key] || '').trim()
      items.push({
        id: String(spanish.key),
        label: spanish.label,
        plainText: content,
        defaultOpen: isSingleVerse,
        content: <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{content}</div>,
      })
    }

    if (state.textualEvidence) {
      items.push({
        id: 'evidencia-textual',
        label: 'Texto original y análisis palabra por palabra',
        defaultOpen: isSingleVerse,
        content: <div className="-mx-5 -my-5 sm:-mx-7"><TextualEvidencePanel evidence={state.textualEvidence} /></div>,
      })
    }

    const contextualSections = sectionsWithContent.filter(section => section.key !== 'comparacion_versiones')
    contextualSections.forEach(section => {
      const content = String(state.resultado[section.key] || '').trim()
      items.push({
        id: String(section.key),
        label: section.label,
        plainText: content,
        content: <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{content}</div>,
      })
    })

    if (state.chronology) {
      items.push({
        id: 'cronologia-mapa',
        label: 'Cronología y mapa',
        content: <div className="-mx-5 -my-5 sm:-mx-7"><ChronologyMapPanel bundle={state.chronology} /></div>,
      })
    }

    return items
  }, [sectionsWithContent, state])

  useEffect(() => {
    obtenerHistorial().then(setHistorial).catch(() => setHistorial([]))
  }, [])

  useEffect(() => {
    if (state.status !== 'success') return
    setActiveTab(state.kind)
    setStudyView('sections')

    if (state.kind === 'study') {
      obtenerHistorial().then(setHistorial).catch(() => {})
      obtenerNota(state.pasaje).then(value => setNota(value || '')).catch(() => setNota(''))
    }
  }, [state])

  const avisar = (texto: string) => {
    setMensaje(texto)
    setTimeout(() => setMensaje(null), 2600)
  }

  const handleSaveNota = async () => {
    if (state.status !== 'success' || state.kind !== 'study') return
    setNotaGuardando(true)
    setNotaSuccess(false)
    const response = await guardarNota(state.pasaje, nota)
    setNotaGuardando(false)

    if (response.success) {
      setNotaSuccess(true)
      setTimeout(() => setNotaSuccess(false), 3000)
    } else {
      mostrarToast(response.error)
    }
  }

  const loadQuery = (query: string) => {
    const form = document.getElementById('estudio-form') as HTMLFormElement | null
    const input = form?.elements.namedItem('pasaje') as HTMLInputElement | null
    if (!form || !input) return
    input.value = query
    form.requestSubmit()
  }

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiado(key)
      setTimeout(() => setCopiado(null), 1800)
    } catch {
      avisar('No se pudo copiar el contenido')
    }
  }

  const buildFullStudy = () => {
    if (state.status !== 'success' || state.kind !== 'study') return ''
    return [
      `Estudio Profundo: ${state.pasaje}`,
      '',
      ...dashboardItems.flatMap(item => item.plainText ? [item.label, item.plainText, ''] : []),
      nota.trim() ? `Mis notas\n${nota.trim()}` : '',
      'Vida Internacional',
    ].filter(Boolean).join('\n')
  }

  const shareStudy = async () => {
    if (state.status !== 'success' || state.kind !== 'study') return
    const text = buildFullStudy()

    try {
      if (navigator.share) await navigator.share({ title: `Estudio de ${state.pasaje}`, text })
      else {
        await navigator.clipboard.writeText(text)
        avisar('Estudio copiado para compartir')
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') avisar('No se pudo compartir el estudio')
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <nav className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1" aria-label="Herramientas de Estudio Profundo">
        <button type="button" onClick={() => setActiveTab('study')} className={`min-h-11 rounded-xl px-3 text-sm font-bold transition ${activeTab === 'study' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          Estudio
        </button>
        <button type="button" onClick={() => setActiveTab('concordance')} className={`min-h-11 rounded-xl px-3 text-sm font-bold transition ${activeTab === 'concordance' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          Concordancias
        </button>
      </nav>

      <form id="estudio-form" action={formAction} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <label htmlFor="pasaje" className="block text-sm font-bold text-slate-900">Escriba un versículo, una palabra o una pregunta</label>
        <p className="mt-1 text-xs leading-5 text-slate-500">La aplicación muestra únicamente información interna disponible y fuentes aprobadas.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="text" id="pasaje" name="pasaje" required disabled={isPending} placeholder="Ejemplo: Juan 3:16, Daniel 2 o perdón" className="min-h-13 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/20 disabled:opacity-50" defaultValue={initialPasaje} />
          </div>
          <button type="submit" disabled={isPending} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#C0392B] px-7 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#a93226] disabled:cursor-not-allowed disabled:opacity-70">
            {isPending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Buscando…</> : <><Search className="h-4 w-4" /> Buscar</>}
          </button>
        </div>
        {state.status === 'error' && <p className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{state.error}</p>}
      </form>

      {isPending && (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm" aria-live="polite">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#C0392B]" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Preparando el estudio</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Reuniendo únicamente las capas verificadas disponibles para esta referencia.</p>
        </section>
      )}

      {!isPending && state.status === 'success' && state.kind === 'study' && activeTab === 'study' && (
        <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <header className="bg-gradient-to-b from-white to-slate-50/70 px-5 pb-5 pt-6 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0392B]">Estudio bíblico</p>
            <h2 className="mt-1 break-words text-3xl font-bold tracking-tight text-slate-950">{state.pasaje}</h2>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button type="button" onClick={() => setStudyView('sections')} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${studyView === 'sections' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><PanelsTopLeft className="h-3.5 w-3.5" /> Secciones</button>
                <button type="button" onClick={() => setStudyView('all')} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${studyView === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><LayoutList className="h-3.5 w-3.5" /> Ver todo</button>
              </div>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={shareStudy} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"><Share2 className="h-3.5 w-3.5" /> Compartir</button>
                <button type="button" onClick={() => window.print()} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"><Download className="h-3.5 w-3.5" /> PDF</button>
              </div>
            </div>
          </header>

          {dashboardItems.length > 0 && (
            studyView === 'sections' ? (
              <div className="border-t border-slate-100">
                {dashboardItems.map(item => <AccordionItem key={item.id} item={item} onCopy={copyText} />)}
              </div>
            ) : (
              <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
                {dashboardItems.map(item => (
                  <section key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                      <h3 className="text-sm font-bold text-slate-900">{item.label}</h3>
                      {item.plainText && <button type="button" onClick={() => copyText(item.id, item.plainText || '')} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-400 hover:bg-slate-50"><Copy className="h-3.5 w-3.5" /> {copiado === item.id ? 'Copiado' : 'Copiar'}</button>}
                    </div>
                    <div className="p-4 sm:p-5">{item.content}</div>
                  </section>
                ))}
              </div>
            )
          )}

          <details className="border-t border-slate-100 bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-700 sm:px-7 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><Edit3 className="h-4 w-4 text-[#C0392B]" /> Mis notas personales</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="border-t border-slate-100 px-5 py-5 sm:px-7">
              <textarea value={nota} onChange={event => setNota(event.target.value)} placeholder="Escriba reflexiones, preguntas o apuntes personales…" className="min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-base leading-7 text-slate-700 outline-none focus:ring-2 focus:ring-[#C0392B]/30" />
              <div className="mt-3 flex items-center justify-end gap-3">
                {notaSuccess && <span className="text-xs font-semibold text-emerald-600">Nota guardada</span>}
                <button type="button" onClick={handleSaveNota} disabled={notaGuardando} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white disabled:opacity-50">{notaGuardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{notaGuardando ? 'Guardando…' : 'Guardar nota'}</button>
              </div>
            </div>
          </details>
        </article>
      )}

      {!isPending && state.status === 'success' && state.kind === 'concordance' && activeTab === 'concordance' && (
        <section className="space-y-4" aria-label="Resultados de concordancias">
          <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Concordancias internas</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Resultados para “{state.query}”</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Temas y pasajes ordenados según coincidencias revisadas en la biblioteca.</p>
          </header>

          {state.results.map(result => (
            <article key={result.termId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h3 className="text-lg font-bold text-slate-950">{result.term}</h3>
                {result.description && <p className="mt-1 text-sm leading-6 text-slate-500">{result.description}</p>}
              </header>
              <div className="divide-y divide-slate-100">
                {result.matches.map(match => (
                  <Link key={`${result.termId}-${match.bookCode}-${match.chapter}-${match.verse}-${match.relationKind}`} href={`/biblia?book=${encodeURIComponent(match.bookCode)}&chapter=${match.chapter}&verse=${match.verse}`} className="block px-5 py-4 hover:bg-slate-50 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900">{match.reference}</h4>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{RELATION_LABELS[match.relationKind]}</span>
                    </div>
                    {match.excerpt && <p className="mt-2 text-sm leading-6 text-slate-600">{match.excerpt}</p>}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {state.status === 'success' && state.kind !== activeTab && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm leading-6 text-slate-500">La última búsqueda produjo un resultado de {state.kind === 'study' ? 'Estudio' : 'Concordancias'}.</p>
          <button type="button" onClick={() => setActiveTab(state.kind)} className="mt-3 min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white">Ver resultado</button>
        </section>
      )}

      {historial.length > 0 && state.status === 'idle' && !isPending && activeTab === 'study' && (
        <details className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Estudios recientes</span>
            <span className="text-xs font-semibold text-slate-400">{historial.length}</span>
          </summary>
          <div className="grid gap-2 border-t border-slate-100 p-4 sm:grid-cols-2">
            {historial.map((item, index) => (
              <button key={`${item.pasaje}-${index}`} type="button" onClick={() => loadQuery(item.pasaje)} className="flex min-h-14 items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-50">
                <FileText className="h-4 w-4 shrink-0 text-[#C0392B]" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-slate-800">{item.pasaje}</span>
                  <span className="mt-1 block text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
              </button>
            ))}
          </div>
        </details>
      )}

      {mensaje && <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 right-4 z-[90] mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-xl" role="status">{mensaje}</div>}
    </div>
  )
}
