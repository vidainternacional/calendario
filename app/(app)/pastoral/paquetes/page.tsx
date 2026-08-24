import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PackageOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PaquetesClient from '@/components/pastoral/PaquetesClient'
import PastoralPageHeader from '@/components/pastoral/PastoralPageHeader'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Proyectos Pastorales' }

export default async function PaquetesPastoralesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('No fue posible verificar el acceso a los proyectos pastorales.')
  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const [paquetesResult, bosquejosResult, coleccionesResult, recursosResult] = await Promise.all([
    (supabase as any).from('pastoral_paquetes').select('id, titulo, descripcion_publica, estado, updated_at').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_bosquejos').select('id, titulo').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_colecciones').select('id, nombre').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_biblioteca').select('id, titulo, categoria, tipo').eq('profile_id', user.id).order('updated_at', { ascending: false }),
  ])

  if (paquetesResult.error || bosquejosResult.error || coleccionesResult.error || recursosResult.error) {
    throw new Error('No fue posible cargar el espacio integrado de proyectos pastorales.')
  }

  const paquetes = paquetesResult.data
  const bosquejos = bosquejosResult.data
  const colecciones = coleccionesResult.data
  const recursos = recursosResult.data

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <PastoralPageHeader
        eyebrow="Espacio de trabajo"
        title="Proyecto"
        description="Reúne el bosquejo, los versículos y los recursos en una guía lista para compartir."
        icon={PackageOpen}
      />

      <PaquetesClient
        paquetes={(paquetes ?? []) as any}
        bosquejos={(bosquejos ?? []).map((item: any) => ({ id: item.id, titulo: item.titulo }))}
        colecciones={(colecciones ?? []).map((item: any) => ({ id: item.id, titulo: item.nombre }))}
        recursos={(recursos ?? []) as any}
      />
    </main>
  )
}
