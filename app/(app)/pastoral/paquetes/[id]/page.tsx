import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PaqueteDetalleClient from '@/components/pastoral/PaqueteDetalleClient'
import CargaRapidaRecursos from '@/components/pastoral/CargaRapidaRecursos'

export const metadata: Metadata = { title: 'Paquete Pastoral' }

export default async function PaquetePastoralDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('rol, estado_cuenta').eq('id', user.id).single()
  const rol = (profile as { rol?: string } | null)?.rol
  const estadoCuenta = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estadoCuenta !== 'activo') redirect('/inicio')

  const { data: paquete } = await (supabase as any)
    .from('pastoral_paquetes')
    .select('id, titulo, descripcion_publica, instrucciones, bosquejo_id, coleccion_id, recurso_ids, estado, presentacion_diapositivas, presentacion_pdf_recurso_id')
    .eq('id', id).eq('profile_id', user.id).maybeSingle()
  if (!paquete) notFound()

  const [{ data: bosquejos }, { data: colecciones }, { data: bibliotecaBase }] = await Promise.all([
    (supabase as any).from('pastoral_bosquejos').select('id, titulo, tema, pasaje_base, proposito, introduccion, puntos, conclusion').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_colecciones').select('id, nombre, descripcion').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_biblioteca').select('id, titulo, descripcion, categoria, tipo, url, storage_path, mime_type, nombre_archivo').eq('profile_id', user.id).order('updated_at', { ascending: false }),
  ])

  const biblioteca = await Promise.all((bibliotecaBase ?? []).map(async (item: any) => {
    let acceso_url: string | null = item.tipo === 'enlace' ? item.url : null
    if (item.tipo === 'archivo' && item.storage_path) {
      const { data } = await supabase.storage.from('pastoral-library').createSignedUrl(item.storage_path, 60 * 60)
      acceso_url = data?.signedUrl ?? null
    }
    return { ...item, acceso_url }
  }))

  const bosquejo = (bosquejos ?? []).find((item: any) => item.id === paquete.bosquejo_id) ?? null
  const coleccionBase = (colecciones ?? []).find((item: any) => item.id === paquete.coleccion_id) ?? null
  let coleccion = null
  if (coleccionBase) {
    const { data: versiculos } = await (supabase as any).from('pastoral_versiculos').select('id, referencia, texto, traduccion, nota').eq('coleccion_id', coleccionBase.id).eq('profile_id', user.id).order('created_at', { ascending: true })
    coleccion = { ...coleccionBase, versiculos: versiculos ?? [] }
  }

  const idsSeleccionados = new Set<string>((paquete.recurso_ids ?? []) as string[])
  const recursosSeleccionados = biblioteca.filter((item: any) => idsSeleccionados.has(item.id))
  const pdfPresentacion = biblioteca.find((item: any) => item.id === paquete.presentacion_pdf_recurso_id) ?? null

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <header className="mb-6 print:hidden">
        <Link href="/pastoral/paquetes" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-indigo-700"><ArrowLeft className="h-4 w-4" /> Paquetes pastorales</Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Paquete integral</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Preparar y compartir</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">Prepara la guía congregacional y una presentación independiente para pantalla o proyector.</p>
      </header>

      <CargaRapidaRecursos />

      <PaqueteDetalleClient
        paquete={paquete as any}
        bosquejo={bosquejo as any}
        coleccion={coleccion as any}
        recursos={recursosSeleccionados as any}
        pdfPresentacion={pdfPresentacion as any}
        bosquejos={(bosquejos ?? []).map((item: any) => ({ id: item.id, titulo: item.titulo }))}
        colecciones={(colecciones ?? []).map((item: any) => ({ id: item.id, titulo: item.nombre }))}
        biblioteca={biblioteca as any}
      />
    </main>
  )
}
