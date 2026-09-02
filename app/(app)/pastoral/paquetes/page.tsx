import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PackageOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PaquetesClient from '@/components/pastoral/PaquetesClient'
import PastoralPageHeader from '@/components/pastoral/PastoralPageHeader'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Proyectos Pastorales' }

export default async function PaquetesPastoralesPage({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const { nuevo } = await searchParams
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

  const { data: paquetes, error } = await (supabase as any)
    .from('pastoral_paquetes')
    .select('id, titulo, descripcion_publica, estado, publicado, public_slug, presentacion_diapositivas, updated_at')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('No fue posible cargar los proyectos pastorales.')

  return (
    <main className="pastoral-project-page mx-auto min-h-screen max-w-6xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <PastoralPageHeader
        eyebrow="Centro Pastoral"
        title="Proyectos"
        description="Busca, filtra y administra todos tus proyectos desde un solo lugar."
        icon={PackageOpen}
      />

      <PaquetesClient paquetes={(paquetes ?? []) as any} abrirNuevo={nuevo === '1'} />
    </main>
  )
}
