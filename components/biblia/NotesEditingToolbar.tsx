'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react'
import {
  Bold,
  BookMarked,
  CalendarClock,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Eye,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Printer,
  Quote,
  Send,
  Sparkles,
  Strikethrough,
  Underline,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { organizarApuntesConIA } from '@/app/actions/cuaderno-ai'

export type RichNoteChangeOptions = {
  checkpoint?: boolean
}

type Props = {
  editorRef: RefObject<HTMLDivElement | null>
  value: string
  onChange: (value: string, options?: RichNoteChangeOptions) => void
  reference?: string
  fontSize: number
  onFontSizeChange: (size: number) => void
  buttonClass: string
  mutedClass: string
  readOnly: boolean
  onReadOnlyChange: (value: boolean) => void
}

type EditorProps = {
  editorRef: RefObject<HTMLDivElement | null>
  value: string
  onChange: (value: string, options?: RichNoteChangeOptions) => void
  fontSize: number
  readOnly?: boolean
  mutedClass: string
}

type ToolGroup = 'texto' | 'listas' | 'insertar' | 'vista'
type BlockStyle = 'h1' | 'h2' | 'h3' | 'p' | 'pre'
type StandardListKind = 'bullet' | 'dash' | 'numbered'

type FormatState = {
  block: BlockStyle
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  bullet: boolean
  dash: boolean
  numbered: boolean
}

const defaultFormatState: FormatState = {
  block: 'p',
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  bullet: false,
  dash: false,
  numbered: false,
}

function clampFontSize(value: number) {
  return Math.min(22, Math.max(16, value))
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function inlineToHtml(value: string) {
  let html = escapeHtml(value)
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\+\+([^+\n]+)\+\+/g, '<u>$1</u>')
  html = html.replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  return html
}

function referenceHtml(text: string) {
  return `<p data-note-reference="true"><span data-note-reference-text="true">${inlineToHtml(text)}</span></p>`
}

export function canonicalToRichHtml(value: string) {
  if (!value.trim()) return ''

  const lines = value.replace(/\r\n?/g, '\n').split('\n')
  const blocks: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index] ?? ''

    if (!line) {
      blocks.push('<p><br></p>')
      index += 1
      continue
    }

    if (/^─{4,}$/.test(line.trim())) {
      blocks.push('<hr>')
      index += 1
      continue
    }

    if (line.startsWith('# ')) {
      blocks.push(`<h1>${inlineToHtml(line.slice(2))}</h1>`)
      index += 1
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push(`<h2>${inlineToHtml(line.slice(3))}</h2>`)
      index += 1
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push(`<h3>${inlineToHtml(line.slice(4))}</h3>`)
      index += 1
      continue
    }
    if (line.startsWith('≋ ')) {
      blocks.push(`<pre>${inlineToHtml(line.slice(2))}</pre>`)
      index += 1
      continue
    }
    if (line.startsWith('> ')) {
      blocks.push(`<blockquote>${inlineToHtml(line.slice(2))}</blockquote>`)
      index += 1
      continue
    }
    if (line.startsWith('◈ ')) {
      blocks.push(referenceHtml(line.slice(2)))
      index += 1
      continue
    }

    if (/^[☐☑]\s/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[☐☑]\s/.test(lines[index] ?? '')) {
        const task = lines[index] ?? ''
        const checked = task.startsWith('☑ ')
        items.push(`<li data-task-item="true"><input type="checkbox" data-task-checkbox="true" contenteditable="false"${checked ? ' checked' : ''}><span data-task-text="true">${inlineToHtml(task.slice(2)) || '<br>'}</span></li>`)
        index += 1
      }
      blocks.push(`<ul data-task-list="true">${items.join('')}</ul>`)
      continue
    }

    if (line.startsWith('• ')) {
      const items: string[] = []
      while (index < lines.length && (lines[index] ?? '').startsWith('• ')) {
        items.push(`<li>${inlineToHtml((lines[index] ?? '').slice(2)) || '<br>'}</li>`)
        index += 1
      }
      blocks.push(`<ul data-note-list-style="bullet">${items.join('')}</ul>`)
      continue
    }

    if (/^[-–]\s/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-–]\s/.test(lines[index] ?? '')) {
        items.push(`<li>${inlineToHtml((lines[index] ?? '').replace(/^[-–]\s/, '')) || '<br>'}</li>`)
        index += 1
      }
      blocks.push(`<ul data-note-list-style="dash">${items.join('')}</ul>`)
      continue
    }

    const numbered = line.match(/^(\d+)\.\s+(.*)$/)
    if (numbered) {
      const start = Number(numbered[1]) || 1
      const items: string[] = []
      while (index < lines.length) {
        const match = (lines[index] ?? '').match(/^\d+\.\s+(.*)$/)
        if (!match) break
        items.push(`<li>${inlineToHtml(match[1] ?? '') || '<br>'}</li>`)
        index += 1
      }
      blocks.push(`<ol${start !== 1 ? ` start="${start}"` : ''}>${items.join('')}</ol>`)
      continue
    }

    blocks.push(`<p>${inlineToHtml(line)}</p>`)
    index += 1
  }

  return blocks.join('')
}

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const element = node as HTMLElement
  const tag = element.tagName

  if (tag === 'BR') return '\n'
  if (tag === 'INPUT') return ''
  if (element.dataset.noteReferenceIcon === 'true') return ''

  const content = Array.from(element.childNodes).map(serializeInlineNode).join('')
  if (tag === 'STRONG' || tag === 'B') return `**${content}**`
  if (tag === 'EM' || tag === 'I') return `*${content}*`
  if (tag === 'U') return `++${content}++`
  if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') return `~~${content}~~`
  return content
}

