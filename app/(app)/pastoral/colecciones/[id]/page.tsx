import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ColeccionDetalleClient from '@/components/pastoral/ColeccionDetalleClient'

export const metadata: Metadata = {
  title: 'Colección Pastoral',
}

export default async function ColeccionPastoralDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, estado_cuenta')
    .eq('id', user.id)
    .single()

  const rol = (profile as { rol?: string } | null)?.rol
  const estado = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estado !== 'activo') redirect('/inicio')

  const { data: coleccion, error } = await (supabase as any)
    .from('pastoral_colecciones')
    .select('id, nombre, descripcion, color, pastoral_versiculos(id, traduccion, libro_nombre, capitulo, verso, texto, nota, created_at)')
    .eq('id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (error) console.error('[ColeccionPastoralDetallePage]', error)
  if (!coleccion) notFound()

  const detalle = {
    id: coleccion.id,
    nombre: coleccion.nombre,
    descripcion: coleccion.descripcion ?? '',
    color: coleccion.color ?? 'indigo',
    versiculos: [...(coleccion.pastoral_versiculos ?? [])]
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((item: any) => ({
        id: item.id,
        traduccion: item.traduccion,
        libro_nombre: item.libro_nombre,
        capitulo: item.capitulo,
        verso: item.verso,
        texto: item.texto,
        nota: item.nota ?? '',
      })),
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <div className="print:hidden mb-5">
        <Link href="/pastoral/colecciones" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
          <ArrowLeft className="h-4 w-4" /> Colecciones
        </Link>
      </div>
      <ColeccionDetalleClient coleccion={detalle} />
    </main>
  )
}
