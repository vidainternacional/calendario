'use client'

import { mostrarToast } from '@/lib/ui/toast'
import { useActionState, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Check,
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
import {
  analizarPasaje,
  obtenerHistorial,
  obtenerNota,
  guardarNota,
  type EstudioResultado,
  type EstudioState,
} from '@/app/actions/estudio-interno'

const SECTIONS: { key: keyof EstudioResultado; label: string }[] = [
  { key: 'texto_original', label: '1. Texto original' },
  { key: 'transliteracion', label: '2. Transliteración' },
  { key: 'traduccion_literal', label: '3. Traducción literal' },
  { key: 'traduccion_interpretativa', label: '4. Traducción interpretativa' },
  { key: 'comparacion_versiones', label: '5. Comparación de traducciones' },
  { key: 'contexto_historico', label: '6. Contexto histórico y judío' },
  { key: 'analisis_linguistico', label: '7. Análisis lingüístico' },
  { key: 'que_quiso_comunicar', label: '8. Qué quiso comunicar el texto' },
  { key: 'que_no_quiso_decir', label: '9. Qué no quiso decir' },
  { key: 'explicacion', label: '10. Explicación lógica' },
  { key: 'reflexion', label: '11. Reflexión espiritual' },
]

export default function EstudioProfundoClient({ initialPasaje = '' }: { initialPasaje?: string }) {
  const [state, formAction, isPending] = useActionState<EstudioState, FormData>(analizarPasaje, { status: 'idle' })
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
    obtenerHistorial().then(setHistorial).catch(() => {})
    obtenerNota(state.pasaje).then(value => setNota(value || '')).catch(() => setNota(''))
  }, [state])

  const avisar = (texto: string) => {
    setMensaje(texto)
    setTimeout(() => setMensaje(null), 2600)
  }

  const handleSaveNota = async () => {
    if (state.status !== 'success') return
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

  const loadFromHistory = (pasaje: string) => {
    const form = document.getElementById('estudio-form') as HTMLFormElement | null
    const input = form?.elements.namedItem('pasaje') as HTMLInputElement | null
    if (!form || !input) return
    input.value = pasaje
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
    if (state.status !== 'success') return ''
    return [
      `Estudio Profundo: ${state.pasaje}`,
      '',
      ...sectionsWithContent.flatMap(section => [section.label, String(state.resultado[section.key] || ''), '']),
      nota.trim() ? `Mis notas\n${nota.trim()}` : '',
      'Vida Internacional',
    ].filter(Boolean).join('\n')
  }

  const shareStudy = async () => {
    if (state.status !== 'success') return
    const text = buildFullStudy()

    try {
      if (navigator.share) {
        await navigator.share({ title: `Estudio de ${state.pasaje}`, text })
      } else {
        await navigator.clipboard.writeText(text)
        avisar('Estudio copiado para compartir')
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') avisar('No se pudo compartir el estudio')
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <form id="estudio-form" action={formAction} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <label htmlFor="pasaje" className="block text-sm font-bold text-slate-900">
          ¿Qué pasaje desea estudiar?
        </label>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          El estudio se prepara desde la biblioteca interna, sin depender de IA.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              id="pasaje"
              name="pasaje"
              required
              disabled={isPending}
              placeholder="Prueba: Salmos 23:1 o Juan 3:16"
              className="min-h-13 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/20 disabled:opacity-50"
              defaultValue={initialPasaje}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#C0392B] px-7 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#a93226] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? <><RefreshCw className="h-4 w-4 animate-spin" /> Preparando…</> : <><BookOpen className="h-4 w-4" /> Estudiar pasaje</>}
          </button>
        </div>

        {state.status === 'error' && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {state.error}
          </p>
        )}
      </form>

      {isPending && (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm" aria-live="polite">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#C0392B]" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Consultando la biblioteca interna</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Organizando texto original, transliteración, contexto histórico y análisis del pasaje.
          </p>
        </section>
      )}

      {!isPending && state.status === 'success' && (
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0392B]">Estudio bíblico interno</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">{state.pasaje}</h2>
              <div className="flex gap-2">
                <button type="button" onClick={shareStudy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Share2 className="h-4 w-4" aria-hidden="true" /> Compartir
                </button>
                <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Download className="h-4 w-4" aria-hidden="true" /> PDF
                </button>
              </div>
            </div>
          </header>

          <div className="divide-y divide-slate-100">
            {sectionsWithContent.map(section => {
              const content = String(state.resultado[section.key] || '')
              return (
                <section key={section.key} className="px-5 py-6 sm:px-7">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-950">{section.label}</h3>
                    <button
                      type="button"
                      onClick={() => copyText(String(section.key), content)}
                      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    >
                      {copiado === section.key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiado === section.key ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{content}</div>
                </section>
              )
            })}
          </div>

          <details className="border-t border-slate-100 bg-slate-50/60">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-700 sm:px-7 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><Edit3 className="h-4 w-4 text-[#C0392B]" /> Mis notas personales</span>
              <span className="text-xs font-semibold text-slate-400">Abrir</span>
            </summary>
            <div className="border-t border-slate-100 px-5 py-5 sm:px-7">
              <textarea
                value={nota}
                onChange={event => setNota(event.target.value)}
                placeholder="Escriba reflexiones, preguntas o apuntes personales…"
                className="min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-base leading-7 text-slate-700 outline-none focus:ring-2 focus:ring-[#C0392B]/30"
              />
              <div className="mt-3 flex items-center justify-end gap-3">
                {notaSuccess && <span className="text-xs font-semibold text-emerald-600">Nota guardada</span>}
                <button type="button" onClick={handleSaveNota} disabled={notaGuardando} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white disabled:opacity-50">
                  {notaGuardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {notaGuardando ? 'Guardando…' : 'Guardar nota'}
                </button>
              </div>
            </div>
          </details>
        </article>
      )}

      {historial.length > 0 && state.status === 'idle' && !isPending && (
        <details className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Estudios recientes</span>
            <span className="text-xs font-semibold text-slate-400">{historial.length}</span>
          </summary>
          <div className="grid gap-2 border-t border-slate-100 p-4 sm:grid-cols-2">
            {historial.map((item, index) => (
              <button key={`${item.pasaje}-${index}`} type="button" onClick={() => loadFromHistory(item.pasaje)} className="flex min-h-14 items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-50">
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

      {mensaje && (
        <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 right-4 z-[90] mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-xl" role="status">
          {mensaje}
        </div>
      )}
    </div>
  )
}