function serializeInlineChildren(element: Element) {
  return Array.from(element.childNodes).map(serializeInlineNode).join('').replace(/\n+$/g, '')
}

function serializeList(element: HTMLElement) {
  const children = Array.from(element.children).filter((child) => child.tagName === 'LI') as HTMLElement[]

  if (element.dataset.taskList === 'true') {
    return children.map((li) => {
      const checkbox = li.querySelector<HTMLInputElement>('input[data-task-checkbox="true"]')
      const text = li.querySelector<HTMLElement>('[data-task-text="true"]')
      const body = text ? serializeInlineChildren(text) : serializeInlineChildren(li)
      return `${checkbox?.checked ? '☑' : '☐'} ${body}`.trimEnd()
    }).join('\n')
  }

  if (element.tagName === 'OL') {
    const start = Number(element.getAttribute('start') || 1) || 1
    return children.map((li, offset) => `${start + offset}. ${serializeInlineChildren(li)}`.trimEnd()).join('\n')
  }

  const prefix = element.dataset.noteListStyle === 'dash' ? '– ' : '• '
  return children.map((li) => `${prefix}${serializeInlineChildren(li)}`.trimEnd()).join('\n')
}

function serializeBlockNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').trimEnd()
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const element = node as HTMLElement
  const tag = element.tagName

  if (tag === 'UL' || tag === 'OL') return serializeList(element)
  if (tag === 'HR') return '──────────'
  if (tag === 'H1') return `# ${serializeInlineChildren(element)}`.trimEnd()
  if (tag === 'H2') return `## ${serializeInlineChildren(element)}`.trimEnd()
  if (tag === 'H3') return `### ${serializeInlineChildren(element)}`.trimEnd()
  if (tag === 'PRE') return `≋ ${serializeInlineChildren(element)}`.trimEnd()
  if (tag === 'BLOCKQUOTE') return `> ${serializeInlineChildren(element)}`.trimEnd()
  if (element.dataset.noteReference === 'true') {
    const text = element.querySelector<HTMLElement>('[data-note-reference-text="true"]')
    return `◈ ${text ? serializeInlineChildren(text) : serializeInlineChildren(element)}`.trimEnd()
  }

  if (tag === 'DIV' && Array.from(element.children).some((child) => ['P', 'DIV', 'H1', 'H2', 'H3', 'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'HR'].includes(child.tagName))) {
    return Array.from(element.childNodes).map(serializeBlockNode).join('\n')
  }

  return serializeInlineChildren(element)
}

export function richElementToCanonical(root: HTMLElement) {
  return Array.from(root.childNodes)
    .map(serializeBlockNode)
    .join('\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/\n+$/g, '')
}

function normalizeAiProposal(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*[-*]\s+\[x\]\s+/gim, '☑ ')
    .replace(/^\s*[-*]\s+\[\s\]\s+/gim, '☐ ')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim()
}

export function plainTextFromCanonical(value: string) {
  return value
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^≋\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^◈\s+/gm, '')
    .replace(/^[•–-]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^[☐☑]\s+/gm, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\+\+([^+\n]+)\+\+/g, '$1')
    .replace(/~~([^~\n]+)~~/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
}

function caretOffsetWithin(element: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0
  const range = selection.getRangeAt(0)
  const prefix = range.cloneRange()
  prefix.selectNodeContents(element)
  prefix.setEnd(range.endContainer, range.endOffset)
  return prefix.toString().length
}

function placeCaret(element: HTMLElement, offset = 0) {
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let remaining = Math.max(0, offset)
  let node = walker.nextNode()

  while (node) {
    const length = node.textContent?.length ?? 0
    if (remaining <= length) {
      range.setStart(node, remaining)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      return
    }
    remaining -= length
    node = walker.nextNode()
  }

  range.selectNodeContents(element)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function closestEditorElement(editor: HTMLElement, node: Node | null) {
  const element = node?.nodeType === Node.ELEMENT_NODE ? node as Element : node?.parentElement
  return element && editor.contains(element) ? element : null
}

function topLevelEditorBlock(editor: HTMLElement, node: Node | null) {
  let element = closestEditorElement(editor, node)
  if (!element) return null
  while (element.parentElement && element.parentElement !== editor) element = element.parentElement
  return element.parentElement === editor ? element as HTMLElement : null
}

function insertStandaloneBlock(editor: HTMLElement, block: HTMLElement, focusTarget: HTMLElement) {
  const selection = window.getSelection()
  const topLevel = topLevelEditorBlock(editor, selection?.anchorNode ?? null)
  const isEmptyParagraph = topLevel?.tagName === 'P' && !(topLevel.textContent ?? '').trim() && !topLevel.querySelector('img,input,hr')

  if (topLevel && isEmptyParagraph) topLevel.replaceWith(block)
  else if (topLevel) topLevel.insertAdjacentElement('afterend', block)
  else editor.appendChild(block)

  placeCaret(focusTarget, focusTarget.textContent?.length ?? 0)
}

function createParagraphFromListItem(item: HTMLElement) {
  const paragraph = document.createElement('p')
  while (item.firstChild) paragraph.appendChild(item.firstChild)
  if (!paragraph.childNodes.length) paragraph.appendChild(document.createElement('br'))
  return paragraph
}

function unwrapList(list: HTMLElement, selectedItem: HTMLElement | null) {
  const fragment = document.createDocumentFragment()
  let focusParagraph: HTMLElement | null = null

  Array.from(list.children).forEach((child) => {
    if (!(child instanceof HTMLElement) || child.tagName !== 'LI') return
    const paragraph = createParagraphFromListItem(child)
    if (child === selectedItem) focusParagraph = paragraph
    fragment.appendChild(paragraph)
  })

  list.replaceWith(fragment)
  if (focusParagraph) placeCaret(focusParagraph, focusParagraph.textContent?.length ?? 0)
}

function convertList(list: HTMLElement, kind: StandardListKind) {
  const target = document.createElement(kind === 'numbered' ? 'ol' : 'ul')
  if (kind !== 'numbered') target.dataset.noteListStyle = kind
  while (list.firstChild) target.appendChild(list.firstChild)
  list.replaceWith(target)
  return target
}

export function RichNoteEditor({ editorRef, value, onChange, fontSize, readOnly = false, mutedClass }: EditorProps) {
  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const current = richElementToCanonical(editor)
    if (current === value) return
    editor.innerHTML = canonicalToRichHtml(value)
  }, [editorRef, value])

  const emit = (checkpoint = false) => {
    const editor = editorRef.current
    if (!editor) return
    onChange(richElementToCanonical(editor), { checkpoint })
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
    emit(true)
  }

  const handleCheckbox = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement) || target.dataset.taskCheckbox !== 'true') return
    requestAnimationFrame(() => emit(true))
  }

  const handleTaskEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || readOnly) return false
    const selection = window.getSelection()
    if (!selection?.anchorNode) return false
    const anchorElement = selection.anchorNode.nodeType === Node.ELEMENT_NODE
      ? selection.anchorNode as Element
      : selection.anchorNode.parentElement
    const item = anchorElement?.closest<HTMLElement>('li[data-task-item="true"]')
    if (!item) return false

    event.preventDefault()
    const list = item.closest<HTMLElement>('ul[data-task-list="true"]')
    const text = item.querySelector<HTMLElement>('[data-task-text="true"]')
    if (!list || !text) return true

    const current = text.textContent ?? ''
    const offset = Math.min(caretOffsetWithin(text), current.length)
    const before = current.slice(0, offset)
    const after = current.slice(offset)

    if (!current.trim()) {
      const paragraph = document.createElement('p')
      paragraph.appendChild(document.createElement('br'))
      list.insertAdjacentElement('afterend', paragraph)
      item.remove()
      if (!list.querySelector('li[data-task-item="true"]')) list.remove()
      placeCaret(paragraph)
      emit(true)
      return true
    }

    text.textContent = before
    const next = document.createElement('li')
    next.dataset.taskItem = 'true'
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.dataset.taskCheckbox = 'true'
    checkbox.contentEditable = 'false'
    const span = document.createElement('span')
    span.dataset.taskText = 'true'
    span.textContent = after
    if (!after) span.appendChild(document.createElement('br'))
    next.append(checkbox, span)
    item.insertAdjacentElement('afterend', next)
    placeCaret(span)
    emit(true)
    return true
  }

  const handleStandardListEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || readOnly) return false
    const selection = window.getSelection()
    if (!selection?.anchorNode) return false
    const anchorElement = selection.anchorNode.nodeType === Node.ELEMENT_NODE
      ? selection.anchorNode as Element
      : selection.anchorNode.parentElement
    const item = anchorElement?.closest<HTMLElement>('li')
    const list = item?.closest<HTMLElement>('ol,ul')
    if (!item || !list || list.dataset.taskList === 'true') return false

    event.preventDefault()
    const current = item.textContent ?? ''
    const offset = Math.min(caretOffsetWithin(item), current.length)
    const before = current.slice(0, offset)
    const after = current.slice(offset)

    if (!current.trim()) {
      const paragraph = document.createElement('p')
      paragraph.appendChild(document.createElement('br'))
      list.insertAdjacentElement('afterend', paragraph)
      item.remove()
      if (!list.querySelector('li')) list.remove()
      placeCaret(paragraph)
      emit(true)
      return true
    }

    item.textContent = before
    if (!before) item.appendChild(document.createElement('br'))
    const next = document.createElement('li')
    next.textContent = after
    if (!after) next.appendChild(document.createElement('br'))
    item.insertAdjacentElement('afterend', next)
    placeCaret(next, 0)
    emit(true)
    return true
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (handleTaskEnter(event)) return
    if (handleStandardListEnter(event)) return
    if (readOnly || !(event.metaKey || event.ctrlKey)) return
    const key = event.key.toLowerCase()
    const command = key === 'b' ? 'bold' : key === 'i' ? 'italic' : key === 'u' ? 'underline' : null
    if (!command) return
    event.preventDefault()
    document.execCommand(command, false)
    emit(true)
  }

  return (
    <>
      <div className="note-rich-editor-shell relative mt-3 min-h-[58vh]">
        <div className={`mb-1 flex min-h-6 items-center justify-start px-1 text-[10px] ${mutedClass}`} aria-live="polite">
          <span className="rounded-full bg-current/[0.045] px-2.5 py-1">{readOnly ? 'Solo lectura' : 'Guardado automático'}</span>
        </div>
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-readonly={readOnly}
          onInput={() => emit(false)}
          onPaste={handlePaste}
          onDrop={(event) => event.preventDefault()}
          onClick={handleCheckbox}
          onKeyDown={handleKeyDown}
          className={`note-rich-editor min-h-[58vh] px-1 py-2 outline-none ${readOnly ? 'cursor-default select-text' : ''}`}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.78 }}
        />
        {!value.trim() && <p className={`pointer-events-none absolute inset-x-1 top-9 opacity-55 ${mutedClass}`} style={{ fontSize: `${fontSize}px`, lineHeight: 1.78 }} aria-hidden="true">Empieza a escribir tus apuntes, ideas, estudio o predicación…</p>}
      </div>
      <style>{`
        .note-rich-editor-shell ~ p:last-child { display: none !important; }
        .note-rich-editor h1 { font-size: 1.62em; line-height: 1.2; font-weight: 800; letter-spacing: -0.025em; margin: .55em 0 .28em; }
        .note-rich-editor h2 { font-size: 1.28em; line-height: 1.28; font-weight: 800; letter-spacing: -0.018em; margin: .55em 0 .25em; }
        .note-rich-editor h3 { font-size: 1.08em; line-height: 1.35; font-weight: 700; opacity: .82; margin: .5em 0 .2em; }
        .note-rich-editor p { min-height: 1.25em; margin: .12em 0; }
        .note-rich-editor pre { margin: .35em 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .92em; }
        .note-rich-editor blockquote { margin: .5em 0; border-left: 3px solid rgb(167 139 250 / .8); padding-left: .8em; font-style: italic; opacity: .84; }
        .note-rich-editor hr { margin: 1em 0; border: 0; border-top: 1px solid currentColor; opacity: .14; }
        .note-rich-editor ol { display: block !important; list-style-type: decimal !important; list-style-position: outside !important; margin: .3em 0 !important; padding-inline-start: 2.15em !important; }
        .note-rich-editor ol > li { display: list-item !important; list-style-type: decimal !important; padding-inline-start: .2em; margin: .16em 0; }
        .note-rich-editor ol > li::marker { color: currentColor; font-size: 1em; font-weight: 700; font-variant-numeric: tabular-nums; }
        .note-rich-editor ul:not([data-task-list]) { display: block !important; list-style: none !important; margin: .3em 0 !important; padding-inline-start: 1.75em !important; }
        .note-rich-editor ul:not([data-task-list]) > li { display: list-item !important; position: relative; padding-inline-start: .18em; margin: .16em 0; }
        .note-rich-editor ul:not([data-task-list]):not([data-note-list-style="dash"]) > li::before { content: '•'; position: absolute; left: -1.05em; top: 50%; transform: translateY(-52%); font-size: 1.46em; line-height: 1; font-weight: 900; }
        .note-rich-editor ul[data-note-list-style="dash"] > li::before { content: '–'; position: absolute; left: -1em; top: 50%; transform: translateY(-50%); font-size: 1.12em; line-height: 1; font-weight: 800; }
        .note-rich-editor ul[data-task-list] { list-style: none; margin: .3em 0; padding: 0; }
        .note-rich-editor li[data-task-item] { display: flex; align-items: flex-start; gap: .58em; margin: .3em 0; }
        .note-rich-editor input[data-task-checkbox] { appearance: none; -webkit-appearance: none; width: 1.12em; height: 1.12em; flex: 0 0 auto; margin-top: .24em; border: 1.5px solid currentColor; border-radius: .34em; opacity: .58; display: grid; place-items: center; }
        .note-rich-editor input[data-task-checkbox]:checked { background: rgb(124 58 237); border-color: rgb(124 58 237); opacity: 1; }
        .note-rich-editor input[data-task-checkbox]:checked::after { content: '✓'; color: white; font-size: .72em; line-height: 1; font-weight: 900; }
        .note-rich-editor li[data-task-item]:has(input:checked) [data-task-text] { text-decoration: line-through; opacity: .5; }
        .note-rich-editor [data-note-reference] { display: flex; align-items: baseline; gap: .52em; clear: both; margin: .6em 0; padding: .08em 0; }
        .note-rich-editor [data-note-reference]::before { content: '◆'; color: rgb(124 58 237); flex: 0 0 auto; font-size: .82em; line-height: 1; transform: translateY(-.03em); }
        .note-rich-editor [data-note-reference-text] { min-width: 1ch; }
      `}</style>
    </>
  )
}

