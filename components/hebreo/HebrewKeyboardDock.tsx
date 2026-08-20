'use client'

import { useEffect, useRef, useState } from 'react'

type EditableTarget = HTMLInputElement | HTMLTextAreaElement
type KeyboardMode = 'letters' | 'niqqud'

const HEBREW_ROWS = [
  ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ'],
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
  { value: '\u05B9', example: 'בֹ', label: 'Holam' },
  { value: '\u05BB', example: 'בֻ', label: 'Qubuts' },
  { value: '\u05BC', example: 'בּ', label: 'Dagesh' },
  { value: '\u05C1', example: 'שׁ', label: 'Shin' },
  { value: '\u05C2', example: 'שׂ', label: 'Sin' },
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

function targetLabel(target: EditableTarget | null) {
  if (!target) return 'Práctica libre'
  if (target.dataset.hebrewPractice === 'true') return 'Práctica libre'
  const placeholder = target.getAttribute('placeholder')
  if (placeholder) return placeholder
  return 'Campo seleccionado'
}

export default function HebrewKeyboardDock() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<KeyboardMode>('letters')
  const [practice, setPractice] = useState('')
  const [activeLabel, setActiveLabel] = useState('Práctica libre')
  const lastTargetRef = useRef<EditableTarget | null>(null)
  const practiceRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    function rememberTarget(event: FocusEvent) {
      if (!isEditableTarget(event.target)) return
      lastTargetRef.current = event.target
      setActiveLabel(targetLabel(event.target))
    }
    document.addEventListener('focusin', rememberTarget)
    return () => document.removeEventListener('focusin', rememberTarget)
  }, [])

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
    target.setAttribute('dir', 'auto')
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

  function submitOrNewline() {
    const target = currentTarget()
    if (!target) return
    if (target instanceof HTMLTextAreaElement) {
      insert('\n')
      return
    }
    target.form?.requestSubmit()
    setOpen(false)
  }

  function usePractice() {
    const target = practiceRef.current
    if (!target) return
    lastTargetRef.current = target
    setActiveLabel('Práctica libre')
    requestAnimationFrame(() => target.focus({ preventScroll: true }))
  }

  return (
    <div data-hebrew-keyboard-root="true">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] right-4 z-[58] flex min-h-11 items-center gap-2 rounded-full border border-indigo-200 bg-white/95 px-4 text-[12px] font-black text-indigo-700 shadow-[0_10px_28px_rgba(15,23,42,0.16)] backdrop-blur"
          aria-label="Abrir teclado hebreo de VIDA"
        >
          <span lang="he" dir="rtl" className="text-[1.15rem] leading-none">עברית</span>
          <span>Teclado</span>
        </button>
      )}

      {open && (
        <>
          <button type="button" aria-label="Cerrar teclado hebreo" onClick={() => setOpen(false)} className="fixed inset-0 z-[68] bg-slate-950/20" />
          <section className="fixed inset-x-0 bottom-0 z-[69] mx-auto max-h-[78dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border-t border-slate-200 bg-[#f9f9fb] px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[0_-18px_50px_rgba(15,23,42,0.18)] [-webkit-overflow-scrolling:touch]" aria-label="Teclado hebreo de VIDA">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="min-w-0">
                <p lang="he" dir="rtl" className="text-[13px] font-black text-indigo-700">מִקְלֶדֶת עִבְרִית</p>
                <h2 className="text-[16px] font-black text-slate-950">Teclado hebreo</h2>
                <p className="truncate text-[10px] font-bold text-slate-400">Escribiendo en: {activeLabel}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-[11px] font-black text-slate-600">Cerrar</button>
            </div>

            <div className="mt-3 rounded-[20px] border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Práctica de escritura</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Tócala para escribir aquí sin afectar el buscador.</p>
                </div>
                <button type="button" onClick={usePractice} className="shrink-0 rounded-full bg-indigo-50 px-3 py-2 text-[10px] font-black text-indigo-700">Practicar</button>
              </div>
              <textarea
                ref={practiceRef}
                data-hebrew-practice="true"
                lang="he"
                dir="rtl"
                value={practice}
                onChange={event => setPractice(event.target.value)}
                onFocus={event => {
                  lastTargetRef.current = event.currentTarget
                  setActiveLabel('Práctica libre')
                }}
                placeholder="כתוב כאן…"
                rows={2}
                className="mt-2 w-full resize-none rounded-[16px] bg-slate-50 px-4 py-3 text-right text-[2.1rem] font-black leading-relaxed text-slate-950 outline-none placeholder:text-slate-300"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 rounded-[16px] bg-slate-200/70 p-1">
              <button type="button" aria-pressed={mode === 'letters'} onClick={() => setMode('letters')} className={`min-h-10 rounded-[13px] text-[12px] font-black ${mode === 'letters' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>אותיות · Letras</button>
              <button type="button" aria-pressed={mode === 'niqqud'} onClick={() => setMode('niqqud')} className={`min-h-10 rounded-[13px] text-[12px] font-black ${mode === 'niqqud' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>נִקּוּד · Vocales</button>
            </div>

            {mode === 'letters' ? (
              <div className="mt-3 space-y-1.5" dir="ltr">
                {HEBREW_ROWS.map((row, rowIndex) => (
                  <div key={`hebrew-row-${rowIndex}`} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                    {row.map(letter => (
                      <button key={letter} type="button" onClick={() => insert(letter)} className="min-h-12 rounded-[10px] border border-slate-200 bg-white text-[1.55rem] font-black text-slate-950 shadow-[0_1px_2px_rgba(15,23,42,0.06)] active:bg-indigo-50">{letter}</button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {NIQQUD.map(mark => (
                  <button key={mark.label} type="button" onClick={() => insert(mark.value)} className="min-h-[58px] rounded-[12px] border border-slate-200 bg-white px-1 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)] active:bg-indigo-50">
                    <span lang="he" dir="rtl" className="block text-[1.75rem] font-black leading-tight text-indigo-700">{mark.example}</span>
                    <span className="mt-0.5 block text-[8px] font-black leading-tight text-slate-400">{mark.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 grid grid-cols-[1fr_2fr_1fr_1fr] gap-1.5">
              <button type="button" onClick={clearTarget} className="min-h-11 rounded-[12px] border border-slate-200 bg-white text-[10px] font-black text-slate-500">Borrar todo</button>
              <button type="button" onClick={() => insert(' ')} className="min-h-11 rounded-[12px] border border-slate-200 bg-white text-[11px] font-black text-slate-600">Espacio</button>
              <button type="button" onClick={backspace} className="min-h-11 rounded-[12px] border border-slate-200 bg-white text-lg font-black text-slate-600" aria-label="Borrar último carácter">⌫</button>
              <button type="button" onClick={submitOrNewline} className="min-h-11 rounded-[12px] bg-indigo-600 text-lg font-black text-white" aria-label="Buscar o nueva línea">↵</button>
            </div>

            <p className="mt-3 px-2 text-center text-[10px] leading-relaxed text-slate-400">También puedes usar el teclado hebreo nativo del teléfono. VIDA no puede cambiar automáticamente el idioma del teclado del sistema; este teclado funciona dentro del módulo para buscar y practicar.</p>
          </section>
        </>
      )}
    </div>
  )
}
