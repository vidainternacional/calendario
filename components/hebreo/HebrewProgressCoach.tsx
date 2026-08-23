'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, Mic, RotateCcw, SlidersHorizontal, Square } from 'lucide-react'
import {
  deriveAdaptiveLevel,
  deriveProgressMetrics,
  HEBREW_PRACTICE_QUESTIONS,
  selectAdaptiveQuestions,
  selectDifficultyQuestions,
  SKILL_LABELS,
  SKILL_ORDER,
  type HebrewDifficulty,
  type HebrewPracticeQuestion,
  type HebrewProgressAnswer,
  type HebrewProgressSession,
  type HebrewSkill,
} from '@/lib/hebreo/progress'
import {
  finishHebrewProgressSession,
  loadHebrewProgress,
  saveHebrewProgressAnswer,
  setHebrewReviewRequested,
  startHebrewProgressSession,
} from '@/lib/hebreo/progress-store'

const DIFFICULTIES: readonly { id: HebrewDifficulty; label: string; level: string; detail: string }[] = [
  { id: 'initial', label: 'Básico', level: 'Nivel 1', detail: 'Reconocer letras, formas finales, signos básicos y vocabulario esencial. Las opciones son claramente diferenciables.' },
  { id: 'intermediate', label: 'Intermedio', level: 'Nivel 2', detail: 'Combinar lo aprendido: vocales, formas finales, palabras, lecturas cortas y reglas ya estudiadas.' },
  { id: 'advanced', label: 'Avanzado', level: 'Nivel 3', detail: 'Lectura con menos ayudas, texto sin niqqud, distractores muy parecidos y aplicación conjunta de reglas. Aquí los detalles importan.' },
]
const LENGTHS = [10, 15, 20] as const

type SpeechResultEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } }
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function normalizeHebrew(value: string) {
  return value.normalize('NFD').replace(/[\u0591-\u05C7]/g, '').replace(/[^\u05D0-\u05EA]/g, '')
}

function similarity(expected: string, heard: string) {
  const a = normalizeHebrew(expected)
  const b = normalizeHebrew(heard)
  if (!a || !b) return 0
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index, ...Array<number>(b.length).fill(0)])
  for (let column = 0; column <= b.length; column += 1) rows[0][column] = column
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      )
    }
  }
  return Math.max(0, Math.round((1 - rows[a.length][b.length] / Math.max(a.length, b.length)) * 100))
}

