'use client'

import { useEffect, useRef, useState } from 'react'

type EditableTarget = HTMLInputElement | HTMLTextAreaElement
type KeyboardMode = 'letters' | 'sofit' | 'niqqud'

type HebrewKeyboardDockProps = {
  enabled: boolean
  onDisable: () => void
}

const HEBREW_ROWS = [
  ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת'],
] as const

const SOFIT = [
  { regular: 'כ', final: 'ך', label: 'Kaf sofit' },
  { regular: 'מ', final: 'ם', label: 'Mem sofit' },
  { regular: 'נ', final: 'ן', label: 'Nun sofit' },
  { regular: 'פ', final: 'ף', label: 'Pe sofit' },
  { regular: 'צ', final: 'ץ', label: 'Tsadi sofit' },
] as const

const NIQQUD = [
  { value: '\u05B0', example: 'בְ', label: 'Sheva' },
  { value: '\u05B1', example: 'בֱ', label: 'Hataf Segol' },
  { value: '\u05B2', example: 'בֲ', label: 'Hataf Pataj' },
  { value: '\u05B3', example: 'בֳ', label: 'Hataf Qamats' },
  { value: '\u05B4', example: 'בִ', label: 'Hiriq' },
  { value: '\u05B5', example: 'בֵ', label: 'Tsere' },
  { value: '\u05B6', example: 'בֶ', label: 'Segol' },
  { value: '\u05B7', example: 'בַ', label: 'Pataj' },
  { value: '\u05B8', example: 'בָ', label: 'Qamats' },
  { value: '\u05C7', example: 'בׇ', label: 'Qamats Qatan' },
  { value: '\u05B9', example: 'בֹ', label: 'Holam' },
  { value: '\u05BA', example: 'וֺ', label: 'Holam Haser' },
  { value: '\u05BB', example: 'בֻ', label: 'Qubuts' },
  { value: '\u05BC', example: 'בּ', label: 'Dagesh' },
  { value: '\u05BD', example: 'בֽ', label: 'Meteg' },
  { value: '\u05BF', example: 'בֿ', label: 'Rafe' },
  { value: '\u05C1', example: 'שׁ', label: 'Punto Shin' },
  { value: '\u05C2', example: 'שׂ', label: 'Punto Sin' },
] as const

const BIBLICAL_MARKS = [
  { value: '־', label: 'Maqaf' },
  { value: '׀', label: 'Paseq' },
  { value: '׃', label: 'Sof pasuq' },
] as const

function isEditableTarget(target: EventTarget | null): target is EditableTarget {
  if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly
  if (!(target instanceof HTMLInputElement)) return false
  if (target.disabled || target.readOnly) return false
  return ['text', 'search', ''].includes(target.type)
}

function setNativeValue(target: EditableTarget, value: string) {
  const prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
  descriptor?.set?.call(target, value)
  target.dispatchEvent(new Event('input', { bubbles: true }))
}

