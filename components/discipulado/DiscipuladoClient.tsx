'use client'

import {
  type FormEvent,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  PlayCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  userId: string
  canManage: boolean
  isAdmin: boolean
}

type Course = {
  id: string
  titulo: string
  descripcion: string
  estado: 'borrador' | 'publicado' | 'archivado'
  creado_por: string
  created_at: string
  updated_at: string
}

type Lesson = {
  id: string
  curso_id: string
  titulo: string
  descripcion: string
  video_url: string | null
  contenido: string
  orden: number
}

type Question = {
  id: string
  curso_id: string
  enunciado: string
  orden: number
}

type Option = {
  id: string
  pregunta_id: string
  texto: string
  es_correcta: boolean
  orden: number
}

type Assignment = {
  id: string
  curso_id: string
  profile_id: string
  asignado_por: string | null
  estado: 'asignado' | 'en_progreso' | 'revision' | 'aprobado' | 'rechazado'
  calificacion: number | null
  enviado_en: string | null
  revisado_en: string | null
  revisado_por: string | null
  notas_revision: string | null
}

type LessonProgress = {
  asignacion_id: string
  leccion_id: string
  completado_en: string
}

type Attempt = {
  id: string
  asignacion_id: string
  calificacion: number
  correctas: number
  total: number
  enviado_en: string
}

type Profile = {
  id: string
  nombre_completo: string
  avatar_url: string | null
  rol: string
}

type Manager = {
  profile_id: string
  asignado_por: string | null
  activo: boolean
}

type ExamQuestion = {
  id: string
  enunciado: string
  orden: number
  opciones: Array<{ id: string; texto: string; orden: number }>
}

const panel = 'rounded-[22px] border border-slate-200/80 bg-white shadow-sm'
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500'
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-indigo-50 transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50'

function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${className}`} />
}

function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${className}`} />
}

