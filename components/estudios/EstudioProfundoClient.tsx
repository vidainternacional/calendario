'use client'

import { mostrarToast } from '@/lib/ui/toast'
import { useActionState, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  Edit3,
  Expand,
  FileText,
  Loader2,
  Minimize2,
  RefreshCw,
  Save,
  Search,
  Share2,
  Sparkles,
} from 'lucide-react'
import {
  analizarPasaje,
  obtenerHistorial,
  obtenerNota,
  guardarNota,
  type EstudioResultado,
  type EstudioState,
} from '@/app/actions/estudio'

const SECTIONS: { key: keyof EstudioResultado; label: string; shortLabel: string; bg: string; icon: typeof BookOpen }[] = [
  { key: 'texto_original', label: '1. Texto Original', shortLabel: 'Texto original', bg: 'bg-blue-50 text-blue-900 border-blue-100', icon: BookOpen },
  { key: 'transliteracion', label: '2. Transliteración', shortLabel: 'Transliteración', bg: 'bg-slate-50 text-slate-900 border-slate-200', icon: BookOpen },
  { key: 'traduccion_literal', label: '3. Traducción Literal', shortLabel: 'Traducción literal', bg: 'bg-slate-50 text-slate-900 border-slate-200', icon: BookOpen },
  { key: 'traduccion_interpretativa', label: '4. Traducción Interpretativa', shortLabel: 'Interpretación', bg: 'bg-emerald-50 text-emerald-900 border-emerald-100', icon: BookOpen },
  { key: 'comparacion_versiones', label: '5. Comparación de Versiones', shortLabel: 'Versiones', bg: 'bg-slate-50 text-slate-900 border-slate-200', icon: BookOpen },
  { key: 'contexto_historico', label: '6. Contexto Histórico, Cultural y Religioso', shortLabel: 'Contexto', bg: 'bg-amber-50 text-amber-900 border-amber-100', icon: BookOpen },
  { key: 'analisis_linguistico', label: '7. Análisis Lingüístico Clave', shortLabel: 'Lingüística', bg: 'bg-indigo-50 text-indigo-900 border-indigo-100', icon: BookOpen },
  { key: 'que_quiso_comunicar', label: '8. Qué Quiso Comunicar Dios', shortLabel: 'Mensaje', bg: 'bg-purple-50 text-purple-900 border-purple-100', icon: Sparkles },
  { key: 'que_no_quiso_decir', label: '9. Qué NO Quiso Decir', shortLabel: 'Qué no significa', bg: 'bg-rose-50 text-rose-900 border-rose-100', icon: AlertCircle },
  { key: 'explicacion', label: '10. Explicación Lógica y Coherente', shortLabel: 'Explicación', bg: 'bg-slate-50 text-slate-900 border-slate-200', icon: BookOpen },
  { key: 'reflexion', label: '11. Reflexión Espiritual', shortLabel: 'Reflexión', bg: 'bg-teal-50 text-teal-900 border-teal-100', icon: Sparkles },
]

