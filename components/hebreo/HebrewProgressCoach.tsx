'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Award, CheckCircle2, ChevronDown, Mic, RotateCcw, SlidersHorizontal, Square, Sparkles, XCircle } from 'lucide-react'
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
const VOICE_TIMEOUT_MS = 8500
const VOICE_RETRY_DELAY_MS = 520

type TimedProgressAnswer = HebrewProgressAnswer & { response_time_ms?: number | null }
type CoachQuestion = HebrewPracticeQuestion & { interaction?: 'choice' | 'pronunciation'; pronunciationHint?: string }
type SpeechResultEvent = { results: { length?: number; [index: number]: { isFinal?: boolean; [index: number]: { transcript: string } } } }
type SpeechErrorEvent = { error?: string }
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous?: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike
type VoiceStatus = 'idle' | 'requesting' | 'listening' | 'processing'
type TrainingFocus = 'mixed' | 'vocabulary' | 'reading' | 'pronunciation' | 'reading_pronunciation'
type TrainingOption = { id: TrainingFocus; label: string; short: string; detail: string }

const TRAINING_OPTIONS: readonly TrainingOption[] = [
  { id: 'mixed', label: 'Mixto', short: 'Todo', detail: 'Mezcla tus áreas y termina con pronunciación.' },
  { id: 'vocabulary', label: 'Vocabulario', short: 'Palabras', detail: 'Significado, reconocimiento y lectura de palabras.' },
  { id: 'reading', label: 'Lectura', short: 'Lectura', detail: 'Reconoce y comprende lecturas sin prueba oral.' },
  { id: 'pronunciation', label: 'Pronunciación', short: 'Voz', detail: 'Entrenamiento completo solo con micrófono.' },
  { id: 'reading_pronunciation', label: 'Lectura + voz', short: 'Leer + voz', detail: 'Lectura escrita y un tramo oral al final.' },
]

