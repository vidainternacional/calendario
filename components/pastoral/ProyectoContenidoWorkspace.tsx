'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter, AlignLeft, AlignRight, Bold, BookOpen, Check, ChevronLeft, ChevronRight,
  Eraser, Heading1, Heading2, Image as ImageIcon, Italic, LayoutTemplate, List, ListOrdered,
  Loader2, Maximize2, Palette, Pilcrow, Plus, Quote, Redo2, Save, Strikethrough, Trash2,
  Underline, Undo2,
} from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { mostrarToast } from '@/lib/ui/toast'
import PackageDistributionControls from '@/components/pastoral/PackageDistributionControls'
import PastoralVersePicker from '@/components/pastoral/PastoralVersePicker'

type Plantilla = 'limpia' | 'titulo' | 'imagen' | 'versiculo'
type Alineacion = 'izquierda' | 'centro' | 'derecha'
type Tamano = 'compacto' | 'normal' | 'grande'
type Diapositiva = {
  titulo: string
  contenido: string
  recurso_id: string | null
  plantilla?: Plantilla
  fondo?: string
  color_texto?: string
  alineacion?: Alineacion
  tamano?: Tamano
}
type Recurso = {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  tipo: 'archivo' | 'enlace'
  acceso_url: string | null
  mime_type?: string | null
  nombre_archivo?: string | null
}
type Audiencia = 'iglesia' | 'lideres' | 'servidores' | 'publico'
type Paquete = {
  id: string
  titulo: string
  descripcion_publica: string
  instrucciones: string
  notas_privadas: string
  bosquejo_id: string | null
  coleccion_id: string | null
  recurso_ids: string[]
  estado: 'borrador' | 'listo' | 'compartido'
  presentacion_diapositivas: Diapositiva[]
  presentacion_pdf_recurso_id: string | null
  audiencia: Audiencia
  publicado: boolean
  destacado: boolean
}
type Vista = 'contenido' | 'presentacion' | 'congregacion' | 'publicar'
type Panel = 'imagen' | 'diseno' | null

