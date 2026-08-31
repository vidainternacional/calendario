'use client'

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Move } from 'lucide-react'
import {
  TEMAS_LIENZO, aspectoLienzo, clamp, limpiarHtmlCanvas,
  type DiapositivaCanvas, type ElementoCanvas, type RecursoPastoral,
} from '@/components/pastoral/pastoral-canvas-model'

type ElementoCanvasEditor = ElementoCanvas & { bloqueado?: boolean; sombreado?: boolean }
type Gesto = { id: string; tipo: 'mover' | 'redimensionar'; startX: number; startY: number; x: number; y: number; w: number; h: number; rect: DOMRect }
type ArrastreImagenPendiente = { id: string; pointerId: number; startX: number; startY: number; x: number; y: number; w: number; h: number; rect: DOMRect }
type PunteroImagen = { id: string; x: number; y: number }
type PellizcoImagen = { id: string; pointerA: number; pointerB: number; distancia: number; x: number; y: number; w: number; h: number; centroX: number; centroY: number }
type CajaPorcentaje = { x: number; y: number; w: number; h: number }
type CandidatoControles = { caja: CajaPorcentaje; vertical: boolean }

type Props = {
  pagina: DiapositivaCanvas
  biblioteca: RecursoPastoral[]
  editable?: boolean
  seleccion?: string | null
  fitViewport?: boolean
  onSelect?: (id: string | null) => void
  onBeginChange?: () => void
  onPatchElement?: (id: string, patch: Partial<ElementoCanvas>) => void
  onTextInput?: (id: string, html: string) => void
  onDeleteElement?: (id: string) => void
}

type TextoProps = {
  elemento: ElementoCanvasEditor
  editable: boolean
  baseWidth: number
  onSelect?: (id: string | null) => void
  onBeginChange?: () => void
  onPatchElement?: (id: string, patch: Partial<ElementoCanvas>) => void
  onTextInput?: (id: string, html: string) => void
}

