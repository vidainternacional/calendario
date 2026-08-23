'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Mic, Square, Volume2 } from 'lucide-react'
import { HEBREW_PRACTICE_QUESTIONS } from '@/lib/hebreo/progress'
import { HEBREW_USEFUL_PHRASES } from '@/lib/hebreo/useful-phrases'
import { pronounceHebrewForSpanish, withoutHebrewMarks } from '@/lib/hebreo/pronunciation'
import { interactionFeedback } from '@/lib/ui/interaction-feedback'

type SpeechMode = 'words' | 'sentences'
type SpeechResultEvent = { results: { length?: number; [index: number]: { [index: number]: { transcript: string } } } }
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

type Prompt = { key: string; hebrew: string; label: string; source: string }
type DetailedFeedback = { title: string; detail: string | null }

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
  return { title: 'Hay partes que conviene repetir.', detail: `Según lo reconocido, revisa: ${parts.join(' ')}` }
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
  const [status, setStatus] = useState<'idle' | 'requesting' | 'listening' | 'processing'>('idle')
  const [captured, setCaptured] = useState('')
  const [result, setResult] = useState<{ transcript: string; score: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [levels, setLevels] = useState(IDLE_LEVELS)
  const capturedRef = useRef('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frameRef = useRef<number | null>(null)

  const words = useMemo(buildWordPrompts, [])
  const sentences = useMemo(buildSentencePrompts, [])
  const prompts = mode === 'words' ? words : sentences
  const current = prompts[index % Math.max(1, prompts.length)]

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
      try { await context.close() } catch { /* iOS may already have closed it */ }
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

  function streamIsLive() {
    return Boolean(streamRef.current?.getAudioTracks().some(track => track.readyState === 'live'))
  }

  async function ensureMicrophone() {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) throw new Error('microphone-unavailable')
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) throw new Error('audio-context-unavailable')

    if (!streamIsLive()) {
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    }

    let context = audioContextRef.current
    if (!context || context.state === 'closed') {
      context = new AudioContextCtor()
      audioContextRef.current = context
    }
    if (context.state === 'suspended') {
      try { await context.resume() } catch { /* Safari resumes again on a later user gesture if necessary */ }
    }

    pauseSpectrum()
    const analyser = context.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.62
    context.createMediaStreamSource(streamRef.current!).connect(analyser)
    analyserRef.current = analyser
    drawSpectrum(analyser)
  }

  useEffect(() => () => {
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }
    void releaseMicrophone()
  }, [])

  function clearAttempt() {
    setCaptured('')
    capturedRef.current = ''
    setResult(null)
    setError(null)
  }

  function changeMode(next: SpeechMode) {
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }
    recognitionRef.current = null
    pauseSpectrum()
    setStatus('idle')
    setMode(next)
    setIndex(0)
    clearAttempt()
    interactionFeedback('tap')
  }

  function move(delta: number) {
    if (!prompts.length) return
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }
    recognitionRef.current = null
    pauseSpectrum()
    setStatus('idle')
    setIndex(value => (value + delta + prompts.length) % prompts.length)
    clearAttempt()
    interactionFeedback('tap')
  }

  async function start() {
    if (!current || typeof window === 'undefined' || status !== 'idle') return
    clearAttempt()
    setStatus('requesting')
    interactionFeedback('listen-start')

    try {
      await ensureMicrophone()
      const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
      if (!Recognition) throw new Error('speech-recognition-unavailable')

      await new Promise(resolve => window.setTimeout(resolve, 60))
      const instance = new Recognition()
      recognitionRef.current = instance
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
        const code = event.error ?? ''
        setError(code === 'not-allowed'
          ? 'El micrófono está bloqueado. Permite el acceso para este sitio y vuelve a intentarlo.'
          : code === 'no-speech'
            ? 'No detecté voz. Toca Hablar otra vez y espera a que el espectro se active.'
            : code === 'audio-capture'
              ? 'El audio se interrumpió. El micrófono se reiniciará en el próximo intento.'
              : 'El reconocimiento se interrumpió. Vuelve a tocar Hablar; el micrófono queda listo para reintentar.')
        interactionFeedback('warning')
      }
      instance.onend = () => {
        recognitionRef.current = null
        pauseSpectrum()
        const transcript = capturedRef.current.trim()
        if (transcript) {
          setStatus('processing')
          const next = { transcript, score: similarity(current.hebrew, transcript) }
          setCaptured(transcript)
          setResult(next)
          setError(null)
          interactionFeedback(next.score >= 75 ? 'success' : 'warning')
          window.setTimeout(() => setStatus('idle'), 120)
        } else {
          setStatus('idle')
          interactionFeedback('listen-end')
          setError(previous => previous ?? 'No se reconoció texto. Puedes volver a tocar Hablar sin cambiar de palabra.')
        }
      }
      instance.start()
    } catch (cause) {
      recognitionRef.current = null
      pauseSpectrum()
      setStatus('idle')
      interactionFeedback('warning')
      const code = cause instanceof Error ? cause.message : ''
      if (code === 'speech-recognition-unavailable') setError('El micrófono funciona, pero este navegador no puede convertir voz a texto hebreo.')
      else {
        await releaseMicrophone()
        setError('No pude abrir el micrófono de forma estable. Toca Hablar nuevamente para reiniciarlo.')
      }
    }
  }

  function stop() {
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }
    interactionFeedback('tap')
  }

  function speakGuide() {
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    interactionFeedback('tap')
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
    <section aria-label="Práctica oral de hebreo" className="mt-2 py-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <Mic className="h-5 w-5 text-sky-600" />
        <span className="text-[13px] font-black text-slate-900">Práctica oral</span>
        <span className="text-[9px] font-bold text-slate-400">{mode === 'words' ? words.length : sentences.length}</span>
      </div>

      <div className="mx-auto mt-2 inline-flex rounded-full bg-slate-100 p-1">
        <button type="button" onClick={() => changeMode('words')} className={`min-h-8 rounded-full px-4 text-[10px] font-black ${mode === 'words' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Palabras</button>
        <button type="button" onClick={() => changeMode('sentences')} className={`min-h-8 rounded-full px-4 text-[10px] font-black ${mode === 'sentences' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Oraciones</button>
      </div>

      {current && <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => move(-1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-400 active:bg-slate-100" aria-label="Anterior"><ChevronLeft className="h-6 w-6" /></button>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-slate-400">{index + 1}/{prompts.length} · {current.source}</p>
            <p lang="he" dir="rtl" className="mx-auto mt-1 text-[3rem] font-black leading-[1.25] text-slate-950">{current.hebrew}</p>
            <p className="mt-1 text-[13px] font-black leading-snug text-sky-700">{pronounceHebrewForSpanish(current.hebrew)}</p>
            <p className="mt-1 text-[12px] font-semibold leading-snug text-slate-600">{current.label}</p>
          </div>
          <button type="button" onClick={() => move(1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-400 active:bg-slate-100" aria-label="Siguiente"><ChevronRight className="h-6 w-6" /></button>
        </div>

        <div className={`voice-spectrum mx-auto mt-3 flex h-12 max-w-[270px] items-center justify-center gap-[3px] overflow-hidden rounded-full border px-5 transition ${status === 'listening' ? 'voice-spectrum-active border-sky-200 bg-sky-50/80' : 'border-slate-100 bg-slate-50'}`} aria-label="Espectro de voz">
          {levels.map((height, bar) => <span key={bar} className={`w-[3px] rounded-full transition-[height] duration-75 ${status === 'listening' ? 'bg-sky-500' : 'bg-slate-300'}`} style={{ height: `${Math.max(5, Math.round(height * 0.34))}px` }} />)}
        </div>

        <div className="mt-3 flex items-center justify-center gap-5">
          <button type="button" onClick={speakGuide} className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-sky-700" aria-label="Escuchar pronunciación"><Volume2 className="h-5 w-5" /></button>
          <button type="button" onClick={status === 'listening' ? stop : () => void start()} disabled={status === 'requesting' || status === 'processing'} className={`grid h-14 w-14 place-items-center rounded-full disabled:opacity-60 ${status === 'listening' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-sky-600 text-white shadow-[0_0_22px_rgba(14,165,233,.22)]'}`} aria-label={status === 'listening' ? 'Terminar escucha' : 'Hablar'}>{status === 'listening' ? <Square className="h-4 w-4" /> : <Mic className="h-6 w-6" />}</button>
        </div>

        {status === 'requesting' && <p className="mt-2 text-[10px] font-black text-sky-700">Activando micrófono…</p>}
        {status === 'listening' && <p className="mt-2 text-[10px] font-black text-sky-700">Te escucho…</p>}
        {status === 'processing' && <p className="mt-2 text-[10px] font-black text-sky-700">Analizando…</p>}

        {result && scoreFeedback && detail && <div className="mx-auto mt-3 max-w-sm rounded-[18px] bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-400">Reconocí</p>
          <p lang="he" dir="rtl" className="mt-1 text-[1.65rem] font-black text-slate-950">{result.transcript}</p>
          <div className="mt-1 flex items-baseline justify-center gap-2"><p className="text-[24px] font-black text-slate-950">{result.score}%</p><p className={`text-[12px] font-black ${scoreFeedback.tone}`}>{scoreFeedback.text}</p></div>
          <p className="mt-1 text-[13px] font-black text-slate-800">{detail.title}</p>
          {detail.detail && <p className="mx-auto mt-1 max-w-sm text-[11px] font-semibold leading-relaxed text-slate-500">{detail.detail}</p>}
          <button type="button" onClick={() => { clearAttempt(); interactionFeedback('tap') }} className="mt-2 text-[10px] font-black text-sky-700">Intentar otra vez</button>
        </div>}

        {error && <p role="alert" className="mx-auto mt-2 max-w-sm text-[10px] font-bold leading-relaxed text-rose-600">{error}</p>}
      </div>}

      <style jsx>{`
        .voice-spectrum-active { box-shadow: inset 0 0 18px rgba(14,165,233,.08), 0 0 28px rgba(14,165,233,.16); }
        .voice-spectrum-active span { box-shadow: 0 0 8px rgba(14,165,233,.6); }
      `}</style>
    </section>
  )
}
