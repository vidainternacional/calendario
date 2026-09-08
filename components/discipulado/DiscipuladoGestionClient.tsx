'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, BookOpenCheck, ChevronLeft, ChevronRight, ClipboardCheck, GraduationCap, Loader2, Plus, ShieldCheck, Star, Trash2, UserCheck, UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = { userId: string; isAdmin: boolean }
type Course = { id: string; titulo: string; descripcion: string; estado: 'borrador' | 'publicado' | 'archivado'; creado_por: string; created_at: string; updated_at: string }
type Lesson = { id: string; curso_id: string; titulo: string; descripcion: string; video_url: string | null; contenido: string; orden: number }
type Question = { id: string; curso_id: string; leccion_id: string | null; tipo: 'leccion' | 'final'; enunciado: string; orden: number }
type Option = { id: string; pregunta_id: string; texto: string; es_correcta: boolean; orden: number }
type Assignment = { id: string; curso_id: string; profile_id: string; estado: 'asignado' | 'en_progreso' | 'revision' | 'aprobado' | 'rechazado'; calificacion: number | null; updated_at: string; notas_revision: string | null }
type Progress = { asignacion_id: string; leccion_id: string; completado_en: string }
type VideoProgress = { asignacion_id: string; leccion_id: string; visto_completo_en: string }
type Profile = { id: string; nombre_completo: string; rol: string; avatar_url: string | null }
type PriorApproval = { profile_id: string; aprobado_por: string; notas: string | null; aprobado_en: string }
type Manager = { profile_id: string; asignado_por: string | null; activo: boolean }

const panel = 'rounded-[22px] border border-slate-200/80 bg-white shadow-sm'
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500'
const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-violet-50 transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50'

function isYouTubeUrl(value: string) {
  try {
    const url = new URL(value)
    return url.hostname === 'youtu.be' || url.hostname.includes('youtube.com')
  } catch { return false }
}

function statusLabel(status: Assignment['estado']) {
  if (status === 'asignado') return 'Por iniciar'
  if (status === 'en_progreso') return 'En proceso'
  if (status === 'revision') return 'Por revisar'
  if (status === 'aprobado') return 'Aprobado'
  return 'Repetir examen'
}

