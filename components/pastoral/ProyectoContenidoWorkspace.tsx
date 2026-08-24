'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter, AlignLeft, AlignRight, Bold, BookOpen, Check, ChevronLeft, ChevronRight, Copy,
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
type Vista = 'contenido' | 'presentacion' | 'guia' | 'publicar'
type Panel = 'imagen' | 'diseno' | null

const PLANTILLAS: Array<{ id: Plantilla; label: string }> = [
  { id: 'limpia', label: 'Limpia' },
  { id: 'titulo', label: 'Título' },
  { id: 'imagen', label: 'Imagen' },
  { id: 'versiculo', label: 'Versículo' },
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

  const seleccionarPagina = (i: number) => {
    sincronizarEditor()
    setIndice(i)
    setPanel(null)
    requestAnimationFrame(() => {
      const editor = editorRef.current
      if (editor) editor.innerHTML = limpiarHtmlSeguro(paginas[i]?.contenido ?? '')
    })
  }

  const nuevaPagina = () => {
    sincronizarEditor()
    const nueva = normalizarPagina({ titulo: '', contenido: '', recurso_id: null })
    setPaginas((actuales) => [...actuales, nueva])
    const siguiente = paginas.length
    setIndice(siguiente)
    setPanel(null)
    requestAnimationFrame(() => { if (editorRef.current) editorRef.current.innerHTML = '' })
  }

  const eliminarPagina = (i = indice) => {
    if (paginas.length === 1) return
    const siguientes = paginas.filter((_, p) => p !== i)
    const nuevoIndice = Math.min(i, siguientes.length - 1)
    setPaginas(siguientes)
    setIndice(nuevoIndice)
    setPanel(null)
    requestAnimationFrame(() => { if (editorRef.current) editorRef.current.innerHTML = limpiarHtmlSeguro(siguientes[nuevoIndice]?.contenido ?? '') })
    mostrarToast('Página eliminada')
  }

  const sincronizarEditor = () => {
    const editor = editorRef.current
    if (!editor) return
    actualizarPagina('contenido', limpiarHtmlSeguro(editor.innerHTML))
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
    if (seleccionRef.current) selection?.addRange(seleccionRef.current)
  }

  const comando = (nombre: string, valor?: string) => {
    restaurarSeleccion()
    document.execCommand(nombre, false, valor)
    sincronizarEditor()
    guardarSeleccion()
  }

  const formatoBloque = (tag: 'p' | 'h1' | 'h2' | 'blockquote') => comando('formatBlock', tag)

  const insertarVersiculo = (versiculo: { referencia: string; texto: string; traduccion: string }) => {
    restaurarSeleccion()
    const referencia = escaparHtml(`${versiculo.referencia}${versiculo.traduccion ? ` · ${versiculo.traduccion}` : ''}`)
    const texto = escaparHtml(versiculo.texto)
    document.execCommand('insertHTML', false, `<blockquote><strong>${referencia}</strong><br>${texto}</blockquote><p><br></p>`)
    sincronizarEditor()
    guardarSeleccion()
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

  const textoGuia = useMemo(() => paginas.map((item) => [item.titulo, htmlATexto(item.contenido)].filter(Boolean).join('\n')).join('\n\n'), [paginas])
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

  return (
    <div className="pastoral-content-workspace text-slate-900">
      <header className="sticky top-0 z-30 -mx-4 bg-[#f4f5f9]/96 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none" />
          {guardado && <Check className="h-4 w-4 text-emerald-600" />}
          <button type="button" onClick={guardar} disabled={isPending} className="grid h-10 w-10 place-items-center rounded-full bg-violet-600 text-white disabled:opacity-60" aria-label="Guardar proyecto">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button>
        </div>
        <div className="mt-2 flex items-center gap-5 text-xs font-bold text-slate-400">
          <button type="button" onClick={() => setVista('contenido')} className={vista === 'contenido' ? 'text-violet-700' : ''}>Editar</button>
          <button type="button" onClick={() => { sincronizarEditor(); setVista('presentacion') }} className={vista === 'presentacion' ? 'text-violet-700' : ''}>Presentar</button>
          <button type="button" onClick={() => { sincronizarEditor(); setVista('guia') }} className={vista === 'guia' ? 'text-violet-700' : ''}>Guía</button>
          <button type="button" onClick={() => { sincronizarEditor(); setVista('publicar') }} className={vista === 'publicar' ? 'text-violet-700' : ''}>Compartir</button>
        </div>
      </header>

      {vista === 'contenido' && pagina && (
        <section className="pb-32">
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
            <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-white/90 p-1.5 shadow-sm [scrollbar-width:none]" aria-label="Formato de texto">
              {formato.map(({ label, icon: Icon, accion }) => <button key={label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={accion} className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl px-2 text-slate-600 active:bg-violet-100 active:text-violet-700" aria-label={label} title={label}><Icon className="h-4 w-4" /></button>)}
            </div>
          </div>

          {panel === 'diseno' && <div className="mt-2 border-b border-slate-200 pb-4">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">{PLANTILLAS.map((item) => <button key={item.id} type="button" onClick={() => actualizarPagina('plantilla', item.id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${pagina.plantilla === item.id ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}><LayoutTemplate className="mr-1 inline h-3.5 w-3.5" />{item.label}</button>)}</div>
            <div className="mt-4 flex items-center gap-3 overflow-x-auto [scrollbar-width:none]"><span className="shrink-0 text-xs font-bold text-slate-500">Fondo</span>{FONDOS.map((color) => <button key={color} type="button" onClick={() => actualizarPagina('fondo', color)} className={`h-8 w-8 shrink-0 rounded-full border ${pagina.fondo === color ? 'ring-2 ring-violet-500 ring-offset-2' : 'border-slate-300'}`} style={{ backgroundColor: color }} aria-label={`Fondo ${color}`} />)}<label className="ml-2 shrink-0 text-xs font-bold text-slate-500">Texto <input type="color" value={pagina.color_texto ?? '#0f172a'} onChange={(e) => actualizarPagina('color_texto', e.target.value)} className="ml-1 h-8 w-10 bg-transparent align-middle" /></label></div>
          </div>}

          {panel === 'imagen' && <div className="grid grid-cols-3 gap-2 border-b border-slate-200 py-4">
            {biblioteca.map((recurso) => {
              const esImagen = recurso.mime_type?.startsWith('image/') && recurso.acceso_url
              if (!esImagen) return null
              const activo = pagina.recurso_id === recurso.id
              return <button key={recurso.id} type="button" onClick={() => { actualizarPagina('recurso_id', activo ? null : recurso.id); setRecursosSeleccionados((actuales) => actuales.includes(recurso.id) ? actuales : [...actuales, recurso.id]) }} className={`overflow-hidden rounded-xl ${activo ? 'ring-2 ring-violet-500' : ''}`}><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} className="aspect-square w-full object-cover" /></button>
            })}
            {!biblioteca.some((r) => r.mime_type?.startsWith('image/') && r.acceso_url) && <p className="col-span-3 py-6 text-center text-xs text-slate-500">Agrega imágenes a Biblioteca para utilizarlas aquí.</p>}
          </div>}

          <div className="mt-3 overflow-hidden rounded-[28px] shadow-sm" style={{ backgroundColor: pagina.fondo, color: pagina.color_texto }}>
            {recursoPagina?.acceso_url && pagina.plantilla === 'imagen' && <img src={recursoPagina.acceso_url} alt="" className="aspect-[16/7] w-full object-cover" />}
            <div className={`min-h-[52vh] p-6 ${alineacionClase}`}>
              <input value={pagina.titulo} onChange={(e) => actualizarPagina('titulo', e.target.value)} placeholder="Título" className={`mb-4 w-full bg-transparent font-black outline-none placeholder:opacity-25 ${tituloClase} ${alineacionClase}`} style={{ color: 'inherit' }} />
              <div
                ref={editorRef}
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
                style={{ color: 'inherit' }}
              />
              {recursoPagina?.acceso_url && pagina.plantilla !== 'imagen' && <img src={recursoPagina.acceso_url} alt="" className="mt-4 max-h-72 w-full rounded-2xl object-cover" />}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400"><span>Página {indice + 1} de {paginas.length}</span>{paginas.length > 1 && <button type="button" onClick={() => eliminarPagina()} className="inline-flex min-h-10 items-center gap-1.5 px-2 text-rose-500"><Trash2 className="h-4 w-4" /> Eliminar página</button>}</div>

          <div className="fixed inset-x-0 bottom-[calc(5.35rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_35px_rgba(15,23,42,.18)] backdrop-blur-xl">
              <button type="button" onClick={abrirVersiculos} className="flex min-h-12 items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-700 active:bg-violet-100 active:text-violet-700"><BookOpen className="h-4 w-4" /> Versículo</button>
              <button type="button" onClick={() => setPanel((actual) => actual === 'imagen' ? null : 'imagen')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-xs font-bold ${panel === 'imagen' ? 'bg-violet-100 text-violet-700' : 'text-slate-700'}`}><ImageIcon className="h-4 w-4" /> Imagen</button>
              <button type="button" onClick={() => setPanel((actual) => actual === 'diseno' ? null : 'diseno')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-xs font-bold ${panel === 'diseno' ? 'bg-violet-100 text-violet-700' : 'text-slate-700'}`}><Palette className="h-4 w-4" /> Diseño</button>
            </div>
          </div>
        </section>
      )}

      {vista === 'presentacion' && pagina && <section className="pb-8 pt-5">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-xl font-bold">Presentación</h2><p className="text-xs text-slate-500">Gira el teléfono y desliza entre páginas.</p></div><Maximize2 className="h-5 w-5 text-slate-400" /></div>
        <div onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? 0 }} onTouchEnd={(e) => { const fin = e.changedTouches[0]?.clientX ?? touchStart.current; const delta = fin - touchStart.current; if (Math.abs(delta) > 45) moverPresentacion(delta < 0 ? 1 : -1) }} className={`relative aspect-video overflow-hidden rounded-3xl p-6 ${alineacionClase}`} style={{ backgroundColor: pagina.fondo, color: pagina.color_texto }}>
          {recursoPagina?.acceso_url && pagina.plantilla === 'imagen' && <img src={recursoPagina.acceso_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
          <div className="relative z-10 flex h-full flex-col justify-center"><h3 className={`${tituloClase} font-extrabold`}>{pagina.titulo}</h3><div className={`mt-3 ${cuerpoClase}`} dangerouslySetInnerHTML={{ __html: limpiarHtmlSeguro(pagina.contenido) }} /></div>
          <button type="button" onClick={() => moverPresentacion(-1)} disabled={indice === 0} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/15 p-2 text-current disabled:opacity-0"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => moverPresentacion(1)} disabled={indice === paginas.length - 1} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/15 p-2 text-current disabled:opacity-0"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">{paginas.map((_, i) => <button key={i} type="button" onClick={() => setIndice(i)} className={`h-2.5 rounded-full transition-all ${i === indice ? 'w-7 bg-violet-600' : 'w-2.5 bg-slate-300'}`} aria-label={`Página ${i + 1}`} />)}</div>
      </section>}

      {vista === 'guia' && <section className="pb-8 pt-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Guía</h2><button type="button" onClick={async () => { await navigator.clipboard.writeText(textoGuia); mostrarToast('Guía copiada') }} className="flex items-center gap-2 rounded-full bg-slate-200 px-3 py-2 text-xs font-bold"><Copy className="h-4 w-4" /> Copiar</button></div><div className="whitespace-pre-wrap text-base leading-8 text-slate-700">{textoGuia || 'Empieza a escribir el contenido del proyecto.'}</div></section>}
      {vista === 'publicar' && <div className="pb-8 pt-5"><PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia} initialPublished={paquete.publicado} initialFeatured={paquete.destacado} /></div>}

      <PastoralVersePicker open={selectorVersiculo} onClose={() => setSelectorVersiculo(false)} onInsert={insertarVersiculo} />

      <style jsx global>{`
        .pastoral-content-workspace button { -webkit-tap-highlight-color: transparent; }
        .pastoral-rich-editor:empty:before { content: attr(data-placeholder); opacity: .28; pointer-events: none; }
        .pastoral-rich-editor h1 { font-size: 1.75em; line-height: 1.16; font-weight: 850; margin: .4em 0 .25em; }
        .pastoral-rich-editor h2 { font-size: 1.32em; line-height: 1.25; font-weight: 800; margin: .55em 0 .3em; }
        .pastoral-rich-editor p { margin: .35em 0; }
        .pastoral-rich-editor ul, .pastoral-rich-editor ol { padding-left: 1.4em; margin: .6em 0; }
        .pastoral-rich-editor ul { list-style: disc; } .pastoral-rich-editor ol { list-style: decimal; }
        .pastoral-rich-editor blockquote { border-left: 3px solid rgba(124,58,237,.6); padding-left: .85em; margin: .8em 0; opacity: .92; }
      `}</style>
    </div>
  )
}