function SelectField({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${className}`} />
}

function toEmbedUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.hostname.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

function statusLabel(status: Assignment['estado']) {
  if (status === 'asignado') return 'Asignado'
  if (status === 'en_progreso') return 'En progreso'
  if (status === 'revision') return 'En revisión'
  if (status === 'aprobado') return 'Aprobado'
  return 'Requiere repetir'
}

function statusClass(status: Assignment['estado']) {
  if (status === 'aprobado') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (status === 'revision') return 'bg-amber-50 text-amber-700 ring-amber-100'
  if (status === 'rechazado') return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (status === 'en_progreso') return 'bg-indigo-50 text-indigo-700 ring-indigo-100'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

export default function DiscipuladoClient({ userId, canManage, isAdmin }: Props) {
  const supabase = useMemo(() => createClient() as any, [])
  const [mode, setMode] = useState<'mine' | 'manage'>(canManage ? 'manage' : 'mine')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [newCourseOpen, setNewCourseOpen] = useState(false)
  const [newLessonOpen, setNewLessonOpen] = useState(false)
  const [newQuestionOpen, setNewQuestionOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [managersOpen, setManagersOpen] = useState(false)
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([])
  const [examOpen, setExamOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const loadAll = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    setError(null)

    const base = await Promise.all([
      supabase.from('discipulado_cursos').select('*').order('created_at', { ascending: false }),
      supabase.from('discipulado_lecciones').select('*').order('orden'),
      supabase.from('discipulado_preguntas').select('*').order('orden'),
      supabase.from('discipulado_asignaciones').select('*').order('created_at', { ascending: false }),
      supabase.from('discipulado_leccion_progreso').select('*'),
      supabase.from('discipulado_intentos').select('*').order('enviado_en', { ascending: false }),
    ])

    const firstError = base.find((result: any) => result.error)?.error
    if (firstError) setError(firstError.message)
    setCourses(base[0].data || [])
    setLessons(base[1].data || [])
    setQuestions(base[2].data || [])
    setAssignments(base[3].data || [])
    setProgress(base[4].data || [])
    setAttempts(base[5].data || [])

    if (canManage) {
      const managerData = await Promise.all([
        supabase.from('discipulado_opciones').select('*').order('orden'),
        supabase.from('profiles').select('id,nombre_completo,avatar_url,rol').eq('activo', true).eq('estado_cuenta', 'activo').order('nombre_completo'),
        supabase.from('discipulado_gestores').select('*').eq('activo', true),
      ])
      const managerError = managerData.find((result: any) => result.error)?.error
      if (managerError) setError(managerError.message)
      setOptions(managerData[0].data || [])
      setProfiles(managerData[1].data || [])
      setManagers(managerData[2].data || [])
    }

    if (showLoader) setLoading(false)
  }, [canManage, supabase])

  useEffect(() => {
    void loadAll(true)
  }, [loadAll])

  const myAssignments = useMemo(
    () => assignments.filter(assignment => assignment.profile_id === userId),
    [assignments, userId],
  )

  useEffect(() => {
    if (mode === 'manage') {
      if (!selectedCourseId || !courses.some(course => course.id === selectedCourseId)) {
        setSelectedCourseId(courses[0]?.id || null)
      }
      return
    }

    const allowedCourseIds = new Set(myAssignments.map(assignment => assignment.curso_id))
    if (!selectedCourseId || !allowedCourseIds.has(selectedCourseId)) {
      setSelectedCourseId(myAssignments[0]?.curso_id || null)
    }
  }, [courses, mode, myAssignments, selectedCourseId])

  async function run(action: () => Promise<any>, success?: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const result = await action()
      if (result?.error) throw result.error
      if (success) setNotice(success)
      await loadAll(false)
      return result
    } catch (err: any) {
      setError(err?.message || 'No se pudo completar la acción.')
      return null
    } finally {
      setBusy(false)
    }
  }

  const selectedCourse = courses.find(course => course.id === selectedCourseId) || null
  const selectedLessons = lessons.filter(lesson => lesson.curso_id === selectedCourseId).sort((a, b) => a.orden - b.orden)
  const selectedQuestions = questions.filter(question => question.curso_id === selectedCourseId).sort((a, b) => a.orden - b.orden)
  const selectedAssignments = assignments.filter(assignment => assignment.curso_id === selectedCourseId)
  const myAssignment = myAssignments.find(assignment => assignment.curso_id === selectedCourseId) || null
  const completedLessonIds = new Set(progress.filter(item => item.asignacion_id === myAssignment?.id).map(item => item.leccion_id))
  const completedCount = selectedLessons.filter(lesson => completedLessonIds.has(lesson.id)).length
  const progressPercent = selectedLessons.length ? Math.round((completedCount / selectedLessons.length) * 100) : 0
  const latestAttempt = attempts.find(attempt => attempt.asignacion_id === myAssignment?.id)
  const profileMap = new Map(profiles.map(profile => [profile.id, profile]))

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const titulo = String(form.get('titulo') || '').trim()
    if (!titulo) return

    const result = await run(
      () => supabase.from('discipulado_cursos').insert({
        titulo,
        descripcion: String(form.get('descripcion') || '').trim(),
        creado_por: userId,
      }).select('id').single(),
      'Curso creado.',
    )
    if (result?.data?.id) setSelectedCourseId(result.data.id)
    if (result && !result.error) setNewCourseOpen(false)
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourse) return
    const form = new FormData(event.currentTarget)
    const nextState = String(form.get('estado'))

    if (nextState === 'publicado') {
      const validQuestions = selectedQuestions.every(question => {
        const items = options.filter(option => option.pregunta_id === question.id)
        return items.length >= 2 && items.some(option => option.es_correcta)
      })
      if (!selectedLessons.length || !selectedQuestions.length || !validQuestions) {
        setError('Antes de publicar agrega al menos una lección y una evaluación completa con respuestas correctas definidas.')
        return
      }
    }

    await run(() => supabase.from('discipulado_cursos').update({
      titulo: String(form.get('titulo') || '').trim(),
      descripcion: String(form.get('descripcion') || '').trim(),
      estado: nextState,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedCourse.id), 'Curso actualizado.')
  }

  async function createLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourseId) return
    const form = new FormData(event.currentTarget)
    const titulo = String(form.get('titulo') || '').trim()
    if (!titulo) return

    await run(() => supabase.from('discipulado_lecciones').insert({
      curso_id: selectedCourseId,
      titulo,
      descripcion: String(form.get('descripcion') || '').trim(),
      video_url: String(form.get('video_url') || '').trim() || null,
      contenido: String(form.get('contenido') || '').trim(),
      orden: selectedLessons.length ? Math.max(...selectedLessons.map(item => item.orden)) + 1 : 1,
    }), 'Lección agregada.')
    setNewLessonOpen(false)
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>, lesson: Lesson) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await run(() => supabase.from('discipulado_lecciones').update({
      titulo: String(form.get('titulo') || '').trim(),
      descripcion: String(form.get('descripcion') || '').trim(),
      video_url: String(form.get('video_url') || '').trim() || null,
      contenido: String(form.get('contenido') || '').trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', lesson.id), 'Lección actualizada.')
  }

  async function createQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourseId) return
    const form = new FormData(event.currentTarget)
    const enunciado = String(form.get('enunciado') || '').trim()
    const values = [1, 2, 3, 4]
      .map(index => String(form.get(`opcion_${index}`) || '').trim())
      .filter(Boolean)
    const correctIndex = Number(form.get('correcta') || 1) - 1

    if (!enunciado || values.length < 2) {
      setError('La pregunta necesita enunciado y al menos dos opciones.')
      return
    }

    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const { data: question, error: questionError } = await supabase.from('discipulado_preguntas').insert({
        curso_id: selectedCourseId,
        enunciado,
        orden: selectedQuestions.length ? Math.max(...selectedQuestions.map(item => item.orden)) + 1 : 1,
      }).select('id').single()
      if (questionError) throw questionError

      const { error: optionsError } = await supabase.from('discipulado_opciones').insert(values.map((texto, index) => ({
        pregunta_id: question.id,
        texto,
        orden: index + 1,
        es_correcta: index === Math.min(correctIndex, values.length - 1),
      })))
      if (optionsError) throw optionsError

      setNotice('Pregunta agregada.')
      setNewQuestionOpen(false)
      await loadAll(false)
    } catch (err: any) {
      setError(err?.message || 'No se pudo agregar la pregunta.')
    } finally {
      setBusy(false)
    }
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>, question: Question) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const questionOptions = options.filter(item => item.pregunta_id === question.id).sort((a, b) => a.orden - b.orden)
    const correctId = String(form.get('correcta') || '')

    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const { error: questionError } = await supabase.from('discipulado_preguntas').update({
        enunciado: String(form.get('enunciado') || '').trim(),
      }).eq('id', question.id)
      if (questionError) throw questionError

      for (const option of questionOptions) {
        const { error: optionError } = await supabase.from('discipulado_opciones').update({
          texto: String(form.get(`option_${option.id}`) || '').trim(),
          es_correcta: option.id === correctId,
        }).eq('id', option.id)
        if (optionError) throw optionError
      }

      setNotice('Pregunta actualizada.')
      await loadAll(false)
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la pregunta.')
    } finally {
      setBusy(false)
    }
  }

  async function assignMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourseId) return
    const form = new FormData(event.currentTarget)
    const profileId = String(form.get('profile_id') || '')
    if (!profileId) return

    await run(() => supabase.from('discipulado_asignaciones').upsert({
      curso_id: selectedCourseId,
      profile_id: profileId,
      asignado_por: userId,
    }, { onConflict: 'curso_id,profile_id', ignoreDuplicates: true }), 'Persona asignada.')
    setAssignOpen(false)
  }

  async function reviewAssignment(assignment: Assignment, decision: 'aprobado' | 'rechazado', form: HTMLFormElement | null) {
    const notes = form ? String(new FormData(form).get('notas') || '').trim() || null : null
    await run(() => supabase.rpc('discipulado_revisar', {
      p_asignacion_id: assignment.id,
      p_decision: decision,
      p_notas: notes,
    }), decision === 'aprobado' ? 'Discipulado aprobado.' : 'Se solicitó repetir la evaluación.')
  }

  async function addManager(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const profileId = String(form.get('profile_id') || '')
    if (!profileId) return
    await run(() => supabase.from('discipulado_gestores').upsert({
      profile_id: profileId,
      asignado_por: userId,
      activo: true,
    }), 'Gestor autorizado.')
  }

  async function openExam() {
    if (!myAssignment) return
    setBusy(true)
    setError(null)
    setNotice(null)
    const { data, error: examError } = await supabase.rpc('discipulado_obtener_evaluacion', {
      p_asignacion_id: myAssignment.id,
    })
    setBusy(false)
    if (examError) {
      setError(examError.message)
      return
    }
    setExamQuestions((data || []) as ExamQuestion[])
    setAnswers({})
    setExamOpen(true)
  }

  async function submitExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!myAssignment || examQuestions.some(question => !answers[question.id])) {
      setError('Responde todas las preguntas antes de enviar.')
      return
    }

    const result = await run(() => supabase.rpc('discipulado_enviar_intento', {
      p_asignacion_id: myAssignment.id,
      p_respuestas: answers,
    }))
    if (result?.data) {
      setNotice(`Evaluación enviada: ${Number(result.data.calificacion).toFixed(0)}%. Queda en revisión pastoral.`)
      setExamOpen(false)
    }
  }

  async function toggleLesson(lesson: Lesson) {
    if (!myAssignment) return
    const completed = completedLessonIds.has(lesson.id)
    await run(() => supabase.rpc('discipulado_marcar_leccion', {
      p_asignacion_id: myAssignment.id,
      p_leccion_id: lesson.id,
      p_completada: !completed,
    }))
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-28 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6">
        <div className="flex min-h-[45vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <header className="mb-5">
        <Link href="/estudios" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500">
          <ChevronLeft className="h-4 w-4" /> Estudios
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Formación VIDA</p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#171923] sm:text-3xl">Discipulado</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">Lecciones, evaluación y aprobación pastoral en un solo recorrido.</p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
      </header>

      {canManage && (
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1">
          <button type="button" onClick={() => setMode('mine')} className={`min-h-10 rounded-xl text-xs font-bold transition ${mode === 'mine' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Mi discipulado</button>
          <button type="button" onClick={() => setMode('manage')} className={`min-h-10 rounded-xl text-xs font-bold transition ${mode === 'manage' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Gestionar</button>
        </div>
      )}

      {(notice || error) && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
          {error || notice}
        </div>
      )}

      {mode === 'mine' ? (
        <div className="space-y-5">
          {myAssignments.length === 0 ? (
            <section className={`${panel} px-5 py-10 text-center`}>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo-600"><BookOpenCheck className="h-7 w-7" /></div>
              <h2 className="mt-4 text-lg font-bold text-[#171923]">Todavía no tienes un curso asignado</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">Cuando un pastor o responsable te asigne el discipulado, aparecerá aquí con tus lecciones y progreso.</p>
            </section>
          ) : (
            <>
              {myAssignments.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {myAssignments.map(assignment => {
                    const course = courses.find(item => item.id === assignment.curso_id)
                    return (
                      <button key={assignment.id} type="button" onClick={() => setSelectedCourseId(assignment.curso_id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${selectedCourseId === assignment.curso_id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
                        {course?.titulo || 'Curso'}
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedCourse && myAssignment && (
                <>
                  <section className={`${panel} overflow-hidden`}>
                    <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-5 py-5 text-white sm:px-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1 ring-white/20 ${myAssignment.estado === 'aprobado' ? 'bg-emerald-400/25' : 'bg-white/15'}`}>{statusLabel(myAssignment.estado)}</span>
                        {myAssignment.calificacion != null && <span className="text-sm font-bold">{Math.round(Number(myAssignment.calificacion))}%</span>}
                      </div>
                      <h2 className="mt-4 text-xl font-bold tracking-[-0.02em]">{selectedCourse.titulo}</h2>
                      {selectedCourse.descripcion && <p className="mt-1.5 text-sm leading-relaxed text-white/80">{selectedCourse.descripcion}</p>}
                      <div className="mt-5">
                        <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/70"><span>Progreso de lecciones</span><span>{completedCount}/{selectedLessons.length}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${progressPercent}%` }} /></div>
                      </div>
                    </div>
                    {myAssignment.estado === 'aprobado' && (
                      <div className="flex items-center gap-3 border-t border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-800">
                        <BadgeCheck className="h-6 w-6 shrink-0" />
                        <div><p className="text-sm font-bold">Discipulado completado y aprobado</p><p className="mt-0.5 text-xs text-emerald-700">Esta aprobación también aparece como distintivo en tu perfil.</p></div>
                      </div>
                    )}
                    {myAssignment.estado === 'revision' && (
                      <div className="flex items-center gap-3 border-t border-amber-100 bg-amber-50 px-5 py-4 text-amber-800">
                        <ClipboardCheck className="h-6 w-6 shrink-0" />
                        <div><p className="text-sm font-bold">Evaluación enviada</p><p className="mt-0.5 text-xs text-amber-700">Tu resultado está esperando revisión pastoral.</p></div>
                      </div>
                    )}
                    {myAssignment.estado === 'rechazado' && (
                      <div className="border-t border-rose-100 bg-rose-50 px-5 py-4 text-rose-800">
                        <p className="text-sm font-bold">Necesitas repetir la evaluación</p>
                        {myAssignment.notas_revision && <p className="mt-1 text-xs leading-relaxed">{myAssignment.notas_revision}</p>}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <div className="px-1"><h2 className="text-base font-bold text-[#171923]">Lecciones</h2><p className="mt-0.5 text-xs text-slate-500">Completa cada lección antes de presentar la evaluación.</p></div>
                    {selectedLessons.map(lesson => {
                      const complete = completedLessonIds.has(lesson.id)
                      const embed = toEmbedUrl(lesson.video_url)
                      return (
                        <details key={lesson.id} className={`${panel} group overflow-hidden`}>
                          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:px-5">
                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{complete ? <Check className="h-5 w-5" /> : lesson.orden}</span>
                            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#171923]">{lesson.titulo}</span>{lesson.descripcion && <span className="mt-0.5 block line-clamp-1 text-xs text-slate-500">{lesson.descripcion}</span>}</span>
                            <ChevronRight className="h-4 w-4 text-slate-400 transition group-open:rotate-90" />
                          </summary>
                          <div className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-5">
                            {embed ? (
                              <div className="mb-4 aspect-video overflow-hidden rounded-2xl bg-slate-950">
                                <iframe src={embed} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={lesson.titulo} />
                              </div>
                            ) : lesson.video_url ? (
                              <a href={lesson.video_url} target="_blank" rel="noreferrer" className="mb-4 flex min-h-12 items-center gap-3 rounded-2xl bg-indigo-50 px-4 text-sm font-bold text-indigo-700"><PlayCircle className="h-5 w-5" /> Abrir video de la lección</a>
                            ) : null}
                            {lesson.contenido && <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{lesson.contenido}</p>}
                            <button type="button" disabled={busy || myAssignment.estado === 'aprobado'} onClick={() => void toggleLesson(lesson)} className={`mt-4 w-full ${complete ? secondaryButton : primaryButton}`}>
                              {complete ? <><CircleCheck className="h-4 w-4" /> Completada</> : <><Check className="h-4 w-4" /> Marcar como completada</>}
                            </button>
                          </div>
                        </details>
                      )
                    })}
                  </section>

                  <section className={`${panel} p-5 sm:p-6`}>
                    <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700"><ClipboardCheck className="h-5 w-5" /></div><div><h2 className="font-bold text-[#171923]">Evaluación final</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Tu calificación se guarda y después un pastor o responsable decide la aprobación.</p></div></div>
                    {latestAttempt && <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Último intento</p><p className="mt-1 text-lg font-bold text-[#171923]">{Math.round(Number(latestAttempt.calificacion))}% <span className="text-xs font-medium text-slate-400">· {latestAttempt.correctas}/{latestAttempt.total} correctas</span></p></div>}
                    {myAssignment.estado !== 'aprobado' && myAssignment.estado !== 'revision' && (
                      <button type="button" onClick={() => void openExam()} disabled={busy || completedCount < selectedLessons.length || selectedLessons.length === 0} className={`mt-4 w-full ${primaryButton}`}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                        {myAssignment.estado === 'rechazado' ? 'Volver a presentar evaluación' : 'Presentar evaluación'}
                      </button>
                    )}
                    {completedCount < selectedLessons.length && <p className="mt-2 text-center text-[11px] text-slate-400">Completa las {selectedLessons.length - completedCount} lección(es) pendiente(s) para habilitarla.</p>}
                  </section>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <section className={`${panel} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-bold text-[#171923]">Cursos</h2><p className="mt-0.5 text-xs text-slate-500">Crea, publica y administra el discipulado.</p></div>
              <button type="button" onClick={() => setNewCourseOpen(value => !value)} className={secondaryButton}><Plus className="h-4 w-4" /> Nuevo</button>
            </div>
            {newCourseOpen && (
              <form onSubmit={createCourse} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <div><label className={labelClass}>Nombre del curso</label><TextInput name="titulo" required placeholder="Discipulado VIDA" /></div>
                <div><label className={labelClass}>Descripción</label><TextArea name="descripcion" className="min-h-20 resize-y" placeholder="Objetivo y recorrido del curso" /></div>
                <button disabled={busy} className={primaryButton}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Crear curso</button>
              </form>
            )}
            {courses.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {courses.map(course => <button key={course.id} type="button" onClick={() => setSelectedCourseId(course.id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${selectedCourseId === course.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}>{course.titulo}</button>)}
              </div>
            )}
          </section>

          {!selectedCourse ? (
            <section className={`${panel} px-5 py-10 text-center`}><GraduationCap className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">Crea el primer curso para comenzar.</p></section>
          ) : (
            <>
              <section className={`${panel} p-5 sm:p-6`}>
                <form onSubmit={saveCourse} className="space-y-4">
                  <div><label className={labelClass}>Título</label><TextInput name="titulo" defaultValue={selectedCourse.titulo} required /></div>
                  <div><label className={labelClass}>Descripción</label><TextArea name="descripcion" defaultValue={selectedCourse.descripcion} className="min-h-24 resize-y" /></div>
                  <div><label className={labelClass}>Estado</label><SelectField name="estado" defaultValue={selectedCourse.estado}><option value="borrador">Borrador</option><option value="publicado">Publicado</option><option value="archivado">Archivado</option></SelectField></div>
                  <button disabled={busy} className={primaryButton}>Guardar curso</button>
                </form>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3 px-1"><div><h2 className="font-bold text-[#171923]">Lecciones</h2><p className="text-xs text-slate-500">{selectedLessons.length} en este curso</p></div><button type="button" onClick={() => setNewLessonOpen(value => !value)} className={secondaryButton}><Plus className="h-4 w-4" /> Lección</button></div>
                {newLessonOpen && (
                  <form onSubmit={createLesson} className={`${panel} space-y-3 p-4 sm:p-5`}>
                    <div><label className={labelClass}>Título</label><TextInput name="titulo" required /></div>
                    <div><label className={labelClass}>Descripción breve</label><TextInput name="descripcion" /></div>
                    <div><label className={labelClass}>Enlace del video</label><TextInput name="video_url" type="url" placeholder="https://youtube.com/..." /></div>
                    <div><label className={labelClass}>Contenido complementario</label><TextArea name="contenido" className="min-h-24 resize-y" /></div>
                    <button disabled={busy} className={primaryButton}>Agregar lección</button>
                  </form>
                )}
                {selectedLessons.map(lesson => (
                  <details key={lesson.id} className={`${panel} group overflow-hidden`}>
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-extrabold text-indigo-700">{lesson.orden}</span><span className="min-w-0 flex-1 text-sm font-bold text-[#171923]">{lesson.titulo}</span><ChevronRight className="h-4 w-4 text-slate-400 transition group-open:rotate-90" /></summary>
                    <form onSubmit={event => void saveLesson(event, lesson)} className="space-y-3 border-t border-slate-100 p-4">
                      <div><label className={labelClass}>Título</label><TextInput name="titulo" defaultValue={lesson.titulo} required /></div>
                      <div><label className={labelClass}>Descripción</label><TextInput name="descripcion" defaultValue={lesson.descripcion} /></div>
                      <div><label className={labelClass}>Video</label><TextInput name="video_url" defaultValue={lesson.video_url || ''} /></div>
                      <div><label className={labelClass}>Contenido</label><TextArea name="contenido" defaultValue={lesson.contenido} className="min-h-24 resize-y" /></div>
                      <div className="flex gap-2"><button disabled={busy} className={primaryButton}>Guardar</button><button type="button" disabled={busy} onClick={() => void run(() => supabase.from('discipulado_lecciones').delete().eq('id', lesson.id), 'Lección eliminada.')} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Eliminar</button></div>
                    </form>
                  </details>
                ))}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3 px-1"><div><h2 className="font-bold text-[#171923]">Evaluación</h2><p className="text-xs text-slate-500">{selectedQuestions.length} preguntas</p></div><button type="button" onClick={() => setNewQuestionOpen(value => !value)} className={secondaryButton}><Plus className="h-4 w-4" /> Pregunta</button></div>
                {newQuestionOpen && (
                  <form onSubmit={createQuestion} className={`${panel} space-y-3 p-4 sm:p-5`}>
                    <div><label className={labelClass}>Pregunta</label><TextArea name="enunciado" className="min-h-20 resize-y" required /></div>
                    {[1, 2, 3, 4].map(index => <div key={index}><label className={labelClass}>Opción {index}{index > 2 ? ' (opcional)' : ''}</label><TextInput name={`opcion_${index}`} required={index <= 2} /></div>)}
                    <div><label className={labelClass}>Respuesta correcta</label><SelectField name="correcta" defaultValue="1"><option value="1">Opción 1</option><option value="2">Opción 2</option><option value="3">Opción 3</option><option value="4">Opción 4</option></SelectField></div>
                    <button disabled={busy} className={primaryButton}>Agregar pregunta</button>
                  </form>
                )}
                {selectedQuestions.map(question => {
                  const questionOptions = options.filter(option => option.pregunta_id === question.id).sort((a, b) => a.orden - b.orden)
                  return (
                    <details key={question.id} className={`${panel} group overflow-hidden`}>
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-extrabold text-violet-700">{question.orden}</span><span className="min-w-0 flex-1 line-clamp-2 text-sm font-bold text-[#171923]">{question.enunciado}</span><ChevronRight className="h-4 w-4 text-slate-400 transition group-open:rotate-90" /></summary>
                      <form onSubmit={event => void saveQuestion(event, question)} className="space-y-3 border-t border-slate-100 p-4">
                        <div><label className={labelClass}>Enunciado</label><TextArea name="enunciado" defaultValue={question.enunciado} className="min-h-20" /></div>
                        {questionOptions.map(option => <label key={option.id} className="flex items-center gap-3"><input type="radio" name="correcta" value={option.id} defaultChecked={option.es_correcta} className="h-4 w-4 accent-indigo-600" /><TextInput name={`option_${option.id}`} defaultValue={option.texto} /></label>)}
                        <div className="flex gap-2"><button disabled={busy} className={primaryButton}>Guardar</button><button type="button" disabled={busy} onClick={() => void run(() => supabase.from('discipulado_preguntas').delete().eq('id', question.id), 'Pregunta eliminada.')} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Eliminar</button></div>
                      </form>
                    </details>
                  )
                })}
              </section>

              <section className={`${panel} p-4 sm:p-5`}>
                <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-[#171923]">Personas asignadas</h2><p className="mt-0.5 text-xs text-slate-500">Progreso, nota y aprobación pastoral.</p></div><button type="button" onClick={() => setAssignOpen(value => !value)} className={secondaryButton}><UserPlus className="h-4 w-4" /> Asignar</button></div>
                {assignOpen && (
                  <form onSubmit={assignMember} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <SelectField name="profile_id" defaultValue="" required><option value="" disabled>Seleccionar persona</option>{profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.nombre_completo} · {profile.rol}</option>)}</SelectField>
                    <button disabled={busy} className={primaryButton}>Agregar</button>
                  </form>
                )}
                <div className="mt-4 divide-y divide-slate-100">
                  {selectedAssignments.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">Aún no hay personas asignadas.</p> : selectedAssignments.map(assignment => {
                    const profile = profileMap.get(assignment.profile_id)
                    const completed = progress.filter(item => item.asignacion_id === assignment.id).length
                    return (
                      <div key={assignment.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#171923]">{profile?.nombre_completo || 'Miembro'}</p><p className="mt-0.5 text-xs text-slate-500">{completed}/{selectedLessons.length} lecciones{assignment.calificacion != null ? ` · ${Math.round(Number(assignment.calificacion))}%` : ''}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${statusClass(assignment.estado)}`}>{statusLabel(assignment.estado)}</span></div>
                        {assignment.estado === 'revision' && (
                          <form className="mt-3 rounded-2xl bg-slate-50 p-3">
                            <TextArea name="notas" className="min-h-16 resize-y" placeholder="Nota pastoral opcional" />
                            <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={event => void reviewAssignment(assignment, 'rechazado', event.currentTarget.form)} className="min-h-10 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700">Pedir repetir</button><button type="button" disabled={busy} onClick={event => void reviewAssignment(assignment, 'aprobado', event.currentTarget.form)} className="min-h-10 rounded-xl bg-emerald-600 text-xs font-bold text-white">Aprobar</button></div>
                          </form>
                        )}
                        <button type="button" disabled={busy} onClick={() => void run(() => supabase.from('discipulado_asignaciones').delete().eq('id', assignment.id), 'Asignación retirada.')} className="mt-2 text-[11px] font-bold text-slate-400 hover:text-rose-600">Retirar asignación</button>
                      </div>
                    )
                  })}
                </div>
              </section>

              {isAdmin && (
                <section className={`${panel} p-4 sm:p-5`}>
                  <button type="button" onClick={() => setManagersOpen(value => !value)} className="flex w-full items-center justify-between gap-3 text-left">
                    <span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><ShieldCheck className="h-5 w-5" /></span><span><span className="block text-sm font-bold text-[#171923]">Gestores de Discipulado</span><span className="mt-0.5 block text-xs text-slate-500">Autoriza a una persona para administrar cursos.</span></span></span><ChevronRight className={`h-4 w-4 text-slate-400 transition ${managersOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {managersOpen && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <form onSubmit={addManager} className="flex gap-2"><SelectField name="profile_id" defaultValue="" required><option value="" disabled>Seleccionar persona</option>{profiles.filter(profile => !['pastor', 'administrador'].includes(profile.rol)).map(profile => <option key={profile.id} value={profile.id}>{profile.nombre_completo} · {profile.rol}</option>)}</SelectField><button disabled={busy} className={primaryButton}>Autorizar</button></form>
                      <div className="mt-3 divide-y divide-slate-100">{managers.map(manager => { const profile = profileMap.get(manager.profile_id); return <div key={manager.profile_id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-[#171923]">{profile?.nombre_completo || 'Gestor'}</p><p className="text-[11px] text-slate-400">{profile?.rol}</p></div><button type="button" disabled={busy} onClick={() => void run(() => supabase.from('discipulado_gestores').delete().eq('profile_id', manager.profile_id), 'Gestor retirado.')} className="text-xs font-bold text-rose-600">Retirar</button></div> })}</div>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      )}

      {examOpen && (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/45 sm:items-center sm:justify-center">
          <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#f4f5f9] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-xl sm:rounded-[28px] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-indigo-600">Evaluación</p><h2 className="mt-1 text-xl font-bold text-[#171923]">{selectedCourse?.titulo}</h2></div><button type="button" onClick={() => setExamOpen(false)} className="h-10 rounded-full bg-white px-4 text-xs font-bold text-slate-700 shadow-sm">Cerrar</button></div>
            <form onSubmit={submitExam} className="space-y-4">
              {examQuestions.map((question, index) => (
                <fieldset key={question.id} className={`${panel} p-4`}>
                  <legend className="sr-only">Pregunta {index + 1}</legend>
                  <p className="text-sm font-bold leading-6 text-[#171923]"><span className="mr-2 text-indigo-500">{index + 1}.</span>{question.enunciado}</p>
                  <div className="mt-3 space-y-2">{question.opciones.map(option => <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition ${answers[question.id] === option.id ? 'border-indigo-300 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-700'}`}><input type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={() => setAnswers(current => ({ ...current, [question.id]: option.id }))} className="mt-0.5 h-4 w-4 accent-indigo-600" /><span>{option.texto}</span></label>)}</div>
                </fieldset>
              ))}
              <button disabled={busy} className={`w-full ${primaryButton}`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />} Enviar evaluación</button>
            </form>
          </section>
        </div>
      )}

      {busy && <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white shadow-lg"><RefreshCw className="h-4 w-4 animate-spin" /></div>}
    </main>
  )
}
