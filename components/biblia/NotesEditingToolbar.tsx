'use client'

import { useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react'
import {
  Bold,
  BookMarked,
  CalendarDays,
  CheckSquare,
  Edit3,
  Eye,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Printer,
  Quote,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
  reference?: string
  fontSize: number
  onFontSizeChange: (size: number) => void
  buttonClass: string
  mutedClass: string
}

function clampFontSize(value: number) {
  return Math.min(22, Math.max(16, value))
}

function inlineNodes(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
    .filter((part) => part.length > 0)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>
      return <span key={key}>{part}</span>
    })
}

export default function NotesEditingToolbar({
  textareaRef,
  value,
  onChange,
  reference = '',
  fontSize,
  onFontSizeChange,
  buttonClass,
  mutedClass,
}: Props) {
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    const area = textareaRef.current
    if (!area) return
    area.style.display = previewMode ? 'none' : ''
    return () => { area.style.display = '' }
  }, [previewMode, textareaRef])

  const applySelection = (transform: (selected: string) => string, fallback = '') => {
    const area = textareaRef.current
    if (!area || previewMode) return
    const start = area.selectionStart
    const end = area.selectionEnd
    const selected = value.slice(start, end)
    const replacement = transform(selected || fallback)
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`)
    requestAnimationFrame(() => {
      area.focus()
      area.setSelectionRange(start + replacement.length, start + replacement.length)
    })
  }

  const prefixLines = (prefix: (index: number) => string) => {
    applySelection((selected) => selected
      .split('\n')
      .map((line, index) => `${prefix(index)}${line}`)
      .join('\n'), '')
  }

  const toggleTask = (lineIndex: number) => {
    const lines = value.split('\n')
    const line = lines[lineIndex] ?? ''
    if (line.trimStart().startsWith('☐ ')) lines[lineIndex] = line.replace('☐ ', '☑ ')
    else if (line.trimStart().startsWith('☑ ')) lines[lineIndex] = line.replace('☑ ', '☐ ')
    else return
    onChange(lines.join('\n'))
  }

  const preview = useMemo(() => value.split('\n').map((line, index) => {
    const trimmed = line.trim()
    const key = `line-${index}`
    if (!trimmed) return <div key={key} className="h-3" aria-hidden="true" />
    if (/^─{4,}$/.test(trimmed)) return <hr key={key} className="my-4 border-current/15" />
    if (trimmed.startsWith('## ')) return <h3 key={key} className="mt-5 text-[1.25em] font-extrabold leading-tight first:mt-0">{inlineNodes(trimmed.slice(3), key)}</h3>
    if (trimmed.startsWith('• ')) return <div key={key} className="flex gap-3"><span className="mt-[0.1em] font-black" aria-hidden="true">•</span><p className="min-w-0 flex-1">{inlineNodes(trimmed.slice(2), key)}</p></div>
    const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numbered) return <div key={key} className="flex gap-3"><span className="min-w-6 font-bold">{numbered[1]}.</span><p className="min-w-0 flex-1">{inlineNodes(numbered[2], key)}</p></div>
    if (trimmed.startsWith('☐ ') || trimmed.startsWith('☑ ')) {
      const checked = trimmed.startsWith('☑ ')
      return (
        <button key={key} type="button" onClick={() => toggleTask(index)} className="flex w-full items-start gap-3 rounded-xl px-1 py-1.5 text-left" aria-pressed={checked}>
          <span className={`mt-[0.05em] grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[12px] font-black ${checked ? 'border-violet-500 bg-violet-500 text-white' : 'border-current/30'}`} aria-hidden="true">{checked ? '✓' : ''}</span>
          <span className={`min-w-0 flex-1 ${checked ? 'line-through opacity-55' : ''}`}>{inlineNodes(trimmed.slice(2), key)}</span>
        </button>
      )
    }
    if (trimmed.startsWith('> ')) return <blockquote key={key} className="my-2 border-l-4 border-violet-400/60 pl-4 italic opacity-85">{inlineNodes(trimmed.slice(2), key)}</blockquote>
    return <p key={key}>{inlineNodes(line, key)}</p>
  }), [value])

  const toolButton = (label: string, Icon: typeof Bold, action: () => void) => (
    <button type="button" onClick={action} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-label={label} title={label}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )

  const togglePreview = () => {
    setPreviewMode((current) => {
      const next = !current
      if (!next) requestAnimationFrame(() => textareaRef.current?.focus())
      return next
    })
  }

  return (
    <section aria-label="Herramientas de edición" className="mt-2 space-y-4">
      {!previewMode && <>
        <div>
          <p className={`mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedClass}`}>Texto</p>
          <div className="grid grid-cols-3 gap-2">
            {toolButton('Título', Heading2, () => prefixLines(() => '## '))}
            {toolButton('Negrita', Bold, () => applySelection((text) => `**${text}**`, 'texto'))}
            {toolButton('Cursiva', Italic, () => applySelection((text) => `*${text}*`, 'texto'))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {toolButton('Texto −', ZoomOut, () => onFontSizeChange(clampFontSize(fontSize - 1)))}
            {toolButton('Texto +', ZoomIn, () => onFontSizeChange(clampFontSize(fontSize + 1)))}
          </div>
          <p className={`mt-1 px-1 text-right text-[10px] ${mutedClass}`}>{fontSize}px</p>
        </div>

        <div>
          <p className={`mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedClass}`}>Listas</p>
          <div className="grid grid-cols-3 gap-2">
            {toolButton('Viñetas', List, () => prefixLines(() => '• '))}
            {toolButton('Numerada', ListOrdered, () => prefixLines((index) => `${index + 1}. `))}
            {toolButton('Tareas', CheckSquare, () => prefixLines(() => '☐ '))}
          </div>
          <p className={`mt-2 px-1 text-[11px] leading-4 ${mutedClass}`}>Las tareas se convierten en checklist interactivo en Vista de lectura.</p>
        </div>

        <div>
          <p className={`mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedClass}`}>Insertar</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {toolButton('Cita', Quote, () => prefixLines(() => '> '))}
            {toolButton('Separador', Minus, () => applySelection(() => '\n\n──────────\n\n'))}
            {toolButton('Fecha', CalendarDays, () => applySelection(() => `${new Date().toLocaleString('es-SV')} — `))}
            {toolButton('Referencia', BookMarked, () => applySelection(() => reference ? `${reference} — ` : 'Referencia — '))}
          </div>
        </div>
      </>}

      <div>
        <p className={`mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedClass}`}>Vista y salida</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={togglePreview} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-pressed={previewMode} aria-label={previewMode ? 'Seguir editando' : 'Vista de lectura'}>{previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{previewMode ? 'Editar' : 'Vista de lectura'}</button>
          <button type="button" onClick={() => window.print()} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-label="Imprimir o guardar PDF"><Printer className="h-4 w-4" /> Imprimir / PDF</button>
        </div>
      </div>

      {previewMode && (
        <article className="min-h-52 rounded-2xl bg-current/[0.025] px-1 py-3 sm:px-2" aria-label="Vista de lectura de la nota" style={{ fontSize, lineHeight: 1.8 }}>
          {value.trim() ? <div className="space-y-1">{preview}</div> : <p className={mutedClass}>La nota está vacía. Toca Editar para comenzar a escribir.</p>}
        </article>
      )}
    </section>
  )
}