function aplicarAtributosInlineVida(editor: HTMLElement, baseWidth: number, maxPuntos?: number) {
  editor.querySelectorAll<HTMLElement>('span[data-vida-size], span[data-vida-line-height], span[data-vida-color]').forEach((span) => {
    const size = Number(span.getAttribute('data-vida-size'))
    const line = Number(span.getAttribute('data-vida-line-height'))
    const color = String(span.getAttribute('data-vida-color') ?? '')
    if (Number.isFinite(size) && size >= 8 && size <= 160) {
      const limite = typeof maxPuntos === 'number' && Number.isFinite(maxPuntos) ? maxPuntos : size
      const sizeAplicado = Math.min(size, limite)
      const pixeles = (sizeAplicado * 4) / 3
      const escalaLienzo = (pixeles / baseWidth) * 100
      span.style.fontSize = `min(${pixeles}px, ${escalaLienzo}cqw)`
    } else span.style.removeProperty('font-size')
    if (Number.isFinite(line) && line >= .8 && line <= 3) span.style.lineHeight = String(line)
    else span.style.removeProperty('line-height')
    if (/^#[0-9a-f]{6}$/i.test(color)) span.style.color = color
    else span.style.removeProperty('color')
  })
}

function aplicarTamanoTexto(editor: HTMLElement, puntos: number, baseWidth: number) {
  const pixeles = (puntos * 4) / 3
  const escalaLienzo = (pixeles / baseWidth) * 100
  editor.style.fontSize = `min(${pixeles}px, ${escalaLienzo}cqw)`
}

const TEXTOS_INICIALES_AJUSTABLES = new Set(['Título', 'Subtítulo', 'Escribe el contenido', 'Escribe aquí'])

function TextoCanvas({ elemento, editable, baseWidth, onSelect, onBeginChange, onPatchElement, onTextInput }: TextoProps) {
  const textoRef = useRef<HTMLDivElement | null>(null)
  const cajaInicialAjustadaRef = useRef(false)
  const contenidoSeguro = limpiarHtmlCanvas(elemento.contenido ?? '')
  const decoracion = [elemento.subrayado ? 'underline' : '', elemento.tachado ? 'line-through' : ''].filter(Boolean).join(' ') || 'none'
  const puntos = elemento.tamano_fuente ?? 24
  console.log('[TEMP PastoralVisualCanvas font]', { vista: elemento.id.startsWith('plantilla-admin-') ? 'Admin Preview' : 'Centro Pastoral', elemento: elemento.id, rol: elemento.rol, tamano_fuente: puntos })
  const pixeles = (puntos * 4) / 3
  const escalaLienzo = (pixeles / baseWidth) * 100
  const fuente = elemento.fuente ?? 'Inter'
  const familia = fuente === 'Inter'
    ? 'var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif'
    : `${fuente}, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`

  useEffect(() => {
    const editor = textoRef.current
    if (!editor) return
    if (document.activeElement !== editor && editor.innerHTML !== contenidoSeguro) editor.innerHTML = contenidoSeguro

    const contenedor = editor.parentElement
    const debeEncajar = true
    let frame = 0
    let observer: ResizeObserver | null = null
    let cancelado = false

    const aplicar = (tamano: number, limitarInline = false) => {
      aplicarTamanoTexto(editor, tamano, baseWidth)
      aplicarAtributosInlineVida(editor, baseWidth, limitarInline ? tamano : undefined)
    }

    const ajustarCajaInicial = () => {
      if (cancelado || cajaInicialAjustadaRef.current || !editable || !onPatchElement) return
      const textoPlano = (editor.textContent ?? '').replace(/\s+/g, ' ').trim()
      const esMuestraPlantillaAdministrada = Boolean(editor.querySelector('span[data-vida-template-sample="true"]'))
      const esCajaInicial = elemento.id.startsWith('plantilla-admin-') || esMuestraPlantillaAdministrada || TEXTOS_INICIALES_AJUSTABLES.has(textoPlano)
      if (!esCajaInicial) return

      const lienzo = editor.closest<HTMLElement>('[data-pastoral-canvas="true"]')
      const rectLienzo = lienzo?.getBoundingClientRect()
      if (!rectLienzo || rectLienzo.width <= 0 || rectLienzo.height <= 0) return

      const rango = document.createRange()
      rango.selectNodeContents(editor)
      const fragmentos = Array.from(rango.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0)
      if (!fragmentos.length) return

      const anchoTexto = Math.max(...fragmentos.map((rect) => rect.width))
      const arriba = Math.min(...fragmentos.map((rect) => rect.top))
      const abajo = Math.max(...fragmentos.map((rect) => rect.bottom))
      const altoTexto = Math.max(1, abajo - arriba)
      const anchoNecesario = clamp(((anchoTexto + 12) / rectLienzo.width) * 100, 5, 100 - elemento.x)
      const altoNecesario = clamp(((altoTexto + 8) / rectLienzo.height) * 100, 5, 100 - elemento.y)
      const w = Math.min(elemento.w, Math.ceil(anchoNecesario * 10) / 10)
      const h = Math.min(elemento.h, Math.ceil(altoNecesario * 10) / 10)

      cajaInicialAjustadaRef.current = true
      if (Math.abs(w - elemento.w) < .4 && Math.abs(h - elemento.h) < .4) return

      const x = elemento.alineacion === 'derecha'
        ? clamp(elemento.x + elemento.w - w, 0, 100 - w)
        : elemento.alineacion === 'centro'
          ? clamp(elemento.x + (elemento.w - w) / 2, 0, 100 - w)
          : clamp(elemento.x, 0, 100 - w)
      onPatchElement(elemento.id, { x, w, h })
    }

    const encajar = () => {
      if (cancelado) return
      const caja = editor.parentElement
      const preferido = clamp(puntos, 8, 160)
      if (!debeEncajar || !caja || caja.clientWidth <= 0 || caja.clientHeight <= 0) {
        aplicar(preferido)
        ajustarCajaInicial()
        return
      }

      let elegido = preferido
      for (let candidato = preferido; candidato >= 8; candidato -= 1) {
        aplicar(candidato, true)
        elegido = candidato
        const cabeAncho = editor.scrollWidth <= caja.clientWidth + 1
        const cabeAlto = editor.scrollHeight <= caja.clientHeight + 1
        if (cabeAncho && cabeAlto) break
      }
      aplicar(elegido, true)
      ajustarCajaInicial()
    }

    const programarEncaje = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(encajar)
    }

    programarEncaje()
    if (contenedor && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(programarEncaje)
      observer.observe(contenedor)
    }
    document.fonts?.ready.then(() => { if (!cancelado) programarEncaje() }).catch(() => {})

    return () => {
      cancelado = true
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [contenidoSeguro, baseWidth, puntos, elemento.rol, elemento.interlineado, elemento.peso, fuente, editable, onPatchElement, elemento.id, elemento.x, elemento.y, elemento.alineacion])

  return <div
    ref={textoRef}
    dir="ltr"
    lang="es"
    contentEditable={editable}
    suppressContentEditableWarning
    spellCheck
    onPointerDown={(event) => { event.stopPropagation(); onSelect?.(elemento.id) }}
    onTouchStart={(event) => event.stopPropagation()}
    onFocus={() => { onSelect?.(elemento.id); onBeginChange?.() }}
    onInput={(event) => onTextInput?.(elemento.id, limpiarHtmlCanvas(event.currentTarget.innerHTML))}
    className={`h-full w-full overflow-hidden break-words outline-none ${elemento.tipo === 'versiculo' && elemento.sombreado ? 'rounded-xl bg-slate-900/[0.04] px-3 py-2' : ''}`}
    style={{
      fontFamily: familia,
      fontSize: `min(${pixeles}px, ${escalaLienzo}cqw)`,
      color: elemento.color ?? '#0f172a',
      textAlign: elemento.alineacion === 'centro' ? 'center' : elemento.alineacion === 'derecha' ? 'right' : elemento.alineacion === 'justificado' ? 'justify' : 'left',
      fontWeight: elemento.peso ?? 500,
      fontStyle: elemento.cursiva ? 'italic' : 'normal',
      fontSynthesis: 'none',
      textDecoration: decoracion,
      textShadow: 'none',
      lineHeight: elemento.interlineado ?? 1.25,
      direction: 'ltr',
      unicodeBidi: 'plaintext',
      writingMode: 'horizontal-tb',
      touchAction: 'auto',
      cursor: editable ? 'text' : 'default',
    }}
  />
}

function cajasSeCruzan(a: CajaPorcentaje, b: CajaPorcentaje) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function estiloControlesFlotantes(elemento: ElementoCanvas, elementos: ElementoCanvas[], canvasRect?: DOMRect): CSSProperties {
  const anchoCanvas = Math.max(1, canvasRect?.width ?? 360)
  const altoCanvas = Math.max(1, canvasRect?.height ?? 203)
  const cantidadBotones = 1
  const espacioPx = 4
  const botonPx = 44
  const gapX = (6 / anchoCanvas) * 100
  const gapY = (6 / altoCanvas) * 100
  const horizontalW = ((cantidadBotones * botonPx + (cantidadBotones - 1) * espacioPx) / anchoCanvas) * 100
  const horizontalH = (botonPx / altoCanvas) * 100
  const verticalW = (botonPx / anchoCanvas) * 100
  const verticalH = ((cantidadBotones * botonPx + (cantidadBotones - 1) * espacioPx) / altoCanvas) * 100
  const anclarDerecha = elemento.x + (elemento.w / 2) > 50
  const xHorizontal = clamp(anclarDerecha ? elemento.x + elemento.w - horizontalW : elemento.x, 0, Math.max(0, 100 - horizontalW))
  const yVertical = clamp(elemento.y, 0, Math.max(0, 100 - verticalH))

  const candidatos: CandidatoControles[] = [
    { caja: { x: xHorizontal, y: elemento.y - horizontalH - gapY, w: horizontalW, h: horizontalH }, vertical: false },
    { caja: { x: xHorizontal, y: elemento.y + elemento.h + gapY, w: horizontalW, h: horizontalH }, vertical: false },
    { caja: { x: elemento.x + elemento.w + gapX, y: yVertical, w: verticalW, h: verticalH }, vertical: true },
    { caja: { x: elemento.x - verticalW - gapX, y: yVertical, w: verticalW, h: verticalH }, vertical: true },
  ]

  const textosOcupados = elementos
    .filter((otro) => otro.id !== elemento.id && otro.tipo !== 'imagen' && !otro.oculto)
    .map((otro) => ({ x: otro.x, y: otro.y, w: otro.w, h: otro.h }))
  const dentroDelLienzo = (candidato: CandidatoControles) => candidato.caja.x >= 0 && candidato.caja.y >= 0 && candidato.caja.x + candidato.caja.w <= 100 && candidato.caja.y + candidato.caja.h <= 100
  const cruces = (candidato: CandidatoControles) => textosOcupados.filter((ocupado) => cajasSeCruzan(candidato.caja, ocupado)).length

  const validos = candidatos.filter(dentroDelLienzo)
  const elegido = validos.find((candidato) => cruces(candidato) === 0) ?? validos.sort((a, b) => cruces(a) - cruces(b))[0]

  if (elegido) {
    const left = ((elegido.caja.x - elemento.x) / Math.max(elemento.w, .01)) * 100
    const top = ((elegido.caja.y - elemento.y) / Math.max(elemento.h, .01)) * 100
    return { left: `${left}%`, top: `${top}%`, flexDirection: elegido.vertical ? 'column' : 'row' }
  }

  const vertical = elemento.y + (elemento.h / 2) > 50 ? { bottom: '4px' } : { top: '4px' }
  return { ...(anclarDerecha ? { right: '4px' } : { left: '4px' }), ...vertical, flexDirection: 'row' }
}

function ratioFormato(formato: DiapositivaCanvas['formato']) {
  if (formato === '9:16') return 9 / 16
  if (formato === '4:3') return 4 / 3
  if (formato === '1:1') return 1
  return 16 / 9
}

export default function PastoralVisualCanvas({ pagina, biblioteca, editable = false, seleccion, fitViewport = false, onSelect, onBeginChange, onPatchElement, onTextInput }: Props) {
  const lienzoRef = useRef<HTMLDivElement | null>(null)
  const arrastreImagenPendienteRef = useRef<ArrastreImagenPendiente | null>(null)
  const punterosImagenRef = useRef<Map<number, PunteroImagen>>(new Map())
  const pellizcoImagenRef = useRef<PellizcoImagen | null>(null)
  const toqueLienzoImagenRef = useRef<number | null>(null)
  const [gesto, setGesto] = useState<Gesto | null>(null)
  const tema = TEMAS_LIENZO.find((item) => item.id === pagina.fondo_tema) ?? TEMAS_LIENZO[0]
  const fondoRecurso = biblioteca.find((item) => item.id === pagina.fondo_recurso_id)
  const background = pagina.fondo_modo === 'tema' ? tema.css : pagina.fondo ?? '#ffffff'
  const baseWidth = pagina.formato === '9:16' ? 430 : pagina.formato === '1:1' ? 720 : pagina.formato === '4:3' ? 960 : 1100
  const ratio = ratioFormato(pagina.formato)
  const elementoGestualSeleccionado = (pagina.elementos ?? []).find((item) => item.id === seleccion && (item.tipo === 'imagen' || item.es_capa_fondo)) as ElementoCanvasEditor | undefined
  const elementoGestualEditable = Boolean(editable && elementoGestualSeleccionado && !elementoGestualSeleccionado.bloqueado)

  const iniciarGesto = (event: ReactPointerEvent, elemento: ElementoCanvasEditor, tipo: Gesto['tipo']) => {
    if (!editable || elemento.bloqueado || !lienzoRef.current) return
    event.preventDefault()
    event.stopPropagation()
    onSelect?.(elemento.id)
    onBeginChange?.()
    const rect = lienzoRef.current.getBoundingClientRect()
    setGesto({ id: elemento.id, tipo, startX: event.clientX, startY: event.clientY, x: elemento.x, y: elemento.y, w: elemento.w, h: elemento.h, rect })
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const activarPellizcoImagen = (elemento: ElementoCanvasEditor) => {
    const punteros = Array.from(punterosImagenRef.current.entries()).filter(([, punto]) => punto.id === elemento.id)
    if (punteros.length < 2) return false
    const [[pointerA, a], [pointerB, b]] = punteros.slice(-2)
    const distancia = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))
    arrastreImagenPendienteRef.current = null
    toqueLienzoImagenRef.current = null
    if (!pellizcoImagenRef.current) onBeginChange?.()
    setGesto(null)
    pellizcoImagenRef.current = {
      id: elemento.id,
      pointerA,
      pointerB,
      distancia,
      x: elemento.x,
      y: elemento.y,
      w: elemento.w,
      h: elemento.h,
      centroX: elemento.x + elemento.w / 2,
      centroY: elemento.y + elemento.h / 2,
    }
    return true
  }

  const iniciarInteraccionImagen = (event: ReactPointerEvent, elemento: ElementoCanvasEditor) => {
    if (!editable || elemento.bloqueado || (elemento.tipo !== 'imagen' && !elemento.es_capa_fondo) || !lienzoRef.current) return
    event.preventDefault()
    event.stopPropagation()
    onSelect?.(elemento.id)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    punterosImagenRef.current.set(event.pointerId, { id: elemento.id, x: event.clientX, y: event.clientY })
    if (activarPellizcoImagen(elemento)) return
    arrastreImagenPendienteRef.current = {
      id: elemento.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: elemento.x,
      y: elemento.y,
      w: elemento.w,
      h: elemento.h,
      rect: lienzoRef.current.getBoundingClientRect(),
    }
  }

  const iniciarInteraccionLienzo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!editable) return
    const elemento = elementoGestualSeleccionado
    if (!elemento || elemento.bloqueado || !lienzoRef.current) {
      onSelect?.(null)
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    punterosImagenRef.current.set(event.pointerId, { id: elemento.id, x: event.clientX, y: event.clientY })
    if (activarPellizcoImagen(elemento)) return
    toqueLienzoImagenRef.current = event.pointerId
  }

  const moverGesto = (event: ReactPointerEvent) => {
    const punto = punterosImagenRef.current.get(event.pointerId)
    if (punto) punterosImagenRef.current.set(event.pointerId, { ...punto, x: event.clientX, y: event.clientY })

    const pellizco = pellizcoImagenRef.current
    if (pellizco && onPatchElement) {
      const a = punterosImagenRef.current.get(pellizco.pointerA)
      const b = punterosImagenRef.current.get(pellizco.pointerB)
      if (!a || !b) return
      const escala = Math.max(.1, Math.hypot(a.x - b.x, a.y - b.y) / pellizco.distancia)
      let w = clamp(pellizco.w * escala, 5, 100)
      let h = w * (pellizco.h / Math.max(pellizco.w, .01))
      if (h > 100) { h = 100; w = h * (pellizco.w / Math.max(pellizco.h, .01)) }
      const x = clamp(pellizco.centroX - w / 2, 0, 100 - w)
      const y = clamp(pellizco.centroY - h / 2, 0, 100 - h)
      onPatchElement(pellizco.id, { x, y, w, h })
      return
    }

    const pendiente = arrastreImagenPendienteRef.current
    if (!gesto && pendiente && pendiente.pointerId === event.pointerId && onPatchElement) {
      const distancia = Math.hypot(event.clientX - pendiente.startX, event.clientY - pendiente.startY)
      if (distancia < 4) return
      arrastreImagenPendienteRef.current = null
      onBeginChange?.()
      const siguiente: Gesto = { ...pendiente, tipo: 'mover' }
      setGesto(siguiente)
      const dx = ((event.clientX - siguiente.startX) / siguiente.rect.width) * 100
      const dy = ((event.clientY - siguiente.startY) / siguiente.rect.height) * 100
      onPatchElement(siguiente.id, { x: clamp(siguiente.x + dx, 0, 100 - siguiente.w), y: clamp(siguiente.y + dy, 0, 100 - siguiente.h) })
      return
    }
    if (!gesto || !onPatchElement) return
    const dx = ((event.clientX - gesto.startX) / gesto.rect.width) * 100
    const dy = ((event.clientY - gesto.startY) / gesto.rect.height) * 100
    if (gesto.tipo === 'mover') onPatchElement(gesto.id, { x: clamp(gesto.x + dx, 0, 100 - gesto.w), y: clamp(gesto.y + dy, 0, 100 - gesto.h) })
    else onPatchElement(gesto.id, { w: clamp(gesto.w + dx, 5, 100 - gesto.x), h: clamp(gesto.h + dy, 5, 100 - gesto.y) })
  }

  const terminarGesto = (event: ReactPointerEvent) => {
    const pellizco = pellizcoImagenRef.current
    const eraPellizco = Boolean(pellizco && (pellizco.pointerA === event.pointerId || pellizco.pointerB === event.pointerId))
    const eraToqueLienzo = toqueLienzoImagenRef.current === event.pointerId
    punterosImagenRef.current.delete(event.pointerId)
    if (eraPellizco) pellizcoImagenRef.current = null
    if (arrastreImagenPendienteRef.current?.pointerId === event.pointerId) arrastreImagenPendienteRef.current = null
    if (eraToqueLienzo && !eraPellizco) {
      toqueLienzoImagenRef.current = null
      onSelect?.(null)
    }
    setGesto(null)
  }

  const estiloLienzo: CSSProperties = fitViewport
    ? { aspectRatio: aspectoLienzo(pagina.formato), width: `min(100dvw, calc(100dvh * ${ratio}))`, maxWidth: '100dvw', maxHeight: '100dvh', background, color: pagina.color_texto, containerType: 'inline-size' }
    : { aspectRatio: aspectoLienzo(pagina.formato), maxWidth: `${baseWidth}px`, background, color: pagina.color_texto, containerType: 'inline-size' }

  return (
    <div className={`mx-auto flex w-full items-center justify-center ${fitViewport ? 'h-full overflow-hidden' : 'overflow-auto'}`}>
      <div
        ref={lienzoRef}
        data-pastoral-canvas="true"
        onPointerMove={moverGesto}
        onPointerUp={terminarGesto}
        onPointerCancel={terminarGesto}
        onPointerDown={iniciarInteraccionLienzo}
        className={`pastoral-visual-canvas isolate relative w-full overflow-hidden bg-white shadow-sm ${editable ? `${elementoGestualEditable ? 'touch-none' : 'touch-pan-y'} ring-1 ring-slate-200` : ''}`}
        style={estiloLienzo}
      >
        {pagina.fondo_modo === 'imagen' && fondoRecurso?.acceso_url && <img src={fondoRecurso.acceso_url} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />}
        {(pagina.elementos ?? []).slice().sort((a, b) => a.z - b.z).map((elementoBase) => {
          const elemento = elementoBase as ElementoCanvasEditor
          const activo = editable && seleccion === elemento.id
          const bloqueado = Boolean(elemento.bloqueado)
          const recurso = elemento.tipo === 'imagen' ? biblioteca.find((item) => item.id === elemento.recurso_id) : null
          const esFondoVisual = Boolean(elemento.fondo_visual)
          const seleccionLibre = activo && !esFondoVisual && elemento.tipo === 'texto' && elemento.rol === 'libre'
          return <div
            key={elemento.id}
            data-canvas-element={esFondoVisual ? 'fondo-visual' : elemento.tipo}
            data-canvas-element-id={elemento.id}
            data-canvas-text-role={!esFondoVisual ? elemento.rol ?? undefined : undefined}
            data-canvas-locked={bloqueado ? 'true' : 'false'}
            onPointerDown={(event) => {
              if ((elemento.tipo === 'imagen' || elemento.es_capa_fondo) && editable && !bloqueado) { iniciarInteraccionImagen(event, elemento); return }
              event.stopPropagation()
              editable && onSelect?.(elemento.id)
            }}
            className={`absolute overflow-visible ${editable && (elemento.tipo === 'imagen' || elemento.es_capa_fondo) && !bloqueado ? 'touch-none' : ''} ${activo && !seleccionLibre ? 'ring-1 ring-[#C0392B] ring-offset-1' : ''} ${seleccionLibre ? 'outline outline-1 outline-dashed outline-slate-400/45 outline-offset-2' : ''}`}
            style={{ left: `${elemento.x}%`, top: `${elemento.y}%`, width: `${elemento.w}%`, height: `${elemento.h}%`, zIndex: elemento.z, opacity: elemento.opacidad ?? 1, mixBlendMode: elemento.modo_fusion ?? 'normal', display: elemento.oculto ? 'none' : undefined }}
          >
            {esFondoVisual ? <div className="h-full w-full" style={{ background: elemento.fondo_visual }} /> : elemento.tipo === 'imagen' ? (
              recurso?.acceso_url ? <img src={recurso.acceso_url} alt={recurso.titulo} draggable={false} className="h-full w-full select-none" style={{ objectFit: elemento.ajuste ?? 'cover', borderRadius: `${elemento.radio ?? 14}px` }} /> : <div className="grid h-full w-full place-items-center bg-slate-200 text-xs text-slate-500">Imagen no disponible</div>
            ) : <TextoCanvas elemento={elemento} editable={editable && !bloqueado} baseWidth={baseWidth} onSelect={onSelect} onBeginChange={onBeginChange} onPatchElement={onPatchElement} onTextInput={onTextInput} />}
            {activo && !bloqueado && <>
              {elemento.tipo !== 'imagen' && !elemento.es_capa_fondo && <div className="absolute z-[240] flex gap-1" style={estiloControlesFlotantes(elemento, pagina.elementos ?? [], lienzoRef.current?.getBoundingClientRect())} data-canvas-floating-controls="true">
                <button type="button" onPointerDown={(event) => iniciarGesto(event, elemento, 'mover')} className="pastoral-canvas-action" aria-label="Mover elemento"><Move /></button>
              </div>}
              {elemento.tipo !== 'imagen' && !elemento.es_capa_fondo && <button type="button" onPointerDown={(event) => iniciarGesto(event, elemento, 'redimensionar')} className="pastoral-canvas-resize-handle absolute touch-none" aria-label="Redimensionar elemento" />}
            </>}
          </div>
        })}
      </div>
      <style jsx global>{`
        .pastoral-visual-canvas [contenteditable='true'] { -webkit-user-select:text; user-select:text; touch-action:auto !important; -webkit-touch-callout:default; direction:ltr !important; unicode-bidi:plaintext !important; writing-mode:horizontal-tb !important; text-shadow:none !important; -webkit-text-stroke:0 transparent !important; }
        .pastoral-visual-canvas [data-canvas-text-role='libre'] [contenteditable='true'] { background:transparent !important; box-shadow:none !important; }
        .pastoral-visual-canvas [contenteditable='true'] ul { list-style:disc; padding-left:1.35em; }
        .pastoral-visual-canvas [contenteditable='true'] ol { list-style:decimal; padding-left:1.35em; }
        .pastoral-visual-canvas [contenteditable='true'] blockquote { border-left:3px solid currentColor; margin:.5em 0; padding-left:.75em; opacity:.92; }
        .pastoral-editor-v4 .pastoral-tool-button { display:grid !important; place-items:center !important; padding:0 !important; position:relative !important; isolation:isolate !important; }
        .pastoral-editor-v4 .pastoral-tool-button::before { top:50% !important; left:50% !important; width:44px !important; height:44px !important; transform:translate(-50%,-50%) scale(.9) !important; z-index:0 !important; }
        .pastoral-editor-v4 .pastoral-tool-button.is-active::before { transform:translate(-50%,-50%) scale(1) !important; }
        .pastoral-editor-v4 .pastoral-tool-button > svg { position:relative !important; z-index:1 !important; margin:0 !important; }
        .pastoral-editor-v4 [aria-label='Tamaño de letra actual'],
        .pastoral-editor-v4 [aria-label='Interlineado actual'] { color:#4f46e5; opacity:1; }
      `}</style>
    </div>
  )
}