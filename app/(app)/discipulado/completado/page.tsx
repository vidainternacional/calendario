import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscipuladoCompletadoClient from '@/components/discipulado/DiscipuladoCompletadoClient'

export const metadata: Metadata = { title: 'Discipulado completado' }

export default async function DiscipuladoCompletadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: aprobado } = await (supabase as any).rpc('discipulado_aprobado', { p_profile_id: user.id })
  if (aprobado !== true) redirect('/discipulado')

  return <DiscipuladoCompletadoClient />
}