export default function EstudioProfundoClient({ initialPasaje = '' }: { initialPasaje?: string }) {
  const [state, formAction, isPending] = useActionState<EstudioState, FormData>(analizarPasaje, { status: 'idle' })
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [historial, setHistorial] = useState<{ pasaje: string; created_at: string }[]>([])
  const [nota, setNota] = useState('')
  const [notaGuardando, setNotaGuardando] = useState(false)
  const [notaSuccess, setNotaSuccess] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const sectionsWithContent = useMemo(() => {
    if (state.status !== 'success') return []
    return SECTIONS.filter(section => Boolean(state.resultado[section.key]))
  }, [state])

  useEffect(() => {
    obtenerHistorial().then(setHistorial).catch(() => setHistorial([]))
  }, [])

  useEffect(() => {
    if (state.status !== 'success') return
    setOpenSections({
      texto_original: true,
      traduccion_interpretativa: true,
      que_quiso_comunicar: true,
      reflexion: true,
    })
    obtenerHistorial().then(setHistorial).catch(() => {})
    obtenerNota(state.pasaje).then(n => setNota(n || '')).catch(() => setNota(''))
  }, [state])

  const avisar = (texto: string) => {
    setMensaje(texto)
    setTimeout(() => setMensaje(null), 2600)
  }

  const handleSaveNota = async () => {
    if (state.status !== 'success') return
    setNotaGuardando(true)
    setNotaSuccess(false)
    const res = await guardarNota(state.pasaje, nota)
    setNotaGuardando(false)
    if (res.success) {
      setNotaSuccess(true)
      setTimeout(() => setNotaSuccess(false), 3000)
    } else mostrarToast(res.error)
  }

  const loadFromHistory = (pasajeStr: string) => {
    const form = document.getElementById('estudio-form') as HTMLFormElement | null
    if (!form) return
    const input = form.elements.namedItem('pasaje') as HTMLInputElement | null
    if (input) input.value = pasajeStr
    form.requestSubmit()
  }

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const expandAll = () => {
    const next: Record<string, boolean> = {}
    sectionsWithContent.forEach(section => { next[section.key] = true })
    setOpenSections(next)
  }

  const collapseAll = () => setOpenSections({})

  const jumpToSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: true }))
    setTimeout(() => document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
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
    if (state.status !== 'success') return ''
    return [
      `Estudio Profundo: ${state.pasaje}`,
      '',
      ...sectionsWithContent.flatMap(section => [section.label, String(state.resultado[section.key] || ''), '']),
      nota.trim() ? `Mis notas\n${nota.trim()}` : '',
      'Generado en Vida Internacional',
    ].filter(Boolean).join('\n')
  }

  const shareStudy = async () => {
    if (state.status !== 'success') return
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

  const exportPdf = () => {
    if (state.status !== 'success') return
    window.print()
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 sm:space-y-6">
      <form id="estudio-form" action={formAction} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label htmlFor="pasaje" className="mb-2 block text-sm font-semibold text-slate-700">Ingresa el pasaje a estudiar</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="pasaje"
              name="pasaje"
              required
              disabled={isPending}
              placeholder="Ej: Juan 3:16, Romanos 8:28-30"
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/30 disabled:opacity-50"
              defaultValue={initialPasaje}
            />
          </div>
          <button type="submit" disabled={isPending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C0392B] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a93226] disabled:cursor-not-allowed disabled:opacity-70">
            {isPending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analizando…</> : <><Sparkles className="h-4 w-4" /> Analizar</>}
          </button>
        </div>
        {state.status === 'error' && <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{state.error}</p>}
      </form>

      {isPending && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50"><Sparkles className="h-8 w-8 animate-pulse text-[#C0392B]" /></div>
          <h3 className="mt-4 text-lg font-bold text-slate-800">Preparando el análisis</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">Consultando texto original, contexto histórico, lenguaje y aplicación espiritual. Puede tardar entre 15 y 30 segundos.</p>
          <div className="mx-auto mt-5 h-2 max-w-sm overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#C0392B]" /></div>
        </div>
      )}

      {!isPending && state.status === 'success' && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estudio generado</p>
                <h2 className="mt-1 break-words text-xl font-bold text-slate-900">{state.pasaje}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button type="button" onClick={shareStudy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"><Share2 className="h-4 w-4" /> Compartir</button>
                <button type="button" onClick={exportPdf} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white"><Download className="h-4 w-4" /> Guardar PDF</button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sectionsWithContent.map(section => (
                <button key={section.key} type="button" onClick={() => jumpToSection(section.key)} className="min-h-10 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600">{section.shortLabel}</button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={expandAll} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"><Expand className="h-4 w-4" /> Expandir todo</button>
              <button type="button" onClick={collapseAll} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"><Minimize2 className="h-4 w-4" /> Contraer todo</button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {sectionsWithContent.map(section => {
                const content = String(state.resultado[section.key] || '')
                const isOpen = !!openSections[section.key]
                const Icon = section.icon
                return (
                  <div key={section.key} id={`section-${section.key}`} className="scroll-mt-24">
                    <button type="button" onClick={() => toggleSection(section.key)} className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors sm:px-5 ${isOpen ? section.bg : 'bg-white hover:bg-slate-50'}`}>
                      <span className="flex min-w-0 items-start gap-2 text-[15px] font-semibold"><Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" /><span className="break-words">{section.label}</span></span>
                      {isOpen ? <ChevronUp className="h-5 w-5 shrink-0 opacity-50" /> : <ChevronDown className="h-5 w-5 shrink-0 opacity-50" />}
                    </button>
                    {isOpen && (
                      <div className="animate-in fade-in slide-in-from-top-1 bg-white px-4 py-5 sm:px-5">
                        <div className="mb-3 flex justify-end">
                          <button type="button" onClick={() => copyText(String(section.key), content)} className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600">
                            {copiado === section.key ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            {copiado === section.key ? 'Copiado' : 'Copiar sección'}
                          </button>
                        </div>
                        <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{content}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-800"><Edit3 className="h-4 w-4 shrink-0 text-[#C0392B]" /><span className="break-words">Mis notas sobre {state.pasaje}</span></h3>
              <div className="flex items-center justify-end gap-2">
                {notaSuccess && <span className="text-xs font-medium text-emerald-600">✓ Guardado</span>}
                <button type="button" onClick={handleSaveNota} disabled={notaGuardando} className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-xs font-semibold text-white disabled:opacity-50">
                  {notaGuardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {notaGuardando ? 'Guardando…' : 'Guardar nota'}
                </button>
              </div>
            </div>
            <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Escribe reflexiones, preguntas o apuntes personales…" className="mt-4 min-h-40 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-base leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-[#C0392B]/40" />
          </section>
        </>
      )}

      {historial.length > 0 && state.status === 'idle' && !isPending && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800"><Clock className="h-4 w-4 text-slate-500" /> Mi historial reciente</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {historial.map((item, index) => (
              <button key={`${item.pasaje}-${index}`} type="button" onClick={() => loadFromHistory(item.pasaje)} className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#C0392B] shadow-sm"><FileText className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block break-words text-sm font-semibold text-slate-800">{item.pasaje}</span><span className="mt-1 block text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {mensaje && <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 right-4 z-[90] mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-xl" role="status">{mensaje}</div>}
    </div>
  )
}
