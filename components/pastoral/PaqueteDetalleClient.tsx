'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  BookText,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Expand,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Library,
  Loader2,
  MonitorPlay,
  NotebookPen,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { mostrarToast } from '@/lib/ui/toast'
import CargaRapidaRecursos from '@/components/pastoral/CargaRapidaRecursos'
import PackageDistributionControls from '@/components/pastoral/PackageDistributionControls'

type Punto = { titulo: string; contenido: string }
type Bosquejo = {
  id: string
  titulo: string
  tema: string
  pasaje_base: string
  proposito: string
  introduccion: string
  puntos: Punto[]
  conclusion: string
}
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
type Opcion = { id: string; titulo: string }
type Diapositiva = { titulo: string; contenido: string; recurso_id: string | null }
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
type Herramienta = 'mensaje' | 'biblia' | 'galeria' | 'documentos' | 'presentacion' | 'guia' | 'publicar'

export default function PaqueteDetalleClient({
  paquete,
  bosquejo,
  coleccion,
  biblioteca,
  bosquejos,
  colecciones,
}: {
  paquete: Paquete
  bosquejo: Bosquejo | null
  coleccion: Coleccion | null
  recursos: Recurso[]
  pdfPresentacion: Recurso | null
  bosquejos: Opcion[]
  colecciones: Opcion[]
  biblioteca: Recurso[]
}) {
  const router = useRouter()
  const [herramienta, setHerramienta] = useState<Herramienta>('mensaje')
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [descripcion, setDescripcion] = useState(paquete.descripcion_publica)
  const [instrucciones, setInstrucciones] = useState(paquete.instrucciones)
  const [notasPrivadas, setNotasPrivadas] = useState(paquete.notas_privadas ?? '')
  const [estado, setEstado] = useState(paquete.estado)
  const [bosquejoId, setBosquejoId] = useState(paquete.bosquejo_id ?? '')
  const [coleccionId, setColeccionId] = useState(paquete.coleccion_id ?? '')
  const [pdfId, setPdfId] = useState(paquete.presentacion_pdf_recurso_id ?? '')
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<string[]>(paquete.recurso_ids ?? [])
  const [indice, setIndice] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [guardado, setGuardado] = useState(false)

  const diapositivasIniciales = paquete.presentacion_diapositivas?.length
    ? paquete.presentacion_diapositivas
    : [
        { titulo: paquete.titulo, contenido: bosquejo?.pasaje_base ?? '', recurso_id: null },
        ...(bosquejo?.puntos ?? []).map((punto) => ({ titulo: punto.titulo || 'Punto principal', contenido: punto.contenido, recurso_id: null })),
        ...(bosquejo?.conclusion ? [{ titulo: 'Conclusión y llamado', contenido: bosquejo.conclusion, recurso_id: null }] : []),
      ]

  const [diapositivas, setDiapositivas] = useState<Diapositiva[]>(diapositivasIniciales.length ? diapositivasIniciales : [{ titulo: paquete.titulo, contenido: '', recurso_id: null }])

  const esMultimedia = (recurso: Recurso) => {
    const mime = recurso.mime_type ?? ''
    return mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')
  }

  const galeria = biblioteca.filter(esMultimedia)
  const documentos = biblioteca.filter((recurso) => !esMultimedia(recurso))
  const imagenes = biblioteca.filter((item) => item.tipo === 'archivo' && item.mime_type?.startsWith('image/'))
  const pdfs = biblioteca.filter((item) => item.tipo === 'archivo' && (item.mime_type === 'application/pdf' || item.nombre_archivo?.toLowerCase().endsWith('.pdf')))
  const recursosActivos = biblioteca.filter((recurso) => recursosSeleccionados.includes(recurso.id))
  const recursoPorId = (id: string | null) => biblioteca.find((item) => item.id === id) ?? null
  const diapositiva = diapositivas[indice] ?? { titulo, contenido: '', recurso_id: null }
  const imagenActual = recursoPorId(diapositiva.recurso_id)

  const textoCompartible = useMemo(() => {
    const lineas = [
      titulo,
      descripcion,
      bosquejo?.pasaje_base ? `Pasaje base: ${bosquejo.pasaje_base}` : '',
      bosquejo?.proposito ? `Idea central: ${bosquejo.proposito}` : '',
    ]
    if (coleccion?.versiculos?.length) lineas.push('VERSÍCULOS', ...coleccion.versiculos.map((versiculo) => `${versiculo.referencia} (${versiculo.traduccion})\n${versiculo.texto}`))
    if (bosquejo?.puntos?.length) lineas.push(...bosquejo.puntos.map((punto, index) => `${index + 1}. ${punto.titulo || 'Punto'}\n${punto.contenido}`))
    if (instrucciones) lineas.push('APLICACIÓN PARA LA SEMANA', instrucciones)
    if (recursosActivos.length) lineas.push('RECURSOS', ...recursosActivos.map((recurso) => `${recurso.titulo}${recurso.acceso_url ? `\n${recurso.acceso_url}` : ''}`))
    return lineas.filter(Boolean).join('\n\n')
  }, [titulo, descripcion, instrucciones, bosquejo, coleccion, recursosActivos])

  const construirFormulario = () => {
    const formData = new FormData()
    formData.set('titulo', titulo)
    formData.set('descripcion_publica', descripcion)
    formData.set('instrucciones', instrucciones)
    formData.set('notas_privadas', notasPrivadas)
    formData.set('estado', estado)
    formData.set('bosquejo_id', bosquejoId)
    formData.set('coleccion_id', coleccionId)
    formData.set('presentacion_pdf_recurso_id', pdfId)
    recursosSeleccionados.forEach((id) => formData.append('recurso_ids', id))
    diapositivas.forEach((item) => {
      formData.append('diapositiva_titulo', item.titulo)
      formData.append('diapositiva_contenido', item.contenido)
      formData.append('diapositiva_recurso_id', item.recurso_id ?? '')
    })
    return formData
  }

  const guardar = () => {
    startTransition(async () => {
      const resultado = await editarPaquetePastoral(paquete.id, construirFormulario())
      if (!resultado.success) {
        mostrarToast(resultado.error)
        return
      }
      setGuardado(true)
      window.setTimeout(() => setGuardado(false), 2200)
      mostrarToast('Proyecto pastoral guardado')
      router.refresh()
    })
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoCompartible)
      mostrarToast('Guía copiada')
    } catch {
      mostrarToast('No se pudo copiar')
    }
  }

  const compartir = async () => {
    try {
      if (navigator.share) await navigator.share({ title: titulo, text: textoCompartible })
      else await copiar()
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') mostrarToast('No se pudo compartir')
    }
  }

  const pantallaCompleta = async () => {
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      mostrarToast('No se pudo abrir pantalla completa')
    }
  }

  const actualizarDiapositiva = (index: number, campo: keyof Diapositiva, valor: string | null) => {
    setDiapositivas((actuales) => actuales.map((item, itemIndex) => itemIndex === index ? { ...item, [campo]: valor } : item))
  }

  const alternarRecurso = (id: string) => {
    setRecursosSeleccionados((actuales) => actuales.includes(id) ? actuales.filter((actual) => actual !== id) : [...actuales, id].slice(0, 30))
  }

  const herramientas: Array<{ id: Herramienta; label: string; descripcion: string; icono: typeof BookOpen }> = [
    { id: 'mensaje', label: 'Mensaje', descripcion: 'Escribir y ordenar', icono: BookText },
    { id: 'biblia', label: 'Biblia', descripcion: 'Buscar versículos', icono: BookOpen },
    { id: 'galeria', label: 'Galería', descripcion: 'Fotos y multimedia', icono: ImageIcon },
    { id: 'documentos', label: 'Documentos', descripcion: 'PDF y archivos', icono: Library },
    { id: 'presentacion', label: 'Presentación', descripcion: 'Diseñar diapositivas', icono: MonitorPlay },
    { id: 'guia', label: 'Guía iglesia', descripcion: 'Vista para compartir', icono: Users },
    { id: 'publicar', label: 'Publicar', descripcion: 'Enviar a la iglesia', icono: Send },
  ]

  const panelRecursos = (lista: Recurso[], vacio: string) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center sm:col-span-2 lg:col-span-3">
          <FolderOpen className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">{vacio}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Use los botones de arriba para agregar el primer recurso sin salir del proyecto.</p>
        </div>
      ) : lista.map((recurso) => {
        const seleccionado = recursosSeleccionados.includes(recurso.id)
        const esImagen = recurso.mime_type?.startsWith('image/') && recurso.acceso_url
        return (
          <button
            key={recurso.id}
            type="button"
            onClick={() => alternarRecurso(recurso.id)}
            className={`overflow-hidden rounded-2xl border text-left transition active:scale-[0.99] ${seleccionado ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 bg-white'}`}
          >
            {esImagen && <img src={recurso.acceso_url ?? ''} alt="" className="h-32 w-full object-cover" />}
            <span className="block p-4">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <strong className="block truncate text-sm text-slate-900">{recurso.titulo}</strong>
                  <span className="mt-1 block text-[11px] text-slate-500">{recurso.tipo === 'archivo' ? recurso.nombre_archivo || 'Archivo' : 'Enlace'} · {recurso.categoria}</span>
                </span>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${seleccionado ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {seleccionado ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </span>
              <span className="mt-3 block text-xs font-bold text-violet-700">{seleccionado ? 'Incluido en el paquete' : 'Agregar al paquete'}</span>
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="text-slate-900">
      <section className="sticky top-0 z-30 -mx-4 border-y border-slate-200 bg-[#f4f5f9]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Proyecto pastoral</p>
            <h1 className="truncate text-base font-bold text-slate-950 sm:text-lg">{titulo || 'Sin título'}</h1>
          </div>
          {guardado && <span className="hidden items-center gap-1 text-xs font-bold text-emerald-700 sm:flex"><Check className="h-4 w-4" /> Guardado</span>}
          <button type="button" onClick={guardar} disabled={isPending} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-sm disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">{isPending ? 'Guardando…' : 'Guardar'}</span>
          </button>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm print:hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Sparkles className="h-6 w-6" /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-indigo-100">Centro de preparación unificado</p>
              <h2 className="mt-1 text-xl font-bold">Todo el mensaje en un solo lugar</h2>
              <p className="mt-1 text-sm leading-6 text-indigo-100">Escriba, estudie, agregue archivos, prepare la presentación y envíe el material sin abandonar este proyecto.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-2 sm:p-3">
          <div className="flex min-w-max gap-1.5">
            {herramientas.map(({ id, label, descripcion: detalle, icono: Icono }) => (
              <button
                key={id}
                type="button"
                onClick={() => setHerramienta(id)}
                className={`flex min-h-14 min-w-[126px] items-center gap-2 rounded-2xl px-3 text-left transition ${herramienta === id ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <Icono className="h-5 w-5 shrink-0" />
                <span>
                  <strong className="block text-xs">{label}</strong>
                  <span className={`mt-0.5 block text-[10px] ${herramienta === id ? 'text-violet-100' : 'text-slate-400'}`}>{detalle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5">
        {herramienta === 'mensaje' && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="space-y-5">
              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">1. Preparar el mensaje</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">Contenido principal</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Este es el documento de trabajo del pastor. Desde aquí se genera la guía y la presentación.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título del mensaje</span><input value={titulo} onChange={(event) => setTitulo(event.target.value)} maxLength={140} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base" /></label>
                  <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Estado de preparación</span><select value={estado} onChange={(event) => setEstado(event.target.value as Paquete['estado'])} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base"><option value="borrador">Borrador</option><option value="listo">Listo para revisar</option><option value="compartido">Compartido</option></select></label>
                  <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Bosquejo base</span><select value={bosquejoId} onChange={(event) => setBosquejoId(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base"><option value="">Sin bosquejo anterior</option>{bosquejos.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Colección de versículos</span><select value={coleccionId} onChange={(event) => setColeccionId(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base"><option value="">Sin colección</option>{colecciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select><span className="mt-1.5 block text-xs text-slate-500">Use la herramienta Biblia para buscar y agregar versículos sin salir del proyecto.</span></label>
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Resumen para la congregación</span><textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} rows={4} maxLength={2000} className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7" placeholder="Explique brevemente de qué trata el mensaje." /></label>
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Aplicación y preguntas para la semana</span><textarea value={instrucciones} onChange={(event) => setInstrucciones(event.target.value)} rows={5} maxLength={3000} className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7" placeholder="Pasos prácticos, preguntas o lectura semanal." /></label>
                </div>
              </section>

              {bosquejo && (
                <section className="rounded-[24px] border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">Bosquejo conectado</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">{bosquejo.titulo}</h2>
                  {bosquejo.pasaje_base && <p className="mt-2 font-semibold text-amber-700">{bosquejo.pasaje_base}</p>}
                  {bosquejo.proposito && <p className="mt-3 text-sm leading-6 text-slate-600">{bosquejo.proposito}</p>}
                  <div className="mt-4 space-y-3">{bosquejo.puntos?.map((punto, index) => <article key={index} className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase text-violet-500">Punto {index + 1}</p><h3 className="mt-1 font-bold text-slate-900">{punto.titulo || 'Punto principal'}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{punto.contenido}</p></article>)}</div>
                </section>
              )}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <div className="flex items-center gap-2"><NotebookPen className="h-5 w-5 text-amber-700" /><h2 className="font-bold text-amber-950">Notas privadas del pastor</h2></div>
                <p className="mt-2 text-xs leading-5 text-amber-900/70">Nunca se muestran a la congregación ni se incluyen en la guía publicada.</p>
                <textarea value={notasPrivadas} onChange={(event) => setNotasPrivadas(event.target.value)} rows={10} maxLength={12000} className="mt-4 w-full rounded-xl border border-amber-200 bg-white p-3 text-base leading-7 text-slate-900" placeholder="Ideas, recordatorios, ilustraciones o detalles para predicar." />
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-slate-900">Contenido del proyecto</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p className="flex justify-between gap-3"><span>Versículos</span><strong>{coleccion?.versiculos?.length ?? 0}</strong></p>
                  <p className="flex justify-between gap-3"><span>Recursos incluidos</span><strong>{recursosSeleccionados.length}</strong></p>
                  <p className="flex justify-between gap-3"><span>Diapositivas</span><strong>{diapositivas.length}</strong></p>
                </div>
              </section>
            </aside>
          </div>
        )}

        {herramienta === 'biblia' && (
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">2. Biblia y versículos</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Buscar sin abandonar el proyecto</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Busque un pasaje, agréguelo a una colección pastoral y después actualice este proyecto.</p>
              </div>
              <button type="button" onClick={() => router.refresh()} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 text-sm font-bold text-violet-700"><RefreshCw className="h-4 w-4" /> Actualizar versículos</button>
            </div>

            {coleccion?.versiculos?.length ? (
              <div className="border-b border-slate-100 bg-violet-50/50 p-5 sm:p-6">
                <h3 className="font-bold text-violet-950">Colección actual: {coleccion.nombre}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">{coleccion.versiculos.map((versiculo) => <article key={versiculo.id} className="rounded-2xl border border-violet-100 bg-white p-4"><p className="font-bold text-violet-700">{versiculo.referencia}</p><p className="mt-2 text-sm leading-6 text-slate-600">{versiculo.texto}</p></article>)}</div>
              </div>
            ) : (
              <div className="border-b border-slate-100 bg-amber-50 p-4 text-sm text-amber-900">Todavía no hay versículos conectados. Seleccione una colección en Mensaje o cree una desde la Biblia.</div>
            )}

            <iframe title="Biblia integrada del Centro Pastoral" src="/biblia?from=pastoral&embed=1" className="h-[72vh] min-h-[620px] w-full border-0 bg-white" />
          </section>
        )}

        {herramienta === 'galeria' && (
          <div className="space-y-5">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">3. Galería</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Imágenes y contenido multimedia</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Suba fotos, fondos, audio o video. Seleccione lo que pertenezca a este proyecto.</p>
            </section>
            <CargaRapidaRecursos />
            {panelRecursos(galeria, 'La Galería todavía está vacía')}
          </div>
        )}

        {herramienta === 'documentos' && (
          <div className="space-y-5">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">4. Documentos de apoyo</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">PDF, presentaciones, archivos y enlaces</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Guarde material para estudiar o inclúyalo en lo que recibirá la congregación.</p>
            </section>
            <CargaRapidaRecursos />
            {panelRecursos(documentos, 'Todavía no hay documentos guardados')}
          </div>
        )}

        {herramienta === 'presentacion' && (
          <div className="space-y-5">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">5. Presentación</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">Diseño básico para pantalla o proyector</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Cree diapositivas sencillas con título, texto e imagen.</p>
                </div>
                <button type="button" onClick={() => setDiapositivas((actuales) => [...actuales, { titulo: '', contenido: '', recurso_id: null }].slice(0, 30))} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Nueva diapositiva</button>
              </div>

              <div className="mt-5 space-y-4">
                {diapositivas.map((item, index) => (
                  <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-violet-600">Diapositiva {index + 1}</span>{diapositivas.length > 1 && <button type="button" onClick={() => setDiapositivas((actuales) => actuales.filter((_, itemIndex) => itemIndex !== index))} className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500" aria-label="Eliminar diapositiva"><Trash2 className="h-4 w-4" /></button>}</div>
                    <input value={item.titulo} onChange={(event) => actualizarDiapositiva(index, 'titulo', event.target.value)} placeholder="Título de la diapositiva" className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold" />
                    <textarea value={item.contenido} onChange={(event) => actualizarDiapositiva(index, 'contenido', event.target.value)} rows={4} placeholder="Texto breve para proyectar" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-base leading-7" />
                    <select value={item.recurso_id ?? ''} onChange={(event) => actualizarDiapositiva(index, 'recurso_id', event.target.value || null)} className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base"><option value="">Sin imagen de fondo</option>{imagenes.map((imagen) => <option key={imagen.id} value={imagen.id}>{imagen.titulo}</option>)}</select>
                  </article>
                ))}
              </div>

              <label className="mt-5 block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Presentación PDF opcional</span><select value={pdfId} onChange={(event) => setPdfId(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base"><option value="">Sin PDF adicional</option>{pdfs.map((pdf) => <option key={pdf.id} value={pdf.id}>{pdf.titulo}</option>)}</select></label>
            </section>

            <section className="presentation-shell overflow-hidden rounded-[24px] bg-slate-950 text-white shadow-xl">
              <div className="relative flex min-h-[58vh] flex-col justify-center overflow-hidden p-7 sm:p-12">
                {imagenActual?.acceso_url && <><img src={imagenActual.acceso_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" /><div className="absolute inset-0 bg-slate-950/55" /></>}
                <div className="relative z-10 max-w-5xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">Vida Internacional</p><h2 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">{diapositiva.titulo || titulo}</h2>{diapositiva.contenido && <p className="mt-7 whitespace-pre-wrap text-xl leading-relaxed text-slate-200 sm:text-3xl">{diapositiva.contenido}</p>}</div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 p-3 sm:p-4"><button type="button" onClick={() => setIndice((actual) => Math.max(0, actual - 1))} disabled={indice === 0} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-bold disabled:opacity-30"><ChevronLeft className="h-5 w-5" />Anterior</button><button type="button" onClick={pantallaCompleta} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-bold"><Expand className="h-4 w-4" /> Pantalla completa</button><button type="button" onClick={() => setIndice((actual) => Math.min(diapositivas.length - 1, actual + 1))} disabled={indice >= diapositivas.length - 1} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 disabled:opacity-30">Siguiente<ChevronRight className="h-5 w-5" /></button></div>
            </section>
          </div>
        )}

        {herramienta === 'guia' && (
          <div className="space-y-4">
            <section className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
              <div><h2 className="font-bold text-slate-900">Vista de la congregación</h2><p className="text-xs text-slate-500">No incluye las notas privadas del pastor.</p></div>
              <div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => window.print()} className="min-h-11 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-700"><Printer className="mx-auto mb-1 h-4 w-4" />PDF</button><button type="button" onClick={copiar} className="min-h-11 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-700"><Copy className="mx-auto mb-1 h-4 w-4" />Copiar</button><button type="button" onClick={compartir} className="min-h-11 rounded-xl bg-violet-600 px-3 text-xs font-bold text-white"><Share2 className="mx-auto mb-1 h-4 w-4" />Compartir</button></div>
            </section>

            <article className="paquete-print mx-auto max-w-4xl rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Vida Internacional</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-5xl">{titulo}</h1>
              {descripcion && <p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-slate-600">{descripcion}</p>}
              {bosquejo && <section className="mt-8 rounded-2xl bg-violet-50 p-5"><h2 className="text-2xl font-bold text-slate-950">{bosquejo.titulo}</h2>{bosquejo.pasaje_base && <p className="mt-2 font-semibold text-amber-700">{bosquejo.pasaje_base}</p>}{bosquejo.proposito && <p className="mt-3 leading-7 text-slate-700">{bosquejo.proposito}</p>}</section>}
              {coleccion?.versiculos?.length ? <section className="mt-9"><h2 className="text-xl font-bold">Versículos para estudiar</h2><div className="mt-4 space-y-4">{coleccion.versiculos.map((versiculo) => <article key={versiculo.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-bold text-violet-700">{versiculo.referencia}</p><p className="mt-2 leading-7 text-slate-700">{versiculo.texto}</p></article>)}</div></section> : null}
              {bosquejo?.puntos?.length ? <section className="mt-9 space-y-6">{bosquejo.puntos.map((punto, index) => <article key={index}><p className="text-xs font-bold uppercase text-violet-500">Punto {index + 1}</p><h3 className="mt-1 text-xl font-bold">{punto.titulo}</h3><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{punto.contenido}</p></article>)}</section> : null}
              {instrucciones && <section className="mt-9 rounded-2xl bg-amber-50 p-5"><h2 className="font-bold text-amber-900">Aplicación para la semana</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-amber-950/80">{instrucciones}</p></section>}
              {recursosActivos.length > 0 && <section className="mt-9"><h2 className="text-xl font-bold">Material de apoyo</h2><div className="mt-4 space-y-2">{recursosActivos.map((recurso) => <a key={recurso.id} href={recurso.acceso_url ?? '#'} target="_blank" rel="noreferrer" className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-violet-700"><FileText className="h-4 w-4" />{recurso.titulo}</a>)}</div></section>}
            </article>
          </div>
        )}

        {herramienta === 'publicar' && (
          <div className="mx-auto max-w-3xl space-y-5">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">6. Revisar y enviar</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">El proyecto está listo para distribuirse</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Guarde primero los cambios. Después publique la guía para que aparezca en Inicio y llegue como notificación push.</p>
              <button type="button" onClick={guardar} disabled={isPending} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-700 disabled:opacity-60"><Save className="h-4 w-4" /> Guardar cambios antes de publicar</button>
            </section>
            <PackageDistributionControls paqueteId={paquete.id} initialAudience={paquete.audiencia ?? 'iglesia'} initialPublished={Boolean(paquete.publicado)} initialFeatured={Boolean(paquete.destacado)} />
          </div>
        )}
      </div>

      <div className="sticky bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-20 mt-6 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:bottom-4 print:hidden">
        <div className="flex items-center gap-2">
          <button type="button" onClick={guardar} disabled={isPending} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-60">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isPending ? 'Guardando…' : 'Guardar proyecto'}</button>
          <button type="button" onClick={() => setHerramienta('guia')} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"><Users className="h-4 w-4" /><span className="hidden sm:inline">Vista iglesia</span></button>
          <button type="button" onClick={() => setHerramienta('publicar')} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white"><Send className="h-4 w-4" /><span className="hidden sm:inline">Publicar</span></button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .app-bottom-nav, header, .print\\:hidden { display: none !important; }
          main { max-width: none !important; padding: 0 !important; background: white !important; }
          .paquete-print { border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
          @page { margin: 14mm; }
        }
      `}</style>
    </div>
  )
}
