'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Check,
  Copy,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Plus,
  Presentation,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { mostrarToast } from '@/lib/ui/toast'
import PackageDistributionControls from '@/components/pastoral/PackageDistributionControls'

type Plantilla = 'limpia' | 'titulo' | 'imagen' | 'versiculo'
type Diapositiva = { titulo: string; contenido: string; recurso_id: string | null; plantilla?: Plantilla }
type Versiculo = { id: string; referencia: string; texto: string; traduccion: string; nota: string }
type Coleccion = { id: string; nombre: string; descripcion: string; versiculos: Versiculo[] }
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
type Vista = 'contenido' | 'versiculos' | 'recursos' | 'presentacion' | 'guia' | 'publicar'

const PLANTILLAS: Array<{ id: Plantilla; label: string }> = [
  { id: 'limpia', label: 'Limpia' },
  { id: 'titulo', label: 'Título' },
  { id: 'imagen', label: 'Imagen' },
  { id: 'versiculo', label: 'Versículo' },
]

export default function ProyectoContenidoWorkspace({ paquete, coleccion, biblioteca }: { paquete: Paquete; coleccion: Coleccion | null; biblioteca: Recurso[] }) {
  const router = useRouter()
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const [vista, setVista] = useState<Vista>('contenido')
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [descripcion] = useState(paquete.descripcion_publica)
  const [instrucciones] = useState(paquete.instrucciones)
  const [notasPrivadas] = useState(paquete.notas_privadas ?? '')
  const [indice, setIndice] = useState(0)
  const [guardado, setGuardado] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<string[]>(paquete.recurso_ids ?? [])
  const iniciales = paquete.presentacion_diapositivas?.length
    ? paquete.presentacion_diapositivas.map((item) => ({ ...item, plantilla: item.plantilla ?? 'limpia' as Plantilla }))
    : [{ titulo: paquete.titulo, contenido: '', recurso_id: null, plantilla: 'limpia' as Plantilla }]
  const [paginas, setPaginas] = useState<Diapositiva[]>(iniciales)
  const pagina = paginas[indice] ?? paginas[0]

  const imagenes = biblioteca.filter((item) => item.tipo === 'archivo' && item.mime_type?.startsWith('image/'))
  const recursosActivos = biblioteca.filter((item) => recursosSeleccionados.includes(item.id))
  const recursoPagina = biblioteca.find((item) => item.id === pagina?.recurso_id) ?? null

  const actualizarPagina = (campo: keyof Diapositiva, valor: string | null) => {
    setPaginas((actuales) => actuales.map((item, i) => i === indice ? { ...item, [campo]: valor } : item))
  }

  const nuevaPagina = () => {
    setPaginas((actuales) => [...actuales, { titulo: `Página ${actuales.length + 1}`, contenido: '', recurso_id: null, plantilla: 'limpia' }])
    setIndice(paginas.length)
    setVista('contenido')
  }

  const eliminarPagina = () => {
    if (paginas.length === 1) return
    setPaginas((actuales) => actuales.filter((_, i) => i !== indice))
    setIndice((actual) => Math.max(0, actual - 1))
  }

  const insertarVersiculo = (versiculo: Versiculo) => {
    const bloque = `${versiculo.referencia}${versiculo.traduccion ? ` · ${versiculo.traduccion}` : ''}\n${versiculo.texto}`
    const editor = editorRef.current
    const actual = pagina?.contenido ?? ''
    const inicio = editor?.selectionStart ?? actual.length
    const fin = editor?.selectionEnd ?? inicio
    const separadorAntes = inicio > 0 && !actual.slice(0, inicio).endsWith('\n\n') ? '\n\n' : ''
    const separadorDespues = fin < actual.length ? '\n\n' : ''
    const nuevo = actual.slice(0, inicio) + separadorAntes + bloque + separadorDespues + actual.slice(fin)
    actualizarPagina('contenido', nuevo)
    setVista('contenido')
    requestAnimationFrame(() => editorRef.current?.focus())
    mostrarToast(`${versiculo.referencia} agregado a la página`)
  }

  const alternarRecurso = (id: string) => {
    setRecursosSeleccionados((actuales) => actuales.includes(id) ? actuales.filter((item) => item !== id) : [...actuales, id].slice(0, 30))
  }

  const construirFormulario = () => {
    const formData = new FormData()
    formData.set('titulo', titulo)
    formData.set('descripcion_publica', descripcion)
    formData.set('instrucciones', instrucciones)
    formData.set('notas_privadas', notasPrivadas)
    formData.set('estado', paquete.estado)
    formData.set('bosquejo_id', paquete.bosquejo_id ?? '')
    formData.set('coleccion_id', paquete.coleccion_id ?? '')
    formData.set('presentacion_pdf_recurso_id', paquete.presentacion_pdf_recurso_id ?? '')
    recursosSeleccionados.forEach((id) => formData.append('recurso_ids', id))
    paginas.forEach((item) => {
      formData.append('diapositiva_titulo', item.titulo)
      formData.append('diapositiva_contenido', item.contenido)
      formData.append('diapositiva_recurso_id', item.recurso_id ?? '')
      formData.append('diapositiva_plantilla', item.plantilla ?? 'limpia')
    })
    return formData
  }

  const guardar = () => startTransition(async () => {
    const resultado = await editarPaquetePastoral(paquete.id, construirFormulario())
    if (!resultado.success) return mostrarToast(resultado.error)
    setGuardado(true)
    window.setTimeout(() => setGuardado(false), 1800)
    mostrarToast('Proyecto guardado')
    router.refresh()
  })

  const textoGuia = useMemo(() => paginas.map((item) => [item.titulo, item.contenido].filter(Boolean).join('\n')).join('\n\n'), [paginas])

  const tabs: Array<{ id: Vista; label: string; icon: typeof FileText }> = [
    { id: 'contenido', label: 'Contenido', icon: FileText },
    { id: 'versiculos', label: 'Versículos', icon: BookOpen },
    { id: 'recursos', label: 'Recursos', icon: ImageIcon },
    { id: 'presentacion', label: 'Presentación', icon: Presentation },
    { id: 'guia', label: 'Guía', icon: Copy },
    { id: 'publicar', label: 'Publicar', icon: Send },
  ]

  return (
    <div className="pastoral-content-workspace text-slate-900">
      <header className="sticky top-0 z-30 -mx-4 bg-[#f4f5f9]/96 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} aria-label="Título del proyecto" className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none" />
          {guardado && <Check className="h-4 w-4 text-emerald-600" />}
          <button type="button" onClick={guardar} disabled={isPending} className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white disabled:opacity-60" aria-label="Guardar proyecto">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <nav className="grid grid-cols-3 gap-x-2 gap-y-4 py-5 sm:grid-cols-6" aria-label="Áreas del proyecto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setVista(id)} className={`flex min-h-[68px] flex-col items-center justify-center gap-1.5 text-center transition active:scale-95 ${vista === id ? 'text-violet-700' : 'text-slate-500'}`}>
            <Icon className="h-6 w-6 stroke-[1.8]" />
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </nav>

      {vista === 'contenido' && pagina && (
        <section className="pb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 [scrollbar-width:none]">
            {paginas.map((item, i) => (
              <button key={i} type="button" onClick={() => setIndice(i)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${i === indice ? 'bg-violet-600 text-white' : 'bg-slate-200/70 text-slate-600'}`}>{i + 1}</button>
            ))}
            <button type="button" onClick={nuevaPagina} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white" aria-label="Nueva página"><Plus className="h-4 w-4" /></button>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500">Página {indice + 1} de {paginas.length}</span>
            <button type="button" onClick={eliminarPagina} disabled={paginas.length === 1} className="flex h-9 w-9 items-center justify-center rounded-full text-rose-600 disabled:opacity-25" aria-label="Eliminar página"><Trash2 className="h-4 w-4" /></button>
          </div>

          <input value={pagina.titulo} onChange={(e) => actualizarPagina('titulo', e.target.value)} placeholder="Título de esta página" className="mb-2 w-full bg-transparent text-2xl font-bold outline-none placeholder:text-slate-300" />
          <textarea ref={editorRef} value={pagina.contenido} onChange={(e) => actualizarPagina('contenido', e.target.value)} placeholder="Escribe aquí el mensaje…" className="min-h-[38vh] w-full resize-none bg-transparent text-[17px] leading-8 outline-none placeholder:text-slate-300" />

          {recursoPagina?.acceso_url && recursoPagina.mime_type?.startsWith('image/') && <img src={recursoPagina.acceso_url} alt="" className="mt-4 max-h-72 w-full rounded-2xl object-cover" />}

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500"><LayoutTemplate className="h-4 w-4" /> Plantilla de esta página</div>
            <div className="flex flex-wrap gap-2">
              {PLANTILLAS.map((item) => <button key={item.id} type="button" onClick={() => actualizarPagina('plantilla', item.id)} className={`rounded-full px-3 py-2 text-xs font-bold ${pagina.plantilla === item.id ? 'bg-violet-600 text-white' : 'bg-slate-200/70 text-slate-600'}`}>{item.label}</button>)}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setVista('versiculos')} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white"><BookOpen className="h-4 w-4" /> Versículo</button>
            <button type="button" onClick={() => setVista('recursos')} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 text-sm font-bold text-slate-700"><ImageIcon className="h-4 w-4" /> Imagen</button>
          </div>
        </section>
      )}

      {vista === 'versiculos' && (
        <section className="pb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold">Agregar versículo</h2><p className="text-sm text-slate-500">Se inserta en la página {indice + 1}.</p></div>
            <Link href={`/biblia?from=pastoral&paquete=${paquete.id}`} className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-700">Abrir Biblia</Link>
          </div>
          <div className="divide-y divide-slate-200">
            {(coleccion?.versiculos ?? []).map((versiculo) => (
              <button key={versiculo.id} type="button" onClick={() => insertarVersiculo(versiculo)} className="flex w-full items-start gap-3 py-4 text-left active:opacity-60">
                <Plus className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <span><strong className="block text-sm">{versiculo.referencia}</strong><span className="mt-1 block text-sm leading-6 text-slate-600">{versiculo.texto}</span></span>
              </button>
            ))}
            {!coleccion?.versiculos?.length && <p className="py-8 text-center text-sm text-slate-500">Vincula una colección de versículos o abre la Biblia para buscarlos.</p>}
          </div>
        </section>
      )}

      {vista === 'recursos' && (
        <section className="pb-8">
          <h2 className="text-xl font-bold">Imagen o material</h2>
          <p className="mt-1 text-sm text-slate-500">Toca una imagen para usarla en la página {indice + 1}. Otros materiales se agregan al proyecto.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {biblioteca.map((recurso) => {
              const esImagen = recurso.mime_type?.startsWith('image/') && recurso.acceso_url
              const seleccionado = recursosSeleccionados.includes(recurso.id)
              const enPagina = pagina?.recurso_id === recurso.id
              return <button key={recurso.id} type="button" onClick={() => { alternarRecurso(recurso.id); if (esImagen) actualizarPagina('recurso_id', enPagina ? null : recurso.id) }} className={`min-h-24 overflow-hidden rounded-2xl text-left active:scale-[.98] ${enPagina ? 'ring-2 ring-violet-500' : ''}`}>
                {esImagen ? <img src={recurso.acceso_url ?? ''} alt="" className="h-24 w-full object-cover" /> : <div className="flex h-24 items-center justify-center bg-slate-200"><FileText className="h-7 w-7 text-slate-500" /></div>}
                <span className="block truncate px-1 pt-2 text-xs font-bold text-slate-700">{recurso.titulo}</span>
                {seleccionado && <span className="block px-1 text-[10px] text-violet-600">En proyecto</span>}
              </button>
            })}
          </div>
        </section>
      )}

      {vista === 'presentacion' && pagina && (
        <section className="pb-8">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">Presentación</h2><p className="text-sm text-slate-500">Las páginas del contenido ya son las diapositivas.</p></div><span className="text-xs font-bold text-slate-400">{indice + 1}/{paginas.length}</span></div>
          <div className={`aspect-video overflow-hidden rounded-3xl p-6 shadow-sm ${pagina.plantilla === 'versiculo' ? 'bg-slate-950 text-white' : 'bg-white text-slate-950'} ${pagina.plantilla === 'titulo' ? 'flex flex-col items-center justify-center text-center' : ''}`}>
            {recursoPagina?.acceso_url && pagina.plantilla === 'imagen' && <img src={recursoPagina.acceso_url} alt="" className="mb-4 h-1/2 w-full rounded-2xl object-cover" />}
            <h3 className="text-2xl font-bold">{pagina.titulo}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 opacity-85">{pagina.contenido}</p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">{paginas.map((_, i) => <button key={i} type="button" onClick={() => setIndice(i)} className={`h-2.5 rounded-full transition-all ${i === indice ? 'w-7 bg-violet-600' : 'w-2.5 bg-slate-300'}`} aria-label={`Diapositiva ${i + 1}`} />)}</div>
        </section>
      )}

      {vista === 'guia' && (
        <section className="pb-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Guía</h2><button type="button" onClick={async () => { await navigator.clipboard.writeText(textoGuia); mostrarToast('Guía copiada') }} className="flex items-center gap-2 rounded-full bg-slate-200 px-3 py-2 text-xs font-bold"><Copy className="h-4 w-4" /> Copiar</button></div><div className="whitespace-pre-wrap text-base leading-8 text-slate-700">{textoGuia || 'Empieza a escribir el contenido del proyecto.'}</div></section>
      )}

      {vista === 'publicar' && <div className="pb-8"><PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia} initialPublished={paquete.publicado} initialFeatured={paquete.destacado} /></div>}

      <style jsx global>{`
        .pastoral-content-workspace button, .pastoral-content-workspace a { -webkit-tap-highlight-color: transparent; }
        .pastoral-content-workspace textarea { field-sizing: content; }
      `}</style>
    </div>
  )
}
