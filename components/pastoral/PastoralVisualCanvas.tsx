'use client'

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Move, Trash2 } from 'lucide-react'
import {
  TEMAS_LIENZO, aspectoLienzo, clamp, limpiarHtmlCanvas,
  type DiapositivaCanvas, type ElementoCanvas, type RecursoPastoral,
} from '@/components/pastoral/pastoral-canvas-model'

type Gesto = { id: string; tipo: 'mover' | 'redimensionar'; startX: number; startY: number; x: number; y: number; w: number; h: number; rect: DOMRect }

type Props = {
  pagina: DiapositivaCanvas
  biblioteca: RecursoPastoral[]
  editable?: boolean
  seleccion?: string | null
  onSelect?: (id: string | null) => void
  onBeginChange?: () => void
  onPatchElement?: (id: string, patch: Partial<ElementoCanvas>) => void
  onTextInput?: (id: string, html: string) => void
  onDeleteElement?: (id: string) => void
}

type TextoProps = {
  elemento: ElementoCanvas
  editable: boolean
  baseWidth: number
  onSelect?: (id: string | null) => void
  onBeginChange?: () => void
  onTextInput?: (id: string, html: string) => void
}

function TextoCanvas({ elemento, editable, baseWidth, onSelect, onBeginChange, onTextInput }: TextoProps) {
  const textoRef = useRef<HTMLDivElement | null>(null)
  const contenidoSeguro = limpiarHtmlCanvas(elemento.contenido ?? '')
  const decoracion = [elemento.subrayado ? 'underline' : '', elemento.tachado ? 'line-through' : ''].filter(Boolean).join(' ') || 'none'
  const puntos = elemento.tamano_fuente ?? 24
  const pixeles = (puntos * 4) / 3
  const escalaLienzo = (pixeles / baseWidth) * 100

  useEffect(() => {
    const editor = textoRef.current
    if (!editor || document.activeElement === editor) return
    if (editor.innerHTML !== contenidoSeguro) editor.innerHTML = contenidoSeguro
  }, [contenidoSeguro])

  return <div
    ref={textoRef}
    dir="ltr"
    lang="es"
    contentEditable={editable}
    suppressContentEditableWarning
    spellCheck
    onFocus={() => { onSelect?.(elemento.id); onBeginChange?.() }}
    onInput={(event) => onTextInput?.(elemento.id, limpiarHtmlCanvas(event.currentTarget.innerHTML))}
    className={`h-full w-full overflow-auto break-words outline-none ${elemento.tipo === 'versiculo' ? 'rounded-xl bg-slate-900/[0.04] px-3 py-2' : ''}`}
    style={{
      fontFamily: elemento.fuente ?? 'Inter',
      fontSize: `min(${pixeles}px, ${escalaLienzo}cqw)`,
      color: elemento.color ?? '#0f172a',
      textAlign: elemento.alineacion === 'centro' ? 'center' : elemento.alineacion === 'derecha' ? 'right' : 'left',
      fontWeight: elemento.peso ?? 500,
      fontStyle: elemento.cursiva ? 'italic' : 'normal',
      fontSynthesis: 'style weight',
      textDecoration: decoracion,
      lineHeight: elemento.interlineado ?? 1.25,
      direction: 'ltr',
      unicodeBidi: 'plaintext',
      writingMode: 'horizontal-tb',
    }}
  />
}

function estiloControlesFlotantes(elemento: ElementoCanvas): CSSProperties {
  if (elemento.x + elemento.w <= 94) return { left: 'calc(100% + 8px)', top: 0, flexDirection: 'column' }
  if (elemento.x >= 6) return { right: 'calc(100% + 8px)', top: 0, flexDirection: 'column' }
  if (elemento.y >= 9) return { left: 0, bottom: 'calc(100% + 8px)' }
  return { left: 0, top: 'calc(100% + 8px)' }
}

