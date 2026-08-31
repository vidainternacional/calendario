'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, BookOpen, Check,
  ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, EyeOff, FileDown, GripVertical, Image as ImageIcon, Italic,
  Layers, LayoutTemplate, Link2, List, ListOrdered, Loader2, Lock, Maximize2, Minimize2,
  Monitor, Palette, Plus, Redo2, Save, Share2, Square, Strikethrough,
  Trash2, Type, Underline, Undo2, Unlock, Upload,
} from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { subirArchivoBibliotecaPastoral } from '@/app/actions/pastoral-biblioteca'
import { mostrarToast } from '@/lib/ui/toast'
import PackageDistributionControls from '@/components/pastoral/PackageDistributionControls'
import PastoralVersePicker from '@/components/pastoral/PastoralVersePicker'
import PastoralVisualCanvas from '@/components/pastoral/PastoralVisualCanvas'
import { PALETAS_PRESENTACION, PLANTILLAS_VISUALES, type PaletaPresentacion, type PlantillaVisual } from '@/components/pastoral/pastoral-editor-presets'
import {
  ESTILOS_TEXTO, FUENTES_PASTORALES, TEMAS_LIENZO, clamp, clonar, limpiarHtmlCanvas,
  nuevaPaginaCanvas, nuevoIdCanvas, normalizarElementoCanvas, normalizarPaginaCanvas,
  type Alineacion, type DiapositivaCanvas, type ElementoCanvas, type RecursoPastoral,
  type ModoFusion, type RolTexto, type VistaLienzo,
} from '@/components/pastoral/pastoral-canvas-model'

type Audiencia = 'iglesia' | 'lideres' | 'servidores' | 'publico'
type Paquete = {
  id: string; titulo: string; descripcion_publica: string; instrucciones: string; notas_privadas: string
  bosquejo_id: string | null; coleccion_id: string | null; recurso_ids: string[]
  estado: 'borrador' | 'listo' | 'compartido'; presentacion_diapositivas: DiapositivaCanvas[]
  presentacion_pdf_recurso_id: string | null; audiencia: Audiencia; publicado: boolean; destacado: boolean
}
type Snapshot = { titulo: string; paginas: DiapositivaCanvas[]; indice: number }
type DestinoSubida = 'elemento' | 'fondo'
type GrupoPrincipal = 'fondos' | 'texto' | 'capas'
type PanelEditor = 'plantillas' | 'temas' | 'fondos' | 'recursos' | 'texto' | 'biblia' | 'capas' | 'diseno' | 'ajustes'
type ComandoEfectoTexto = 'bold' | 'italic' | 'underline' | 'strikeThrough'
type ComandoListaTexto = 'insertUnorderedList' | 'insertOrderedList'
type AtributoInlineVida = 'data-vida-size' | 'data-vida-line-height' | 'data-vida-color'
type ElementoCanvasEditor = ElementoCanvas & { bloqueado?: boolean; sombreado?: boolean }
type SwipeCapa = { id: string; x: number; y: number; desde: number }
type ArrastreCapa = {
  id: string
  y: number
  fila: HTMLElement | null
  ordenIds: string[]
  indiceOrigen: number
  indiceDestino: number
  altoFila: number
}
type EstadoFormatoSeleccion = {
  seleccionActiva: boolean
  bold: boolean
  italic: boolean
  underline: boolean
  strikeThrough: boolean
  unorderedList: boolean
  orderedList: boolean
}

const ESTADO_FORMATO_VACIO: EstadoFormatoSeleccion = {
  seleccionActiva: false,
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  unorderedList: false,
  orderedList: false,
}
const MAX_HISTORIAL = 80
const DESPLAZAMIENTO_ACCIONES_CAPA = 150
const HERRAMIENTAS: Array<{ id: GrupoPrincipal; label: string; icon: typeof LayoutTemplate }> = [
  { id: 'fondos', label: 'Fondos', icon: Palette },
  { id: 'texto', label: 'Texto', icon: Type },
  { id: 'capas', label: 'Capas', icon: Layers },
]
const SUBMENUS: Record<GrupoPrincipal, Array<{ id: PanelEditor; label: string }>> = {
  fondos: [],
  texto: [
    { id: 'texto', label: 'Herramientas' },
    { id: 'biblia', label: 'Biblia' },
  ],
  capas: [
    { id: 'capas', label: 'Capas' },
    { id: 'diseno', label: 'Relación' },
    { id: 'ajustes', label: 'Ajustes' },
  ],
}
const PANEL_INICIAL: Record<GrupoPrincipal, PanelEditor> = { fondos: 'fondos', texto: 'texto', capas: 'capas' }
const BANCOS_EXTERNOS = [
  { label: 'Unsplash', href: 'https://unsplash.com/' },
  { label: 'Pexels', href: 'https://www.pexels.com/' },
  { label: 'Pixabay', href: 'https://pixabay.com/' },
]
const COLORES_TEXTO = ['#0f172a', '#ffffff', '#334155', '#7f1d1d', '#14532d', '#1e3a8a', '#5b2733', '#3a2144']
const MODOS_FUSION: Array<{ id: ModoFusion; label: string }> = [
  { id: 'normal', label: 'Normal' },
  { id: 'multiply', label: 'Multiplicar' },
  { id: 'screen', label: 'Trama' },
  { id: 'overlay', label: 'Superponer' },
  { id: 'soft-light', label: 'Luz suave' },
  { id: 'hard-light', label: 'Luz fuerte' },
  { id: 'darken', label: 'Oscurecer' },
  { id: 'lighten', label: 'Aclarar' },
  { id: 'color-dodge', label: 'Sobreexponer color' },
  { id: 'color-burn', label: 'Subexponer color' },
  { id: 'difference', label: 'Diferencia' },
  { id: 'hue', label: 'Tono' },
  { id: 'saturation', label: 'Saturación' },
  { id: 'color', label: 'Color' },
  { id: 'luminosity', label: 'Luminosidad' },
]
const FUENTE_MUESTRA = FUENTES_PASTORALES.find((fuente) => fuente !== 'Inter') ?? FUENTES_PASTORALES[0] ?? 'Georgia'
const claseBotonActivo = (activo: boolean) => `pastoral-inline-icon ${activo ? 'is-active' : ''}`
const claseControlTexto = (activo = false) => `grid h-11 w-11 min-w-11 shrink-0 place-items-center rounded-full border text-slate-700 disabled:opacity-30 ${activo ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white'}`
const tamanoPlantillaCanvas = (pt: number) => Math.max(9, Math.round(pt * .56))
const TEXTOS_PLACEHOLDER_PLANTILLA = new Set(['Título', 'Subtítulo', 'Escribe el contenido', 'Escribe aquí'])

