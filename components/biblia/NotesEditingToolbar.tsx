'use client'

import { useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Bold,
  BookMarked,
  CalendarDays,
  CheckSquare,
  Edit3,
  Eye,
  Heading2,
  Italic,
  LayoutList,
  Lightbulb,
  List,
  ListOrdered,
  ListTree,
  Minus,
  Printer,
  Quote,
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

  const insertarPlantilla = (plantilla: string) => {
    const base = value.trimEnd()
    const siguiente = base ? `${base}\n\n${plantilla}` : plantilla
    onChange(siguiente)
    setPreviewMode(false)
    requestAnimationFrame(() => {
      const area = textareaRef.current
      if (!area) return
      area.focus()
      area.setSelectionRange(siguiente.length, siguiente.length)
    })
  }

  const convertirEnLluvia = () => {
    const siguiente = value
      .split('\n')
      .map((line) => {
        const trimmed = line.trim()
        if (!trimmed) return ''
        if (/^(## |• |\d+\. |☐ |☑ |> |─{4,})/.test(trimmed)) return line
        return `• ${trimmed}`
      })
      .join('\n')
    onChange(siguiente)
  }

  const bloquesOrganizables = useMemo(() => value
    .trim()
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean), [value])

  const moverBloque = (index: number, direction: -1 | 1) => {
    const destino = index + direction
    if (destino < 0 || destino >= bloquesOrganizables.length) return
    const siguiente = [...bloquesOrganizables]
    const [bloque] = siguiente.splice(index, 1)
    siguiente.splice(destino, 0, bloque)
    onChange(siguiente.join('\n\n'))
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
    { id: 'organizar', label: 'Organizar' },
    { id: 'insertar', label: 'Insertar' },
    { id: 'vista', label: 'Vista' },
  ]

  return (
    <section aria-label="Herramientas de edición" className="mt-2">
      <div className="rounded-[22px] border border-current/10 bg-current/[0.025] p-1.5 backdrop-blur-xl">
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
            <div>
              <div className="flex items-start gap-2 rounded-2xl bg-violet-500/[0.08] px-3 py-2.5">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden="true" />
                <p className="text-[10px] leading-4"><span className="font-extrabold">Sin IA y sin internet.</span> Ordena lo que ya escribiste o agrega una estructura para seguir desarrollando tus ideas.</p>
              </div>

              <p className={`mb-1.5 mt-3 px-1 text-[9px] font-extrabold uppercase tracking-[0.12em] ${mutedClass}`}>Dar estructura</p>
              <div className="grid grid-cols-2 gap-1.5">
                {toolButton('Convertir líneas en lluvia de ideas', Lightbulb, convertirEnLluvia, 'Lluvia de ideas')}
                {toolButton('Agregar estructura de bosquejo', ListTree, () => insertarPlantilla('## Tema\n\n## Introducción\n\n## Punto 1\n\n## Punto 2\n\n## Punto 3\n\n## Aplicación\n\n## Conclusión'), 'Bosquejo')}
                {toolButton('Agregar estructura de estudio bíblico', BookMarked, () => insertarPlantilla('## Texto base\n\n## Observaciones\n\n## Contexto\n\n## Interpretación\n\n## Aplicación\n\n## Preguntas'), 'Estudio bíblico')}
                {toolButton('Agregar estructura de predicación', LayoutList, () => insertarPlantilla('## Título\n\n## Texto base\n\n## Idea central\n\n## Introducción\n\n## Desarrollo\n\n## Aplicación\n\n## Cierre'), 'Predicación')}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <p className={`text-[9px] font-extrabold uppercase tracking-[0.12em] ${mutedClass}`}>Orden manual</p>
                <span className={`text-[9px] ${mutedClass}`}>{bloquesOrganizables.length} {bloquesOrganizables.length === 1 ? 'bloque' : 'bloques'}</span>
              </div>

              {bloquesOrganizables.length > 1 ? (
                <div className="mt-1.5 max-h-56 space-y-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {bloquesOrganizables.map((block, index) => (
                    <div key={`${index}-${block.slice(0, 18)}`} className="flex items-center gap-2 rounded-2xl border border-current/10 bg-current/[0.025] px-2.5 py-2">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-extrabold ${buttonClass}`}>{index + 1}</span>
                      <p className="min-w-0 flex-1 truncate text-[10px] font-semibold">{block.replace(/^##\s*/, '').replace(/^[•☐☑>]\s*/, '')}</p>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => moverBloque(index, -1)} disabled={index === 0} className={`grid h-8 w-8 place-items-center rounded-full transition active:scale-95 disabled:opacity-25 ${buttonClass}`} aria-label={`Mover bloque ${index + 1} arriba`}><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => moverBloque(index, 1)} disabled={index === bloquesOrganizables.length - 1} className={`grid h-8 w-8 place-items-center rounded-full transition active:scale-95 disabled:opacity-25 ${buttonClass}`} aria-label={`Mover bloque ${index + 1} abajo`}><ArrowDown className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`mt-1.5 rounded-2xl border border-dashed border-current/15 px-3 py-2.5 text-[10px] leading-4 ${mutedClass}`}>Separa tus ideas con una línea en blanco y aquí podrás mover cada bloque arriba o abajo.</p>
              )}
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
        <span>{activeGroup === 'texto' ? 'Formato y tamaño' : activeGroup === 'listas' ? 'Estructura' : activeGroup === 'organizar' ? 'Ideas y bosquejos' : activeGroup === 'insertar' ? 'Elementos' : 'Lectura y salida'}</span>
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
