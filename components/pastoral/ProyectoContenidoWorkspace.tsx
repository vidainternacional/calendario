'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlignCenter, AlignLeft, AlignRight, BookOpen, Check, ChevronLeft, ChevronRight, Copy, FileText,
  Image as ImageIcon, LayoutTemplate, Loader2, Maximize2, Palette, Plus, Presentation, Save, Send,
  Trash2, Type,
} from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { obtenerVersiculosDelProyecto } from '@/app/actions/pastoral-proyecto-versiculos'
import { mostrarToast } from '@/lib/ui/toast'
import PackageDistributionControls from '@/components/pastoral/PackageDistributionControls'

type Plantilla = 'limpia' | 'titulo' | 'imagen' | 'versiculo'
type Alineacion = 'izquierda' | 'centro' | 'derecha'
type Tamano = 'compacto' | 'normal' | 'grande'
type Diapositiva = { titulo: string; contenido: string; recurso_id: string | null; plantilla?: Plantilla; fondo?: string; color_texto?: string; alineacion?: Alineacion; tamano?: Tamano }
type Versiculo = { id: string; referencia: string; texto: string; traduccion: string; nota: string }
type Recurso = { id: string; titulo: string; descripcion: string; categoria: string; tipo: 'archivo' | 'enlace'; acceso_url: string | null; mime_type?: string | null; nombre_archivo?: string | null }
type Audiencia = 'iglesia' | 'lideres' | 'servidores' | 'publico'
type Paquete = { id: string; titulo: string; descripcion_publica: string; instrucciones: string; notas_privadas: string; bosquejo_id: string | null; coleccion_id: string | null; recurso_ids: string[]; estado: 'borrador' | 'listo' | 'compartido'; presentacion_diapositivas: Diapositiva[]; presentacion_pdf_recurso_id: string | null; audiencia: Audiencia; publicado: boolean; destacado: boolean }
type Vista = 'contenido' | 'presentacion' | 'guia' | 'publicar'
type Herramienta = 'texto' | 'versiculo' | 'imagen' | 'diseno' | null

const PLANTILLAS: Array<{ id: Plantilla; label: string }> = [
  { id: 'limpia', label: 'Limpia' }, { id: 'titulo', label: 'Título' }, { id: 'imagen', label: 'Imagen' }, { id: 'versiculo', label: 'Versículo' },
]
const FONDOS = ['#ffffff', '#f8fafc', '#f5f3ff', '#fff7ed', '#0f172a', '#312e81']

function normalizarPagina(item: Diapositiva): Diapositiva {
  return { ...item, plantilla: item.plantilla ?? 'limpia', fondo: item.fondo ?? '#ffffff', color_texto: item.color_texto ?? '#0f172a', alineacion: item.alineacion ?? 'izquierda', tamano: item.tamano ?? 'normal' }
}

