'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Languages, LoaderCircle, Speaker, X } from 'lucide-react'
import { detectHebrewTranslationDirection, hasHebrew, isSingleWord } from '@/lib/hebreo/translator'

type TranslationResult = {
  input: string
  translatedText: string
  sourceLanguage: 'es' | 'he'
  targetLanguage: 'es' | 'he'
  kind: 'word' | 'phrase'
}

export default function HebrewTranslator() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const direction = useMemo(() => detectHebrewTranslationDirection(text), [text])
  const inputIsHebrew = direction.source === 'he'

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function translate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text.trim()
    if (!value || loading) return

    setLoading(true)
    setError('')
    setResult(null)
    setCopied(false)

    try {
      const response = await fetch('/api/estudios/hebreo/traducir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      })
      const data = await response.json() as Partial<TranslationResult> & { error?: string }

      if (!response.ok || !data.translatedText || !data.sourceLanguage || !data.targetLanguage) {
        throw new Error(data.error || 'No se pudo traducir.')
      }

      setResult({
        input: data.input || value,
        translatedText: data.translatedText,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        kind: data.kind === 'word' ? 'word' : 'phrase',
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo traducir.')
    } finally {
      setLoading(false)
    }
  }

  async function copyResult() {
    if (!result?.translatedText) return
    await navigator.clipboard.writeText(result.translatedText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function speakHebrew() {
    if (!result || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const hebrewText = result.sourceLanguage === 'he' ? result.input : result.translatedText
    if (!hasHebrew(hebrewText)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(hebrewText)
    utterance.lang = 'he-IL'
    const voice = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith('he'))
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }

  const outputIsHebrew = result?.targetLanguage === 'he'
  const singleWord = result ? result.kind === 'word' : isSingleWord(text)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 z-[55] inline-flex min-h-11 items-center gap-2 rounded-full border border-indigo-200 bg-white/95 px-4 text-sm font-black text-indigo-700 shadow-[0_8px_26px_rgba(15,23,42,0.12)] backdrop-blur active:scale-[0.98]"
        style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        aria-label="Abrir traductor de hebreo"
      >
        <Languages className="h-4.5 w-4.5" aria-hidden="true" />
        Traducir
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={event => {
            if (event.currentTarget === event.target) setOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="hebrew-translator-title"
            className="w-full max-w-xl rounded-t-[28px] bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 text-left shadow-2xl sm:rounded-[28px] sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p lang="he" dir="rtl" className="text-sm font-black text-indigo-700">תרגום</p>
                <h2 id="hebrew-translator-title" className="text-xl font-black tracking-[-0.02em] text-slate-950">Traductor</h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">Español ⇄ עברית</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar traductor">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-5" onSubmit={translate}>
              <label htmlFor="hebrew-translation-input" className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-slate-500">
                <span>Escribe una palabra o frase</span>
                <span className="text-indigo-600">{inputIsHebrew ? 'Hebreo → Español' : 'Español → Hebreo'}</span>
              </label>
              <textarea
                id="hebrew-translation-input"
                value={text}
                onChange={event => {
                  setText(event.target.value.slice(0, 1000))
                  setError('')
                }}
                dir={inputIsHebrew ? 'rtl' : 'ltr'}
                lang={inputIsHebrew ? 'he' : 'es'}
                rows={4}
                autoFocus
                placeholder={inputIsHebrew ? 'כתוב מילה או משפט' : 'Ej. Dios es bueno'}
                className="w-full resize-none rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-[1.05rem] font-semibold leading-relaxed text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>{singleWord ? 'Palabra' : 'Frase'}</span>
                <span>{text.length}/1000</span>
              </div>

              <button
                type="submit"
                disabled={!text.trim() || loading}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-indigo-600 px-5 text-sm font-black text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Languages className="h-5 w-5" aria-hidden="true" />}
                {loading ? 'Traduciendo…' : 'Traducir'}
              </button>
            </form>

            <div className="mt-5 min-h-24 border-t border-slate-200 pt-4" aria-live="polite">
              {error && <p className="rounded-[16px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}

              {result && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{result.kind === 'word' ? 'Significado' : 'Traducción'}</p>
                    <p className="text-[11px] font-bold text-slate-400">{result.sourceLanguage === 'he' ? 'Hebreo → Español' : 'Español → Hebreo'}</p>
                  </div>
                  <p
                    lang={outputIsHebrew ? 'he' : 'es'}
                    dir={outputIsHebrew ? 'rtl' : 'ltr'}
                    className={`mt-3 break-words font-black leading-relaxed text-slate-950 ${outputIsHebrew ? 'text-[2rem]' : 'text-[1.45rem]'}`}
                  >
                    {result.translatedText}
                  </p>
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={copyResult} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[15px] bg-slate-100 px-3 text-xs font-black text-slate-700">
                      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                    <button type="button" onClick={speakHebrew} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[15px] bg-indigo-50 px-3 text-xs font-black text-indigo-700">
                      <Speaker className="h-4 w-4" aria-hidden="true" />
                      Escuchar hebreo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
