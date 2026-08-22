'use client'

import { useEffect, useRef, useState } from 'react'

type EditableTarget = HTMLInputElement | HTMLTextAreaElement
type KeyboardMode = 'letters' | 'sofit' | 'niqqud'

type HebrewKeyboardDockProps = {
  enabled: boolean
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

export default function HebrewKeyboardDock({ enabled }: HebrewKeyboardDockProps) {
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

  return (
    <section data-hebrew-keyboard-root="true" className="w-full pb-2 pt-1 text-left">
      <div className="mb-4 text-center">
        <p lang="he" dir="rtl" className="text-[1.05rem] font-black text-indigo-700">כְּתִיבָה בְּעִבְרִית</p>
        <h2 className="mt-1 text-[1.35rem] font-black tracking-[-0.02em] text-slate-950">Practica tu escritura</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Forma letras, palabras y signos sin salir del módulo.</p>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
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
          className="min-h-[112px] w-full resize-none bg-transparent px-4 pb-3 pt-4 text-right text-[2rem] font-black leading-relaxed text-slate-950 outline-none placeholder:text-slate-300"
        />
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-[10px] font-semibold text-slate-400">
          <span>Práctica libre</span>
          <span>{practice.length} caracteres</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 rounded-[18px] bg-slate-100 p-1.5">
        <button type="button" aria-pressed={mode === 'letters'} onClick={() => setMode('letters')} className={`min-h-10 rounded-[14px] px-1 text-[11px] font-black ${mode === 'letters' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>אותיות · Letras</button>
        <button type="button" aria-pressed={mode === 'sofit'} onClick={() => setMode('sofit')} className={`min-h-10 rounded-[14px] px-1 text-[11px] font-black ${mode === 'sofit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>סופית · Sofit</button>
        <button type="button" aria-pressed={mode === 'niqqud'} onClick={() => setMode('niqqud')} className={`min-h-10 rounded-[14px] px-1 text-[11px] font-black ${mode === 'niqqud' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>נִקּוּד · Niqqud</button>
      </div>

      <div className="mt-3 rounded-[20px] bg-slate-100 p-2.5">
        {mode === 'letters' && (
          <div className="space-y-1.5" dir="ltr">
            {HEBREW_ROWS.map((row, rowIndex) => (
              <div key={`hebrew-row-${rowIndex}`} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                {row.map(letter => (
                  <button key={letter} type="button" onClick={() => insert(letter)} className="min-h-12 rounded-[12px] bg-white text-[1.5rem] font-black text-slate-950 shadow-sm active:bg-indigo-50">{letter}</button>
                ))}
              </div>
            ))}
          </div>
        )}

        {mode === 'sofit' && (
          <div className="grid grid-cols-5 gap-1.5">
            {SOFIT.map(item => (
              <button key={item.final} type="button" onClick={() => insert(item.final)} className="min-h-[72px] rounded-[14px] bg-white px-1 text-center shadow-sm active:bg-indigo-50">
                <span lang="he" dir="rtl" className="block text-[2rem] font-black leading-tight text-indigo-700">{item.final}</span>
                <span className="mt-1 block text-[8px] font-black leading-tight text-slate-400">{item.regular} → {item.final}</span>
              </button>
            ))}
          </div>
        )}

        {mode === 'niqqud' && (
          <div className="grid grid-cols-4 gap-1.5">
            {NIQQUD.map(mark => (
              <button key={mark.label} type="button" onClick={() => insert(mark.value)} className="min-h-[62px] rounded-[14px] bg-white px-1 text-center shadow-sm active:bg-indigo-50">
                <span lang="he" dir="rtl" className="block text-[1.75rem] font-black leading-tight text-indigo-700">{mark.example}</span>
                <span className="mt-1 block text-[8px] font-black leading-tight text-slate-400">{mark.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <span className="mr-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">Signos bíblicos</span>
        {BIBLICAL_MARKS.map(mark => (
          <button key={mark.label} type="button" onClick={() => insert(mark.value)} className="min-h-10 rounded-full bg-slate-100 px-3 text-[10px] font-black text-slate-600 active:bg-indigo-50">
            <span lang="he" dir="rtl" className="mr-1 text-base text-indigo-700">{mark.value}</span>{mark.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_2fr_1fr_1fr] gap-1.5">
        <button type="button" onClick={clearTarget} className="min-h-11 rounded-[14px] bg-slate-100 text-[10px] font-black text-slate-500">Limpiar</button>
        <button type="button" onClick={() => insert(' ')} className="min-h-11 rounded-[14px] bg-slate-100 text-[11px] font-black text-slate-600">Espacio</button>
        <button type="button" onClick={backspace} className="min-h-11 rounded-[14px] bg-slate-100 text-lg font-black text-slate-600" aria-label="Borrar último carácter">⌫</button>
        <button type="button" onClick={() => insert('\n')} className="min-h-11 rounded-[14px] bg-indigo-600 text-lg font-black text-white" aria-label="Nueva línea">↵</button>
      </div>

      <p className="mt-3 px-2 text-center text-[9px] leading-relaxed text-slate-400">El teclado de VIDA funciona dentro de esta práctica y no guarda lo que escribes.</p>
    </section>
  )
}
