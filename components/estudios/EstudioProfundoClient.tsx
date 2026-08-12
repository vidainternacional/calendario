'use client'

import Link from 'next/link'
import { useActionState, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Edit3,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Share2,
} from 'lucide-react'
import { mostrarToast } from '@/lib/ui/toast'
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

const SECTIONS: { key: keyof EstudioResultado; label: string; shortLabel: string }[] = [
  { key: 'comparacion_versiones', label: 'Traducción en español', shortLabel: 'Español' },
  { key: 'traduccion_interpretativa', label: 'Síntesis del pasaje', shortLabel: 'Síntesis' },
  { key: 'contexto_historico', label: 'Contexto histórico y judío', shortLabel: 'Contexto' },
  { key: 'analisis_linguistico', label: 'Idioma y análisis lingüístico', shortLabel: 'Lingüística' },
  { key: 'que_quiso_comunicar', label: 'Qué quiso comunicar el texto', shortLabel: 'Mensaje' },
  { key: 'que_no_quiso_decir', label: 'Qué no quiso decir', shortLabel: 'Cautelas' },
  { key: 'explicacion', label: 'Explicación del pasaje', shortLabel: 'Explicación' },
  { key: 'reflexion', label: 'Reflexión espiritual', shortLabel: 'Reflexión' },
]

const RELATION_LABELS = {
  direct: 'Mención directa',
  conceptual: 'Relación temática',
  cross_reference: 'Referencia relacionada',
  original_language: 'Idioma original',
} as const

type Tab = 'study' | 'concordance'
type DashboardItem = {
  id: string
  label: string
  shortLabel: string
  content: ReactNode
  plainText?: string
}

function hasContent(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
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
  const [activeSection, setActiveSection] = useState<string | null>(null)
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

    const spanish = sectionsWithContent.find(section => section.key === 'comparacion_versiones')
    if (spanish) {
      const content = String(state.resultado[spanish.key] || '').trim()
      items.push({
        id: String(spanish.key),
        label: spanish.label,
        shortLabel: spanish.shortLabel,
        plainText: content,
        content: <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{content}</div>,
      })
    }

    if (state.textualEvidence) {
      items.push({
        id: 'evidencia-textual',
        label: 'Texto original y análisis palabra por palabra',
        shortLabel: 'Original',
        content: <div className="-mx-4 -my-4 sm:-mx-5 sm:-my-5"><TextualEvidencePanel evidence={state.textualEvidence} /></div>,
      })
    }

    sectionsWithContent
      .filter(section => section.key !== 'comparacion_versiones')
      .forEach(section => {
        const content = String(state.resultado[section.key] || '').trim()
        items.push({
          id: String(section.key),
          label: section.label,
          shortLabel: section.shortLabel,
          plainText: content,
          content: <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{content}</div>,
        })
      })

    if (state.chronology) {
      items.push({
        id: 'cronologia-mapa',
        label: 'Cronología y mapa',
        shortLabel: 'Mapa',
        content: <div className="-mx-4 -my-4 sm:-mx-5 sm:-my-5"><ChronologyMapPanel bundle={state.chronology} /></div>,
      })
    }

    return items
  }, [sectionsWithContent, state])

  const activeItem = useMemo(
    () => dashboardItems.find(item => item.id === activeSection) ?? null,
    [activeSection, dashboardItems]
  )

  useEffect(() => {
    obtenerHistorial().then(setHistorial).catch(() => setHistorial([]))
  }, [])

  useEffect(() => {
    if (state.status !== 'success') return
    setActiveTab(state.kind)
    if (state.kind === 'study') {
      setActiveSection(null)
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

  const toggleSection = (id: string) => {
    setActiveSection(current => current === id ? null : id)
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <nav className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1" aria-label="Herramientas de Estudio Profundo">
        <button type="button" onClick={() => setActiveTab('study')} className={`min-h-11 rounded-xl px-3 text-sm font-bold transition ${activeTab === 'study' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>Estudio</button>
        <button type="button" onClick={() => setActiveTab('concordance')} className={`min-h-11 rounded-xl px-3 text-sm font-bold transition ${activeTab === 'concordance' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>Concordancias</button>
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
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C0392B]">Estudio bíblico</p>
              <h2 className="mt-0.5 break-words text-2xl font-bold tracking-tight text-slate-950">{state.pasaje}</h2>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button type="button" onClick={shareStudy} aria-label="Compartir estudio" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"><Share2 className="h-4 w-4" /></button>
              <button type="button" onClick={() => window.print()} aria-label="Exportar PDF" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"><Download className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-1">
            {dashboardItems.map(item => {
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSection(item.id)}
                  aria-expanded={active}
                  className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3.5 text-[11px] font-bold transition sm:min-h-10 sm:px-4 sm:text-xs ${active ? 'border-[#C0392B] bg-[#C0392B] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}
                >
                  {item.shortLabel}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${active ? 'rotate-180' : ''}`} />
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => toggleSection('notas')}
              aria-expanded={activeSection === 'notas'}
              className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3.5 text-[11px] font-bold transition sm:min-h-10 sm:px-4 sm:text-xs ${activeSection === 'notas' ? 'border-[#C0392B] bg-[#C0392B] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}
            >
              Notas
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeSection === 'notas' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {activeItem && (
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                <h3 className="min-w-0 flex-1 text-sm font-bold text-slate-900">{activeItem.label}</h3>
                {activeItem.plainText && (
                  <button type="button" onClick={() => copyText(activeItem.id, activeItem.plainText || '')} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
                    {copiado === activeItem.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiado === activeItem.id ? 'Copiado' : 'Copiar'}
                  </button>
                )}
              </header>
              <div className="p-4 sm:p-5">{activeItem.content}</div>
            </article>
          )}

          {activeSection === 'notas' && (
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <header className="flex min-h-14 items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
                <Edit3 className="h-4 w-4 text-[#C0392B]" />
                <h3 className="text-sm font-bold text-slate-900">Mis notas personales</h3>
              </header>
              <div className="p-4 sm:p-5">
                <textarea value={nota} onChange={event => setNota(event.target.value)} placeholder="Escriba reflexiones, preguntas o apuntes personales…" className="min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-base leading-7 text-slate-700 outline-none focus:ring-2 focus:ring-[#C0392B]/30" />
                <div className="mt-3 flex items-center justify-end gap-3">
                  {notaSuccess && <span className="text-xs font-semibold text-emerald-600">Nota guardada</span>}
                  <button type="button" onClick={handleSaveNota} disabled={notaGuardando} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-bold text-white disabled:opacity-50">
                    {notaGuardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {notaGuardando ? 'Guardando…' : 'Guardar nota'}
                  </button>
                </div>
              </div>
            </article>
          )}
        </section>
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
