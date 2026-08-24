'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bold, BookOpen, Check,
  ChevronLeft, ChevronRight, Copy, ExternalLink, FileDown, Image as ImageIcon, Italic,
  Layers, LayoutTemplate, Link2, List, ListOrdered, Loader2, Maximize2, Minimize2,
  Monitor, Palette, Plus, Redo2, Save, Share2, Smartphone, Square, Strikethrough,
  Trash2, Type, Underline, Undo2, Upload,
} from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { subirArchivoBibliotecaPastoral } from '@/app/actions/pastoral-biblioteca'
import { mostrarToast } from '@/lib/ui/toast'
import PackageDistributionControls from '@/components/pastoral/PackageDistributionControls'
import PastoralVersePicker from '@/components/pastoral/PastoralVersePicker'
import PastoralVisualCanvas from '@/components/pastoral/PastoralVisualCanvas'
import {
  ESTILOS_TEXTO, FORMATOS_LIENZO, FUENTES_PASTORALES, clonar, limpiarHtmlCanvas,
  nuevaPaginaCanvas, nuevoIdCanvas, normalizarElementoCanvas, normalizarPaginaCanvas,
  type Alineacion, type DiapositivaCanvas, type ElementoCanvas, type RecursoPastoral,
  type RolTexto, type VistaLienzo,
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
type Herramienta = 'plantillas' | 'recursos' | 'texto' | 'biblia' | 'fondo' | 'diseno' | 'capas' | null
type PlantillaVisual = {
  id: string
  nombre: string
  categoria: 'Cristianas' | 'Minimalistas' | 'Generales'
  fondo: string
  colorTexto: string
  titulo: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
  subtitulo?: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
  cuerpo?: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
}
type PaletaPresentacion = {
  id: string
  label: string
  fondo: string
  titulo: string
  texto: string
  acento: string
  fuenteTitulo: string
  fuenteCuerpo: string
}

const MAX_HISTORIAL = 80
const HERRAMIENTAS: Array<{ id: Exclude<Herramienta, null>; label: string; icon: typeof Palette }> = [
  { id: 'plantillas', label: 'Plantillas', icon: LayoutTemplate },
  { id: 'recursos', label: 'Elementos', icon: ImageIcon },
  { id: 'texto', label: 'Texto', icon: Type },
  { id: 'biblia', label: 'Biblia', icon: BookOpen },
  { id: 'fondo', label: 'Fondo', icon: Palette },
  { id: 'diseno', label: 'Diseño', icon: Monitor },
  { id: 'capas', label: 'Capas', icon: Layers },
]
const BANCOS_EXTERNOS = [
  { label: 'Unsplash', href: 'https://unsplash.com/' },
  { label: 'Pexels', href: 'https://www.pexels.com/' },
  { label: 'Pixabay', href: 'https://pixabay.com/' },
]
const COLORES_TEXTO = ['#0f172a', '#ffffff', '#334155', '#7f1d1d', '#14532d', '#1e3a8a', '#5b2733', '#3a2144']
const claseBotonActivo = (activo: boolean) => `pastoral-inline-icon ${activo ? 'is-active' : ''}`

const PALETAS_PRESENTACION: PaletaPresentacion[] = [
  { id: 'claro-editorial', label: 'Claro editorial', fondo: '#FFFFFF', titulo: '#0F172A', texto: '#334155', acento: '#C0392B', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'marfil-academico', label: 'Marfil', fondo: '#FCF8F0', titulo: '#3B2F2F', texto: '#5B4636', acento: '#B45309', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'arena-conferencia', label: 'Arena', fondo: '#F4E8D4', titulo: '#3F2A1F', texto: '#5C4536', acento: '#C2410C', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'salvia', label: 'Salvia', fondo: '#EEF3EA', titulo: '#1F3A2D', texto: '#3F5D4A', acento: '#5B7F62', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'cielo-suave', label: 'Cielo suave', fondo: '#EDF6FF', titulo: '#15304A', texto: '#365B7A', acento: '#3B82F6', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'azul-conferencia', label: 'Azul conferencia', fondo: '#EAF0F7', titulo: '#102A43', texto: '#334E68', acento: '#2F6F9F', fuenteTitulo: 'Arial Black', fuenteCuerpo: 'Inter' },
  { id: 'lavanda', label: 'Lavanda', fondo: '#F3F0FA', titulo: '#352C5C', texto: '#5A5180', acento: '#7C6BB1', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'rosa-viejo', label: 'Rosa viejo', fondo: '#F8EEEE', titulo: '#5B2733', texto: '#77414B', acento: '#A8556A', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'terracota', label: 'Terracota', fondo: '#F9EEE8', titulo: '#5B2B20', texto: '#7A493E', acento: '#C46A4A', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'gris-estudio', label: 'Gris estudio', fondo: '#F3F4F6', titulo: '#111827', texto: '#4B5563', acento: '#6B7280', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'carbon', label: 'Carbón', fondo: '#161A22', titulo: '#F8FAFC', texto: '#CBD5E1', acento: '#E2B714', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'noche', label: 'Noche', fondo: '#0B1220', titulo: '#FFFFFF', texto: '#CBD5E1', acento: '#60A5FA', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'azul-profundo', label: 'Azul profundo', fondo: '#10213A', titulo: '#F8FAFC', texto: '#D9E7F5', acento: '#7DB4E6', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'petroleo', label: 'Petróleo', fondo: '#0E2F35', titulo: '#F4FAF8', texto: '#CDE5E0', acento: '#5FC0B5', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'bosque', label: 'Bosque', fondo: '#173528', titulo: '#F7F6EE', texto: '#D9E6D8', acento: '#A3C585', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'oliva', label: 'Oliva', fondo: '#323A22', titulo: '#FFF8E7', texto: '#E7E2C3', acento: '#C6B35E', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'esmeralda', label: 'Esmeralda', fondo: '#0B3D32', titulo: '#F7FEFA', texto: '#D3EEE3', acento: '#34D399', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'vino', label: 'Vino', fondo: '#4A1225', titulo: '#FFF7FA', texto: '#F2D7DF', acento: '#D9779A', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'borgona', label: 'Borgoña', fondo: '#5A1F2E', titulo: '#FFF9F6', texto: '#F5DDD4', acento: '#E7A07E', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'ciruela', label: 'Ciruela', fondo: '#3A2144', titulo: '#FCF7FF', texto: '#E8DDF0', acento: '#B58BC8', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'uva', label: 'Uva', fondo: '#2D2352', titulo: '#FCFAFF', texto: '#DED8F3', acento: '#9688D8', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'indigo', label: 'Índigo', fondo: '#202B58', titulo: '#F9FAFF', texto: '#D9DEF7', acento: '#8EA1FF', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'pizarra', label: 'Pizarra', fondo: '#28323F', titulo: '#F8FAFC', texto: '#D7DEE7', acento: '#94A3B8', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'acero', label: 'Acero', fondo: '#374151', titulo: '#FFFFFF', texto: '#E5E7EB', acento: '#9CA3AF', fuenteTitulo: 'Helvetica', fuenteCuerpo: 'Inter' },
  { id: 'cobre', label: 'Cobre', fondo: '#4B2C20', titulo: '#FFF7ED', texto: '#F0D6C5', acento: '#D28A5F', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'cafe', label: 'Café', fondo: '#33251F', titulo: '#FFF8F1', texto: '#E8D7C9', acento: '#C89A74', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'coral', label: 'Coral', fondo: '#5B2C32', titulo: '#FFF8F7', texto: '#F5DAD6', acento: '#F28C82', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'turquesa', label: 'Turquesa', fondo: '#10464A', titulo: '#F6FFFF', texto: '#D5F1F1', acento: '#5EC7C9', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'luz-calida', label: 'Luz cálida', fondo: '#FFF7E8', titulo: '#4A321D', texto: '#6A4B2F', acento: '#E0A33B', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'luz-fria', label: 'Luz fría', fondo: '#F4F8FB', titulo: '#23374D', texto: '#4A6178', acento: '#5B8DB8', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
]

const PLANTILLAS_VISUALES: PlantillaVisual[] = [
  { id: 'predicacion-limpia', nombre: 'Predicación limpia', categoria: 'Cristianas', fondo: '#FFFFFF', colorTexto: '#0F172A', titulo: { x: 9, y: 11, w: 82, h: 30, pt: 42, alineacion: 'izquierda', fuente: 'Georgia' }, subtitulo: { x: 9, y: 45, w: 78, h: 17, pt: 23, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 9, y: 67, w: 78, h: 22, pt: 18, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'versiculo-protagonista', nombre: 'Versículo protagonista', categoria: 'Cristianas', fondo: '#0B1220', colorTexto: '#F8FAFC', titulo: { x: 10, y: 18, w: 80, h: 36, pt: 38, alineacion: 'centro', fuente: 'Georgia' }, subtitulo: { x: 17, y: 62, w: 66, h: 16, pt: 20, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'serie-dominical', nombre: 'Serie dominical', categoria: 'Cristianas', fondo: '#F4E8D4', colorTexto: '#3F2A1F', titulo: { x: 8, y: 14, w: 84, h: 32, pt: 40, alineacion: 'centro', fuente: 'Arial Black' }, subtitulo: { x: 14, y: 51, w: 72, h: 16, pt: 22, alineacion: 'centro', fuente: 'Inter' }, cuerpo: { x: 18, y: 73, w: 64, h: 15, pt: 17, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'oracion-serena', nombre: 'Oración serena', categoria: 'Cristianas', fondo: '#EDF6FF', colorTexto: '#15304A', titulo: { x: 12, y: 17, w: 76, h: 30, pt: 38, alineacion: 'centro', fuente: 'Garamond' }, cuerpo: { x: 15, y: 56, w: 70, h: 28, pt: 19, alineacion: 'centro', fuente: 'Georgia' } },
  { id: 'minimal-claro', nombre: 'Minimal claro', categoria: 'Minimalistas', fondo: '#F8FAFC', colorTexto: '#0F172A', titulo: { x: 8, y: 18, w: 84, h: 32, pt: 42, alineacion: 'izquierda', fuente: 'Helvetica' }, subtitulo: { x: 8, y: 59, w: 70, h: 16, pt: 20, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'minimal-oscuro', nombre: 'Minimal oscuro', categoria: 'Minimalistas', fondo: '#161A22', colorTexto: '#F8FAFC', titulo: { x: 10, y: 18, w: 80, h: 34, pt: 40, alineacion: 'centro', fuente: 'Inter' }, cuerpo: { x: 18, y: 60, w: 64, h: 22, pt: 18, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'mensaje-central', nombre: 'Mensaje central', categoria: 'Generales', fondo: '#4A1225', colorTexto: '#FFF7FA', titulo: { x: 10, y: 18, w: 80, h: 32, pt: 40, alineacion: 'centro', fuente: 'Trebuchet MS' }, subtitulo: { x: 16, y: 57, w: 68, h: 16, pt: 21, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'anuncio-simple', nombre: 'Anuncio simple', categoria: 'Generales', fondo: '#FFF7E8', colorTexto: '#4A321D', titulo: { x: 9, y: 12, w: 82, h: 30, pt: 38, alineacion: 'izquierda', fuente: 'Arial Black' }, subtitulo: { x: 9, y: 48, w: 74, h: 16, pt: 21, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 9, y: 70, w: 74, h: 17, pt: 17, alineacion: 'izquierda', fuente: 'Inter' } },
]

function textoPlano(html: string) {
  if (typeof window !== 'undefined') { const div = document.createElement('div'); div.innerHTML = limpiarHtmlCanvas(html); return div.innerText.trim() }
  return String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function nombreCapa(elemento: ElementoCanvas) {
  if (elemento.tipo === 'imagen') return 'Imagen'
  if (elemento.tipo === 'versiculo') return 'Versículo'
  if (elemento.rol === 'titulo') return 'Título'
  if (elemento.rol === 'subtitulo') return 'Subtítulo'
  if (elemento.rol === 'cuerpo') return 'Cuerpo'
  return 'Texto'
}

export default function PastoralVisualWorkspaceV3({ paquete, biblioteca }: { paquete: Paquete; coleccion: unknown; biblioteca: RecursoPastoral[] }) {
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
  const registrarHistorial = () => { undoRef.current = [...undoRef.current.slice(-(MAX_HISTORIAL - 1)), snapshot()]; redoRef.current = []; setVersionHistorial((v) => v + 1) }
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
    return agregarElemento({ tipo: 'texto', rol, contenido: rol === 'titulo' ? 'Título' : rol === 'subtitulo' ? 'Subtítulo' : rol === 'cuerpo' ? 'Escribe el contenido' : 'Escribe aquí', x: 10, y: rol === 'titulo' ? 12 : rol === 'subtitulo' ? 30 : 40, w: 80, h: rol === 'cuerpo' ? 34 : 22, tamano_fuente: estilo.pt, peso: estilo.peso, fuente: 'Inter' })
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

  const aplicarPaleta = (paleta: PaletaPresentacion) => {
    registrarHistorial()
    const elementos = (pagina.elementos ?? []).map((elemento) => elemento.tipo === 'imagen' ? elemento : {
      ...elemento,
      color: elemento.rol === 'titulo' ? paleta.titulo : paleta.texto,
      fuente: elemento.rol === 'titulo' ? paleta.fuenteTitulo : paleta.fuenteCuerpo,
    })
    patchPaginaSinHistorial({ fondo_modo: 'color', fondo: paleta.fondo, fondo_recurso_id: null, recurso_id: null, color_texto: paleta.texto, elementos })
    mostrarToast(`Tema “${paleta.label}” aplicado`)
  }

  const aplicarPlantilla = (plantilla: PlantillaVisual) => {
    registrarHistorial()
    const actuales = pagina.elementos ?? []
    const porRol = (rol: RolTexto) => actuales.find((item) => item.tipo !== 'imagen' && item.rol === rol)
    const otros = actuales.filter((item) => item.tipo === 'imagen' || !['titulo', 'subtitulo', 'cuerpo'].includes(item.rol ?? ''))
    const crearTexto = (rol: RolTexto, layout: PlantillaVisual['titulo'], contenido: string) => normalizarElementoCanvas({ tipo: 'texto', rol, contenido, x: layout.x, y: layout.y, w: layout.w, h: layout.h, tamano_fuente: layout.pt, alineacion: layout.alineacion, fuente: layout.fuente, color: plantilla.colorTexto, peso: rol === 'titulo' ? 800 : rol === 'subtitulo' ? 700 : 500, z: Math.max(1, ...actuales.map((item) => item.z)) + (rol === 'titulo' ? 3 : rol === 'subtitulo' ? 2 : 1) })
    const adaptar = (existente: ElementoCanvas | undefined, rol: RolTexto, layout: PlantillaVisual['titulo'], placeholder: string) => existente ? { ...existente, rol, x: layout.x, y: layout.y, w: layout.w, h: layout.h, tamano_fuente: layout.pt, alineacion: layout.alineacion, fuente: layout.fuente, color: plantilla.colorTexto } : crearTexto(rol, layout, placeholder)
    const siguientes: ElementoCanvas[] = [
      ...otros,
      adaptar(porRol('titulo'), 'titulo', plantilla.titulo, 'Título del mensaje'),
      ...(plantilla.subtitulo ? [adaptar(porRol('subtitulo'), 'subtitulo', plantilla.subtitulo, 'Subtítulo o referencia')] : porRol('subtitulo') ? [porRol('subtitulo')!] : []),
      ...(plantilla.cuerpo ? [adaptar(porRol('cuerpo'), 'cuerpo', plantilla.cuerpo, 'Escribe aquí el contenido principal')] : porRol('cuerpo') ? [porRol('cuerpo')!] : []),
    ]
    patchPaginaSinHistorial({ plantilla: 'limpia', fondo_modo: 'color', fondo: plantilla.fondo, fondo_recurso_id: null, recurso_id: null, color_texto: plantilla.colorTexto, elementos: siguientes })
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
    agregarElemento({ tipo: 'versiculo', rol: 'cuerpo', contenido, x: 10, y: 20 + Math.min((pagina.elementos?.length ?? 0) * 3, 35), w: 80, h: 28, tamano_fuente: 26, fuente: 'Georgia', alineacion: 'centro', peso: 500 })
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
  const cambiarVista = (siguiente: VistaLienzo) => { setSeleccion(null); setPanel(null); setSelectorVersiculo(false); setVista(siguiente) }
  const moverPresentacion = (delta: number) => setIndice((actual) => Math.min(Math.max(actual + delta, 0), paginas.length - 1))
  const abrirPantallaCompleta = async () => { setModoPresentacion(true); try { await document.documentElement.requestFullscreen?.() } catch {} }
  const cerrarPantallaCompleta = async () => { setModoPresentacion(false); try { if (document.fullscreenElement) await document.exitFullscreen?.() } catch {} }
  const copiarEnlaceActual = async () => { try { await navigator.clipboard.writeText(window.location.href); mostrarToast('Enlace del proyecto copiado') } catch { mostrarToast('No se pudo copiar el enlace') } }
  const compartirInterno = async () => { try { if (navigator.share) await navigator.share({ title: titulo, text: 'Proyecto de Centro Pastoral', url: window.location.href }); else await copiarEnlaceActual() } catch {} }
  const alinear = (alineacion: Alineacion) => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { alineacion })
  void versionHistorial

  const panelContenido = panel && pagina ? <>
    {panel === 'plantillas' && <div className="pastoral-panel-content">
      <div className="pastoral-panel-heading"><h3>Plantillas</h3><p>Composiciones sobrias para prédicas, estudios y anuncios.</p></div>
      {(['Cristianas', 'Minimalistas', 'Generales'] as const).map((categoria) => <section key={categoria} className="pastoral-panel-section"><p className="pastoral-panel-label">{categoria}</p><div className="pastoral-template-grid">{PLANTILLAS_VISUALES.filter((item) => item.categoria === categoria).map((plantilla) => <button key={plantilla.id} type="button" onClick={() => aplicarPlantilla(plantilla)} className="pastoral-template-option"><span className="pastoral-template-preview" style={{ background: plantilla.fondo, color: plantilla.colorTexto }}><i /><i /><i /></span><span>{plantilla.nombre}</span></button>)}</div></section>)}
    </div>}

    {panel === 'recursos' && <div className="pastoral-panel-content">
      <div className="pastoral-elements-top"><button type="button" onClick={() => prepararSubida('elemento')} className="pastoral-minimal-action"><Upload /> Subir</button><input value={busquedaRecursos} onChange={(e) => setBusquedaRecursos(e.target.value)} placeholder="Buscar en biblioteca" /></div>
      {recursosFiltrados.length ? <div className="pastoral-elements-grid">{recursosFiltrados.slice(0, 30).map((recurso) => <button key={recurso.id} type="button" onClick={() => agregarImagen(recurso)}><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} /></button>)}</div> : <p className="pastoral-empty-panel">No hay imágenes en tu biblioteca todavía.</p>}
      <div className="pastoral-external-banks"><span>Bancos externos</span>{BANCOS_EXTERNOS.map((banco) => <a key={banco.label} href={banco.href} target="_blank" rel="noreferrer">{banco.label}<ExternalLink /></a>)}</div>
    </div>}

    {panel === 'texto' && <div className="pastoral-panel-content">
      <div className="pastoral-text-presets"><button type="button" onClick={() => agregarTexto('libre')}><Plus /> Caja</button>{ESTILOS_TEXTO.filter((item) => item.id !== 'libre').map((estilo) => <button key={estilo.id} type="button" onClick={() => aplicarRolTexto(estilo.id)} className={textoSeleccionado?.rol === estilo.id ? 'is-active' : ''}>{estilo.label}</button>)}</div>
      {textoSeleccionado ? <>
        <div className="pastoral-font-strip">{FUENTES_PASTORALES.map((fuente) => <button key={fuente} type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { fuente })} className={textoSeleccionado.fuente === fuente ? 'is-active' : ''} style={{ fontFamily: fuente }}>{fuente}</button>)}</div>
        <div className="pastoral-inline-toolbar">
          <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { peso: (textoSeleccionado.peso ?? 500) >= 700 ? 500 : 800 })} className={claseBotonActivo((textoSeleccionado.peso ?? 500) >= 700)} aria-pressed={(textoSeleccionado.peso ?? 500) >= 700}><Bold /></button>
          <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { cursiva: !textoSeleccionado.cursiva })} className={claseBotonActivo(Boolean(textoSeleccionado.cursiva))} aria-pressed={Boolean(textoSeleccionado.cursiva)}><Italic /></button>
          <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { subrayado: !textoSeleccionado.subrayado })} className={claseBotonActivo(Boolean(textoSeleccionado.subrayado))} aria-pressed={Boolean(textoSeleccionado.subrayado)}><Underline /></button>
          <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { tachado: !textoSeleccionado.tachado })} className={claseBotonActivo(Boolean(textoSeleccionado.tachado))} aria-pressed={Boolean(textoSeleccionado.tachado)}><Strikethrough /></button>
          <span className="pastoral-toolbar-divider" />
          <button type="button" onClick={() => alinear('izquierda')} className={claseBotonActivo(textoSeleccionado.alineacion === 'izquierda')}><AlignLeft /></button>
          <button type="button" onClick={() => alinear('centro')} className={claseBotonActivo(textoSeleccionado.alineacion === 'centro')}><AlignCenter /></button>
          <button type="button" onClick={() => alinear('derecha')} className={claseBotonActivo(textoSeleccionado.alineacion === 'derecha')}><AlignRight /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertUnorderedList')} className="pastoral-inline-icon"><List /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertOrderedList')} className="pastoral-inline-icon"><ListOrdered /></button>
          <label className="pastoral-font-size">Tamaño <input aria-label="Tamaño de letra en puntos" type="number" min="8" max="160" value={Math.round(textoSeleccionado.tamano_fuente ?? 24)} onChange={(e) => actualizarElemento(textoSeleccionado.id, { tamano_fuente: Math.min(160, Math.max(8, Number(e.target.value) || 8)) })} /><span>pt</span></label>
        </div>
        <div className="pastoral-text-detail"><label>Interlineado <input type="range" min="0.9" max="2" step="0.05" value={textoSeleccionado.interlineado ?? 1.25} onChange={(e) => actualizarElemento(textoSeleccionado.id, { interlineado: Number(e.target.value) })} /></label><div className="pastoral-color-strip">{COLORES_TEXTO.map((color) => <button key={color} type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { color })} className={textoSeleccionado.color === color ? 'is-active' : ''} style={{ backgroundColor: color }} aria-label={`Color de texto ${color}`} />)}</div></div>
      </> : <p className="pastoral-empty-panel">Agrega una caja o selecciona un texto para ver sus opciones.</p>}
    </div>}

    {panel === 'biblia' && <div className="pastoral-panel-content pastoral-bible-launch"><BookOpen /><div><strong>Agregar versículo</strong><p>Busca, selecciona e inserta directamente en esta misma bandeja.</p></div><button type="button" onClick={() => setSelectorVersiculo(true)}>Abrir</button></div>}

    {panel === 'fondo' && <div className="pastoral-panel-content">
      <div className="pastoral-background-actions"><button type="button" onClick={() => prepararSubida('fondo')} disabled={subiendoImagen} className="pastoral-minimal-action"><Upload /> Subir fondo</button>{pagina.fondo_modo === 'imagen' && <button type="button" onClick={quitarFondoImagen} className="pastoral-minimal-danger"><Trash2 /> Quitar</button>}</div>
      {!!imagenes.length && <div className="pastoral-background-images">{imagenes.slice(0, 12).map((recurso) => <button key={recurso.id} type="button" onClick={() => aplicarFondoImagen(recurso)}><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} /></button>)}</div>}
      <section className="pastoral-panel-section"><p className="pastoral-panel-label">Temas completos · color + tipografía</p><div className="pastoral-theme-grid">{PALETAS_PRESENTACION.map((paleta) => <button key={paleta.id} type="button" onClick={() => aplicarPaleta(paleta)} className="pastoral-theme-option" style={{ backgroundColor: paleta.fondo, color: paleta.titulo }}><span className="pastoral-theme-swatches"><i style={{ backgroundColor: paleta.titulo }} /><i style={{ backgroundColor: paleta.texto }} /><i style={{ backgroundColor: paleta.acento }} /></span><span>{paleta.label}</span></button>)}</div></section>
    </div>}

    {panel === 'diseno' && <div className="pastoral-panel-content"><div className="pastoral-panel-heading"><h3>Relación de aspecto</h3><p>16:9 es la opción recomendada para cañón, pantallas y la mayoría de proyectores modernos.</p></div><div className="pastoral-aspect-control">{FORMATOS_LIENZO.map(({ id, label, detalle }) => { const Icon = id === '9:16' ? Smartphone : id === '1:1' ? Square : Monitor; return <button key={id} type="button" onClick={() => actualizarPagina({ formato: id })} className={pagina.formato === id ? 'is-active' : ''}><Icon /><span><strong>{detalle}</strong><small>{label}</small></span></button> })}</div></div>}

    {panel === 'capas' && <div className="pastoral-panel-content">
      <div className="pastoral-panel-heading"><h3>Capas</h3><p>Selecciona un elemento y organiza su posición.</p></div>
      <div className="pastoral-layer-list">{(pagina.elementos ?? []).slice().sort((a, b) => b.z - a.z).map((elemento) => <button key={elemento.id} type="button" onClick={() => setSeleccion(elemento.id)} className={seleccion === elemento.id ? 'is-active' : ''}><Layers /><span>{nombreCapa(elemento)}</span><small>{elemento.z}</small></button>)}</div>
      {elementoSeleccionado ? <div className="pastoral-layer-actions"><button type="button" onClick={() => duplicarElemento(elementoSeleccionado.id)}><Copy />Duplicar</button><button type="button" onClick={() => moverCapa(elementoSeleccionado.id, 1)}><ArrowUp />Adelante</button><button type="button" onClick={() => moverCapa(elementoSeleccionado.id, -1)}><ArrowDown />Atrás</button>{elementoSeleccionado.tipo === 'imagen' && <><button type="button" onClick={() => actualizarElemento(elementoSeleccionado.id, { ajuste: elementoSeleccionado.ajuste === 'contain' ? 'cover' : 'contain' })}>Ajuste: {elementoSeleccionado.ajuste === 'contain' ? 'Contener' : 'Cubrir'}</button><label>Opacidad <input type="range" min="0.1" max="1" step="0.05" value={elementoSeleccionado.opacidad ?? 1} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { opacidad: Number(e.target.value) })} /></label><label>Esquinas <input type="range" min="0" max="40" value={elementoSeleccionado.radio ?? 14} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { radio: Number(e.target.value) })} /></label></>}<button type="button" onClick={() => eliminarElemento(elementoSeleccionado.id)} className="pastoral-delete-layer"><Trash2 />Eliminar elemento</button></div> : <p className="pastoral-empty-panel">Selecciona una capa para organizarla.</p>}
    </div>}
  </> : null

  return <div className="pastoral-content-workspace pastoral-canva-workspace pastoral-editor-v3 text-slate-900">
    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { subirImagen(event.target.files?.[0]); event.currentTarget.value = '' }} />
    <header className="sticky top-0 z-50 -mx-4 bg-[#f8f8f6]/96 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-2"><input dir="ltr" value={titulo} onFocus={registrarHistorial} onChange={(event) => setTitulo(event.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none sm:text-lg" /><button type="button" onClick={deshacer} disabled={!undoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Deshacer"><Undo2 className="h-4 w-4" /></button><button type="button" onClick={rehacer} disabled={!redoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Rehacer"><Redo2 className="h-4 w-4" /></button>{guardado && <Check className="h-4 w-4 text-emerald-600" />}<button type="button" onClick={guardar} disabled={isPending} className="grid h-10 w-10 place-items-center rounded-full text-[#C0392B] disabled:opacity-60" aria-label="Guardar proyecto">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />}</button></div>
      <nav className="mt-1.5 flex items-center gap-5 overflow-x-auto text-xs font-bold text-slate-400 [scrollbar-width:none]"><button type="button" onClick={() => cambiarVista('contenido')} className={vista === 'contenido' ? 'text-[#C0392B]' : ''}>Editar</button><button type="button" onClick={() => cambiarVista('presentacion')} className={vista === 'presentacion' ? 'text-[#C0392B]' : ''}>Presentar</button><button type="button" onClick={() => cambiarVista('congregacion')} className={vista === 'congregacion' ? 'text-[#C0392B]' : ''}>Congregación</button><button type="button" onClick={() => cambiarVista('publicar')} className={vista === 'publicar' ? 'text-[#C0392B]' : ''}>Compartir</button></nav>
    </header>

    {vista === 'contenido' && pagina && <section className="pastoral-editor-section pb-4 pt-2"><div className={`pastoral-editor-shell ${panel ? 'has-panel' : ''}`}>
      <div className="pastoral-tool-dock" aria-label="Herramientas del lienzo">{HERRAMIENTAS.map(({ id, label, icon: Icon }) => <button key={id} type="button" disabled={id === 'capas' && !(pagina.elementos?.length)} onClick={() => setPanel((actual) => actual === id ? null : id)} className={`pastoral-tool-button ${panel === id ? 'is-active' : ''}`} aria-expanded={panel === id}><Icon /><span>{label}</span></button>)}</div>
      <div className="pastoral-stage"><div className="pastoral-canvas-wrap"><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} editable seleccion={seleccion} onSelect={setSeleccion} onBeginChange={registrarHistorial} onPatchElement={patchElementoSinHistorial} onTextInput={(id, contenido) => patchElementoSinHistorial(id, { contenido })} onDeleteElement={eliminarElemento} /></div><div className="pastoral-pages-strip" aria-label="Páginas del proyecto">{paginas.map((item, i) => <div key={i} className={`pastoral-page-chip ${i === indice ? 'is-active' : ''}`}><button type="button" onClick={() => { setIndice(i); setSeleccion(null) }} className="min-h-12 min-w-16 px-3 text-xs font-black">{i + 1}<span className="ml-1 font-medium text-slate-400">{item.formato ?? '16:9'}</span></button>{i === indice && paginas.length > 1 && <button type="button" onClick={() => eliminarPagina(i)} className="grid h-9 w-8 place-items-center text-rose-500" aria-label={`Eliminar Página ${i + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>}</div>)}<button type="button" onClick={nuevaPagina} className="grid h-12 w-14 shrink-0 place-items-center text-slate-700" aria-label="Nueva página"><Plus className="h-5 w-5" /></button></div></div>
      {panel && <aside className="pastoral-tool-panel" aria-label={`Panel ${panel}`}><button type="button" onClick={() => setPanel(null)} className="pastoral-sheet-handle" aria-label="Cerrar herramientas"><span /></button><div className="pastoral-tool-panel-scroll">{panelContenido}</div></aside>}
    </div></section>}

    {vista === 'presentacion' && pagina && <section className={modoPresentacion ? 'fixed inset-0 z-[170] flex items-center justify-center overflow-hidden bg-black' : 'relative pb-10 pt-5'}>{!modoPresentacion && <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Presentación</h2><p className="text-xs text-slate-500">Mismo lienzo y formato, sin reconstruir diapositivas.</p></div><button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs font-bold"><Maximize2 className="h-4 w-4" /> Pantalla completa</button></div>}{modoPresentacion && <button type="button" onClick={cerrarPantallaCompleta} className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[190] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white" aria-label="Salir de presentación"><Minimize2 className="h-5 w-5" /></button>}<div onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? 0 }} onTouchEnd={(e) => { const fin = e.changedTouches[0]?.clientX ?? touchStart.current; const delta = fin - touchStart.current; if (Math.abs(delta) > 45) moverPresentacion(delta < 0 ? 1 : -1) }} className={modoPresentacion ? 'flex h-full w-full items-center justify-center' : ''}><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} /></div><button type="button" onClick={() => moverPresentacion(-1)} disabled={indice === 0} className={`absolute left-2 top-1/2 z-[185] -translate-y-1/2 rounded-full p-2 ${modoPresentacion ? 'bg-black/45 text-white' : 'bg-white/85 shadow'} disabled:opacity-0`}><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => moverPresentacion(1)} disabled={indice === paginas.length - 1} className={`absolute right-2 top-1/2 z-[185] -translate-y-1/2 rounded-full p-2 ${modoPresentacion ? 'bg-black/45 text-white' : 'bg-white/85 shadow'} disabled:opacity-0`}><ChevronRight className="h-5 w-5" /></button></section>}

    {vista === 'congregacion' && pagina && <section className="pb-10 pt-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Vista de la congregación</h2><p className="text-xs text-slate-500">Exactamente la misma composición que se proyectará.</p></div><button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs font-bold"><Maximize2 className="h-4 w-4" /> Pantalla completa</button></div><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} />{modoPresentacion && <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black"><button type="button" onClick={cerrarPantallaCompleta} className="absolute right-3 top-3 z-[190] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white"><Minimize2 className="h-5 w-5" /></button><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} /></div>}</section>}

    {vista === 'publicar' && <section className="pastoral-share-view space-y-4 pb-10 pt-5"><PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia} initialPublished={paquete.publicado} initialFeatured={paquete.destacado} /><div className="pastoral-share-actions"><button type="button" onClick={() => window.print()}><FileDown /><span>PDF</span></button><button type="button" onClick={compartirInterno}><Share2 /><span>Compartir</span></button><button type="button" onClick={copiarEnlaceActual}><Link2 /><span>Copiar enlace</span></button></div><p className="text-[11px] leading-5 text-slate-500">El enlace actual conserva el acceso de VIDA. Un enlace público para redes/WhatsApp y el control remoto OBS/proyector requieren una capa segura de publicación y emparejamiento; no se exponen anónimamente todavía.</p></section>}

    <div className="pastoral-print-deck hidden print:block">{paginas.map((item, i) => <section key={i} className="pastoral-print-page"><PastoralVisualCanvas pagina={item} biblioteca={biblioteca} /></section>)}</div>
    <PastoralVersePicker open={selectorVersiculo} onClose={() => setSelectorVersiculo(false)} onInsert={agregarVersiculo} />
  </div>
}
