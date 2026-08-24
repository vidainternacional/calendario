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

const MAX_HISTORIAL = 80
const PANELES: Array<{ id: Exclude<PanelLienzo, null>; label: string; icon: typeof Palette }> = [
  { id: 'fondo', label: 'Fondo', icon: Palette }, { id: 'texto', label: 'Texto', icon: Type },
  { id: 'parrafo', label: 'Párrafo', icon: AlignLeft }, { id: 'recursos', label: 'Recursos', icon: ImageIcon },
  { id: 'biblia', label: 'Biblia', icon: BookOpen }, { id: 'diseno', label: 'Diseño', icon: Layers },
]
const BANCOS_EXTERNOS = [
  { label: 'Unsplash', href: 'https://unsplash.com/' }, { label: 'Pexels', href: 'https://www.pexels.com/' }, { label: 'Pixabay', href: 'https://pixabay.com/' },
]
const COLORES_FONDO = ['#ffffff', '#f8fafc', '#f5f3ff', '#fff7ed', '#0f172a', '#312e81', '#4c0519']
const COLORES_TEXTO = ['#0f172a', '#ffffff', '#312e81', '#7f1d1d', '#14532d', '#1e3a8a']
const claseBotonActivo = (activo: boolean) => `grid h-10 w-10 place-items-center rounded-full transition ${activo ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-slate-700'}`

