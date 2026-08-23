'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react'
import { deriveProgressMetrics, HEBREW_PRACTICE_QUESTIONS, selectAdaptiveQuestions, selectDifficultyQuestions, SKILL_LABELS, SKILL_ORDER, type HebrewDifficulty, type HebrewPracticeQuestion, type HebrewProgressAnswer, type HebrewProgressSession, type HebrewSkill } from '@/lib/hebreo/progress'
import { finishHebrewProgressSession, loadHebrewProgress, saveHebrewProgressAnswer, setHebrewReviewRequested, startHebrewProgressSession } from '@/lib/hebreo/progress-store'

const DIFFICULTIES: readonly { id: HebrewDifficulty; label: string }[] = [
  { id: 'initial', label: 'Inicial' },
  { id: 'intermediate', label: 'Intermedio' },
  { id: 'advanced', label: 'Avanzado' },
]

export default function HebrewProgressCoach() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [mode, setMode] = useState<'adaptive' | 'difficulty'>('adaptive')
  const [difficulty, setDifficulty] = useState<HebrewDifficulty>('initial')
  const [focusAreas, setFocusAreas] = useState<HebrewSkill[]>([])
  const [sessions, setSessions] = useState<HebrewProgressSession[]>([])
  const [answers, setAnswers] = useState<HebrewProgressAnswer[]>([])
  const [questions, setQuestions] = useState<HebrewPracticeQuestion[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [lastAnswer, setLastAnswer] = useState<HebrewProgressAnswer | null>(null)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await loadHebrewProgress()
      setSessions(data.sessions)
      setAnswers(data.answers)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu progreso.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const metrics = useMemo(() => deriveProgressMetrics(sessions, answers), [sessions, answers])
  const current = questions[index] ?? null
  const active = Boolean(sessionId && current && !finished)
  const progress = questions.length ? Math.round((index / questions.length) * 100) : 0

  function toggleArea(skill: HebrewSkill) {
    if (active) return
    setFocusAreas(previous => previous.includes(skill) ? previous.filter(item => item !== skill) : [...previous, skill])
  }

  async function begin() {
    setSaving(true)
    setError(null)
    try {
      const selectedQuestions = mode === 'adaptive'
        ? selectAdaptiveQuestions(answers, focusAreas, 10)
        : selectDifficultyQuestions(difficulty, focusAreas, 10)
      const fallback = mode === 'difficulty'
        ? HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === difficulty).slice(0, 10)
        : selectAdaptiveQuestions(answers, [], 10)
      const nextQuestions = selectedQuestions.length ? selectedQuestions : fallback
      const id = await startHebrewProgressSession(mode, mode === 'difficulty' ? difficulty : null, focusAreas)
      setQuestions([...nextQuestions])
      setSessionId(id)
      setIndex(0)
      setCorrect(0)
      setSelected(null)
      setLastAnswer(null)
      setFinished(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar la práctica.')
    } finally {
      setSaving(false)
    }
  }

  async function answer(optionIndex: number) {
    if (!current || !sessionId || selected !== null || saving) return
    setSaving(true)
    setSelected(optionIndex)
    const isCorrect = optionIndex === current.correctIndex
    try {
      const saved = await saveHebrewProgressAnswer({
        sessionId,
        questionKey: current.key,
        questionVersion: current.version,
        skill: current.skill,
        difficulty: current.difficulty,
        responseText: current.options[optionIndex],
        isCorrect,
      })
      setLastAnswer(saved)
      setAnswers(previous => [saved, ...previous])
      if (isCorrect) setCorrect(value => value + 1)
      setError(null)
    } catch (cause) {
      setSelected(null)
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar esta respuesta.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleReview() {
    if (!lastAnswer || saving) return
    setSaving(true)
    try {
      const next = !lastAnswer.review_requested
      await setHebrewReviewRequested(lastAnswer.id, next)
      const updated = { ...lastAnswer, review_requested: next }
      setLastAnswer(updated)
      setAnswers(previous => previous.map(answerRow => answerRow.id === updated.id ? updated : answerRow))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el repaso.')
    } finally {
      setSaving(false)
    }
  }

  async function next() {
    if (selected === null || !sessionId) return
    if (index + 1 < questions.length) {
      setIndex(value => value + 1)
      setSelected(null)
      setLastAnswer(null)
      return
    }
    setSaving(true)
    try {
      await finishHebrewProgressSession(sessionId)
      setFinished(true)
      setSelected(null)
      setLastAnswer(null)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cerrar la sesión.')
    } finally {
      setSaving(false)
    }
  }

  function resetPractice() {
    setSessionId(null)
    setQuestions([])
    setIndex(0)
    setCorrect(0)
    setSelected(null)
    setLastAnswer(null)
    setFinished(false)
  }

  return (
    <div className="mt-5 text-left">
      {!active && !finished && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode('adaptive')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'adaptive' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Según mi progreso</button>
            <button type="button" onClick={() => setMode('difficulty')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'difficulty' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Elegir dificultad</button>
          </div>

          {mode === 'difficulty' && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(item => <button key={item.id} type="button" onClick={() => setDifficulty(item.id)} className={`min-h-11 rounded-full border px-2 text-[11px] font-black ${difficulty === item.id ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-500'}`}>{item.label}</button>)}
            </div>
          )}

          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Áreas que quieres reforzar</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SKILL_ORDER.map(skill => <button key={skill} type="button" aria-pressed={focusAreas.includes(skill)} onClick={() => toggleArea(skill)} className={`min-h-10 rounded-full border px-3 text-[11px] font-black ${focusAreas.includes(skill) ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-500'}`}>{SKILL_LABELS[skill]}</button>)}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Si no eliges un área, la práctica usa una mezcla adecuada al modo seleccionado.</p>
          </div>

          {mode === 'adaptive' && <div className="mt-4 rounded-[16px] bg-slate-50 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">Recomendación actual</p><p className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p></div>}
          <button type="button" onClick={() => void begin()} disabled={saving || loading} className="mt-4 min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Preparando…' : 'Comenzar práctica'}</button>
        </>
      )}

      {active && current && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">{current.type} · {SKILL_LABELS[current.skill]}</p><p className="mt-0.5 text-[11px] font-bold text-slate-400">Pregunta {index + 1} de {questions.length}</p></div>
            <div className="text-right"><p className="text-lg font-black text-slate-950">{correct}</p><p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">Aciertos</p></div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="py-6 text-center">
            <p className="text-[1.08rem] font-black leading-snug text-slate-950">{current.prompt}</p>
            {current.hebrew && <p lang="he" dir="rtl" className="mt-5 text-[3.6rem] font-black leading-tight text-indigo-700">{current.hebrew}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {current.options.map((option, optionIndex) => {
              const chosen = selected === optionIndex
              const correctOption = selected !== null && current.correctIndex === optionIndex
              return <button key={`${current.key}-${option}`} type="button" disabled={selected !== null || saving} onClick={() => void answer(optionIndex)} className={`min-h-[4.5rem] rounded-[16px] border px-2 py-3 text-center text-lg font-black transition ${correctOption ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : chosen ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-800'}`}>{option}</button>
            })}
          </div>
          {selected !== null && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className={`text-sm font-black ${selected === current.correctIndex ? 'text-emerald-700' : 'text-rose-700'}`}>{selected === current.correctIndex ? 'Correcto' : 'Necesita repaso'}</p>
              <p className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-500">{current.explanation}</p>
              <button type="button" disabled={!lastAnswer || saving} onClick={() => void toggleReview()} className={`mt-3 min-h-10 rounded-full border px-4 text-[11px] font-black ${lastAnswer?.review_requested ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'}`}>{lastAnswer?.review_requested ? 'Marcado para repasar' : 'Quiero repasar'}</button>
              <button type="button" onClick={() => void next()} disabled={saving || !lastAnswer} className="mt-3 min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-50">{index + 1 === questions.length ? 'Terminar práctica' : 'Siguiente'}</button>
            </div>
          )}
        </>
      )}

      {finished && (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
          <h3 className="mt-2 text-xl font-black text-slate-950">Práctica terminada</h3>
          <p className="mt-1 text-[12px] text-slate-500">Tus respuestas quedaron guardadas y ya forman parte de tu siguiente práctica adaptativa.</p>
          <div className="mt-4 grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-4"><div><p className="text-2xl font-black text-indigo-700">{questions.length ? Math.round((correct / questions.length) * 100) : 0}%</p><p className="mt-1 text-[10px] font-black text-slate-500">Precisión</p></div><div><p className="text-2xl font-black text-slate-950">{correct}/{questions.length}</p><p className="mt-1 text-[10px] font-black text-slate-500">Aciertos</p></div></div>
          <button type="button" onClick={resetPractice} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-black text-white"><RotateCcw className="h-4 w-4" aria-hidden="true" />Nueva práctica</button>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-center text-[11px] font-bold text-rose-600">{error}</p>}

      {!active && (
        <div className="mt-5 border-t border-slate-200 pt-1">
          <button type="button" onClick={() => setHistoryOpen(value => !value)} aria-expanded={historyOpen} className="flex min-h-12 w-full items-center justify-between gap-3 text-left"><span><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Tu historial</span><span className="mt-0.5 block text-sm font-black text-slate-950">{sessions.filter(item => item.status === 'completed').length} sesiones completadas</span></span><ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${historyOpen ? 'rotate-180' : ''}`} aria-hidden="true" /></button>
          {historyOpen && (
            <div className="border-t border-slate-200 py-4">
              {metrics.totalAttempts === 0 ? <p className="text-[12px] leading-relaxed text-slate-500">Todavía no hay intentos objetivos. Completa una práctica para crear tu primera línea base.</p> : (
                <>
                  <div className="grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3 text-center"><div><p className="text-xl font-black text-indigo-700">{metrics.accuracy ?? 0}%</p><p className="text-[9px] font-black text-slate-400">Precisión</p></div><div><p className="text-xl font-black text-slate-950">{metrics.retention === null ? '—' : `${metrics.retention}%`}</p><p className="text-[9px] font-black text-slate-400">Retención</p></div><div><p className="text-sm font-black text-slate-950">{metrics.trend}</p><p className="text-[9px] font-black text-slate-400">Tendencia</p></div></div>
                  <div className="mt-4 space-y-2">{metrics.areas.filter(area => area.attempts > 0).map(area => <div key={area.skill} className="flex items-center justify-between gap-3 rounded-[14px] bg-slate-50 px-3 py-2"><div><p className="text-[12px] font-black text-slate-800">{SKILL_LABELS[area.skill]}</p><p className="text-[10px] text-slate-400">{area.attempts} intentos · {area.accuracy ?? 0}%</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${area.state === 'Dominado' ? 'bg-emerald-50 text-emerald-700' : area.state === 'Reforzar' ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-700'}`}>{area.state}</span></div>)}</div>
                  <div className="mt-4 rounded-[16px] border border-indigo-100 bg-indigo-50/50 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">Qué estudiar después</p><p className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p>{metrics.evolution !== null && <p className="mt-2 text-[10px] font-bold text-slate-400">Evolución frente a tu sesión anterior: {metrics.evolution > 0 ? '+' : ''}{metrics.evolution} puntos.</p>}</div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
