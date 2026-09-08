'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Award, BadgeCheck, BookOpenCheck, ChevronLeft, ClipboardCheck, Loader2, PlayCircle, RotateCcw, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Summary = {
  aprobado: boolean
  fuente: 'curso' | 'previo' | null
  aprobado_en: string | null
  curso_id: string | null
  curso_titulo: string | null
  nota_minima: number | null
  mejor_calificacion: number | null
}

type Course = {
  id: string
  titulo: string
  descripcion: string
  nota_minima: number
}

type Lesson = {
  id: string
  titulo: string
  descripcion: string
  video_url: string | null
  contenido: string
  orden: number
}

type ReviewData = {
  curso: Course | null
  lecciones: Lesson[]
  mejor_calificacion: number | null
}

type Question = {
  id: string
  enunciado: string
  orden: number
  opciones: Array<{ id: string; texto: string; orden: number }>
}

function youtubeEmbedUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    const id = url.hostname === 'youtu.be'
      ? url.pathname.replace(/^\//, '').split('/')[0]
      : url.hostname.includes('youtube.com')
        ? url.searchParams.get('v')
        : null
    return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1` : null
  } catch {
    return null
  }
}

export default function DiscipuladoCompletadoClient() {
  const supabase = useMemo(() => createClient() as any, [])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [review, setReview] = useState<ReviewData | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [exam, setExam] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [examOpen, setExamOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function refreshSummary() {
    const { data, error: rpcError } = await supabase.rpc('discipulado_resumen_personal')
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setSummary((data || null) as Summary | null)
  }

  useEffect(() => {
    let active = true
    void supabase.rpc('discipulado_resumen_personal').then(({ data, error: rpcError }: any) => {
      if (!active) return
      if (rpcError) setError(rpcError.message)
      else setSummary((data || null) as Summary | null)
      setLoading(false)
    })
    return () => { active = false }
  }, [supabase])

  async function openReview() {
    setBusy(true)
    setError(null)
    setNotice(null)
    const { data, error: rpcError } = await supabase.rpc('discipulado_repaso_contenido')
    setBusy(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setReview((data || null) as ReviewData | null)
    setReviewOpen(true)
  }

  async function openExam() {
    setBusy(true)
    setError(null)
    setNotice(null)
    const { data, error: rpcError } = await supabase.rpc('discipulado_obtener_evaluacion_mejora')
    setBusy(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    const questions = (data || []) as Question[]
    if (questions.length === 0) {
      setError('El curso publicado todavía no tiene examen final.')
      return
    }
    setExam(questions)
    setAnswers({})
    setExamOpen(true)
  }

  async function submitImprovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (exam.some(question => !answers[question.id])) {
      setError('Responde todas las preguntas antes de enviar el examen.')
      return
    }

    setBusy(true)
    setError(null)
    setNotice(null)
    const { data, error: rpcError } = await supabase.rpc('discipulado_enviar_mejora', {
      p_respuestas: answers,
    })
    setBusy(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    const current = Math.round(Number(data?.calificacion || 0))
    const best = Math.round(Number(data?.mejor_calificacion || current))
    setNotice(`Nuevo intento: ${current}%. Tu mejor calificación queda en ${best}%. Tu aprobación permanece intacta.`)
    setExamOpen(false)
    await refreshSummary()
  }

  if (loading) {
    return <main className="mx-auto grid min-h-screen max-w-2xl place-items-center bg-[#f4f5f9] px-4"><Loader2 className="h-7 w-7 animate-spin text-amber-500" /></main>
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/perfil" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500"><ChevronLeft className="h-4 w-4" /> Perfil</Link>

      <section className="rounded-[28px] border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-500 ring-1 ring-amber-200">
            <Star className="h-7 w-7 fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-amber-600">Discipulado completado</p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#171923]">
              {summary?.fuente === 'previo' ? 'Reconocido dentro de VIDA' : summary?.curso_titulo || 'Tu discipulado'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Tu aprobación se conserva aunque vuelvas a repasar el contenido o presentes otro examen para mejorar tu calificación.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mejor calificación</p>
            <p className="mt-1 text-xl font-bold text-[#171923]">{summary?.mejor_calificacion == null ? '—' : `${Math.round(Number(summary.mejor_calificacion))}%`}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nota mínima</p>
            <p className="mt-1 text-xl font-bold text-[#171923]">{Math.round(Number(summary?.nota_minima ?? 80))}%</p>
          </div>
        </div>

        {summary?.aprobado_en && (
          <p className="mt-4 text-xs text-slate-400">
            Aprobado {new Intl.DateTimeFormat('es-SV', { dateStyle: 'long' }).format(new Date(summary.aprobado_en))}
          </p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => void openReview()} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition active:scale-[.98] disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />} Repasar discipulado
          </button>
          <button type="button" onClick={() => void openExam()} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-amber-950 transition active:scale-[.98] disabled:opacity-50">
            <Award className="h-4 w-4" /> Mejorar calificación
          </button>
        </div>
      </section>

      {(notice || error) && (
        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>{error || notice}</div>
      )}

      {reviewOpen && (
        <section className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-bold text-[#171923]">Repaso</h2>
              <p className="mt-0.5 text-xs text-slate-500">Puedes abrir cualquier lección. Este repaso no cambia tu aprobación.</p>
            </div>
            <button type="button" onClick={() => setReviewOpen(false)} className="text-xs font-bold text-slate-500">Cerrar</button>
          </div>

          {!review?.curso ? (
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-500 shadow-sm">No hay un curso publicado actualmente para repasar.</div>
          ) : (
            <>
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-violet-600">Curso actual</p>
                <h3 className="mt-1 text-lg font-bold text-[#171923]">{review.curso.titulo}</h3>
                {review.curso.descripcion && <p className="mt-1 text-sm leading-6 text-slate-500">{review.curso.descripcion}</p>}
              </div>

              {(review.lecciones || []).map(lesson => {
                const embed = youtubeEmbedUrl(lesson.video_url)
                return (
                  <details key={lesson.id} className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-extrabold text-violet-700">{lesson.orden}</span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#171923]">{lesson.titulo}</span><span className="mt-0.5 block text-[11px] text-slate-500">Toca para repasar esta lección</span></span>
                      <PlayCircle className="h-5 w-5 shrink-0 text-slate-400" />
                    </summary>
                    <div className="space-y-4 border-t border-slate-100 p-4">
                      {lesson.descripcion && <p className="text-sm leading-6 text-slate-500">{lesson.descripcion}</p>}
                      {embed ? (
                        <div className="aspect-video overflow-hidden rounded-2xl bg-slate-950">
                          <iframe src={embed} title={lesson.titulo} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        </div>
                      ) : lesson.video_url ? (
                        <a href={lesson.video_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-50 px-4 text-sm font-bold text-violet-700"><PlayCircle className="h-4 w-4" /> Abrir video</a>
                      ) : null}
                      {lesson.contenido && <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{lesson.contenido}</p>}
                    </div>
                  </details>
                )
              })}
            </>
          )}
        </section>
      )}

      {examOpen && (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/45 sm:items-center sm:justify-center">
          <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#f4f5f9] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-xl sm:rounded-[28px] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-amber-600">Mejorar calificación</p><h2 className="mt-1 text-xl font-bold text-[#171923]">Nuevo intento</h2></div>
              <button type="button" onClick={() => setExamOpen(false)} className="h-10 rounded-full bg-white px-4 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-100">Cerrar</button>
            </div>
            <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 ring-1 ring-amber-100">Tu estado aprobado no cambia. VIDA conservará siempre la mejor calificación obtenida.</p>
            <form onSubmit={submitImprovement} className="space-y-4">
              {exam.map((question, index) => (
                <fieldset key={question.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                  <legend className="text-sm font-bold leading-6 text-[#171923]">{index + 1}. {question.enunciado}</legend>
                  <div className="mt-3 space-y-2">
                    {question.opciones.map(option => (
                      <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm ${answers[question.id] === option.id ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-slate-200 bg-white text-slate-700'}`}>
                        <input type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={() => setAnswers(current => ({ ...current, [question.id]: option.id }))} className="mt-0.5 h-4 w-4 accent-amber-500" />
                        <span>{option.texto}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <button disabled={busy || exam.length === 0} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-amber-950 disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />} Enviar nuevo intento
              </button>
              <button type="button" onClick={() => { setExamOpen(false); setAnswers({}) }} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-slate-500"><RotateCcw className="h-4 w-4" /> Cancelar</button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
