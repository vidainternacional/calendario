'use client'

import type { RefObject } from 'react'
import {
  Bold,
  BookMarked,
  CalendarDays,
  CheckSquare,
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
  const applySelection = (transform: (selected: string) => string, fallback = '') => {
    const area = textareaRef.current
    if (!area) return
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

  const tools = [
    { label: 'Título', icon: Heading2, action: () => prefixLines(() => '## ') },
    { label: 'Negrita', icon: Bold, action: () => applySelection((text) => `**${text}**`, 'texto') },
    { label: 'Cursiva', icon: Italic, action: () => applySelection((text) => `*${text}*`, 'texto') },
    { label: 'Lista', icon: List, action: () => prefixLines(() => '• ') },
    { label: 'Numerada', icon: ListOrdered, action: () => prefixLines((index) => `${index + 1}. `) },
    { label: 'Tareas', icon: CheckSquare, action: () => prefixLines(() => '☐ ') },
    { label: 'Cita', icon: Quote, action: () => prefixLines(() => '> ') },
    { label: 'Separador', icon: Minus, action: () => applySelection(() => '\n\n──────────\n\n') },
    { label: 'Fecha', icon: CalendarDays, action: () => applySelection(() => `${new Date().toLocaleString('es-SV')} — `) },
    { label: 'Referencia', icon: BookMarked, action: () => applySelection(() => reference ? `${reference} — ` : 'Referencia — ') },
  ]

  return (
    <section aria-label="Herramientas de edición" className="mt-4 space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-bold">Herramientas de edición</span>
        </div>
        <span className={`text-[11px] ${mutedClass}`}>Texto {fontSize}px</span>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-current/10 p-2 pb-2.5">
        {tools.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={`flex min-h-12 min-w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-bold ${buttonClass}`}
            aria-label={label}
            title={label}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <button type="button" onClick={() => onFontSizeChange(clampFontSize(fontSize - 1))} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-label="Reducir tamaño del texto"><ZoomOut className="h-4 w-4" /> Texto</button>
        <button type="button" onClick={() => onFontSizeChange(clampFontSize(fontSize + 1))} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-label="Aumentar tamaño del texto"><ZoomIn className="h-4 w-4" /> Texto</button>
        <button type="button" onClick={() => window.print()} className={`ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-label="Imprimir o guardar PDF"><Printer className="h-4 w-4" /> Imprimir / PDF</button>
      </div>
    </section>
  )
}