function statusClass(status: Assignment['estado']) {
  if (status === 'aprobado') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (status === 'revision') return 'bg-amber-50 text-amber-700 ring-amber-100'
  if (status === 'rechazado') return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (status === 'en_progreso') return 'bg-violet-50 text-violet-700 ring-violet-100'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

export default function DiscipuladoGestionClient({ userId, isAdmin }: Props) {
  const supabase = useMemo(() => createClient() as any, [])
  const [tab, setTab] = useState<'curso' | 'personas' | 'previos'>('curso')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [priorApprovals, setPriorApprovals] = useState<PriorApproval[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [newCourseOpen, setNewCourseOpen] = useState(false)
  const [newLessonOpen, setNewLessonOpen] = useState(false)
  const [newFinalQuestionOpen, setNewFinalQuestionOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)

  const load = useCallback(async (first = false) => {
    if (first) setLoading(true)
    setError(null)
    const results = await Promise.all([
      supabase.from('discipulado_cursos').select('*').order('updated_at', { ascending: false }),
      supabase.from('discipulado_lecciones').select('*').order('orden'),
      supabase.from('discipulado_preguntas').select('*').order('orden'),
      supabase.from('discipulado_opciones').select('*').order('orden'),
      supabase.from('discipulado_asignaciones').select('*').order('updated_at', { ascending: false }),
      supabase.from('discipulado_leccion_progreso').select('*'),
      supabase.from('discipulado_video_progreso').select('*'),
      supabase.from('profiles').select('id,nombre_completo,rol,avatar_url').eq('activo', true).eq('estado_cuenta', 'activo').order('nombre_completo'),
      supabase.from('discipulado_aprobaciones_previas').select('*').order('aprobado_en', { ascending: false }),
      supabase.from('discipulado_gestores').select('*').eq('activo', true),
    ])
    const firstError = results.find((item: any) => item.error)?.error
    if (firstError) setError(firstError.message)
    setCourses(results[0].data || [])
    setLessons(results[1].data || [])
    setQuestions(results[2].data || [])
    setOptions(results[3].data || [])
    setAssignments(results[4].data || [])
    setProgress(results[5].data || [])
    setVideoProgress(results[6].data || [])
    setProfiles(results[7].data || [])
    setPriorApprovals(results[8].data || [])
    setManagers(results[9].data || [])
    if (first) setLoading(false)
  }, [supabase])

  useEffect(() => { void load(true) }, [load])
  useEffect(() => {
    if (!selectedCourseId || !courses.some(course => course.id === selectedCourseId)) setSelectedCourseId(courses[0]?.id || null)
  }, [courses, selectedCourseId])

  const selectedCourse = courses.find(course => course.id === selectedCourseId) || null
  const selectedLessons = lessons.filter(lesson => lesson.curso_id === selectedCourseId).sort((a, b) => a.orden - b.orden)
  const selectedAssignments = assignments.filter(item => item.curso_id === selectedCourseId)
  const finalQuestions = questions.filter(question => question.curso_id === selectedCourseId && question.tipo === 'final' && !question.leccion_id).sort((a, b) => a.orden - b.orden)
  const profileMap = new Map(profiles.map(profile => [profile.id, profile]))
  const priorIds = new Set(priorApprovals.map(item => item.profile_id))
  const managerCandidates = profiles.filter(profile => !['pastor','administrador'].includes(profile.rol) && !managers.some(manager => manager.profile_id === profile.id))

  async function run(action: () => Promise<any>, success?: string) {
    setBusy(true); setError(null); setNotice(null)
    try {
      const result = await action()
      if (result?.error) throw result.error
      if (success) setNotice(success)
      await load(false)
      return result
    } catch (err: any) {
      setError(err?.message || 'No se pudo completar la acción.')
      return null
    } finally { setBusy(false) }
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const titulo = String(form.get('titulo') || '').trim()
    if (!titulo) return
    const result = await run(() => supabase.from('discipulado_cursos').insert({ titulo, descripcion: String(form.get('descripcion') || '').trim(), creado_por: userId }).select('id').single(), 'Curso creado.')
    if (result?.data?.id) setSelectedCourseId(result.data.id)
    if (result) setNewCourseOpen(false)
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourse) return
    const form = new FormData(event.currentTarget)
    const nextState = String(form.get('estado')) as Course['estado']
    if (nextState === 'publicado') {
      const everyLessonReady = selectedLessons.length > 0 && selectedLessons.every(lesson => {
        const hasVideo = Boolean(lesson.video_url && isYouTubeUrl(lesson.video_url))
        const hasQuiz = questions.some(question => question.leccion_id === lesson.id && question.tipo === 'leccion')
        return hasVideo && hasQuiz
      })
      if (!everyLessonReady || finalQuestions.length === 0) {
        setError('Para publicar: cada lección necesita un enlace de YouTube y al menos una pregunta de comprobación; además agrega el examen final.')
        return
      }
    }
    await run(() => supabase.from('discipulado_cursos').update({ titulo: String(form.get('titulo') || '').trim(), descripcion: String(form.get('descripcion') || '').trim(), estado: nextState, updated_at: new Date().toISOString() }).eq('id', selectedCourse.id), 'Curso actualizado.')
  }

  async function createLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCourseId) return
    const form = new FormData(event.currentTarget)
    const videoUrl = String(form.get('video_url') || '').trim()
    if (!isYouTubeUrl(videoUrl)) { setError('Para comprobar que el video llegó al final, usa un enlace válido de YouTube.'); return }
    const titulo = String(form.get('titulo') || '').trim()
    if (!titulo) return
    await run(() => supabase.from('discipulado_lecciones').insert({ curso_id: selectedCourseId, titulo, descripcion: String(form.get('descripcion') || '').trim(), video_url: videoUrl, contenido: String(form.get('contenido') || '').trim(), orden: selectedLessons.length ? Math.max(...selectedLessons.map(item => item.orden)) + 1 : 1 }), 'Lección agregada.')
    setNewLessonOpen(false)
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>, lesson: Lesson) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const videoUrl = String(form.get('video_url') || '').trim()
    if (!isYouTubeUrl(videoUrl)) { setError('Usa un enlace válido de YouTube para conservar la comprobación de finalización.'); return }
    await run(() => supabase.from('discipulado_lecciones').update({ titulo: String(form.get('titulo') || '').trim(), descripcion: String(form.get('descripcion') || '').trim(), video_url: videoUrl, contenido: String(form.get('contenido') || '').trim(), updated_at: new Date().toISOString() }).eq('id', lesson.id), 'Lección actualizada.')
  }

  async function createQuestion(event: FormEvent<HTMLFormElement>, lessonId: string | null) {
    event.preventDefault()
    if (!selectedCourseId) return
    const form = new FormData(event.currentTarget)
    const enunciado = String(form.get('enunciado') || '').trim()
    const values = [1, 2, 3, 4].map(index => String(form.get(`opcion_${index}`) || '').trim()).filter(Boolean)
    const correctIndex = Math.max(0, Number(form.get('correcta') || 1) - 1)
    if (!enunciado || values.length < 2) { setError('Cada pregunta necesita enunciado y al menos dos opciones.'); return }
    const related = questions.filter(question => question.curso_id === selectedCourseId && question.leccion_id === lessonId && question.tipo === (lessonId ? 'leccion' : 'final'))
    setBusy(true); setError(null); setNotice(null)
    try {
      const { data: question, error: questionError } = await supabase.from('discipulado_preguntas').insert({ curso_id: selectedCourseId, leccion_id: lessonId, tipo: lessonId ? 'leccion' : 'final', enunciado, orden: related.length ? Math.max(...related.map(item => item.orden)) + 1 : 1 }).select('id').single()
      if (questionError) throw questionError
      const { error: optionsError } = await supabase.from('discipulado_opciones').insert(values.map((texto, index) => ({ pregunta_id: question.id, texto, orden: index + 1, es_correcta: index === Math.min(correctIndex, values.length - 1) })))
      if (optionsError) throw optionsError
      setNotice(lessonId ? 'Pregunta de lección agregada.' : 'Pregunta final agregada.')
      if (!lessonId) setNewFinalQuestionOpen(false)
      await load(false)
      ;(event.currentTarget as HTMLFormElement).reset()
    } catch (err: any) { setError(err?.message || 'No se pudo crear la pregunta.') } finally { setBusy(false) }
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>, question: Question) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const questionOptions = options.filter(option => option.pregunta_id === question.id).sort((a, b) => a.orden - b.orden)
    const correctId = String(form.get('correcta') || '')
    setBusy(true); setError(null); setNotice(null)
    try {
      const { error: questionError } = await supabase.from('discipulado_preguntas').update({ enunciado: String(form.get('enunciado') || '').trim() }).eq('id', question.id)
      if (questionError) throw questionError
      for (const option of questionOptions) {
        const { error: optionError } = await supabase.from('discipulado_opciones').update({ texto: String(form.get(`option_${option.id}`) || '').trim(), es_correcta: option.id === correctId }).eq('id', option.id)
        if (optionError) throw optionError
      }
      setNotice('Pregunta actualizada.'); await load(false)
    } catch (err: any) { setError(err?.message || 'No se pudo guardar la pregunta.') } finally { setBusy(false) }
  }

  async function review(assignment: Assignment, decision: 'aprobado' | 'rechazado', form: HTMLFormElement | null) {
    const notes = form ? String(new FormData(form).get('notas') || '').trim() || null : null
    await run(() => supabase.rpc('discipulado_revisar', { p_asignacion_id: assignment.id, p_decision: decision, p_notas: notes }), decision === 'aprobado' ? 'Discipulado aprobado.' : 'Se solicitó repetir el examen.')
  }

  async function recognizePrior(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const profileId = String(form.get('profile_id') || '')
    if (!profileId) return
    await run(() => supabase.rpc('discipulado_reconocer_previo', { p_profile_id: profileId, p_notas: String(form.get('notas') || '').trim() || null }), 'Discipulado previo reconocido.')
    ;(event.currentTarget as HTMLFormElement).reset()
  }

  async function addManager(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const profileId = String(form.get('profile_id') || '')
    if (!profileId) return
    await run(() => supabase.from('discipulado_gestores').upsert({ profile_id: profileId, asignado_por: userId, activo: true }), 'Gestor autorizado.')
  }

  if (loading) return <main className="mx-auto grid min-h-screen max-w-3xl place-items-center bg-[#f4f5f9] px-4"><Loader2 className="h-7 w-7 animate-spin text-violet-600" /></main>

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/perfil" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500"><ChevronLeft className="h-4 w-4" /> Perfil</Link>
      <header className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-violet-600">Centro de formación</p><h1 className="mt-1 text-2xl font-bold tracking-[-.03em] text-[#171923]">Gestión de Discipulado</h1><p className="mt-1.5 text-sm leading-6 text-slate-500">Crea el recorrido, sigue el progreso y reconoce a quienes ya fueron discipulados.</p></div><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-violet-50"><GraduationCap className="h-6 w-6" /></div></header>

      <div className="mb-5 grid grid-cols-3 rounded-2xl bg-slate-200/70 p-1">
        {([['curso','Curso'],['personas','En proceso'],['previos','Ya discipulados']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`min-h-10 rounded-xl px-2 text-[11px] font-bold transition ${tab === value ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}
      </div>

      {(notice || error) && <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>{error || notice}</div>}

      {tab === 'curso' && <div className="space-y-5">
        <section className={`${panel} p-4 sm:p-5`}><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-[#171923]">Cursos</h2><p className="mt-0.5 text-xs text-slate-500">El curso publicado más reciente será el que reciba un nuevo usuario.</p></div><button type="button" onClick={() => setNewCourseOpen(value => !value)} className={secondaryButton}><Plus className="h-4 w-4" /> Nuevo</button></div>
          {newCourseOpen && <form onSubmit={createCourse} className="mt-4 space-y-3 border-t border-slate-100 pt-4"><div><label className={labelClass}>Nombre</label><input name="titulo" required className={fieldClass} placeholder="Discipulado VIDA" /></div><div><label className={labelClass}>Descripción</label><textarea name="descripcion" className={`${fieldClass} min-h-20 resize-y`} /></div><button disabled={busy} className={primaryButton}>Crear curso</button></form>}
          {courses.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{courses.map(course => <button key={course.id} type="button" onClick={() => setSelectedCourseId(course.id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${selectedCourseId === course.id ? 'bg-violet-600 text-violet-50' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}>{course.titulo}{course.estado === 'publicado' ? ' · Activo' : ''}</button>)}</div>}
        </section>

        {selectedCourse && <>
          <section className={`${panel} p-5`}><form onSubmit={saveCourse} className="space-y-4"><div><label className={labelClass}>Título</label><input name="titulo" defaultValue={selectedCourse.titulo} required className={fieldClass} /></div><div><label className={labelClass}>Descripción</label><textarea name="descripcion" defaultValue={selectedCourse.descripcion} className={`${fieldClass} min-h-20 resize-y`} /></div><div><label className={labelClass}>Estado</label><select name="estado" defaultValue={selectedCourse.estado} className={fieldClass}><option value="borrador">Borrador</option><option value="publicado">Publicado</option><option value="archivado">Archivado</option></select></div><button disabled={busy} className={primaryButton}>Guardar curso</button></form></section>

          <section className="space-y-3"><div className="flex items-center justify-between gap-3 px-1"><div><h2 className="font-bold text-[#171923]">Lecciones</h2><p className="text-xs text-slate-500">Video de YouTube + preguntas de comprobación</p></div><button type="button" onClick={() => setNewLessonOpen(value => !value)} className={secondaryButton}><Plus className="h-4 w-4" /> Lección</button></div>
            {newLessonOpen && <form onSubmit={createLesson} className={`${panel} space-y-3 p-4`}><div><label className={labelClass}>Título</label><input name="titulo" required className={fieldClass} /></div><div><label className={labelClass}>Descripción breve</label><input name="descripcion" className={fieldClass} /></div><div><label className={labelClass}>Enlace de YouTube</label><input name="video_url" type="url" required className={fieldClass} placeholder="https://youtu.be/..." /></div><div><label className={labelClass}>Contenido complementario</label><textarea name="contenido" className={`${fieldClass} min-h-20 resize-y`} /></div><button disabled={busy} className={primaryButton}>Agregar lección</button></form>}
            {selectedLessons.map(lesson => {
              const lessonQuestions = questions.filter(question => question.leccion_id === lesson.id && question.tipo === 'leccion').sort((a,b) => a.orden-b.orden)
              return <details key={lesson.id} className={`${panel} group overflow-hidden`}><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-extrabold text-violet-700">{lesson.orden}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#171923]">{lesson.titulo}</span><span className="mt-0.5 block text-[11px] text-slate-500">{lessonQuestions.length} pregunta(s) de comprobación</span></span><ChevronRight className="h-4 w-4 text-slate-400 transition group-open:rotate-90" /></summary><div className="space-y-4 border-t border-slate-100 p-4">
                <form onSubmit={event => void saveLesson(event, lesson)} className="space-y-3"><div><label className={labelClass}>Título</label><input name="titulo" defaultValue={lesson.titulo} required className={fieldClass} /></div><div><label className={labelClass}>Descripción</label><input name="descripcion" defaultValue={lesson.descripcion} className={fieldClass} /></div><div><label className={labelClass}>YouTube</label><input name="video_url" defaultValue={lesson.video_url || ''} required className={fieldClass} /></div><div><label className={labelClass}>Contenido</label><textarea name="contenido" defaultValue={lesson.contenido} className={`${fieldClass} min-h-20 resize-y`} /></div><div className="flex gap-2"><button disabled={busy} className={primaryButton}>Guardar</button><button type="button" disabled={busy} onClick={() => void run(() => supabase.from('discipulado_lecciones').delete().eq('id', lesson.id), 'Lección eliminada.')} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Eliminar</button></div></form>
                <div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-[#171923]">Preguntas después del video</h3><div className="mt-3 space-y-2">{lessonQuestions.map(question => { const questionOptions = options.filter(option => option.pregunta_id === question.id).sort((a,b)=>a.orden-b.orden); return <details key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50"><summary className="cursor-pointer list-none px-3 py-3 text-sm font-bold text-slate-700">{question.orden}. {question.enunciado}</summary><form onSubmit={event => void saveQuestion(event, question)} className="space-y-2 border-t border-slate-200 p-3"><textarea name="enunciado" defaultValue={question.enunciado} className={`${fieldClass} min-h-16`} />{questionOptions.map(option => <label key={option.id} className="flex items-center gap-2"><input type="radio" name="correcta" value={option.id} defaultChecked={option.es_correcta} className="h-4 w-4 accent-violet-600" /><input name={`option_${option.id}`} defaultValue={option.texto} className={fieldClass} /></label>)}<div className="flex gap-2"><button disabled={busy} className={primaryButton}>Guardar</button><button type="button" onClick={() => void run(() => supabase.from('discipulado_preguntas').delete().eq('id', question.id), 'Pregunta eliminada.')} className="px-3 text-xs font-bold text-rose-600">Eliminar</button></div></form></details> })}</div>
                  <form onSubmit={event => void createQuestion(event, lesson.id)} className="mt-4 space-y-2 rounded-2xl bg-violet-50 p-3"><p className="text-xs font-bold text-violet-700">Nueva pregunta</p><textarea name="enunciado" required className={`${fieldClass} min-h-16`} placeholder="¿Qué aprendiste de este video?" />{[1,2,3,4].map(index => <input key={index} name={`opcion_${index}`} required={index<=2} className={fieldClass} placeholder={`Opción ${index}${index>2?' (opcional)':''}`} />)}<select name="correcta" defaultValue="1" className={fieldClass}><option value="1">Correcta: opción 1</option><option value="2">Correcta: opción 2</option><option value="3">Correcta: opción 3</option><option value="4">Correcta: opción 4</option></select><button disabled={busy} className={primaryButton}>Agregar pregunta</button></form>
                </div>
              </div></details>
            })}
          </section>

          <section className="space-y-3"><div className="flex items-center justify-between gap-3 px-1"><div><h2 className="font-bold text-[#171923]">Examen final</h2><p className="text-xs text-slate-500">{finalQuestions.length} pregunta(s)</p></div><button type="button" onClick={() => setNewFinalQuestionOpen(value => !value)} className={secondaryButton}><Plus className="h-4 w-4" /> Pregunta</button></div>
            {newFinalQuestionOpen && <form onSubmit={event => void createQuestion(event, null)} className={`${panel} space-y-2 p-4`}><textarea name="enunciado" required className={`${fieldClass} min-h-16`} placeholder="Pregunta del examen final" />{[1,2,3,4].map(index => <input key={index} name={`opcion_${index}`} required={index<=2} className={fieldClass} placeholder={`Opción ${index}${index>2?' (opcional)':''}`} />)}<select name="correcta" defaultValue="1" className={fieldClass}><option value="1">Correcta: opción 1</option><option value="2">Correcta: opción 2</option><option value="3">Correcta: opción 3</option><option value="4">Correcta: opción 4</option></select><button disabled={busy} className={primaryButton}>Agregar pregunta</button></form>}
            {finalQuestions.map(question => { const questionOptions = options.filter(option => option.pregunta_id === question.id).sort((a,b)=>a.orden-b.orden); return <details key={question.id} className={`${panel} overflow-hidden`}><summary className="cursor-pointer list-none px-4 py-4 text-sm font-bold text-[#171923]">{question.orden}. {question.enunciado}</summary><form onSubmit={event => void saveQuestion(event, question)} className="space-y-2 border-t border-slate-100 p-4"><textarea name="enunciado" defaultValue={question.enunciado} className={`${fieldClass} min-h-16`} />{questionOptions.map(option => <label key={option.id} className="flex items-center gap-2"><input type="radio" name="correcta" value={option.id} defaultChecked={option.es_correcta} className="h-4 w-4 accent-violet-600" /><input name={`option_${option.id}`} defaultValue={option.texto} className={fieldClass} /></label>)}<div className="flex gap-2"><button disabled={busy} className={primaryButton}>Guardar</button><button type="button" onClick={() => void run(() => supabase.from('discipulado_preguntas').delete().eq('id', question.id), 'Pregunta eliminada.')} className="px-3 text-xs font-bold text-rose-600">Eliminar</button></div></form></details> })}
          </section>
        </>}
      </div>}

      {tab === 'personas' && <div className="space-y-4">
        <section className={`${panel} p-4`}><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><UsersRound className="h-5 w-5" /></div><div><h2 className="font-bold text-[#171923]">Personas en el discipulado actual</h2><p className="mt-0.5 text-xs text-slate-500">Lista rápida con foto y progreso de cada persona.</p></div></div>{courses.length > 1 && <select value={selectedCourseId || ''} onChange={event => setSelectedCourseId(event.target.value)} className={`${fieldClass} mt-4`}>{courses.map(course => <option key={course.id} value={course.id}>{course.titulo}</option>)}</select>}</section>
        {selectedAssignments.length === 0 ? <section className={`${panel} p-8 text-center`}><BookOpenCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">Todavía nadie ha comenzado este curso.</p></section> : <section className={`${panel} overflow-hidden`}><div className="max-h-[36rem] divide-y divide-slate-100 overflow-y-auto">{selectedAssignments.map(assignment => {
          const profile = profileMap.get(assignment.profile_id)
          const completedIds = new Set(progress.filter(item => item.asignacion_id === assignment.id).map(item => item.leccion_id))
          const viewedIds = new Set(videoProgress.filter(item => item.asignacion_id === assignment.id).map(item => item.leccion_id))
          const completed = selectedLessons.filter(item => completedIds.has(item.id)).length
          const percent = selectedLessons.length ? Math.round((completed / selectedLessons.length) * 100) : 0
          const current = selectedLessons.find(item => !completedIds.has(item.id))
          const activity = current && viewedIds.has(current.id) ? `Video visto · preguntas de ${current.titulo}` : current ? current.titulo : 'Curso terminado'
          const initials = profile?.nombre_completo?.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('') || '?'
          return <div key={assignment.id} className="px-3 py-3.5 sm:px-4"><div className="flex items-start gap-3">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-slate-200" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold uppercase text-slate-500 ring-1 ring-slate-200">{initials}</span>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-sm font-bold text-[#171923]">{profile?.nombre_completo || 'Miembro'}</h3><p className="mt-0.5 truncate text-xs text-slate-500">{activity}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${statusClass(assignment.estado)}`}>{statusLabel(assignment.estado)}</span></div><div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400"><span>{completed}/{selectedLessons.length} lecciones</span><span>{percent}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600 transition-[width]" style={{width:`${percent}%`}} /></div><p className="mt-1.5 text-[10px] text-slate-400">Última actividad: {new Intl.DateTimeFormat('es-SV',{dateStyle:'medium',timeStyle:'short'}).format(new Date(assignment.updated_at))}</p>{assignment.calificacion != null && <p className="mt-2 text-xs font-bold text-[#171923]">Examen final: {Math.round(Number(assignment.calificacion))}%</p>}{assignment.estado === 'revision' && <form className="mt-3 rounded-2xl bg-amber-50 p-3"><textarea name="notas" className={`${fieldClass} min-h-16 resize-y`} placeholder="Nota pastoral opcional" /><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={event => void review(assignment,'rechazado',event.currentTarget.form)} className="min-h-10 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700">Pedir repetir</button><button type="button" disabled={busy} onClick={event => void review(assignment,'aprobado',event.currentTarget.form)} className="min-h-10 rounded-xl bg-emerald-600 text-xs font-bold text-emerald-50">Aprobar</button></div></form>}</div></div></div>
        })}</div></section>}
      </div>}

      {tab === 'previos' && <div className="space-y-5">
        <section className={`${panel} p-5`}>
          <div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-500"><Star className="h-5 w-5" /></div><div><h2 className="font-bold text-[#171923]">Reconocer discipulado previo</h2><p className="mt-1 text-xs leading-5 text-slate-500">Para personas que ya fueron discipuladas antes de usar VIDA. No tendrán que repetir el curso.</p></div></div>
          <form onSubmit={recognizePrior} className="mt-4 space-y-3">
            <div>
              <label className={labelClass}>Persona</label>
              <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                {profiles.filter(profile => !priorIds.has(profile.id)).length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No hay personas pendientes de reconocer.</p>
                ) : profiles.filter(profile => !priorIds.has(profile.id)).map(profile => (
                  <label key={profile.id} className="flex min-h-[68px] cursor-pointer items-center gap-3 px-3 py-2.5 transition active:bg-slate-50 has-[:checked]:bg-violet-50">
                    <input type="radio" name="profile_id" value={profile.id} required className="peer sr-only" />
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                    ) : (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold uppercase text-slate-500 ring-1 ring-slate-200">
                        {profile.nombre_completo.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('') || '?'}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#171923]">{profile.nombre_completo}</span>
                      <span className="mt-0.5 block text-xs capitalize text-slate-500">{profile.rol}</span>
                    </span>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-300 text-transparent transition peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white">
                      <UserCheck className="h-3.5 w-3.5" />
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div><label className={labelClass}>Nota opcional</label><textarea name="notas" className={`${fieldClass} min-h-20 resize-y`} placeholder="Ej. Completó discipulado presencial antes de VIDA" /></div>
            <button disabled={busy} className={primaryButton}><UserCheck className="h-4 w-4" /> Marcar como discipulado</button>
          </form>
        </section>
        <section className={`${panel} p-4 sm:p-5`}><h2 className="font-bold text-[#171923]">Ya reconocidos</h2><div className="mt-3 divide-y divide-slate-100">{priorApprovals.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">Aún no hay reconocimientos previos.</p> : priorApprovals.map(item => { const profile = profileMap.get(item.profile_id); return <div key={item.profile_id} className="flex items-start justify-between gap-3 py-3"><div><p className="text-sm font-bold text-[#171923]">{profile?.nombre_completo || 'Miembro'}</p><p className="mt-0.5 text-[11px] text-slate-400">Reconocido {new Intl.DateTimeFormat('es-SV',{dateStyle:'medium'}).format(new Date(item.aprobado_en))}</p>{item.notas && <p className="mt-1 text-xs text-slate-500">{item.notas}</p>}</div><div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-amber-500" /><button type="button" disabled={busy} onClick={() => void run(() => supabase.from('discipulado_aprobaciones_previas').delete().eq('profile_id',item.profile_id),'Reconocimiento retirado.')} className="text-[11px] font-bold text-rose-600">Retirar</button></div></div> })}</div></section>
        {isAdmin && <section className={`${panel} p-4 sm:p-5`}><button type="button" onClick={() => setManagerOpen(value => !value)} className="flex w-full items-center justify-between gap-3 text-left"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><ShieldCheck className="h-5 w-5" /></span><span><span className="block text-sm font-bold text-[#171923]">Gestores de Discipulado</span><span className="mt-0.5 block text-xs text-slate-500">Autoriza a otra persona desde una lista con foto.</span></span></span><ChevronRight className={`h-4 w-4 text-slate-400 transition ${managerOpen?'rotate-90':''}`} /></button>{managerOpen && <div className="mt-4 border-t border-slate-100 pt-4"><form onSubmit={addManager} className="space-y-3"><label className={labelClass}>Dar acceso a</label><div className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200 bg-white">{managerCandidates.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No hay personas pendientes de autorizar.</p> : managerCandidates.map(profile => <label key={profile.id} className="flex min-h-[68px] cursor-pointer items-center gap-3 px-3 py-2.5 transition active:bg-slate-50 has-[:checked]:bg-indigo-50"><input type="radio" name="profile_id" value={profile.id} required className="peer sr-only" />{profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold uppercase text-slate-500 ring-1 ring-slate-200">{profile.nombre_completo.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('') || '?'}</span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#171923]">{profile.nombre_completo}</span><span className="mt-0.5 block text-xs capitalize text-slate-500">{profile.rol}</span></span><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-300 text-transparent transition peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white"><ShieldCheck className="h-3.5 w-3.5" /></span></label>)}</div><button disabled={busy || managerCandidates.length === 0} className={primaryButton}><ShieldCheck className="h-4 w-4" /> Dar acceso</button></form><div className="mt-5 border-t border-slate-100 pt-4"><label className={labelClass}>Gestores con acceso</label><div className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200 bg-white">{managers.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">Aún no hay gestores adicionales.</p> : managers.map(manager => { const profile = profileMap.get(manager.profile_id); const initials = profile?.nombre_completo?.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('') || '?'; return <div key={manager.profile_id} className="flex min-h-[68px] items-center gap-3 px-3 py-2.5">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold uppercase text-slate-500 ring-1 ring-slate-200">{initials}</span>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#171923]">{profile?.nombre_completo || 'Gestor'}</p><p className="mt-0.5 text-xs capitalize text-slate-500">{profile?.rol || 'gestor'}</p></div><button type="button" disabled={busy} onClick={() => void run(() => supabase.from('discipulado_gestores').delete().eq('profile_id',manager.profile_id),'Gestor retirado.')} className="shrink-0 text-xs font-bold text-rose-600">Retirar</button></div> })}</div></div></div>}</section>}
      </div>}
    </main>
  )
}
