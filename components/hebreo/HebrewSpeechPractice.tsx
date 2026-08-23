'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Mic, Send, Square, Volume2 } from 'lucide-react'
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
      rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1))
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
  const mismatches = expectedWords.map((word, index) => ({ expected: word, heard: heardWords[index] })).filter(pair => !pair.heard || pair.expected.normalized !== pair.heard.normalized).slice(0, 3)
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
  const fromCourse = HEBREW_PRACTICE_QUESTIONS.filter(question => question.hebrew && !question.hebrew.includes(' ') && normalizeHebrew(question.hebrew).length >= 2).map(question => ({ key: `course:${question.key}`, hebrew: question.hebrew!, label: question.type, source: 'Curso' }))
  const fromPhrases = HEBREW_USEFUL_PHRASES.filter(item => !item.hebrew.includes(' ')).map(item => ({ key: `phrase:${item.id}`, hebrew: item.hebrew, label: item.spanish, source: 'Palabras aprendidas' }))
  return unique([...fromCourse, ...fromPhrases])
}

function buildSentencePrompts() {
  const fromCourse = HEBREW_PRACTICE_QUESTIONS.filter(question => question.hebrew && question.hebrew.includes(' ') && normalizeHebrew(question.hebrew).length >= 4).map(question => ({ key: `course:${question.key}`, hebrew: question.hebrew!, label: question.type, source: 'Lectura y reglas' }))
  const fromPhrases = HEBREW_USEFUL_PHRASES.filter(item => item.hebrew.includes(' ')).map(item => ({ key: `phrase:${item.id}`, hebrew: item.hebrew, label: item.spanish, source: 'Frases aprendidas' }))
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
  const [status, setStatus] = useState<'idle' | 'requesting' | 'listening'>('idle')
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

  function resetMeters() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    analyserRef.current = null
    setLevels(IDLE_LEVELS)
  }

  async function releaseMicrophone() {
    resetMeters()
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

  async function openMicrophone() {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) throw new Error('microphone-unavailable')
    await releaseMicrophone()

    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) throw new Error('audio-context-unavailable')

    const context = new AudioContextCtor()
    audioContextRef.current = context
    try { if (context.state === 'suspended') await context.resume() } catch { /* continue; stream may still work */ }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    streamRef.current = stream

    if (context.state === 'suspended') {
      try { await context.resume() } catch { /* Safari can resume on first samples */ }
    }

    const analyser = context.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.62
    context.createMediaStreamSource(stream).connect(analyser)
    analyserRef.current = analyser
    drawSpectrum(analyser)
  }

  useEffect(() => () => {
    recognitionRef.current?.stop()
    void releaseMicrophone()
  }, [])

  function clearAttempt() {
    setCaptured('')
    capturedRef.current = ''
    setResult(null)
    setError(null)
  }

  function changeMode(next: SpeechMode) {
    recognitionRef.current?.stop()
    void releaseMicrophone()
    recognitionRef.current = null
    setStatus('idle')
    setMode(next)
    setIndex(0)
    clearAttempt()
    interactionFeedback('tap')
  }

  function move(delta: number) {
    if (!prompts.length) return
    recognitionRef.current?.stop()
    void releaseMicrophone()
    recognitionRef.current = null
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
      await openMicrophone()
      const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
      if (!Recognition) throw new Error('speech-recognition-unavailable')

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
        setError(event.error === 'not-allowed' ? 'El micrófono está bloqueado. Permite el acceso para este sitio y vuelve a intentarlo.' : event.error === 'no-speech' ? 'No detecté voz. Toca Hablar y espera a que el espectro se active.' : 'No pude convertir la voz a texto esta vez. Inténtalo nuevamente.')
        interactionFeedback('warning')
      }
      instance.onend = () => {
        recognitionRef.current = null
        setStatus('idle')
        void releaseMicrophone()
        interactionFeedback('listen-end')
        if (!capturedRef.current) setError(previous => previous ?? 'La escucha terminó sin reconocer texto. Si el espectro se movió, el micrófono sí recibió sonido.')
      }
      instance.start()
    } catch (cause) {
      await releaseMicrophone()
      recognitionRef.current = null
      setStatus('idle')
      interactionFeedback('warning')
      const code = cause instanceof Error ? cause.message : ''
      setError(code === 'speech-recognition-unavailable' ? 'El micrófono funciona, pero este navegador no puede convertir voz a texto hebreo.' : 'No pude abrir el micrófono de forma estable. Revisa el permiso del navegador y vuelve a tocar Hablar.')
    }
  }

  function stop() {
    recognitionRef.current?.stop()
    interactionFeedback('tap')
  }

  function submitResult() {
    if (!current || !captured.trim()) return
    const next = { transcript: captured.trim(), score: similarity(current.hebrew, captured.trim()) }
    setResult(next)
    interactionFeedback(next.score >= 75 ? 'success' : 'warning')
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
    <section aria-label="Práctica oral de hebreo" className="mt-4 border-y border-slate-200 py-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <Mic className="h-4 w-4 text-sky-600" />
        <span className="text-[12px] font-black text-slate-900">Práctica oral</span>
        <span className="text-[9px] font-bold text-slate-400">{mode === 'words' ? words.length : sentences.length} ejercicios</span>
      </div>

      <div className="mx-auto mt-2 inline-flex rounded-full bg-slate-100 p-1">
        <button type="button" onClick={() => changeMode('words')} className={`min-h-8 rounded-full px-4 text-[10px] font-black ${mode === 'words' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Palabras</button>
        <button type="button" onClick={() => changeMode('sentences')} className={`min-h-8 rounded-full px-4 text-[10px] font-black ${mode === 'sentences' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Oraciones</button>
      </div>

      {current && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => move(-1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 active:bg-slate-100" aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-slate-400">{index + 1}/{prompts.length} · {current.source}</p>
              <p lang="he" dir="rtl" className="mx-auto mt-1 text-[2.6rem] font-black leading-[1.3] text-slate-950">{current.hebrew}</p>
              <p className="mt-1 text-[12px] font-black leading-snug text-sky-700">{pronounceHebrewForSpanish(current.hebrew)}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500">{current.label}</p>
            </div>
            <button type="button" onClick={() => move(1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 active:bg-slate-100" aria-label="Siguiente"><ChevronRight className="h-5 w-5" /></button>
          </div>

          <div className={`voice-spectrum mx-auto mt-3 flex h-12 max-w-[260px] items-center justify-center gap-[3px] overflow-hidden rounded-full border px-5 transition ${status === 'listening' ? 'voice-spectrum-active border-sky-200 bg-sky-50/80' : 'border-slate-100 bg-slate-50'}`} aria-label="Espectro de voz">
            {levels.map((height, bar) => <span key={bar} className={`w-[3px] rounded-full transition-[height] duration-75 ${status === 'listening' ? 'bg-sky-500' : 'bg-slate-300'}`} style={{ height: `${Math.max(5, Math.round(height * 0.34))}px` }} />)}
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <button type="button" onClick={speakGuide} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-sky-700 shadow-sm" aria-label="Escuchar pronunciación"><Volume2 className="h-4.5 w-4.5" /></button>
            <button type="button" onClick={status === 'listening' ? stop : () => void start()} disabled={status === 'requesting'} className={`grid h-12 w-12 place-items-center rounded-full shadow-sm disabled:opacity-60 ${status === 'listening' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-sky-600 text-white'}`} aria-label={status === 'listening' ? 'Terminar escucha' : 'Hablar'}>{status === 'listening' ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}</button>
            <button type="button" onClick={submitResult} disabled={!captured || Boolean(result) || status !== 'idle'} className="grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-white shadow-sm disabled:opacity-25" aria-label="Enviar resultado"><Send className="h-4 w-4" /></button>
          </div>

          {status === 'requesting' && <p className="mt-2 text-[10px] font-black text-sky-700">Activando micrófono…</p>}
          {status === 'listening' && <p className="mt-2 text-[10px] font-black text-sky-700">Te escucho…</p>}

          {captured && !result && status === 'idle' && <p className="mx-auto mt-3 max-w-sm text-[11px] text-slate-500">Reconocí: <span lang="he" dir="rtl" className="text-[1.25rem] font-black text-slate-900">{captured}</span></p>}

          {result && scoreFeedback && detail && (
            <div className="mx-auto mt-3 max-w-sm rounded-[18px] bg-slate-50 px-4 py-3">
              <div className="flex items-baseline justify-center gap-2"><p className="text-[22px] font-black text-slate-950">{result.score}%</p><p className={`text-[11px] font-black ${scoreFeedback.tone}`}>{scoreFeedback.text}</p></div>
              <p className="mt-1 text-[12px] font-black text-slate-800">{detail.title}</p>
              {detail.detail && <p className="mx-auto mt-1 max-w-sm text-[10px] font-semibold leading-relaxed text-slate-500">{detail.detail}</p>}
              <button type="button" onClick={() => { clearAttempt(); interactionFeedback('tap') }} className="mt-2 text-[10px] font-black text-sky-700">Intentar otra vez</button>
            </div>
          )}

          {error && <p role="alert" className="mx-auto mt-2 max-w-sm text-[10px] font-bold leading-relaxed text-rose-600">{error}</p>}
        </div>
      )}

      <style jsx>{`
        .voice-spectrum-active { box-shadow: inset 0 0 18px rgba(14,165,233,.08), 0 0 24px rgba(14,165,233,.14); }
        .voice-spectrum-active span { box-shadow: 0 0 7px rgba(14,165,233,.55); }
      `}</style>
    </section>
  )
}