export default function HebrewKeyboardDock({ enabled, onDisable }: HebrewKeyboardDockProps) {
  const [mode, setMode] = useState<KeyboardMode>('letters')
  const [practice, setPractice] = useState('')
  const lastTargetRef = useRef<EditableTarget | null>(null)
  const practiceRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    function rememberTarget(event: FocusEvent) {
      if (!isEditableTarget(event.target)) return
      lastTargetRef.current = event.target
    }
    document.addEventListener('focusin', rememberTarget)
    return () => document.removeEventListener('focusin', rememberTarget)
  }, [])

  if (!enabled) return null

  function currentTarget() {
    const target = lastTargetRef.current
    if (target?.isConnected && !target.disabled && !target.readOnly) return target
    return practiceRef.current
  }

  function restoreSelection(target: EditableTarget, position: number) {
    requestAnimationFrame(() => {
      target.focus({ preventScroll: true })
      target.setSelectionRange(position, position)
    })
  }

  function insert(value: string) {
    const target = currentTarget()
    if (!target) return
    const start = target.selectionStart ?? target.value.length
    const end = target.selectionEnd ?? start
    const next = `${target.value.slice(0, start)}${value}${target.value.slice(end)}`
    target.setAttribute('dir', 'rtl')
    target.setAttribute('lang', 'he')
    setNativeValue(target, next)
    restoreSelection(target, start + value.length)
  }

  function backspace() {
    const target = currentTarget()
    if (!target) return
    const start = target.selectionStart ?? target.value.length
    const end = target.selectionEnd ?? start
    if (start === 0 && end === 0) return
    const removeFrom = start === end ? Math.max(0, start - 1) : start
    const next = `${target.value.slice(0, removeFrom)}${target.value.slice(end)}`
    setNativeValue(target, next)
    restoreSelection(target, removeFrom)
  }

  function clearTarget() {
    const target = currentTarget()
    if (!target) return
    setNativeValue(target, '')
    restoreSelection(target, 0)
  }

  function newline() {
    insert('\n')
  }

  return (
    <div data-hebrew-keyboard-root="true" className="border-t border-slate-100 bg-[#f9f9fb] px-3 pb-4 pt-3">
      <div className="text-center">
        <p lang="he" dir="rtl" className="text-[13px] font-black text-indigo-700">כְּתִיבָה בְּעִבְרִית</p>
        <h2 className="mt-1 text-[16px] font-black text-slate-950">Practica tu escritura</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Toca las letras y los signos para formar palabras directamente aquí.</p>
      </div>

      <textarea
        ref={practiceRef}
        data-hebrew-practice="true"
        lang="he"
        dir="rtl"
        value={practice}
        onChange={event => setPractice(event.target.value)}
        onFocus={event => { lastTargetRef.current = event.currentTarget }}
        placeholder="כתוב כאן…"
        rows={3}
        autoFocus
        className="mt-3 w-full resize-none rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-right text-[2.1rem] font-black leading-relaxed text-slate-950 outline-none placeholder:text-slate-300 focus:border-indigo-300"
      />

      <div className="mt-3 grid grid-cols-3 rounded-[16px] bg-slate-200/70 p-1">
        <button type="button" aria-pressed={mode === 'letters'} onClick={() => setMode('letters')} className={`min-h-10 rounded-[13px] px-1 text-[11px] font-black ${mode === 'letters' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>אותיות · Letras</button>
        <button type="button" aria-pressed={mode === 'sofit'} onClick={() => setMode('sofit')} className={`min-h-10 rounded-[13px] px-1 text-[11px] font-black ${mode === 'sofit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>סופית · Sofit</button>
        <button type="button" aria-pressed={mode === 'niqqud'} onClick={() => setMode('niqqud')} className={`min-h-10 rounded-[13px] px-1 text-[11px] font-black ${mode === 'niqqud' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>נִקּוּד · Niqqud</button>
      </div>

      {mode === 'letters' && (
        <div className="mt-3 space-y-1.5" dir="ltr">
          {HEBREW_ROWS.map((row, rowIndex) => (
            <div key={`hebrew-row-${rowIndex}`} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
              {row.map(letter => (
                <button key={letter} type="button" onClick={() => insert(letter)} className="min-h-12 rounded-[10px] border border-slate-200 bg-white text-[1.55rem] font-black text-slate-950 shadow-[0_1px_2px_rgba(15,23,42,0.06)] active:bg-indigo-50">{letter}</button>
              ))}
            </div>
          ))}
        </div>
      )}

      {mode === 'sofit' && (
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {SOFIT.map(item => (
            <button key={item.final} type="button" onClick={() => insert(item.final)} className="min-h-[72px] rounded-[12px] border border-slate-200 bg-white px-1 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)] active:bg-indigo-50">
              <span lang="he" dir="rtl" className="block text-[2rem] font-black leading-tight text-indigo-700">{item.final}</span>
              <span className="mt-0.5 block text-[8px] font-black leading-tight text-slate-400">{item.regular} → {item.final}</span>
            </button>
          ))}
        </div>
      )}

      {mode === 'niqqud' && (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {NIQQUD.map(mark => (
            <button key={mark.label} type="button" onClick={() => insert(mark.value)} className="min-h-[62px] rounded-[12px] border border-slate-200 bg-white px-1 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)] active:bg-indigo-50">
              <span lang="he" dir="rtl" className="block text-[1.75rem] font-black leading-tight text-indigo-700">{mark.example}</span>
              <span className="mt-0.5 block text-[8px] font-black leading-tight text-slate-400">{mark.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-slate-200 pt-3">
        <p className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Signos bíblicos</p>
        <div className="grid grid-cols-3 gap-1.5">
          {BIBLICAL_MARKS.map(mark => (
            <button key={mark.label} type="button" onClick={() => insert(mark.value)} className="min-h-11 rounded-[12px] border border-slate-200 bg-white text-center active:bg-indigo-50">
              <span lang="he" dir="rtl" className="mr-1 text-lg font-black text-indigo-700">{mark.value}</span>
              <span className="text-[9px] font-black text-slate-500">{mark.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_2fr_1fr_1fr] gap-1.5">
        <button type="button" onClick={clearTarget} className="min-h-11 rounded-[12px] border border-slate-200 bg-white text-[10px] font-black text-slate-500">Limpiar</button>
        <button type="button" onClick={() => insert(' ')} className="min-h-11 rounded-[12px] border border-slate-200 bg-white text-[11px] font-black text-slate-600">Espacio</button>
        <button type="button" onClick={backspace} className="min-h-11 rounded-[12px] border border-slate-200 bg-white text-lg font-black text-slate-600" aria-label="Borrar último carácter">⌫</button>
        <button type="button" onClick={newline} className="min-h-11 rounded-[12px] bg-indigo-600 text-lg font-black text-white" aria-label="Nueva línea">↵</button>
      </div>

      <button type="button" onClick={onDisable} className="mt-3 min-h-10 w-full rounded-full text-[10px] font-black text-slate-500">Ocultar teclado</button>
      <p className="mt-1 px-2 text-center text-[9px] leading-relaxed text-slate-400">También puedes usar el teclado hebreo nativo del teléfono. Este teclado de VIDA es una superficie de práctica dentro del módulo y no guarda lo que escribes.</p>
    </div>
  )
}
