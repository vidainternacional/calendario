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
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={key}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={key}>{part.slice(1, -1)}</em>
      }
      return <span key={key}>{part}</span>
    })
}

function previewLine(line: string, index: number): ReactNode {
  const trimmed = line.trim()
  const key = `line-${index}`

  if (!trimmed) return <div key={key} className="h-3" aria-hidden="true" />
  if (/^─{4,}$/.test(trimmed)) return <hr key={key} className="my-4 border-current/15" />
  if (trimmed.startsWith('## ')) {
    return <h3 key={key} className="mt-5 text-[1.25em] font-extrabold leading-tight first:mt-0">{inlineNodes(trimmed.slice(3), key)}</h3>
  }
  if (trimmed.startsWith('• ')) {
    return <div key={key} className="flex gap-3"><span className="mt-[0.1em] font-black" aria-hidden="true">•</span><p className="min-w-0 flex-1">{inlineNodes(trimmed.slice(2), key)}</p></div>
  }
  const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/)
  if (numbered) {
    return <div key={key} className="flex gap-3"><span className="min-w-6 font-bold">{numbered[1]}.</span><p className="min-w-0 flex-1">{inlineNodes(numbered[2], key)}</p></div>
  }
  if (trimmed.startsWith('☐ ')) {
    return <div key={key} className="flex gap-3"><span className="mt-[0.1em]" aria-hidden="true">☐</span><p className="min-w-0 flex-1">{inlineNodes(trimmed.slice(2), key)}</p></div>
  }
  if (trimmed.startsWith('> ')) {
    return <blockquote key={key} className="my-2 border-l-4 border-violet-400/60 pl-4 italic opacity-85">{inlineNodes(trimmed.slice(2), key)}</blockquote>
  }
  return <p key={key}>{inlineNodes(line, key)}</p>
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
  const preview = useMemo(() => value.split('\n').map(previewLine), [value])

  useEffect(() => {
    const area = textareaRef.current
    if (!area) return
    area.style.display = previewMode ? 'none' : ''
    return () => {
      area.style.display = ''
    }
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

  const togglePreview = () => {
    setPreviewMode((current) => {
      const next = !current
      if (!next) requestAnimationFrame(() => textareaRef.current?.focus())
      return next
    })
  }

  return (
    <section aria-label="Herramientas de edición" className="mt-4 space-y-3">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-bold">Herramientas de edición</span>
          </div>
          <p className={`mt-1 text-xs leading-5 ${mutedClass}`}>Selecciona texto y toca una herramienta. Usa Vista de lectura para comprobar cómo quedará.</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${mutedClass}`}>{fontSize}px</span>
      </div>

      {!previewMode && (
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-current/10 p-2 sm:grid-cols-5">
          {tools.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold ${buttonClass}`}
              aria-label={label}
              title={label}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" onClick={() => onFontSizeChange(clampFontSize(fontSize - 1))} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-label="Reducir tamaño del texto"><ZoomOut className="h-4 w-4" /> Texto −</button>
        <button type="button" onClick={() => onFontSizeChange(clampFontSize(fontSize + 1))} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-label="Aumentar tamaño del texto"><ZoomIn className="h-4 w-4" /> Texto +</button>
        <button type="button" onClick={togglePreview} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-pressed={previewMode} aria-label={previewMode ? 'Seguir editando' : 'Vista de lectura'}>{previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{previewMode ? 'Editar' : 'Vista de lectura'}</button>
        <button type="button" onClick={() => window.print()} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold ${buttonClass}`} aria-label="Imprimir o guardar PDF"><Printer className="h-4 w-4" /> Imprimir / PDF</button>
      </div>

      {previewMode && (
        <article className="min-h-52 rounded-2xl border border-current/10 bg-current/[0.025] p-4 sm:p-5" aria-label="Vista de lectura de la nota" style={{ fontSize, lineHeight: 1.8 }}>
          {value.trim() ? <div className="space-y-1">{preview}</div> : <p className={mutedClass}>La nota está vacía. Toca Editar para comenzar a escribir.</p>}
        </article>
      )}
    </section>
  )
}
