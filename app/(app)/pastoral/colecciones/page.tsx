import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BookHeart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ColeccionesClient from '@/components/pastoral/ColeccionesClient'
import PastoralPageHeader from '@/components/pastoral/PastoralPageHeader'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = {
  title: 'Colecciones Pastorales',
}

export default async function ColeccionesPastoralesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('No fue posible verificar el acceso a las colecciones pastorales.')
  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const { data, error } = await (supabase as any)
    .from('pastoral_colecciones')
    .select('id, nombre, descripcion, color, pastoral_versiculos(count)')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('No fue posible cargar las colecciones pastorales.')

  const colecciones = (data ?? []).map((coleccion: any) => ({
    id: coleccion.id,
    nombre: coleccion.nombre,
    descripcion: coleccion.descripcion ?? '',
    color: coleccion.color ?? 'indigo',
    totalVersiculos: coleccion.pastoral_versiculos?.[0]?.count ?? 0,
  }))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <PastoralPageHeader
        eyebrow="Versículos"
        title="Colecciones"
        description="Agrupa pasajes por tema o mensaje sin mezclarlos con tus favoritos personales."
        icon={BookHeart}
      />

      <ColeccionesClient colecciones={colecciones} />
    </main>
  )
}
