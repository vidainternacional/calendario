'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bold, BookOpen, Check,
  ChevronLeft, ChevronRight, Copy, ExternalLink, FileDown, Image as ImageIcon, Italic,
  Layers, LayoutTemplate, Link2, List, ListOrdered, Loader2, Maximize2, Minimize2,
  Monitor, Plus, Redo2, Save, Share2, Smartphone, Square, Strikethrough,
  Trash2, Type, Underline, Undo2, Upload,
} from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { subirArchivoBibliotecaPastoral } from '@/app/actions/pastoral-biblioteca'
import { mostrarToast } from '@/lib/ui/toast'
import PackageDistributionControls from '@/components/pastoral/PackageDistributionControls'
import PastoralVersePicker from '@/components/pastoral/PastoralVersePicker'
import PastoralVisualCanvas from '@/components/pastoral/PastoralVisualCanvas'
import { PALETAS_PRESENTACION, PLANTILLAS_VISUALES, type PaletaPresentacion, type PlantillaVisual } from '@/components/pastoral/pastoral-editor-presets'
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
type GrupoPrincipal = 'plantillas' | 'texto' | 'capas'
type PanelEditor = 'plantillas' | 'temas' | 'fondos' | 'recursos' | 'texto' | 'biblia' | 'capas' | 'diseno' | 'ajustes'

