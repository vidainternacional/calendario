import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PaqueteDetalleClient from '@/components/pastoral/PaqueteDetalleClient'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Espacio Pastoral' }

export default async function PaquetePastoralDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const { data: paquete } = await (supabase as any)
    .from('pastoral_paquetes')
    .select('id, titulo, descripcion_publica, instrucciones, notas_privadas, bosquejo_id, coleccion_id, recurso_ids, estado, presentacion_diapositivas, presentacion_pdf_recurso_id, audiencia, publicado, destacado, public_slug')
    .eq('id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

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
    const { data: versiculos } = await (supabase as any)
      .from('pastoral_versiculos')
      .select('id, referencia, texto, traduccion, nota')
      .eq('coleccion_id', coleccionBase.id)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: true })
    coleccion = { ...coleccionBase, versiculos: versiculos ?? [] }
  }

  const idsSeleccionados = new Set<string>((paquete.recurso_ids ?? []) as string[])
  const recursosSeleccionados = biblioteca.filter((item: any) => idsSeleccionados.has(item.id))
  const pdfPresentacion = biblioteca.find((item: any) => item.id === paquete.presentacion_pdf_recurso_id) ?? null

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-6 lg:px-8">
      <div className="mb-2 print:hidden">
        <Link href="/pastoral" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-1 text-sm font-bold text-violet-700">
          <ArrowLeft className="h-4 w-4" /> Centro Pastoral
        </Link>
      </div>

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