export default function PastoralVisualCanvas({ pagina, biblioteca, editable = false, seleccion, onSelect, onBeginChange, onPatchElement, onTextInput, onDeleteElement }: Props) {
  const lienzoRef = useRef<HTMLDivElement | null>(null)
  const [gesto, setGesto] = useState<Gesto | null>(null)
  const tema = TEMAS_LIENZO.find((item) => item.id === pagina.fondo_tema) ?? TEMAS_LIENZO[0]
  const fondoRecurso = biblioteca.find((item) => item.id === pagina.fondo_recurso_id)
  const background = pagina.fondo_modo === 'tema' ? tema.css : pagina.fondo ?? '#ffffff'
  const baseWidth = pagina.formato === '9:16' ? 430 : pagina.formato === '1:1' ? 720 : pagina.formato === '4:3' ? 960 : 1100

  const iniciarGesto = (event: ReactPointerEvent, elemento: ElementoCanvas, tipo: Gesto['tipo']) => {
    if (!editable || !lienzoRef.current) return
    event.preventDefault()
    event.stopPropagation()
    onSelect?.(elemento.id)
    onBeginChange?.()
    const rect = lienzoRef.current.getBoundingClientRect()
    setGesto({ id: elemento.id, tipo, startX: event.clientX, startY: event.clientY, x: elemento.x, y: elemento.y, w: elemento.w, h: elemento.h, rect })
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const moverGesto = (event: ReactPointerEvent) => {
    if (!gesto || !onPatchElement) return
    const dx = ((event.clientX - gesto.startX) / gesto.rect.width) * 100
    const dy = ((event.clientY - gesto.startY) / gesto.rect.height) * 100
    if (gesto.tipo === 'mover') onPatchElement(gesto.id, { x: clamp(gesto.x + dx, 0, 100 - gesto.w), y: clamp(gesto.y + dy, 0, 100 - gesto.h) })
    else onPatchElement(gesto.id, { w: clamp(gesto.w + dx, 5, 100 - gesto.x), h: clamp(gesto.h + dy, 5, 100 - gesto.y) })
  }

  return (
    <div className="mx-auto flex w-full items-center justify-center overflow-auto">
      <div
        ref={lienzoRef}
        data-pastoral-canvas="true"
        onPointerMove={moverGesto}
        onPointerUp={() => setGesto(null)}
        onPointerCancel={() => setGesto(null)}
        onPointerDown={() => editable && onSelect?.(null)}
        className={`pastoral-visual-canvas relative w-full overflow-hidden bg-white shadow-sm ${editable ? 'touch-pan-y ring-1 ring-slate-200' : ''}`}
        style={{ aspectRatio: aspectoLienzo(pagina.formato), maxWidth: `${baseWidth}px`, background, color: pagina.color_texto, containerType: 'inline-size' }}
      >
        {pagina.fondo_modo === 'imagen' && fondoRecurso?.acceso_url && <img src={fondoRecurso.acceso_url} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />}
        {pagina.fondo_modo === 'imagen' && fondoRecurso?.acceso_url && <div className="pointer-events-none absolute inset-0 bg-black/15" />}
        {(pagina.elementos ?? []).slice().sort((a, b) => a.z - b.z).map((elemento) => {
          const activo = editable && seleccion === elemento.id
          const recurso = elemento.tipo === 'imagen' ? biblioteca.find((item) => item.id === elemento.recurso_id) : null
          return <div
            key={elemento.id}
            data-canvas-element={elemento.tipo}
            onPointerDown={(event) => { event.stopPropagation(); editable && onSelect?.(elemento.id) }}
            className={`absolute overflow-visible ${activo ? 'ring-1 ring-[#C0392B] ring-offset-1' : ''}`}
            style={{ left: `${elemento.x}%`, top: `${elemento.y}%`, width: `${elemento.w}%`, height: `${elemento.h}%`, zIndex: elemento.z, opacity: elemento.opacidad ?? 1 }}
          >
            {elemento.tipo === 'imagen' ? (
              recurso?.acceso_url ? <img src={recurso.acceso_url} alt={recurso.titulo} draggable={false} className="h-full w-full select-none" style={{ objectFit: elemento.ajuste ?? 'cover', borderRadius: `${elemento.radio ?? 14}px` }} /> : <div className="grid h-full w-full place-items-center bg-slate-200 text-xs text-slate-500">Imagen no disponible</div>
            ) : <TextoCanvas elemento={elemento} editable={editable} baseWidth={baseWidth} onSelect={onSelect} onBeginChange={onBeginChange} onTextInput={onTextInput} />}
            {activo && <>
              <div className="absolute z-[240] flex gap-1" style={estiloControlesFlotantes(elemento)} data-canvas-floating-controls="true">
                <button type="button" onPointerDown={(event) => iniciarGesto(event, elemento, 'mover')} className="pastoral-canvas-action" aria-label="Mover elemento"><Move /></button>
                <button type="button" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onDeleteElement?.(elemento.id) }} className="pastoral-canvas-action is-danger" aria-label="Eliminar elemento"><Trash2 /></button>
              </div>
              <button type="button" onPointerDown={(event) => iniciarGesto(event, elemento, 'redimensionar')} className="pastoral-canvas-resize-handle absolute touch-none" aria-label="Redimensionar elemento" />
            </>}
          </div>
        })}
      </div>
      <style jsx global>{`
        .pastoral-visual-canvas [contenteditable='true'] { -webkit-user-select:text; user-select:text; direction:ltr !important; unicode-bidi:plaintext !important; writing-mode:horizontal-tb !important; }
        .pastoral-visual-canvas [contenteditable='true'] ul { list-style:disc; padding-left:1.35em; }
        .pastoral-visual-canvas [contenteditable='true'] ol { list-style:decimal; padding-left:1.35em; }
        .pastoral-visual-canvas [contenteditable='true'] blockquote { border-left:3px solid currentColor; margin:.5em 0; padding-left:.75em; opacity:.92; }
      `}</style>
    </div>
  )
}
