'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bold, BookOpen, Check, ChevronDown,
  ChevronLeft, ChevronRight, Copy, ExternalLink, FileDown, Image as ImageIcon, Italic, Layers,
  Link2, List, ListOrdered, Loader2, Maximize2, Minimize2, Monitor, Palette, Plus, Redo2, Save,
  Share2, Smartphone, Square, Strikethrough, Trash2, Type, Underline, Undo2, Upload,
} from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { subirArchivoBibliotecaPastoral } from '@/app/actions/pastoral-biblioteca'
import { mostrarToast } from '@/lib/ui/toast'
import PackageDistributionControls from '@/components/pastoral/PackageDistributionControls'
import PastoralVersePicker from '@/components/pastoral/PastoralVersePicker'
import PastoralVisualCanvas from '@/components/pastoral/PastoralVisualCanvas'
import {
  ESTILOS_TEXTO, FORMATOS_LIENZO, FUENTES_PASTORALES, TEMAS_LIENZO, clonar, limpiarHtmlCanvas, nuevaPaginaCanvas,
  nuevoIdCanvas, normalizarElementoCanvas, normalizarPaginaCanvas,
  type Alineacion, type DiapositivaCanvas, type ElementoCanvas, type PanelLienzo, type RecursoPastoral,
  type RolTexto, type TemaFondo, type VistaLienzo,
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
type Herramienta = 'plantillas' | Exclude<PanelLienzo, null> | null
type PlantillaVisual = {
  id: string
  nombre: string
  categoria: 'Cristianas' | 'Minimalistas' | 'Generales'
  fondoModo: 'color' | 'tema'
  fondo?: string
  tema?: TemaFondo
  colorTexto: string
  titulo: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
  subtitulo?: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
  cuerpo?: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
}

const MAX_HISTORIAL = 80
const HERRAMIENTAS: Array<{ id: Exclude<Herramienta, null>; label: string; icon: typeof Palette }> = [
  { id: 'plantillas', label: 'Plantillas', icon: Layers },
  { id: 'recursos', label: 'Elementos', icon: ImageIcon },
  { id: 'texto', label: 'Texto', icon: Type },
  { id: 'fondo', label: 'Fondo', icon: Palette },
  { id: 'biblia', label: 'Biblia', icon: BookOpen },
  { id: 'parrafo', label: 'Párrafo', icon: AlignLeft },
  { id: 'diseno', label: 'Diseño', icon: Monitor },
]
const BANCOS_EXTERNOS = [
  { label: 'Unsplash', href: 'https://unsplash.com/' },
  { label: 'Pexels', href: 'https://www.pexels.com/' },
  { label: 'Pixabay', href: 'https://pixabay.com/' },
]
const COLORES_FONDO = ['#ffffff', '#f8fafc', '#f5f3ff', '#fff7ed', '#0f172a', '#312e81', '#4c0519']
const COLORES_TEXTO = ['#0f172a', '#ffffff', '#312e81', '#7f1d1d', '#14532d', '#1e3a8a']
const claseBotonActivo = (activo: boolean) => `grid h-10 w-10 place-items-center rounded-full transition ${activo ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-slate-700'}`

const PLANTILLAS_VISUALES: PlantillaVisual[] = [
  {
    id: 'predicacion-limpia', nombre: 'Predicación limpia', categoria: 'Cristianas', fondoModo: 'color', fondo: '#ffffff', colorTexto: '#0f172a',
    titulo: { x: 9, y: 14, w: 82, h: 22, pt: 58, alineacion: 'izquierda', fuente: 'Inter' },
    subtitulo: { x: 9, y: 40, w: 72, h: 14, pt: 28, alineacion: 'izquierda', fuente: 'Georgia' },
    cuerpo: { x: 9, y: 60, w: 76, h: 25, pt: 21, alineacion: 'izquierda', fuente: 'Inter' },
  },
  {
    id: 'versiculo-protagonista', nombre: 'Versículo protagonista', categoria: 'Cristianas', fondoModo: 'tema', tema: 'noche', colorTexto: '#ffffff',
    titulo: { x: 10, y: 22, w: 80, h: 32, pt: 48, alineacion: 'centro', fuente: 'Georgia' },
    subtitulo: { x: 18, y: 62, w: 64, h: 14, pt: 22, alineacion: 'centro', fuente: 'Inter' },
  },
  {
    id: 'serie-dominical', nombre: 'Serie dominical', categoria: 'Cristianas', fondoModo: 'tema', tema: 'amanecer', colorTexto: '#431407',
    titulo: { x: 8, y: 18, w: 84, h: 24, pt: 62, alineacion: 'centro', fuente: 'Arial Black' },
    subtitulo: { x: 15, y: 48, w: 70, h: 14, pt: 28, alineacion: 'centro', fuente: 'Inter' },
    cuerpo: { x: 20, y: 68, w: 60, h: 16, pt: 20, alineacion: 'centro', fuente: 'Inter' },
  },
  {
    id: 'oracion-serena', nombre: 'Oración serena', categoria: 'Cristianas', fondoModo: 'tema', tema: 'cielo', colorTexto: '#172554',
    titulo: { x: 12, y: 18, w: 76, h: 24, pt: 52, alineacion: 'centro', fuente: 'Garamond' },
    cuerpo: { x: 16, y: 52, w: 68, h: 30, pt: 24, alineacion: 'centro', fuente: 'Georgia' },
  },
  {
    id: 'minimal-claro', nombre: 'Minimal claro', categoria: 'Minimalistas', fondoModo: 'color', fondo: '#f8fafc', colorTexto: '#0f172a',
    titulo: { x: 8, y: 18, w: 84, h: 24, pt: 64, alineacion: 'izquierda', fuente: 'Helvetica' },
    subtitulo: { x: 8, y: 48, w: 65, h: 14, pt: 24, alineacion: 'izquierda', fuente: 'Inter' },
  },
  {
    id: 'minimal-oscuro', nombre: 'Minimal oscuro', categoria: 'Minimalistas', fondoModo: 'color', fondo: '#0f172a', colorTexto: '#ffffff',
    titulo: { x: 10, y: 24, w: 80, h: 28, pt: 60, alineacion: 'centro', fuente: 'Inter' },
    cuerpo: { x: 18, y: 60, w: 64, h: 18, pt: 22, alineacion: 'centro', fuente: 'Inter' },
  },
  {
    id: 'mensaje-central', nombre: 'Mensaje central', categoria: 'Generales', fondoModo: 'tema', tema: 'vino', colorTexto: '#fff1f2',
    titulo: { x: 10, y: 20, w: 80, h: 26, pt: 58, alineacion: 'centro', fuente: 'Trebuchet MS' },
    subtitulo: { x: 16, y: 52, w: 68, h: 14, pt: 26, alineacion: 'centro', fuente: 'Inter' },
  },
  {
    id: 'anuncio-simple', nombre: 'Anuncio simple', categoria: 'Generales', fondoModo: 'color', fondo: '#fff7ed', colorTexto: '#431407',
    titulo: { x: 9, y: 16, w: 82, h: 24, pt: 56, alineacion: 'izquierda', fuente: 'Arial Black' },
    subtitulo: { x: 9, y: 48, w: 72, h: 16, pt: 26, alineacion: 'izquierda', fuente: 'Inter' },
    cuerpo: { x: 9, y: 70, w: 72, h: 16, pt: 20, alineacion: 'izquierda', fuente: 'Inter' },
  },
]

function textoPlano(html: string) {
  if (typeof window !== 'undefined') { const div = document.createElement('div'); div.innerHTML = limpiarHtmlCanvas(html); return div.innerText.trim() }
  return String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function PastoralVisualWorkspaceCanva({ paquete, biblioteca }: { paquete: Paquete; coleccion: unknown; biblioteca: RecursoPastoral[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const undoRef = useRef<Snapshot[]>([])
  const redoRef = useRef<Snapshot[]>([])
  const touchStart = useRef(0)
  const [vista, setVista] = useState<VistaLienzo>('contenido')
  const [panel, setPanel] = useState<Herramienta>(null)
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [paginas, setPaginas] = useState<DiapositivaCanvas[]>(paquete.presentacion_diapositivas?.length ? paquete.presentacion_diapositivas.map(normalizarPaginaCanvas) : [nuevaPaginaCanvas()])
  const [indice, setIndice] = useState(0)
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [selectorVersiculo, setSelectorVersiculo] = useState(false)
  const [modoPresentacion, setModoPresentacion] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [busquedaRecursos, setBusquedaRecursos] = useState('')
  const [isPending, startTransition] = useTransition()
  const [subiendoImagen, startSubida] = useTransition()
  const [destinoSubida, setDestinoSubida] = useState<DestinoSubida>('elemento')
  const [recursoPendiente, setRecursoPendiente] = useState<{ id: string; destino: DestinoSubida } | null>(null)
  const [versionHistorial, setVersionHistorial] = useState(0)
  const pagina = paginas[indice] ?? paginas[0]
  const elementoSeleccionado = pagina?.elementos?.find((item) => item.id === seleccion) ?? null
  const textoSeleccionado = elementoSeleccionado && elementoSeleccionado.tipo !== 'imagen' ? elementoSeleccionado : null
  const imagenes = useMemo(() => biblioteca.filter((item) => item.mime_type?.startsWith('image/') && item.acceso_url), [biblioteca])
  const recursosFiltrados = useMemo(() => {
    const q = busquedaRecursos.trim().toLowerCase()
    return q ? imagenes.filter((item) => `${item.titulo} ${item.descripcion} ${item.categoria}`.toLowerCase().includes(q)) : imagenes
  }, [imagenes, busquedaRecursos])

  const snapshot = (): Snapshot => ({ titulo, paginas: clonar(paginas), indice })
  const registrarHistorial = () => {
    undoRef.current = [...undoRef.current.slice(-(MAX_HISTORIAL - 1)), snapshot()]
    redoRef.current = []
    setVersionHistorial((v) => v + 1)
  }
  const restaurar = (s: Snapshot) => { setTitulo(s.titulo); setPaginas(clonar(s.paginas)); setIndice(Math.min(s.indice, s.paginas.length - 1)); setSeleccion(null); setPanel(null) }
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
  const patchElementoSinHistorial = (id: string, patch: Partial<ElementoCanvas>) => setPaginas((actuales) => actuales.map((item, i) => i === indice ? { ...item, elementos: (item.elementos ?? []).map((el) => el.id === id ? { ...el, ...patch } : el) } : item))
  const actualizarElemento = (id: string, patch: Partial<ElementoCanvas>) => { registrarHistorial(); patchElementoSinHistorial(id, patch) }

  const agregarElemento = (elemento: Partial<ElementoCanvas>) => {
    registrarHistorial()
    const nuevo = normalizarElementoCanvas({ ...elemento, id: nuevoIdCanvas(), z: Math.max(0, ...(pagina.elementos ?? []).map((el) => el.z)) + 1 }, (pagina.elementos ?? []).length)
    patchPaginaSinHistorial({ elementos: [...(pagina.elementos ?? []), nuevo] })
    setSeleccion(nuevo.id)
    return nuevo.id
  }
  const agregarTexto = (rol: RolTexto = 'libre') => {
    const estilo = ESTILOS_TEXTO.find((item) => item.id === rol) ?? ESTILOS_TEXTO[3]
    return agregarElemento({ tipo: 'texto', rol, contenido: rol === 'titulo' ? 'Título' : rol === 'subtitulo' ? 'Subtítulo' : rol === 'cuerpo' ? 'Escribe el contenido' : 'Escribe aquí', x: 10, y: rol === 'titulo' ? 12 : rol === 'subtitulo' ? 28 : 38, w: 80, h: rol === 'cuerpo' ? 34 : 18, tamano_fuente: estilo.pt, peso: estilo.peso, fuente: 'Inter' })
  }
  const aplicarRolTexto = (rol: RolTexto) => {
    if (!textoSeleccionado) return agregarTexto(rol)
    const estilo = ESTILOS_TEXTO.find((item) => item.id === rol) ?? ESTILOS_TEXTO[3]
    actualizarElemento(textoSeleccionado.id, { rol, tamano_fuente: estilo.pt, peso: estilo.peso })
  }
  const agregarImagen = (recurso: RecursoPastoral) => agregarElemento({ tipo: 'imagen', recurso_id: recurso.id, x: 12, y: 18, w: 56, h: 48, ajuste: 'cover', radio: 14 })
  const aplicarFondoImagen = (recurso: RecursoPastoral) => actualizarPagina({ fondo_modo: 'imagen', fondo_recurso_id: recurso.id, recurso_id: recurso.id })
  const quitarFondoImagen = () => actualizarPagina({ fondo_modo: 'color', fondo_recurso_id: null, recurso_id: null })
  const eliminarElemento = (id: string) => { registrarHistorial(); patchPaginaSinHistorial({ elementos: (pagina.elementos ?? []).filter((el) => el.id !== id) }); setSeleccion(null) }
  const duplicarElemento = (id: string) => { const original = pagina.elementos?.find((el) => el.id === id); if (!original) return; agregarElemento({ ...clonar(original), id: undefined, x: Math.min(original.x + 4, 90), y: Math.min(original.y + 4, 90), z: original.z + 1 }) }
  const moverCapa = (id: string, delta: number) => { const elemento = pagina.elementos?.find((el) => el.id === id); if (!elemento) return; actualizarElemento(id, { z: Math.max(0, Math.min(200, elemento.z + delta)) }) }

  const aplicarPlantilla = (plantilla: PlantillaVisual) => {
    registrarHistorial()
    const actuales = pagina.elementos ?? []
    const porRol = (rol: RolTexto) => actuales.find((item) => item.tipo !== 'imagen' && item.rol === rol)
    const otros = actuales.filter((item) => item.tipo === 'imagen' || !['titulo', 'subtitulo', 'cuerpo'].includes(item.rol ?? ''))
    const crearTexto = (rol: RolTexto, layout: PlantillaVisual['titulo'], contenido: string) => normalizarElementoCanvas({
      tipo: 'texto', rol, contenido, x: layout.x, y: layout.y, w: layout.w, h: layout.h, tamano_fuente: layout.pt,
      alineacion: layout.alineacion, fuente: layout.fuente, color: plantilla.colorTexto, peso: rol === 'titulo' ? 800 : rol === 'subtitulo' ? 700 : 500,
      z: Math.max(1, ...actuales.map((item) => item.z)) + (rol === 'titulo' ? 3 : rol === 'subtitulo' ? 2 : 1),
    })
    const adaptar = (existente: ElementoCanvas | undefined, rol: RolTexto, layout: PlantillaVisual['titulo'], placeholder: string) => existente
      ? { ...existente, rol, x: layout.x, y: layout.y, w: layout.w, h: layout.h, tamano_fuente: layout.pt, alineacion: layout.alineacion, fuente: layout.fuente, color: plantilla.colorTexto }
      : crearTexto(rol, layout, placeholder)
    const siguientes: ElementoCanvas[] = [
      ...otros,
      adaptar(porRol('titulo'), 'titulo', plantilla.titulo, 'Título del mensaje'),
      ...(plantilla.subtitulo ? [adaptar(porRol('subtitulo'), 'subtitulo', plantilla.subtitulo, 'Subtítulo o referencia')] : porRol('subtitulo') ? [porRol('subtitulo')!] : []),
      ...(plantilla.cuerpo ? [adaptar(porRol('cuerpo'), 'cuerpo', plantilla.cuerpo, 'Escribe aquí el contenido principal')] : porRol('cuerpo') ? [porRol('cuerpo')!] : []),
    ]
    patchPaginaSinHistorial({
      plantilla: 'limpia',
      fondo_modo: plantilla.fondoModo,
      fondo: plantilla.fondo ?? pagina.fondo,
      fondo_tema: plantilla.tema ?? pagina.fondo_tema,
      fondo_recurso_id: null,
      recurso_id: null,
      color_texto: plantilla.colorTexto,
      elementos: siguientes,
    })
    setSeleccion(null)
    mostrarToast(`Plantilla “${plantilla.nombre}” aplicada`)
  }

  const nuevaPagina = () => { registrarHistorial(); setPaginas((actuales) => [...actuales, nuevaPaginaCanvas()]); setIndice(paginas.length); setSeleccion(null); setPanel(null) }
  const eliminarPagina = (i = indice) => {
    if (paginas.length === 1) return
    if (!window.confirm(`¿Eliminar Página ${i + 1}? Puedes recuperarla con Deshacer mientras no recargues.`)) return
    registrarHistorial(); const siguientes = paginas.filter((_, p) => p !== i); setPaginas(siguientes); setIndice(Math.min(i, siguientes.length - 1)); setSeleccion(null)
  }

  const comandoParrafo = (comando: string) => {
    const activo = document.activeElement
    if (!(activo instanceof HTMLElement) || !activo.isContentEditable) return mostrarToast('Toca primero una caja de texto')
    registrarHistorial(); document.execCommand(comando); if (seleccion) patchElementoSinHistorial(seleccion, { contenido: limpiarHtmlCanvas(activo.innerHTML) })
  }
  const agregarVersiculo = (versiculo: { referencia: string; texto: string; traduccion: string }) => {
    const contenido = `<strong>${versiculo.referencia}${versiculo.traduccion ? ` · ${versiculo.traduccion}` : ''}</strong><br>${versiculo.texto}`
    agregarElemento({ tipo: 'versiculo', rol: 'cuerpo', contenido, x: 10, y: 20 + Math.min((pagina.elementos?.length ?? 0) * 3, 35), w: 80, h: 24, tamano_fuente: 28, fuente: 'Georgia', alineacion: 'centro', peso: 500 })
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
      const contenidoLegado = (item.elementos ?? []).filter((el) => el.tipo !== 'imagen' && el.rol !== 'titulo').map((el) => limpiarHtmlCanvas(el.contenido ?? '')).join('<br>').slice(0, 12000)
      data.append('diapositiva_titulo', tituloLegado); data.append('diapositiva_contenido', contenidoLegado); data.append('diapositiva_recurso_id', item.recurso_id ?? ''); data.append('diapositiva_plantilla', item.plantilla ?? 'limpia'); data.append('diapositiva_fondo', item.fondo ?? '#ffffff'); data.append('diapositiva_color_texto', item.color_texto ?? '#0f172a'); data.append('diapositiva_alineacion', item.alineacion ?? 'izquierda'); data.append('diapositiva_tamano', item.tamano ?? 'normal'); data.append('diapositiva_formato', item.formato ?? '16:9'); data.append('diapositiva_fondo_modo', item.fondo_modo ?? 'color'); data.append('diapositiva_fondo_tema', item.fondo_tema ?? 'claro'); data.append('diapositiva_fondo_recurso_id', item.fondo_recurso_id ?? ''); data.append('diapositiva_elementos', JSON.stringify(item.elementos ?? []))
    })
    return data
  }
  const guardar = () => startTransition(async () => { const resultado = await editarPaquetePastoral(paquete.id, construirFormulario()); if (!resultado.success) return mostrarToast(resultado.error); setGuardado(true); window.setTimeout(() => setGuardado(false), 1500); mostrarToast('Proyecto guardado'); router.refresh() })
  const cambiarVista = (siguiente: VistaLienzo) => { setSeleccion(null); setPanel(null); setVista(siguiente) }
  const moverPresentacion = (delta: number) => setIndice((actual) => Math.min(Math.max(actual + delta, 0), paginas.length - 1))
  const abrirPantallaCompleta = async () => { setModoPresentacion(true); try { await document.documentElement.requestFullscreen?.() } catch {} }
  const cerrarPantallaCompleta = async () => { setModoPresentacion(false); try { if (document.fullscreenElement) await document.exitFullscreen?.() } catch {} }
  const copiarEnlaceActual = async () => { try { await navigator.clipboard.writeText(window.location.href); mostrarToast('Enlace del proyecto copiado') } catch { mostrarToast('No se pudo copiar el enlace') } }
  const compartirInterno = async () => { try { if (navigator.share) await navigator.share({ title: titulo, text: 'Proyecto de Centro Pastoral', url: window.location.href }); else await copiarEnlaceActual() } catch {} }
  const alinear = (alineacion: Alineacion) => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { alineacion })
  void versionHistorial

  const panelContenido = panel && pagina ? <>
    {panel === 'plantillas' && <div className="space-y-5">
      <div>
        <h3 className="text-sm font-black text-slate-900">Plantillas</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Composiciones cristianas, minimalistas y generales. Conservan tus elementos y reorganizan el contenido por roles.</p>
      </div>
      {(['Cristianas', 'Minimalistas', 'Generales'] as const).map((categoria) => <div key={categoria}>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">{categoria}</p>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">{PLANTILLAS_VISUALES.filter((item) => item.categoria === categoria).map((plantilla) => {
          const tema = TEMAS_LIENZO.find((item) => item.id === plantilla.tema)
          const background = plantilla.fondoModo === 'tema' ? tema?.css : plantilla.fondo
          return <button key={plantilla.id} type="button" onClick={() => aplicarPlantilla(plantilla)} className="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition active:scale-[.98]">
            <div className="relative aspect-video p-3" style={{ background, color: plantilla.colorTexto }}>
              <span className="absolute left-[10%] top-[22%] h-2 w-[58%] rounded-full bg-current opacity-85" />
              <span className="absolute left-[10%] top-[42%] h-1 w-[42%] rounded-full bg-current opacity-45" />
              <span className="absolute left-[10%] top-[66%] h-1 w-[68%] rounded-full bg-current opacity-25" />
            </div>
            <span className="block px-3 py-2 text-xs font-bold text-slate-800">{plantilla.nombre}</span>
          </button>
        })}</div>
      </div>)}
    </div>}

    {panel === 'fondo' && <div className="space-y-4">
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => prepararSubida('fondo')} disabled={subiendoImagen} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-bold text-white"><Upload className="h-4 w-4" /> Subir imagen</button>{pagina.fondo_modo === 'imagen' && <button type="button" onClick={quitarFondoImagen} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-rose-50 px-4 text-xs font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Quitar fondo</button>}</div>
      {!!imagenes.length && <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{imagenes.slice(0, 12).map((recurso) => <button key={recurso.id} type="button" onClick={() => aplicarFondoImagen(recurso)} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200"><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} className="h-full w-full object-cover" /></button>)}</div>}
      <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Color</p><div className="flex flex-wrap gap-2">{COLORES_FONDO.map((color) => <button key={color} type="button" onClick={() => actualizarPagina({ fondo_modo: 'color', fondo: color })} className={`h-9 w-9 rounded-full border border-slate-300 ${pagina.fondo_modo === 'color' && pagina.fondo === color ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`} style={{ backgroundColor: color }} aria-label={`Fondo ${color}`} />)}</div></div>
      <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Fondos predefinidos</p><div className="grid grid-cols-3 gap-2 xl:grid-cols-2">{TEMAS_LIENZO.map((tema) => <button key={tema.id} type="button" onClick={() => actualizarPagina({ fondo_modo: 'tema', fondo_tema: tema.id, color_texto: tema.texto })} className={`min-h-16 rounded-xl p-2 text-[10px] font-bold shadow-sm ${pagina.fondo_modo === 'tema' && pagina.fondo_tema === tema.id ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`} style={{ background: tema.css, color: tema.texto }}>{tema.label}</button>)}</div></div>
    </div>}

    {panel === 'texto' && <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => agregarTexto('libre')} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Agregar caja de texto</button>{ESTILOS_TEXTO.filter((item) => item.id !== 'libre').map((estilo) => <button key={estilo.id} type="button" onClick={() => aplicarRolTexto(estilo.id)} className={`min-h-11 rounded-xl px-3 text-xs font-bold ${textoSeleccionado?.rol === estilo.id ? 'bg-violet-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>{estilo.label}</button>)}</div>
      {textoSeleccionado && <>
        <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Tipografía</p><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] xl:grid xl:grid-cols-2">{FUENTES_PASTORALES.map((fuente) => <button key={fuente} type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { fuente })} className={`min-h-9 shrink-0 rounded-full px-3 text-xs ${textoSeleccionado.fuente === fuente ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`} style={{ fontFamily: fuente }}>{fuente}</button>)}</div></div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { peso: (textoSeleccionado.peso ?? 500) >= 700 ? 500 : 800 })} className={claseBotonActivo((textoSeleccionado.peso ?? 500) >= 700)} aria-pressed={(textoSeleccionado.peso ?? 500) >= 700}><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { cursiva: !textoSeleccionado.cursiva })} className={claseBotonActivo(Boolean(textoSeleccionado.cursiva))} aria-pressed={Boolean(textoSeleccionado.cursiva)}><Italic className="h-4 w-4" /></button>
          <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { subrayado: !textoSeleccionado.subrayado })} className={claseBotonActivo(Boolean(textoSeleccionado.subrayado))} aria-pressed={Boolean(textoSeleccionado.subrayado)}><Underline className="h-4 w-4" /></button>
          <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { tachado: !textoSeleccionado.tachado })} className={claseBotonActivo(Boolean(textoSeleccionado.tachado))} aria-pressed={Boolean(textoSeleccionado.tachado)}><Strikethrough className="h-4 w-4" /></button>
          <label className="flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200">Tamaño <input aria-label="Tamaño de letra en puntos" type="number" min="8" max="160" value={Math.round(textoSeleccionado.tamano_fuente ?? 24)} onChange={(e) => actualizarElemento(textoSeleccionado.id, { tamano_fuente: Math.min(160, Math.max(8, Number(e.target.value) || 8)) })} className="w-12 bg-transparent text-right font-black text-slate-900 outline-none" /><span>pt</span></label>
        </div>
        <input aria-label="Ajustar tamaño de letra" type="range" min="8" max="160" value={textoSeleccionado.tamano_fuente ?? 24} onChange={(e) => actualizarElemento(textoSeleccionado.id, { tamano_fuente: Number(e.target.value) })} className="w-full" />
        <div className="flex flex-wrap gap-2">{COLORES_TEXTO.map((color) => <button key={color} type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { color })} className={`h-8 w-8 rounded-full border border-slate-300 ${textoSeleccionado.color === color ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`} style={{ backgroundColor: color }} aria-label={`Color de texto ${color}`} />)}</div>
      </>}
    </div>}

    {panel === 'parrafo' && <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => alinear('izquierda')} className={claseBotonActivo(textoSeleccionado?.alineacion !== 'centro' && textoSeleccionado?.alineacion !== 'derecha')} aria-pressed={textoSeleccionado?.alineacion === 'izquierda'}><AlignLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => alinear('centro')} className={claseBotonActivo(textoSeleccionado?.alineacion === 'centro')} aria-pressed={textoSeleccionado?.alineacion === 'centro'}><AlignCenter className="h-4 w-4" /></button>
        <button type="button" onClick={() => alinear('derecha')} className={claseBotonActivo(textoSeleccionado?.alineacion === 'derecha')} aria-pressed={textoSeleccionado?.alineacion === 'derecha'}><AlignRight className="h-4 w-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertUnorderedList')} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200"><List className="h-4 w-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertOrderedList')} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200"><ListOrdered className="h-4 w-4" /></button>
      </div>
      {textoSeleccionado && <label className="block text-xs font-bold text-slate-600">Interlineado <input className="mt-2 w-full" type="range" min="0.9" max="2" step="0.05" value={textoSeleccionado.interlineado ?? 1.25} onChange={(e) => actualizarElemento(textoSeleccionado.id, { interlineado: Number(e.target.value) })} /></label>}
    </div>}

    {panel === 'recursos' && <div className="space-y-3">
      <div className="flex gap-2"><button type="button" onClick={() => prepararSubida('elemento')} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white"><Upload className="h-4 w-4" /> Subir</button><input value={busquedaRecursos} onChange={(e) => setBusquedaRecursos(e.target.value)} placeholder="Buscar en mi biblioteca" className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" /></div>
      <div className="grid grid-cols-3 gap-2 xl:grid-cols-2">{recursosFiltrados.slice(0, 30).map((recurso) => <button key={recurso.id} type="button" onClick={() => agregarImagen(recurso)} className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} className="aspect-square w-full object-cover" /></button>)}</div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3"><span className="basis-full text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Bancos externos</span>{BANCOS_EXTERNOS.map((banco) => <a key={banco.label} href={banco.href} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white px-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{banco.label}<ExternalLink className="h-3 w-3" /></a>)}<span className="basis-full text-[10px] leading-4 text-slate-500">Verifica las condiciones de uso y derechos de personas, marcas u obras visibles.</span></div>
    </div>}

    {panel === 'biblia' && <div className="space-y-3"><p className="text-xs leading-5 text-slate-500">Inserta uno o varios versículos como elementos independientes del lienzo.</p><button type="button" onClick={() => setSelectorVersiculo(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white"><BookOpen className="h-4 w-4" /> Agregar versículo</button></div>}

    {panel === 'diseno' && <div className="space-y-4">
      <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Formato del lienzo</p><div className="grid grid-cols-2 gap-2">{FORMATOS_LIENZO.map(({ id, label, detalle }) => { const Icon = id === '9:16' ? Smartphone : id === '1:1' ? Square : Monitor; return <button key={id} type="button" onClick={() => actualizarPagina({ formato: id })} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-left ${pagina.formato === id ? 'bg-violet-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}><Icon className="h-4 w-4" /><span><strong className="block text-xs">{label}</strong><small className="opacity-70">{detalle}</small></span></button> })}</div></div>
      {elementoSeleccionado && <div className="space-y-3"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Elemento seleccionado</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => duplicarElemento(elementoSeleccionado.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-bold ring-1 ring-slate-200"><Copy className="h-4 w-4" /> Duplicar</button><button type="button" onClick={() => moverCapa(elementoSeleccionado.id, 1)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-bold ring-1 ring-slate-200"><ArrowUp className="h-4 w-4" /> Adelante</button><button type="button" onClick={() => moverCapa(elementoSeleccionado.id, -1)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-bold ring-1 ring-slate-200"><ArrowDown className="h-4 w-4" /> Atrás</button><button type="button" onClick={() => eliminarElemento(elementoSeleccionado.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Borrar</button></div>{elementoSeleccionado.tipo === 'imagen' && <div className="space-y-3"><button type="button" onClick={() => actualizarElemento(elementoSeleccionado.id, { ajuste: elementoSeleccionado.ajuste === 'contain' ? 'cover' : 'contain' })} className="min-h-10 w-full rounded-xl bg-white px-3 text-xs font-bold ring-1 ring-slate-200">Ajuste: {elementoSeleccionado.ajuste === 'contain' ? 'Contener' : 'Cubrir'}</button><label className="block text-xs font-bold text-slate-600">Opacidad <input className="mt-2 w-full" type="range" min="0.1" max="1" step="0.05" value={elementoSeleccionado.opacidad ?? 1} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { opacidad: Number(e.target.value) })} /></label><label className="block text-xs font-bold text-slate-600">Esquinas <input className="mt-2 w-full" type="range" min="0" max="40" value={elementoSeleccionado.radio ?? 14} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { radio: Number(e.target.value) })} /></label></div>}</div>}
    </div>}
  </> : null

  return <div className="pastoral-content-workspace pastoral-canva-workspace text-slate-900">
    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { subirImagen(event.target.files?.[0]); event.currentTarget.value = '' }} />
    <header className="sticky top-0 z-50 -mx-4 bg-[#f4f5f9]/96 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-2">
        <input dir="ltr" value={titulo} onFocus={registrarHistorial} onChange={(event) => setTitulo(event.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none sm:text-lg" />
        <button type="button" onClick={deshacer} disabled={!undoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Deshacer"><Undo2 className="h-4 w-4" /></button>
        <button type="button" onClick={rehacer} disabled={!redoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Rehacer"><Redo2 className="h-4 w-4" /></button>
        {guardado && <Check className="h-4 w-4 text-emerald-600" />}
        <button type="button" onClick={guardar} disabled={isPending} className="grid h-10 w-10 place-items-center rounded-full bg-violet-600 text-white disabled:opacity-60" aria-label="Guardar proyecto">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button>
      </div>
      <nav className="mt-1.5 flex items-center gap-5 overflow-x-auto text-xs font-bold text-slate-400 [scrollbar-width:none]">
        <button type="button" onClick={() => cambiarVista('contenido')} className={vista === 'contenido' ? 'text-violet-700' : ''}>Editar</button>
        <button type="button" onClick={() => cambiarVista('presentacion')} className={vista === 'presentacion' ? 'text-violet-700' : ''}>Presentar</button>
        <button type="button" onClick={() => cambiarVista('congregacion')} className={vista === 'congregacion' ? 'text-violet-700' : ''}>Congregación</button>
        <button type="button" onClick={() => cambiarVista('publicar')} className={vista === 'publicar' ? 'text-violet-700' : ''}>Compartir</button>
      </nav>
    </header>

    {vista === 'contenido' && pagina && <section className="pb-4 pt-2">
      <div className={`pastoral-editor-shell ${panel ? 'has-panel' : ''}`}>
        <div className="pastoral-tool-dock" aria-label="Herramientas del lienzo">
          {HERRAMIENTAS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setPanel((actual) => actual === id ? null : id)} className={`pastoral-tool-button ${panel === id ? 'is-active' : ''}`} aria-expanded={panel === id}><Icon className="h-5 w-5" /><span>{label}</span></button>)}
          {elementoSeleccionado && <button type="button" onClick={() => eliminarElemento(elementoSeleccionado.id)} className="pastoral-tool-button text-rose-600"><Trash2 className="h-5 w-5" /><span>Borrar</span></button>}
        </div>

        <div className="pastoral-stage">
          <div className="pastoral-canvas-wrap"><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} editable seleccion={seleccion} onSelect={setSeleccion} onBeginChange={registrarHistorial} onPatchElement={patchElementoSinHistorial} onTextInput={(id, contenido) => patchElementoSinHistorial(id, { contenido })} onDeleteElement={eliminarElemento} /></div>
          <div className="pastoral-pages-strip" aria-label="Páginas del proyecto">
            {paginas.map((item, i) => <div key={i} className={`pastoral-page-chip ${i === indice ? 'is-active' : ''}`}>
              <button type="button" onClick={() => { setIndice(i); setSeleccion(null) }} className="min-h-12 min-w-16 px-3 text-xs font-black">{i + 1}<span className="ml-1 font-medium text-slate-400">{item.formato ?? '16:9'}</span></button>
              {i === indice && paginas.length > 1 && <button type="button" onClick={() => eliminarPagina(i)} className="grid h-9 w-8 place-items-center text-rose-500" aria-label={`Eliminar Página ${i + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>)}
            <button type="button" onClick={nuevaPagina} className="grid h-12 w-14 shrink-0 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200" aria-label="Nueva página"><Plus className="h-5 w-5" /></button>
          </div>
          <div className="hidden px-2 text-[11px] font-semibold text-slate-400 sm:block">Selecciona un elemento para moverlo, editarlo, cambiar capas o borrarlo.</div>
        </div>

        {panel && <aside className="pastoral-tool-panel" aria-label={`Panel ${panel}`}>
          <button type="button" onClick={() => setPanel(null)} className="pastoral-sheet-handle" aria-label="Cerrar herramientas"><span /></button>
          <div className="pastoral-tool-panel-scroll">{panelContenido}</div>
        </aside>}
      </div>
    </section>}

    {vista === 'presentacion' && pagina && <section className={modoPresentacion ? 'fixed inset-0 z-[170] flex items-center justify-center overflow-hidden bg-black' : 'relative pb-10 pt-5'}>
      {!modoPresentacion && <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Presentación</h2><p className="text-xs text-slate-500">Mismo lienzo y formato, sin reconstruir diapositivas.</p></div><button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-bold"><Maximize2 className="h-4 w-4" /> Pantalla completa</button></div>}
      {modoPresentacion && <button type="button" onClick={cerrarPantallaCompleta} className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[190] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white" aria-label="Salir de presentación"><Minimize2 className="h-5 w-5" /></button>}
      <div onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? 0 }} onTouchEnd={(e) => { const fin = e.changedTouches[0]?.clientX ?? touchStart.current; const delta = fin - touchStart.current; if (Math.abs(delta) > 45) moverPresentacion(delta < 0 ? 1 : -1) }} className={modoPresentacion ? 'flex h-full w-full items-center justify-center' : ''}><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} /></div>
      <button type="button" onClick={() => moverPresentacion(-1)} disabled={indice === 0} className={`absolute left-2 top-1/2 z-[185] -translate-y-1/2 rounded-full p-2 ${modoPresentacion ? 'bg-black/45 text-white' : 'bg-white/85 shadow'} disabled:opacity-0`}><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => moverPresentacion(1)} disabled={indice === paginas.length - 1} className={`absolute right-2 top-1/2 z-[185] -translate-y-1/2 rounded-full p-2 ${modoPresentacion ? 'bg-black/45 text-white' : 'bg-white/85 shadow'} disabled:opacity-0`}><ChevronRight className="h-5 w-5" /></button>
    </section>}

    {vista === 'congregacion' && pagina && <section className="pb-10 pt-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Vista de la congregación</h2><p className="text-xs text-slate-500">Exactamente la misma composición que se proyectará.</p></div><button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-bold"><Maximize2 className="h-4 w-4" /> Pantalla completa</button></div><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} />{modoPresentacion && <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black"><button type="button" onClick={cerrarPantallaCompleta} className="absolute right-3 top-3 z-[190] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white"><Minimize2 className="h-5 w-5" /></button><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} /></div>}</section>}

    {vista === 'publicar' && <section className="space-y-4 pb-10 pt-5"><div className="grid gap-2 sm:grid-cols-3"><button type="button" onClick={() => window.print()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold"><FileDown className="h-4 w-4" /> Exportar PDF</button><button type="button" onClick={compartirInterno} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold"><Share2 className="h-4 w-4" /> Compartir</button><button type="button" onClick={copiarEnlaceActual} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold"><Link2 className="h-4 w-4" /> Copiar enlace</button></div><p className="text-[11px] leading-5 text-slate-500">El enlace actual conserva el acceso de VIDA. Un enlace público para redes/WhatsApp y el control remoto OBS/proyector requieren una capa segura de publicación y emparejamiento; no se exponen anónimamente todavía.</p><PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia} initialPublished={paquete.publicado} initialFeatured={paquete.destacado} /></section>}

    <div className="pastoral-print-deck hidden print:block">{paginas.map((item, i) => <section key={i} className="pastoral-print-page"><PastoralVisualCanvas pagina={item} biblioteca={biblioteca} /></section>)}</div>
    <PastoralVersePicker open={selectorVersiculo} onClose={() => setSelectorVersiculo(false)} onInsert={agregarVersiculo} />
    <style jsx global>{`
      .pastoral-editor-shell{display:grid;grid-template-areas:'stage' 'panel' 'dock';grid-template-rows:minmax(0,1fr) auto auto;min-height:calc(100dvh - 150px);margin:0 -1rem;background:#f4f5f9;overflow:hidden}
      .pastoral-stage{grid-area:stage;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:.75rem;padding:.75rem 1rem;overflow:hidden}
      .pastoral-canvas-wrap{display:flex;min-height:0;flex:1;align-items:center;justify-content:center;overflow:auto;padding:.25rem}
      .pastoral-canvas-wrap>.mx-auto{max-height:100%;}
      .pastoral-pages-strip{display:flex;align-items:center;gap:.5rem;overflow-x:auto;padding:.2rem .1rem .35rem;scrollbar-width:none}
      .pastoral-page-chip{display:flex;flex:none;align-items:center;border-radius:.8rem;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05);color:#64748b;outline:1px solid #e2e8f0}
      .pastoral-page-chip.is-active{color:#6d28d9;outline:2px solid #8b5cf6;outline-offset:1px}
      .pastoral-tool-dock{grid-area:dock;display:flex;align-items:stretch;gap:.15rem;overflow-x:auto;border-top:1px solid #e2e8f0;background:rgba(255,255,255,.98);padding:.35rem .45rem calc(.35rem + env(safe-area-inset-bottom));scrollbar-width:none;z-index:20}
      .pastoral-tool-button{display:flex;min-width:72px;min-height:58px;flex:none;flex-direction:column;align-items:center;justify-content:center;gap:.2rem;border-radius:.75rem;color:#475569;font-size:10px;font-weight:800;line-height:1;transition:.15s}
      .pastoral-tool-button.is-active{background:#f3e8ff;color:#6d28d9}
      .pastoral-tool-panel{grid-area:panel;position:relative;max-height:46dvh;border-radius:1.6rem 1.6rem 0 0;background:#f8fafc;box-shadow:0 -10px 35px rgba(15,23,42,.13);overflow:hidden;z-index:15}
      .pastoral-sheet-handle{display:flex;height:28px;width:100%;align-items:center;justify-content:center;background:transparent}
      .pastoral-sheet-handle span{display:block;height:4px;width:42px;border-radius:999px;background:#cbd5e1}
      .pastoral-tool-panel-scroll{height:calc(46dvh - 28px);overflow:auto;padding:.25rem 1rem 1.25rem}
      .pastoral-editor-shell.has-panel .pastoral-stage{min-height:34dvh}
      @media (orientation:portrait) and (max-width:767px){
        .pastoral-editor-shell.has-panel{height:calc(100dvh - 145px)}
        .pastoral-editor-shell.has-panel .pastoral-stage{min-height:0}
        .pastoral-editor-shell.has-panel .pastoral-canvas-wrap{padding:.25rem 1.25rem}
        .pastoral-editor-shell.has-panel .pastoral-pages-strip{display:none}
      }
      @media (orientation:landscape), (min-width:768px){
        .pastoral-editor-shell{grid-template-areas:'dock stage panel';grid-template-columns:82px minmax(0,1fr) 0;grid-template-rows:minmax(560px,calc(100dvh - 150px));margin:0 -1.5rem;transition:grid-template-columns .2s ease}
        .pastoral-editor-shell.has-panel{grid-template-columns:82px minmax(0,1fr) minmax(300px,34vw)}
        .pastoral-tool-dock{flex-direction:column;overflow-y:auto;overflow-x:hidden;border-top:0;border-right:1px solid #e2e8f0;padding:.6rem .3rem}
        .pastoral-tool-button{min-width:0;width:100%;min-height:64px}
        .pastoral-tool-panel{max-height:none;height:100%;border-radius:0;border-left:1px solid #e2e8f0;box-shadow:-8px 0 25px rgba(15,23,42,.06)}
        .pastoral-sheet-handle{display:none}
        .pastoral-tool-panel-scroll{height:100%;padding:1rem;overflow:auto}
        .pastoral-stage{padding:1rem 1.25rem;min-height:0}
        .pastoral-canvas-wrap{padding:.5rem 1rem}
      }
      @media (min-width:1280px){
        .pastoral-editor-shell.has-panel{grid-template-columns:86px minmax(0,1fr) 360px}
      }
      @media print{@page{margin:0;size:landscape}body{background:white!important}body>*{visibility:hidden!important}.pastoral-print-deck,.pastoral-print-deck *{visibility:visible!important}.pastoral-print-deck{position:absolute!important;inset:0!important;display:block!important;width:100%!important}.pastoral-print-page{display:flex;min-height:100vh;align-items:center;justify-content:center;break-after:page;page-break-after:always;background:white}.pastoral-print-page .pastoral-visual-canvas{box-shadow:none!important;max-height:100vh}}
    `}</style>
  </div>
}
