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
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
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
import TextualEvidenceSection, {
  hasTextualEvidenceSection,
  type TextualEvidenceSectionKind,
} from '@/components/estudios/TextualEvidenceSection'
import ChronologyMapPanel from '@/components/estudios/ChronologyMapPanel'

const SECTIONS: { key: keyof EstudioResultado; label: string; shortLabel: string }[] = [
  { key: 'comparacion_versiones', label: 'Traducción en español', shortLabel: 'Español' },
  { key: 'contexto_historico', label: 'Contexto histórico y judío', shortLabel: 'Contexto' },
  { key: 'analisis_linguistico', label: 'Idioma y análisis lingüístico', shortLabel: 'Lingüística' },
  { key: 'que_quiso_comunicar', label: 'Qué quiso comunicar el texto', shortLabel: 'Mensaje' },
  { key: 'que_no_quiso_decir', label: 'Qué no quiso decir', shortLabel: 'Cautelas' },
  { key: 'explicacion', label: 'Explicación del pasaje', shortLabel: 'Explicación' },
  { key: 'reflexion', label: 'Reflexión espiritual', shortLabel: 'Reflexión' },
]

const TEXTUAL_SECTIONS: Array<{
  kind: TextualEvidenceSectionKind
  id: string
  label: string
  shortLabel: string
}> = [
  { kind: 'original', id: 'texto-original', label: 'Texto original', shortLabel: 'Original' },
  { kind: 'transliteration', id: 'transliteracion', label: 'Transliteración', shortLabel: 'Translit.' },
  { kind: 'literal', id: 'secuencia-literal', label: 'Secuencia literal de estudio', shortLabel: 'Literal' },
  { kind: 'words', id: 'palabra-por-palabra', label: 'Análisis palabra por palabra', shortLabel: 'Palabras' },
  { kind: 'variants', id: 'variantes-textuales', label: 'Variantes textuales', shortLabel: 'Variantes' },
]

const RELATION_LABELS = {
  direct: 'Mención directa',
  conceptual: 'Relación temática',
  cross_reference: 'Referencia relacionada',
  original_language: 'Idioma original',
} as const

const PLACE_KIND_LABELS: Record<string, string> = {
  island: 'Isla',
  city: 'Ciudad',
  town: 'Población',
  village: 'Aldea',
  mountain: 'Monte',
  river: 'Río',
  sea: 'Mar',
  lake: 'Lago',
  region: 'Región',
  country: 'Región histórica',
}

const PLACE_PRECISION_LABELS: Record<string, string> = {
  exact: 'Exacta',
  approximate: 'Aproximada',
  regional: 'Regional',
  unknown: 'Sin precisión editorial',
}

const PLACE_CERTAINTY_LABELS: Record<string, string> = {
  high: 'Certeza alta',
  medium: 'Certeza media',
  low: 'Certeza baja',
  disputed: 'Identificación debatida',
}

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

function normalizeLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textualPlainText(
  evidence: NonNullable<Extract<EstudioState, { status: 'success'; kind: 'study' }>['textualEvidence']>,
  kind: TextualEvidenceSectionKind
) {
  if (kind === 'words' || kind === 'variants') return undefined

  const lines = evidence.editions.flatMap(edition => {
    const value = kind === 'original'
      ? edition.originalText
      : kind === 'transliteration'
        ? edition.transliteration
        : edition.literalTranslationEs
    if (!value?.trim()) return []
    return [value.trim()]
  })

  return lines.length > 0 ? lines.join('\n\n') : undefined
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
  const [estudioGuardando, setEstudioGuardando] = useState(false)
  const [estudioGuardado, setEstudioGuardado] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const isStudyResult = state.status === 'success' && state.kind === 'study'
  const isConcordanceResult = state.status === 'success' && state.kind === 'concordance'

  const sectionsWithContent = useMemo(() => {
    if (!isStudyResult) return []
    return SECTIONS.filter(section => hasContent(state.resultado[section.key]))
  }, [isStudyResult, state])

  const dashboardItems = useMemo<DashboardItem[]>(() => {
    if (!isStudyResult) return []
    const items: DashboardItem[] = []

    if (state.textualEvidence) {
      for (const textualSection of TEXTUAL_SECTIONS) {
        if (!hasTextualEvidenceSection(state.textualEvidence, textualSection.kind)) continue
        items.push({
          id: textualSection.id,
          label: textualSection.label,
          shortLabel: textualSection.shortLabel,
          plainText: textualPlainText(state.textualEvidence, textualSection.kind),
          content: <TextualEvidenceSection evidence={state.textualEvidence} section={textualSection.kind} />,
        })
      }
    }

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

    const orderedKeys: Array<keyof EstudioResultado> = [
      'contexto_historico',
      'analisis_linguistico',
      'que_quiso_comunicar',
      'que_no_quiso_decir',
      'explicacion',
      'reflexion',
    ]

    for (const key of orderedKeys) {
      const section = sectionsWithContent.find(item => item.key === key)
      if (!section) continue
      const content = String(state.resultado[section.key] || '').trim()
      items.push({
        id: String(section.key),
        label: section.label,
        shortLabel: section.shortLabel,
        plainText: content,
        content: <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{content}</div>,
      })

      if (key === 'contexto_historico' && state.chronology) {
        items.push({
          id: 'cronologia-mapa',
          label: 'Cronología y mapa',
          shortLabel: 'Mapa',
          content: <div className="-mx-4 -my-4 sm:-mx-5 sm:-my-5"><ChronologyMapPanel bundle={state.chronology} /></div>,
        })
      }
    }

    return items
  }, [isStudyResult, sectionsWithContent, state])

  const activeItem = useMemo(
    () => dashboardItems.find(item => item.id === activeSection) ?? null,
    [activeSection, dashboardItems]
  )

  const relatedConcordances = isStudyResult ? (state.relatedConcordances ?? []) : []

  useEffect(() => {
    obtenerHistorial().then(setHistorial).catch(() => setHistorial([]))
  }, [])

  useEffect(() => {
    if (state.status !== 'success') return
    setActiveTab(state.kind)
    if (state.kind === 'study') {
      setActiveSection(null)
      setEstudioGuardado(false)
      obtenerHistorial().then(setHistorial).catch(() => {})
      obtenerNota(state.pasaje).then(value => setNota(value || '')).catch(() => setNota(''))
    }
  }, [state])

  const avisar = (texto: string) => {
    setMensaje(texto)
    setTimeout(() => setMensaje(null), 2600)
  }

  const handleSaveNota = async () => {
    if (!isStudyResult) return
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

  const buildStudySnapshot = () => {
    if (!isStudyResult) return ''
    return [
      `Estudio Profundo: ${state.pasaje}`,
      '',
      ...dashboardItems.flatMap(item => item.plainText ? [item.label, item.plainText, ''] : []),
      'Vida Internacional',
    ].filter(Boolean).join('\n')
  }

  const mergeStudySnapshot = (existing: string, snapshot: string) => {
    if (!isStudyResult) return existing
    const start = `━━ Estudio guardado · ${state.pasaje} ━━`
    const end = '━━ Fin del estudio guardado ━━'
    const block = `${start}\n${snapshot}\n${end}`
    const startIndex = existing.indexOf(start)
    const endIndex = existing.indexOf(end)

    if (startIndex >= 0 && endIndex >= startIndex) {
      return `${existing.slice(0, startIndex)}${block}${existing.slice(endIndex + end.length)}`.trim()
    }

    return existing.trim()
      ? `${block}\n\n━━ Mis apuntes ━━\n${existing.trim()}`
      : block
  }

  const buildFullStudy = () => {
    if (!isStudyResult) return ''
    const marker = `━━ Estudio guardado · ${state.pasaje} ━━`
    if (nota.includes(marker)) return nota
    const snapshot = buildStudySnapshot()
    return nota.trim() ? `${snapshot}\n\nMis notas\n${nota.trim()}` : snapshot
  }

  const handleSaveStudy = async () => {
    if (!isStudyResult || estudioGuardando) return
    const snapshot = buildStudySnapshot()
    if (!snapshot.trim()) return

    const contenido = mergeStudySnapshot(nota, snapshot)
    setEstudioGuardando(true)
    setEstudioGuardado(false)
    const response = await guardarNota(state.pasaje, contenido)
    setEstudioGuardando(false)

    if (!response.success) {
      mostrarToast(response.error)
      return
    }

    setNota(contenido)
    setEstudioGuardado(true)
    avisar('Estudio guardado en Mis notas')
  }

  const shareStudy = async () => {
    if (!isStudyResult) return
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

  const renderRelatedConcordances = (compact = false) => {
    if (!isStudyResult || relatedConcordances.length === 0) return null

    return (
      <section className="space-y-3" aria-label={`Concordancias relacionadas con ${state.pasaje}`}>
        {!compact && (
          <header className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_0_24px_rgba(245,158,11,0.14)]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Concordancias relacionadas</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">Temas vinculados a {state.pasaje}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">Relaciones aprobadas para esta referencia, su capítulo o su unidad contextual, según la cobertura disponible.</p>
          </header>
        )}
        {relatedConcordances.map(result => (
          <article key={result.termId} className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
            <header className="border-b border-amber-100 bg-amber-50/40 px-5 py-4">
              <h4 className="text-base font-bold text-slate-950">{result.term}</h4>
              {result.description && <p className="mt-1 text-sm leading-6 text-slate-500">{result.description}</p>}
            </header>
            <div className="divide-y divide-slate-100">
              {result.matches.map(match => (
                <Link key={`${result.termId}-${match.bookCode}-${match.chapter}-${match.verse}-${match.relationKind}`} href={`/biblia?book=${encodeURIComponent(match.bookCode)}&chapter=${match.chapter}&verse=${match.verse}`} className="block px-5 py-4 hover:bg-amber-50/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-bold text-slate-900">{match.reference}</h5>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">{RELATION_LABELS[match.relationKind]}</span>
                  </div>
                  {match.excerpt && <p className="mt-2 text-sm leading-6 text-slate-600">{match.excerpt}</p>}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <form id="estudio-form" action={formAction} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C0392B]">Centro de Estudio</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Estudio bíblico y concordancias en una sola herramienta.</p>
        </div>
        <label htmlFor="pasaje" className="block text-sm font-bold text-slate-900">Escriba un versículo, una palabra o una pregunta</label>
        <p className="mt-1 text-xs leading-5 text-slate-500">La aplicación muestra únicamente información interna disponible y fuentes aprobadas.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="text" id="pasaje" name="pasaje" required disabled={isPending} placeholder="Ejemplo: Juan 3:16, Patmos, Daniel 2 o perdón" className="min-h-13 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/20 disabled:opacity-50" defaultValue={initialPasaje} />
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
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Buscando referencias, lugares, temas y capas verificadas relacionadas con su consulta.</p>
        </section>
      )}

      {!isPending && state.status === 'suggestions' && (
        <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">Ayuda de búsqueda</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">¿Quisiste decir alguna de estas opciones?</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Encontramos coincidencias cercanas para “{state.query}”. Elige una para continuar sin perder el flujo del estudio.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {state.suggestions.map(suggestion => (
              <button key={`${suggestion.label}-${suggestion.query}`} type="button" onClick={() => loadQuery(suggestion.query)} className="min-h-14 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-amber-50">
                <span className="block text-sm font-bold text-slate-900">{suggestion.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{suggestion.detail}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!isPending && state.status === 'place' && (() => {
        const place = state.place
        const hasCoordinates = place.latitude !== null && place.longitude !== null
        const mapHref = hasCoordinates
          ? `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=10/${place.latitude}/${place.longitude}`
          : null
        const interpreted = normalizeLabel(state.query) !== normalizeLabel(place.name)

        return (
          <section className="space-y-3" aria-label={`Lugar bíblico ${place.name}`}>
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-red-50/40 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#C0392B]/10 text-[#C0392B]"><MapPin className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C0392B]">Lugar bíblico</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{place.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{PLACE_KIND_LABELS[place.kind] ?? 'Lugar'} · {PLACE_CERTAINTY_LABELS[place.certainty] ?? place.certainty}</p>
                  </div>
                </div>
                {interpreted && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    Interpretamos “{state.query}” como <strong>{place.name}</strong> usando el índice geográfico aprobado.
                  </div>
                )}
              </header>

              <div className="p-5 sm:p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ubicación</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{place.name}</p>
                    </div>
                    <MapPin className="h-5 w-5 shrink-0 text-[#C0392B]" />
                  </div>
                  {hasCoordinates && <p className="mt-2 text-sm leading-6 text-slate-600">{place.latitude}, {place.longitude} · {PLACE_PRECISION_LABELS[place.coordinatePrecision] ?? place.coordinatePrecision}</p>}
                  {mapHref && (
                    <a href={mapHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">
                      Abrir mapa <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {place.references.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Pasajes relacionados</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Toca un pasaje para continuar directamente con su estudio completo.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {place.references.map(reference => (
                        <button key={reference.reference} type="button" onClick={() => loadQuery(reference.reference)} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#C0392B]/30 hover:bg-red-50/30">
                          <span className="font-bold text-slate-900">{reference.reference}</span>
                          <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> {place.provider ?? 'Fuente geográfica aprobada'}</span>
                  {place.sourceLocator && <a href={place.sourceLocator} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:underline">Ver fuente <ExternalLink className="h-3.5 w-3.5" /></a>}
                </footer>
              </div>
            </article>
          </section>
        )
      })()}

      {!isPending && isStudyResult && activeTab === 'study' && (
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

          <div className="grid grid-cols-3 gap-2 px-1">
            {dashboardItems.map(item => {
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSection(item.id)}
                  aria-expanded={active}
                  className={`inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-2xl border px-2 text-[11px] font-bold leading-tight transition sm:min-h-12 sm:text-xs ${active ? 'border-[#C0392B] bg-[#C0392B] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}
                >
                  <span>{item.shortLabel}</span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${active ? 'rotate-180' : ''}`} />
                </button>
              )
            })}

            <button type="button" onClick={() => toggleSection('notas')} aria-expanded={activeSection === 'notas'} className={`inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-2xl border px-2 text-[11px] font-bold transition sm:min-h-12 sm:text-xs ${activeSection === 'notas' ? 'border-[#C0392B] bg-[#C0392B] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}>
              Mis notas
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${activeSection === 'notas' ? 'rotate-180' : ''}`} />
            </button>

            {relatedConcordances.length > 0 && (
              <button type="button" onClick={() => toggleSection('concordancias')} aria-expanded={activeSection === 'concordancias'} className={`col-span-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-xs font-black transition sm:min-h-12 ${activeSection === 'concordancias' ? 'border-amber-400 bg-amber-500 text-white shadow-[0_0_22px_rgba(245,158,11,0.30)]' : 'border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 text-amber-800 shadow-[0_0_18px_rgba(245,158,11,0.20)] ring-1 ring-amber-100'}`}>
                <Sparkles className="h-4 w-4" />
                Concordancias relacionadas
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeSection === 'concordancias' ? 'rotate-180' : ''}`} />
              </button>
            )}

            <button type="button" onClick={() => toggleSection('ver-todo')} aria-expanded={activeSection === 'ver-todo'} className={`col-span-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-xs font-black transition sm:min-h-12 ${activeSection === 'ver-todo' ? 'border-[#C0392B] bg-[#C0392B] text-white shadow-sm' : 'border-[#C0392B]/25 bg-red-50/40 text-[#A93226] shadow-sm hover:bg-red-50'}`}>
              Ver todo el estudio
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${activeSection === 'ver-todo' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid gap-2 px-1 sm:grid-cols-2">
            <button type="button" onClick={handleSaveStudy} disabled={estudioGuardando} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black shadow-sm transition disabled:opacity-60 ${estudioGuardado ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              {estudioGuardando ? <Loader2 className="h-4 w-4 animate-spin" /> : estudioGuardado ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {estudioGuardando ? 'Guardando…' : estudioGuardado ? 'Estudio guardado' : 'Guardar estudio en Notas'}
            </button>
            <Link href="/biblia/notas" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50">
              <Edit3 className="h-4 w-4 text-[#C0392B]" />
              Abrir mi cuaderno
            </Link>
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

          {activeSection === 'concordancias' && renderRelatedConcordances()}

          {activeSection === 'ver-todo' && (
            <section className="space-y-3" aria-label={`Estudio completo de ${state.pasaje}`}>
              <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C0392B]">Vista completa</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">{state.pasaje}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Todas las capas disponibles, en el mismo orden del estudio. Las capas ausentes no se muestran.</p>
              </header>

              {dashboardItems.map(item => (
                <article key={`all-${item.id}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <header className="border-b border-slate-100 px-4 py-3 sm:px-5">
                    <h4 className="text-sm font-bold text-slate-900">{item.label}</h4>
                  </header>
                  <div className="p-4 sm:p-5">{item.content}</div>
                </article>
              ))}

              {relatedConcordances.length > 0 && renderRelatedConcordances(true)}
            </section>
          )}
        </section>
      )}

      {!isPending && isConcordanceResult && activeTab === 'concordance' && (
        <section className="space-y-4" aria-label="Resultados de concordancias">
          <header className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_0_28px_rgba(245,158,11,0.14)]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Concordancias internas</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Resultados para “{state.query}”</h2>
            {state.interpretedFrom && state.interpretedAs && (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">Interpretamos “{state.interpretedFrom}” como <strong>{state.interpretedAs}</strong>.</p>
            )}
            <p className="mt-2 text-sm leading-6 text-slate-600">Temas y pasajes ordenados según coincidencias revisadas en la biblioteca.</p>
          </header>
          {state.results.map(result => (
            <article key={result.termId} className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
              <header className="border-b border-amber-100 bg-amber-50/40 px-5 py-4 sm:px-6">
                <h3 className="text-lg font-bold text-slate-950">{result.term}</h3>
                {result.description && <p className="mt-1 text-sm leading-6 text-slate-500">{result.description}</p>}
              </header>
              <div className="divide-y divide-slate-100">
                {result.matches.map(match => (
                  <Link key={`${result.termId}-${match.bookCode}-${match.chapter}-${match.verse}-${match.relationKind}`} href={`/biblia?book=${encodeURIComponent(match.bookCode)}&chapter=${match.chapter}&verse=${match.verse}`} className="block px-5 py-4 hover:bg-amber-50/40 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900">{match.reference}</h4>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">{RELATION_LABELS[match.relationKind]}</span>
                    </div>
                    {match.excerpt && <p className="mt-2 text-sm leading-6 text-slate-600">{match.excerpt}</p>}
                  </Link>
                ))}
              </div>
            </article>
          ))}
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
