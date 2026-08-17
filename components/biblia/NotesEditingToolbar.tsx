'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
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
  Sparkles,
  Undo2,
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

type ToolGroup = 'texto' | 'listas' | 'organizar' | 'insertar' | 'vista'

type HistoryState = {
  past: string[]
  current: string
  lastAt: number
  suppressNext: boolean
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
  const [activeGroup, setActiveGroup] = useState<ToolGroup>('texto')
  const [canUndo, setCanUndo] = useState(false)
  const historyRef = useRef<HistoryState>({ past: [], current: value, lastAt: 0, suppressNext: false })

  useEffect(() => {
    const area = textareaRef.current
    if (!area) return
    area.style.display = previewMode ? 'none' : ''
    return () => { area.style.display = '' }
  }, [previewMode, textareaRef])

  useEffect(() => {
    const history = historyRef.current
    if (value === history.current) return

    if (history.suppressNext) {
      history.suppressNext = false
      history.current = value
      history.lastAt = Date.now()
      setCanUndo(history.past.length > 0)
      return
    }

    const previous = history.current
    const now = Date.now()
    const newBurst = history.past.length === 0 || now - history.lastAt > 800 || Math.abs(value.length - previous.length) > 2

    if (newBurst && history.past[history.past.length - 1] !== previous) {
      history.past.push(previous)
      if (history.past.length > 50) history.past.shift()
    }

    history.current = value
    history.lastAt = now
    setCanUndo(history.past.length > 0)
  }, [value])

  const commitChange = (next: string) => {
    if (next === value) return
    const history = historyRef.current
    history.current = value
    if (history.past[history.past.length - 1] !== value) {
      history.past.push(value)
      if (history.past.length > 50) history.past.shift()
    }
    history.current = next
    history.lastAt = Date.now()
    history.suppressNext = true
    setCanUndo(true)
    onChange(next)
  }

  const undo = () => {
    const history = historyRef.current
    const previous = history.past.pop()
    if (previous === undefined) return

    history.current = previous
    history.lastAt = Date.now()
    history.suppressNext = true
    setCanUndo(history.past.length > 0)
    setPreviewMode(false)
    onChange(previous)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const applySelection = (transform: (selected: string) => string, fallback = '') => {
    const area = textareaRef.current
    if (!area || previewMode) return
    const start = area.selectionStart
    const end = area.selectionEnd
    const selected = value.slice(start, end)
    const replacement = transform(selected || fallback)
    commitChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`)
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
    commitChange(lines.join('\n'))
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

  const toolButton = (label: string, Icon: typeof Bold, action: () => void, compactLabel?: string) => (
    <button
      type="button"
      onClick={action}
      className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[10px] font-bold transition active:scale-[0.97] ${buttonClass}`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="max-w-full truncate">{compactLabel ?? label}</span>
    </button>
  )

  const togglePreview = () => {
    setPreviewMode((current) => {
      const next = !current
      if (!next) requestAnimationFrame(() => textareaRef.current?.focus())
      return next
    })
  }

  const selectGroup = (group: ToolGroup) => {
    if (group !== 'vista' && previewMode) {
      setPreviewMode(false)
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
    setActiveGroup(group)
  }

  const groups: Array<{ id: ToolGroup; label: string }> = [
    { id: 'texto', label: 'Texto' },
    { id: 'listas', label: 'Listas' },
    { id: 'organizar', label: 'IA' },
    { id: 'insertar', label: 'Insertar' },
    { id: 'vista', label: 'Vista' },
  ]

  return (
    <section aria-label="Herramientas de edición" className="mt-2">
      <div className="rounded-[22px] border border-current/10 bg-current/[0.025] p-1.5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-1 pb-1.5">
          <span className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedClass}`}>Edición</span>
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition active:scale-[0.97] disabled:cursor-default disabled:opacity-35 ${buttonClass}`}
            aria-label="Deshacer último cambio"
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Deshacer
          </button>
        </div>

        <div role="tablist" aria-label="Categorías de herramientas" className="grid grid-cols-5 gap-1">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={activeGroup === group.id}
              onClick={() => selectGroup(group.id)}
              className={`min-h-9 min-w-0 rounded-[15px] px-1 text-[10px] font-extrabold transition ${activeGroup === group.id ? 'bg-violet-600 text-white shadow-sm' : mutedClass}`}
            >
              <span className="block truncate">{group.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-1.5 rounded-[18px] p-1.5">
          {activeGroup === 'texto' && (
            <div className="grid grid-cols-5 gap-1.5">
              {toolButton('Título', Heading2, () => prefixLines(() => '## '), 'Título')}
              {toolButton('Negrita', Bold, () => applySelection((text) => `**${text}**`, 'texto'), 'Negrita')}
              {toolButton('Cursiva', Italic, () => applySelection((text) => `*${text}*`, 'texto'), 'Cursiva')}
              {toolButton('Reducir tamaño del texto', ZoomOut, () => onFontSizeChange(clampFontSize(fontSize - 1)), 'A−')}
              {toolButton('Aumentar tamaño del texto', ZoomIn, () => onFontSizeChange(clampFontSize(fontSize + 1)), 'A+')}
            </div>
          )}

          {activeGroup === 'listas' && (
            <div>
              <div className="grid grid-cols-3 gap-1.5">
                {toolButton('Viñetas', List, () => prefixLines(() => '• '))}
                {toolButton('Numerada', ListOrdered, () => prefixLines((index) => `${index + 1}. `))}
                {toolButton('Tareas', CheckSquare, () => prefixLines(() => '☐ '))}
              </div>
              <p className={`mt-2 px-1 text-[10px] leading-4 ${mutedClass}`}>Las tareas se pueden marcar y desmarcar en Vista de lectura.</p>
            </div>
          )}

          {activeGroup === 'organizar' && (
            <div className="rounded-[20px] border border-violet-400/20 bg-violet-500/[0.07] p-3">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 text-white shadow-sm">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">Organizar con IA</p>
                  <p className={`mt-1 text-[10px] leading-4 ${mutedClass}`}>La IA tomará tus propios apuntes y propondrá una estructura más clara sin imponerte un bosquejo fijo.</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Usos previstos de organización con IA">
                {['Ideas sueltas', 'Estudio', 'Predicación'].map((label) => <span key={label} className={`rounded-full border border-current/10 px-2 py-2 text-center text-[9px] font-bold ${buttonClass}`}>{label}</span>)}
              </div>

              <button type="button" disabled className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-xs font-extrabold text-white opacity-65" aria-label="Organizar con IA, pendiente de conexión">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Organizar mis apuntes
              </button>
              <p className={`mt-2 px-1 text-center text-[9px] leading-4 ${mutedClass}`}>Primero te mostrará una propuesta. Nada reemplazará tu nota sin tu aprobación.</p>
            </div>
          )}

          {activeGroup === 'insertar' && (
            <div className="grid grid-cols-4 gap-1.5">
              {toolButton('Cita', Quote, () => prefixLines(() => '> '))}
              {toolButton('Separador', Minus, () => applySelection(() => '\n\n──────────\n\n'))}
              {toolButton('Fecha', CalendarDays, () => applySelection(() => `${new Date().toLocaleString('es-SV')} — `))}
              {toolButton('Referencia', BookMarked, () => applySelection(() => reference ? `${reference} — ` : 'Referencia — '))}
            </div>
          )}

          {activeGroup === 'vista' && (
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" onClick={togglePreview} className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-bold transition active:scale-[0.98] ${buttonClass}`} aria-pressed={previewMode} aria-label={previewMode ? 'Seguir editando' : 'Vista de lectura'}>{previewMode ? <Edit3 className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}{previewMode ? 'Editar' : 'Vista de lectura'}</button>
              <button type="button" onClick={() => window.print()} className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-bold transition active:scale-[0.98] ${buttonClass}`} aria-label="Imprimir o guardar PDF"><Printer className="h-[18px] w-[18px]" /> Imprimir / PDF</button>
            </div>
          )}
        </div>
      </div>

      <div className={`mt-1.5 flex items-center justify-between px-2 text-[10px] ${mutedClass}`}>
        <span>{activeGroup === 'texto' ? 'Formato y tamaño' : activeGroup === 'listas' ? 'Estructura' : activeGroup === 'organizar' ? 'Asistencia inteligente' : activeGroup === 'insertar' ? 'Elementos' : 'Lectura y salida'}</span>
        <span className="font-bold">{fontSize}px</span>
      </div>

      {previewMode && (
        <article className="mt-3 min-h-52 rounded-[22px] border border-current/10 bg-current/[0.025] px-4 py-4 backdrop-blur-xl sm:px-5" aria-label="Vista de lectura de la nota" style={{ fontSize, lineHeight: 1.8 }}>
          {value.trim() ? <div className="space-y-1">{preview}</div> : <p className={mutedClass}>La nota está vacía. Toca Editar para comenzar a escribir.</p>}
        </article>
      )}
    </section>
  )
}
