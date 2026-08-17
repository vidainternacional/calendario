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
  Loader2,
  Minus,
  Printer,
  Quote,
  Sparkles,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { organizarApuntesConIA } from '@/app/actions/cuaderno-ai'

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
type AiMode = 'ideas' | 'estudio' | 'predicacion'

type HistoryState = {
  past: string[]
  current: string
  lastAt: number
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
  const [aiMode, setAiMode] = useState<AiMode>('ideas')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProposal, setAiProposal] = useState<string | null>(null)
  const [aiSource, setAiSource] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiReused, setAiReused] = useState(false)
  const historyRef = useRef<HistoryState>({ past: [], current: value, lastAt: 0 })

  useEffect(() => {
    const area = textareaRef.current
    if (!area) return
    area.style.display = previewMode ? 'none' : ''
    return () => { area.style.display = '' }
  }, [previewMode, textareaRef])

  useEffect(() => {
    const history = historyRef.current
    if (value === history.current) return

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
    if (history.past[history.past.length - 1] !== value) {
      history.past.push(value)
      if (history.past.length > 50) history.past.shift()
    }
    history.current = next
    history.lastAt = Date.now()
    setCanUndo(true)
    onChange(next)
  }

  const undo = () => {
    const history = historyRef.current
    const previous = history.past.pop()
    if (previous === undefined) return

    history.current = previous
    history.lastAt = Date.now()
    setCanUndo(history.past.length > 0)
    setPreviewMode(false)
    setAiProposal(null)
    setAiError(null)
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

  const requestAiOrganization = async (regenerar = false) => {
    if (aiLoading || !value.trim()) return
    const source = value
    setAiLoading(true)
    setAiError(null)
    setAiReused(false)

    try {
      const result = await organizarApuntesConIA({
        contenido: source,
        referencia: reference,
        modo: aiMode,
        regenerar,
      })

      if (!result.success) {
        setAiProposal(null)
        setAiError(result.error)
        return
      }

      setAiSource(source)
      setAiProposal(result.propuesta)
      setAiReused(result.reutilizada)
    } catch {
      setAiProposal(null)
      setAiError('No se pudo conectar con la asistencia de IA. Tus apuntes no cambiaron.')
    } finally {
      setAiLoading(false)
    }
  }

  const applyAiProposal = () => {
    if (!aiProposal) return
    if (value !== aiSource) {
      setAiProposal(null)
      setAiError('Tus apuntes cambiaron después de generar la propuesta. Genera una nueva para evitar sobrescribir cambios recientes.')
      return
    }
    commitChange(aiProposal)
    setAiProposal(null)
    setAiSource('')
    setAiError(null)
    setActiveGroup('texto')
    setPreviewMode(false)
    requestAnimationFrame(() => textareaRef.current?.focus())
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

  const aiModes: Array<{ id: AiMode; label: string }> = [
    { id: 'ideas', label: 'Ideas sueltas' },
    { id: 'estudio', label: 'Estudio' },
    { id: 'predicacion', label: 'Predicación' },
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
                  <p className={`mt-1 text-[10px] leading-4 ${mutedClass}`}>Usa IA solo cuando la necesites. Trabaja únicamente con esta nota y primero te muestra una propuesta.</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Tipo de organización con IA">
                {aiModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => { setAiMode(mode.id); setAiError(null) }}
                    aria-pressed={aiMode === mode.id}
                    className={`rounded-full border px-2 py-2 text-center text-[9px] font-bold transition ${aiMode === mode.id ? 'border-violet-500/35 bg-violet-600 text-white' : `border-current/10 ${buttonClass}`}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {!aiProposal && (
                <button
                  type="button"
                  onClick={() => void requestAiOrganization(false)}
                  disabled={aiLoading || !value.trim()}
                  className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-xs font-extrabold text-white transition active:scale-[0.99] disabled:cursor-default disabled:opacity-45"
                  aria-label="Organizar mis apuntes con IA"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                  {aiLoading ? 'Preparando propuesta…' : 'Organizar mis apuntes'}
                </button>
              )}

              {aiError && <p className="mt-2 rounded-2xl bg-rose-500/10 px-3 py-2 text-[10px] leading-4 text-rose-700" role="status">{aiError}</p>}

              {aiProposal && (
                <div className="mt-3" aria-live="polite">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <p className="text-[10px] font-extrabold">Propuesta</p>
                    {aiReused && <span className={`text-[9px] ${mutedClass}`}>Reutilizada para ahorrar tokens</span>}
                  </div>
                  <div className="mt-1.5 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-current/10 bg-current/[0.025] px-3 py-3 text-[11px] leading-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {aiProposal}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={applyAiProposal} className="min-h-11 rounded-2xl bg-violet-600 px-3 text-[11px] font-extrabold text-white">Aplicar propuesta</button>
                    <button type="button" onClick={() => { setAiProposal(null); setAiSource(''); setAiError(null) }} className={`min-h-11 rounded-2xl px-3 text-[11px] font-bold ${buttonClass}`}>Descartar</button>
                  </div>
                  <button type="button" onClick={() => void requestAiOrganization(true)} disabled={aiLoading} className={`mt-1.5 min-h-10 w-full rounded-2xl px-3 text-[10px] font-bold disabled:opacity-45 ${buttonClass}`}>
                    {aiLoading ? 'Generando…' : 'Volver a generar'}
                  </button>
                </div>
              )}

              <p className={`mt-2 px-1 text-center text-[9px] leading-4 ${mutedClass}`}>Nada reemplaza tus apuntes hasta que toques Aplicar. Después puedes usar Deshacer.</p>
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