const MAX_HISTORIAL = 80
const HERRAMIENTAS: Array<{ id: GrupoPrincipal; label: string; icon: typeof LayoutTemplate }> = [
  { id: 'plantillas', label: 'Plantillas', icon: LayoutTemplate },
  { id: 'texto', label: 'Texto', icon: Type },
  { id: 'capas', label: 'Capas', icon: Layers },
]
const SUBMENUS: Record<GrupoPrincipal, Array<{ id: PanelEditor; label: string }>> = {
  plantillas: [
    { id: 'plantillas', label: 'Plantillas' },
    { id: 'temas', label: 'Temas' },
    { id: 'recursos', label: 'Imágenes' },
  ],
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
const PANEL_INICIAL: Record<GrupoPrincipal, PanelEditor> = { plantillas: 'plantillas', texto: 'texto', capas: 'capas' }
const BANCOS_EXTERNOS = [
  { label: 'Unsplash', href: 'https://unsplash.com/' },
  { label: 'Pexels', href: 'https://www.pexels.com/' },
  { label: 'Pixabay', href: 'https://pixabay.com/' },
]
const COLORES_TEXTO = ['#0f172a', '#ffffff', '#334155', '#7f1d1d', '#14532d', '#1e3a8a', '#5b2733', '#3a2144']
const FUENTE_MUESTRA = FUENTES_PASTORALES.find((fuente) => fuente !== 'Inter') ?? FUENTES_PASTORALES[0] ?? 'Georgia'
const claseBotonActivo = (activo: boolean) => `pastoral-inline-icon ${activo ? 'is-active' : ''}`

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

function textoMuestraPlantilla(plantilla: PlantillaVisual, rol: RolTexto) {
  if (rol === 'titulo') return plantilla.nombre
  if (rol === 'subtitulo') return `Estilo ${plantilla.categoria.toLowerCase()}`
  return `Composición ${plantilla.nombre.toLowerCase()}`
}

function esTextoMuestraPlantilla(elemento: ElementoCanvas) {
  if (elemento.tipo === 'imagen') return false
  const contenido = textoPlano(elemento.contenido ?? '')
  if (!contenido) return true
  return PLANTILLAS_VISUALES.some((plantilla) =>
    contenido === textoMuestraPlantilla(plantilla, 'titulo') ||
    contenido === textoMuestraPlantilla(plantilla, 'subtitulo') ||
    contenido === textoMuestraPlantilla(plantilla, 'cuerpo'))
}

export default function PastoralVisualWorkspaceV4({ paquete, biblioteca }: { paquete: Paquete; coleccion: unknown; biblioteca: RecursoPastoral[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const undoRef = useRef<Snapshot[]>([])
  const redoRef = useRef<Snapshot[]>([])
  const touchStart = useRef(0)
  const autosaveReadyRef = useRef(false)
  const autosaveSerialRef = useRef(0)
  const [vista, setVista] = useState<VistaLienzo>('contenido')
  const [grupoPrincipal, setGrupoPrincipal] = useState<GrupoPrincipal | null>('plantillas')
  const [panel, setPanel] = useState<PanelEditor | null>('plantillas')
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [paginas, setPaginas] = useState<DiapositivaCanvas[]>(paquete.presentacion_diapositivas?.length ? paquete.presentacion_diapositivas.map(normalizarPaginaCanvas) : [nuevaPaginaCanvas()])
  const [indice, setIndice] = useState(0)
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [modoPresentacion, setModoPresentacion] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [guardandoAuto, setGuardandoAuto] = useState(false)
  const [busquedaRecursos, setBusquedaRecursos] = useState('')
  const [isPending, startTransition] = useTransition()
  const [, startSubida] = useTransition()
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
  const restaurar = (s: Snapshot) => { setTitulo(s.titulo); setPaginas(clonar(s.paginas)); setIndice(Math.min(s.indice, s.paginas.length - 1)); setSeleccion(null) }
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
    return agregarElemento({ tipo: 'texto', rol, contenido: rol === 'titulo' ? 'Título' : rol === 'subtitulo' ? 'Subtítulo' : rol === 'cuerpo' ? 'Escribe el contenido' : 'Escribe aquí', x: 10, y: rol === 'titulo' ? 12 : rol === 'subtitulo' ? 30 : 40, w: 80, h: rol === 'cuerpo' ? 34 : 22, tamano_fuente: estilo.pt, peso: estilo.peso, fuente: 'Inter', color: pagina.color_texto ?? '#0f172a' })
  }
  const aplicarRolTexto = (rol: RolTexto) => {
    if (!textoSeleccionado) return
    if (textoSeleccionado.rol === rol) return actualizarElemento(textoSeleccionado.id, { rol: 'libre' })
    const estilo = ESTILOS_TEXTO.find((item) => item.id === rol) ?? ESTILOS_TEXTO[3]
    actualizarElemento(textoSeleccionado.id, { rol, tamano_fuente: estilo.pt, peso: estilo.peso })
  }
  const agregarImagen = (recurso: RecursoPastoral) => agregarElemento({ tipo: 'imagen', recurso_id: recurso.id, x: 12, y: 18, w: 56, h: 48, ajuste: 'cover', radio: 14 })
  const aplicarFondoImagen = (recurso: RecursoPastoral) => actualizarPagina({ fondo_modo: 'imagen', fondo_recurso_id: recurso.id, recurso_id: recurso.id })
  const eliminarElemento = (id: string) => { registrarHistorial(); patchPaginaSinHistorial({ elementos: (pagina.elementos ?? []).filter((el) => el.id !== id) }); setSeleccion(null) }
  const duplicarElemento = (id: string) => { const original = pagina.elementos?.find((el) => el.id === id); if (!original) return; agregarElemento({ ...clonar(original), id: undefined, x: Math.min(original.x + 4, 90), y: Math.min(original.y + 4, 90), z: original.z + 1 }) }
  const moverCapa = (id: string, delta: number) => { const elemento = pagina.elementos?.find((el) => el.id === id); if (!elemento) return; actualizarElemento(id, { z: Math.max(0, Math.min(200, elemento.z + delta)) }) }

  const aplicarPaleta = (paleta: PaletaPresentacion) => {
    registrarHistorial()
    const elementos = (pagina.elementos ?? []).map((elemento) => elemento.tipo === 'imagen' ? elemento : {
      ...elemento,
      color: elemento.rol === 'titulo' ? paleta.titulo : paleta.texto,
    })
    patchPaginaSinHistorial({ fondo_modo: 'color', fondo: paleta.fondo, fondo_recurso_id: null, recurso_id: null, color_texto: paleta.texto, elementos })
  }

  const aplicarPlantilla = (plantilla: PlantillaVisual) => {
    registrarHistorial()
    const actuales = pagina.elementos ?? []
    const textos = actuales.filter((item) => item.tipo !== 'imagen')
    const tieneTextoUsuario = textos.some((item) => !esTextoMuestraPlantilla(item))

    if (tieneTextoUsuario) {
      const sinMuestras = actuales.filter((item) => item.tipo === 'imagen' || !esTextoMuestraPlantilla(item))
      const elementos = sinMuestras.map((elemento) => {
        if (elemento.tipo === 'imagen') return elemento
        const layout = elemento.rol === 'titulo' ? plantilla.titulo : elemento.rol === 'subtitulo' ? plantilla.subtitulo : elemento.rol === 'cuerpo' ? plantilla.cuerpo : null
        return layout ? { ...elemento, fuente: layout.fuente } : elemento
      })
      patchPaginaSinHistorial({ elementos })
      setSeleccion(null)
      return
    }

    const imagenesActuales = actuales.filter((item) => item.tipo === 'imagen')
    const zBase = Math.max(1, ...actuales.map((item) => item.z))
    const crearMuestra = (rol: RolTexto, layout: PlantillaVisual['titulo']) => normalizarElementoCanvas({
      tipo: 'texto', rol, contenido: textoMuestraPlantilla(plantilla, rol), x: layout.x, y: layout.y, w: layout.w, h: layout.h,
      tamano_fuente: layout.pt, alineacion: layout.alineacion, fuente: layout.fuente, color: plantilla.colorTexto,
      peso: rol === 'titulo' ? 800 : rol === 'subtitulo' ? 700 : 500, z: zBase + (rol === 'titulo' ? 3 : rol === 'subtitulo' ? 2 : 1),
    })
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
  const comandoParrafo = (comando: string) => {
    const activo = document.activeElement
    if (!(activo instanceof HTMLElement) || !activo.isContentEditable) return mostrarToast('Toca primero una caja de texto')
    registrarHistorial(); document.execCommand(comando); if (seleccion) patchElementoSinHistorial(seleccion, { contenido: limpiarHtmlCanvas(activo.innerHTML) })
  }
  const agregarVersiculo = (versiculo: { referencia: string; texto: string; traduccion: string }) => {
    const contenido = `<strong>${versiculo.referencia}${versiculo.traduccion ? ` · ${versiculo.traduccion}` : ''}</strong><br>${versiculo.texto}`
    agregarElemento({ tipo: 'versiculo', rol: 'cuerpo', contenido, x: 10, y: 20 + Math.min((pagina.elementos?.length ?? 0) * 3, 35), w: 80, h: 28, tamano_fuente: 26, fuente: 'Georgia', alineacion: 'centro', peso: 500, color: pagina.color_texto ?? '#0f172a' })
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

  const cambiarVista = (siguiente: VistaLienzo) => { setSeleccion(null); setVista(siguiente) }
  const moverPresentacion = (delta: number) => setIndice((actual) => Math.min(Math.max(actual + delta, 0), paginas.length - 1))
  const abrirPantallaCompleta = async () => { setModoPresentacion(true); try { await document.documentElement.requestFullscreen?.() } catch {} }
  const cerrarPantallaCompleta = async () => { setModoPresentacion(false); try { if (document.fullscreenElement) await document.exitFullscreen?.() } catch {} }
  const copiarEnlaceActual = async () => { try { await navigator.clipboard.writeText(window.location.href); mostrarToast('Enlace del proyecto copiado') } catch { mostrarToast('No se pudo copiar el enlace') } }
  const compartirInterno = async () => { try { if (navigator.share) await navigator.share({ title: titulo, text: 'Proyecto de Centro Pastoral', url: window.location.href }); else await copiarEnlaceActual() } catch {} }
  const alinear = (alineacion: Alineacion) => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { alineacion })
  const ajustarTamano = (delta: number) => {
    if (!textoSeleccionado) return
    const actual = Math.round(textoSeleccionado.tamano_fuente ?? 24)
    actualizarElemento(textoSeleccionado.id, { tamano_fuente: Math.min(160, Math.max(8, actual + delta)) })
  }
  const ajustarLinea = (delta: number) => {
    if (!textoSeleccionado) return
    const actual = textoSeleccionado.interlineado ?? 1.25
    const siguiente = Math.round(Math.min(2, Math.max(.9, actual + delta)) * 100) / 100
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
  const clasePanel = grupoPrincipal === 'plantillas' ? 'panel-plantillas' : panel ? `panel-${panel}` : `panel-${grupoPrincipal ?? 'vacio'}`
  void versionHistorial

  const panelContenido = pagina && panel ? <>
    {panel === 'plantillas' && <div className="pastoral-panel-content pastoral-start-panel">
      <section className="pastoral-compact-row"><p className="pastoral-panel-label">Plantillas</p><div className="pastoral-template-grid"><button type="button" onClick={() => actualizarPagina({ plantilla: 'limpia', fondo_modo: 'color', fondo: '#ffffff', fondo_recurso_id: null, recurso_id: null, color_texto: '#0f172a' })} className="pastoral-template-option pastoral-template-blank-option" aria-label="Aplicar plantilla en blanco a la página actual"><span className="pastoral-template-preview pastoral-template-preview-blank"><i /><i /></span><span>En blanco</span></button>{PLANTILLAS_VISUALES.map((plantilla) => <button key={plantilla.id} type="button" onClick={() => aplicarPlantilla(plantilla)} className="pastoral-template-option"><span className="pastoral-template-preview" style={{ background: plantilla.fondo, color: plantilla.colorTexto }}><i /><i /><i /></span><span>{plantilla.nombre}</span></button>)}</div></section>
    </div>}

    {panel === 'temas' && <div className="pastoral-panel-content pastoral-start-panel">
      <section className="pastoral-compact-row"><p className="pastoral-panel-label">Temas</p><div className="pastoral-theme-grid">{PALETAS_PRESENTACION.map((paleta) => <button key={paleta.id} type="button" onClick={() => aplicarPaleta(paleta)} className="pastoral-theme-option"><span className="pastoral-theme-swatches" style={{ background: paleta.fondo, color: paleta.titulo }}><i /><i /></span><span>{paleta.label}</span></button>)}</div></section>
    </div>}

    {panel === 'recursos' && <div className="pastoral-panel-content pastoral-elements-panel">
      <div className="flex flex-wrap items-center justify-center gap-2"><button type="button" onClick={() => setDestinoSubida('elemento')} className={`min-h-10 rounded-full border px-3 text-xs font-bold ${destinoSubida === 'elemento' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`} aria-pressed={destinoSubida === 'elemento'}>Imagen</button><button type="button" onClick={() => setDestinoSubida('fondo')} className={`min-h-10 rounded-full border px-3 text-xs font-bold ${destinoSubida === 'fondo' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`} aria-pressed={destinoSubida === 'fondo'}>Como fondo</button></div>
      <div className="pastoral-elements-top"><button type="button" onClick={() => prepararSubida(destinoSubida)} className="pastoral-minimal-action"><Upload /> Subir</button><input value={busquedaRecursos} onChange={(e) => setBusquedaRecursos(e.target.value)} placeholder="Buscar en biblioteca" /></div>
      {recursosFiltrados.length ? <div className="pastoral-elements-grid">{recursosFiltrados.slice(0, 30).map((recurso) => <button key={recurso.id} type="button" onClick={() => destinoSubida === 'fondo' ? aplicarFondoImagen(recurso) : agregarImagen(recurso)}><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} /></button>)}</div> : <p className="pastoral-empty-panel">No hay imágenes en tu biblioteca todavía.</p>}
      <div className="pastoral-external-banks">{BANCOS_EXTERNOS.map((banco) => <a key={banco.label} href={banco.href} target="_blank" rel="noreferrer">{banco.label}<ExternalLink /></a>)}</div>
    </div>}

    {panel === 'texto' && <div className="pastoral-panel-content grid h-full w-full content-start gap-3 overflow-y-auto pr-1">
      <section className="grid gap-2 border-b border-slate-200 pb-3">
        <div className="px-1 text-[11px] font-black text-slate-500">Estilo · {etiquetaRolTexto}</div>
        <div className="grid grid-cols-[56px_repeat(3,minmax(0,1fr))] items-end gap-1" aria-label="Opciones de estilo de texto">
          <button type="button" onClick={() => agregarTexto('libre')} className="flex min-h-12 items-center justify-center gap-0.5 border-b-2 border-transparent px-1 pb-2 pt-1 text-slate-700" aria-label="Agregar texto" title="Agregar texto"><span className="text-base font-black">A</span><span className="text-sm font-black">+</span></button>
          {ESTILOS_TEXTO.filter((item) => item.id !== 'libre').map((estilo) => <button key={estilo.id} type="button" disabled={!textoSeleccionado} onClick={() => aplicarRolTexto(estilo.id)} aria-pressed={textoSeleccionado?.rol === estilo.id} className={`min-h-12 min-w-0 whitespace-nowrap border-b-2 px-0.5 pb-2 pt-1 text-center disabled:opacity-30 ${estilo.id === 'titulo' ? 'text-[15px] font-extrabold' : estilo.id === 'subtitulo' ? 'text-[13px] font-semibold' : 'text-[11px] font-normal'} ${textoSeleccionado?.rol === estilo.id ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-600'}`}>{estilo.label}</button>)}
        </div>
      </section>

      <section className="grid gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center justify-between px-1"><span className="text-[11px] font-black text-slate-500">Fuente · {fuenteTextoActual}</span><span className="text-lg font-bold text-slate-600" style={{ fontFamily: FUENTE_MUESTRA }}>Aa</span></div>
        <div className="grid grid-cols-2 gap-2" aria-label="Fuentes disponibles">{FUENTES_PASTORALES.map((fuente) => <button key={fuente} type="button" disabled={!textoSeleccionado} onClick={() => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { fuente })} className={`min-h-11 min-w-0 rounded-full border px-3 text-xs font-bold ${textoSeleccionado?.fuente === fuente ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`} style={{ fontFamily: fuente }}><span className="block truncate">{fuente}</span></button>)}</div>
      </section>

      <section className="grid gap-2 border-b border-slate-200 pb-3">
        <div className="px-1 text-[11px] font-black text-slate-500">Formato</div>
        <div className="flex items-start gap-2" role="group" aria-label="Formato de texto">
          <button type="button" disabled={!textoSeleccionado} onClick={() => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { peso: (textoSeleccionado.peso ?? 500) >= 700 ? 500 : 800 })} className={`grid h-11 w-11 place-items-center rounded-full border ${textoSeleccionado && (textoSeleccionado.peso ?? 500) >= 700 ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`} aria-label="Negrita"><Bold className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado} onClick={() => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { cursiva: !textoSeleccionado.cursiva })} className={`grid h-11 w-11 place-items-center rounded-full border ${textoSeleccionado?.cursiva ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`} aria-label="Cursiva"><Italic className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado} onClick={() => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { subrayado: !textoSeleccionado.subrayado })} className={`grid h-11 w-11 place-items-center rounded-full border ${textoSeleccionado?.subrayado ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`} aria-label="Subrayado"><Underline className="h-4 w-4" /></button>
          <button type="button" disabled={!textoSeleccionado} onClick={() => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { tachado: !textoSeleccionado.tachado })} className={`grid h-11 w-11 place-items-center rounded-full border ${textoSeleccionado?.tachado ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`} aria-label="Tachado"><Strikethrough className="h-4 w-4" /></button>
          <details className="relative ml-auto"><summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full border border-slate-200 bg-white [&::-webkit-details-marker]:hidden" aria-label="Color de texto"><span className="h-5 w-5 rounded-full border border-slate-300" style={{ backgroundColor: textoSeleccionado?.color ?? '#0f172a' }} /></summary><div className="absolute right-0 top-full z-30 mt-2 flex w-[220px] flex-wrap justify-end gap-2 rounded-2xl bg-[#f4f5f9] p-2 shadow-sm" role="group" aria-label="Colores de texto">{COLORES_TEXTO.map((color) => <button key={color} type="button" disabled={!textoSeleccionado} onClick={() => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { color })} className={`h-9 w-9 rounded-full border-2 ${textoSeleccionado?.color === color ? 'border-indigo-500' : 'border-slate-200'}`} style={{ backgroundColor: color }} aria-label={`Color de texto ${color}`} />)}</div></details>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1.35fr)_minmax(104px,.65fr)] gap-4 border-b border-slate-200 pb-3">
        <div className="grid gap-2">
          <div className="px-1 text-[11px] font-black text-slate-500">Tamaño e interlineado</div>
          <div className="grid gap-1"><span className="px-1 text-[10px] font-bold text-slate-400">Tamaño</span><div className="grid grid-cols-[44px_minmax(48px,1fr)_44px] items-center gap-1.5"><button type="button" disabled={!textoSeleccionado} onClick={() => ajustarTamano(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-base font-bold text-slate-700" aria-label="Reducir tamaño de letra">−</button><input aria-label="Tamaño de letra en puntos" type="number" min="8" max="160" disabled={!textoSeleccionado} value={Math.round(textoSeleccionado?.tamano_fuente ?? 24)} onChange={(e) => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { tamano_fuente: Math.min(160, Math.max(8, Number(e.target.value) || 8)) })} className="h-11 min-w-0 rounded-full border border-slate-200 bg-white px-1 text-center text-xs font-bold text-slate-700" /><button type="button" disabled={!textoSeleccionado} onClick={() => ajustarTamano(1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-base font-bold text-slate-700" aria-label="Aumentar tamaño de letra">+</button></div></div>
          <div className="grid gap-1"><span className="px-1 text-[10px] font-bold text-slate-400">Línea</span><div className="grid grid-cols-[44px_minmax(48px,1fr)_44px] items-center gap-1.5"><button type="button" disabled={!textoSeleccionado} onClick={() => ajustarLinea(-0.05)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-base font-bold text-slate-700" aria-label="Reducir interlineado">−</button><input aria-label="Interlineado" type="number" min="0.9" max="2" step="0.05" disabled={!textoSeleccionado} value={textoSeleccionado?.interlineado ?? 1.25} onChange={(e) => textoSeleccionado && actualizarElemento(textoSeleccionado.id, { interlineado: Math.min(2, Math.max(.9, Number(e.target.value) || 1.25)) })} className="h-11 min-w-0 rounded-full border border-slate-200 bg-white px-1 text-center text-xs font-bold text-slate-700" /><button type="button" disabled={!textoSeleccionado} onClick={() => ajustarLinea(0.05)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-base font-bold text-slate-700" aria-label="Aumentar interlineado">+</button></div></div>
        </div>
        <div className="grid content-start gap-2">
          <div className="px-1 text-[11px] font-black text-slate-500">Alineación</div>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Alineación"><button type="button" disabled={!textoSeleccionado} onClick={() => alinear('izquierda')} className={`grid h-11 w-11 place-items-center rounded-full border ${textoSeleccionado?.alineacion === 'izquierda' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`} aria-label="Alinear a la izquierda"><AlignLeft className="h-4 w-4" /></button><button type="button" disabled={!textoSeleccionado} onClick={() => alinear('centro')} className={`grid h-11 w-11 place-items-center rounded-full border ${textoSeleccionado?.alineacion === 'centro' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`} aria-label="Centrar"><AlignCenter className="h-4 w-4" /></button><button type="button" disabled={!textoSeleccionado} onClick={() => alinear('derecha')} className={`grid h-11 w-11 place-items-center rounded-full border ${textoSeleccionado?.alineacion === 'derecha' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`} aria-label="Alinear a la derecha"><AlignRight className="h-4 w-4" /></button><button type="button" disabled={!textoSeleccionado} onClick={() => alinear('justificado')} className={`grid h-11 w-11 place-items-center rounded-full border ${textoSeleccionado?.alineacion === 'justificado' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`} aria-label="Justificar"><AlignJustify className="h-4 w-4" /></button></div>
        </div>
      </section>

      <section className="grid gap-2 pb-2">
        <div className="px-1 text-center text-[11px] font-black text-slate-500">Listas</div>
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Listas"><button type="button" disabled={!textoSeleccionado} onMouseDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertUnorderedList')} className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700" aria-label="Lista con viñetas"><List className="h-4 w-4" />Viñetas</button><button type="button" disabled={!textoSeleccionado} onMouseDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertOrderedList')} className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700" aria-label="Lista numerada"><ListOrdered className="h-4 w-4" />Numerada</button></div>
      </section>
    </div>}

    {panel === 'biblia' && <PastoralVersePicker open embedded onClose={() => undefined} onInsert={agregarVersiculo} />}

    {panel === 'diseno' && <div className="pastoral-panel-content"><div className="pastoral-panel-heading"><h3>Relación de aspecto</h3><p>16:9 funciona mejor para cañón, pantallas y la mayoría de proyectores modernos.</p></div><div className="pastoral-aspect-control">{FORMATOS_LIENZO.map(({ id, label, detalle }) => { const Icon = id === '9:16' ? Smartphone : id === '1:1' ? Square : Monitor; return <button key={id} type="button" onClick={() => actualizarPagina({ formato: id })} className={pagina.formato === id ? 'is-active' : ''}><Icon /><span><strong>{detalle}</strong><small>{label}</small></span></button> })}</div></div>}

    {panel === 'capas' && <div className="pastoral-panel-content pastoral-layers-panel">
      <div className="pastoral-layer-list">{(pagina.elementos ?? []).slice().sort((a, b) => b.z - a.z).map((elemento) => <button key={elemento.id} type="button" onClick={() => setSeleccion(elemento.id)} className={seleccion === elemento.id ? 'is-active' : ''}><Layers /><span>{nombreCapa(elemento)}</span><small>{elemento.z}</small></button>)}</div>
      {elementoSeleccionado ? <div className="pastoral-layer-actions"><button type="button" onClick={() => duplicarElemento(elementoSeleccionado.id)}><Copy />Duplicar</button><button type="button" onClick={() => moverCapa(elementoSeleccionado.id, 1)}><ArrowUp />Adelante</button><button type="button" onClick={() => moverCapa(elementoSeleccionado.id, -1)}><ArrowDown />Atrás</button><button type="button" onClick={() => eliminarElemento(elementoSeleccionado.id)} className="pastoral-delete-layer"><Trash2 />Eliminar elemento</button></div> : <p className="pastoral-empty-panel">Selecciona una capa para organizarla.</p>}
    </div>}

    {panel === 'ajustes' && <div className="pastoral-panel-content pastoral-layers-panel">
      {elementoSeleccionado?.tipo === 'imagen' ? <div className="pastoral-layer-actions"><button type="button" onClick={() => actualizarElemento(elementoSeleccionado.id, { ajuste: elementoSeleccionado.ajuste === 'contain' ? 'cover' : 'contain' })}>Ajuste: {elementoSeleccionado.ajuste === 'contain' ? 'Contener' : 'Cubrir'}</button><label>Opacidad <input type="range" min="0.1" max="1" step="0.05" value={elementoSeleccionado.opacidad ?? 1} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { opacidad: Number(e.target.value) })} /></label><label>Esquinas <input type="range" min="0" max="40" value={elementoSeleccionado.radio ?? 14} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { radio: Number(e.target.value) })} /></label></div> : <p className="pastoral-empty-panel">Selecciona una imagen para ajustar su apariencia.</p>}
    </div>}
  </> : null

  return <div className="pastoral-content-workspace pastoral-canva-workspace pastoral-editor-v3 pastoral-editor-v4 text-slate-900">
    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { subirImagen(event.target.files?.[0]); event.currentTarget.value = '' }} />
    <header className="sticky top-0 z-50 -mx-4 bg-[#f8f8f6]/96 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-2"><input dir="ltr" value={titulo} onFocus={registrarHistorial} onChange={(event) => setTitulo(event.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none sm:text-lg" /><button type="button" onClick={deshacer} disabled={!undoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Deshacer"><Undo2 className="h-4 w-4" /></button><button type="button" onClick={rehacer} disabled={!redoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Rehacer"><Redo2 className="h-4 w-4" /></button>{guardandoAuto ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-label="Guardando automáticamente" /> : guardado ? <Check className="h-4 w-4 text-emerald-600" /> : null}<button type="button" onClick={guardar} disabled={isPending} className="grid h-10 w-10 place-items-center rounded-full text-[#C0392B] disabled:opacity-60" aria-label="Guardar proyecto">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />}</button></div>
      <nav className="mt-1.5 flex items-center gap-5 overflow-x-auto text-xs font-bold text-slate-400 [scrollbar-width:none]"><button type="button" onClick={() => cambiarVista('contenido')} className={vista === 'contenido' ? 'text-[#C0392B]' : ''}>Editar</button><button type="button" onClick={() => cambiarVista('presentacion')} className={vista === 'presentacion' ? 'text-[#C0392B]' : ''}>Presentar</button><button type="button" onClick={() => cambiarVista('congregacion')} className={vista === 'congregacion' ? 'text-[#C0392B]' : ''}>Congregación</button><div className="flex min-w-max items-center justify-center gap-0.5"><button type="button" onClick={() => cambiarVista('publicar')} className={vista === 'publicar' ? 'text-[#C0392B]' : ''}>Compartir</button>{vista === 'contenido' && <><select value={indice} onChange={(event) => { setIndice(Number(event.target.value)); setSeleccion(null) }} aria-label={`Página ${indice + 1} de ${paginas.length}`} className="h-9 min-w-[48px] rounded-full border border-slate-200 bg-white px-1 text-center text-[10px] font-black text-slate-600 outline-none">{paginas.map((_, i) => <option key={i} value={i}>{i + 1}/{paginas.length}</option>)}</select><button type="button" onClick={nuevaPagina} className="grid h-10 w-10 place-items-center text-indigo-600" aria-label="Nueva página" title="Nueva página"><Plus className="h-4 w-4" /></button>{paginas.length > 1 && <button type="button" onClick={() => eliminarPagina()} className="grid h-10 w-10 place-items-center text-rose-600" aria-label={`Eliminar Página ${indice + 1}`} title="Eliminar página"><Trash2 className="h-4 w-4 text-rose-600" /></button>}</>}</div></nav>
    </header>

    {vista === 'contenido' && pagina && <section className="pastoral-editor-section pb-4 pt-2">
      <div className="pastoral-editor-shell-flow flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f5f9]">
        <div className="pastoral-stage-flow flex w-full shrink-0 items-stretch" style={{ height: 'clamp(250px, 52dvh, 640px)' }}>
          <div className="pastoral-canvas-wrap w-full"><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} editable seleccion={seleccion} onSelect={setSeleccion} onBeginChange={registrarHistorial} onPatchElement={patchElementoSinHistorial} onTextInput={(id, contenido) => patchElementoSinHistorial(id, { contenido })} onDeleteElement={eliminarElemento} /></div>
        </div>
        <div className="pastoral-editor-controls-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="pastoral-tool-dock" aria-label="Herramientas del lienzo">{HERRAMIENTAS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => alternarGrupoPrincipal(id)} className={`pastoral-tool-button col-span-2 ${grupoPrincipal === id ? 'is-active' : ''}`} aria-pressed={grupoPrincipal === id} aria-expanded={grupoPrincipal === id} aria-label={label} title={label}><Icon /><small className="relative z-[1] text-[10px] font-bold">{label}</small></button>)}<button type="button" disabled={!elementoSeleccionado} onClick={() => elementoSeleccionado && eliminarElemento(elementoSeleccionado.id)} className="grid h-11 w-11 min-w-11 shrink-0 place-items-center rounded-full border border-rose-200 bg-white disabled:opacity-30" aria-label="Borrar elemento seleccionado" title="Borrar"><Trash2 className="h-[18px] w-[18px] text-rose-600" /></button></div>
          {grupoPrincipal && <aside className={`pastoral-tool-panel-flow ${clasePanel}`} aria-label={`Panel ${grupoPrincipal}`}><div className="pastoral-tool-panel-flow-scroll px-3 pb-3 pt-2"><div className="flex flex-col"><div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`Opciones de ${grupoPrincipal}`}>{SUBMENUS[grupoPrincipal].map((item) => <button key={item.id} type="button" onClick={() => alternarSubpanel(item.id)} className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-bold ${panel === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`} aria-pressed={panel === item.id}>{item.label}</button>)}</div><div className="min-h-0 flex-1 pt-2">{panelContenido}</div></div></div></aside>}
        </div>
      </div>
    </section>}

    {vista === 'presentacion' && pagina && <section className={modoPresentacion ? 'fixed inset-0 z-[170] flex items-center justify-center overflow-hidden bg-black' : 'relative pb-10 pt-5'}>{!modoPresentacion && <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Presentación</h2><p className="text-xs text-slate-500">Mismo lienzo y formato, sin reconstruir diapositivas.</p></div><button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs font-bold"><Maximize2 className="h-4 w-4" /> Pantalla completa</button></div>}{modoPresentacion && <button type="button" onClick={cerrarPantallaCompleta} className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[190] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white" aria-label="Salir de presentación"><Minimize2 className="h-5 w-5" /></button>}<div onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? 0 }} onTouchEnd={(e) => { const fin = e.changedTouches[0]?.clientX ?? touchStart.current; const delta = fin - touchStart.current; if (Math.abs(delta) > 45) moverPresentacion(delta < 0 ? 1 : -1) }} className={modoPresentacion ? 'flex h-full w-full items-center justify-center' : ''}><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} /></div><button type="button" onClick={() => moverPresentacion(-1)} disabled={indice === 0} className={`absolute left-2 top-1/2 z-[185] -translate-y-1/2 rounded-full p-2 ${modoPresentacion ? 'bg-black/45 text-white' : 'bg-white/85 shadow'} disabled:opacity-0`}><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => moverPresentacion(1)} disabled={indice === paginas.length - 1} className={`absolute right-2 top-1/2 z-[185] -translate-y-1/2 rounded-full p-2 ${modoPresentacion ? 'bg-black/45 text-white' : 'bg-white/85 shadow'} disabled:opacity-0`}><ChevronRight className="h-5 w-5" /></button></section>}

    {vista === 'congregacion' && pagina && <section className="pb-10 pt-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Vista de la congregación</h2><p className="text-xs text-slate-500">Exactamente la misma composición que se proyectará.</p></div><button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 px-3 text-xs font-bold"><Maximize2 className="h-4 w-4" /> Pantalla completa</button></div><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} />{modoPresentacion && <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black"><button type="button" onClick={cerrarPantallaCompleta} className="absolute right-3 top-3 z-[190] grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white"><Minimize2 className="h-5 w-5" /></button><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} /></div>}</section>}

    {vista === 'publicar' && <section className="pastoral-share-view space-y-4 pb-10 pt-5"><PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia} initialPublished={paquete.publicado} initialFeatured={paquete.destacado} /><div className="pastoral-share-actions"><button type="button" onClick={() => window.print()}><FileDown /><span>PDF</span></button><button type="button" onClick={compartirInterno}><Share2 /><span>Compartir</span></button><button type="button" onClick={copiarEnlaceActual}><Link2 /><span>Copiar enlace</span></button></div><p className="text-[11px] leading-5 text-slate-500">El enlace actual conserva el acceso de VIDA. Un enlace público para redes/WhatsApp y el control remoto OBS/proyector requieren una capa segura de publicación y emparejamiento; no se exponen anónimamente todavía.</p></section>}

    <div className="pastoral-print-deck hidden print:block">{paginas.map((item, i) => <section key={i} className="pastoral-print-page"><PastoralVisualCanvas pagina={item} biblioteca={biblioteca} /></section>)}</div>
  </div>
}