const ORAL_CHECKPOINTS: Record<HebrewDifficulty, readonly CoachQuestion[]> = {
  initial: [
    { key: 'oral-initial-shalom', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'שָׁלוֹם', pronunciationHint: 'shalóm', options: [], correctIndex: 0, explanation: 'שָׁלוֹם se practica como shalóm.' },
    { key: 'oral-initial-melekh', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'מֶלֶךְ', pronunciationHint: 'mélej', options: [], correctIndex: 0, explanation: 'מֶלֶךְ se practica como mélej.' },
    { key: 'oral-initial-bayit', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'בַּיִת', pronunciationHint: 'báyit', options: [], correctIndex: 0, explanation: 'בַּיִת se practica como báyit.' },
    { key: 'oral-initial-tov', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'טוֹב', pronunciationHint: 'tov', options: [], correctIndex: 0, explanation: 'טוֹב se practica como tov.' },
    { key: 'oral-initial-or', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'אוֹר', pronunciationHint: 'or', options: [], correctIndex: 0, explanation: 'אוֹר se practica como or.' },
    { key: 'oral-initial-torah', version: 1, skill: 'reading', difficulty: 'initial', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra', hebrew: 'תּוֹרָה', pronunciationHint: 'torá', options: [], correctIndex: 0, explanation: 'תּוֹרָה se practica como torá.' },
  ],
  intermediate: [
    { key: 'oral-intermediate-bereshit', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta frase completa', hebrew: 'בְּרֵאשִׁית בָּרָא', pronunciationHint: 'be-reshít bará', options: [], correctIndex: 0, explanation: 'La lectura pedagógica usada es be-reshít bará.' },
    { key: 'oral-intermediate-ha-davar', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta frase completa', hebrew: 'הַדָּבָר טוֹב', pronunciationHint: 'ha-davár tov', options: [], correctIndex: 0, explanation: 'Lee cada bloque y después une la frase.' },
    { key: 'oral-intermediate-bayit-tov', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia estas dos palabras', hebrew: 'בַּיִת טוֹב', pronunciationHint: 'báyit tov', options: [], correctIndex: 0, explanation: 'Primero lee cada palabra y luego únelas.' },
    { key: 'oral-intermediate-shema', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta expresión', hebrew: 'שְׁמַע יִשְׂרָאֵל', pronunciationHint: 'shemá yisraél', options: [], correctIndex: 0, explanation: 'Se practica por bloques antes de unir la expresión.' },
    { key: 'oral-intermediate-melekh-tov', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia estas dos palabras', hebrew: 'מֶלֶךְ טוֹב', pronunciationHint: 'mélej tov', options: [], correctIndex: 0, explanation: 'Lee cada bloque con claridad.' },
    { key: 'oral-intermediate-ha-melekh', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta palabra con artículo', hebrew: 'הַמֶּלֶךְ', pronunciationHint: 'ha-mélej', options: [], correctIndex: 0, explanation: 'Practica el artículo unido a la palabra.' },
  ],
  advanced: [
    { key: 'oral-advanced-ha-davar', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta frase sin ayuda de transliteración', hebrew: 'הַדָּבָר הַטּוֹב', options: [], correctIndex: 0, explanation: 'En avanzado la lectura debe sostenerse con menos ayudas.' },
    { key: 'oral-advanced-construct', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia esta expresión completa', hebrew: 'בֵּית הַמֶּלֶךְ', options: [], correctIndex: 0, explanation: 'Esta expresión practica lectura y estado constructo.' },
    { key: 'oral-advanced-bereshit', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Lee la frase completa con fluidez', hebrew: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים', options: [], correctIndex: 0, explanation: 'Lee por grupos y conserva el orden escrito.' },
    { key: 'oral-advanced-shema', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Lee esta expresión sin transliteración', hebrew: 'שְׁמַע יִשְׂרָאֵל', options: [], correctIndex: 0, explanation: 'La lectura avanzada reduce ayudas visibles.' },
    { key: 'oral-advanced-bet-ha-melekh', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Pronuncia la construcción completa', hebrew: 'בֵּית הַמֶּלֶךְ טוֹב', options: [], correctIndex: 0, explanation: 'Practica la continuidad entre los bloques.' },
    { key: 'oral-advanced-ha-davar-meod', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Pronunciación', interaction: 'pronunciation', prompt: 'Lee la secuencia completa', hebrew: 'הַדָּבָר טוֹב מְאֹד', options: [], correctIndex: 0, explanation: 'La lectura se evalúa como secuencia completa.' },
  ],
}

function normalizeHebrew(value: string) { return value.normalize('NFD').replace(/[\u0591-\u05C7]/g, '').replace(/[^\u05D0-\u05EA]/g, '') }
function similarity(expected: string, heard: string) {
  const a = normalizeHebrew(expected); const b = normalizeHebrew(heard)
  if (!a || !b) return 0
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index, ...Array<number>(b.length).fill(0)])
  for (let column = 0; column <= b.length; column += 1) rows[0][column] = column
  for (let row = 1; row <= a.length; row += 1) for (let column = 1; column <= b.length; column += 1) rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1))
  return Math.max(0, Math.round((1 - rows[a.length][b.length] / Math.max(a.length, b.length)) * 100))
}
function nowMs() { return typeof performance !== 'undefined' ? performance.now() : Date.now() }
function median(values: number[]) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2) }
function secondsLabel(value: number | null | undefined) { if (value == null || !Number.isFinite(value)) return '—'; const seconds = value / 1000; return seconds < 10 ? `${seconds.toFixed(1)} s` : `${Math.round(seconds)} s` }
function levelName(difficulty: HebrewDifficulty | null) { if (difficulty === 'initial') return 'Nivel 1 · Básico'; if (difficulty === 'intermediate') return 'Nivel 2 · Intermedio'; if (difficulty === 'advanced') return 'Nivel 3 · Avanzado'; return 'Según mi progreso' }
function dateLabel(value: string) { return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) }
function isWrittenQuestion(question: CoachQuestion) { return question.interaction !== 'pronunciation' && !question.key.startsWith('oral-') && question.options.length > 0 }
function oralCountFor(total: number, focus: TrainingFocus) { if (focus === 'pronunciation') return total; if (focus === 'mixed' || focus === 'reading_pronunciation') return total >= 20 ? 5 : total >= 15 ? 4 : 3; return 0 }
function skillsForTraining(focus: TrainingFocus, selected: HebrewSkill[]) { if (focus === 'vocabulary') return ['vocabulary'] as HebrewSkill[]; if (focus === 'reading' || focus === 'reading_pronunciation') return ['reading'] as HebrewSkill[]; if (focus === 'pronunciation') return [] as HebrewSkill[]; return selected }

export default function HebrewProgressCoach() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [mode, setMode] = useState<'adaptive' | 'difficulty'>('adaptive')
  const [difficulty, setDifficulty] = useState<HebrewDifficulty>('initial')
  const [questionCount, setQuestionCount] = useState<number>(15)
  const [focusAreas, setFocusAreas] = useState<HebrewSkill[]>([])
  const [trainingFocus, setTrainingFocus] = useState<TrainingFocus>('mixed')
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
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle')
  const [speechResult, setSpeechResult] = useState<{ transcript: string; score: number } | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [levels, setLevels] = useState(IDLE_LEVELS)
  const questionStartedAtRef = useRef<number | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const capturedRef = useRef('')
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frameRef = useRef<number | null>(null)
  const voiceTimeoutRef = useRef<number | null>(null)
  const voiceAttemptFailedRef = useRef(false)
  const voiceSubmittedRef = useRef(false)
  const voiceRetryRef = useRef(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { const data = await loadHebrewProgress(); setSessions(data.sessions); setAnswers(data.answers); setError(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu progreso.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  function clearVoiceTimeout() { if (voiceTimeoutRef.current !== null && typeof window !== 'undefined') window.clearTimeout(voiceTimeoutRef.current); voiceTimeoutRef.current = null }
  function pauseSpectrum() { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; analyserRef.current = null; setLevels(IDLE_LEVELS) }
  function streamIsLive() { return Boolean(streamRef.current?.getAudioTracks().some(track => track.readyState === 'live')) }
  async function releaseMicrophone() {
    pauseSpectrum(); streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null
    const context = audioContextRef.current; audioContextRef.current = null
    if (context && context.state !== 'closed') try { await context.close() } catch { /* iOS puede haberlo cerrado */ }
    if (typeof navigator !== 'undefined') {
      const audioSession = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
      if (audioSession) try { audioSession.type = 'playback'; audioSession.type = 'auto' } catch { /* Safari puede no exponer esta API */ }
    }
  }
  function drawSpectrum(analyser: AnalyserNode) {
    const waveform = new Uint8Array(analyser.fftSize)
    const draw = () => {
      if (analyserRef.current !== analyser) return
      analyser.getByteTimeDomainData(waveform)
      let energy = 0
      for (let sample = 0; sample < waveform.length; sample += 1) { const centered = (waveform[sample] - 128) / 128; energy += centered * centered }
      const rms = Math.sqrt(energy / Math.max(1, waveform.length))
      const loudness = Math.max(0, Math.min(1, (rms - .015) * 7.2))
      setLevels(IDLE_LEVELS.map((base, bar) => {
        const distance = Math.abs(bar - Math.floor(IDLE_LEVELS.length / 2)); const shape = Math.max(.45, 1 - distance * .08)
        const sampleIndex = Math.min(waveform.length - 1, Math.floor((bar / IDLE_LEVELS.length) * waveform.length)); const local = Math.abs((waveform[sampleIndex] - 128) / 128)
        return Math.max(8, Math.min(100, Math.round(base * .22 + (loudness * 82 + local * 28) * shape)))
      }))
      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
  }
  async function ensureMicrophone() {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) throw new Error('microphone-unavailable')
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) throw new Error('audio-context-unavailable')
    if (!streamIsLive()) { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }) }
    let context = audioContextRef.current
    if (!context || context.state === 'closed') { context = new AudioContextCtor(); audioContextRef.current = context }
    if (context.state === 'suspended') try { await context.resume() } catch { /* Safari reintenta con el gesto */ }
    pauseSpectrum(); const analyser = context.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = .42; context.createMediaStreamSource(streamRef.current!).connect(analyser); analyserRef.current = analyser; drawSpectrum(analyser)
  }
  useEffect(() => () => { clearVoiceTimeout(); try { recognitionRef.current?.stop() } catch { /* ya detenido */ }; void releaseMicrophone() }, [])

  const metrics = useMemo(() => deriveProgressMetrics(sessions, answers), [sessions, answers])
  const adaptiveLevel = useMemo(() => deriveStrictAdaptiveLevel(answers), [answers])
  const level = DIFFICULTIES.find(item => item.id === difficulty)!
  const levelMastery = useMemo(() => deriveLevelMastery(answers, difficulty), [answers, difficulty])
  const masteryByLevel = useMemo(() => ({ initial: deriveLevelMastery(answers, 'initial'), intermediate: deriveLevelMastery(answers, 'intermediate'), advanced: deriveLevelMastery(answers, 'advanced') }), [answers])
  const gradebook = useMemo(() => deriveSessionGrades(sessions, answers), [sessions, answers])
  const effectiveAreas = useMemo(() => skillsForTraining(trainingFocus, focusAreas), [trainingFocus, focusAreas])
  const previewQuestions = useMemo(() => trainingFocus === 'pronunciation' ? ORAL_CHECKPOINTS[mode === 'difficulty' ? difficulty : adaptiveLevel.level === 1 ? 'initial' : adaptiveLevel.level === 2 ? 'intermediate' : 'advanced'] : mode === 'adaptive' ? selectStrictAdaptiveQuestions(answers, effectiveAreas, questionCount) : selectMasteryQuestions(answers, difficulty, effectiveAreas, questionCount), [adaptiveLevel.level, answers, difficulty, effectiveAreas, mode, questionCount, trainingFocus])
  const responseTiming = useMemo(() => {
    const timed = (answers as TimedProgressAnswer[]).filter(answer => !answer.question_key.startsWith('review:') && typeof answer.response_time_ms === 'number' && answer.response_time_ms >= 0).sort((a, b) => Date.parse(a.answered_at) - Date.parse(b.answered_at))
    const typicalMs = median(timed.map(answer => answer.response_time_ms as number))
    if (timed.length < 6) return { typicalMs, trend: 'Creando línea base' as const }
    const split = Math.floor(timed.length / 2); const previous = median(timed.slice(0, split).map(answer => answer.response_time_ms as number)); const recent = median(timed.slice(split).map(answer => answer.response_time_ms as number))
    if (previous != null && recent != null && recent <= previous * .85) return { typicalMs, trend: 'Más fluido' as const }
    if (previous != null && recent != null && recent >= previous * 1.2) return { typicalMs, trend: 'Más pausado' as const }
    return { typicalMs, trend: 'Estable' as const }
  }, [answers])

  const oralPassed = useMemo(() => ({ initial: answers.some(answer => answer.question_key.startsWith('oral-initial-') && answer.is_correct), intermediate: answers.some(answer => answer.question_key.startsWith('oral-intermediate-') && answer.is_correct), advanced: answers.some(answer => answer.question_key.startsWith('oral-advanced-') && answer.is_correct) }), [answers])
  const fundamentalsComplete = masteryByLevel.initial.passed && masteryByLevel.intermediate.passed && masteryByLevel.advanced.passed && oralPassed.initial && oralPassed.intermediate && oralPassed.advanced
  const medals = useMemo(() => {
    function award(label: string, rows: HebrewProgressAnswer[]) { const attempts = rows.length; const accuracy = attempts ? Math.round(rows.filter(row => row.is_correct).length / attempts * 100) : 0; const tier = attempts >= 20 && accuracy >= 90 ? 'Oro' : attempts >= 10 && accuracy >= 80 ? 'Plata' : attempts >= 5 && accuracy >= 70 ? 'Bronce' : 'En camino'; return { label, attempts, accuracy, tier } }
    return [award('Palabras', answers.filter(row => row.skill === 'vocabulary')), award('Lectura', answers.filter(row => row.skill === 'reading' && !row.question_key.startsWith('oral-'))), award('Pronunciación', answers.filter(row => row.question_key.startsWith('oral-'))), award('Reglas', answers.filter(row => row.skill === 'rules'))]
  }, [answers])

  const current = questions[index] ?? null
  const active = Boolean(sessionId && current && !finished)
  const isPronunciation = current?.interaction === 'pronunciation'
  const writtenQuestionTotal = questions.filter(question => !question.key.startsWith('oral-')).length
  const oralQuestionTotal = questions.filter(question => question.key.startsWith('oral-')).length
  const oralPosition = isPronunciation ? questions.slice(0, index + 1).filter(question => question.key.startsWith('oral-')).length : 0
  const progress = questions.length ? Math.round(((index + (selected !== null || speechResult ? 1 : 0)) / questions.length) * 100) : 0
  const totalPoolForSelectedLevel = ALL_HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === difficulty).length
  const promptAlreadyShowsHebrew = Boolean(current?.hebrew && normalizeHebrew(current.prompt).includes(normalizeHebrew(current.hebrew)))
  const optionsNeedWideLayout = Boolean(current && current.options.some(option => !normalizeHebrew(option).length && option.trim().length > 14))

  function toggleArea(skill: HebrewSkill) { if (!active) setFocusAreas(previous => previous.includes(skill) ? previous.filter(item => item !== skill) : [...previous, skill]) }
  function oralSelectionFor(target: HebrewDifficulty, count: number) { const pool = ORAL_CHECKPOINTS[target]; const counts = new Map(pool.map(item => [item.key, answers.filter(answer => answer.question_key === item.key).length])); return [...pool].sort((a, b) => (counts.get(a.key) ?? 0) - (counts.get(b.key) ?? 0)).slice(0, Math.max(1, Math.min(count, pool.length))) }
  function completeWrittenSelection(candidate: readonly CoachQuestion[], target: HebrewDifficulty, limit: number, areas: HebrewSkill[]) {
    const seen = new Set<string>(); const selected = candidate.filter(isWrittenQuestion).filter(question => { if (seen.has(question.key)) return false; seen.add(question.key); return true })
    const minimumWritten = Math.min(limit, 10)
    if (selected.length >= limit) return selected.slice(0, limit)
    const filteredPool = ALL_HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === target).filter(question => !areas.length || areas.includes(question.skill)).filter(question => isWrittenQuestion(question as CoachQuestion))
    const broadPool = filteredPool.length >= minimumWritten ? filteredPool : ALL_HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === target).filter(question => isWrittenQuestion(question as CoachQuestion))
    const correctKeys = new Set(answers.filter(answer => answer.is_correct && !answer.review_requested).map(answer => answer.question_key))
    const supplements = [...broadPool.filter(question => !correctKeys.has(question.key)), ...broadPool.filter(question => correctKeys.has(question.key))]
    for (const question of supplements) { if (seen.has(question.key)) continue; selected.push(question); seen.add(question.key); if (selected.length >= limit) break }
    return selected.slice(0, limit)
  }

  async function begin() {
    setSaving(true); setError(null); setSpeechResult(null); setSpeechError(null); setVoiceStatus('idle'); capturedRef.current = ''; voiceRetryRef.current = 0; voiceAttemptFailedRef.current = false; voiceSubmittedRef.current = false
    try {
      const requested: HebrewDifficulty = mode === 'difficulty' ? difficulty : adaptiveLevel.level === 1 ? 'initial' : adaptiveLevel.level === 2 ? 'intermediate' : 'advanced'
      const areas = skillsForTraining(trainingFocus, focusAreas); const oralCount = oralCountFor(questionCount, trainingFocus); const writtenCount = trainingFocus === 'pronunciation' ? 0 : Math.max(1, questionCount - oralCount)
      let normalQuestions: CoachQuestion[] = []
      if (writtenCount > 0) {
        let nextQuestions = mode === 'adaptive' ? selectStrictAdaptiveQuestions(answers, areas, writtenCount) : selectMasteryQuestions(answers, requested, areas, writtenCount)
        if (!nextQuestions.length && areas.length && trainingFocus === 'mixed') nextQuestions = mode === 'adaptive' ? selectStrictAdaptiveQuestions(answers, [], writtenCount) : selectMasteryQuestions(answers, requested, [], writtenCount)
        const baseQuestions = nextQuestions.length ? nextQuestions : selectMasteryQuestions(answers, requested, areas, writtenCount)
        normalQuestions = completeWrittenSelection(baseQuestions as CoachQuestion[], requested, writtenCount, areas)
        if (!normalQuestions.length || !isWrittenQuestion(normalQuestions[0])) throw new Error('No hay preguntas escritas disponibles para este entrenamiento.')
      }
      const oralQuestions = oralCount > 0 ? oralSelectionFor(requested, oralCount) : []; const sessionQuestions = [...normalQuestions, ...oralQuestions]
      if (!sessionQuestions.length) throw new Error('No hay preguntas disponibles para este entrenamiento.')
      if (normalQuestions.length && sessionQuestions[0].interaction === 'pronunciation') throw new Error('La parte oral no puede aparecer antes de la parte escrita.')
      const id = await startHebrewProgressSession(mode, requested, areas)
      setQuestions(sessionQuestions); setSessionId(id); setIndex(0); setCorrect(0); setSelected(null); setFinished(false); questionStartedAtRef.current = nowMs()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo iniciar la práctica.') }
    finally { setSaving(false) }
  }

  async function advanceAfterSave() {
    await new Promise(resolve => window.setTimeout(resolve, 420)); setSpeechResult(null); setSpeechError(null); setVoiceStatus('idle'); capturedRef.current = ''; voiceRetryRef.current = 0; voiceAttemptFailedRef.current = false; voiceSubmittedRef.current = false; clearVoiceTimeout(); await releaseMicrophone()
    if (index + 1 < questions.length) { questionStartedAtRef.current = nowMs(); setIndex(value => value + 1); setSelected(null); return }
    if (!sessionId) return
    questionStartedAtRef.current = null; await finishHebrewProgressSession(sessionId); setFinished(true); setSelected(null); await refresh()
  }
  async function answer(optionIndex: number) {
    if (!current || !sessionId || isPronunciation || selected !== null || saving) return
    const responseTimeMs = questionStartedAtRef.current == null ? null : Math.max(0, nowMs() - questionStartedAtRef.current); setSaving(true); setSelected(optionIndex); const isCorrect = optionIndex === current.correctIndex
    try { const saved = await saveHebrewProgressAnswer({ sessionId, questionKey: current.key, questionVersion: current.version, skill: current.skill, difficulty: current.difficulty, responseText: current.options[optionIndex], isCorrect, reviewRequested: !isCorrect, responseTimeMs }); setAnswers(previous => [saved, ...previous]); if (isCorrect) setCorrect(value => value + 1); setError(null); await advanceAfterSave() }
    catch (cause) { setSelected(null); setError(cause instanceof Error ? cause.message : 'No se pudo guardar esta respuesta.') }
    finally { setSaving(false) }
  }

  async function startListening(isRetry = false) {
    if (!current?.hebrew || !isPronunciation || typeof window === 'undefined' || saving || (!isRetry && voiceStatus !== 'idle')) return
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }; const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) { setSpeechError('Este navegador no ofrece reconocimiento de voz compatible. En iPhone, abre el Preview directamente en Safari y permite el micrófono.'); return }
    if (!isRetry) voiceRetryRef.current = 0
    clearVoiceTimeout(); await releaseMicrophone(); setSpeechResult(null); setSpeechError(null); capturedRef.current = ''; voiceAttemptFailedRef.current = false; voiceSubmittedRef.current = false; setVoiceStatus('requesting')
    try {
      await new Promise(resolve => window.setTimeout(resolve, isRetry ? VOICE_RETRY_DELAY_MS : 120))
      await ensureMicrophone(); await new Promise(resolve => window.setTimeout(resolve, 110)); const instance = new Recognition(); recognitionRef.current = instance; instance.lang = 'he-IL'; instance.interimResults = true; instance.continuous = false; instance.maxAlternatives = 1
      instance.onstart = () => { setVoiceStatus('listening'); clearVoiceTimeout(); voiceTimeoutRef.current = window.setTimeout(() => { if (recognitionRef.current !== instance || voiceSubmittedRef.current) return; voiceAttemptFailedRef.current = true; try { instance.stop() } catch { /* Safari puede haberlo detenido */ }; recognitionRef.current = null; setVoiceStatus('idle'); void releaseMicrophone(); setSpeechError('La escucha tardó demasiado y se reinició. Toca Hablar para intentarlo otra vez.') }, VOICE_TIMEOUT_MS) }
      instance.onresult = event => {
        let transcript = ''; let hasFinal = false; const length = typeof event.results.length === 'number' ? event.results.length : 1
        for (let item = 0; item < length; item += 1) { transcript += `${event.results[item]?.[0]?.transcript ?? ''} `; hasFinal = hasFinal || Boolean(event.results[item]?.isFinal) }
        transcript = transcript.trim(); if (transcript) { capturedRef.current = transcript; setSpeechError(null) }
        if (hasFinal && transcript && recognitionRef.current === instance) window.setTimeout(() => { try { instance.stop() } catch { /* Safari puede finalizar por sí solo */ } }, 80)
      }
      instance.onerror = event => {
        clearVoiceTimeout(); recognitionRef.current = null; const code = event.error ?? ''
        if (code === 'aborted' && capturedRef.current.trim()) return
        voiceAttemptFailedRef.current = true; setVoiceStatus('idle'); void releaseMicrophone()
        const transient = code === 'audio-capture' || code === 'aborted' || code === 'network'
        if (transient && voiceRetryRef.current < 1) { voiceRetryRef.current += 1; setSpeechError('Reiniciando el micrófono…'); window.setTimeout(() => { void startListening(true) }, VOICE_RETRY_DELAY_MS); return }
        setSpeechError(code === 'not-allowed' ? 'El micrófono está bloqueado. Permite el acceso para este sitio y vuelve a intentarlo.' : code === 'no-speech' ? 'No detecté voz. Toca Hablar otra vez y espera a que el espectro responda a tu voz.' : 'El reconocimiento se interrumpió. El micrófono ya se reinició; toca Hablar para intentarlo otra vez.')
      }
      instance.onend = () => {
        clearVoiceTimeout(); recognitionRef.current = null; pauseSpectrum(); void releaseMicrophone()
        if (voiceAttemptFailedRef.current || voiceSubmittedRef.current) return
        const transcript = capturedRef.current.trim(); if (transcript) { voiceSubmittedRef.current = true; setVoiceStatus('processing'); void submitPronunciation(transcript) } else { setVoiceStatus('idle'); setSpeechError(previous => previous ?? 'No se reconoció texto. Puedes volver a tocar Hablar.') }
      }
      instance.start()
    } catch { clearVoiceTimeout(); recognitionRef.current = null; voiceAttemptFailedRef.current = true; setVoiceStatus('idle'); await releaseMicrophone(); if (voiceRetryRef.current < 1) { voiceRetryRef.current += 1; setSpeechError('Reiniciando el micrófono…'); window.setTimeout(() => { void startListening(true) }, VOICE_RETRY_DELAY_MS); return } setSpeechError('El micrófono no pudo iniciar de forma estable. Toca Hablar nuevamente.') }
  }
  async function submitPronunciation(transcript: string) {
    if (!current?.hebrew || !sessionId || !isPronunciation || saving) return
    const score = similarity(current.hebrew, transcript); const isCorrect = score >= 85; const responseTimeMs = questionStartedAtRef.current == null ? null : Math.max(0, nowMs() - questionStartedAtRef.current); setSpeechResult({ transcript, score }); setSaving(true)
    try { const saved = await saveHebrewProgressAnswer({ sessionId, questionKey: current.key, questionVersion: current.version, skill: current.skill, difficulty: current.difficulty, responseText: transcript, isCorrect, reviewRequested: !isCorrect, responseTimeMs }); setAnswers(previous => [saved, ...previous]); if (isCorrect) setCorrect(value => value + 1); setError(null); await new Promise(resolve => window.setTimeout(resolve, 760)); await advanceAfterSave() }
    catch (cause) { voiceSubmittedRef.current = false; setVoiceStatus('idle'); setError(cause instanceof Error ? cause.message : 'No se pudo guardar la evaluación oral.') }
    finally { setSaving(false) }
  }

  function stopListening() { clearVoiceTimeout(); try { recognitionRef.current?.stop() } catch { /* ya detenido */ } }
  function resetPractice() { clearVoiceTimeout(); try { recognitionRef.current?.stop() } catch { /* ya detenido */ }; recognitionRef.current = null; void releaseMicrophone(); setSessionId(null); setQuestions([]); setIndex(0); setCorrect(0); setSelected(null); setFinished(false); setSpeechResult(null); setSpeechError(null); setVoiceStatus('idle'); capturedRef.current = ''; voiceRetryRef.current = 0; voiceAttemptFailedRef.current = false; voiceSubmittedRef.current = false; questionStartedAtRef.current = null }
  function continueTraining() { resetPractice(); window.setTimeout(() => void begin(), 0) }

  const finalPct = questions.length ? Math.round((correct / questions.length) * 100) : 0
  const finalFeedback = finalPct >= 90 ? 'Excelente sesión. Sigue practicando para ganar fluidez y sostener la retención.' : finalPct >= 75 ? 'Buen resultado. Continúa entrenando: el sistema priorizará lo que todavía genera duda.' : finalPct >= 60 ? 'Vas avanzando. Los errores quedaron marcados para volver en Repaso.' : 'Conviene reforzar fundamentos antes de subir la dificultad.'
  const voiceActive = voiceStatus === 'listening'

  return <div className="text-center">
    {!active && !finished && <>
      <div className="py-3"><p className="text-[13px] font-black text-slate-900">Elige qué quieres entrenar</p><p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">Puedes hacer una prueba mixta o concentrarte en una habilidad.</p></div>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3"><button type="button" onClick={() => setMode('adaptive')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'adaptive' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Según mi progreso</button><button type="button" onClick={() => setMode('difficulty')} className={`min-h-12 rounded-[16px] border px-3 text-[12px] font-black ${mode === 'difficulty' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Elegir nivel</button></div>
      {mode === 'adaptive' ? <div className="mt-4"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Nivel adaptativo</p><p className="mt-1 text-[18px] font-black">Nivel {adaptiveLevel.level} · {adaptiveLevel.label}</p><div className="mx-auto mt-3 h-2.5 max-w-sm overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${adaptiveLevel.progress}%` }} /></div></div> : <div className="mt-4"><div className="grid grid-cols-3 gap-2">{DIFFICULTIES.map(item => <button key={item.id} type="button" onClick={() => setDifficulty(item.id)} className={`min-h-[58px] rounded-[16px] border px-1 ${difficulty === item.id ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-[9px] font-black uppercase">{item.level}</span><span className="block text-[12px] font-black">{item.label}</span></button>)}</div><p className="mt-3 text-[12px] font-black">¿Qué te espera en {level.label}?</p><p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">{level.detail}</p><p className="mt-2 text-[10px] font-bold text-emerald-700">Dominio: {levelMastery.mastered}/{levelMastery.total} · {levelMastery.coverage}%</p></div>}
      <div className="mt-5"><p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Tipo de entrenamiento</p><div className="mt-2 grid grid-cols-3 gap-2">{TRAINING_OPTIONS.map(item => <button key={item.id} type="button" onClick={() => setTrainingFocus(item.id)} className={`min-h-[58px] rounded-[16px] border px-2 text-[11px] font-black leading-tight ${trainingFocus === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item.short}</button>)}</div><p className="mx-auto mt-2 max-w-sm text-[10px] leading-relaxed text-slate-500">{TRAINING_OPTIONS.find(item => item.id === trainingFocus)?.detail}</p></div>
      <div className="mt-4 border-y border-slate-200"><button type="button" onClick={() => setCustomOpen(value => !value)} className="flex min-h-[56px] w-full items-center justify-center gap-3"><SlidersHorizontal className="h-4 w-4 text-indigo-600"/><span><span className="block text-[12px] font-black">Personalizar práctica</span><span className="block text-[9px] text-slate-400">Cantidad y áreas</span></span><ChevronDown className={`h-4 w-4 text-slate-400 ${customOpen ? 'rotate-180' : ''}`}/></button>{customOpen && <div className="border-t border-slate-100 pb-4 pt-3"><p className="text-[10px] font-black uppercase text-slate-400">Preguntas</p><div className="mx-auto mt-2 grid max-w-xs grid-cols-3 gap-2">{LENGTHS.map(length => <button key={length} type="button" onClick={() => setQuestionCount(length)} className={`min-h-10 rounded-full border text-[12px] font-black ${questionCount===length?'border-indigo-300 bg-indigo-50 text-indigo-800':'border-slate-200 text-slate-500'}`}>{length}</button>)}</div>{trainingFocus==='mixed'&&<><p className="mt-4 text-[10px] font-black uppercase text-slate-400">Áreas</p><div className="mt-2 flex flex-wrap justify-center gap-2">{SKILL_ORDER.map(skill => <button key={skill} type="button" onClick={() => toggleArea(skill)} className={`min-h-9 rounded-full border px-3 text-[10px] font-black ${focusAreas.includes(skill)?'border-indigo-300 bg-indigo-50 text-indigo-800':'border-slate-200 bg-white text-slate-500'}`}>{SKILL_LABELS[skill]}</button>)}</div></>}{mode==='difficulty'&&<p className="mt-3 text-[10px] text-slate-500">Banco del nivel: {totalPoolForSelectedLevel} preguntas. El tramo oral usa ejercicios independientes.</p>}</div>}</div>
      <div className="mt-4 border-y border-slate-200 py-3"><p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Logros</p><div className="mt-2 grid grid-cols-4 gap-1.5">{medals.map(item => <div key={item.label} className="py-1"><Award className={`mx-auto h-5 w-5 ${item.tier==='Oro'?'text-amber-500':item.tier==='Plata'?'text-slate-400':item.tier==='Bronce'?'text-orange-500':'text-slate-200'}`}/><p className="mt-1 text-[9px] font-black text-slate-700">{item.label}</p><p className="text-[8px] font-bold text-slate-400">{item.tier}</p></div>)}</div></div>
      {fundamentalsComplete && <div className="mx-auto mt-4 max-w-sm rounded-[18px] bg-indigo-50 px-4 py-4"><Sparkles className="mx-auto h-5 w-5 text-indigo-600"/><p className="mt-1 text-[12px] font-black text-indigo-900">Fundamentos dominados · 100%</p><p className="mt-1 text-[10px] leading-relaxed text-indigo-700">Desde aquí la práctica sigue como Perfeccionamiento: retención, lectura, pronunciación, reglas combinadas y desafíos avanzados. El curso no sube artificialmente de 100%.</p></div>}
      <button type="button" onClick={() => void begin()} disabled={saving || loading || previewQuestions.length===0} className="mt-4 min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-50">{saving?'Preparando…':trainingFocus==='pronunciation'?`Comenzar · ${Math.min(questionCount, ORAL_CHECKPOINTS[mode==='difficulty'?difficulty:adaptiveLevel.level===1?'initial':adaptiveLevel.level===2?'intermediate':'advanced'].length)} de voz`:`Comenzar · ${questionCount} preguntas`}</button>
    </>}

    {active && current && <>
      <div><p className="text-[10px] font-black uppercase tracking-[.1em] text-indigo-700">{isPronunciation ? `Pronunciación · ${levelName(current.difficulty)}` : `${current.type} · ${SKILL_LABELS[current.skill]}`}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{isPronunciation ? `Tramo oral · ${oralPosition} de ${oralQuestionTotal}` : `Pregunta ${index+1} de ${writtenQuestionTotal} · ${correct} aciertos`}</p></div>
      <div className="mx-auto mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{width:`${progress}%`}}/></div>
      <div className="py-6"><p className="mx-auto max-w-xl text-[1.4rem] font-black leading-snug sm:text-[1.55rem]">{current.prompt}</p>{current.hebrew && (isPronunciation || !promptAlreadyShowsHebrew) && <p lang="he" dir="rtl" className="mt-5 text-[4rem] font-black leading-tight text-indigo-700 sm:text-[4.5rem]">{current.hebrew}</p>}{isPronunciation&&current.pronunciationHint&&<p className="mt-2 text-[14px] font-bold text-slate-500">{current.pronunciationHint}</p>}</div>
      {isPronunciation ? <div className="mx-auto max-w-sm border-y border-slate-100 py-5" data-oral-checkpoint="true"><p className="text-[11px] font-black uppercase tracking-[.1em] text-slate-400">Pronunciación {oralPosition}/{oralQuestionTotal}</p><p className="mt-1 text-[12px] text-slate-500">Esta pregunta es solo para hablar. No hay respuestas para elegir.</p><div className={`oral-spectrum mx-auto mt-5 flex h-16 max-w-[270px] items-center justify-center gap-[4px] overflow-hidden rounded-full border px-5 transition ${voiceActive?'oral-spectrum-active border-cyan-200 bg-cyan-50/90':'border-slate-100 bg-slate-50'}`} aria-label={voiceActive ? 'Micrófono activo, espectro de voz en movimiento' : 'Micrófono inactivo'}>{levels.map((height, bar)=><span key={bar} style={{height:`${Math.max(5, Math.round(height*.46))}px`}} className={`w-[4px] rounded-full transition-[height] duration-75 ${voiceActive?'bg-cyan-500':'bg-slate-300'}`} />)}</div><p className={`mt-2 text-[11px] font-black ${voiceActive?'text-cyan-700':'text-slate-400'}`}>{voiceStatus==='requesting'?'Activando micrófono…':voiceStatus==='listening'?'Te estoy escuchando…':voiceStatus==='processing'?'Enviando y comprobando…':'Listo para escuchar'}</p><button type="button" onClick={voiceStatus==='listening'?stopListening:()=>void startListening()} disabled={saving||voiceStatus==='requesting'||voiceStatus==='processing'} className={`mt-4 inline-flex min-h-14 items-center gap-2 rounded-full px-7 text-[13px] font-black disabled:opacity-60 ${voiceStatus==='listening'?'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200':'bg-indigo-600 text-white'}`}>{voiceStatus==='listening'?<Square className="h-4 w-4"/>:<Mic className="h-5 w-5"/>}{voiceStatus==='listening'?'Terminar':'Hablar'}</button>{speechResult&&<div className={`mx-auto mt-4 flex max-w-xs items-center justify-center gap-2 rounded-full px-4 py-3 ${speechResult.score>=85?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>{speechResult.score>=85?<CheckCircle2 className="h-5 w-5 shrink-0"/>:<XCircle className="h-5 w-5 shrink-0"/>}<span className="text-[12px] font-black">{speechResult.score>=85?'Respuesta enviada · correcta':'Respuesta enviada · necesita repaso'}</span></div>}{speechResult&&<div className="mt-3"><p className="text-[12px] text-slate-500">Reconocí: <span lang="he" dir="rtl" className="text-[18px] font-black text-slate-900">{speechResult.transcript}</span></p><p className={`mt-2 text-[14px] font-black ${speechResult.score>=85?'text-emerald-700':speechResult.score>=60?'text-amber-700':'text-rose-700'}`}>{speechResult.score>=85?'Lectura reconocida correctamente':speechResult.score>=60?'Está cerca; quedó marcada para repaso':'Necesita más práctica y quedó marcada para repaso'} · {speechResult.score}%</p></div>}{speechError&&<p className="mt-3 text-[12px] font-bold text-rose-600">{speechError}</p>}</div> : <div data-answer-grid="true" className={`grid gap-2 ${optionsNeedWideLayout ? 'grid-cols-1' : 'grid-cols-3'}`}>{current.options.map((option,optionIndex)=>{const chosen=selected===optionIndex;const correctOption=selected!==null&&current.correctIndex===optionIndex;const isHebrewOption=normalizeHebrew(option).length>0;return <button key={`${current.key}-${option}`} type="button" disabled={selected!==null||saving} onClick={()=>void answer(optionIndex)} className={`min-w-0 whitespace-normal break-words overflow-hidden rounded-[18px] border px-4 py-4 text-center font-black leading-snug ${optionsNeedWideLayout?'min-h-[4.5rem]':'min-h-[5.4rem]'} ${isHebrewOption?'text-[2.15rem] sm:text-[2.35rem]':optionsNeedWideLayout?'text-[1.05rem] sm:text-[1.15rem]':'text-[1.08rem] sm:text-[1.2rem]'} ${correctOption?'border-emerald-300 bg-emerald-50 text-emerald-800':chosen?'border-rose-300 bg-rose-50 text-rose-800':'border-slate-200 bg-white text-slate-800'}`}>{option}</button>})}</div>}
    </>}

    {finished&&<div><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600"/><h3 className="mt-2 text-xl font-black">Entrenamiento terminado</h3><div className="mt-4 grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-4"><div><p className="text-2xl font-black text-emerald-700">{finalPct}%</p><p className="text-[10px] font-black text-slate-500">Nota</p></div><div><p className="text-2xl font-black">{correct}/{questions.length}</p><p className="text-[10px] font-black text-slate-500">Aciertos</p></div></div><p className="mx-auto mt-4 max-w-sm text-[12px] font-semibold leading-relaxed text-slate-600">{finalFeedback}</p><p className="mx-auto mt-3 max-w-sm text-[11px] font-semibold text-indigo-700">{metrics.recommendation}</p><button type="button" onClick={continueTraining} className="mt-5 min-h-12 w-full rounded-full bg-indigo-600 px-6 text-sm font-black text-white">Continuar entrenando</button><button type="button" onClick={resetPractice} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[12px] font-black text-slate-500"><RotateCcw className="h-4 w-4"/>Cambiar entrenamiento</button></div>}

    {error&&<p role="alert" className="mt-3 text-[11px] font-bold text-rose-600">{error}</p>}
    {!active&&<div className="mt-5 border-t border-slate-200 pt-2"><button type="button" onClick={()=>setHistoryOpen(value=>!value)} aria-expanded={historyOpen} className="flex min-h-12 w-full items-center justify-center gap-3"><span><span className="block text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Cuadro de notas</span><span className="block text-sm font-black">{loading?'Cargando historial…':`${gradebook.length} evaluaciones registradas`}</span></span><ChevronDown className={`h-4 w-4 text-slate-400 ${historyOpen?'rotate-180':''}`}/></button>{historyOpen&&<div className="border-t border-slate-200 py-4">{gradebook.length===0?<p className="text-[12px] text-slate-500">Todavía no hay evaluaciones guardadas.</p>:<><div className="overflow-hidden rounded-[18px] bg-slate-100/70 text-left"><div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 text-[9px] font-black uppercase text-slate-400"><span>Evaluación</span><span>Aciertos</span><span>Nota</span></div>{gradebook.slice(0,12).map(row=><div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-white/80 px-3 py-3 text-[10px]"><div><p className="font-black text-slate-800">{levelName(row.difficulty)}</p><p className="text-[9px] text-slate-400">{dateLabel(row.startedAt)}</p></div><span className="font-bold text-slate-600">{row.correct}/{row.answers}</span><span className="font-black">{row.score}%</span></div>)}</div><div className="mt-4 grid grid-cols-2 border-y border-slate-200"><div className="border-b border-r border-slate-200 py-3"><p className="text-xl font-black text-emerald-700">{metrics.accuracy??0}%</p><p className="text-[9px] font-black text-slate-400">Precisión</p></div><div className="border-b border-slate-200 py-3"><p className="text-xl font-black">{metrics.retention===null?'—':`${metrics.retention}%`}</p><p className="text-[9px] font-black text-slate-400">Retención</p></div><div className="border-r border-slate-200 py-3"><p className="text-[11px] font-black">{responseTiming.trend}</p><p className="text-[9px] font-black text-slate-400">Fluidez</p></div><div className="py-3"><p className="text-xl font-black">{secondsLabel(responseTiming.typicalMs)}</p><p className="text-[9px] font-black text-slate-400">Tiempo típico</p></div></div><div className="mt-4 space-y-2">{metrics.areas.filter(area=>area.attempts>0).map(area=><div key={area.skill} className="text-[11px]"><p className="font-bold text-slate-600">{SKILL_LABELS[area.skill]}</p><p className="font-black">{area.accuracy??0}% · {area.state}</p></div>)}</div></>}</div>}</div>}

    <style jsx>{`
      .oral-spectrum-active { box-shadow: inset 0 0 18px rgba(6,182,212,.08), 0 0 30px rgba(6,182,212,.18); }
      .oral-spectrum-active span { box-shadow: 0 0 9px rgba(6,182,212,.65); transform-origin: center; }
    `}</style>
  </div>
}