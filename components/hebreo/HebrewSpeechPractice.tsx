'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Mic, Square, Volume2 } from 'lucide-react'
import { HEBREW_PRACTICE_QUESTIONS } from '@/lib/hebreo/progress'
import { HEBREW_USEFUL_PHRASES } from '@/lib/hebreo/useful-phrases'
import { pronounceHebrewForSpanish, withoutHebrewMarks } from '@/lib/hebreo/pronunciation'

type SpeechMode = 'words' | 'sentences'
type SpeechResultEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } }
type SpeechErrorEvent = { error?: string }
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
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
  if (score >= 90) return { text: 'Muy buena coincidencia. La lectura fue reconocida casi completa.', tone: 'text-emerald-700' }
  if (score >= 75) return { text: 'Buena pronunciación. Hay pequeños detalles que puedes pulir.', tone: 'text-emerald-700' }
  if (score >= 55) return { text: 'Va cerca. Repite más despacio y separa mejor los sonidos.', tone: 'text-amber-700' }
  return { text: 'El reconocimiento fue bastante distinto. Escucha la guía, repite por partes y vuelve a probar.', tone: 'text-rose-700' }
}

export default function HebrewSpeechPractice() {
  const [mode, setMode] = useState<SpeechMode>('words')
  const [index, setIndex] = useState(0)
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null)
  const [status, setStatus] = useState<'idle' | 'requesting' | 'listening'>('idle')
  const [result, setResult] = useState<{ transcript: string; score: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const words = useMemo(buildWordPrompts, [])
  const sentences = useMemo(buildSentencePrompts, [])
  const prompts = mode === 'words' ? words : sentences
  const current = prompts[index % Math.max(1, prompts.length)]

  function changeMode(next: SpeechMode) {
    recognition?.stop()
    setRecognition(null)
    setStatus('idle')
    setMode(next)
    setIndex(0)
    setResult(null)
    setError(null)
  }

  function move(delta: number) {
    if (!prompts.length) return
    recognition?.stop()
    setRecognition(null)
    setStatus('idle')
    setIndex(value => (value + delta + prompts.length) % prompts.length)
    setResult(null)
    setError(null)
  }

  async function start() {
    if (!current || typeof window === 'undefined' || status !== 'idle') return
    setError(null)
    setResult(null)
    setStatus('requesting')

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
      }

      const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
      if (!Recognition) {
        setStatus('idle')
        setError('El permiso del micrófono funciona, pero este navegador no ofrece reconocimiento de voz en hebreo. Abre este mismo enlace directamente en Safari o Chrome actualizado; la práctica oral no se ocultará.')
        return
      }

      const instance = new Recognition()
      instance.lang = 'he-IL'
      instance.interimResults = false
      instance.maxAlternatives = 1
      instance.onstart = () => setStatus('listening')
      instance.onresult = event => {
        const transcript = event.results[0][0].transcript
        setResult({ transcript, score: similarity(current.hebrew, transcript) })
        setError(null)
      }
      instance.onerror = event => {
        setError(event.error === 'not-allowed'
          ? 'El micrófono está bloqueado. Permite el acceso al micrófono para este sitio y vuelve a intentarlo.'
          : 'No pude reconocer la voz esta vez. Habla cerca del micrófono, en un ambiente tranquilo, y vuelve a intentar.')
      }
      instance.onend = () => {
        setStatus('idle')
        setRecognition(null)
      }
      setRecognition(instance)
      instance.start()
    } catch {
      setStatus('idle')
      setRecognition(null)
      setError('No pude abrir el micrófono. Revisa el permiso del navegador para este sitio y vuelve a intentarlo.')
    }
  }

  function stop() {
    recognition?.stop()
    setStatus('idle')
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

  return (
    <section aria-label="Práctica oral de hebreo" className="mt-4 border-y border-slate-200 py-4 text-center">
      <div className="inline-flex items-center gap-2 text-indigo-700"><Mic className="h-4 w-4" /><span className="text-[12px] font-black">Práctica oral</span></div>
      <p className="mx-auto mt-1 max-w-sm text-[10px] leading-relaxed text-slate-500">Practica palabras y oraciones de todo lo estudiado. Esta práctica es independiente de la nota del examen.</p>

      <div className="mx-auto mt-3 grid max-w-xs grid-cols-2 gap-2 rounded-[16px] bg-slate-100 p-1">
        <button type="button" onClick={() => changeMode('words')} className={`min-h-10 rounded-[13px] text-[11px] font-black ${mode === 'words' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Palabras · {words.length}</button>
        <button type="button" onClick={() => changeMode('sentences')} className={`min-h-10 rounded-[13px] text-[11px] font-black ${mode === 'sentences' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Oraciones · {sentences.length}</button>
      </div>

      {current && (
        <div className="mt-4">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">{current.source} · {index + 1} de {prompts.length}</p>
          <p lang="he" dir="rtl" className="mx-auto mt-3 max-w-md text-[2.35rem] font-black leading-[1.45] text-slate-950">{current.hebrew}</p>
          <p className="mx-auto mt-2 max-w-sm text-[12px] font-bold text-indigo-700">{pronounceHebrewForSpanish(current.hebrew)}</p>
          <p className="mx-auto mt-1 max-w-sm text-[10px] text-slate-500">{current.label}</p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button type="button" onClick={() => move(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600" aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={speakGuide} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 text-[11px] font-black text-indigo-700"><Volume2 className="h-4 w-4" />Escuchar</button>
            <button type="button" onClick={status === 'listening' ? stop : () => void start()} disabled={status === 'requesting'} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[11px] font-black disabled:opacity-60 ${status === 'listening' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-indigo-600 text-white'}`}>{status === 'listening' ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}{status === 'requesting' ? 'Abriendo…' : status === 'listening' ? 'Detener' : 'Hablar ahora'}</button>
            <button type="button" onClick={() => move(1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600" aria-label="Siguiente"><ChevronRight className="h-5 w-5" /></button>
          </div>

          {status === 'listening' && <p className="mt-3 text-[11px] font-black text-rose-600">Escuchando… pronuncia el texto completo.</p>}
          {result && scoreFeedback && <div className="mx-auto mt-3 max-w-sm rounded-[16px] bg-slate-50 px-4 py-3"><p className="text-[10px] text-slate-500">Reconocí: <span lang="he" dir="rtl" className="font-black text-slate-900">{result.transcript}</span></p><p className="mt-1 text-[18px] font-black text-slate-950">{result.score}%</p><p className={`mt-1 text-[11px] font-black ${scoreFeedback.tone}`}>{scoreFeedback.text}</p></div>}
          {error && <p role="alert" className="mx-auto mt-3 max-w-sm text-[10px] font-bold leading-relaxed text-rose-600">{error}</p>}
        </div>
      )}
    </section>
  )
}