const PLANTILLAS: Array<{ id: Plantilla; label: string; descripcion: string }> = [
  { id: 'limpia', label: 'Limpia', descripcion: 'Documento claro' },
  { id: 'titulo', label: 'Título', descripcion: 'Título protagonista' },
  { id: 'imagen', label: 'Imagen', descripcion: 'Imagen a pantalla' },
  { id: 'versiculo', label: 'Versículo', descripcion: 'Texto bíblico destacado' },
]
const FONDOS = ['#ffffff', '#f8fafc', '#f5f3ff', '#fff7ed', '#0f172a', '#312e81']
const TAGS_SEGUROS = new Set(['P', 'BR', 'DIV', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3'])

function escaparHtml(valor: string) {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function contenidoAHtml(valor: string) {
  const texto = String(valor ?? '')
  if (!texto) return ''
  if (/<\/?(?:p|br|div|strong|b|em|i|u|s|ul|ol|li|blockquote|h[1-3])\b/i.test(texto)) return texto
  return escaparHtml(texto).replace(/\n/g, '<br>')
}

function limpiarHtmlSeguro(html: string) {
  if (typeof window === 'undefined') return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  const contenedor = document.createElement('div')
  contenedor.innerHTML = html
  const recorrer = (nodo: Node) => {
    Array.from(nodo.childNodes).forEach((hijo) => {
      if (hijo.nodeType !== Node.ELEMENT_NODE) return
      const elemento = hijo as HTMLElement
      if (!TAGS_SEGUROS.has(elemento.tagName)) {
        elemento.replaceWith(...Array.from(elemento.childNodes))
        return
      }
      Array.from(elemento.attributes).forEach((atributo) => elemento.removeAttribute(atributo.name))
      recorrer(elemento)
    })
  }
  recorrer(contenedor)
  return contenedor.innerHTML
}

function htmlATexto(html: string) {
  if (!html) return ''
  if (typeof window !== 'undefined') {
    const contenedor = document.createElement('div')
    contenedor.innerHTML = limpiarHtmlSeguro(html)
    return contenedor.innerText.trim()
  }
  return html.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/p>|<\/div>|<\/li>|<\/blockquote>|<\/h[1-3]>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function normalizarPagina(item: Diapositiva): Diapositiva {
  return {
    ...item,
    contenido: contenidoAHtml(item.contenido ?? ''),
    plantilla: item.plantilla ?? 'limpia',
    fondo: item.fondo ?? '#ffffff',
    color_texto: item.color_texto ?? '#0f172a',
    alineacion: item.alineacion ?? 'izquierda',
    tamano: item.tamano ?? 'normal',
  }
}

export default function ProyectoContenidoWorkspace({ paquete, biblioteca }: { paquete: Paquete; coleccion: unknown; biblioteca: Recurso[] }) {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const seleccionRef = useRef<Range | null>(null)
  const touchStart = useRef(0)
  const [vista, setVista] = useState<Vista>('contenido')
  const [panel, setPanel] = useState<Panel>(null)
  const [selectorVersiculo, setSelectorVersiculo] = useState(false)
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [indice, setIndice] = useState(0)
  const [guardado, setGuardado] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<string[]>(paquete.recurso_ids ?? [])
  const iniciales = paquete.presentacion_diapositivas?.length
    ? paquete.presentacion_diapositivas.map(normalizarPagina)
    : [normalizarPagina({ titulo: '', contenido: '', recurso_id: null })]
  const [paginas, setPaginas] = useState<Diapositiva[]>(iniciales)
  const pagina = paginas[indice] ?? paginas[0]
  const recursoPagina = biblioteca.find((item) => item.id === pagina?.recurso_id) ?? null

  const actualizarPagina = (campo: keyof Diapositiva, valor: string | null) => {
    setPaginas((actuales) => actuales.map((item, i) => i === indice ? { ...item, [campo]: valor } : item))
  }

  const sincronizarEditor = () => {
    const editor = editorRef.current
    if (!editor) return
    actualizarPagina('contenido', limpiarHtmlSeguro(editor.innerHTML))
  }

  const seleccionarPagina = (i: number) => {
    sincronizarEditor()
    setIndice(i)
    setPanel(null)
    seleccionRef.current = null
    requestAnimationFrame(() => {
      const editor = editorRef.current
      if (editor) editor.innerHTML = limpiarHtmlSeguro(paginas[i]?.contenido ?? '')
    })
  }

  const nuevaPagina = () => {
    sincronizarEditor()
    const nueva = normalizarPagina({ titulo: '', contenido: '', recurso_id: null })
    const siguiente = paginas.length
    setPaginas((actuales) => [...actuales, nueva])
    setIndice(siguiente)
    setPanel(null)
    seleccionRef.current = null
    requestAnimationFrame(() => { if (editorRef.current) editorRef.current.innerHTML = '' })
  }

  const eliminarPagina = (i = indice) => {
    if (paginas.length === 1) return
    const siguientes = paginas.filter((_, p) => p !== i)
    const nuevoIndice = Math.min(i, siguientes.length - 1)
    setPaginas(siguientes)
    setIndice(nuevoIndice)
    setPanel(null)
    seleccionRef.current = null
    requestAnimationFrame(() => { if (editorRef.current) editorRef.current.innerHTML = limpiarHtmlSeguro(siguientes[nuevoIndice]?.contenido ?? '') })
    mostrarToast('Página eliminada')
  }

  const guardarSeleccion = () => {
    const selection = window.getSelection()
    if (!selection?.rangeCount || !editorRef.current) return
    const range = selection.getRangeAt(0)
    if (editorRef.current.contains(range.commonAncestorContainer)) seleccionRef.current = range.cloneRange()
  }

  const restaurarSeleccion = () => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    selection?.removeAllRanges()
    if (seleccionRef.current && editor.contains(seleccionRef.current.commonAncestorContainer)) {
      selection?.addRange(seleccionRef.current)
      return
    }
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection?.addRange(range)
    seleccionRef.current = range.cloneRange()
  }

  const comando = (nombre: string, valor?: string) => {
    restaurarSeleccion()
    document.execCommand(nombre, false, valor)
    sincronizarEditor()
    guardarSeleccion()
  }

  const formatoBloque = (tag: 'p' | 'h1' | 'h2' | 'blockquote') => comando('formatBlock', tag)

  const insertarVersiculo = (versiculo: { referencia: string; texto: string; traduccion: string }) => {
    const editor = editorRef.current
    if (!editor) return
    restaurarSeleccion()
    const selection = window.getSelection()
    let range = selection?.rangeCount ? selection.getRangeAt(0) : null
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
    }

    const referencia = `${versiculo.referencia}${versiculo.traduccion ? ` · ${versiculo.traduccion}` : ''}`
    const bloque = document.createElement('blockquote')
    const ref = document.createElement('strong')
    ref.textContent = referencia
    bloque.append(ref, document.createElement('br'), document.createTextNode(versiculo.texto))
    bloque.dir = 'ltr'

    const espacioAntes = document.createElement('p')
    espacioAntes.appendChild(document.createElement('br'))
    const espacioDespues = document.createElement('p')
    espacioDespues.appendChild(document.createElement('br'))

    const contenedorBloque = (range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer as Element : range.startContainer.parentElement)?.closest('blockquote')
    if (contenedorBloque && editor.contains(contenedorBloque)) {
      contenedorBloque.insertAdjacentElement('afterend', bloque)
      bloque.insertAdjacentElement('afterend', espacioDespues)
    } else if (range.collapsed && range.startOffset === 0 && editor.childNodes.length === 0) {
      editor.append(espacioAntes, bloque, espacioDespues)
    } else {
      range.deleteContents()
      const frag = document.createDocumentFragment()
      frag.append(bloque, espacioDespues)
      range.insertNode(frag)
    }

    const nuevaSeleccion = document.createRange()
    nuevaSeleccion.selectNodeContents(espacioDespues)
    nuevaSeleccion.collapse(true)
    selection?.removeAllRanges()
    selection?.addRange(nuevaSeleccion)
    seleccionRef.current = nuevaSeleccion.cloneRange()
    sincronizarEditor()
    mostrarToast(`${versiculo.referencia} agregado a Página ${indice + 1}`)
  }

  const abrirVersiculos = () => {
    guardarSeleccion()
    setPanel(null)
    setSelectorVersiculo(true)
  }

  const construirFormulario = () => {
    const formData = new FormData()
    formData.set('titulo', titulo)
    formData.set('descripcion_publica', paquete.descripcion_publica)
    formData.set('instrucciones', paquete.instrucciones)
    formData.set('notas_privadas', paquete.notas_privadas ?? '')
    formData.set('estado', paquete.estado)
    formData.set('bosquejo_id', paquete.bosquejo_id ?? '')
    formData.set('coleccion_id', paquete.coleccion_id ?? '')
    formData.set('presentacion_pdf_recurso_id', paquete.presentacion_pdf_recurso_id ?? '')
    recursosSeleccionados.forEach((id) => formData.append('recurso_ids', id))
    paginas.forEach((item) => {
      formData.append('diapositiva_titulo', item.titulo)
      formData.append('diapositiva_contenido', limpiarHtmlSeguro(item.contenido))
      formData.append('diapositiva_recurso_id', item.recurso_id ?? '')
      formData.append('diapositiva_plantilla', item.plantilla ?? 'limpia')
      formData.append('diapositiva_fondo', item.fondo ?? '#ffffff')
      formData.append('diapositiva_color_texto', item.color_texto ?? '#0f172a')
      formData.append('diapositiva_alineacion', item.alineacion ?? 'izquierda')
      formData.append('diapositiva_tamano', item.tamano ?? 'normal')
    })
    return formData
  }

  const guardar = () => startTransition(async () => {
    sincronizarEditor()
    const resultado = await editarPaquetePastoral(paquete.id, construirFormulario())
    if (!resultado.success) return mostrarToast(resultado.error)
    setGuardado(true)
    window.setTimeout(() => setGuardado(false), 1500)
    mostrarToast('Proyecto guardado')
    router.refresh()
  })

  const alineacionClase = pagina?.alineacion === 'centro' ? 'text-center' : pagina?.alineacion === 'derecha' ? 'text-right' : 'text-left'
  const tituloClase = pagina?.tamano === 'grande' ? 'text-4xl' : pagina?.tamano === 'compacto' ? 'text-2xl' : 'text-3xl'
  const cuerpoClase = pagina?.tamano === 'grande' ? 'text-xl leading-9' : pagina?.tamano === 'compacto' ? 'text-sm leading-6' : 'text-[17px] leading-8'
  const moverPresentacion = (delta: number) => setIndice((actual) => Math.min(Math.max(actual + delta, 0), paginas.length - 1))

  const formato = [
    { label: 'Negrita', icon: Bold, accion: () => comando('bold') },
    { label: 'Cursiva', icon: Italic, accion: () => comando('italic') },
    { label: 'Subrayado', icon: Underline, accion: () => comando('underline') },
    { label: 'Tachado', icon: Strikethrough, accion: () => comando('strikeThrough') },
    { label: 'Título', icon: Heading1, accion: () => formatoBloque('h1') },
    { label: 'Subtítulo', icon: Heading2, accion: () => formatoBloque('h2') },
    { label: 'Texto', icon: Pilcrow, accion: () => formatoBloque('p') },
    { label: 'Lista', icon: List, accion: () => comando('insertUnorderedList') },
    { label: 'Numerada', icon: ListOrdered, accion: () => comando('insertOrderedList') },
    { label: 'Cita', icon: Quote, accion: () => formatoBloque('blockquote') },
    { label: 'Izquierda', icon: AlignLeft, accion: () => comando('justifyLeft') },
    { label: 'Centro', icon: AlignCenter, accion: () => comando('justifyCenter') },
    { label: 'Derecha', icon: AlignRight, accion: () => comando('justifyRight') },
    { label: 'Deshacer', icon: Undo2, accion: () => comando('undo') },
    { label: 'Rehacer', icon: Redo2, accion: () => comando('redo') },
    { label: 'Limpiar', icon: Eraser, accion: () => comando('removeFormat') },
  ]

  const plantillaClase = pagina.plantilla === 'titulo'
    ? 'pastoral-template-title'
    : pagina.plantilla === 'versiculo'
      ? 'pastoral-template-verse'
      : pagina.plantilla === 'imagen'
        ? 'pastoral-template-image'
        : 'pastoral-template-clean'

  return (
    <div className="pastoral-content-workspace text-slate-900">
      <header className="sticky top-0 z-30 -mx-4 bg-[#f4f5f9]/96 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <input dir="ltr" value={titulo} onChange={(e) => setTitulo(e.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none" />
          {guardado && <Check className="h-4 w-4 text-emerald-600" />}
          <button type="button" onClick={guardar} disabled={isPending} className="grid h-10 w-10 place-items-center rounded-full bg-violet-600 text-white disabled:opacity-60" aria-label="Guardar proyecto">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button>
        </div>
        <div className="mt-2 flex items-center gap-5 overflow-x-auto text-xs font-bold text-slate-400 [scrollbar-width:none]">
          <button type="button" onClick={() => setVista('contenido')} className={vista === 'contenido' ? 'text-violet-700' : ''}>Editar</button>
          <button type="button" onClick={() => { sincronizarEditor(); setVista('presentacion') }} className={vista === 'presentacion' ? 'text-violet-700' : ''}>Presentar</button>
          <button type="button" onClick={() => { sincronizarEditor(); setVista('congregacion') }} className={vista === 'congregacion' ? 'text-violet-700' : ''}>Congregación</button>
          <button type="button" onClick={() => { sincronizarEditor(); setVista('publicar') }} className={vista === 'publicar' ? 'text-violet-700' : ''}>Compartir</button>
        </div>
      </header>

      {vista === 'contenido' && pagina && (
        <section className="pb-10">
          <div className="mt-3 rounded-2xl bg-slate-200/65 p-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {paginas.map((_, i) => (
                <div key={i} className={`flex shrink-0 items-center rounded-xl ${i === indice ? 'bg-white shadow-sm' : ''}`}>
                  <button type="button" onClick={() => seleccionarPagina(i)} className={`min-h-10 px-3 text-xs font-bold ${i === indice ? 'text-violet-700' : 'text-slate-500'}`}>Página {i + 1}</button>
                  {i === indice && paginas.length > 1 && <button type="button" onClick={() => eliminarPagina(i)} className="grid h-9 w-9 place-items-center text-rose-500" aria-label={`Eliminar Página ${i + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              ))}
              <button type="button" onClick={nuevaPagina} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-700" aria-label="Nueva página"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="sticky top-[82px] z-20 -mx-4 mt-2 bg-[#f4f5f9]/96 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-white/92 p-1.5 shadow-sm [scrollbar-width:none]" aria-label="Herramientas del contenido">
              {formato.map(({ label, icon: Icon, accion }) => <button key={label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={accion} className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl px-2 text-slate-600 active:bg-violet-100 active:text-violet-700" aria-label={label} title={label}><Icon className="h-4 w-4" /></button>)}
              <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />
              <button type="button" onClick={abrirVersiculos} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-slate-700 active:bg-violet-100 active:text-violet-700"><BookOpen className="h-4 w-4" /> Versículo</button>
              <button type="button" onClick={() => setPanel((actual) => actual === 'imagen' ? null : 'imagen')} className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${panel === 'imagen' ? 'bg-violet-100 text-violet-700' : 'text-slate-700'}`}><ImageIcon className="h-4 w-4" /> Imagen</button>
              <button type="button" onClick={() => setPanel((actual) => actual === 'diseno' ? null : 'diseno')} className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${panel === 'diseno' ? 'bg-violet-100 text-violet-700' : 'text-slate-700'}`}><Palette className="h-4 w-4" /> Diseño</button>
            </div>
          </div>

          {panel === 'diseno' && <div className="mt-2 rounded-2xl bg-white/70 p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Plantilla</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{PLANTILLAS.map((item) => <button key={item.id} type="button" onClick={() => actualizarPagina('plantilla', item.id)} className={`min-h-16 rounded-2xl p-3 text-left transition ${pagina.plantilla === item.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'}`}><LayoutTemplate className="mb-1 h-4 w-4" /><strong className="block text-xs">{item.label}</strong><span className="mt-0.5 block text-[10px] opacity-70">{item.descripcion}</span></button>)}</div>
            <div className="mt-4 flex items-center gap-3 overflow-x-auto [scrollbar-width:none]"><span className="shrink-0 text-xs font-bold text-slate-500">Fondo</span>{FONDOS.map((color) => <button key={color} type="button" onClick={() => actualizarPagina('fondo', color)} className={`h-8 w-8 shrink-0 rounded-full border ${pagina.fondo === color ? 'ring-2 ring-violet-500 ring-offset-2' : 'border-slate-300'}`} style={{ backgroundColor: color }} aria-label={`Fondo ${color}`} />)}<label className="ml-2 shrink-0 text-xs font-bold text-slate-500">Texto <input type="color" value={pagina.color_texto ?? '#0f172a'} onChange={(e) => actualizarPagina('color_texto', e.target.value)} className="ml-1 h-8 w-10 bg-transparent align-middle" /></label></div>
          </div>}

          {panel === 'imagen' && <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-white/70 p-3">
            {biblioteca.map((recurso) => {
              const esImagen = recurso.mime_type?.startsWith('image/') && recurso.acceso_url
              if (!esImagen) return null
              const activo = pagina.recurso_id === recurso.id
              return <button key={recurso.id} type="button" onClick={() => { actualizarPagina('recurso_id', activo ? null : recurso.id); if (!activo) actualizarPagina('plantilla', 'imagen'); setRecursosSeleccionados((actuales) => actuales.includes(recurso.id) ? actuales : [...actuales, recurso.id]) }} className={`overflow-hidden rounded-xl ${activo ? 'ring-2 ring-violet-500' : ''}`}><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} className="aspect-square w-full object-cover" /></button>
            })}
            {!biblioteca.some((r) => r.mime_type?.startsWith('image/') && r.acceso_url) && <p className="col-span-3 py-6 text-center text-xs text-slate-500">Agrega imágenes a Biblioteca para utilizarlas aquí.</p>}
          </div>}

          <div className={`pastoral-slide-canvas ${plantillaClase} relative mt-3 overflow-hidden rounded-[28px] shadow-sm`} style={{ backgroundColor: pagina.fondo, color: pagina.color_texto }}>
            {recursoPagina?.acceso_url && pagina.plantilla === 'imagen' && <><img src={recursoPagina.acceso_url} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" /></>}
            <div className={`relative z-10 min-h-[52vh] p-6 ${alineacionClase}`}>
              <input dir="ltr" value={pagina.titulo} onChange={(e) => actualizarPagina('titulo', e.target.value)} placeholder="Título" className={`mb-4 w-full bg-transparent font-black outline-none placeholder:opacity-25 ${tituloClase} ${alineacionClase}`} style={{ color: 'inherit' }} />
              <div
                ref={editorRef}
                dir="ltr"
                contentEditable
                suppressContentEditableWarning
                onFocus={guardarSeleccion}
                onKeyUp={() => { sincronizarEditor(); guardarSeleccion() }}
                onMouseUp={guardarSeleccion}
                onTouchEnd={guardarSeleccion}
                onInput={sincronizarEditor}
                dangerouslySetInnerHTML={{ __html: limpiarHtmlSeguro(pagina.contenido) }}
                data-placeholder="Empieza a escribir…"
                className={`pastoral-rich-editor min-h-[36vh] w-full bg-transparent outline-none ${cuerpoClase} ${alineacionClase}`}
                style={{ color: 'inherit', direction: 'ltr', unicodeBidi: 'plaintext' }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400"><span>Página {indice + 1} de {paginas.length}</span>{paginas.length > 1 && <button type="button" onClick={() => eliminarPagina()} className="inline-flex min-h-10 items-center gap-1.5 px-2 text-rose-500"><Trash2 className="h-4 w-4" /> Eliminar página</button>}</div>
        </section>
      )}

      {vista === 'presentacion' && pagina && <section className="pb-8 pt-5">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-xl font-bold">Presentación</h2><p className="text-xs text-slate-500">Modo horizontal. Desliza izquierda o derecha.</p></div><Maximize2 className="h-5 w-5 text-slate-400" /></div>
        <div onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? 0 }} onTouchEnd={(e) => { const fin = e.changedTouches[0]?.clientX ?? touchStart.current; const delta = fin - touchStart.current; if (Math.abs(delta) > 45) moverPresentacion(delta < 0 ? 1 : -1) }} className={`pastoral-presentation-slide ${plantillaClase} relative aspect-video overflow-hidden rounded-3xl p-6 ${alineacionClase}`} style={{ backgroundColor: pagina.fondo, color: pagina.color_texto }}>
          {recursoPagina?.acceso_url && pagina.plantilla === 'imagen' && <><img src={recursoPagina.acceso_url} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" /></>}
          <div className="relative z-10 flex h-full flex-col justify-center"><h3 className={`${tituloClase} font-extrabold`}>{pagina.titulo}</h3><div className={`mt-3 ${cuerpoClase}`} dangerouslySetInnerHTML={{ __html: limpiarHtmlSeguro(pagina.contenido) }} /></div>
          <button type="button" onClick={() => moverPresentacion(-1)} disabled={indice === 0} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/15 p-2 text-current disabled:opacity-0"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => moverPresentacion(1)} disabled={indice === paginas.length - 1} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/15 p-2 text-current disabled:opacity-0"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">{paginas.map((_, i) => <button key={i} type="button" onClick={() => setIndice(i)} className={`h-2.5 rounded-full transition-all ${i === indice ? 'w-7 bg-violet-600' : 'w-2.5 bg-slate-300'}`} aria-label={`Página ${i + 1}`} />)}</div>
      </section>}

      {vista === 'congregacion' && <section className="pb-8 pt-5">
        <div className="mb-5"><h2 className="text-xl font-bold">Vista de la congregación</h2><p className="mt-1 text-sm text-slate-500">Así se leerá el material compartido, separado de las herramientas de edición.</p></div>
        <div className="space-y-8">{paginas.map((item, i) => <article key={i} dir="ltr"><p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-violet-500">Página {i + 1}</p>{item.titulo && <h3 className="text-2xl font-black text-slate-950">{item.titulo}</h3>}<div className="pastoral-congregation-content mt-3 text-base leading-8 text-slate-700" dangerouslySetInnerHTML={{ __html: limpiarHtmlSeguro(item.contenido) }} /></article>)}</div>
      </section>}

      {vista === 'publicar' && <div className="pb-8 pt-5"><PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia} initialPublished={paquete.publicado} initialFeatured={paquete.destacado} /></div>}

      <PastoralVersePicker open={selectorVersiculo} onClose={() => setSelectorVersiculo(false)} onInsert={insertarVersiculo} />

      <style jsx global>{`
        .pastoral-content-workspace button { -webkit-tap-highlight-color: transparent; }
        .pastoral-rich-editor { direction: ltr !important; unicode-bidi: plaintext !important; writing-mode: horizontal-tb !important; }
        .pastoral-rich-editor:empty:before { content: attr(data-placeholder); opacity: .28; pointer-events: none; }
        .pastoral-rich-editor h1 { font-size: 1.75em; line-height: 1.16; font-weight: 850; margin: .5em 0 .3em; }
        .pastoral-rich-editor h2 { font-size: 1.32em; line-height: 1.25; font-weight: 800; margin: .6em 0 .35em; }
        .pastoral-rich-editor p { min-height: 1.35em; margin: .35em 0; }
        .pastoral-rich-editor ul, .pastoral-rich-editor ol { padding-left: 1.4em; margin: .6em 0; }
        .pastoral-rich-editor ul { list-style: disc; } .pastoral-rich-editor ol { list-style: decimal; }
        .pastoral-rich-editor blockquote, .pastoral-congregation-content blockquote, .pastoral-presentation-slide blockquote { display:block; border-left: 3px solid rgba(124,58,237,.58); padding:.15em 0 .15em .9em; margin:1em 0; direction:ltr; unicode-bidi:plaintext; }
        .pastoral-rich-editor blockquote + blockquote { margin-top: 1.1em; }
        .pastoral-template-title .pastoral-rich-editor { text-align:center; }
        .pastoral-template-title > div, .pastoral-presentation-slide.pastoral-template-title > div { display:flex; min-height:inherit; flex-direction:column; justify-content:center; text-align:center; }
        .pastoral-template-image { color:white !important; }
        .pastoral-template-image input::placeholder, .pastoral-template-image .pastoral-rich-editor:empty:before { color:white; }
        .pastoral-template-verse .pastoral-rich-editor { font-family: Georgia, 'Times New Roman', serif; font-size:1.12em; }
        .pastoral-template-verse .pastoral-rich-editor blockquote, .pastoral-presentation-slide.pastoral-template-verse blockquote { border-left:0; padding-left:0; text-align:center; font-size:1.12em; }
      `}</style>
    </div>
  )
}
