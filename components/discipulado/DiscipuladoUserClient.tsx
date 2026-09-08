'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Check, ChevronLeft, ChevronRight, CircleCheck, ClipboardCheck, GraduationCap, Loader2, LockKeyhole, PlayCircle, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = { userId: string }
type Course = { id: string; titulo: string; descripcion: string }
type Lesson = { id: string; curso_id: string; titulo: string; descripcion: string; video_url: string | null; contenido: string; orden: number }
type Assignment = { id: string; curso_id: string; estado: 'asignado' | 'en_progreso' | 'revision' | 'aprobado' | 'rechazado'; calificacion: number | null; notas_revision: string | null }
type Progress = { asignacion_id: string; leccion_id: string; completado_en: string }
type VideoProgress = { asignacion_id: string; leccion_id: string; visto_completo_en: string }
type Attempt = { id: string; asignacion_id: string; calificacion: number; correctas: number; total: number; enviado_en: string }
type QuizQuestion = { id: string; enunciado: string; orden: number; opciones: Array<{ id: string; texto: string; orden: number }> }

type Enrollment = {
  aprobado?: boolean
  estado?: string
  asignacion_id?: string | null
  curso_id?: string | null
}

function youtubeId(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v')
    if (url.hostname === 'youtu.be') return url.pathname.replace('/', '').split('/')[0] || null
  } catch {}
  return null
}

function YouTubeLessonPlayer({ videoUrl, lessonId, onEnded }: { videoUrl: string; lessonId: string; onEnded: () => void }) {
  const id = youtubeId(videoUrl)
  const mountId = useMemo(() => `vida-discipulado-${lessonId.replace(/-/g, '')}`, [lessonId])
  const playerRef = useRef<any>(null)
  const endedRef = useRef(onEnded)
  endedRef.current = onEnded

  useEffect(() => {
    if (!id) return
    let cancelled = false
    let timer: number | null = null

    const create = () => {
      const YT = (window as any).YT
      if (cancelled || !YT?.Player || playerRef.current) return false
      playerRef.current = new YT.Player(mountId, {
        videoId: id,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === YT.PlayerState.ENDED) endedRef.current()
          },
        },
      })
      return true
    }

    if (!create()) {
      if (!document.querySelector('script[data-vida-youtube-api]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        script.dataset.vidaYoutubeApi = 'true'
        document.head.appendChild(script)
      }
      timer = window.setInterval(() => {
        if (create() && timer !== null) window.clearInterval(timer)
      }, 250)
    }

    return () => {
      cancelled = true
      if (timer !== null) window.clearInterval(timer)
      try { playerRef.current?.destroy?.() } catch {}
      playerRef.current = null
    }
  }, [id, mountId])

  if (!id) {
    return (
      <a href={videoUrl} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 text-sm font-bold text-indigo-700">
        <PlayCircle className="h-5 w-5" /> Abrir video
      </a>
    )
  }

  return <div className="aspect-video overflow-hidden rounded-2xl bg-slate-950"><div id={mountId} className="h-full w-full" /></div>
}

