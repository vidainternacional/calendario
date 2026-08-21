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
        className="fixed right-4 z-[55] inline-flex min-h-11 items-center gap-2 rounded-full border border-white/65 bg-white/62 px-4 text-sm font-black text-indigo-700 shadow-[0_10px_32px_rgba(79,70,229,0.16)] backdrop-blur-2xl backdrop-saturate-150 transition active:scale-[0.97]"
        style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        aria-label="Abrir traductor de hebreo"
      >
        <Languages className="h-4.5 w-4.5" aria-hidden="true" />
        Traducir
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/24 p-0 backdrop-blur-md sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={event => {
            if (event.currentTarget === event.target) setOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="hebrew-translator-title"
            className="relative w-full max-w-xl overflow-hidden rounded-t-[32px] border border-white/70 bg-white/76 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 text-left shadow-[0_-18px_70px_rgba(15,23,42,0.22)] backdrop-blur-[28px] backdrop-saturate-150 sm:rounded-[32px] sm:p-5"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/72 to-transparent" aria-hidden="true" />
            <div className="relative mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300/80 sm:hidden" aria-hidden="true" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p lang="he" dir="rtl" className="text-sm font-black text-indigo-600">תרגום</p>
                <h2 id="hebrew-translator-title" className="mt-0.5 text-[1.7rem] font-black tracking-[-0.04em] text-slate-950">Traductor</h2>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-500">Español ⇄ עברית</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-slate-100/72 text-slate-600 shadow-sm backdrop-blur-xl transition active:scale-95"
                aria-label="Cerrar traductor"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form className="relative mt-5" onSubmit={translate}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="hebrew-translation-input" className="text-[13px] font-black text-slate-600">Escribe una palabra o frase</label>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-black text-indigo-700">
                  {inputIsHebrew ? 'Hebreo → Español' : 'Español → Hebreo'}
                </span>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
                <textarea
                  id="hebrew-translation-input"
                  value={text}
                  onChange={event => {
                    setText(event.target.value.slice(0, 1000))
                    setError('')
                  }}
                  dir={inputIsHebrew ? 'rtl' : 'ltr'}
                  lang={inputIsHebrew ? 'he' : 'es'}
                  rows={3}
                  autoFocus
                  placeholder={inputIsHebrew ? 'כתוב מילה או משפט' : 'Ej. Dios es bueno'}
                  className="min-h-[118px] w-full resize-none bg-transparent px-4 pb-3 pt-4 text-[1.08rem] font-semibold leading-relaxed text-slate-950 outline-none placeholder:text-slate-400"
                />
                <div className="flex items-center justify-between border-t border-white/70 px-4 py-2 text-[11px] font-semibold text-slate-400">
                  <span>{singleWord ? 'Palabra' : 'Frase'}</span>
                  <span>{text.length}/1000</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!text.trim() || loading}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-indigo-600 px-5 text-sm font-black text-white shadow-[0_10px_26px_rgba(79,70,229,0.28)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {loading ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Languages className="h-5 w-5" aria-hidden="true" />}
                {loading ? 'Traduciendo…' : 'Traducir'}
              </button>
            </form>

            <div className="relative mt-4 min-h-20" aria-live="polite">
              {error && <p className="rounded-[18px] border border-rose-100 bg-rose-50/82 px-4 py-3 text-sm font-bold text-rose-700 backdrop-blur-xl">{error}</p>}

              {result && (
                <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/54 shadow-[0_10px_34px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
                  <div className="flex items-center justify-between gap-3 border-b border-white/70 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.09em] text-slate-400">{result.kind === 'word' ? 'Significado' : 'Traducción'}</p>
                    <p className="text-[11px] font-bold text-slate-400">{result.sourceLanguage === 'he' ? 'Hebreo → Español' : 'Español → Hebreo'}</p>
                  </div>
                  <div className="px-4 py-5">
                    <p
                      lang={outputIsHebrew ? 'he' : 'es'}
                      dir={outputIsHebrew ? 'rtl' : 'ltr'}
                      className={`break-words font-black tracking-[-0.02em] text-slate-950 ${outputIsHebrew ? 'text-[2.45rem] leading-[1.45]' : 'text-[1.65rem] leading-snug'}`}
                    >
                      {result.translatedText}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-white/70 p-2.5">
                    <button type="button" onClick={copyResult} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-slate-100/72 px-3 text-xs font-black text-slate-700 transition active:scale-[0.98]">
                      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                    <button type="button" onClick={speakHebrew} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-indigo-500/10 px-3 text-xs font-black text-indigo-700 transition active:scale-[0.98]">
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