function textoPlano(html: string) {
  if (typeof window !== 'undefined') { const div = document.createElement('div'); div.innerHTML = limpiarHtmlCanvas(html); return div.innerText.trim() }
  return String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function nombreCapa(elemento: ElementoCanvas) {
  if (elemento.es_capa_fondo || elemento.fondo_visual) return 'Fondo'
  if (elemento.tipo === 'imagen') return 'Imagen'
  if (elemento.tipo === 'versiculo') return 'Versículo'
  if (elemento.rol === 'titulo') return 'Título'
  if (elemento.rol === 'subtitulo') return 'Subtítulo'
  if (elemento.rol === 'cuerpo') return 'Cuerpo'
  return 'Texto'
}

function textoMuestraPlantilla(plantilla: PlantillaVisual, rol: RolTexto) {
  if (rol === 'titulo') return plantilla.nombre
  if (rol === 'subtitulo') return `Estilo ${plantilla.categoria.toLowerCase()}`
  return `Composición ${plantilla.nombre.toLowerCase()}`
}

function esTextoMuestraPlantilla(elemento: ElementoCanvas) {
  if (elemento.tipo === 'imagen' || elemento.fondo_visual) return false
  const contenido = textoPlano(elemento.contenido ?? '')
  if (!contenido || TEXTOS_PLACEHOLDER_PLANTILLA.has(contenido)) return true
  return PLANTILLAS_VISUALES.some((plantilla) =>
    contenido === textoMuestraPlantilla(plantilla, 'titulo') ||
    contenido === textoMuestraPlantilla(plantilla, 'subtitulo') ||
    contenido === textoMuestraPlantilla(plantilla, 'cuerpo'))
}

function normalizarPaginaEditor(item: DiapositivaCanvas) {
  const normal = normalizarPaginaCanvas(item)
  const originales = new Map((item.elementos ?? []).map((elemento) => [elemento.id, elemento as ElementoCanvasEditor]))
  return {
    ...normal,
    formato: '16:9' as const,
    elementos: (normal.elementos ?? []).map((elemento) => {
      const original = originales.get(elemento.id)
      return { ...elemento, bloqueado: Boolean(original?.bloqueado), sombreado: Boolean(original?.sombreado) } as ElementoCanvasEditor
    }),
  }
}

export default function PastoralVisualWorkspaceV4({ paquete, biblioteca }: { paquete: Paquete; coleccion: unknown; biblioteca: RecursoPastoral[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const undoRef = useRef<Snapshot[]>([])
  const redoRef = useRef<Snapshot[]>([])
  const touchStart = useRef(0)
  const autosaveReadyRef = useRef(false)
  const autosaveSerialRef = useRef(0)
  const capaSwipeRef = useRef<SwipeCapa | null>(null)
  const capaDragRef = useRef<ArrastreCapa | null>(null)
  const [vista, setVista] = useState<VistaLienzo>('contenido')
  const [grupoPrincipal, setGrupoPrincipal] = useState<GrupoPrincipal | null>('fondos')
  const [panel, setPanel] = useState<PanelEditor | null>('fondos')
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [paginas, setPaginas] = useState<DiapositivaCanvas[]>(paquete.presentacion_diapositivas?.length ? paquete.presentacion_diapositivas.map(normalizarPaginaEditor) : [nuevaPaginaCanvas()])
  const [indice, setIndice] = useState(0)
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [modoPresentacion, setModoPresentacion] = useState(false)
  const [viewportVertical, setViewportVertical] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [guardandoAuto, setGuardandoAuto] = useState(false)
  const [busquedaRecursos, setBusquedaRecursos] = useState('')
  const [paletaTextoAbierta, setPaletaTextoAbierta] = useState(false)
  const [estadoFormatoSeleccion, setEstadoFormatoSeleccion] = useState<EstadoFormatoSeleccion>(ESTADO_FORMATO_VACIO)
  const [tecladoAbierto, setTecladoAbierto] = useState(false)
  const [tecladoInset, setTecladoInset] = useState(0)
  const [capaAccionesAbiertas, setCapaAccionesAbiertas] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [, startSubida] = useTransition()
  const [destinoSubida, setDestinoSubida] = useState<DestinoSubida>('elemento')
  const [recursoPendiente, setRecursoPendiente] = useState<{ id: string; destino: DestinoSubida } | null>(null)
  const [versionHistorial, setVersionHistorial] = useState(0)
  const [selectorFondoAbierto, setSelectorFondoAbierto] = useState(false)
  const [selectorImagenesAbierto, setSelectorImagenesAbierto] = useState(false)
  const [tonoFondoPersonalizado, setTonoFondoPersonalizado] = useState(260)
  const [saturacionFondoPersonalizado, setSaturacionFondoPersonalizado] = useState(70)
  const [luminosidadFondoPersonalizado, setLuminosidadFondoPersonalizado] = useState(52)
  const pagina = paginas[indice] ?? paginas[0]
  const elementoSeleccionado = (pagina?.elementos?.find((item) => item.id === seleccion) ?? null) as ElementoCanvasEditor | null
  const textoSeleccionado = elementoSeleccionado && elementoSeleccionado.tipo !== 'imagen' && !elementoSeleccionado.fondo_visual ? elementoSeleccionado : null
  const fondoVisualDesbloqueado = Boolean(pagina?.elementos?.some((item) => item.es_capa_fondo || item.fondo_visual))
  const imagenes = useMemo(() => biblioteca.filter((item) => item.mime_type?.startsWith('image/') && item.acceso_url), [biblioteca])
  const recursosFiltrados = useMemo(() => {
    const q = busquedaRecursos.trim().toLowerCase()
    return q ? imagenes.filter((item) => `${item.titulo} ${item.descripcion} ${item.categoria}`.toLowerCase().includes(q)) : imagenes
  }, [imagenes, busquedaRecursos])
  const paletasColoresFlat = useMemo(() => PALETAS_PRESENTACION.filter((paleta) => paleta.id.startsWith('fondo-flat-')).slice(0, 10), [])
  const paletasDegradados = useMemo(() => PALETAS_PRESENTACION.filter((paleta) => paleta.id.startsWith('fondo-gradient-')).slice(0, 20), [])
  const paletasTexturas = useMemo(() => PALETAS_PRESENTACION.filter((paleta) => paleta.id.startsWith('fondo-texture-')).slice(0, 20), [])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    let frame = 0
    const actualizarTeclado = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const activo = document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable
        const inset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
        const abierto = activo && inset > 100
        setTecladoAbierto(abierto)
        setTecladoInset(abierto ? inset : 0)
      })
    }
    actualizarTeclado()
    viewport.addEventListener('resize', actualizarTeclado)
    viewport.addEventListener('scroll', actualizarTeclado)
    window.addEventListener('focusin', actualizarTeclado)
    window.addEventListener('focusout', actualizarTeclado)
    return () => {
      window.cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', actualizarTeclado)
      viewport.removeEventListener('scroll', actualizarTeclado)
      window.removeEventListener('focusin', actualizarTeclado)
      window.removeEventListener('focusout', actualizarTeclado)
    }
  }, [])

  useEffect(() => {
    const actualizarOrientacion = () => setViewportVertical(window.innerHeight >= window.innerWidth)
    actualizarOrientacion()
    window.addEventListener('resize', actualizarOrientacion)
    window.visualViewport?.addEventListener('resize', actualizarOrientacion)
    return () => {
      window.removeEventListener('resize', actualizarOrientacion)
      window.visualViewport?.removeEventListener('resize', actualizarOrientacion)
    }
  }, [])

  useEffect(() => {
    if (!tecladoAbierto) return
    const frame = window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-pastoral-format-section="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
    return () => window.cancelAnimationFrame(frame)
  }, [tecladoAbierto])

  const snapshot = (): Snapshot => ({ titulo, paginas: clonar(paginas), indice })
  const registrarHistorial = () => { undoRef.current = [...undoRef.current.slice(-(MAX_HISTORIAL - 1)), snapshot()]; redoRef.current = []; setVersionHistorial((v) => v + 1) }
  const restaurar = (s: Snapshot) => { setTitulo(s.titulo); setPaginas(clonar(s.paginas)); setIndice(Math.min(s.indice, s.paginas.length - 1)); setSeleccion(null); setCapaAccionesAbiertas(null) }
  const deshacer = () => { const anterior = undoRef.current.pop(); if (!anterior) return; redoRef.current.push(snapshot()); restaurar(anterior); setVersionHistorial((v) => v + 1) }
  const rehacer = () => { const siguiente = redoRef.current.pop(); if (!siguiente) return; undoRef.current.push(snapshot()); restaurar(siguiente); setVersionHistorial((v) => v + 1) }

  useEffect(() => {
    const teclado = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? rehacer() : deshacer() }
      if (event.key.toLowerCase() === 'y') { event.preventDefault(); rehacer() }
    }
    window.addEventListener('keydown', teclado)
    return () => window.removeEventListener('keydown', teclado)
  })

  const patchPaginaSinHistorial = (patch: Partial<DiapositivaCanvas>) => setPaginas((actuales) => actuales.map((item, i) => i === indice ? { ...item, ...patch } : item))
  const actualizarPagina = (patch: Partial<DiapositivaCanvas>) => { registrarHistorial(); patchPaginaSinHistorial(patch) }
  const patchElementoSinHistorial = (id: string, patch: Partial<ElementoCanvasEditor>) => setPaginas((actuales) => actuales.map((item, i) => i === indice ? { ...item, elementos: (item.elementos ?? []).map((el) => el.id === id ? { ...el, ...patch } : el) } : item))
  const actualizarElemento = (id: string, patch: Partial<ElementoCanvasEditor>) => { registrarHistorial(); patchElementoSinHistorial(id, patch) }

  const agregarElemento = (elemento: Partial<ElementoCanvasEditor>) => {
    registrarHistorial()
    const normalizado = normalizarElementoCanvas({ ...elemento, id: nuevoIdCanvas(), z: Math.max(0, ...(pagina.elementos ?? []).map((el) => el.z)) + 1 }, (pagina.elementos ?? []).length)
    const nuevo = { ...normalizado, bloqueado: Boolean(elemento.bloqueado), sombreado: Boolean(elemento.sombreado) } as ElementoCanvasEditor
    patchPaginaSinHistorial({ elementos: [...(pagina.elementos ?? []), nuevo] })
    setSeleccion(nuevo.id)
    return nuevo.id
  }
  const agregarTexto = (rol: RolTexto = 'libre') => {
    const estilo = ESTILOS_TEXTO.find((item) => item.id === rol) ?? ESTILOS_TEXTO[3]
    return agregarElemento({ tipo: 'texto', rol, contenido: rol === 'titulo' ? 'Título' : rol === 'subtitulo' ? 'Subtítulo' : rol === 'cuerpo' ? 'Escribe el contenido' : 'Escribe aquí', x: 10, y: rol === 'titulo' ? 12 : rol === 'subtitulo' ? 30 : 40, w: 80, h: rol === 'cuerpo' ? 34 : 22, tamano_fuente: estilo.pt, peso: estilo.peso, fuente: 'Inter', color: pagina.color_texto ?? '#0f172a' })
  }
  const aplicarRolTexto = (rol: RolTexto) => {
    if (!textoSeleccionado || textoSeleccionado.bloqueado) return
    if (textoSeleccionado.rol === rol) return actualizarElemento(textoSeleccionado.id, { rol: 'libre' })
    const estilo = ESTILOS_TEXTO.find((item) => item.id === rol) ?? ESTILOS_TEXTO[3]
    actualizarElemento(textoSeleccionado.id, { rol, tamano_fuente: estilo.pt, peso: estilo.peso })
  }
  const agregarImagen = (recurso: RecursoPastoral) => agregarElemento({ tipo: 'imagen', recurso_id: recurso.id, x: 12, y: 18, w: 56, h: 48, ajuste: 'cover', radio: 14 })
  const aplicarFondoImagen = (recurso: RecursoPastoral) => {
    const capaActiva = elementoSeleccionado as ElementoCanvasEditor | null
    if (capaActiva?.es_capa_fondo) {
      if (capaActiva.bloqueado) return mostrarToast('Desbloquea la capa antes de cambiar su fondo')
      actualizarElemento(capaActiva.id, { tipo: 'imagen', recurso_id: recurso.id, contenido: undefined, fondo_visual: undefined, x: 0, y: 0, w: 100, h: 100, ajuste: 'cover', radio: 0, es_capa_fondo: true })
      return
    }
    actualizarPagina({ fondo_modo: 'imagen', fondo: '#ffffff', fondo_recurso_id: recurso.id, recurso_id: recurso.id })
  }
  const eliminarElemento = (id: string) => { registrarHistorial(); patchPaginaSinHistorial({ elementos: (pagina.elementos ?? []).filter((el) => el.id !== id) }); setSeleccion(null); setCapaAccionesAbiertas(null) }
  const duplicarElemento = (id: string) => { const original = pagina.elementos?.find((el) => el.id === id) as ElementoCanvasEditor | undefined; if (!original) return; agregarElemento({ ...clonar(original), id: undefined, bloqueado: false, x: Math.min(original.x + 4, 90), y: Math.min(original.y + 4, 90), z: original.z + 1 }) }
  const alternarVisibilidadCapa = (id: string) => { const elemento = pagina.elementos?.find((el) => el.id === id); if (!elemento) return; actualizarElemento(id, { oculto: !elemento.oculto }) }
  const alternarBloqueoCapa = (id: string) => {
    const elemento = pagina.elementos?.find((el) => el.id === id) as ElementoCanvasEditor | undefined
    if (!elemento) return
    actualizarElemento(id, { bloqueado: !elemento.bloqueado })
    setCapaAccionesAbiertas(null)
  }
  const fijarOrdenCapaSinHistorial = (id: string, destino: number) => {
    setPaginas((actuales) => actuales.map((item, i) => {
      if (i !== indice) return item
      const elementos = item.elementos ?? []
      const orden = elementos.slice().sort((a, b) => b.z - a.z)
      const actual = orden.findIndex((elemento) => elemento.id === id)
      if (actual < 0) return item
      const destinoSeguro = Math.max(0, Math.min(orden.length - 1, destino))
      if (destinoSeguro === actual) return item
      const [movido] = orden.splice(actual, 1)
      orden.splice(destinoSeguro, 0, movido)
      const zPorId = new Map(orden.map((elemento, posicion) => [elemento.id, orden.length - posicion]))
      return { ...item, elementos: elementos.map((elemento) => ({ ...elemento, z: zPorId.get(elemento.id) ?? elemento.z })) }
    }))
  }
  const filasDeArrastre = (arrastre: ArrastreCapa | null) => {
    const lista = arrastre?.fila?.parentElement
    return lista ? Array.from(lista.querySelectorAll<HTMLElement>('[data-pastoral-layer-row="true"]')) : []
  }
  const limpiarEstiloArrastre = (arrastre: ArrastreCapa | null) => {
    filasDeArrastre(arrastre).forEach((fila) => {
      fila.style.removeProperty('transform')
      fila.style.removeProperty('z-index')
      fila.style.removeProperty('box-shadow')
      fila.style.removeProperty('transition')
      fila.style.removeProperty('will-change')
    })
  }
  const iniciarArrastreCapa = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    const elemento = pagina.elementos?.find((item) => item.id === id) as ElementoCanvasEditor | undefined
    if (!elemento || elemento.bloqueado) return
    event.preventDefault()
    event.stopPropagation()
    setSeleccion(id)
    setCapaAccionesAbiertas(null)
    const fila = event.currentTarget.closest<HTMLElement>('[data-pastoral-layer-row="true"]')
    const ordenIds = (pagina.elementos ?? []).slice().sort((a, b) => b.z - a.z).map((item) => item.id)
    const indiceOrigen = ordenIds.indexOf(id)
    if (indiceOrigen < 0) return
    const altoFila = Math.max(48, Math.round(fila?.getBoundingClientRect().height ?? 56))
    if (fila) {
      fila.style.transition = 'none'
      fila.style.willChange = 'transform'
    }
    capaDragRef.current = { id, y: event.clientY, fila, ordenIds, indiceOrigen, indiceDestino: indiceOrigen, altoFila }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moverArrastreCapa = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    const arrastre = capaDragRef.current
    if (!arrastre || arrastre.id !== id) return
    event.preventDefault()
    const deltaLibre = event.clientY - arrastre.y
    const deltaMinimo = -arrastre.indiceOrigen * arrastre.altoFila
    const deltaMaximo = (arrastre.ordenIds.length - 1 - arrastre.indiceOrigen) * arrastre.altoFila
    const delta = Math.max(deltaMinimo, Math.min(deltaMaximo, deltaLibre))
    const desplazamientoFilas = Math.round(delta / arrastre.altoFila)
    const destino = Math.max(0, Math.min(arrastre.ordenIds.length - 1, arrastre.indiceOrigen + desplazamientoFilas))
    arrastre.indiceDestino = destino
    filasDeArrastre(arrastre).forEach((fila) => {
      const filaId = fila.dataset.pastoralLayerId
      const indiceFila = filaId ? arrastre.ordenIds.indexOf(filaId) : -1
      if (filaId === id) {
        fila.style.transition = 'none'
        fila.style.transform = `translateY(${delta}px)`
        fila.style.zIndex = '30'
        fila.style.boxShadow = '0 8px 20px rgba(15,23,42,.12)'
        return
      }
      let compensacion = 0
      if (destino > arrastre.indiceOrigen && indiceFila > arrastre.indiceOrigen && indiceFila <= destino) compensacion = -arrastre.altoFila
      if (destino < arrastre.indiceOrigen && indiceFila >= destino && indiceFila < arrastre.indiceOrigen) compensacion = arrastre.altoFila
      fila.style.transition = 'transform 160ms cubic-bezier(.32,.72,0,1)'
      fila.style.transform = compensacion ? `translateY(${compensacion}px)` : 'translateY(0)'
    })
  }
  const terminarArrastreCapa = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    const arrastre = capaDragRef.current
    capaDragRef.current = null
    if (!arrastre || arrastre.id !== id) return
    if (arrastre.indiceDestino === arrastre.indiceOrigen) {
      limpiarEstiloArrastre(arrastre)
      return
    }
    registrarHistorial()
    limpiarEstiloArrastre(arrastre)
    fijarOrdenCapaSinHistorial(id, arrastre.indiceDestino)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }
  const cancelarArrastreCapa = () => {
    const arrastre = capaDragRef.current
    capaDragRef.current = null
    limpiarEstiloArrastre(arrastre)
  }
  const iniciarSwipeCapa = (event: React.TouchEvent<HTMLDivElement>, id: string) => {
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('[data-pastoral-layer-drag-handle="true"]')) return
    const toque = event.touches[0]
    if (!toque) return
    capaSwipeRef.current = { id, x: toque.clientX, y: toque.clientY, desde: capaAccionesAbiertas === id ? -DESPLAZAMIENTO_ACCIONES_CAPA : 0 }
  }
  const moverSwipeCapa = (event: React.TouchEvent<HTMLDivElement>, id: string) => {
    const inicio = capaSwipeRef.current
    const toque = event.touches[0]
    if (!inicio || inicio.id !== id || !toque) return
    const dx = toque.clientX - inicio.x
    const dy = toque.clientY - inicio.y
    if (Math.abs(dx) <= Math.abs(dy)) return
    const desplazamiento = Math.max(-DESPLAZAMIENTO_ACCIONES_CAPA, Math.min(0, inicio.desde + dx))
    event.currentTarget.style.transform = `translateX(${desplazamiento}px)`
  }
  const terminarSwipeCapa = (event: React.TouchEvent<HTMLDivElement>, id: string) => {
    const inicio = capaSwipeRef.current
    const toque = event.changedTouches[0]
    capaSwipeRef.current = null
    if (!inicio || inicio.id !== id || !toque) return
    const dx = toque.clientX - inicio.x
    const dy = toque.clientY - inicio.y
    event.currentTarget.style.removeProperty('transform')
    if (Math.abs(dx) <= Math.abs(dy)) return
    if (inicio.desde === 0 && dx < -34) setCapaAccionesAbiertas(id)
    else if (inicio.desde < 0 && dx > 26) setCapaAccionesAbiertas(null)
  }
  const convertirImagenEnFondo = (id: string) => {
    const elemento = pagina.elementos?.find((item) => item.id === id) as ElementoCanvasEditor | undefined
    if (!elemento || elemento.tipo !== 'imagen' || !elemento.recurso_id || elemento.bloqueado) return
    registrarHistorial()
    patchPaginaSinHistorial({ fondo_modo: 'imagen', fondo: '#ffffff', fondo_recurso_id: elemento.recurso_id, recurso_id: elemento.recurso_id, elementos: (pagina.elementos ?? []).filter((item) => item.id !== id) })
    setSeleccion(null)
    setCapaAccionesAbiertas(null)
    setDestinoSubida('fondo')
  }
  const restaurarFondoComoImagen = () => {
    const recursoId = pagina.fondo_recurso_id ?? pagina.recurso_id
    if (pagina.fondo_modo !== 'imagen' || !recursoId) return
    registrarHistorial()
    const z = Math.max(0, ...(pagina.elementos ?? []).map((elemento) => elemento.z)) + 1
    const normalizado = normalizarElementoCanvas({ tipo: 'imagen', recurso_id: recursoId, x: 12, y: 18, w: 56, h: 48, z, ajuste: 'contain', radio: 14, opacidad: 1 }, (pagina.elementos ?? []).length)
    const imagen = { ...normalizado, bloqueado: false } as ElementoCanvasEditor
    patchPaginaSinHistorial({ fondo_modo: 'color', fondo: '#ffffff', fondo_recurso_id: null, recurso_id: null, elementos: [...(pagina.elementos ?? []), imagen] })
    setSeleccion(imagen.id)
    setCapaAccionesAbiertas(null)
    setDestinoSubida('elemento')
  }
  const desbloquearFondo = () => {
    const recursoId = pagina.fondo_recurso_id ?? pagina.recurso_id
    registrarHistorial()
    const elementosAjustados = (pagina.elementos ?? []).map((elemento) => ({ ...elemento, z: Math.min(200, elemento.z + 1) }))
    if (pagina.fondo_modo === 'imagen' && recursoId) {
      const fondo = { ...normalizarElementoCanvas({ tipo: 'imagen', recurso_id: recursoId, x: 0, y: 0, w: 100, h: 100, z: 0, ajuste: 'cover', radio: 0, opacidad: 1, es_capa_fondo: true }, 0), bloqueado: false } as ElementoCanvasEditor
      patchPaginaSinHistorial({ fondo_modo: 'color', fondo: '#ffffff', fondo_recurso_id: null, recurso_id: null, elementos: [fondo, ...elementosAjustados] })
      setSeleccion(fondo.id)
    } else {
      const tema = TEMAS_LIENZO.find((item) => item.id === pagina.fondo_tema) ?? TEMAS_LIENZO[0]
      const fondoVisual = pagina.fondo_modo === 'tema' ? tema.css : pagina.fondo ?? '#ffffff'
      const fondo = { ...normalizarElementoCanvas({ tipo: 'texto', rol: 'libre', contenido: '', x: 0, y: 0, w: 100, h: 100, z: 0, fondo_visual: fondoVisual, es_capa_fondo: true }, 0), bloqueado: false } as ElementoCanvasEditor
      patchPaginaSinHistorial({ fondo_modo: 'color', fondo: '#ffffff', fondo_recurso_id: null, recurso_id: null, elementos: [fondo, ...elementosAjustados] })
      setSeleccion(fondo.id)
    }
    setCapaAccionesAbiertas(null)
    setDestinoSubida('elemento')
  }

  const crearCapaFondo = () => {
    registrarHistorial()
    const existentes = pagina.elementos ?? []
    const fondos = existentes.filter((elemento) => Boolean(elemento.es_capa_fondo || elemento.fondo_visual)).slice().sort((a, b) => a.z - b.z)
    const contenido = existentes.filter((elemento) => !elemento.es_capa_fondo && !elemento.fondo_visual).slice().sort((a, b) => a.z - b.z)
    const fondosOrdenados = fondos.map((elemento, posicion) => ({ ...elemento, z: posicion + 1 }))
    const capa = { ...normalizarElementoCanvas({ tipo: 'texto', rol: 'libre', contenido: '', x: 0, y: 0, w: 100, h: 100, z: fondosOrdenados.length + 1, fondo_visual: '#00000000', opacidad: 1, modo_fusion: 'normal', es_capa_fondo: true }, existentes.length), bloqueado: false } as ElementoCanvasEditor
    const contenidoOrdenado = contenido.map((elemento, posicion) => ({ ...elemento, z: fondosOrdenados.length + 2 + posicion }))
    patchPaginaSinHistorial({ elementos: [...fondosOrdenados, capa, ...contenidoOrdenado] })
    setSeleccion(capa.id)
    setCapaAccionesAbiertas(null)
    mostrarToast('Nueva capa creada')
  }
  const aplicarFondoSeleccionado = (fondo: string) => {
    const capaActiva = elementoSeleccionado as ElementoCanvasEditor | null
    if (capaActiva?.es_capa_fondo) {
      if (capaActiva.bloqueado) return mostrarToast('Desbloquea la capa antes de cambiar su fondo')
      actualizarElemento(capaActiva.id, { tipo: 'texto', contenido: '', recurso_id: null, fondo_visual: fondo, x: 0, y: 0, w: 100, h: 100, es_capa_fondo: true })
      return
    }
    actualizarPagina({ fondo_modo: 'color', fondo, fondo_recurso_id: null, recurso_id: null })
  }
  const aplicarFondoVisual = (paleta: PaletaPresentacion) => aplicarFondoSeleccionado(paleta.fondo)

  const tonoComplementario = (tonoFondoPersonalizado + 180) % 360
  const fondoPersonalizadoPlano = `hsl(${tonoFondoPersonalizado}, ${saturacionFondoPersonalizado}%, ${luminosidadFondoPersonalizado}%)`
  const fondoPersonalizadoDegradado = `linear-gradient(135deg,hsl(${tonoFondoPersonalizado}, ${saturacionFondoPersonalizado}%, ${luminosidadFondoPersonalizado}%) 0%,hsl(${tonoComplementario}, ${Math.max(35, saturacionFondoPersonalizado - 10)}%, ${Math.min(78, luminosidadFondoPersonalizado + 12)}%) 100%)`
  const fondoPersonalizadoTextura = `repeating-linear-gradient(135deg,hsla(${tonoComplementario}, ${saturacionFondoPersonalizado}%, ${Math.max(22, luminosidadFondoPersonalizado - 12)}%, .16) 0 2px,transparent 2px 11px),linear-gradient(hsl(${tonoFondoPersonalizado}, ${Math.max(24, saturacionFondoPersonalizado - 22)}%, ${Math.min(90, luminosidadFondoPersonalizado + 22)}%),hsl(${tonoFondoPersonalizado}, ${Math.max(28, saturacionFondoPersonalizado - 12)}%, ${Math.max(18, luminosidadFondoPersonalizado - 8)}%))`
  const aplicarFondoPersonalizado = (fondo: string) => aplicarFondoSeleccionado(fondo)

  const aplicarPaleta = (paleta: PaletaPresentacion) => {
    registrarHistorial()
    const elementos = (pagina.elementos ?? []).filter((elemento) => !elemento.fondo_visual).map((elemento) => elemento.tipo === 'imagen' ? elemento : {
      ...elemento,
      color: elemento.rol === 'titulo' ? paleta.titulo : paleta.texto,
    })
    patchPaginaSinHistorial({ fondo_modo: 'color', fondo: paleta.fondo, fondo_recurso_id: null, recurso_id: null, color_texto: paleta.texto, elementos })
  }

  const aplicarPlantilla = (plantilla: PlantillaVisual) => {
    registrarHistorial()
    const actuales = (pagina.elementos ?? []).filter((item) => !item.fondo_visual)
    const textos = actuales.filter((item) => item.tipo !== 'imagen')
    const tieneTextoUsuario = textos.some((item) => !esTextoMuestraPlantilla(item))

    if (tieneTextoUsuario) {
      const sinMuestras = actuales.filter((item) => item.tipo === 'imagen' || !esTextoMuestraPlantilla(item))
      const textosUsuario = sinMuestras
        .filter((item) => item.tipo !== 'imagen')
        .slice()
        .sort((a, b) => (a.y - b.y) || (a.x - b.x))
      const layoutsDisponibles: Array<{ rol: RolTexto; layout: PlantillaVisual['titulo'] }> = [
        { rol: 'titulo', layout: plantilla.titulo },
        ...(plantilla.subtitulo ? [{ rol: 'subtitulo' as RolTexto, layout: plantilla.subtitulo }] : []),
        ...(plantilla.cuerpo ? [{ rol: 'cuerpo' as RolTexto, layout: plantilla.cuerpo }] : []),
      ]
      const usados = new Set<RolTexto>()
      const layoutPorId = new Map<string, { rol: RolTexto; layout: PlantillaVisual['titulo'] }>()
      const buscarLayoutRol = (rol: RolTexto | undefined) => {
        if (rol === 'titulo') return layoutsDisponibles.find((item) => item.rol === 'titulo') ?? null
        if (rol === 'subtitulo') return layoutsDisponibles.find((item) => item.rol === 'subtitulo') ?? null
        if (rol === 'cuerpo') return layoutsDisponibles.find((item) => item.rol === 'cuerpo') ?? null
        return null
      }

      textosUsuario.forEach((elemento) => {
        if (elemento.rol === 'libre' || (elemento.rol && usados.has(elemento.rol))) return
        const candidato = buscarLayoutRol(elemento.rol)
        if (!candidato) return
        layoutPorId.set(elemento.id, candidato)
        usados.add(candidato.rol)
      })
      textosUsuario.forEach((elemento) => {
        if (layoutPorId.has(elemento.id)) return
        const disponible = layoutsDisponibles.find((item) => !usados.has(item.rol))
        if (!disponible) return
        layoutPorId.set(elemento.id, disponible)
        usados.add(disponible.rol)
      })

      const elementos = sinMuestras.map((elemento) => {
        if (elemento.tipo === 'imagen') return elemento
        const destino = layoutPorId.get(elemento.id)
        if (!destino) return { ...elemento, color: plantilla.colorTexto }
        const { rol, layout } = destino
        const x = clamp(layout.x, 0, 95)
        const y = clamp(layout.y, 0, 95)
        return {
          ...elemento,
          rol,
          x,
          y,
          w: clamp(layout.w, 5, 100 - x),
          h: clamp(layout.h, 5, 100 - y),
          tamano_fuente: tamanoPlantillaCanvas(layout.pt),
          alineacion: layout.alineacion,
          fuente: layout.fuente,
          color: plantilla.colorTexto,
          peso: rol === 'titulo' ? 800 : rol === 'subtitulo' ? 700 : 500,
        }
      })
      patchPaginaSinHistorial({ plantilla: 'limpia', fondo_modo: 'color', fondo: plantilla.fondo, fondo_recurso_id: null, recurso_id: null, color_texto: plantilla.colorTexto, elementos })
      setSeleccion(null)
      return
    }

    const imagenesActuales = actuales.filter((item) => item.tipo === 'imagen')
    const zBase = Math.max(1, ...actuales.map((item) => item.z))
    const crearMuestra = (rol: RolTexto, layout: PlantillaVisual['titulo']) => {
      const x = clamp(layout.x, 0, 95)
      const y = clamp(layout.y, 0, 95)
      return normalizarElementoCanvas({
        tipo: 'texto', rol, contenido: textoMuestraPlantilla(plantilla, rol), x, y, w: clamp(layout.w, 5, 100 - x), h: clamp(layout.h, 5, 100 - y),
        tamano_fuente: tamanoPlantillaCanvas(layout.pt), alineacion: layout.alineacion, fuente: layout.fuente, color: plantilla.colorTexto,
        peso: rol === 'titulo' ? 800 : rol === 'subtitulo' ? 700 : 500, z: zBase + (rol === 'titulo' ? 3 : rol === 'subtitulo' ? 2 : 1),
      })
    }
    const siguientes: ElementoCanvas[] = [
      ...imagenesActuales,
      crearMuestra('titulo', plantilla.titulo),
      ...(plantilla.subtitulo ? [crearMuestra('subtitulo', plantilla.subtitulo)] : []),
      ...(plantilla.cuerpo ? [crearMuestra('cuerpo', plantilla.cuerpo)] : []),
    ]
    patchPaginaSinHistorial({ plantilla: 'limpia', fondo_modo: 'color', fondo: plantilla.fondo, fondo_recurso_id: null, recurso_id: null, color_texto: plantilla.colorTexto, elementos: siguientes })
    setSeleccion(null)
  }

  const nuevaPagina = () => { registrarHistorial(); setPaginas((actuales) => [...actuales, nuevaPaginaCanvas()]); setIndice(paginas.length); setSeleccion(null) }
  const eliminarPagina = (i = indice) => {
    if (paginas.length === 1) return
    if (!window.confirm(`¿Eliminar Página ${i + 1}? Puedes recuperarla con Deshacer mientras no recargues.`)) return
    registrarHistorial(); const siguientes = paginas.filter((_, p) => p !== i); setPaginas(siguientes); setIndice(Math.min(i, siguientes.length - 1)); setSeleccion(null)
  }
  const editorTextoActual = () => {
    if (!textoSeleccionado) return null
    const contenedor = Array.from(document.querySelectorAll<HTMLElement>('[data-canvas-element-id]')).find((item) => item.dataset.canvasElementId === textoSeleccionado.id)
    return contenedor?.querySelector<HTMLElement>('[contenteditable="true"]') ?? null
  }
  const rangoSeleccionTexto = (editor: HTMLElement) => {
    const seleccionVentana = window.getSelection()
    if (!seleccionVentana || seleccionVentana.rangeCount === 0 || seleccionVentana.isCollapsed) return null
    const rango = seleccionVentana.getRangeAt(0)
    return editor.contains(rango.commonAncestorContainer) ? rango : null
  }
  const haySeleccionDePalabras = (editor: HTMLElement) => Boolean(rangoSeleccionTexto(editor))
  const seleccionCubreTodo = (editor: HTMLElement) => {
    const seleccionVentana = window.getSelection()
    if (!rangoSeleccionTexto(editor) || !seleccionVentana) return false
    const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim()
    return Boolean(normalizar(editor.innerText)) && normalizar(seleccionVentana.toString()) === normalizar(editor.innerText)
  }
  const leerEstadoFormatoSeleccion = () => {
    const editor = editorTextoActual()
    if (!editor) { setEstadoFormatoSeleccion(ESTADO_FORMATO_VACIO); return }
    const seleccionActiva = haySeleccionDePalabras(editor)
    const consultar = (comando: string) => {
      if (!seleccionActiva) return false
      try { return document.queryCommandState(comando) } catch { return false }
    }
    setEstadoFormatoSeleccion({
      seleccionActiva,
      bold: consultar('bold'),
      italic: consultar('italic'),
      underline: consultar('underline'),
      strikeThrough: consultar('strikeThrough'),
      unorderedList: seleccionActiva ? consultar('insertUnorderedList') : Boolean(editor.querySelector('ul')),
      orderedList: seleccionActiva ? consultar('insertOrderedList') : Boolean(editor.querySelector('ol')),
    })
  }
  useEffect(() => {
    const actualizar = () => leerEstadoFormatoSeleccion()
    document.addEventListener('selectionchange', actualizar)
    actualizar()
    return () => document.removeEventListener('selectionchange', actualizar)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccion, textoSeleccionado?.contenido])
  const formatoActivo = (comando: keyof Pick<EstadoFormatoSeleccion, 'bold' | 'italic' | 'underline' | 'strikeThrough'>, fallback: boolean) => estadoFormatoSeleccion.seleccionActiva ? estadoFormatoSeleccion[comando] : fallback
  const valorInlineActual = (editor: HTMLElement, atributo: AtributoInlineVida, fallback: number) => {
    const seleccionVentana = window.getSelection()
    const nodo = seleccionVentana?.anchorNode
    const elemento = nodo instanceof HTMLElement ? nodo : nodo?.parentElement
    const span = elemento?.closest<HTMLElement>(`span[${atributo}]`)
    if (!span || !editor.contains(span)) return fallback
    const valor = Number(span.getAttribute(atributo))
    return Number.isFinite(valor) ? valor : fallback
  }
  const aplicarAtributoSeleccion = (editor: HTMLElement, atributo: AtributoInlineVida, valor: string) => {
    const rango = rangoSeleccionTexto(editor)
    const seleccionVentana = window.getSelection()
    if (!rango || !seleccionVentana) return false
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
    const nodos: Text[] = []
    let actual = walker.nextNode()
    while (actual) {
      if (actual.textContent && rango.intersectsNode(actual)) nodos.push(actual as Text)
      actual = walker.nextNode()
    }
    const creados: HTMLElement[] = []
    nodos.reverse().forEach((nodo) => {
      const longitud = nodo.data.length
      const inicio = nodo === rango.startContainer ? rango.startOffset : 0
      const fin = nodo === rango.endContainer ? rango.endOffset : longitud
      if (fin <= inicio) return
      const parcial = document.createRange()
      parcial.setStart(nodo, Math.max(0, Math.min(inicio, longitud)))
      parcial.setEnd(nodo, Math.max(0, Math.min(fin, longitud)))
      const span = document.createElement('span')
      span.setAttribute(atributo, valor)
      parcial.surroundContents(span)
      creados.push(span)
    })
    if (!creados.length) return false
    const ordenados = creados.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
    const nuevoRango = document.createRange()
    nuevoRango.setStartBefore(ordenados[0])
    nuevoRango.setEndAfter(ordenados[ordenados.length - 1])
    seleccionVentana.removeAllRanges()
    seleccionVentana.addRange(nuevoRango)
    return true
  }
  const persistirInline = (editor: HTMLElement) => textoSeleccionado && patchElementoSinHistorial(textoSeleccionado.id, { contenido: limpiarHtmlCanvas(editor.innerHTML) })
  const aplicarEfectoTexto = (comando: ComandoEfectoTexto, patchCaja: Partial<ElementoCanvasEditor>) => {
    if (!textoSeleccionado || textoSeleccionado.bloqueado) return
    const editor = editorTextoActual()
    if (editor && haySeleccionDePalabras(editor)) {
      registrarHistorial()
      document.execCommand(comando)
      persistirInline(editor)
      leerEstadoFormatoSeleccion()
      return
    }
    actualizarElemento(textoSeleccionado.id, patchCaja)
  }
  const aplicarColorTexto = (color: string) => {
    if (!textoSeleccionado || textoSeleccionado.bloqueado) return
    const editor = editorTextoActual()
    if (editor && haySeleccionDePalabras(editor) && !seleccionCubreTodo(editor)) {
      registrarHistorial()
      if (aplicarAtributoSeleccion(editor, 'data-vida-color', color)) persistirInline(editor)
    } else actualizarElemento(textoSeleccionado.id, { color })
  }
  const comandoParrafo = (comando: ComandoListaTexto) => {
    if (!textoSeleccionado || textoSeleccionado.bloqueado) return
    const editor = editorTextoActual()
    if (!editor) return
    const seleccionVentana = window.getSelection()
    const habiaSeleccion = Boolean(rangoSeleccionTexto(editor))
    registrarHistorial()
    if (!habiaSeleccion && seleccionVentana) {
      editor.focus({ preventScroll: true })
      const rangoCompleto = document.createRange()
      rangoCompleto.selectNodeContents(editor)
      seleccionVentana.removeAllRanges()
      seleccionVentana.addRange(rangoCompleto)
    }
    document.execCommand(comando)
    patchElementoSinHistorial(textoSeleccionado.id, { contenido: limpiarHtmlCanvas(editor.innerHTML) })
    leerEstadoFormatoSeleccion()
    if (!habiaSeleccion) seleccionVentana?.collapseToEnd()
  }
  const agregarVersiculo = (versiculo: { referencia: string; texto: string; traduccion: string }) => {
    const contenido = `<strong>${versiculo.referencia}${versiculo.traduccion ? ` · ${versiculo.traduccion}` : ''}</strong><br>${versiculo.texto}`
    agregarElemento({ tipo: 'versiculo', rol: 'cuerpo', contenido, x: 10, y: 20 + Math.min((pagina.elementos?.length ?? 0) * 3, 35), w: 80, h: 28, tamano_fuente: 18, fuente: 'Inter', alineacion: 'izquierda', peso: 500, interlineado: 1.35, color: pagina.color_texto ?? '#0f172a', sombreado: false })
  }

  const prepararSubida = (destino: DestinoSubida) => { setDestinoSubida(destino); fileInputRef.current?.click() }
  const subirImagen = (archivo: File | undefined) => {
    if (!archivo) return
    const destino = destinoSubida
    startSubida(async () => {
      const data = new FormData(); data.set('titulo', archivo.name.replace(/\.[^.]+$/, '').slice(0, 140) || 'Imagen'); data.set('archivo', archivo); data.set('categoria', 'multimedia'); data.set('paquete_id', paquete.id)
      const resultado = await subirArchivoBibliotecaPastoral(data)
      if (!resultado.success || !resultado.resourceId) return mostrarToast(resultado.error ?? 'No se pudo subir la imagen')
      setRecursoPendiente({ id: resultado.resourceId, destino }); mostrarToast('Imagen subida'); router.refresh()
    })
  }
  useEffect(() => {
    if (!recursoPendiente) return
    const recurso = biblioteca.find((item) => item.id === recursoPendiente.id && item.acceso_url)
    if (!recurso) return
    if (recursoPendiente.destino === 'fondo') aplicarFondoImagen(recurso); else agregarImagen(recurso)
    setRecursoPendiente(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biblioteca, recursoPendiente])

  const recursosUsados = () => Array.from(new Set([...(paquete.recurso_ids ?? []), ...paginas.flatMap((p) => [p.fondo_recurso_id, p.recurso_id, ...(p.elementos ?? []).map((el) => el.recurso_id)].filter(Boolean) as string[])])).slice(0, 30)
  const construirFormulario = () => {
    const data = new FormData(); data.set('titulo', titulo); data.set('descripcion_publica', paquete.descripcion_publica); data.set('instrucciones', paquete.instrucciones); data.set('notas_privadas', paquete.notas_privadas ?? ''); data.set('estado', paquete.estado); data.set('bosquejo_id', paquete.bosquejo_id ?? ''); data.set('coleccion_id', paquete.coleccion_id ?? ''); data.set('presentacion_pdf_recurso_id', paquete.presentacion_pdf_recurso_id ?? '')
    recursosUsados().forEach((id) => data.append('recurso_ids', id))
    paginas.forEach((item) => {
      const tituloLegado = textoPlano(item.elementos?.find((el) => el.rol === 'titulo')?.contenido ?? item.titulo ?? '').slice(0, 160)
      const contenidoLegado = (item.elementos ?? []).filter((el) => el.tipo !== 'imagen' && !el.fondo_visual && el.rol !== 'titulo').map((el) => limpiarHtmlCanvas(el.contenido ?? '')).join('<br>').slice(0, 12000)
      data.append('diapositiva_titulo', tituloLegado); data.append('diapositiva_contenido', contenidoLegado); data.append('diapositiva_recurso_id', item.recurso_id ?? ''); data.append('diapositiva_plantilla', item.plantilla ?? 'limpia'); data.append('diapositiva_fondo', item.fondo ?? '#ffffff'); data.append('diapositiva_color_texto', item.color_texto ?? '#0f172a'); data.append('diapositiva_alineacion', item.alineacion ?? 'izquierda'); data.append('diapositiva_tamano', item.tamano ?? 'normal'); data.append('diapositiva_formato', item.formato ?? '16:9'); data.append('diapositiva_fondo_modo', item.fondo_modo ?? 'color'); data.append('diapositiva_fondo_tema', item.fondo_tema ?? 'claro'); data.append('diapositiva_fondo_recurso_id', item.fondo_recurso_id ?? ''); data.append('diapositiva_elementos', JSON.stringify(item.elementos ?? []))
    })
    return data
  }

  const guardar = () => startTransition(async () => {
    const resultado = await editarPaquetePastoral(paquete.id, construirFormulario())
    if (!resultado.success) return mostrarToast(resultado.error)
    setGuardado(true); window.setTimeout(() => setGuardado(false), 1500); mostrarToast('Proyecto guardado')
  })

  const guardarAutomatico = async () => {
    const serial = ++autosaveSerialRef.current
    setGuardandoAuto(true)
    const resultado = await editarPaquetePastoral(paquete.id, construirFormulario())
    if (serial !== autosaveSerialRef.current) return
    setGuardandoAuto(false)
    if (resultado.success) { setGuardado(true); window.setTimeout(() => setGuardado(false), 900) }
  }

  useEffect(() => {
    if (!autosaveReadyRef.current) { autosaveReadyRef.current = true; return }
    const timer = window.setTimeout(() => { void guardarAutomatico() }, 650)
    return () => window.clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo, paginas])

  const cambiarVista = (siguiente: VistaLienzo) => { setSeleccion(null); setCapaAccionesAbiertas(null); setVista(siguiente) }
  const irPagina = (siguiente: number) => {
    const seguro = Math.min(Math.max(siguiente, 0), paginas.length - 1)
    if (seguro === indice) return
    setIndice(seguro)
    setSeleccion(null)
    setCapaAccionesAbiertas(null)
  }
  const moverPresentacion = (delta: number) => setIndice((actual) => Math.min(Math.max(actual + delta, 0), paginas.length - 1))
  const abrirPantallaCompleta = async () => { setModoPresentacion(true); try { await document.documentElement.requestFullscreen?.() } catch {} }
  const cerrarPantallaCompleta = async () => { setModoPresentacion(false); try { if (document.fullscreenElement) await document.exitFullscreen?.() } catch {} }
  const copiarEnlaceActual = async () => { try { await navigator.clipboard.writeText(window.location.href); mostrarToast('Enlace del proyecto copiado') } catch { mostrarToast('No se pudo copiar el enlace') } }
  const compartirInterno = async () => { try { if (navigator.share) await navigator.share({ title: titulo, text: 'Proyecto de Centro Pastoral', url: window.location.href }); else await copiarEnlaceActual() } catch {} }
  const alinear = (alineacion: Alineacion) => textoSeleccionado && !textoSeleccionado.bloqueado && actualizarElemento(textoSeleccionado.id, { alineacion })
  const ajustarTamano = (delta: number) => {
    if (!textoSeleccionado || textoSeleccionado.bloqueado) return
    const editor = editorTextoActual()
    if (editor && haySeleccionDePalabras(editor) && !seleccionCubreTodo(editor)) {
      const actual = valorInlineActual(editor, 'data-vida-size', Math.round(textoSeleccionado.tamano_fuente ?? 24))
      const siguiente = Math.min(160, Math.max(8, actual + delta))
      registrarHistorial()
      if (aplicarAtributoSeleccion(editor, 'data-vida-size', String(siguiente))) persistirInline(editor)
      return
    }
    const actual = Math.round(textoSeleccionado.tamano_fuente ?? 24)
    actualizarElemento(textoSeleccionado.id, { tamano_fuente: Math.min(160, Math.max(8, actual + delta)) })
  }
  const ajustarLinea = (delta: number) => {
    if (!textoSeleccionado || textoSeleccionado.bloqueado) return
    const editor = editorTextoActual()
    if (editor && haySeleccionDePalabras(editor) && !seleccionCubreTodo(editor)) {
      const actual = valorInlineActual(editor, 'data-vida-line-height', textoSeleccionado.interlineado ?? 1.25)
      const siguiente = Math.round(Math.min(3, Math.max(.8, actual + delta)) * 100) / 100
      registrarHistorial()
      if (aplicarAtributoSeleccion(editor, 'data-vida-line-height', String(siguiente))) persistirInline(editor)
      return
    }
    const actual = textoSeleccionado.interlineado ?? 1.25
    const siguiente = Math.round(Math.min(3, Math.max(.8, actual + delta)) * 100) / 100
    actualizarElemento(textoSeleccionado.id, { interlineado: siguiente })
  }
  const alternarGrupoPrincipal = (grupo: GrupoPrincipal) => {
    if (grupoPrincipal === grupo) { setGrupoPrincipal(null); setPanel(null); return }
    setGrupoPrincipal(grupo)
    setPanel(PANEL_INICIAL[grupo])
  }
  const alternarSubpanel = (siguiente: PanelEditor) => setPanel((actual) => actual === siguiente ? null : siguiente)
  const etiquetaRolTexto = textoSeleccionado?.rol === 'titulo' ? 'Título' : textoSeleccionado?.rol === 'subtitulo' ? 'Subtítulo' : textoSeleccionado?.rol === 'cuerpo' ? 'Cuerpo' : textoSeleccionado?.rol === 'libre' ? 'Texto' : 'Selecciona texto'
  const fuenteTextoActual = textoSeleccionado?.fuente ?? 'Fuente'
  const clasePanel = panel ? `panel-${panel}` : `panel-${grupoPrincipal ?? 'vacio'}`
  const estiloStage = { '--pastoral-stage-mobile-height': tecladoAbierto ? 'clamp(118px, 20dvh, 168px)' : 'clamp(210px, 32dvh, 300px)', height: 'clamp(250px, 52dvh, 640px)' } as CSSProperties
  const ratioPresentacion = pagina?.formato === '9:16' ? 9 / 16 : pagina?.formato === '4:3' ? 4 / 3 : pagina?.formato === '1:1' ? 1 : 16 / 9
  const presentarHorizontalGirado = Boolean(modoPresentacion && viewportVertical && (pagina?.formato === '16:9' || pagina?.formato === '4:3'))
  const estiloPresentacionHorizontal = presentarHorizontalGirado ? {
    width: `min(100dvh, calc(100dvw * ${ratioPresentacion}))`,
    aspectRatio: String(ratioPresentacion),
    transform: 'rotate(90deg)',
    transformOrigin: 'center',
  } as CSSProperties : undefined
  void versionHistorial
  void claseBotonActivo

  const panelContenido = pagina && panel ? <>

    {panel === 'fondos' && <div className="pastoral-panel-content grid gap-3 pb-3 pt-1">
      <div className="grid grid-cols-3 gap-2" aria-label="Acciones de fondo">
        <button type="button" onClick={() => { setSelectorFondoAbierto((abierto) => !abierto); setSelectorImagenesAbierto(false) }} className={`grid min-h-[74px] place-items-center gap-1 rounded-2xl border bg-white px-2 py-2 text-center ${selectorFondoAbierto ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200'}`} aria-expanded={selectorFondoAbierto} aria-controls="pastoral-selector-fondo-libre">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white shadow-sm" style={{ background: 'conic-gradient(#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#8b5cf6,#d946ef,#ef4444)' }}><span className="h-3.5 w-3.5 rounded-full border-2 border-white" style={{ background: fondoPersonalizadoPlano }} /></span>
          <span className="text-[10px] font-black text-slate-700">Rueda de color</span>
        </button>
        <button type="button" onClick={() => { setSelectorImagenesAbierto((abierto) => !abierto); setSelectorFondoAbierto(false) }} className={`grid min-h-[74px] place-items-center gap-1 rounded-2xl border bg-white px-2 py-2 text-center ${selectorImagenesAbierto ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200'}`} aria-expanded={selectorImagenesAbierto} aria-controls="pastoral-selector-imagenes">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600"><ImageIcon className="h-4 w-4" /></span>
          <span className="text-[10px] font-black text-slate-700">Imágenes</span>
        </button>
        <button type="button" onClick={crearCapaFondo} className="grid min-h-[74px] place-items-center gap-1 rounded-2xl border border-slate-200 bg-white px-2 py-2 text-center" aria-label="Crear nueva capa para fondo">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Plus className="h-4 w-4" /></span>
          <span className="text-[10px] font-black text-slate-700">Nueva capa</span>
        </button>
      </div>

      {selectorFondoAbierto && <section id="pastoral-selector-fondo-libre" className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-3">
        <div className="grid grid-cols-[64px_1fr] items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-slate-200" style={{ background: 'conic-gradient(#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#8b5cf6,#d946ef,#ef4444)' }}><span className="h-7 w-7 rounded-full border-[3px] border-white shadow" style={{ background: fondoPersonalizadoPlano }} /></div>
          <div className="grid gap-2">
            <label className="grid gap-1 text-[10px] font-bold text-slate-500">Tono · {tonoFondoPersonalizado}°<input type="range" min="0" max="359" value={tonoFondoPersonalizado} onInput={(event) => setTonoFondoPersonalizado(Number(event.currentTarget.value))} onChange={(event) => setTonoFondoPersonalizado(Number(event.currentTarget.value))} className="w-full accent-indigo-600" style={{ background: 'linear-gradient(90deg,#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#8b5cf6,#d946ef,#ef4444)' }} /></label>
            <label className="grid gap-1 text-[10px] font-bold text-slate-500">Saturación · {saturacionFondoPersonalizado}%<input type="range" min="0" max="100" value={saturacionFondoPersonalizado} onInput={(event) => setSaturacionFondoPersonalizado(Number(event.currentTarget.value))} onChange={(event) => setSaturacionFondoPersonalizado(Number(event.currentTarget.value))} className="w-full accent-indigo-600" style={{ background: `linear-gradient(90deg,hsl(${tonoFondoPersonalizado},0%,${luminosidadFondoPersonalizado}%),hsl(${tonoFondoPersonalizado},100%,${luminosidadFondoPersonalizado}%))` }} /></label>
            <label className="grid gap-1 text-[10px] font-bold text-slate-500">Luminosidad · {luminosidadFondoPersonalizado}%<input type="range" min="8" max="92" value={luminosidadFondoPersonalizado} onInput={(event) => setLuminosidadFondoPersonalizado(Number(event.currentTarget.value))} onChange={(event) => setLuminosidadFondoPersonalizado(Number(event.currentTarget.value))} className="w-full accent-indigo-600" style={{ background: `linear-gradient(90deg,hsl(${tonoFondoPersonalizado},${saturacionFondoPersonalizado}%,8%),hsl(${tonoFondoPersonalizado},${saturacionFondoPersonalizado}%,50%),hsl(${tonoFondoPersonalizado},${saturacionFondoPersonalizado}%,92%))` }} /></label>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => aplicarFondoPersonalizado(fondoPersonalizadoPlano)} className="grid gap-1 rounded-xl border border-slate-200 bg-white p-2 text-[10px] font-bold text-slate-600"><span className="mx-auto h-8 w-8 rounded-full border border-slate-200" style={{ background: fondoPersonalizadoPlano }} />Plano</button>
          <button type="button" onClick={() => aplicarFondoPersonalizado(fondoPersonalizadoDegradado)} className="grid gap-1 rounded-xl border border-slate-200 bg-white p-2 text-[10px] font-bold text-slate-600"><span className="mx-auto h-8 w-8 rounded-full border border-slate-200" style={{ background: fondoPersonalizadoDegradado }} />Degradado</button>
          <button type="button" onClick={() => aplicarFondoPersonalizado(fondoPersonalizadoTextura)} className="grid gap-1 rounded-xl border border-slate-200 bg-white p-2 text-[10px] font-bold text-slate-600"><span className="mx-auto h-8 w-8 rounded-full border border-slate-200" style={{ background: fondoPersonalizadoTextura }} />Textura</button>
        </div>
      </section>}

      {selectorImagenesAbierto && <section id="pastoral-selector-imagenes" className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => prepararSubida('fondo')} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"><Upload className="h-4 w-4" /> Subir imagen</button>
          <label className="min-w-0 flex-1"><span className="sr-only">Buscar imágenes</span><input value={busquedaRecursos} onChange={(event) => setBusquedaRecursos(event.target.value)} placeholder="Buscar" className="min-h-10 w-full rounded-full border border-slate-200 bg-white px-3 text-xs outline-none" /></label>
        </div>
        {recursosFiltrados.length ? <div className="grid grid-cols-4 gap-2">{recursosFiltrados.map((recurso) => <button key={recurso.id} type="button" onClick={() => aplicarFondoImagen(recurso)} className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50" aria-label={`Usar ${recurso.titulo} como fondo`} title={recurso.titulo}><img src={recurso.acceso_url ?? ''} alt="" className="h-full w-full object-cover" /></button>)}</div> : <p className="text-[10px] text-slate-400">No hay imágenes disponibles todavía.</p>}
      </section>}

      <div className="pastoral-background-grid" aria-label="Galería de fondos">
        {[...paletasColoresFlat, ...paletasDegradados, ...paletasTexturas].map((paleta) => <button key={paleta.id} type="button" onClick={() => aplicarFondoVisual(paleta)} className="pastoral-background-swatch" aria-label={`Aplicar fondo ${paleta.label}`} title={paleta.label}><span style={{ background: paleta.fondo }} /></button>)}
      </div>
      {elementoSeleccionado?.es_capa_fondo && <p className="px-1 text-[10px] font-semibold text-indigo-600">El fondo elegido se aplicará a la capa seleccionada. La fusión y opacidad se controlan únicamente desde Capas.</p>}
    </div>}

    {panel === 'texto' && <div className="pastoral-panel-content grid h-full w-full content-start gap-3 overflow-visible pr-1">
      <section className="grid gap-2 border-b border-slate-200 pb-3">
        <div className="px-1 text-[11px] font-black text-slate-500">Estilo · {etiquetaRolTexto}</div>
        <div className="grid grid-cols-[56px_repeat(3,minmax(0,1fr))] items-end gap-1" aria-label="Opciones de estilo de texto">
          <button type="button" onClick={() => agregarTexto('libre')} className="flex min-h-12 items-center justify-center gap-0.5 border-b-2 border-transparent px-1 pb-2 pt-1 text-slate-700" aria-label="Agregar texto" title="Agregar texto"><span className="text-base font-black">A</span><span className="text-sm font-black">+</span></button>
          {ESTILOS_TEXTO.filter((item) => item.id !== 'libre').map((estilo) => <button key={estilo.id} type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => aplicarRolTexto(estilo.id)} aria-pressed={textoSeleccionado?.rol === estilo.id} className={`min-h-12 min-w-0 whitespace-nowrap border-b-2 px-0.5 pb-2 pt-1 text-center disabled:opacity-30 ${estilo.id === 'titulo' ? 'text-[15px] font-extrabold' : estilo.id === 'subtitulo' ? 'text-[13px] font-semibold' : 'text-[11px] font-normal'} ${textoSeleccionado?.rol === estilo.id ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-600'}`}>{estilo.label}</button>)}
        </div>
      </section>

      <section data-pastoral-format-section="true" className={`grid gap-2 border-b border-slate-200 pb-3 ${tecladoAbierto ? 'sticky top-0 z-30 bg-[#f4f5f9] pt-1' : ''}`}>
        <div className="px-1 text-[11px] font-black text-slate-500">Formato · listas · tamaño · alineación</div>
        <div className="flex w-full touch-pan-x items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="toolbar" aria-label="Formato listas tamaño interlineado y alineación">
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => textoSeleccionado && aplicarEfectoTexto('bold', { peso: (textoSeleccionado.peso ?? 500) >= 700 ? 500 : 800 })} className={claseControlTexto(formatoActivo('bold', Boolean(textoSeleccionado && (textoSeleccionado.peso ?? 500) >= 700)))} aria-label="Negrita" aria-pressed={formatoActivo('bold', Boolean(textoSeleccionado && (textoSeleccionado.peso ?? 500) >= 700))}><Bold className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => textoSeleccionado && aplicarEfectoTexto('italic', { cursiva: !textoSeleccionado.cursiva })} className={claseControlTexto(formatoActivo('italic', Boolean(textoSeleccionado?.cursiva)))} aria-label="Cursiva" aria-pressed={formatoActivo('italic', Boolean(textoSeleccionado?.cursiva))}><Italic className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => textoSeleccionado && aplicarEfectoTexto('underline', { subrayado: !textoSeleccionado.subrayado })} className={claseControlTexto(formatoActivo('underline', Boolean(textoSeleccionado?.subrayado)))} aria-label="Subrayado" aria-pressed={formatoActivo('underline', Boolean(textoSeleccionado?.subrayado))}><Underline className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => textoSeleccionado && aplicarEfectoTexto('strikeThrough', { tachado: !textoSeleccionado.tachado })} className={claseControlTexto(formatoActivo('strikeThrough', Boolean(textoSeleccionado?.tachado)))} aria-label="Tachado" aria-pressed={formatoActivo('strikeThrough', Boolean(textoSeleccionado?.tachado))}><Strikethrough className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => setPaletaTextoAbierta((actual) => !actual)} className={claseControlTexto(paletaTextoAbierta)} aria-label="Color de texto" aria-expanded={paletaTextoAbierta} aria-pressed={paletaTextoAbierta}><span className="h-5 w-5 rounded-full border border-slate-300" style={{ backgroundColor: textoSeleccionado?.color ?? '#0f172a' }} /></button>
          <span className="h-7 w-px shrink-0 bg-slate-200" aria-hidden="true" />
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertUnorderedList')} className={claseControlTexto(estadoFormatoSeleccion.unorderedList)} aria-label="Lista con viñetas" aria-pressed={estadoFormatoSeleccion.unorderedList}><List className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertOrderedList')} className={claseControlTexto(estadoFormatoSeleccion.orderedList)} aria-label="Lista numerada" aria-pressed={estadoFormatoSeleccion.orderedList}><ListOrdered className="h-4 w-4" /></button>
          <span className="h-7 w-px shrink-0 bg-slate-200" aria-hidden="true" />
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => ajustarTamano(-1)} className={claseControlTexto(false)} aria-label="Reducir tamaño de letra"><span className="text-xs font-black">A−</span></button>
          <button type="button" disabled className={`${claseControlTexto(false)} text-[11px] font-black text-slate-500 opacity-100`} aria-label="Tamaño de letra actual">{Math.round(textoSeleccionado?.tamano_fuente ?? 24)}</button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => ajustarTamano(1)} className={claseControlTexto(false)} aria-label="Aumentar tamaño de letra"><span className="text-xs font-black">A+</span></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => ajustarLinea(-0.05)} className={claseControlTexto(false)} aria-label="Reducir interlineado"><span className="text-xs font-black">↕−</span></button>
          <button type="button" disabled className={`${claseControlTexto(false)} text-[10px] font-black text-slate-500 opacity-100`} aria-label="Interlineado actual">{(textoSeleccionado?.interlineado ?? 1.25).toFixed(2)}</button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => ajustarLinea(0.05)} className={claseControlTexto(false)} aria-label="Aumentar interlineado"><span className="text-xs font-black">↕+</span></button>
          <span className="h-7 w-px shrink-0 bg-slate-200" aria-hidden="true" />
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => alinear('izquierda')} className={claseControlTexto(textoSeleccionado?.alineacion === 'izquierda')} aria-label="Alinear a la izquierda"><AlignLeft className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => alinear('centro')} className={claseControlTexto(textoSeleccionado?.alineacion === 'centro')} aria-label="Centrar"><AlignCenter className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => alinear('derecha')} className={claseControlTexto(textoSeleccionado?.alineacion === 'derecha')} aria-label="Alinear a la derecha"><AlignRight className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => alinear('justificado')} className={claseControlTexto(textoSeleccionado?.alineacion === 'justificado')} aria-label="Justificar"><AlignJustify className="h-4 w-4" /></button>
        </div>
        {paletaTextoAbierta && <div className="flex w-full touch-pan-x gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Colores de texto">{COLORES_TEXTO.map((color) => <button key={color} type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => aplicarColorTexto(color)} className={`h-10 w-10 shrink-0 rounded-full border-2 ${textoSeleccionado?.color === color ? 'border-indigo-500' : 'border-slate-200'}`} style={{ backgroundColor: color }} aria-label={`Color de texto ${color}`} />)}</div>}
      </section>

      <section className="grid gap-2 pb-2">
        <details className="group">
          <summary onPointerDown={(e) => e.preventDefault()} className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 [&::-webkit-details-marker]:hidden" aria-label="Elegir fuente"><span className="min-w-0 truncate">Fuente · {fuenteTextoActual}</span><span className="flex shrink-0 items-center gap-2"><span className="text-lg font-bold text-slate-600" style={{ fontFamily: textoSeleccionado?.fuente ?? FUENTE_MUESTRA }}>Aa</span><span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span></span></summary>
          <div className="mt-2 grid grid-cols-2 gap-2" aria-label="Fuentes disponibles">{FUENTES_PASTORALES.map((fuente) => <button key={fuente} type="button" disabled={!textoSeleccionado || textoSeleccionado.bloqueado} onPointerDown={(e) => e.preventDefault()} onClick={() => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { fuente })} className={`min-h-11 min-w-0 rounded-full border px-3 text-xs font-bold ${textoSeleccionado?.fuente === fuente ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`} style={{ fontFamily: fuente }}><span className="block truncate">{fuente}</span></button>)}</div>
        </details>
      </section>
    </div>}

    {panel === 'biblia' && <PastoralVersePicker open embedded onClose={() => undefined} onInsert={agregarVersiculo} />}

    {panel === 'diseno' && <div className="pastoral-panel-content"><div className="pastoral-panel-heading"><h3>Relación de aspecto</h3><p>Formato único para proyector y visualización horizontal en celular.</p></div><div className="pastoral-aspect-control"><button type="button" onClick={() => pagina.formato !== '16:9' && actualizarPagina({ formato: '16:9' })} className="is-active"><Monitor /><span><strong>16:9</strong><small>Horizontal</small></span></button></div></div>}

    {panel === 'capas' && <div className="pastoral-panel-content grid gap-3">
      {elementoSeleccionado && <div className="grid gap-2 border-b border-slate-200 px-1 pb-3">
        <div className="flex items-center gap-3"><span className="w-[78px] shrink-0 text-[11px] font-black text-slate-500">Opacidad</span><input type="range" min="0.1" max="1" step="0.05" disabled={elementoSeleccionado.bloqueado} value={elementoSeleccionado.opacidad ?? 1} onPointerDown={() => !elementoSeleccionado.bloqueado && registrarHistorial()} onInput={(e) => !elementoSeleccionado.bloqueado && patchElementoSinHistorial(elementoSeleccionado.id, { opacidad: Number(e.currentTarget.value) })} onChange={(e) => !elementoSeleccionado.bloqueado && patchElementoSinHistorial(elementoSeleccionado.id, { opacidad: Number(e.currentTarget.value) })} className="min-w-0 flex-1 touch-none disabled:opacity-30" aria-label="Opacidad de la capa seleccionada" /><span className="w-10 text-right text-[11px] font-bold text-slate-500">{Math.round((elementoSeleccionado.opacidad ?? 1) * 100)}%</span></div>
        <label className="flex items-center gap-3"><span className="w-[78px] shrink-0 text-[11px] font-black text-slate-500">Fusión</span><select disabled={elementoSeleccionado.bloqueado} value={elementoSeleccionado.modo_fusion ?? 'normal'} onPointerDown={() => !elementoSeleccionado.bloqueado && registrarHistorial()} onChange={(event) => !elementoSeleccionado.bloqueado && patchElementoSinHistorial(elementoSeleccionado.id, { modo_fusion: event.target.value as ModoFusion })} className="min-h-10 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none disabled:opacity-30" aria-label="Modo de fusión de la capa seleccionada">{MODOS_FUSION.map((modo) => <option key={modo.id} value={modo.id}>{modo.label}</option>)}</select></label>
        <small className="pl-[90px] leading-4 text-slate-400">La capa seleccionada se fusiona visualmente con todas las capas que tenga debajo, sin destruir ninguna.</small>
      </div>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Lista vertical de capas">
        {(pagina.elementos ?? []).slice().sort((a, b) => b.z - a.z).map((elementoBase) => {
          const elemento = elementoBase as ElementoCanvasEditor
          const recursoCapa = elemento.tipo === 'imagen' ? biblioteca.find((item) => item.id === elemento.recurso_id) : null
          const resumen = elemento.fondo_visual ? 'Fondo editable' : elemento.tipo === 'imagen' ? recursoCapa?.titulo ?? 'Imagen' : textoPlano(elemento.contenido ?? '') || nombreCapa(elemento)
          const accionesAbiertas = capaAccionesAbiertas === elemento.id
          return <div key={elemento.id} data-pastoral-layer-row="true" data-pastoral-layer-id={elemento.id} className="relative overflow-hidden border-b border-slate-100 last:border-b-0">
            <div className={`absolute inset-y-0 right-2 flex items-center gap-2 transition-opacity duration-150 ${accionesAbiertas ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!accionesAbiertas}>
              <button type="button" tabIndex={accionesAbiertas ? 0 : -1} onClick={() => { setSeleccion(elemento.id); duplicarElemento(elemento.id); setCapaAccionesAbiertas(null) }} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600" aria-label={`Duplicar ${nombreCapa(elemento)}`}><Copy className="h-4 w-4" /></button>
              <button type="button" tabIndex={accionesAbiertas ? 0 : -1} onClick={() => { setSeleccion(elemento.id); alternarBloqueoCapa(elemento.id) }} className={`grid h-10 w-10 place-items-center rounded-full border bg-white ${elemento.bloqueado ? 'border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-600'}`} aria-label={elemento.bloqueado ? `Desbloquear ${nombreCapa(elemento)}` : `Bloquear ${nombreCapa(elemento)}`}>{elemento.bloqueado ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</button>
              <button type="button" tabIndex={accionesAbiertas ? 0 : -1} onClick={() => { setSeleccion(elemento.id); eliminarElemento(elemento.id) }} className="grid h-10 w-10 place-items-center rounded-full border border-rose-200 bg-white text-rose-600" aria-label={`Eliminar ${nombreCapa(elemento)}`}><Trash2 className="h-4 w-4" /></button>
            </div>
            <div data-pastoral-layer-content="true" onTouchStart={(event) => iniciarSwipeCapa(event, elemento.id)} onTouchMove={(event) => moverSwipeCapa(event, elemento.id)} onTouchEnd={(event) => terminarSwipeCapa(event, elemento.id)} className={`relative flex min-h-14 items-center transition-[transform,background-color] duration-200 ${seleccion === elemento.id ? 'bg-indigo-50' : 'bg-white'}`} style={{ transform: accionesAbiertas ? `translateX(-${DESPLAZAMIENTO_ACCIONES_CAPA}px)` : 'translateX(0)' }}>
              <button type="button" onClick={() => alternarVisibilidadCapa(elemento.id)} className="grid h-11 w-11 shrink-0 place-items-center text-slate-500" aria-label={elemento.oculto ? `Mostrar ${nombreCapa(elemento)}` : `Ocultar ${nombreCapa(elemento)}`} aria-pressed={!elemento.oculto}>{elemento.oculto ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              <button type="button" onClick={() => { setSeleccion(elemento.id); setCapaAccionesAbiertas(null) }} className="flex min-w-0 flex-1 items-center gap-3 px-1 py-2 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-500">{recursoCapa?.acceso_url ? <img src={recursoCapa.acceso_url} alt="" className="h-full w-full object-cover" /> : elemento.fondo_visual ? <Square className="h-4 w-4" /> : elemento.tipo === 'versiculo' ? <BookOpen className="h-4 w-4" /> : elemento.tipo === 'imagen' ? <ImageIcon className="h-4 w-4" /> : <Type className="h-4 w-4" />}</span>
                <span className="min-w-0 flex-1"><strong className="flex items-center gap-1 truncate text-xs font-bold text-slate-700">{nombreCapa(elemento)}{elemento.bloqueado && <Lock className="h-3 w-3 shrink-0 text-slate-400" />}</strong><small className="block truncate text-[10px] text-slate-400">{resumen}</small></span>
              </button>
              <button type="button" data-pastoral-layer-drag-handle="true" disabled={elemento.bloqueado} onPointerDown={(event) => iniciarArrastreCapa(event, elemento.id)} onPointerMove={(event) => moverArrastreCapa(event, elemento.id)} onPointerUp={(event) => terminarArrastreCapa(event, elemento.id)} onPointerCancel={cancelarArrastreCapa} className="grid h-12 w-10 shrink-0 touch-none place-items-center text-slate-400 disabled:opacity-25" aria-label={`Mover capa ${nombreCapa(elemento)}`} title="Arrastra para subir o bajar"><GripVertical className="h-5 w-5" /></button>
            </div>
          </div>
        })}
        <div className="flex min-h-14 items-center bg-slate-50/70 px-3 text-slate-500"><span className="grid h-10 w-10 place-items-center"><Lock className="h-4 w-4" /></span><span className="ml-2 min-w-0 flex-1"><strong className="block text-xs font-bold">Fondo de página</strong><small className="block truncate text-[10px] text-slate-400">{fondoVisualDesbloqueado ? 'Fondo editable en capas' : pagina.fondo_modo === 'imagen' ? 'Imagen de fondo · bloqueada' : 'Tema o plantilla · bloqueado'}</small></span>{!fondoVisualDesbloqueado && <button type="button" onClick={desbloquearFondo} className="grid h-10 w-10 place-items-center rounded-full text-indigo-600" aria-label="Desbloquear fondo" title="Convertir el fondo en una capa editable"><Unlock className="h-4 w-4" /></button>}</div>
      </div>
      <p className="px-1 text-[10px] leading-4 text-slate-400">Arrastra ⋮ para cambiar el orden. Desliza una capa a la izquierda para duplicar, bloquear o eliminar.</p>
    </div>}

    {panel === 'ajustes' && <div className="pastoral-panel-content pastoral-layers-panel">
      {elementoSeleccionado?.tipo === 'imagen' ? <div className="pastoral-layer-actions"><button type="button" disabled={elementoSeleccionado.bloqueado} onClick={() => actualizarElemento(elementoSeleccionado.id, { ajuste: elementoSeleccionado.ajuste === 'contain' ? 'cover' : 'contain' })}>Ajuste: {elementoSeleccionado.ajuste === 'contain' ? 'Contener' : 'Cubrir'}</button><button type="button" disabled={elementoSeleccionado.bloqueado} onClick={() => convertirImagenEnFondo(elementoSeleccionado.id)}>Como fondo</button><label>Opacidad <input type="range" min="0.1" max="1" step="0.05" disabled={elementoSeleccionado.bloqueado} value={elementoSeleccionado.opacidad ?? 1} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { opacidad: Number(e.target.value) })} /></label><label>Esquinas <input type="range" min="0" max="40" disabled={elementoSeleccionado.bloqueado} value={elementoSeleccionado.radio ?? 14} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { radio: Number(e.target.value) })} /></label></div> : elementoSeleccionado?.tipo === 'versiculo' ? <div className="pastoral-layer-actions"><button type="button" disabled={elementoSeleccionado.bloqueado} onClick={() => actualizarElemento(elementoSeleccionado.id, { sombreado: !elementoSeleccionado.sombreado })}>Sombreado: {elementoSeleccionado.sombreado ? 'Activado' : 'Desactivado'}</button></div> : <p className="pastoral-empty-panel">Selecciona una imagen o versículo para ajustar su apariencia.</p>}
    </div>}
  </> : null

  return <div className="pastoral-content-workspace pastoral-canva-workspace pastoral-editor-v3 pastoral-editor-v4 text-slate-900">
    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { subirImagen(event.target.files?.[0]); event.currentTarget.value = '' }} />
    <header className="sticky top-0 z-50 -mx-4 bg-[#f8f8f6]/96 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-2"><button type="button" onClick={() => router.back()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-600" aria-label="Volver al Centro Pastoral" title="Atrás"><ChevronLeft className="h-5 w-5" /></button><input dir="ltr" value={titulo} onFocus={registrarHistorial} onChange={(event) => setTitulo(event.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none sm:text-lg" /><button type="button" onClick={deshacer} disabled={!undoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Deshacer"><Undo2 className="h-4 w-4" /></button><button type="button" onClick={rehacer} disabled={!redoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Rehacer"><Redo2 className="h-4 w-4" /></button>{guardandoAuto ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-label="Guardando automáticamente" /> : guardado ? <Check className="h-4 w-4 text-emerald-600" /> : null}<button type="button" onClick={guardar} disabled={isPending} className="grid h-10 w-10 place-items-center rounded-full text-[#C0392B] disabled:opacity-60" aria-label="Guardar proyecto">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />}</button></div>
      <nav className="mt-1.5 flex items-center gap-5 overflow-x-auto text-xs font-bold text-slate-400 [scrollbar-width:none]"><button type="button" onClick={() => cambiarVista('contenido')} className={vista === 'contenido' ? 'text-[#C0392B]' : ''}>Editar</button><button type="button" onClick={() => cambiarVista('presentacion')} className={vista === 'presentacion' ? 'text-[#C0392B]' : ''}>Presentar</button><button type="button" onClick={() => cambiarVista('congregacion')} className={vista === 'congregacion' ? 'text-[#C0392B]' : ''}>Congregación</button><div className="flex min-w-max items-center justify-center gap-0.5"><button type="button" onClick={() => cambiarVista('publicar')} className={vista === 'publicar' ? 'text-[#C0392B]' : ''}>Compartir</button>{vista === 'contenido' && <><button type="button" onClick={() => irPagina(indice - 1)} disabled={indice === 0} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 disabled:opacity-25" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button><select value={indice} onChange={(event) => irPagina(Number(event.target.value))} aria-label={`Página ${indice + 1} de ${paginas.length}`} className="h-9 min-w-[48px] rounded-full border border-slate-200 bg-white px-1 text-center text-[10px] font-black text-slate-600 outline-none">{paginas.map((_, i) => <option key={i} value={i}>{i + 1}/{paginas.length}</option>)}</select><button type="button" onClick={() => irPagina(indice + 1)} disabled={indice === paginas.length - 1} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 disabled:opacity-25" aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={nuevaPagina} className="grid h-10 w-10 place-items-center text-indigo-600" aria-label="Nueva página" title="Nueva página"><Plus className="h-4 w-4" /></button>{paginas.length > 1 && <button type="button" onClick={() => eliminarPagina()} className="grid h-10 w-10 place-items-center text-rose-600" aria-label={`Eliminar Página ${indice + 1}`} title="Eliminar página"><Trash2 className="h-4 w-4 text-rose-600" /></button>}</>}</div></nav>
    </header>

    {vista === 'contenido' && pagina && <section className="pastoral-editor-section pb-4 pt-2">
      <div className="pastoral-editor-shell-flow flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f5f9]">
        <div className="pastoral-stage-flow flex w-full shrink-0 items-stretch" style={estiloStage}>
          <div className="pastoral-canvas-wrap w-full"><PastoralVisualCanvas key={`editar-${indice}`} pagina={pagina} biblioteca={biblioteca} editable seleccion={seleccion} onSelect={setSeleccion} onBeginChange={registrarHistorial} onPatchElement={patchElementoSinHistorial} onTextInput={(id, contenido) => patchElementoSinHistorial(id, { contenido })} onDeleteElement={eliminarElemento} /></div>
        </div>
        <div className="pastoral-editor-controls-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={tecladoAbierto ? { paddingBottom: `${Math.max(160, tecladoInset + 32)}px`, scrollPaddingBottom: `${Math.max(160, tecladoInset + 32)}px` } : undefined}>
          <div className="pastoral-tool-dock flex w-full items-center gap-2 px-2 py-2" aria-label="Herramientas del lienzo"><div className="flex min-w-0 flex-1 items-stretch gap-1 rounded-full border border-slate-200 bg-white p-1">{HERRAMIENTAS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => alternarGrupoPrincipal(id)} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full bg-transparent px-2 py-1 text-slate-600 shadow-none" aria-pressed={grupoPrincipal === id} aria-expanded={grupoPrincipal === id} aria-label={label} title={label}><Icon className={`h-[18px] w-[18px] ${grupoPrincipal === id ? 'text-indigo-600' : 'text-slate-500'}`} /><small className="text-[10px] font-bold text-slate-700">{label}</small></button>)}</div><button type="button" disabled={!elementoSeleccionado || elementoSeleccionado.bloqueado} onClick={() => elementoSeleccionado && eliminarElemento(elementoSeleccionado.id)} className="grid h-11 w-11 min-w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-30" aria-label="Borrar elemento seleccionado" title="Borrar"><Trash2 className="h-[18px] w-[18px]" /></button></div>
          {grupoPrincipal && <aside className={`pastoral-tool-panel-flow ${clasePanel}`} aria-label={`Panel ${grupoPrincipal}`}><div className="pastoral-tool-panel-flow-scroll px-3 pb-3 pt-2"><div className="flex flex-col">{SUBMENUS[grupoPrincipal].length > 0 && <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`Opciones de ${grupoPrincipal}`}>{SUBMENUS[grupoPrincipal].map((item) => <button key={item.id} type="button" onClick={() => alternarSubpanel(item.id)} className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-bold ${panel === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`} aria-pressed={panel === item.id}>{item.label}</button>)}</div>}<div className={`min-h-0 flex-1 ${SUBMENUS[grupoPrincipal].length > 0 ? 'pt-2' : ''}`}>{panelContenido}</div></div></div></aside>}
        </div>
      </div>
    </section>}

    {vista === 'presentacion' && pagina && <section className={modoPresentacion ? 'fixed inset-0 z-[170] flex items-center justify-center overflow-hidden bg-black' : 'relative pb-10 pt-5'}>{!modoPresentacion && <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Presentación</h2><p className="text-xs text-slate-500">Mismo lienzo y formato, sin reconstruir diapositivas.</p></div><button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs font-bold"><Maximize2 className="h-4 w-4" /> Pantalla completa</button></div>}{modoPresentacion && <button type="button" onClick={cerrarPantallaCompleta} className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[190] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white" aria-label="Salir de presentación"><Minimize2 className="h-5 w-5" /></button>}<div onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? 0 }} onTouchEnd={(e) => { const fin = e.changedTouches[0]?.clientX ?? touchStart.current; const delta = fin - touchStart.current; if (Math.abs(delta) > 45) moverPresentacion(delta < 0 ? 1 : -1) }} className={modoPresentacion ? 'flex h-full w-full items-center justify-center' : ''}><div className={presentarHorizontalGirado ? 'flex items-center justify-center' : 'w-full'} style={estiloPresentacionHorizontal}><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} fitViewport={modoPresentacion && !presentarHorizontalGirado} /></div></div><button type="button" onClick={() => moverPresentacion(-1)} disabled={indice === 0} className={`absolute left-2 top-1/2 z-[185] -translate-y-1/2 rounded-full p-2 ${modoPresentacion ? 'bg-black/45 text-white' : 'bg-white/85 shadow'} disabled:opacity-0`}><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => moverPresentacion(1)} disabled={indice === paginas.length - 1} className={`absolute right-2 top-1/2 z-[185] -translate-y-1/2 rounded-full p-2 ${modoPresentacion ? 'bg-black/45 text-white' : 'bg-white/85 shadow'} disabled:opacity-0`}><ChevronRight className="h-5 w-5" /></button></section>}

    {vista === 'congregacion' && pagina && <section className="pb-10 pt-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Vista de la congregación</h2><p className="text-xs text-slate-500">Exactamente la misma composición que se proyectará.</p></div><button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs font-bold"><Maximize2 className="h-4 w-4" /> Pantalla completa</button></div><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} />{modoPresentacion && <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black"><button type="button" onClick={cerrarPantallaCompleta} className="absolute right-3 top-3 z-[190] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white"><Minimize2 className="h-5 w-5" /></button><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} fitViewport /></div>}</section>}

    {vista === 'publicar' && <section className="pastoral-share-view space-y-4 pb-10 pt-5"><PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia} initialPublished={paquete.publicado} initialFeatured={paquete.destacado} /><div className="pastoral-share-actions"><button type="button" onClick={() => window.print()}><FileDown /><span>PDF</span></button><button type="button" onClick={compartirInterno}><Share2 /><span>Compartir</span></button><button type="button" onClick={copiarEnlaceActual}><Link2 /><span>Copiar enlace</span></button></div><p className="text-[11px] leading-5 text-slate-500">El enlace actual conserva el acceso de VIDA. Un enlace público para redes/WhatsApp y el control remoto OBS/proyector requieren una capa segura de publicación y emparejamiento; no se exponen anónimamente todavía.</p></section>}

    <div className="pastoral-print-deck hidden print:block">{paginas.map((item, i) => <section key={i} className="pastoral-print-page"><PastoralVisualCanvas pagina={item} biblioteca={biblioteca} /></section>)}</div>
  </div>
}