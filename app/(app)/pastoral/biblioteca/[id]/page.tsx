import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Link2,
  Presentation,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Recurso Pastoral' }

function formatoTamano(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function tipoRecurso(mime: string, nombre: string) {
  if (mime.startsWith('image/')) return { etiqueta: 'Imagen', Icono: FileImage }
  if (mime === 'application/pdf' || nombre.endsWith('.pdf')) return { etiqueta: 'PDF', Icono: FileText }
  if (mime.startsWith('video/')) return { etiqueta: 'Video', Icono: FileVideo }
  if (mime.startsWith('audio/')) return { etiqueta: 'Audio', Icono: FileAudio }
  if (mime.includes('presentation') || nombre.endsWith('.ppt') || nombre.endsWith('.pptx')) return { etiqueta: 'Presentación', Icono: Presentation }
  return { etiqueta: 'Documento', Icono: FileText }
}

export default async function RecursoBibliotecaPastoralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/pastoral/biblioteca/${id}`)}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, estado_cuenta')
    .eq('id', user.id)
    .single()

  const rol = (profile as { rol?: string } | null)?.rol
  const estado = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estado !== 'activo') redirect('/inicio')

  const { data: recurso } = await (supabase as any)
    .from('pastoral_biblioteca')
    .select('id, titulo, descripcion, categoria, etiquetas, tipo, url, storage_path, nombre_archivo, mime_type, tamano_bytes, updated_at')
    .eq('id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!recurso) notFound()

  let signedUrl: string | null = null
  if (recurso.tipo === 'archivo' && recurso.storage_path) {
    const { data } = await supabase.storage
      .from('pastoral-library')
      .createSignedUrl(recurso.storage_path, 60 * 60)
    signedUrl = data?.signedUrl ?? null
  }

  const mime = (recurso.mime_type ?? '').toLowerCase()
  const nombre = (recurso.nombre_archivo ?? '').toLowerCase()
  const esImagen = mime.startsWith('image/')
  const esPdf = mime === 'application/pdf' || nombre.endsWith('.pdf')
  const esVideo = mime.startsWith('video/')
  const esAudio = mime.startsWith('audio/')
  const visual = tipoRecurso(mime, nombre)
  const tamano = formatoTamano(recurso.tamano_bytes)

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <Link href="/pastoral/biblioteca" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-indigo-700">
        <ArrowLeft className="h-4 w-4" /> Biblioteca Pastoral
      </Link>

      <header className="mb-5 mt-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><visual.Icono className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">{recurso.tipo === 'enlace' ? 'Enlace externo' : visual.etiqueta}</p>
            <h1 className="mt-2 break-words text-2xl font-bold text-slate-950 sm:text-3xl">{recurso.titulo}</h1>
            {recurso.descripcion && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{recurso.descripcion}</p>}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              {recurso.nombre_archivo && <span className="rounded-full bg-slate-100 px-3 py-1.5">{recurso.nombre_archivo}</span>}
              {tamano && <span className="rounded-full bg-slate-100 px-3 py-1.5">{tamano}</span>}
              <span className="rounded-full bg-slate-100 px-3 py-1.5">{recurso.categoria}</span>
            </div>
          </div>
        </div>
      </header>

      {recurso.tipo === 'enlace' ? (
        <section className="rounded-[24px] border border-indigo-100 bg-white p-6 text-center shadow-sm sm:p-10">
          <Link2 className="mx-auto h-12 w-12 text-indigo-300" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">Este recurso abre un sitio externo</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Vida Internacional no controla el contenido del sitio enlazado. Se abrirá en una pestaña aparte.</p>
          <a href={recurso.url ?? '#'} target="_blank" rel="noreferrer" className={`mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white ${!recurso.url ? 'pointer-events-none opacity-40' : ''}`}>
            <ExternalLink className="h-4 w-4" /> Abrir enlace externo
          </a>
        </section>
      ) : !signedUrl ? (
        <section className="rounded-[24px] border border-rose-100 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-rose-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-950">No se pudo generar la vista temporal</h2>
          <p className="mt-2 text-sm text-slate-500">Regrese a la Biblioteca e inténtelo nuevamente.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          {esImagen && (
            <div className="flex min-h-[50vh] items-center justify-center bg-slate-950 p-3 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signedUrl} alt={recurso.titulo} className="max-h-[75vh] max-w-full rounded-xl object-contain" />
            </div>
          )}

          {esPdf && <iframe src={signedUrl} title={recurso.titulo} className="h-[72vh] w-full bg-slate-100" />}

          {esVideo && (
            <div className="bg-slate-950 p-3 sm:p-6">
              <video src={signedUrl} controls playsInline className="mx-auto max-h-[75vh] w-full rounded-xl" />
            </div>
          )}

          {esAudio && (
            <div className="p-6 sm:p-10">
              <div className="mx-auto max-w-2xl rounded-2xl bg-emerald-50 p-6 text-center">
                <FileAudio className="mx-auto h-12 w-12 text-emerald-600" />
                <p className="mt-3 font-bold text-slate-950">Reproducir audio</p>
                <audio src={signedUrl} controls className="mt-5 w-full" />
              </div>
            </div>
          )}

          {!esImagen && !esPdf && !esVideo && !esAudio && (
            <div className="p-8 text-center sm:p-12">
              <visual.Icono className="mx-auto h-14 w-14 text-slate-300" />
              <h2 className="mt-4 text-xl font-bold text-slate-950">Vista previa no disponible</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Este tipo de archivo debe abrirse con una aplicación compatible.</p>
            </div>
          )}

          <div className="border-t border-slate-200 p-4 sm:p-5">
            <a href={signedUrl} target="_blank" rel="noreferrer" download={recurso.nombre_archivo ?? undefined} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white sm:ml-auto sm:w-auto">
              <Download className="h-4 w-4" /> Abrir o descargar archivo
            </a>
          </div>
        </section>
      )}
    </main>
  )
}