function textoPlano(html: string) {
  if (typeof window !== 'undefined') { const div = document.createElement('div'); div.innerHTML = limpiarHtmlCanvas(html); return div.innerText.trim() }
  return String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function PastoralVisualWorkspace({ paquete, biblioteca }: { paquete: Paquete; coleccion: unknown; biblioteca: RecursoPastoral[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const undoRef = useRef<Snapshot[]>([])
  const redoRef = useRef<Snapshot[]>([])
  const touchStart = useRef(0)
  const [vista, setVista] = useState<VistaLienzo>('contenido')
  const [panel, setPanel] = useState<PanelLienzo>(null)
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

  return <div className="pastoral-content-workspace text-slate-900">
    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { subirImagen(event.target.files?.[0]); event.currentTarget.value = '' }} />
    <header className="sticky top-0 z-40 -mx-4 bg-[#f4f5f9]/96 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-2">
        <input dir="ltr" value={titulo} onFocus={registrarHistorial} onChange={(event) => setTitulo(event.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none" />
        <button type="button" onClick={deshacer} disabled={!undoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Deshacer"><Undo2 className="h-4 w-4" /></button>
        <button type="button" onClick={rehacer} disabled={!redoRef.current.length} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 disabled:opacity-25" aria-label="Rehacer"><Redo2 className="h-4 w-4" /></button>
        {guardado && <Check className="h-4 w-4 text-emerald-600" />}
        <button type="button" onClick={guardar} disabled={isPending} className="grid h-10 w-10 place-items-center rounded-full bg-violet-600 text-white disabled:opacity-60" aria-label="Guardar proyecto">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button>
      </div>
      <nav className="mt-2 flex items-center gap-5 overflow-x-auto text-xs font-bold text-slate-400 [scrollbar-width:none]">
        <button type="button" onClick={() => cambiarVista('contenido')} className={vista === 'contenido' ? 'text-violet-700' : ''}>Editar</button>
        <button type="button" onClick={() => cambiarVista('presentacion')} className={vista === 'presentacion' ? 'text-violet-700' : ''}>Presentar</button>
        <button type="button" onClick={() => cambiarVista('congregacion')} className={vista === 'congregacion' ? 'text-violet-700' : ''}>Congregación</button>
        <button type="button" onClick={() => cambiarVista('publicar')} className={vista === 'publicar' ? 'text-violet-700' : ''}>Compartir</button>
      </nav>
    </header>

    {vista === 'contenido' && pagina && <section className="pb-10">
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto border-y border-slate-200/80 py-1.5 [scrollbar-width:none]">
        {paginas.map((_, i) => <div key={i} className={`flex shrink-0 items-center rounded-xl ${i === indice ? 'bg-white shadow-sm' : ''}`}><button type="button" onClick={() => { setIndice(i); setSeleccion(null) }} className={`min-h-10 px-3 text-xs font-bold ${i === indice ? 'text-violet-700' : 'text-slate-500'}`}>Página {i + 1}</button>{i === indice && paginas.length > 1 && <button type="button" onClick={() => eliminarPagina(i)} className="grid h-9 w-9 place-items-center text-rose-500" aria-label={`Eliminar Página ${i + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>}</div>)}
        <button type="button" onClick={nuevaPagina} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-700" aria-label="Nueva página"><Plus className="h-4 w-4" /></button>
      </div>

      <div className="sticky top-[84px] z-30 -mx-4 bg-[#f4f5f9]/96 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto border-y border-slate-200/80 py-1 [scrollbar-width:none]" aria-label="Herramientas del lienzo">
          {PANELES.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setPanel((actual) => actual === id ? null : id)} className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${panel === id ? 'bg-violet-100 text-violet-700' : 'text-slate-700'}`}><Icon className="h-4 w-4" />{label}<ChevronDown className={`h-3 w-3 transition ${panel === id ? 'rotate-180' : ''}`} /></button>)}
          {elementoSeleccionado && <><span className="mx-1 h-6 w-px shrink-0 bg-slate-300" /><button type="button" onClick={() => eliminarElemento(elementoSeleccionado.id)} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Borrar</button></>}
        </div>
      </div>

      {panel && <div className="border-b border-slate-200/80 py-3">
        {panel === 'fondo' && <div className="space-y-4">
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => prepararSubida('fondo')} disabled={subiendoImagen} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-bold text-white"><Upload className="h-4 w-4" /> Subir imagen</button>{pagina.fondo_modo === 'imagen' && <button type="button" onClick={quitarFondoImagen} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-rose-50 px-4 text-xs font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Quitar fondo</button>}{imagenes.slice(0, 8).map((recurso) => <button key={recurso.id} type="button" onClick={() => aplicarFondoImagen(recurso)} className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-slate-200"><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} className="h-full w-full object-cover" /></button>)}</div>
          <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Color</p><div className="flex flex-wrap gap-2">{COLORES_FONDO.map((color) => <button key={color} type="button" onClick={() => actualizarPagina({ fondo_modo: 'color', fondo: color })} className={`h-9 w-9 rounded-full border border-slate-300 ${pagina.fondo_modo === 'color' && pagina.fondo === color ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`} style={{ backgroundColor: color }} aria-label={`Fondo ${color}`} />)}</div></div>
          <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Temas</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{TEMAS_LIENZO.map((tema) => <button key={tema.id} type="button" onClick={() => actualizarPagina({ fondo_modo: 'tema', fondo_tema: tema.id, color_texto: tema.texto })} className={`min-h-14 rounded-xl p-2 text-[10px] font-bold shadow-sm ${pagina.fondo_modo === 'tema' && pagina.fondo_tema === tema.id ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`} style={{ background: tema.css, color: tema.texto }}>{tema.label}</button>)}</div></div>
        </div>}

        {panel === 'texto' && <div className="space-y-4">
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => agregarTexto('libre')} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Caja de texto</button>{ESTILOS_TEXTO.filter((item) => item.id !== 'libre').map((estilo) => <button key={estilo.id} type="button" onClick={() => aplicarRolTexto(estilo.id)} className={`min-h-10 rounded-full px-4 text-xs font-bold ${textoSeleccionado?.rol === estilo.id ? 'bg-violet-600 text-white' : 'bg-white text-slate-700'}`}>{estilo.label}</button>)}</div>
          {textoSeleccionado && <>
            <div><p className="mb-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Tipografía</p><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{FUENTES_PASTORALES.map((fuente) => <button key={fuente} type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { fuente })} className={`min-h-9 shrink-0 rounded-full px-3 text-xs ${textoSeleccionado.fuente === fuente ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`} style={{ fontFamily: fuente }}>{fuente}</button>)}</div></div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { peso: (textoSeleccionado.peso ?? 500) >= 700 ? 500 : 800 })} className={claseBotonActivo((textoSeleccionado.peso ?? 500) >= 700)} aria-pressed={(textoSeleccionado.peso ?? 500) >= 700}><Bold className="h-4 w-4" /></button>
              <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { cursiva: !textoSeleccionado.cursiva })} className={claseBotonActivo(Boolean(textoSeleccionado.cursiva))} aria-pressed={Boolean(textoSeleccionado.cursiva)}><Italic className="h-4 w-4" /></button>
              <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { subrayado: !textoSeleccionado.subrayado })} className={claseBotonActivo(Boolean(textoSeleccionado.subrayado))} aria-pressed={Boolean(textoSeleccionado.subrayado)}><Underline className="h-4 w-4" /></button>
              <button type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { tachado: !textoSeleccionado.tachado })} className={claseBotonActivo(Boolean(textoSeleccionado.tachado))} aria-pressed={Boolean(textoSeleccionado.tachado)}><Strikethrough className="h-4 w-4" /></button>
              <label className="flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-bold text-slate-600">Tamaño <input aria-label="Tamaño de letra en puntos" type="number" min="8" max="160" value={Math.round(textoSeleccionado.tamano_fuente ?? 24)} onChange={(e) => actualizarElemento(textoSeleccionado.id, { tamano_fuente: Math.min(160, Math.max(8, Number(e.target.value) || 8)) })} className="w-14 bg-transparent text-right font-black text-slate-900 outline-none" /><span>pt</span></label>
              <input aria-label="Ajustar tamaño de letra" type="range" min="8" max="160" value={textoSeleccionado.tamano_fuente ?? 24} onChange={(e) => actualizarElemento(textoSeleccionado.id, { tamano_fuente: Number(e.target.value) })} className="min-w-36 flex-1" />
            </div>
            <div className="flex flex-wrap gap-2">{COLORES_TEXTO.map((color) => <button key={color} type="button" onClick={() => actualizarElemento(textoSeleccionado.id, { color })} className={`h-8 w-8 rounded-full border border-slate-300 ${textoSeleccionado.color === color ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`} style={{ backgroundColor: color }} aria-label={`Color de texto ${color}`} />)}</div>
          </>}
        </div>}

        {panel === 'parrafo' && <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => alinear('izquierda')} className={claseBotonActivo(textoSeleccionado?.alineacion !== 'centro' && textoSeleccionado?.alineacion !== 'derecha')} aria-pressed={textoSeleccionado?.alineacion === 'izquierda'}><AlignLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => alinear('centro')} className={claseBotonActivo(textoSeleccionado?.alineacion === 'centro')} aria-pressed={textoSeleccionado?.alineacion === 'centro'}><AlignCenter className="h-4 w-4" /></button>
          <button type="button" onClick={() => alinear('derecha')} className={claseBotonActivo(textoSeleccionado?.alineacion === 'derecha')} aria-pressed={textoSeleccionado?.alineacion === 'derecha'}><AlignRight className="h-4 w-4" /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertUnorderedList')} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700"><List className="h-4 w-4" /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => comandoParrafo('insertOrderedList')} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700"><ListOrdered className="h-4 w-4" /></button>
          {textoSeleccionado && <label className="flex items-center gap-2 text-xs font-bold text-slate-600">Interlineado <input type="range" min="0.9" max="2" step="0.05" value={textoSeleccionado.interlineado ?? 1.25} onChange={(e) => actualizarElemento(textoSeleccionado.id, { interlineado: Number(e.target.value) })} /></label>}
        </div>}

        {panel === 'recursos' && <div className="space-y-3">
          <div className="flex gap-2"><button type="button" onClick={() => prepararSubida('elemento')} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-bold text-white"><Upload className="h-4 w-4" /> Subir imagen</button><input value={busquedaRecursos} onChange={(e) => setBusquedaRecursos(e.target.value)} placeholder="Buscar en mi biblioteca" className="min-h-10 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none" /></div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{recursosFiltrados.slice(0, 20).map((recurso) => <button key={recurso.id} type="button" onClick={() => agregarImagen(recurso)} className="overflow-hidden rounded-xl"><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} className="aspect-square w-full object-cover" /></button>)}</div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3"><span className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Buscar fondos externos</span>{BANCOS_EXTERNOS.map((banco) => <a key={banco.label} href={banco.href} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white px-3 text-xs font-bold text-slate-700">{banco.label}<ExternalLink className="h-3 w-3" /></a>)}<span className="basis-full text-[10px] leading-4 text-slate-500">Verifica siempre las condiciones de uso y derechos de personas, marcas u obras visibles.</span></div>
        </div>}

        {panel === 'biblia' && <button type="button" onClick={() => setSelectorVersiculo(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-bold text-white"><BookOpen className="h-4 w-4" /> Agregar versículo</button>}

        {panel === 'diseno' && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{FORMATOS_LIENZO.map(({ id, label, detalle }) => { const Icon = id === '9:16' ? Smartphone : id === '1:1' ? Square : Monitor; return <button key={id} type="button" onClick={() => actualizarPagina({ formato: id })} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-left ${pagina.formato === id ? 'bg-violet-600 text-white' : 'bg-white text-slate-700'}`}><Icon className="h-4 w-4" /><span><strong className="block text-xs">{label}</strong><small className="opacity-70">{detalle}</small></span></button> })}</div>
          {elementoSeleccionado && <div className="space-y-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => duplicarElemento(elementoSeleccionado.id)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-bold"><Copy className="h-4 w-4" /> Duplicar</button><button type="button" onClick={() => moverCapa(elementoSeleccionado.id, 1)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-bold"><ArrowUp className="h-4 w-4" /> Adelante</button><button type="button" onClick={() => moverCapa(elementoSeleccionado.id, -1)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-bold"><ArrowDown className="h-4 w-4" /> Atrás</button><button type="button" onClick={() => eliminarElemento(elementoSeleccionado.id)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-rose-50 px-3 text-xs font-bold text-rose-600"><Trash2 className="h-4 w-4" /> Borrar</button></div>{elementoSeleccionado.tipo === 'imagen' && <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => actualizarElemento(elementoSeleccionado.id, { ajuste: elementoSeleccionado.ajuste === 'contain' ? 'cover' : 'contain' })} className="min-h-10 rounded-full bg-white px-3 text-xs font-bold">Ajuste: {elementoSeleccionado.ajuste === 'contain' ? 'Contener' : 'Cubrir'}</button><label className="text-xs font-bold text-slate-600">Opacidad <input type="range" min="0.1" max="1" step="0.05" value={elementoSeleccionado.opacidad ?? 1} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { opacidad: Number(e.target.value) })} /></label><label className="text-xs font-bold text-slate-600">Esquinas <input type="range" min="0" max="40" value={elementoSeleccionado.radio ?? 14} onChange={(e) => actualizarElemento(elementoSeleccionado.id, { radio: Number(e.target.value) })} /></label></div>}</div>}
        </div>}
      </div>}

      <div className="mt-3"><PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} editable seleccion={seleccion} onSelect={setSeleccion} onBeginChange={registrarHistorial} onPatchElement={patchElementoSinHistorial} onTextInput={(id, contenido) => patchElementoSinHistorial(id, { contenido })} onDeleteElement={eliminarElemento} /></div>
      <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400"><span>Página {indice + 1} de {paginas.length} · {pagina.formato ?? '16:9'}</span><span className="hidden sm:inline">Selecciona un elemento para editarlo · mover arriba izquierda · tamaño abajo derecha · borrar arriba derecha</span></div>
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
    <style jsx global>{`@media print{@page{margin:0;size:landscape}body{background:white!important}body>*{visibility:hidden!important}.pastoral-print-deck,.pastoral-print-deck *{visibility:visible!important}.pastoral-print-deck{position:absolute!important;inset:0!important;display:block!important;width:100%!important}.pastoral-print-page{display:flex;min-height:100vh;align-items:center;justify-content:center;break-after:page;page-break-after:always;background:white}.pastoral-print-page .pastoral-visual-canvas{box-shadow:none!important;max-height:100vh}}`}</style>
  </div>
}
