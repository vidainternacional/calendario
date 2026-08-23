'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Mic, RotateCcw, SlidersHorizontal, Square, Sparkles } from 'lucide-react'
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
  startHebrewProgressSession,
} from '@/lib/hebreo/progress-store'

const DIFFICULTIES: readonly { id: HebrewDifficulty; label: string; level: string; detail: string }[] = [
  { id: 'initial', label: 'Básico', level: 'Nivel 1', detail: 'Fundamentos completos: Alef-Bet, Sofit, Dagesh, vocales, Sheva y vocabulario inicial.' },
  { id: 'intermediate', label: 'Intermedio', level: 'Nivel 2', detail: 'Combina fundamentos con lectura, vocabulario y reglas con distractores más cercanos.' },
  { id: 'advanced', label: 'Avanzado', level: 'Nivel 3', detail: 'Lectura con menos ayudas, texto sin niqqud, distinciones finas y reglas combinadas.' },
]
const LENGTHS = [10, 15, 20] as const
const IDLE_LEVELS = [12, 18, 26, 34, 42, 50, 42, 34, 26, 18, 12]

type TimedProgressAnswer = HebrewProgressAnswer & { response_time_ms?: number | null }
type CoachQuestion = HebrewPracticeQuestion & { interaction?: 'choice' | 'pronunciation'; pronunciationHint?: string }
type SpeechResultEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } }
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

const ORAL_CHECKPOINTS: Record<HebrewDifficulty, readonly CoachQuestion[]> = {
  initial: [
    { key: 'oral-initial-shalom', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'שָׁלוֹם', pronunciationHint: 'shalóm', options: [], correctIndex: 0, explanation: 'שָׁלוֹם se practica como shalóm.' },
    { key: 'oral-initial-melekh', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'מֶלֶךְ', pronunciationHint: 'mélej', options: [], correctIndex: 0, explanation: 'מֶלֶךְ se practica como mélej.' },
    { key: 'oral-initial-bayit', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'בַּיִת', pronunciationHint: 'báyit', options: [], correctIndex: 0, explanation: 'בַּיִת se practica como báyit.' },
  ],
  intermediate: [
    { key: 'oral-intermediate-bereshit', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta frase completa', hebrew: 'בְּרֵאשִׁית בָּרָא', pronunciationHint: 'be-reshít bará', options: [], correctIndex: 0, explanation: 'La lectura pedagógica usada es be-reshít bará.' },
    { key: 'oral-intermediate-ha-davar', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta frase completa', hebrew: 'הַדָּבָר טוֹב', pronunciationHint: 'ha-davár tov', options: [], correctIndex: 0, explanation: 'Lee cada bloque y después une la frase.' },
  ],
  advanced: [
    { key: 'oral-advanced-ha-davar', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta frase sin ayuda de transliteración', hebrew: 'הַדָּבָר הַטּוֹב', options: [], correctIndex: 0, explanation: 'En avanzado la lectura debe sostenerse con menos ayudas.' },
    { key: 'oral-advanced-construct', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta expresión completa', hebrew: 'בֵּית הַמֶּלֶךְ', options: [], correctIndex: 0, explanation: 'Esta expresión practica lectura y estado constructo.' },
  ],
}

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
      rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1))
    }
  }
  return Math.max(0, Math.round((1 - rows[a.length][b.length] / Math.max(a.length, b.length)) * 100))
}

function nowMs() { return typeof performance !== 'undefined' ? performance.now() : Date.now() }
function median(values: number[]) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2) }
function secondsLabel(value: number | null | undefined) { if (value == null || !Number.isFinite(value)) return '—'; const seconds = value / 1000; return seconds < 10 ? `${seconds.toFixed(1)} s` : `${Math.round(seconds)} s` }
function levelName(difficulty: HebrewDifficulty | null) { if (difficulty === 'initial') return 'Nivel 1 · Básico'; if (difficulty === 'intermediate') return 'Nivel 2 · Intermedio'; if (difficulty === 'advanced') return 'Nivel 3 · Avanzado'; return 'Según mi progreso' }
function dateLabel(value: string) { return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) }

