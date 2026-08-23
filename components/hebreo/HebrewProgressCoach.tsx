'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, Mic, RotateCcw, SlidersHorizontal, Square } from 'lucide-react'
import {
  deriveProgressMetrics,
  SKILL_LABELS,
  SKILL_ORDER,
  type HebrewDifficulty,
  type HebrewPracticeQuestion,
  type HebrewProgressAnswer,
  type HebrewProgressSession,
  type HebrewSkill,
} from '@/lib/hebreo/progress'
import {
  ALL_HEBREW_PRACTICE_QUESTIONS,
  deriveLevelMastery,
  deriveSessionGrades,
  deriveStrictAdaptiveLevel,
  selectMasteryQuestions,
  selectStrictAdaptiveQuestions,
} from '@/lib/hebreo/progress-mastery'
import {
  finishHebrewProgressSession,
  loadHebrewProgress,
  saveHebrewProgressAnswer,
  setHebrewReviewRequested,
  startHebrewProgressSession,
} from '@/lib/hebreo/progress-store'

const DIFFICULTIES: readonly { id: HebrewDifficulty; label: string; level: string; detail: string }[] = [
  { id: 'initial', label: 'Básico', level: 'Nivel 1', detail: 'Fundamentos completos: Alef-Bet, reconocimiento visual, formas finales, dagesh, vocales, sheva y vocabulario inicial. No subes solo por una buena prueba: debes cubrir y dominar el banco del nivel.' },
  { id: 'intermediate', label: 'Intermedio', level: 'Nivel 2', detail: 'Combina fundamentos con lectura, vocabulario y reglas. Los distractores son más cercanos y debes sostener precisión en diferentes áreas.' },
  { id: 'advanced', label: 'Avanzado', level: 'Nivel 3', detail: 'Lectura con menos ayudas, texto sin niqqud, distinciones finas y aplicación conjunta de reglas. Está diseñado para exigir dominio, no solo reconocimiento rápido.' },
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

function levelName(difficulty: HebrewDifficulty | null) {
  if (difficulty === 'initial') return 'Nivel 1 · Básico'
  if (difficulty === 'intermediate') return 'Nivel 2 · Intermedio'
  if (difficulty === 'advanced') return 'Nivel 3 · Avanzado'
  return 'Según mi progreso'
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export default function HebrewProgressCoach() {
  const [historyOpen, setHistoryOpen] = useState(true)
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
    setLoading(true)
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
  const adaptiveLevel = useMemo(() => deriveStrictAdaptiveLevel(answers), [answers])
  const level = DIFFICULTIES.find(item => item.id === difficulty)!
  const levelMastery = useMemo(() => deriveLevelMastery(answers, difficulty), [answers, difficulty])
  const gradebook = useMemo(() => deriveSessionGrades(sessions, answers), [sessions, answers])
  const previewQuestions = useMemo(() => mode === 'adaptive'
    ? selectStrictAdaptiveQuestions(answers, focusAreas, questionCount)
    : selectMasteryQuestions(answers, difficulty, focusAreas, questionCount), [answers, difficulty, focusAreas, mode, questionCount])

  const current = questions[index] ?? null
  const active = Boolean(sessionId && current && !finished)
  const progress = questions.length ? Math.round(((index + (selected !== null ? 1 : 0)) / questions.length) * 100) : 0
  const canTestSpeech = Boolean(current?.hebrew && normalizeHebrew(current.hebrew).length >= 2)
  const totalPoolForSelectedLevel = ALL_HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === difficulty).length

  function toggleArea(skill: HebrewSkill) {
    if (!active) setFocusAreas(previous => previous.includes(skill) ? previous.filter(item => item !== skill) : [...previous, skill])
  }

  async function begin() {
    setSaving(true)
    setError(null)
    setSpeechResult(null)
    try {
      let nextQuestions = mode === 'adaptive'
        ? selectStrictAdaptiveQuestions(answers, focusAreas, questionCount)
        : selectMasteryQuestions(answers, difficulty, focusAreas, questionCount)
      if (!nextQuestions.length && focusAreas.length) {
        nextQuestions = mode === 'adaptive'
          ? selectStrictAdaptiveQuestions(answers, [], questionCount)
          : selectMasteryQuestions(answers, difficulty, [], questionCount)
      }
      if (!nextQuestions.length) throw new Error('Ya no tienes preguntas nuevas pendientes en esta selección. Vuelve cuando toque repaso de retención o cambia de nivel/área.')
      const requested = mode === 'difficulty' ? difficulty : adaptiveLevel.level === 1 ? 'initial' : adaptiveLevel.level === 2 ? 'intermediate' : 'advanced'
      const id = await startHebrewProgressSession(mode, requested, focusAreas)
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
      setSpeechError('Este navegador no ofrece reconocimiento de voz compatible. En iPhone, abre el Preview directamente en Safari y permite el micrófono.')
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
  function resetPractice() {
    setSessionId(null)
    setQuestions([])
    setIndex(0)
    setCorrect(0)
    setSelected(null)
    setLastAnswer(null)
    setFinished(false)
    setSpeechResult(null)
    setSpeechError(null)
  }

  const finalPct = questions.length ? Math.round((correct / questions.length) * 100) : 0
  const finalFeedback = finalPct >= 90
    ? 'Excelente dominio en esta sesión. Las respuestas correctas salen de la rotación normal y volverán más adelante solo para comprobar retención.'
    : finalPct >= 75
      ? 'Buen resultado. Sigue completando las preguntas pendientes del nivel antes de buscar el siguiente.'
      : finalPct >= 60
        ? 'Vas avanzando, pero todavía hay huecos claros. Las preguntas falladas seguirán apareciendo hasta que las domines.'
        : 'Esta sesión muestra que conviene reforzar fundamentos. No se sube de nivel hasta cubrir y dominar el contenido necesario.'

  return (
    <div className="text-center">
      {!active && !finished && (
        <>
          <div className="py-3">
            <p className="text-[13px] font-black text-slate-900">Mide lo que ya sabes y decide qué reforzar</p>
            <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">Cada respuesta alimenta tu historial. Acertar retira esa pregunta de la práctica normal; solo vuelve más adelante como control de retención.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
            <button type="button" onClick={() => setMode('adaptive')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'adaptive' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Según mi progreso</button>
            <button type="button" onClick={() => setMode('difficulty')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'difficulty' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Elegir nivel</button>
          </div>

          {mode === 'adaptive' ? (
            <div className="mt-4 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Nivel adaptativo</p>
              <p className="mt-1 text-[18px] font-black text-slate-950">Nivel {adaptiveLevel.level} · {adaptiveLevel.label}</p>
              <p className="mt-1 text-[11px] font-bold text-emerald-700">{adaptiveLevel.mastery.mastered} de {adaptiveLevel.mastery.total} objetivos dominados</p>
              <div className="mx-auto mt-3 h-2.5 max-w-sm overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${adaptiveLevel.progress}%` }} /></div>
              <p className="mx-auto mt-2 max-w-sm text-[10px] leading-relaxed text-slate-500">Una racha de errores puede bajarlo. Para subir necesitas cubrir el nivel completo y mantener al menos 85% de precisión acumulada; una sola prueba buena no basta.</p>
              <div className="mx-auto mt-4 max-w-sm border-t border-slate-100 pt-3"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-indigo-700">Qué conviene estudiar ahora</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p></div>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <div className="grid grid-cols-3 gap-2">{DIFFICULTIES.map(item => <button key={item.id} type="button" onClick={() => setDifficulty(item.id)} className={`min-h-[54px] rounded-[16px] border px-1 ${difficulty === item.id ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-[9px] font-black uppercase">{item.level}</span><span className="block text-[11px] font-black">{item.label}</span></button>)}</div>
              <p className="mt-4 text-[12px] font-black text-slate-900">¿Qué te espera en {level.label}?</p>
              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">{level.detail}</p>
              <p className="mt-2 text-[10px] font-bold text-emerald-700">Dominio: {levelMastery.mastered}/{levelMastery.total} · {levelMastery.coverage}%</p>
            </div>
          )}

          <div className="mt-4 border-y border-slate-200 text-center">
            <button type="button" onClick={() => setCustomOpen(value => !value)} aria-expanded={customOpen} className="flex min-h-[56px] w-full items-center justify-center gap-3 text-center">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              <span><span className="block text-[12px] font-black text-slate-800">Personalizar práctica</span><span className="block text-[9px] text-slate-400">Cantidad y áreas de refuerzo</span></span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${customOpen ? 'rotate-180' : ''}`} />
            </button>
            {customOpen && (
              <div className="border-t border-slate-100 pb-4 pt-3">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cantidad de preguntas</p>
                <div className="mx-auto mt-2 grid max-w-xs grid-cols-3 gap-2">{LENGTHS.map(length => <button key={length} type="button" onClick={() => setQuestionCount(length)} className={`min-h-10 rounded-full border text-[11px] font-black ${questionCount === length ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-500'}`}>{length}</button>)}</div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Áreas que quieres reforzar</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">{SKILL_ORDER.map(skill => <button key={skill} type="button" aria-pressed={focusAreas.includes(skill)} onClick={() => toggleArea(skill)} className={`min-h-9 rounded-full border px-3 text-[10px] font-black ${focusAreas.includes(skill) ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-500'}`}>{SKILL_LABELS[skill]}</button>)}</div>
                {mode === 'difficulty' && <p className="mx-auto mt-3 max-w-sm text-[10px] leading-relaxed text-slate-500">Este nivel tiene {totalPoolForSelectedLevel} preguntas distintas. La sesión toma solo preguntas pendientes o de retención; no mezclará niveles para rellenar el número.</p>}
              </div>
            )}
          </div>

          <div className="mt-4 border-b border-slate-100 pb-4 text-center">
            <div className="inline-flex items-center gap-2 text-indigo-700"><Mic className="h-4 w-4" /><span className="text-[11px] font-black">Pronunciación por voz incluida</span></div>
            <p className="mx-auto mt-1 max-w-sm text-[9px] leading-relaxed text-slate-400">En palabras y lecturas aparecerá el micrófono para hablar y comparar lo que Safari reconoce en hebreo.</p>
          </div>

          <button type="button" onClick={() => void begin()} disabled={saving || loading || previewQuestions.length === 0} className="mt-4 min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Preparando…' : `Comenzar · ${Math.min(questionCount, previewQuestions.length)} preguntas`}</button>
          {!loading && previewQuestions.length === 0 && <p className="mt-2 text-[10px] font-semibold text-emerald-700">No tienes preguntas nuevas pendientes en esta selección. Cambia de área/nivel o espera al repaso de retención.</p>}
        </>
      )}

      {active && current && (
        <>
          <div className="text-center"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">{current.type} · {SKILL_LABELS[current.skill]}</p><p className="mt-1 text-[11px] font-bold text-slate-400">Pregunta {index + 1} de {questions.length} · {correct} aciertos</p></div>
          <div className="mx-auto mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="py-6 text-center"><p className="text-[1.08rem] font-black">{current.prompt}</p>{current.hebrew && <p lang="he" dir="rtl" className="mt-5 text-[3.6rem] font-black leading-tight text-indigo-700">{current.hebrew}</p>}</div>

          {canTestSpeech && (
            <div className="mb-4 border-y border-slate-100 py-4 text-center">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Prueba tu pronunciación</p>
              <button type="button" onClick={listening ? stopListening : startListening} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[11px] font-black ${listening ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-indigo-600 text-white'}`}>{listening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}{listening ? 'Detener' : 'Hablar ahora'}</button>
              <p className="mx-auto mt-2 max-w-sm text-[9px] leading-relaxed text-slate-400">Compara lo que el navegador entendió con el texto esperado. No modifica tu nota ni sustituye una evaluación fonética profesional.</p>
              {speechResult && <div className="mt-2"><p className="text-[10px] text-slate-500">Escuché: <span lang="he" dir="rtl" className="font-black text-slate-800">{speechResult.transcript}</span></p><p className={`mt-1 text-[11px] font-black ${speechResult.score >= 85 ? 'text-emerald-700' : speechResult.score >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>{speechResult.score >= 85 ? 'Coincide muy bien con el texto esperado.' : speechResult.score >= 60 ? 'Está cerca; vuelve a intentarlo más despacio.' : 'El reconocimiento fue distinto. Repite despacio y con claridad.'}</p></div>}
              {speechError && <p className="mt-2 text-[10px] font-bold text-rose-600">{speechError}</p>}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">{current.options.map((option, optionIndex) => { const chosen = selected === optionIndex; const correctOption = selected !== null && current.correctIndex === optionIndex; return <button key={`${current.key}-${option}`} type="button" disabled={selected !== null || saving} onClick={() => void answer(optionIndex)} className={`min-h-[4.5rem] rounded-[16px] border px-2 py-3 text-center text-lg font-black ${correctOption ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : chosen ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-800'}`}>{option}</button> })}</div>

          {selected !== null && <div className="mt-4 border-t border-slate-200 pt-4 text-center"><p className={`text-sm font-black ${selected === current.correctIndex ? 'text-emerald-700' : 'text-rose-700'}`}>{selected === current.correctIndex ? 'Correcto' : 'Necesita repaso'}</p><p className="mx-auto mt-1 max-w-sm text-[12px] font-semibold text-slate-500">{current.explanation}</p><button type="button" disabled={!lastAnswer || saving} onClick={() => void toggleReview()} className={`mt-3 min-h-10 rounded-full border px-4 text-[11px] font-black ${lastAnswer?.review_requested ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'}`}>{lastAnswer?.review_requested ? 'Marcado para repasar' : 'Quiero repasar'}</button><button type="button" onClick={() => void next()} disabled={saving || !lastAnswer} className="mt-3 min-h-12 w-full rounded-full bg-indigo-600 text-sm font-black text-white">{index + 1 === questions.length ? 'Terminar práctica' : 'Siguiente'}</button></div>}
        </>
      )}

      {finished && (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="mt-2 text-xl font-black">Práctica terminada</h3>
          <div className="mt-4 grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-4"><div><p className="text-2xl font-black text-emerald-700">{finalPct}%</p><p className="text-[10px] font-black text-slate-500">Nota</p></div><div><p className="text-2xl font-black">{correct}/{questions.length}</p><p className="text-[10px] font-black text-slate-500">Aciertos</p></div></div>
          <p className="mx-auto mt-4 max-w-sm text-[12px] font-semibold leading-relaxed text-slate-600">{finalFeedback}</p>
          <div className="mx-auto mt-4 max-w-sm border-t border-slate-100 pt-3 text-center"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-indigo-700">Recomendación</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p></div>
          <button type="button" onClick={resetPractice} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-black text-white"><RotateCcw className="h-4 w-4" />Nueva práctica</button>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-center text-[11px] font-bold text-rose-600">{error}</p>}

      {!active && (
        <div className="mt-5 border-t border-slate-200 pt-2 text-center">
          <button type="button" onClick={() => setHistoryOpen(value => !value)} aria-expanded={historyOpen} className="flex min-h-12 w-full items-center justify-center gap-3 text-center"><span><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Cuadro de notas</span><span className="block text-sm font-black">{loading ? 'Cargando historial…' : `${gradebook.length} evaluaciones registradas`}</span></span><ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${historyOpen ? 'rotate-180' : ''}`} /></button>
          {historyOpen && (
            <div className="border-t border-slate-200 py-4 text-center">
              {gradebook.length === 0 ? <p className="mx-auto max-w-sm text-[12px] leading-relaxed text-slate-500">No hay evaluaciones guardadas para esta cuenta activa. El historial es privado por usuario; si cambiaste de cuenta, cada perfil conserva sus propias notas.</p> : <>
                <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white text-left">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-slate-50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400"><span>Evaluación</span><span>Aciertos</span><span>Nota</span></div>
                  {gradebook.slice(0, 12).map(row => <div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-slate-100 px-3 py-3 text-[10px]"><div><p className="font-black text-slate-800">{levelName(row.difficulty)}</p><p className="mt-0.5 text-[9px] text-slate-400">{dateLabel(row.startedAt)}{row.status !== 'completed' ? ' · incompleta' : ''}</p></div><span className="font-bold text-slate-600">{row.correct}/{row.answers}</span><span className={`min-w-11 rounded-full px-2 py-1 text-center font-black ${row.score >= 85 ? 'bg-emerald-50 text-emerald-700' : row.score >= 65 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{row.score}%</span></div>)}
                </div>
                <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3 text-center"><div><p className="text-xl font-black text-emerald-700">{metrics.accuracy ?? 0}%</p><p className="text-[9px] font-black text-slate-400">Precisión</p></div><div><p className="text-xl font-black">{metrics.retention === null ? '—' : `${metrics.retention}%`}</p><p className="text-[9px] font-black text-slate-400">Retención</p></div><div><p className="text-[11px] font-black">{metrics.trend}</p><p className="text-[9px] font-black text-slate-400">Tendencia</p></div></div>
                <div className="mt-4 space-y-2">{metrics.areas.filter(area => area.attempts > 0).map(area => <div key={area.skill} className="text-[11px]"><p className="font-bold text-slate-600">{SKILL_LABELS[area.skill]}</p><p className="font-black text-slate-900">{area.accuracy ?? 0}% · {area.state}</p></div>)}</div>
                {metrics.evolution !== null && <p className="mt-4 text-[11px] text-slate-500">Evolución frente a tu evaluación anterior: <span className="font-black text-slate-800">{metrics.evolution > 0 ? '+' : ''}{metrics.evolution} puntos</span>.</p>}
                <div className="mx-auto mt-4 max-w-sm border-t border-slate-100 pt-3"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-indigo-700">Qué estudiar después</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{metrics.recommendation}</p></div>
              </>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