export default function DiscipuladoUserClient({ userId }: Props) {
  const supabase = useMemo(() => createClient() as any, [])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [approvedWithoutCourse, setApprovedWithoutCourse] = useState(false)
  const [noCourse, setNoCourse] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [exam, setExam] = useState<QuizQuestion[]>([])
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({})
  const [examOpen, setExamOpen] = useState(false)

  const load = useCallback(async (first = false) => {
    if (first) setLoading(true)
    setError(null)

    const { data: enrollment, error: enrollmentError } = await supabase.rpc('discipulado_autoinscribir')
    if (enrollmentError) {
      setError(enrollmentError.message)
      if (first) setLoading(false)
      return
    }

    const info = (enrollment || {}) as Enrollment
    if (info.aprobado === true && !info.asignacion_id) {
      setApprovedWithoutCourse(true)
      setNoCourse(false)
      setCourse(null)
      setAssignment(null)
      if (first) setLoading(false)
      return
    }

    if (info.estado === 'sin_curso' || !info.asignacion_id || !info.curso_id) {
      setNoCourse(true)
      setApprovedWithoutCourse(false)
      if (first) setLoading(false)
      return
    }

    const assignmentId = String(info.asignacion_id)
    const courseId = String(info.curso_id)
    const [courseRes, assignmentRes, lessonsRes, progressRes, videoRes, attemptsRes] = await Promise.all([
      supabase.from('discipulado_cursos').select('id,titulo,descripcion').eq('id', courseId).single(),
      supabase.from('discipulado_asignaciones').select('id,curso_id,estado,calificacion,notas_revision').eq('id', assignmentId).single(),
      supabase.from('discipulado_lecciones').select('id,curso_id,titulo,descripcion,video_url,contenido,orden').eq('curso_id', courseId).order('orden'),
      supabase.from('discipulado_leccion_progreso').select('*').eq('asignacion_id', assignmentId),
      supabase.from('discipulado_video_progreso').select('*').eq('asignacion_id', assignmentId),
      supabase.from('discipulado_intentos').select('id,asignacion_id,calificacion,correctas,total,enviado_en').eq('asignacion_id', assignmentId).order('enviado_en', { ascending: false }),
    ])

    const firstError = [courseRes, assignmentRes, lessonsRes, progressRes, videoRes, attemptsRes].find((item: any) => item.error)?.error
    if (firstError) setError(firstError.message)
    setCourse(courseRes.data || null)
    setAssignment(assignmentRes.data || null)
    setLessons(lessonsRes.data || [])
    setProgress(progressRes.data || [])
    setVideoProgress(videoRes.data || [])
    setAttempts(attemptsRes.data || [])
    setApprovedWithoutCourse(false)
    setNoCourse(false)
    if (first) setLoading(false)
  }, [supabase])

  useEffect(() => { void load(true) }, [load])

  const completedIds = useMemo(() => new Set(progress.map(item => item.leccion_id)), [progress])
  const viewedIds = useMemo(() => new Set(videoProgress.map(item => item.leccion_id)), [videoProgress])
  const completedCount = lessons.filter(item => completedIds.has(item.id)).length
  const progressPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0
  const firstIncomplete = lessons.find(item => !completedIds.has(item.id)) || lessons[lessons.length - 1] || null
  const selectedLesson = lessons.find(item => item.id === selectedLessonId) || firstIncomplete
  const selectedIndex = selectedLesson ? lessons.findIndex(item => item.id === selectedLesson.id) : -1
  const selectedUnlocked = selectedIndex <= 0 || lessons.slice(0, selectedIndex).every(item => completedIds.has(item.id))
  const selectedViewed = selectedLesson ? viewedIds.has(selectedLesson.id) : false
  const selectedComplete = selectedLesson ? completedIds.has(selectedLesson.id) : false
  const latestAttempt = attempts[0] || null
  const allLessonsComplete = lessons.length > 0 && completedCount === lessons.length

  useEffect(() => {
    if (!selectedLesson || !selectedViewed || selectedComplete || !assignment) {
      setQuiz([])
      setQuizAnswers({})
      return
    }
    let active = true
    void supabase.rpc('discipulado_obtener_quiz_leccion', {
      p_asignacion_id: assignment.id,
      p_leccion_id: selectedLesson.id,
    }).then(({ data, error: rpcError }: any) => {
      if (!active) return
      if (rpcError) setError(rpcError.message)
      else setQuiz((data || []) as QuizQuestion[])
      setQuizAnswers({})
    })
    return () => { active = false }
  }, [assignment, selectedComplete, selectedLesson, selectedViewed, supabase])

  async function markVideoEnded() {
    if (!assignment || !selectedLesson || selectedComplete) return
    setBusy(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('discipulado_marcar_video_visto', {
      p_asignacion_id: assignment.id,
      p_leccion_id: selectedLesson.id,
    })
    if (rpcError) setError(rpcError.message)
    else setNotice('Video completado. Responde las preguntas para desbloquear la siguiente lección.')
    await load(false)
    setBusy(false)
  }

  async function submitLessonQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!assignment || !selectedLesson || quiz.some(question => !quizAnswers[question.id])) {
      setError('Responde todas las preguntas de esta lección.')
      return
    }
    setBusy(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('discipulado_responder_quiz_leccion', {
      p_asignacion_id: assignment.id,
      p_leccion_id: selectedLesson.id,
      p_respuestas: quizAnswers,
    })
    if (rpcError) setError(rpcError.message)
    else if (data?.aprobado) {
      setNotice('Lección completada. Ya puedes continuar con la siguiente.')
      setQuiz([])
      setQuizAnswers({})
      await load(false)
    } else {
      setError(`Obtuviste ${Math.round(Number(data?.calificacion || 0))}%. Revisa el video y vuelve a intentarlo.`)
    }
    setBusy(false)
  }

  async function openExam() {
    if (!assignment) return
    setBusy(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('discipulado_obtener_evaluacion', { p_asignacion_id: assignment.id })
    setBusy(false)
    if (rpcError) return setError(rpcError.message)
    setExam((data || []) as QuizQuestion[])
    setExamAnswers({})
    setExamOpen(true)
  }

  async function submitExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!assignment || exam.some(question => !examAnswers[question.id])) {
      setError('Responde todas las preguntas del examen final.')
      return
    }
    setBusy(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('discipulado_enviar_intento', {
      p_asignacion_id: assignment.id,
      p_respuestas: examAnswers,
    })
    if (rpcError) setError(rpcError.message)
    else {
      setNotice(`Examen enviado: ${Math.round(Number(data?.calificacion || 0))}%. Queda pendiente de revisión pastoral.`)
      setExamOpen(false)
      await load(false)
    }
    setBusy(false)
  }

  if (loading) return <main className="mx-auto grid min-h-screen max-w-2xl place-items-center bg-[#f4f5f9] px-4"><Loader2 className="h-7 w-7 animate-spin text-violet-600" /></main>

  if (approvedWithoutCourse) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-28 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6">
        <Link href="/estudios" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><ChevronLeft className="h-4 w-4" /> Estudios</Link>
        <section className="mt-8 rounded-[28px] border border-amber-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-500"><BadgeCheck className="h-8 w-8" /></div>
          <h1 className="mt-4 text-2xl font-bold text-[#171923]">Tu discipulado ya está reconocido</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Un pastor registró que ya completaste tu discipulado previamente. No necesitas repetir el curso.</p>
          <Link href="/perfil" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-amber-950">Ver distintivo en mi perfil</Link>
        </section>
      </main>
    )
  }

  if (noCourse || !course || !assignment) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-28 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6">
        <Link href="/estudios" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><ChevronLeft className="h-4 w-4" /> Estudios</Link>
        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <GraduationCap className="mx-auto h-10 w-10 text-violet-600" />
          <h1 className="mt-4 text-xl font-bold text-[#171923]">El discipulado todavía no está publicado</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Cuando el pastor publique el curso activo, podrás comenzar desde aquí automáticamente.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/estudios" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500"><ChevronLeft className="h-4 w-4" /> Estudios</Link>
      <header className="rounded-[26px] bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 p-5 text-indigo-50 shadow-[0_14px_34px_rgba(79,70,229,.2)] sm:p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-indigo-100/80">Tu discipulado</p>
        <h1 className="mt-1 text-2xl font-bold tracking-[-.03em]">{course.titulo}</h1>
        {course.descripcion && <p className="mt-2 text-sm leading-6 text-indigo-100/80">{course.descripcion}</p>}
        <div className="mt-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-100/75"><span>Progreso</span><span>{completedCount}/{lessons.length}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-950/25"><div className="h-full rounded-full bg-indigo-50 transition-all" style={{ width: `${progressPercent}%` }} /></div>
      </header>

      {(notice || error) && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>{error || notice}</div>}

      {assignment.estado === 'aprobado' ? (
        <section className="mt-5 rounded-[24px] border border-amber-200 bg-white p-5 text-center shadow-sm">
          <BadgeCheck className="mx-auto h-9 w-9 text-amber-500" />
          <h2 className="mt-3 text-lg font-bold text-[#171923]">Discipulado completado</h2>
          <p className="mt-1 text-sm text-slate-500">Tu pastor aprobó el proceso. El distintivo ya aparece en tu perfil.</p>
          <Link href="/perfil" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-amber-950">Ver mi perfil</Link>
        </section>
      ) : assignment.estado === 'revision' ? (
        <section className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 h-6 w-6 shrink-0" /><div><h2 className="font-bold">Examen enviado</h2><p className="mt-1 text-sm leading-6 text-amber-800">Tu resultado de {Math.round(Number(assignment.calificacion || 0))}% está esperando revisión pastoral.</p></div></div>
        </section>
      ) : (
        <>
          <section className="mt-5 space-y-2">
            <h2 className="px-1 text-sm font-bold text-[#171923]">Recorrido</h2>
            {lessons.map((lesson, index) => {
              const complete = completedIds.has(lesson.id)
              const unlocked = index === 0 || lessons.slice(0, index).every(item => completedIds.has(item.id))
              const active = selectedLesson?.id === lesson.id
              return (
                <button key={lesson.id} type="button" disabled={!unlocked} onClick={() => unlocked && setSelectedLessonId(lesson.id)} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${active ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'} ${!unlocked ? 'opacity-55' : 'active:scale-[.99]'}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${complete ? 'bg-emerald-100 text-emerald-700' : unlocked ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}>{complete ? <Check className="h-4 w-4" /> : unlocked ? lesson.orden : <LockKeyhole className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#171923]">{lesson.titulo}</span><span className="mt-0.5 block text-[11px] text-slate-500">{complete ? 'Completada' : unlocked ? 'Disponible' : 'Completa la anterior para continuar'}</span></span>
                  {unlocked && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                </button>
              )
            })}
          </section>

          {selectedLesson && selectedUnlocked && (
            <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-violet-600">Lección {selectedLesson.orden}</p><h2 className="mt-1 text-lg font-bold text-[#171923]">{selectedLesson.titulo}</h2>{selectedLesson.descripcion && <p className="mt-1 text-sm leading-6 text-slate-500">{selectedLesson.descripcion}</p>}</div>
              {selectedLesson.video_url ? <YouTubeLessonPlayer videoUrl={selectedLesson.video_url} lessonId={selectedLesson.id} onEnded={() => void markVideoEnded()} /> : <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">Esta lección todavía no tiene video.</div>}
              {selectedLesson.contenido && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selectedLesson.contenido}</p>}

              {selectedComplete && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><CircleCheck className="h-5 w-5" /> Lección completada</div>}
              {!selectedComplete && !selectedViewed && <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">Mira el video hasta el final. Al terminar se habilitarán las preguntas de esta lección.</p>}

              {!selectedComplete && selectedViewed && quiz.length > 0 && (
                <form onSubmit={submitLessonQuiz} className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                  <div><h3 className="font-bold text-[#171923]">Comprueba lo aprendido</h3><p className="mt-1 text-xs text-slate-500">Debes responder correctamente para desbloquear la siguiente lección.</p></div>
                  {quiz.map((question, index) => <fieldset key={question.id} className="rounded-2xl bg-slate-50 p-4"><legend className="text-sm font-bold text-[#171923]">{index + 1}. {question.enunciado}</legend><div className="mt-3 space-y-2">{question.opciones.map(option => <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm ${quizAnswers[question.id] === option.id ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-700'}`}><input type="radio" name={question.id} value={option.id} checked={quizAnswers[question.id] === option.id} onChange={() => setQuizAnswers(current => ({ ...current, [question.id]: option.id }))} className="mt-0.5 h-4 w-4 accent-violet-600" /><span>{option.texto}</span></label>)}</div></fieldset>)}
                  <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-violet-50 disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Comprobar respuestas</button>
                </form>
              )}
            </section>
          )}

          <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><ClipboardCheck className="h-5 w-5" /></div><div><h2 className="font-bold text-[#171923]">Examínate</h2><p className="mt-1 text-xs leading-5 text-slate-500">El examen general se habilita al completar todas las lecciones.</p></div></div>
            {latestAttempt && <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Último resultado</p><p className="mt-1 text-lg font-bold text-[#171923]">{Math.round(Number(latestAttempt.calificacion))}% <span className="text-xs font-medium text-slate-400">· {latestAttempt.correctas}/{latestAttempt.total}</span></p></div>}
            <button type="button" onClick={() => void openExam()} disabled={busy || !allLessonsComplete} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-indigo-50 disabled:cursor-not-allowed disabled:opacity-40">{assignment.estado === 'rechazado' ? <RotateCcw className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}{assignment.estado === 'rechazado' ? 'Volver a presentar examen' : 'Presentar examen final'}</button>
            {!allLessonsComplete && <p className="mt-2 text-center text-[11px] text-slate-400">Completa {lessons.length - completedCount} lección(es) para habilitarlo.</p>}
            {assignment.estado === 'rechazado' && assignment.notas_revision && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">Nota pastoral: {assignment.notas_revision}</p>}
          </section>
        </>
      )}

      {examOpen && (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/45 sm:items-center sm:justify-center">
          <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#f4f5f9] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-xl sm:rounded-[28px] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-indigo-600">Examen final</p><h2 className="mt-1 text-xl font-bold text-[#171923]">{course.titulo}</h2></div><button type="button" onClick={() => setExamOpen(false)} className="h-10 rounded-full bg-white px-4 text-xs font-bold text-slate-700 shadow-sm">Cerrar</button></div>
            <form onSubmit={submitExam} className="space-y-4">
              {exam.map((question, index) => <fieldset key={question.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><legend className="text-sm font-bold leading-6 text-[#171923]">{index + 1}. {question.enunciado}</legend><div className="mt-3 space-y-2">{question.opciones.map(option => <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm ${examAnswers[question.id] === option.id ? 'border-indigo-300 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-700'}`}><input type="radio" name={question.id} value={option.id} checked={examAnswers[question.id] === option.id} onChange={() => setExamAnswers(current => ({ ...current, [question.id]: option.id }))} className="mt-0.5 h-4 w-4 accent-indigo-600" /><span>{option.texto}</span></label>)}</div></fieldset>)}
              <button disabled={busy || exam.length === 0} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-indigo-50 disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Enviar examen</button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