export default function ProyectoContenidoWorkspace({ paquete, biblioteca }: { paquete: Paquete; coleccion: unknown; biblioteca: Recurso[] }) {
  const router = useRouter()
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const touchStart = useRef(0)
  const [vista, setVista] = useState<Vista>('contenido')
  const [herramienta, setHerramienta] = useState<Herramienta>(null)
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [indice, setIndice] = useState(0)
  const [guardado, setGuardado] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<string[]>(paquete.recurso_ids ?? [])
  const [versiculos, setVersiculos] = useState<Versiculo[]>([])
  const iniciales = paquete.presentacion_diapositivas?.length ? paquete.presentacion_diapositivas.map(normalizarPagina) : [normalizarPagina({ titulo: '', contenido: '', recurso_id: null })]
  const [paginas, setPaginas] = useState<Diapositiva[]>(iniciales)
  const pagina = paginas[indice] ?? paginas[0]
  const recursoPagina = biblioteca.find((item) => item.id === pagina?.recurso_id) ?? null

  const cargarVersiculos = async () => {
    const resultado = await obtenerVersiculosDelProyecto(paquete.id)
    if (resultado.success) setVersiculos((resultado.versiculos ?? []) as Versiculo[])
  }
  useEffect(() => { void cargarVersiculos() }, [])
  useEffect(() => {
    const recibir = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'vida:pastoral-versiculo-agregado' || event.data?.type === 'vida:pastoral-versiculo-eliminado') void cargarVersiculos()
    }
    window.addEventListener('message', recibir)
    return () => window.removeEventListener('message', recibir)
  }, [paquete.id])

  const actualizarPagina = (campo: keyof Diapositiva, valor: string | null) => setPaginas((actuales) => actuales.map((item, i) => i === indice ? { ...item, [campo]: valor } : item))
  const nuevaPagina = () => { setPaginas((actuales) => [...actuales, normalizarPagina({ titulo: '', contenido: '', recurso_id: null })]); setIndice(paginas.length); setHerramienta(null) }
  const eliminarPagina = () => { if (paginas.length === 1) return; setPaginas((actuales) => actuales.filter((_, i) => i !== indice)); setIndice((actual) => Math.max(0, actual - 1)); setHerramienta(null) }

  const insertarVersiculo = (versiculo: Versiculo) => {
    const bloque = `${versiculo.referencia}${versiculo.traduccion ? ` · ${versiculo.traduccion}` : ''}\n${versiculo.texto}`
    const editor = editorRef.current
    const actual = pagina?.contenido ?? ''
    const inicio = editor?.selectionStart ?? actual.length
    const fin = editor?.selectionEnd ?? inicio
    const antes = inicio > 0 && !actual.slice(0, inicio).endsWith('\n\n') ? '\n\n' : ''
    const despues = fin < actual.length ? '\n\n' : ''
    actualizarPagina('contenido', actual.slice(0, inicio) + antes + bloque + despues + actual.slice(fin))
    setHerramienta(null)
    requestAnimationFrame(() => editorRef.current?.focus())
    mostrarToast(`${versiculo.referencia} agregado a la página ${indice + 1}`)
  }

  const construirFormulario = () => {
    const formData = new FormData()
    formData.set('titulo', titulo); formData.set('descripcion_publica', paquete.descripcion_publica); formData.set('instrucciones', paquete.instrucciones); formData.set('notas_privadas', paquete.notas_privadas ?? ''); formData.set('estado', paquete.estado); formData.set('bosquejo_id', paquete.bosquejo_id ?? ''); formData.set('coleccion_id', paquete.coleccion_id ?? ''); formData.set('presentacion_pdf_recurso_id', paquete.presentacion_pdf_recurso_id ?? '')
    recursosSeleccionados.forEach((id) => formData.append('recurso_ids', id))
    paginas.forEach((item) => {
      formData.append('diapositiva_titulo', item.titulo); formData.append('diapositiva_contenido', item.contenido); formData.append('diapositiva_recurso_id', item.recurso_id ?? ''); formData.append('diapositiva_plantilla', item.plantilla ?? 'limpia'); formData.append('diapositiva_fondo', item.fondo ?? '#ffffff'); formData.append('diapositiva_color_texto', item.color_texto ?? '#0f172a'); formData.append('diapositiva_alineacion', item.alineacion ?? 'izquierda'); formData.append('diapositiva_tamano', item.tamano ?? 'normal')
    })
    return formData
  }
  const guardar = () => startTransition(async () => { const resultado = await editarPaquetePastoral(paquete.id, construirFormulario()); if (!resultado.success) return mostrarToast(resultado.error); setGuardado(true); window.setTimeout(() => setGuardado(false), 1500); mostrarToast('Proyecto guardado'); router.refresh() })
  const textoGuia = useMemo(() => paginas.map((item) => [item.titulo, item.contenido].filter(Boolean).join('\n')).join('\n\n'), [paginas])

  const herramientas: Array<{ id: Exclude<Herramienta, null>; label: string; icon: typeof Type }> = [
    { id: 'texto', label: 'Texto', icon: Type }, { id: 'versiculo', label: 'Versículo', icon: BookOpen }, { id: 'imagen', label: 'Imagen', icon: ImageIcon }, { id: 'diseno', label: 'Diseño', icon: Palette },
  ]

  const alineacionClase = pagina?.alineacion === 'centro' ? 'text-center' : pagina?.alineacion === 'derecha' ? 'text-right' : 'text-left'
  const tituloClase = pagina?.tamano === 'grande' ? 'text-4xl' : pagina?.tamano === 'compacto' ? 'text-xl' : 'text-3xl'
  const cuerpoClase = pagina?.tamano === 'grande' ? 'text-xl leading-9' : pagina?.tamano === 'compacto' ? 'text-sm leading-6' : 'text-[17px] leading-8'

  const moverPresentacion = (delta: number) => setIndice((actual) => Math.min(Math.max(actual + delta, 0), paginas.length - 1))

  return (
    <div className="pastoral-content-workspace text-slate-900">
      <header className="sticky top-0 z-30 -mx-4 bg-[#f4f5f9]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none" />
          {guardado && <Check className="h-4 w-4 text-emerald-600" />}
          <button type="button" onClick={guardar} disabled={isPending} className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white disabled:opacity-60" aria-label="Guardar proyecto">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button>
        </div>
        <div className="mt-2 flex items-center gap-5 text-xs font-bold text-slate-400">
          <button type="button" onClick={() => setVista('contenido')} className={vista === 'contenido' ? 'text-violet-700' : ''}>Editar</button>
          <button type="button" onClick={() => setVista('presentacion')} className={vista === 'presentacion' ? 'text-violet-700' : ''}>Presentar</button>
          <button type="button" onClick={() => setVista('guia')} className={vista === 'guia' ? 'text-violet-700' : ''}>Guía</button>
          <button type="button" onClick={() => setVista('publicar')} className={vista === 'publicar' ? 'text-violet-700' : ''}>Compartir</button>
        </div>
      </header>

      {vista === 'contenido' && pagina && (
        <section className="pb-10">
          <div className="flex items-center gap-2 overflow-x-auto py-4 [scrollbar-width:none]">
            {paginas.map((_, i) => <button key={i} type="button" onClick={() => { setIndice(i); setHerramienta(null) }} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${i === indice ? 'bg-violet-600 text-white' : 'bg-slate-200/70 text-slate-600'}`}>Página {i + 1}</button>)}
            <button type="button" onClick={nuevaPagina} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white" aria-label="Nueva página"><Plus className="h-4 w-4" /></button>
          </div>

          <nav className="grid grid-cols-4 border-y border-slate-200 py-2" aria-label="Herramientas de la página">
            {herramientas.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setHerramienta((actual) => actual === id ? null : id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold transition active:scale-95 ${herramienta === id ? 'text-violet-700' : 'text-slate-500'}`}><Icon className="h-5 w-5" /><span>{label}</span></button>)}
          </nav>

          {herramienta === 'texto' && (
            <div className="flex items-center justify-center gap-2 border-b border-slate-200 py-3">
              {(['compacto', 'normal', 'grande'] as Tamano[]).map((size) => <button key={size} type="button" onClick={() => actualizarPagina('tamano', size)} className={`rounded-full px-3 py-2 text-xs font-bold ${pagina.tamano === size ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{size === 'compacto' ? 'Pequeño' : size === 'normal' ? 'Normal' : 'Grande'}</button>)}
              <button type="button" onClick={() => actualizarPagina('alineacion', 'izquierda')} className="p-2"><AlignLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => actualizarPagina('alineacion', 'centro')} className="p-2"><AlignCenter className="h-4 w-4" /></button>
              <button type="button" onClick={() => actualizarPagina('alineacion', 'derecha')} className="p-2"><AlignRight className="h-4 w-4" /></button>
            </div>
          )}

          {herramienta === 'diseno' && (
            <div className="border-b border-slate-200 py-4">
              <div className="flex flex-wrap gap-2">{PLANTILLAS.map((item) => <button key={item.id} type="button" onClick={() => actualizarPagina('plantilla', item.id)} className={`rounded-full px-3 py-2 text-xs font-bold ${pagina.plantilla === item.id ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}><LayoutTemplate className="mr-1 inline h-3.5 w-3.5" />{item.label}</button>)}</div>
              <div className="mt-4 flex items-center gap-3"><span className="text-xs font-bold text-slate-500">Fondo</span>{FONDOS.map((color) => <button key={color} type="button" onClick={() => actualizarPagina('fondo', color)} className={`h-8 w-8 rounded-full border ${pagina.fondo === color ? 'ring-2 ring-violet-500 ring-offset-2' : 'border-slate-300'}`} style={{ backgroundColor: color }} aria-label={`Fondo ${color}`} />)}</div>
              <div className="mt-4 flex items-center gap-3"><label className="text-xs font-bold text-slate-500" htmlFor="texto-color">Texto</label><input id="texto-color" type="color" value={pagina.color_texto ?? '#0f172a'} onChange={(e) => actualizarPagina('color_texto', e.target.value)} className="h-8 w-10 bg-transparent" /></div>
            </div>
          )}

          {herramienta === 'versiculo' && (
            <div className="border-b border-slate-200 py-4">
              <div className="mb-3"><h3 className="text-sm font-bold">Buscar y agregar versículo</h3><p className="mt-1 text-xs leading-5 text-slate-500">Busca por referencia, palabra o concordancia. Toca el versículo en la Biblia y agrégalo al proyecto.</p></div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><iframe title="Biblia del proyecto" src={`/biblia?from=pastoral&embed=1&paqueteId=${paquete.id}`} className="h-[56vh] w-full border-0" /></div>
              {versiculos.length > 0 && <div className="mt-3"><p className="mb-2 text-xs font-bold text-slate-500">Insertar en Página {indice + 1}</p><div className="divide-y divide-slate-200">{versiculos.map((versiculo) => <button key={versiculo.id} type="button" onClick={() => insertarVersiculo(versiculo)} className="flex w-full items-start gap-3 py-3 text-left"><Plus className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><span><strong className="block text-xs">{versiculo.referencia}</strong><span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600">{versiculo.texto}</span></span></button>)}</div></div>}
            </div>
          )}

          {herramienta === 'imagen' && (
            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 py-4">
              {biblioteca.map((recurso) => { const esImagen = recurso.mime_type?.startsWith('image/') && recurso.acceso_url; if (!esImagen) return null; const activo = pagina.recurso_id === recurso.id; return <button key={recurso.id} type="button" onClick={() => { actualizarPagina('recurso_id', activo ? null : recurso.id); setRecursosSeleccionados((actuales) => actuales.includes(recurso.id) ? actuales : [...actuales, recurso.id]) }} className={`overflow-hidden rounded-xl ${activo ? 'ring-2 ring-violet-500' : ''}`}><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} className="aspect-square w-full object-cover" /></button> })}
              {!biblioteca.some((r) => r.mime_type?.startsWith('image/') && r.acceso_url) && <p className="col-span-3 py-6 text-center text-xs text-slate-500">Agrega imágenes a Biblioteca para utilizarlas aquí.</p>}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-[28px] shadow-sm" style={{ backgroundColor: pagina.fondo, color: pagina.color_texto }}>
            {recursoPagina?.acceso_url && pagina.plantilla === 'imagen' && <img src={recursoPagina.acceso_url} alt="" className="aspect-[16/7] w-full object-cover" />}
            <div className={`min-h-[46vh] p-6 ${alineacionClase}`}>
              <input value={pagina.titulo} onChange={(e) => actualizarPagina('titulo', e.target.value)} placeholder="Título" className={`mb-3 w-full bg-transparent font-extrabold outline-none placeholder:opacity-30 ${tituloClase} ${alineacionClase}`} style={{ color: 'inherit' }} />
              <textarea ref={editorRef} value={pagina.contenido} onChange={(e) => actualizarPagina('contenido', e.target.value)} placeholder="Empieza a escribir…" className={`min-h-[32vh] w-full resize-none bg-transparent outline-none placeholder:opacity-30 ${cuerpoClase} ${alineacionClase}`} style={{ color: 'inherit' }} />
              {recursoPagina?.acceso_url && pagina.plantilla !== 'imagen' && <img src={recursoPagina.acceso_url} alt="" className="mt-4 max-h-72 w-full rounded-2xl object-cover" />}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-400">Página {indice + 1} de {paginas.length}</span><button type="button" onClick={eliminarPagina} disabled={paginas.length === 1} className="flex h-10 w-10 items-center justify-center rounded-full text-rose-500 disabled:opacity-20" aria-label="Eliminar página"><Trash2 className="h-4 w-4" /></button></div>
        </section>
      )}

      {vista === 'presentacion' && pagina && (
        <section className="pb-8 pt-5">
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-xl font-bold">Presentación</h2><p className="text-xs text-slate-500">Gira el teléfono y desliza entre páginas.</p></div><Maximize2 className="h-5 w-5 text-slate-400" /></div>
          <div onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? 0 }} onTouchEnd={(e) => { const fin = e.changedTouches[0]?.clientX ?? touchStart.current; const delta = fin - touchStart.current; if (Math.abs(delta) > 45) moverPresentacion(delta < 0 ? 1 : -1) }} className={`relative aspect-video overflow-hidden rounded-3xl p-6 ${alineacionClase}`} style={{ backgroundColor: pagina.fondo, color: pagina.color_texto }}>
            {recursoPagina?.acceso_url && pagina.plantilla === 'imagen' && <img src={recursoPagina.acceso_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
            <div className="relative z-10 flex h-full flex-col justify-center"><h3 className={`${tituloClase} font-extrabold`}>{pagina.titulo}</h3><p className={`mt-3 whitespace-pre-wrap ${cuerpoClase}`}>{pagina.contenido}</p></div>
            <button type="button" onClick={() => moverPresentacion(-1)} disabled={indice === 0} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/15 p-2 text-current disabled:opacity-0"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => moverPresentacion(1)} disabled={indice === paginas.length - 1} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/15 p-2 text-current disabled:opacity-0"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">{paginas.map((_, i) => <button key={i} type="button" onClick={() => setIndice(i)} className={`h-2.5 rounded-full transition-all ${i === indice ? 'w-7 bg-violet-600' : 'w-2.5 bg-slate-300'}`} aria-label={`Página ${i + 1}`} />)}</div>
        </section>
      )}

      {vista === 'guia' && <section className="pb-8 pt-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Guía</h2><button type="button" onClick={async () => { await navigator.clipboard.writeText(textoGuia); mostrarToast('Guía copiada') }} className="flex items-center gap-2 rounded-full bg-slate-200 px-3 py-2 text-xs font-bold"><Copy className="h-4 w-4" /> Copiar</button></div><div className="whitespace-pre-wrap text-base leading-8 text-slate-700">{textoGuia || 'Empieza a escribir el contenido del proyecto.'}</div></section>}
      {vista === 'publicar' && <div className="pb-8 pt-5"><PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia} initialPublished={paquete.publicado} initialFeatured={paquete.destacado} /></div>}

      <style jsx global>{`.pastoral-content-workspace button { -webkit-tap-highlight-color: transparent; } .pastoral-content-workspace textarea { field-sizing: content; }`}</style>
    </div>
  )
}