export default function HebrewProgressCoach() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [mode, setMode] = useState<'adaptive' | 'difficulty'>('adaptive')
  const [difficulty, setDifficulty] = useState<HebrewDifficulty>('initial')
  const [questionCount, setQuestionCount] = useState<number>(15)
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
  const [listening, setListening] = useState(false)
  const [speechResult, setSpeechResult] = useState<{ transcript: string; score: number } | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null)

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
  const adaptiveLevel = useMemo(() => deriveAdaptiveLevel(answers), [answers])
  const current = questions[index] ?? null
  const active = Boolean(sessionId && current && !finished)
  const progress = questions.length ? Math.round(((index + (selected !== null ? 1 : 0)) / questions.length) * 100) : 0
  const level = DIFFICULTIES.find(item => item.id === difficulty)!
  const strictPool = useMemo(
    () => HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === difficulty && (!focusAreas.length || focusAreas.includes(question.skill))),
    [difficulty, focusAreas],
  )
  const availableCount = mode === 'difficulty' ? Math.min(questionCount, strictPool.length) : questionCount
  const canTestSpeech = Boolean(current?.hebrew && (current.skill === 'vocabulary' || current.skill === 'reading'))

  function toggleArea(skill: HebrewSkill) {
    if (!active) setFocusAreas(previous => previous.includes(skill) ? previous.filter(item => item !== skill) : [...previous, skill])
  }

  async function begin() {
    setSaving(true)
    setError(null)
    setSpeechResult(null)
    try {
      let nextQuestions = mode === 'adaptive'
        ? selectAdaptiveQuestions(answers, focusAreas, questionCount)
        : selectDifficultyQuestions(difficulty, focusAreas, questionCount)
      if (!nextQuestions.length && focusAreas.length) {
        nextQuestions = mode === 'adaptive'
          ? selectAdaptiveQuestions(answers, [], questionCount)
          : selectDifficultyQuestions(difficulty, [], questionCount)
      }
      if (!nextQuestions.length) throw new Error('No hay preguntas disponibles para esta combinación todavía.')
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
      const nextValue = !lastAnswer.review_requested
      await setHebrewReviewRequested(lastAnswer.id, nextValue)
      const updated = { ...lastAnswer, review_requested: nextValue }
      setLastAnswer(updated)
      setAnswers(previous => previous.map(row => row.id === updated.id ? updated : row))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el repaso.')
    } finally {
      setSaving(false)
    }
  }

  async function next() {
    if (selected === null || !sessionId) return
    setSpeechResult(null)
    setSpeechError(null)
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

  function startListening() {
    if (!current?.hebrew || typeof window === 'undefined') return
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) {
      setSpeechError('Este navegador no ofrece reconocimiento de voz compatible. En iPhone, prueba desde Safari con permiso de micrófono.')
      return
    }
    const instance = new Recognition()
    instance.lang = 'he-IL'
    instance.interimResults = false
    instance.maxAlternatives = 1
    instance.onresult = event => {
      const transcript = event.results[0][0].transcript
      setSpeechResult({ transcript, score: similarity(current.hebrew ?? '', transcript) })
      setSpeechError(null)
    }
    instance.onerror = () => setSpeechError('No pude reconocer la voz. Revisa el permiso del micrófono e inténtalo otra vez.')
    instance.onend = () => { setListening(false); setRecognition(null) }
    setRecognition(instance)
    setListening(true)
    setSpeechResult(null)
    setSpeechError(null)
    instance.start()
  }

  function stopListening() { recognition?.stop() }
  function resetPractice() { setSessionId(null); setQuestions([]); setIndex(0); setCorrect(0); setSelected(null); setLastAnswer(null); setFinished(false); setSpeechResult(null); setSpeechError(null) }

  const finalPct = questions.length ? Math.round((correct / questions.length) * 100) : 0
  const finalFeedback = finalPct >= 90
    ? 'Excelente dominio en esta sesión. Mantén el ritmo y deja que el modo adaptativo aumente la exigencia cuando tu historial lo sostenga.'
    : finalPct >= 75
      ? 'Buen resultado. Ya hay una base sólida; conviene repetir los puntos donde dudaste antes de subir la exigencia.'
      : finalPct >= 60
        ? 'Vas avanzando, pero todavía hay huecos claros. Repite las áreas con más errores antes de intentar un nivel superior.'
        : 'Esta sesión muestra que conviene reforzar fundamentos. No pasa nada por bajar el nivel: el objetivo es consolidar antes de aumentar la dificultad.'

  return (
    <div className="text-left">
      {!active && !finished && (
        <>
          <div className="py-3">
            <p className="text-[13px] font-black text-slate-900">Mide lo que ya sabes y decide qué reforzar</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Cada respuesta alimenta tu historial. El nivel adaptativo puede subir o bajar según tus resultados recientes.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
            <button type="button" onClick={() => setMode('adaptive')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'adaptive' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Según mi progreso</button>
            <button type="button" onClick={() => setMode('difficulty')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'difficulty' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Elegir nivel</button>
          </div>

          {mode === 'adaptive' ? (
            <div className="mt-4">
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Nivel adaptativo</p><p className="mt-0.5 text-[16px] font-black text-slate-950">Nivel {adaptiveLevel.level} · {adaptiveLevel.label}</p></div>
                <p className="text-[10px] font-bold text-slate-400">{adaptiveLevel.attempts ? `${adaptiveLevel.accuracy}% reciente` : 'Sin línea base'}</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${adaptiveLevel.progress}%` }} /></div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Se calcula con tus últimos intentos objetivos. Una racha de errores puede bajarlo; resultados consistentes lo hacen subir.</p>
              <div className="mt-3 border-l-2 border-indigo-200 pl-3"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-indigo-700">Qué conviene estudiar ahora</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p></div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-2">{DIFFICULTIES.map(item => <button key={item.id} type="button" onClick={() => setDifficulty(item.id)} className={`min-h-[54px] rounded-[16px] border px-1 ${difficulty === item.id ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-[9px] font-black uppercase">{item.level}</span><span className="block text-[11px] font-black">{item.label}</span></button>)}</div>
              <div className="mt-3 border-l-2 border-indigo-300 pl-3"><p className="text-[12px] font-black text-slate-900">¿Qué te espera en {level.label}?</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{level.detail}</p></div>
            </div>
          )}

          <div className="mt-4 border-y border-slate-200">
            <button type="button" onClick={() => setCustomOpen(value => !value)} aria-expanded={customOpen} className="flex min-h-[56px] w-full items-center justify-between gap-3 text-left">
              <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-indigo-600" /><span><span className="block text-[12px] font-black text-slate-800">Personalizar práctica</span><span className="block text-[9px] text-slate-400">Cantidad y áreas de refuerzo</span></span></span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${customOpen ? 'rotate-180' : ''}`} />
            </button>
            {customOpen && (
              <div className="border-t border-slate-100 pb-4 pt-3">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cantidad de preguntas</p>
                <div className="mt-2 grid grid-cols-3 gap-2">{LENGTHS.map(length => <button key={length} type="button" onClick={() => setQuestionCount(length)} className={`min-h-10 rounded-full border text-[11px] font-black ${questionCount === length ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-500'}`}>{length}</button>)}</div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Áreas que quieres reforzar</p>
                <div className="mt-2 flex flex-wrap gap-2">{SKILL_ORDER.map(skill => <button key={skill} type="button" aria-pressed={focusAreas.includes(skill)} onClick={() => toggleArea(skill)} className={`min-h-9 rounded-full border px-3 text-[10px] font-black ${focusAreas.includes(skill) ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-500'}`}>{SKILL_LABELS[skill]}</button>)}</div>
                {mode === 'difficulty' && availableCount < questionCount && <p className="mt-3 text-[10px] leading-relaxed text-amber-700">Con esta combinación hay {availableCount} preguntas reales disponibles. La sesión no mezclará niveles para rellenar el número.</p>}
              </div>
            )}
          </div>

          <button type="button" onClick={() => void begin()} disabled={saving || loading || availableCount === 0} className="mt-4 min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Preparando…' : `Comenzar · ${availableCount} preguntas`}</button>
        </>
      )}

      {active && current && (
        <>
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">{current.type} · {SKILL_LABELS[current.skill]}</p><p className="text-[11px] font-bold text-slate-400">Pregunta {index + 1} de {questions.length}</p></div><div className="text-right"><p className="text-lg font-black">{correct}</p><p className="text-[9px] font-black uppercase text-slate-400">Aciertos</p></div></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="py-6 text-center"><p className="text-[1.08rem] font-black">{current.prompt}</p>{current.hebrew && <p lang="he" dir="rtl" className="mt-5 text-[3.6rem] font-black leading-tight text-indigo-700">{current.hebrew}</p>}</div>

          {canTestSpeech && (
            <div className="mb-4 border-y border-slate-100 py-3 text-center">
              <button type="button" onClick={listening ? stopListening : startListening} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[11px] font-black ${listening ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100'}`}>{listening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}{listening ? 'Detener' : 'Probar pronunciación'}</button>
              <p className="mt-2 text-[9px] leading-relaxed text-slate-400">Usa reconocimiento de voz en hebreo para comparar lo que el navegador entendió. No modifica tu nota ni sustituye una evaluación fonética profesional.</p>
              {speechResult && <div className="mt-2"><p className="text-[10px] text-slate-500">Escuché: <span lang="he" dir="rtl" className="font-black text-slate-800">{speechResult.transcript}</span></p><p className={`mt-1 text-[11px] font-black ${speechResult.score >= 85 ? 'text-emerald-700' : speechResult.score >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>{speechResult.score >= 85 ? 'Coincide muy bien con el texto esperado.' : speechResult.score >= 60 ? 'Está cerca; vuelve a intentarlo más despacio.' : 'El reconocimiento fue distinto. Escucha tu pronunciación y repite.'}</p></div>}
              {speechError && <p className="mt-2 text-[10px] font-bold text-rose-600">{speechError}</p>}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">{current.options.map((option, optionIndex) => { const chosen = selected === optionIndex; const correctOption = selected !== null && current.correctIndex === optionIndex; return <button key={`${current.key}-${option}`} type="button" disabled={selected !== null || saving} onClick={() => void answer(optionIndex)} className={`min-h-[4.5rem] rounded-[16px] border px-2 py-3 text-center text-lg font-black ${correctOption ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : chosen ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-800'}`}>{option}</button> })}</div>

          {selected !== null && <div className="mt-4 border-t border-slate-200 pt-4"><p className={`text-sm font-black ${selected === current.correctIndex ? 'text-emerald-700' : 'text-rose-700'}`}>{selected === current.correctIndex ? 'Correcto' : 'Necesita repaso'}</p><p className="mt-1 text-[12px] font-semibold text-slate-500">{current.explanation}</p><button type="button" disabled={!lastAnswer || saving} onClick={() => void toggleReview()} className={`mt-3 min-h-10 rounded-full border px-4 text-[11px] font-black ${lastAnswer?.review_requested ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'}`}>{lastAnswer?.review_requested ? 'Marcado para repasar' : 'Quiero repasar'}</button><button type="button" onClick={() => void next()} disabled={saving || !lastAnswer} className="mt-3 min-h-12 w-full rounded-full bg-indigo-600 text-sm font-black text-white">{index + 1 === questions.length ? 'Terminar práctica' : 'Siguiente'}</button></div>}
        </>
      )}

      {finished && (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="mt-2 text-xl font-black">Práctica terminada</h3>
          <div className="mt-4 grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-4"><div><p className="text-2xl font-black text-indigo-700">{finalPct}%</p><p className="text-[10px] font-black text-slate-500">Precisión</p></div><div><p className="text-2xl font-black">{correct}/{questions.length}</p><p className="text-[10px] font-black text-slate-500">Aciertos</p></div></div>
          <p className="mt-4 text-[12px] font-semibold leading-relaxed text-slate-600">{finalFeedback}</p>
          <div className="mt-3 border-l-2 border-indigo-200 pl-3 text-left"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-indigo-700">Recomendación</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p></div>
          <button type="button" onClick={resetPractice} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-black text-white"><RotateCcw className="h-4 w-4" />Nueva práctica</button>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-center text-[11px] font-bold text-rose-600">{error}</p>}

      {!active && (
        <div className="mt-5 border-t border-slate-200 pt-1">
          <button type="button" onClick={() => setHistoryOpen(value => !value)} aria-expanded={historyOpen} className="flex min-h-12 w-full items-center justify-between gap-3 text-left"><span><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Tu historial</span><span className="block text-sm font-black">{sessions.filter(item => item.status === 'completed').length} sesiones completadas</span></span><ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${historyOpen ? 'rotate-180' : ''}`} /></button>
          {historyOpen && (
            <div className="border-t border-slate-200 py-4">
              {metrics.totalAttempts === 0 ? <p className="text-[12px] leading-relaxed text-slate-500">Todavía no hay intentos objetivos. Completa una práctica para crear tu primera línea base.</p> : <><div className="grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3 text-center"><div><p className="text-xl font-black text-indigo-700">{metrics.accuracy ?? 0}%</p><p className="text-[9px] font-black text-slate-400">Precisión</p></div><div><p className="text-xl font-black">{metrics.retention === null ? '—' : `${metrics.retention}%`}</p><p className="text-[9px] font-black text-slate-400">Retención</p></div><div><p className="text-sm font-black">{metrics.trend}</p><p className="text-[9px] font-black text-slate-400">Tendencia</p></div></div><div className="mt-4 space-y-2">{metrics.areas.filter(area => area.attempts > 0).map(area => <div key={area.skill} className="flex items-center justify-between gap-3 text-[11px]"><span className="font-bold text-slate-600">{SKILL_LABELS[area.skill]}</span><span className="font-black text-slate-900">{area.accuracy ?? 0}% · {area.state}</span></div>)}</div>{metrics.evolution !== null && <p className="mt-4 text-[11px] text-slate-500">Evolución frente a tu sesión anterior: <span className="font-black text-slate-800">{metrics.evolution > 0 ? '+' : ''}{metrics.evolution} puntos</span>.</p>}<div className="mt-4 border-l-2 border-indigo-200 pl-3"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-indigo-700">Qué estudiar después</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p></div></>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
