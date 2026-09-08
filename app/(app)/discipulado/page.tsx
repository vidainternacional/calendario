import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscipuladoUserClient from '@/components/discipulado/DiscipuladoUserClient'

export const metadata: Metadata = { title: 'Discipulado' }

export default async function DiscipuladoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: aprobado } = await (supabase as any).rpc('discipulado_aprobado', { p_profile_id: user.id })
  if (aprobado === true) redirect('/discipulado/completado')

  return <DiscipuladoUserClient userId={user.id} />
}
