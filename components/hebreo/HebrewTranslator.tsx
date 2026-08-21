'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Check, ChevronDown, Copy, Languages, LoaderCircle, Speaker } from 'lucide-react'
import { detectHebrewTranslationDirection, hasHebrew, isSingleWord } from '@/lib/hebreo/translator'

type TranslationResult = {
  input: string
  translatedText: string
  sourceLanguage: 'es' | 'he'
  targetLanguage: 'es' | 'he'
  kind: 'word' | 'phrase'
}

const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g
function withoutNiqqud(value: string) { return value.normalize('NFD').replace(HEBREW_MARKS, '').normalize('NFC') }

export default function HebrewTranslator() {
  const [open, setOpen] = useState(false)
  const [showNiqqud, setShowNiqqud] = useState(true)
  const [text, setText] = useState('')
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const direction = useMemo(() => detectHebrewTranslationDirection(text), [text])
  const inputIsHebrew = direction.source === 'he'
  const outputIsHebrew = result?.targetLanguage === 'he'
  const singleWord = result ? result.kind === 'word' : isSingleWord(text)
  const visibleResult = result?.translatedText && outputIsHebrew && !showNiqqud ? withoutNiqqud(result.translatedText) : result?.translatedText

  async function translate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text.trim()
    if (!value || loading) return
    setLoading(true); setError(''); setResult(null); setCopied(false)
    try {
      const response = await fetch('/api/estudios/hebreo/traducir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value }) })
      const data = await response.json() as Partial<TranslationResult> & { error?: string }
      if (!response.ok || !data.translatedText || !data.sourceLanguage || !data.targetLanguage) throw new Error(data.error || 'No se pudo traducir.')
      setResult({ input: data.input || value, translatedText: data.translatedText, sourceLanguage: data.sourceLanguage, targetLanguage: data.targetLanguage, kind: data.kind === 'word' ? 'word' : 'phrase' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo traducir.') }
    finally { setLoading(false) }
  }

  async function copyResult() {
    if (!visibleResult) return
    await navigator.clipboard.writeText(visibleResult)
    setCopied(true); window.setTimeout(() => setCopied(false), 1600)
  }

  function speakHebrew() {
    if (!result || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const source = result.sourceLanguage === 'he' ? result.input : result.translatedText
    const hebrewText = showNiqqud ? source : withoutNiqqud(source)
    if (!hasHebrew(hebrewText)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(hebrewText)
    utterance.lang = 'he-IL'
    const voice = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith('he'))
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }

  return (
    <section className="mb-5 w-full text-left">
      <div className="overflow-hidden rounded-[26px] border border-white/70 bg-white/58 shadow-[0_12px_38px_rgba(15,23,42,0.08)] backdrop-blur-2xl backdrop-saturate-150">
        <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-[72px] w-full items-center justify-between gap-4 px-4 py-3 text-left active:bg-white/35">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-500/10 text-indigo-700"><Languages className="h-5 w-5" /></span>
            <span><span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-600">תרגום</span><span className="block text-[17px] font-black tracking-[-0.02em] text-slate-950">Traductor</span><span className="block text-[11px] font-semibold text-slate-500">Español ⇄ עברית</span></span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>

        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="border-t border-white/75 px-4 pb-4 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[12px] font-black text-slate-500">Niqqud</span>
                <div className="grid grid-cols-2 rounded-full bg-slate-100/80 p-1">
                  <button type="button" onClick={() => setShowNiqqud(true)} className={`min-h-9 rounded-full px-3 text-[11px] font-black ${showNiqqud ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Con</button>
                  <button type="button" onClick={() => setShowNiqqud(false)} className={`min-h-9 rounded-full px-3 text-[11px] font-black ${!showNiqqud ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Sin</button>
                </div>
              </div>

              <form onSubmit={translate}>
                <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="hebrew-translation-input" className="text-[12px] font-black text-slate-600">Escribe una palabra o frase</label><span className="text-[11px] font-black text-indigo-700">{inputIsHebrew ? 'Hebreo → Español' : 'Español → Hebreo'}</span></div>
                <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
                  <textarea id="hebrew-translation-input" value={text} onChange={event => { setText(event.target.value.slice(0, 1000)); setError('') }} dir={inputIsHebrew ? 'rtl' : 'ltr'} lang={inputIsHebrew ? 'he' : 'es'} rows={3} placeholder={inputIsHebrew ? 'כתוב מילה או משפט' : 'Ej. Dios es bueno'} className="min-h-[108px] w-full resize-none bg-transparent px-4 pb-3 pt-4 text-[1.05rem] font-semibold leading-relaxed text-slate-950 outline-none placeholder:text-slate-400" />
                  <div className="flex items-center justify-between border-t border-white/70 px-4 py-2 text-[10px] font-semibold text-slate-400"><span>{singleWord ? 'Palabra' : 'Frase'}</span><span>{text.length}/1000</span></div>
                </div>
                <button type="submit" disabled={!text.trim() || loading} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-indigo-600 px-5 text-sm font-black text-white shadow-[0_9px_24px_rgba(79,70,229,0.24)] active:scale-[0.985] disabled:bg-slate-300 disabled:shadow-none">{loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Languages className="h-5 w-5" />}{loading ? 'Traduciendo…' : 'Traducir'}</button>
              </form>

              <div className="mt-4 min-h-4" aria-live="polite">
                {error && <p className="rounded-[18px] bg-rose-50/80 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
                {result && <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white/52 backdrop-blur-2xl"><div className="flex items-center justify-between gap-3 border-b border-white/70 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.09em] text-slate-400">{result.kind === 'word' ? 'Significado' : 'Traducción'}</p><p className="text-[10px] font-bold text-slate-400">{result.sourceLanguage === 'he' ? 'Hebreo → Español' : 'Español → Hebreo'}</p></div><div className="px-4 py-5"><p lang={outputIsHebrew ? 'he' : 'es'} dir={outputIsHebrew ? 'rtl' : 'ltr'} className={`break-words font-black tracking-[-0.02em] text-slate-950 ${outputIsHebrew ? 'text-[2.45rem] leading-[1.45]' : 'text-[1.6rem] leading-snug'}`}>{visibleResult}</p></div><div className="grid grid-cols-2 gap-2 border-t border-white/70 p-2.5"><button type="button" onClick={copyResult} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-slate-100/72 px-3 text-xs font-black text-slate-700">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copiado' : 'Copiar'}</button><button type="button" onClick={speakHebrew} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-indigo-500/10 px-3 text-xs font-black text-indigo-700"><Speaker className="h-4 w-4" />Escuchar hebreo</button></div></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
