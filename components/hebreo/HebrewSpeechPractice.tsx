'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Mic, Send, Square, Volume2 } from 'lucide-react'
import { HEBREW_PRACTICE_QUESTIONS } from '@/lib/hebreo/progress'
import { HEBREW_USEFUL_PHRASES } from '@/lib/hebreo/useful-phrases'
import { pronounceHebrewForSpanish, withoutHebrewMarks } from '@/lib/hebreo/pronunciation'

type SpeechMode = 'words' | 'sentences'
type SpeechResultEvent = {
  resultIndex?: number
  results: {
    length?: number
    [index: number]: { isFinal?: boolean; [index: number]: { transcript: string } }
  }
}
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

type Prompt = {
  key: string
  hebrew: string
  label: string
  source: string
}

type DetailedFeedback = {
  title: string
  detail: string | null
}

const IDLE_LEVELS = [12, 18, 26, 34, 42, 50, 42, 34, 26, 18, 12]

function normalizeHebrew(value: string) {
  return withoutHebrewMarks(value).replace(/[^\u05D0-\u05EA]/g, '')
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

function hebrewWords(value: string) {
  return value.split(/\s+/).map(word => ({ raw: word, normalized: normalizeHebrew(word) })).filter(word => word.normalized)
}

function detailedFeedback(expected: string, heard: string, score: number): DetailedFeedback {
  if (score >= 90) return { title: 'Se escuchó muy bien.', detail: 'El navegador reconoció prácticamente todo el texto esperado.' }

  const expectedWords = hebrewWords(expected)
  const heardWords = hebrewWords(heard)
  const mismatches = expectedWords
    .map((word, index) => ({ expected: word, heard: heardWords[index] }))
    .filter(pair => !pair.heard || pair.expected.normalized !== pair.heard.normalized)
    .slice(0, 3)

  if (!mismatches.length) return { title: 'Se escuchó bien.', detail: 'La diferencia detectada es pequeña. Repite una vez más para confirmar.' }

  const parts = mismatches.map(pair => {
    const guide = pronounceHebrewForSpanish(pair.expected.raw)
    if (!pair.heard) return `${pair.expected.raw}${guide ? ` (${guide})` : ''}: no quedó reconocida.`
    return `${pair.expected.raw}${guide ? ` (${guide})` : ''}: el navegador entendió ${pair.heard.raw}.`
  })

  return {
    title: 'Hay partes que conviene repetir.',
    detail: `Según lo reconocido, revisa: ${parts.join(' ')}`,
  }
}

function unique(rows: Prompt[]) {
  const seen = new Set<string>()
  return rows.filter(row => {
    const key = normalizeHebrew(row.hebrew)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildWordPrompts() {
  const fromCourse = HEBREW_PRACTICE_QUESTIONS
    .filter(question => question.hebrew && !question.hebrew.includes(' ') && normalizeHebrew(question.hebrew).length >= 2)
    .map(question => ({ key: `course:${question.key}`, hebrew: question.hebrew!, label: question.type, source: 'Curso' }))
  const fromPhrases = HEBREW_USEFUL_PHRASES
    .filter(item => !item.hebrew.includes(' '))
    .map(item => ({ key: `phrase:${item.id}`, hebrew: item.hebrew, label: item.spanish, source: 'Palabras aprendidas' }))
  return unique([...fromCourse, ...fromPhrases])
}

function buildSentencePrompts() {
  const fromCourse = HEBREW_PRACTICE_QUESTIONS
    .filter(question => question.hebrew && question.hebrew.includes(' ') && normalizeHebrew(question.hebrew).length >= 4)
    .map(question => ({ key: `course:${question.key}`, hebrew: question.hebrew!, label: question.type, source: 'Lectura y reglas' }))
  const fromPhrases = HEBREW_USEFUL_PHRASES
    .filter(item => item.hebrew.includes(' '))
    .map(item => ({ key: `phrase:${item.id}`, hebrew: item.hebrew, label: item.spanish, source: 'Frases aprendidas' }))
  const biblical: Prompt[] = [
    { key: 'biblical:gen-1-1a', hebrew: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים', label: 'Génesis 1:1 · primera parte', source: 'Lectura bíblica' },
    { key: 'biblical:deu-6-4', hebrew: 'שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד', label: 'Shemá · Deuteronomio 6:4', source: 'Lectura bíblica' },
    { key: 'biblical:psa-23-1', hebrew: 'יְהוָה רֹעִי לֹא אֶחְסָר', label: 'Salmo 23:1', source: 'Lectura bíblica' },
  ]
  return unique([...fromCourse, ...fromPhrases, ...biblical])
}

function feedback(score: number) {
  if (score >= 90) return { text: 'Muy buena coincidencia.', tone: 'text-emerald-700' }
  if (score >= 75) return { text: 'Buena coincidencia.', tone: 'text-emerald-700' }
  if (score >= 55) return { text: 'Va cerca.', tone: 'text-amber-700' }
  return { text: 'Hay bastante diferencia.', tone: 'text-rose-700' }
}

export default function HebrewSpeechPractice() {
  const [mode, setMode] = useState<SpeechMode>('words')
  const [index, setIndex] = useState(0)
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null)
  const [status, setStatus] = useState<'idle' | 'requesting' | 'listening'>('idle')
  const [captured, setCaptured] = useState('')
  const capturedRef = useRef('')
  const [result, setResult] = useState<{ transcript: string; score: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [levels, setLevels] = useState(IDLE_LEVELS)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const frameRef = useRef<number | null>(null)

  const words = useMemo(buildWordPrompts, [])
  const sentences = useMemo(buildSentencePrompts, [])
  const prompts = mode === 'words' ? words : sentences
  const current = prompts[index % Math.max(1, prompts.length)]

  function stopVisualizer() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') void audioContextRef.current.close()
    audioContextRef.current = null
    setLevels(IDLE_LEVELS)
  }

  function startVisualizer(stream: MediaStream) {
    if (typeof window === 'undefined') return
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return
    const context = new AudioContextCtor()
    const analyser = context.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.72
    context.createMediaStreamSource(stream).connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    audioContextRef.current = context

    const draw = () => {
      analyser.getByteFrequencyData(data)
      const center = Math.floor(data.length / 2)
      const next = IDLE_LEVELS.map((_, bar) => {
        const offset = Math.abs(bar - Math.floor(IDLE_LEVELS.length / 2))
        const sampleIndex = Math.max(0, Math.min(data.length - 1, center - offset * 2))
        const value = data[sampleIndex] ?? 0
        return Math.max(10, Math.min(100, Math.round((value / 255) * 100)))
      })
      setLevels(next)
      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  function clearAttempt() {
    setCaptured('')
    capturedRef.current = ''
    setResult(null)
    setError(null)
  }

  function changeMode(next: SpeechMode) {
    recognition?.stop()
    stopVisualizer()
    setRecognition(null)
    setStatus('idle')
    setMode(next)
    setIndex(0)
    clearAttempt()
  }

  function move(delta: number) {
    if (!prompts.length) return
    recognition?.stop()
    stopVisualizer()
    setRecognition(null)
    setStatus('idle')
    setIndex(value => (value + delta + prompts.length) % prompts.length)
    clearAttempt()
  }

  async function start() {
    if (!current || typeof window === 'undefined' || status !== 'idle') return
    clearAttempt()
    setStatus('requesting')

    try {
      let stream: MediaStream | null = null
      if (navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        startVisualizer(stream)
      }

      const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
      if (!Recognition) {
        stopVisualizer()
        setStatus('idle')
        setError('El micrófono funciona, pero este navegador no puede convertir la voz a texto hebreo. El espectro confirma si entra sonido, pero la comparación necesita reconocimiento de voz compatible.')
        return
      }

      const instance = new Recognition()
      instance.lang = 'he-IL'
      instance.interimResults = true
      instance.continuous = false
      instance.maxAlternatives = 1
      instance.onstart = () => setStatus('listening')
      instance.onresult = event => {
        let transcript = ''
        const length = typeof event.results.length === 'number' ? event.results.length : 1
        for (let item = 0; item < length; item += 1) transcript += `${event.results[item]?.[0]?.transcript ?? ''} `
        transcript = transcript.trim()
        if (transcript) {
          capturedRef.current = transcript
          setCaptured(transcript)
          setError(null)
        }
      }
      instance.onerror = event => {
        setError(event.error === 'not-allowed'
          ? 'El micrófono está bloqueado. Permite el acceso para este sitio y vuelve a intentarlo.'
          : event.error === 'no-speech'
            ? 'No detecté voz. Toca Hablar y espera a que el espectro comience a moverse antes de pronunciar.'
            : 'No pude convertir la voz a texto esta vez. Inténtalo nuevamente en un ambiente tranquilo.')
      }
      instance.onend = () => {
        stopVisualizer()
        setStatus('idle')
        setRecognition(null)
        if (!capturedRef.current) setError(previous => previous ?? 'La escucha terminó sin reconocer texto. Si el espectro sí se movió, el micrófono recibió sonido pero el reconocimiento no pudo interpretarlo.')
      }
      setRecognition(instance)
      instance.start()
    } catch {
      stopVisualizer()
      setStatus('idle')
      setRecognition(null)
      setError('No pude abrir el micrófono. Revisa el permiso del navegador para este sitio y vuelve a intentarlo.')
    }
  }

  function stop() {
    recognition?.stop()
  }

  function submitResult() {
    if (!current || !captured.trim()) return
    setResult({ transcript: captured.trim(), score: similarity(current.hebrew, captured.trim()) })
  }

  function speakGuide() {
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(current.hebrew)
    utterance.lang = 'he-IL'
    utterance.rate = 0.72
    const voice = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith('he'))
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }

  const scoreFeedback = result ? feedback(result.score) : null
  const detail = result && current ? detailedFeedback(current.hebrew, result.transcript, result.score) : null

  return (
    <section aria-label="Práctica oral de hebreo" className="mt-4 border-y border-slate-200 py-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <Mic className="h-4 w-4 text-indigo-700" />
        <span className="text-[12px] font-black text-slate-900">Práctica oral</span>
        <span className="text-[9px] font-bold text-slate-400">{mode === 'words' ? words.length : sentences.length} ejercicios</span>
      </div>

      <div className="mx-auto mt-2 inline-flex rounded-full bg-slate-100 p-1">
        <button type="button" onClick={() => changeMode('words')} className={`min-h-8 rounded-full px-4 text-[10px] font-black ${mode === 'words' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Palabras</button>
        <button type="button" onClick={() => changeMode('sentences')} className={`min-h-8 rounded-full px-4 text-[10px] font-black ${mode === 'sentences' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Oraciones</button>
      </div>

      {current && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => move(-1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 active:bg-slate-100" aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-slate-400">{index + 1}/{prompts.length} · {current.source}</p>
              <p lang="he" dir="rtl" className="mx-auto mt-1 text-[2rem] font-black leading-[1.35] text-slate-950">{current.hebrew}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-indigo-700">{pronounceHebrewForSpanish(current.hebrew)} · {current.label}</p>
            </div>
            <button type="button" onClick={() => move(1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 active:bg-slate-100" aria-label="Siguiente"><ChevronRight className="h-5 w-5" /></button>
          </div>

          <div className={`mx-auto mt-3 flex h-9 max-w-[210px] items-center justify-center gap-[3px] overflow-hidden rounded-full border px-4 transition ${status === 'listening' ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-100 bg-slate-50'}`} aria-label="Espectro de voz">
            {levels.map((height, bar) => <span key={bar} className={`w-[3px] rounded-full transition-[height] duration-75 ${status === 'listening' ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ height: `${Math.max(4, Math.round(height * 0.28))}px` }} />)}
          </div>

          <div className="mt-2 flex items-center justify-center gap-2">
            <button type="button" onClick={speakGuide} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-indigo-700" aria-label="Escuchar pronunciación"><Volume2 className="h-4 w-4" /></button>
            <button type="button" onClick={status === 'listening' ? stop : () => void start()} disabled={status === 'requesting'} className={`inline-flex min-h-10 min-w-[138px] items-center justify-center gap-2 rounded-full px-5 text-[11px] font-black disabled:opacity-60 ${status === 'listening' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-indigo-600 text-white'}`}>{status === 'listening' ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}{status === 'requesting' ? 'Abriendo…' : status === 'listening' ? 'Terminar' : 'Hablar'}</button>
          </div>

          {status === 'listening' && <p className="mt-1.5 text-[9px] font-black text-emerald-700">Habla cuando veas moverse el espectro. Puedes esperar la pausa automática o tocar Terminar.</p>}

          {captured && !result && status === 'idle' && (
            <div className="mt-2">
              <p className="text-[9px] text-slate-400">Reconocí: <span lang="he" dir="rtl" className="font-black text-slate-700">{captured}</span></p>
              <button type="button" onClick={submitResult} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[10px] font-black text-white"><Send className="h-3.5 w-3.5" />Enviar resultado</button>
            </div>
          )}

          {result && scoreFeedback && detail && (
            <div className="mx-auto mt-2 max-w-sm border-t border-slate-100 pt-2">
              <div className="flex items-baseline justify-center gap-2"><p className="text-[18px] font-black text-slate-950">{result.score}%</p><p className={`text-[10px] font-black ${scoreFeedback.tone}`}>{scoreFeedback.text}</p></div>
              <p className="mt-1 text-[10px] font-black text-slate-800">{detail.title}</p>
              {detail.detail && <p className="mx-auto mt-1 max-w-sm text-[9px] font-semibold leading-relaxed text-slate-500">{detail.detail}</p>}
              <button type="button" onClick={clearAttempt} className="mt-1.5 text-[9px] font-black text-indigo-700">Intentar otra vez</button>
            </div>
          )}

          {error && <p role="alert" className="mx-auto mt-2 max-w-sm text-[9px] font-bold leading-relaxed text-rose-600">{error}</p>}
        </div>
      )}
    </section>
  )
}
