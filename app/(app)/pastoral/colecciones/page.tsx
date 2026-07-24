import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, BookHeart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ColeccionesClient from '@/components/pastoral/ColeccionesClient'

export const metadata: Metadata = {
  title: 'Colecciones Pastorales',
}

export default async function ColeccionesPastoralesPage() {
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

  const { data, error } = await (supabase as any)
    .from('pastoral_colecciones')
    .select('id, nombre, descripcion, color, pastoral_versiculos(count)')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) console.error('[ColeccionesPastoralesPage]', error)

  const colecciones = (data ?? []).map((coleccion: any) => ({
    id: coleccion.id,
    nombre: coleccion.nombre,
    descripcion: coleccion.descripcion ?? '',
    color: coleccion.color ?? 'indigo',
    totalVersiculos: coleccion.pastoral_versiculos?.[0]?.count ?? 0,
  }))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <header className="mb-6">
        <Link href="/pastoral" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Panel Pastoral
        </Link>
        <div className="flex items-center gap-2 text-indigo-600">
          <BookHeart className="h-4 w-4" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Versículos</p>
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">Colecciones pastorales</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Organiza pasajes por tema, serie, prédica o necesidad ministerial sin mezclarlos con tus favoritos personales.
        </p>
      </header>

      <ColeccionesClient colecciones={colecciones} />
    </main>
  )
}
