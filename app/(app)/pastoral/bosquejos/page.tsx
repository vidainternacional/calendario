import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BosquejosClient from '@/components/pastoral/BosquejosClient'
import PastoralPageHeader from '@/components/pastoral/PastoralPageHeader'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Bosquejos pastorales' }

export default async function BosquejosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('No fue posible verificar el acceso a los bosquejos pastorales.')
  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const { data, error } = await (supabase as any)
    .from('pastoral_bosquejos')
    .select('id, titulo, tema, pasaje_base, estado, updated_at')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('No fue posible cargar los bosquejos pastorales.')

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <PastoralPageHeader
        eyebrow="Preparación"
        title="Bosquejos"
        description="Estructura el mensaje, organiza sus puntos y retómalo cuando lo necesites."
        icon={FileText}
      />
      <BosquejosClient bosquejos={(data ?? []) as any} />
    </main>
  )
}