export default function HebrewProgressCoach() {
  const [historyOpen, setHistoryOpen] = useState(true)
  const [customOpen, setCustomOpen] = useState(false)
  const [mode, setMode] = useState<'adaptive' | 'difficulty'>('adaptive')
  const [difficulty, setDifficulty] = useState<HebrewDifficulty>('initial')
  const [questionCount, setQuestionCount] = useState<number>(15)
  const [focusAreas, setFocusAreas] = useState<HebrewSkill[]>([])
  const [sessions, setSessions] = useState<HebrewProgressSession[]>([])
  const [answers, setAnswers] = useState<HebrewProgressAnswer[]>([])
  const [questions, setQuestions] = useState<CoachQuestion[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [speechResult, setSpeechResult] = useState<{ transcript: string; score: number } | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null)
  const [levels, setLevels] = useState(IDLE_LEVELS)
  const questionStartedAtRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frameRef = useRef<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { const data = await loadHebrewProgress(); setSessions(data.sessions); setAnswers(data.answers); setError(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu progreso.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  function pauseSpectrum() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    analyserRef.current = null
    setLevels(IDLE_LEVELS)
  }

  async function releaseMicrophone() {
    pauseSpectrum()
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    const context = audioContextRef.current
    audioContextRef.current = null
    if (context && context.state !== 'closed') {
      try { await context.close() } catch { /* iOS puede haberlo cerrado */ }
    }
  }

  function drawSpectrum(analyser: AnalyserNode) {
    const data = new Uint8Array(analyser.frequencyBinCount)
    const draw = () => {
      if (analyserRef.current !== analyser) return
      analyser.getByteFrequencyData(data)
      const average = data.length ? data.reduce((sum, value) => sum + value, 0) / data.length : 0
      const next = IDLE_LEVELS.map((_, bar) => {
        const centerDistance = Math.abs(bar - Math.floor(IDLE_LEVELS.length / 2))
        const sampleIndex = Math.min(data.length - 1, Math.max(0, Math.floor((bar / IDLE_LEVELS.length) * data.length)))
        const sample = data[sampleIndex] ?? average
        const shape = Math.max(0.52, 1 - centerDistance * 0.055)
        return Math.max(12, Math.min(100, Math.round(((sample * 0.7 + average * 0.3) / 255) * 100 * shape)))
      })
      setLevels(next)
      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  async function ensureMicrophone() {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) throw new Error('microphone-unavailable')
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) throw new Error('audio-context-unavailable')
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    const context = new AudioContextCtor()
    audioContextRef.current = context
    if (context.state === 'suspended') {
      try { await context.resume() } catch { /* Safari puede reanudarlo con el gesto actual */ }
    }
    const analyser = context.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.62
    context.createMediaStreamSource(streamRef.current).connect(analyser)
    analyserRef.current = analyser
    drawSpectrum(analyser)
  }

  useEffect(() => () => { void releaseMicrophone() }, [])

  const metrics = useMemo(() => deriveProgressMetrics(sessions, answers), [sessions, answers])
  const adaptiveLevel = useMemo(() => deriveStrictAdaptiveLevel(answers), [answers])
  const level = DIFFICULTIES.find(item => item.id === difficulty)!
  const levelMastery = useMemo(() => deriveLevelMastery(answers, difficulty), [answers, difficulty])
  const masteryByLevel = useMemo(() => ({ initial: deriveLevelMastery(answers, 'initial'), intermediate: deriveLevelMastery(answers, 'intermediate'), advanced: deriveLevelMastery(answers, 'advanced') }), [answers])
  const gradebook = useMemo(() => deriveSessionGrades(sessions, answers), [sessions, answers])
  const previewQuestions = useMemo(() => mode === 'adaptive' ? selectStrictAdaptiveQuestions(answers, focusAreas, questionCount) : selectMasteryQuestions(answers, difficulty, focusAreas, questionCount), [answers, difficulty, focusAreas, mode, questionCount])
  const responseTiming = useMemo(() => {
    const timed = (answers as TimedProgressAnswer[]).filter(answer => !answer.question_key.startsWith('review:') && typeof answer.response_time_ms === 'number' && answer.response_time_ms >= 0).sort((a, b) => Date.parse(a.answered_at) - Date.parse(b.answered_at))
    const typicalMs = median(timed.map(answer => answer.response_time_ms as number))
    if (timed.length < 6) return { typicalMs, trend: 'Creando línea base' as const }
    const split = Math.floor(timed.length / 2)
    const previous = median(timed.slice(0, split).map(answer => answer.response_time_ms as number))
    const recent = median(timed.slice(split).map(answer => answer.response_time_ms as number))
    if (previous != null && recent != null && recent <= previous * 0.85) return { typicalMs, trend: 'Más fluido' as const }
    if (previous != null && recent != null && recent >= previous * 1.2) return { typicalMs, trend: 'Más pausado' as const }
    return { typicalMs, trend: 'Estable' as const }
  }, [answers])

  const oralPassed = useMemo(() => ({
    initial: answers.some(answer => answer.question_key.startsWith('oral-initial-') && answer.is_correct),
    intermediate: answers.some(answer => answer.question_key.startsWith('oral-intermediate-') && answer.is_correct),
    advanced: answers.some(answer => answer.question_key.startsWith('oral-advanced-') && answer.is_correct),
  }), [answers])
  const fundamentalsComplete = masteryByLevel.initial.passed && masteryByLevel.intermediate.passed && masteryByLevel.advanced.passed && oralPassed.initial && oralPassed.intermediate && oralPassed.advanced

  const current = questions[index] ?? null
  const active = Boolean(sessionId && current && !finished)
  const isPronunciation = current?.interaction === 'pronunciation'
  const progress = questions.length ? Math.round(((index + (selected !== null || speechResult ? 1 : 0)) / questions.length) * 100) : 0
  const totalPoolForSelectedLevel = ALL_HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === difficulty).length

  function toggleArea(skill: HebrewSkill) { if (!active) setFocusAreas(previous => previous.includes(skill) ? previous.filter(item => item !== skill) : [...previous, skill]) }
  function checkpointFor(target: HebrewDifficulty) {
    const pool = ORAL_CHECKPOINTS[target]
    const counts = new Map(pool.map(item => [item.key, answers.filter(answer => answer.question_key === item.key).length]))
    return [...pool].sort((a, b) => (counts.get(a.key) ?? 0) - (counts.get(b.key) ?? 0))[0]
  }

  async function begin() {
    setSaving(true); setError(null); setSpeechResult(null); setSpeechError(null)
    try {
      let nextQuestions = mode === 'adaptive' ? selectStrictAdaptiveQuestions(answers, focusAreas, questionCount) : selectMasteryQuestions(answers, difficulty, focusAreas, questionCount)
      if (!nextQuestions.length && focusAreas.length) nextQuestions = mode === 'adaptive' ? selectStrictAdaptiveQuestions(answers, [], questionCount) : selectMasteryQuestions(answers, difficulty, [], questionCount)
      const requested: HebrewDifficulty = mode === 'difficulty' ? difficulty : adaptiveLevel.level === 1 ? 'initial' : adaptiveLevel.level === 2 ? 'intermediate' : 'advanced'
      const normalQuestions = nextQuestions.length ? nextQuestions : selectMasteryQuestions(answers, requested, [], questionCount)
      if (!normalQuestions.length) throw new Error('No hay preguntas disponibles en esta selección.')
      const id = await startHebrewProgressSession(mode, requested, focusAreas)
      setQuestions([...normalQuestions, checkpointFor(requested)])
      setSessionId(id); setIndex(0); setCorrect(0); setSelected(null); setFinished(false); questionStartedAtRef.current = nowMs()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo iniciar la práctica.') }
    finally { setSaving(false) }
  }

  async function advanceAfterSave() {
    await new Promise(resolve => window.setTimeout(resolve, 520))
    setSpeechResult(null); setSpeechError(null)
    await releaseMicrophone()
    if (index + 1 < questions.length) { questionStartedAtRef.current = nowMs(); setIndex(value => value + 1); setSelected(null); return }
    if (!sessionId) return
    questionStartedAtRef.current = null
    await finishHebrewProgressSession(sessionId)
    setFinished(true); setSelected(null); await refresh()
  }

  async function answer(optionIndex: number) {
    if (!current || !sessionId || isPronunciation || selected !== null || saving) return
    const responseTimeMs = questionStartedAtRef.current == null ? null : Math.max(0, nowMs() - questionStartedAtRef.current)
    setSaving(true); setSelected(optionIndex)
    const isCorrect = optionIndex === current.correctIndex
    try {
      const saved = await saveHebrewProgressAnswer({ sessionId, questionKey: current.key, questionVersion: current.version, skill: current.skill, difficulty: current.difficulty, responseText: current.options[optionIndex], isCorrect, reviewRequested: !isCorrect, responseTimeMs })
      setAnswers(previous => [saved, ...previous]); if (isCorrect) setCorrect(value => value + 1); setError(null); await advanceAfterSave()
    } catch (cause) { setSelected(null); setError(cause instanceof Error ? cause.message : 'No se pudo guardar esta respuesta.') }
    finally { setSaving(false) }
  }

  async function startListening() {
    if (!current?.hebrew || !isPronunciation || typeof window === 'undefined' || saving) return
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) { setSpeechError('Este navegador no ofrece reconocimiento de voz compatible. En iPhone, abre el Preview directamente en Safari y permite el micrófono.'); return }
    setSpeechResult(null); setSpeechError(null)
    try {
      await ensureMicrophone()
      const instance = new Recognition(); instance.lang = 'he-IL'; instance.interimResults = false; instance.maxAlternatives = 1
      instance.onstart = () => setListening(true)
      instance.onresult = event => { const transcript = event.results[0][0].transcript; void submitPronunciation(transcript) }
      instance.onerror = () => { setListening(false); setRecognition(null); void releaseMicrophone(); setSpeechError('No pude convertir la voz a texto esta vez. Toca Hablar e inténtalo nuevamente.') }
      instance.onend = () => { setListening(false); setRecognition(null); void releaseMicrophone() }
      setRecognition(instance)
      instance.start()
    } catch {
      setListening(false); setRecognition(null); await releaseMicrophone(); setSpeechError('El micrófono no pudo iniciar. Inténtalo nuevamente.')
    }
  }

  async function submitPronunciation(transcript: string) {
    if (!current?.hebrew || !sessionId || !isPronunciation || saving) return
    const score = similarity(current.hebrew, transcript)
    const isCorrect = score >= 85
    const responseTimeMs = questionStartedAtRef.current == null ? null : Math.max(0, nowMs() - questionStartedAtRef.current)
    setSpeechResult({ transcript, score }); setSaving(true)
    try {
      const saved = await saveHebrewProgressAnswer({ sessionId, questionKey: current.key, questionVersion: current.version, skill: current.skill, difficulty: current.difficulty, responseText: transcript, isCorrect, reviewRequested: !isCorrect, responseTimeMs })
      setAnswers(previous => [saved, ...previous]); if (isCorrect) setCorrect(value => value + 1); setError(null)
      await new Promise(resolve => window.setTimeout(resolve, 1100))
      await advanceAfterSave()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la evaluación oral.') }
    finally { setSaving(false) }
  }

  function stopListening() { recognition?.stop(); void releaseMicrophone() }
  function resetPractice() { recognition?.stop(); void releaseMicrophone(); setSessionId(null); setQuestions([]); setIndex(0); setCorrect(0); setSelected(null); setFinished(false); setSpeechResult(null); setSpeechError(null); questionStartedAtRef.current = null }

  const finalPct = questions.length ? Math.round((correct / questions.length) * 100) : 0
  const finalFeedback = finalPct >= 90 ? 'Excelente sesión. Sigue practicando para sostener la retención y la lectura.' : finalPct >= 75 ? 'Buen resultado. Mantén la práctica y vuelve a los puntos que aún generan duda.' : finalPct >= 60 ? 'Vas avanzando. Los errores quedaron marcados para volver en Repaso.' : 'Conviene reforzar fundamentos antes de subir la dificultad.'

  return <div className="text-center">
    {!active && !finished && <>
      <div className="py-3"><p className="text-[13px] font-black text-slate-900">Entrena, responde y termina leyendo en voz alta</p><p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">La evaluación avanza sola. Al final aparece una prueba oral independiente para comprobar que también puedes leer lo aprendido.</p></div>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3"><button type="button" onClick={() => setMode('adaptive')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'adaptive' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Según mi progreso</button><button type="button" onClick={() => setMode('difficulty')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'difficulty' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Elegir nivel</button></div>
      {mode === 'adaptive' ? <div className="mt-4"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Nivel adaptativo</p><p className="mt-1 text-[18px] font-black">Nivel {adaptiveLevel.level} · {adaptiveLevel.label}</p><div className="mx-auto mt-3 h-2.5 max-w-sm overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${adaptiveLevel.progress}%` }} /></div></div> : <div className="mt-4"><div className="grid grid-cols-3 gap-2">{DIFFICULTIES.map(item => <button key={item.id} type="button" onClick={() => setDifficulty(item.id)} className={`min-h-[58px] rounded-[16px] border px-1 ${difficulty === item.id ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-[9px] font-black uppercase">{item.level}</span><span className="block text-[12px] font-black">{item.label}</span></button>)}</div><p className="mt-3 text-[12px] font-black">¿Qué te espera en {level.label}?</p><p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">{level.detail}</p><p className="mt-2 text-[10px] font-bold text-emerald-700">Dominio: {levelMastery.mastered}/{levelMastery.total} · {levelMastery.coverage}%</p></div>}
      <div className="mt-4 border-y border-slate-200"><button type="button" onClick={() => setCustomOpen(value => !value)} className="flex min-h-[56px] w-full items-center justify-center gap-3"><SlidersHorizontal className="h-4 w-4 text-indigo-600"/><span><span className="block text-[12px] font-black">Personalizar práctica</span><span className="block text-[9px] text-slate-400">Cantidad y áreas</span></span><ChevronDown className={`h-4 w-4 text-slate-400 ${customOpen ? 'rotate-180' : ''}`}/></button>{customOpen && <div className="border-t border-slate-100 pb-4 pt-3"><p className="text-[10px] font-black uppercase text-slate-400">Preguntas</p><div className="mx-auto mt-2 grid max-w-xs grid-cols-3 gap-2">{LENGTHS.map(length => <button key={length} type="button" onClick={() => setQuestionCount(length)} className={`min-h-10 rounded-full border text-[12px] font-black ${questionCount===length?'border-indigo-300 bg-indigo-50 text-indigo-800':'border-slate-200 text-slate-500'}`}>{length}</button>)}</div><p className="mt-4 text-[10px] font-black uppercase text-slate-400">Áreas</p><div className="mt-2 flex flex-wrap justify-center gap-2">{SKILL_ORDER.map(skill => <button key={skill} type="button" onClick={() => toggleArea(skill)} className={`min-h-9 rounded-full border px-3 text-[10px] font-black ${focusAreas.includes(skill)?'border-indigo-300 bg-indigo-50 text-indigo-800':'border-slate-200 bg-white text-slate-500'}`}>{SKILL_LABELS[skill]}</button>)}</div>{mode==='difficulty'&&<p className="mt-3 text-[10px] text-slate-500">Banco del nivel: {totalPoolForSelectedLevel} preguntas + prueba oral final.</p>}</div>}</div>
      {fundamentalsComplete && <div className="mx-auto mt-4 max-w-sm rounded-[18px] bg-indigo-50 px-4 py-4"><Sparkles className="mx-auto h-5 w-5 text-indigo-600"/><p className="mt-1 text-[12px] font-black text-indigo-900">Fundamentos dominados · 100%</p><p className="mt-1 text-[10px] leading-relaxed text-indigo-700">Desde aquí la práctica sigue como Perfeccionamiento: retención, lectura, reglas combinadas y desafíos avanzados. El curso no sube artificialmente de 100%.</p></div>}
      <button type="button" onClick={() => void begin()} disabled={saving || loading || previewQuestions.length===0} className="mt-4 min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-50">{saving?'Preparando…':`Comenzar · ${Math.min(questionCount, previewQuestions.length)} + oral`}</button>
    </>}

    {active && current && <>
      <div><p className="text-[10px] font-black uppercase tracking-[.1em] text-indigo-700">{isPronunciation ? `Prueba oral final · ${levelName(current.difficulty)}` : `${current.type} · ${SKILL_LABELS[current.skill]}`}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{isPronunciation ? `${correct} aciertos en la parte escrita` : `Pregunta ${index+1} de ${questions.length-1} · ${correct} aciertos`}</p></div>
      <div className="mx-auto mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{width:`${progress}%`}}/></div>
      <div className="py-6"><p className="mx-auto max-w-xl text-[1.4rem] font-black leading-snug sm:text-[1.55rem]">{current.prompt}</p>{current.hebrew&&<p lang="he" dir="rtl" className="mt-5 text-[4rem] font-black leading-tight text-indigo-700 sm:text-[4.5rem]">{current.hebrew}</p>}{isPronunciation&&current.pronunciationHint&&<p className="mt-2 text-[14px] font-bold text-slate-500">{current.pronunciationHint}</p>}</div>
      {isPronunciation ? <div className="mx-auto max-w-sm border-y border-slate-100 py-5" data-oral-checkpoint="true"><p className="text-[11px] font-black uppercase tracking-[.1em] text-slate-400">Prueba oral final</p><p className="mt-1 text-[12px] text-slate-500">Esta pregunta es solo de pronunciación. Toca Hablar, pronuncia el texto y espera el resultado.</p><div className="mx-auto mt-5 flex h-16 max-w-[250px] items-center justify-center gap-1.5" aria-label={listening ? 'Micrófono activo, espectro de voz en movimiento' : 'Micrófono inactivo'}>{levels.map((height, bar)=><span key={bar} className={`w-2 rounded-full transition-[height,background-color] duration-75 ${listening?'bg-cyan-500':'bg-cyan-200'}`} style={{height:`${height}%`}} />)}</div><p className={`mt-1 text-[11px] font-black ${listening?'text-cyan-700':'text-slate-400'}`}>{listening?'Te estoy escuchando…':'Listo para escuchar'}</p><button type="button" onClick={listening?stopListening:()=>void startListening()} disabled={saving} className={`mt-4 inline-flex min-h-14 items-center gap-2 rounded-full px-7 text-[13px] font-black ${listening?'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200':'bg-indigo-600 text-white'}`}>{listening?<Square className="h-4 w-4"/>:<Mic className="h-5 w-5"/>}{listening?'Terminar':'Hablar'}</button>{speechResult&&<div className="mt-4"><p className="text-[12px] text-slate-500">Reconocí: <span lang="he" dir="rtl" className="text-[18px] font-black text-slate-900">{speechResult.transcript}</span></p><p className={`mt-2 text-[15px] font-black ${speechResult.score>=85?'text-emerald-700':speechResult.score>=60?'text-amber-700':'text-rose-700'}`}>{speechResult.score>=85?'Lectura reconocida correctamente':speechResult.score>=60?'Está cerca; conviene repetirla en Repaso':'Necesita más práctica de lectura'} · {speechResult.score}%</p></div>}{speechError&&<p className="mt-3 text-[12px] font-bold text-rose-600">{speechError}</p>}</div> : <div className="grid grid-cols-3 gap-2">{current.options.map((option,optionIndex)=>{const chosen=selected===optionIndex;const correctOption=selected!==null&&current.correctIndex===optionIndex;return <button key={`${current.key}-${option}`} type="button" disabled={selected!==null||saving} onClick={()=>void answer(optionIndex)} className={`min-h-[5.4rem] rounded-[18px] border px-3 py-3 text-center font-black leading-tight ${normalizeHebrew(option).length?'text-[2.15rem] sm:text-[2.35rem]':'text-[1.22rem] sm:text-[1.35rem]'} ${correctOption?'border-emerald-300 bg-emerald-50 text-emerald-800':chosen?'border-rose-300 bg-rose-50 text-rose-800':'border-slate-200 bg-white text-slate-800'}`}>{option}</button>})}</div>}
    </>}

    {finished&&<div><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600"/><h3 className="mt-2 text-xl font-black">Práctica terminada</h3><div className="mt-4 grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-4"><div><p className="text-2xl font-black text-emerald-700">{finalPct}%</p><p className="text-[10px] font-black text-slate-500">Nota</p></div><div><p className="text-2xl font-black">{correct}/{questions.length}</p><p className="text-[10px] font-black text-slate-500">Aciertos</p></div></div><p className="mx-auto mt-4 max-w-sm text-[12px] font-semibold leading-relaxed text-slate-600">{finalFeedback}</p><p className="mx-auto mt-3 max-w-sm text-[11px] font-semibold text-indigo-700">{metrics.recommendation}</p><button type="button" onClick={resetPractice} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-black text-white"><RotateCcw className="h-4 w-4"/>Nueva práctica</button></div>}

    {error&&<p role="alert" className="mt-3 text-[11px] font-bold text-rose-600">{error}</p>}
    {!active&&<div className="mt-5 border-t border-slate-200 pt-2"><button type="button" onClick={()=>setHistoryOpen(value=>!value)} className="flex min-h-12 w-full items-center justify-center gap-3"><span><span className="block text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Cuadro de notas</span><span className="block text-sm font-black">{loading?'Cargando historial…':`${gradebook.length} evaluaciones registradas`}</span></span><ChevronDown className={`h-4 w-4 text-slate-400 ${historyOpen?'rotate-180':''}`}/></button>{historyOpen&&<div className="border-t border-slate-200 py-4">{gradebook.length===0?<p className="text-[12px] text-slate-500">Todavía no hay evaluaciones guardadas.</p>:<><div className="overflow-hidden rounded-[18px] bg-slate-100/70 text-left"><div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-[9px] font-black uppercase text-slate-400"><span>Evaluación</span><span>Aciertos</span><span>Nota</span></div>{gradebook.slice(0,12).map(row=><div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-white/80 px-3 py-3 text-[10px]"><div><p className="font-black text-slate-800">{levelName(row.difficulty)}</p><p className="text-[9px] text-slate-400">{dateLabel(row.startedAt)}</p></div><span className="font-bold text-slate-600">{row.correct}/{row.answers}</span><span className="font-black">{row.score}%</span></div>)}</div><div className="mt-4 grid grid-cols-2 border-y border-slate-200"><div className="border-b border-r border-slate-200 py-3"><p className="text-xl font-black text-emerald-700">{metrics.accuracy??0}%</p><p className="text-[9px] font-black text-slate-400">Precisión</p></div><div className="border-b border-slate-200 py-3"><p className="text-xl font-black">{metrics.retention===null?'—':`${metrics.retention}%`}</p><p className="text-[9px] font-black text-slate-400">Retención</p></div><div className="border-r border-slate-200 py-3"><p className="text-[11px] font-black">{responseTiming.trend}</p><p className="text-[9px] font-black text-slate-400">Fluidez</p></div><div className="py-3"><p className="text-xl font-black">{secondsLabel(responseTiming.typicalMs)}</p><p className="text-[9px] font-black text-slate-400">Tiempo típico</p></div></div><div className="mt-4 space-y-2">{metrics.areas.filter(area=>area.attempts>0).map(area=><div key={area.skill} className="text-[11px]"><p className="font-bold text-slate-600">{SKILL_LABELS[area.skill]}</p><p className="font-black">{area.accuracy??0}% · {area.state}</p></div>)}</div></>}</div>}</div>}
  </div>
}