function listKindOf(list: HTMLElement | null): StandardListKind | null {
  if (!list || list.dataset.taskList === 'true') return null
  if (list.tagName === 'OL') return 'numbered'
  return list.dataset.noteListStyle === 'dash' ? 'dash' : 'bullet'
}

export default function NotesEditingToolbar({
  editorRef,
  value,
  onChange,
  reference = '',
  fontSize,
  onFontSizeChange,
  buttonClass,
  mutedClass,
  readOnly,
  onReadOnlyChange,
}: Props) {
  const [activeGroup, setActiveGroup] = useState<ToolGroup>('texto')
  const [formatState, setFormatState] = useState<FormatState>(defaultFormatState)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProposal, setAiProposal] = useState<string | null>(null)
  const [aiSource, setAiSource] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiReused, setAiReused] = useState(false)
  const savedRangeRef = useRef<Range | null>(null)

  const emitEditor = (checkpoint = true) => {
    const editor = editorRef.current
    if (!editor) return
    onChange(richElementToCanonical(editor), { checkpoint })
  }

  const readSelectionState = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection?.anchorNode) return
    const selected = closestEditorElement(editor, selection.anchorNode)
    if (!selected) return

    const block = selected.closest('h1,h2,h3,pre,p,div,li,blockquote')
    const list = selected.closest('ul,ol') as HTMLElement | null
    const listKind = listKindOf(list)
    setFormatState({
      block: block?.tagName === 'H1' ? 'h1' : block?.tagName === 'H2' ? 'h2' : block?.tagName === 'H3' ? 'h3' : block?.tagName === 'PRE' ? 'pre' : 'p',
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike: document.queryCommandState('strikeThrough'),
      bullet: listKind === 'bullet',
      dash: listKind === 'dash',
      numbered: listKind === 'numbered',
    })
  }

  useEffect(() => {
    const capture = () => {
      const editor = editorRef.current
      const selection = window.getSelection()
      if (!editor || !selection || selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)
      if (!editor.contains(range.commonAncestorContainer)) return
      savedRangeRef.current = range.cloneRange()
      readSelectionState()
    }
    document.addEventListener('selectionchange', capture)
    return () => document.removeEventListener('selectionchange', capture)
  })

  const restoreSelection = () => {
    const editor = editorRef.current
    if (!editor) return false
    editor.focus()
    const range = savedRangeRef.current
    if (!range) return true
    const selection = window.getSelection()
    if (!selection) return false
    try {
      selection.removeAllRanges()
      selection.addRange(range)
    } catch {}
    return true
  }

  const runCommand = (command: string, argument?: string) => {
    if (readOnly) onReadOnlyChange(false)
    requestAnimationFrame(() => {
      if (!restoreSelection()) return
      document.execCommand(command, false, argument)
      emitEditor(true)
      readSelectionState()
    })
  }

  const setBlock = (block: BlockStyle) => {
    if (readOnly) onReadOnlyChange(false)
    requestAnimationFrame(() => {
      if (!restoreSelection()) return
      const ok = document.execCommand('formatBlock', false, block)
      if (!ok) document.execCommand('formatBlock', false, `<${block}>`)
      emitEditor(true)
      readSelectionState()
    })
  }

  const toggleStandardList = (kind: StandardListKind) => {
    if (readOnly) onReadOnlyChange(false)
    requestAnimationFrame(() => {
      if (!restoreSelection()) return
      const editor = editorRef.current
      const selection = window.getSelection()
      if (!editor || !selection?.anchorNode) return

      const selected = closestEditorElement(editor, selection.anchorNode)
      const currentItem = selected?.closest<HTMLElement>('li') ?? null
      const currentList = currentItem?.closest<HTMLElement>('ol,ul') ?? null
      const currentKind = listKindOf(currentList)

      if (currentList && currentKind === kind) {
        unwrapList(currentList, currentItem)
        emitEditor(true)
        readSelectionState()
        return
      }

      if (currentList && currentKind) {
        const converted = convertList(currentList, kind)
        const itemIndex = currentItem ? Math.max(0, Array.from(converted.children).indexOf(currentItem)) : 0
        const targetItem = converted.children.item(itemIndex) as HTMLElement | null
        if (targetItem) placeCaret(targetItem, targetItem.textContent?.length ?? 0)
        emitEditor(true)
        readSelectionState()
        return
      }

      const topLevel = topLevelEditorBlock(editor, selection.anchorNode)
      const list = document.createElement(kind === 'numbered' ? 'ol' : 'ul')
      if (kind !== 'numbered') list.dataset.noteListStyle = kind
      const item = document.createElement('li')

      if (topLevel && !['UL', 'OL'].includes(topLevel.tagName)) {
        while (topLevel.firstChild) item.appendChild(topLevel.firstChild)
        if (!item.childNodes.length) item.appendChild(document.createElement('br'))
        list.appendChild(item)
        topLevel.replaceWith(list)
      } else {
        item.appendChild(document.createElement('br'))
        list.appendChild(item)
        editor.appendChild(list)
      }

      placeCaret(item, item.textContent?.length ?? 0)
      emitEditor(true)
      readSelectionState()
    })
  }

  const insertChecklist = () => {
    if (readOnly) onReadOnlyChange(false)
    requestAnimationFrame(() => {
      if (!restoreSelection()) return
      const editor = editorRef.current
      if (!editor) return

      const list = document.createElement('ul')
      list.dataset.taskList = 'true'
      const item = document.createElement('li')
      item.dataset.taskItem = 'true'
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.dataset.taskCheckbox = 'true'
      checkbox.contentEditable = 'false'
      const text = document.createElement('span')
      text.dataset.taskText = 'true'
      text.appendChild(document.createElement('br'))
      item.append(checkbox, text)
      list.appendChild(item)
      insertStandaloneBlock(editor, list, text)
      emitEditor(true)
    })
  }

  const insertReference = () => {
    if (readOnly) onReadOnlyChange(false)
    requestAnimationFrame(() => {
      if (!restoreSelection()) return
      const editor = editorRef.current
      if (!editor) return

      const block = document.createElement('p')
      block.dataset.noteReference = 'true'
      const text = document.createElement('span')
      text.dataset.noteReferenceText = 'true'
      text.textContent = reference.trim() || 'Referencia bíblica'
      block.appendChild(text)

      insertStandaloneBlock(editor, block, text)
      emitEditor(true)
    })
  }

  const insertDateTime = () => {
    const now = new Date().toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' })
    runCommand('insertText', now)
  }

  const requestAi = async (regenerar = false) => {
    if (aiLoading || !value.trim() || !aiInstruction.trim()) return
    const source = value
    setAiLoading(true)
    setAiError(null)
    setAiReused(false)

    try {
      const result = await organizarApuntesConIA({
        contenido: plainTextFromCanonical(source),
        referencia: reference,
        indicacion: aiInstruction.trim(),
        regenerar,
      })
      if (!result.success) {
        setAiProposal(null)
        setAiError(result.error)
        return
      }
      setAiSource(source)
      setAiProposal(normalizeAiProposal(result.propuesta))
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
    onChange(aiProposal, { checkpoint: true })
    setAiProposal(null)
    setAiSource('')
    setAiError(null)
    onReadOnlyChange(false)
  }

  const groups: Array<{ id: ToolGroup; label: string }> = [
    { id: 'texto', label: 'Texto' },
    { id: 'listas', label: 'Listas' },
    { id: 'insertar', label: 'Insertar' },
    { id: 'vista', label: 'Vista' },
  ]

  const preventBlur = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault()

  const commandButton = (label: string, Icon: typeof Bold, action: () => void, active = false, compactLabel?: string) => (
    <button
      type="button"
      onMouseDown={preventBlur}
      onClick={action}
      className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-[10px] font-bold transition active:scale-[0.97] ${active ? 'bg-violet-600 text-white shadow-sm' : buttonClass}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="max-w-full truncate">{compactLabel ?? label}</span>
    </button>
  )

  const styleButton = (block: BlockStyle, label: string, className: string) => (
    <button
      type="button"
      onMouseDown={preventBlur}
      onClick={() => setBlock(block)}
      aria-pressed={formatState.block === block}
      aria-label={`Aplicar estilo ${label}`}
      className={`flex min-h-14 min-w-0 items-center justify-center rounded-2xl px-2 text-center transition active:scale-[0.98] ${formatState.block === block ? 'bg-violet-600 text-white shadow-sm' : buttonClass}`}
      title={label}
    >
      <span className={`block max-w-full truncate leading-tight ${className}`}>{label}</span>
    </button>
  )

  return (
    <section aria-label="Herramientas de edición" className="mt-2">
      <div className="rounded-[22px] border border-current/10 bg-current/[0.025] p-1.5 backdrop-blur-xl">
        <div className="rounded-[19px] border border-violet-400/20 bg-violet-500/[0.07] p-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-600 text-white shadow-sm"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <input
                value={aiInstruction}
                onChange={(event) => { setAiInstruction(event.target.value); setAiError(null) }}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void requestAi(false) } }}
                placeholder="¿Qué quieres hacer con esta nota?"
                className="min-h-10 w-full bg-transparent px-1 text-sm font-medium outline-none placeholder:font-normal placeholder:opacity-55"
                aria-label="Instrucción para la IA"
              />
            </div>
            <button type="button" onClick={() => void requestAi(false)} disabled={aiLoading || !value.trim() || !aiInstruction.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 text-white transition active:scale-95 disabled:opacity-35" aria-label="Enviar instrucción a IA">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>

          {aiError && <p className="mt-2 rounded-2xl bg-rose-500/10 px-3 py-2 text-[10px] leading-4 text-rose-700" role="status">{aiError}</p>}
          {aiProposal && (
            <div className="mt-2" aria-live="polite">
              <div className="flex items-center justify-between gap-2 px-1"><p className="text-[10px] font-extrabold">Propuesta</p>{aiReused && <span className={`text-[9px] ${mutedClass}`}>Reutilizada para ahorrar tokens</span>}</div>
              <div className="mt-1.5 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-current/10 bg-current/[0.025] px-3 py-3 text-[11px] leading-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{plainTextFromCanonical(aiProposal)}</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button type="button" onClick={applyAiProposal} className="min-h-11 rounded-2xl bg-violet-600 px-3 text-[11px] font-extrabold text-white">Aplicar propuesta</button>
                <button type="button" onClick={() => { setAiProposal(null); setAiSource(''); setAiError(null) }} className={`min-h-11 rounded-2xl px-3 text-[11px] font-bold ${buttonClass}`}>Descartar</button>
              </div>
              <button type="button" onClick={() => void requestAi(true)} disabled={aiLoading} className={`mt-1.5 min-h-10 w-full rounded-2xl px-3 text-[10px] font-bold disabled:opacity-45 ${buttonClass}`}>{aiLoading ? 'Generando…' : 'Volver a generar'}</button>
            </div>
          )}
        </div>

        <div role="tablist" aria-label="Categorías de herramientas" className="mt-1.5 grid grid-cols-4 gap-1">
          {groups.map((group) => (
            <button key={group.id} type="button" role="tab" aria-selected={activeGroup === group.id} onClick={() => { setActiveGroup(group.id); if (group.id !== 'vista') onReadOnlyChange(false) }} className={`min-h-9 min-w-0 rounded-[15px] px-1 text-[10px] font-extrabold transition ${activeGroup === group.id ? 'bg-violet-600 text-white shadow-sm' : mutedClass}`}><span className="block truncate">{group.label}</span></button>
          ))}
        </div>

        <div className="mt-1.5 rounded-[18px] p-1.5">
          {activeGroup === 'texto' && (
            <div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                {styleButton('h1', 'Título', 'text-[16px] font-black tracking-[-0.025em]')}
                {styleButton('h2', 'Encabezado', 'text-[13px] font-extrabold tracking-[-0.015em]')}
                {styleButton('h3', 'Subtítulo', 'text-[12px] font-bold opacity-85')}
                {styleButton('p', 'Cuerpo', 'text-[11px] font-medium')}
                {styleButton('pre', 'Monoespaciado', 'text-[10px] font-mono')}
              </div>
              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {commandButton('Negrita', Bold, () => runCommand('bold'), formatState.bold, 'B')}
                {commandButton('Cursiva', Italic, () => runCommand('italic'), formatState.italic, 'I')}
                {commandButton('Subrayado', Underline, () => runCommand('underline'), formatState.underline, 'U')}
                {commandButton('Tachado', Strikethrough, () => runCommand('strikeThrough'), formatState.strike, 'S')}
                {commandButton('Limpiar formato', Eraser, () => runCommand('removeFormat'), false, 'Limpiar')}
                {commandButton('Reducir tamaño del texto', ZoomOut, () => onFontSizeChange(clampFontSize(fontSize - 1)), false, 'A−')}
                {commandButton('Aumentar tamaño del texto', ZoomIn, () => onFontSizeChange(clampFontSize(fontSize + 1)), false, 'A+')}
              </div>
            </div>
          )}

          {activeGroup === 'listas' && (
            <div>
              <div className="grid grid-cols-4 gap-1.5">
                {commandButton('Viñetas', List, () => toggleStandardList('bullet'), formatState.bullet, 'Viñetas')}
                {commandButton('Guiones', Minus, () => toggleStandardList('dash'), formatState.dash, 'Guiones')}
                {commandButton('Numerada', ListOrdered, () => toggleStandardList('numbered'), formatState.numbered, 'Numerada')}
                {commandButton('Tareas', CheckSquare, insertChecklist, false, 'Tareas')}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {commandButton('Disminuir sangría', ChevronLeft, () => runCommand('outdent'), false, 'Menos sangría')}
                {commandButton('Aumentar sangría', ChevronRight, () => runCommand('indent'), false, 'Más sangría')}
              </div>
              <p className={`mt-2 px-1 text-[10px] leading-4 ${mutedClass}`}>Enter continúa automáticamente viñetas, guiones, numeración y tareas. En una línea vacía, Enter termina la lista.</p>
            </div>
          )}

          {activeGroup === 'insertar' && (
            <div className="grid grid-cols-4 gap-1.5">
              {commandButton('Cita', Quote, () => runCommand('formatBlock', 'blockquote'), false, 'Cita')}
              {commandButton('Separador', Minus, () => runCommand('insertHorizontalRule'), false, 'Separador')}
              {commandButton('Fecha y hora actual', CalendarClock, insertDateTime, false, 'Fecha y hora')}
              {commandButton('Referencia bíblica', BookMarked, insertReference, false, 'Referencia')}
            </div>
          )}

          {activeGroup === 'vista' && (
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => onReadOnlyChange(!readOnly)} className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-bold transition active:scale-[0.98] ${buttonClass}`} aria-pressed={readOnly}><Eye className="h-[18px] w-[18px]" aria-hidden="true" />{readOnly ? 'Seguir editando' : 'Solo lectura'}</button>
              <button type="button" onClick={() => window.print()} className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-bold transition active:scale-[0.98] ${buttonClass}`} aria-label="Imprimir o guardar PDF"><Printer className="h-[18px] w-[18px]" aria-hidden="true" />Imprimir / PDF</button>
            </div>
          )}
        </div>
      </div>

      <div className={`mt-1.5 flex items-center justify-between px-2 text-[10px] ${mutedClass}`}>
        <span>{activeGroup === 'texto' ? 'Formato visible mientras escribes' : activeGroup === 'listas' ? 'Listas automáticas' : activeGroup === 'insertar' ? 'Elementos' : 'Lectura y salida'}</span>
        <span className="font-bold">{fontSize}px</span>
      </div>
    </section>
  )
}
