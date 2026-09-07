import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VidaHoyClient from '@/components/biblia/VidaHoyClient'

export const metadata: Metadata = { title: 'Hoy en VIDA' }

export default async function HoyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: preferencia } = await (supabase as any)
    .from('versiculo_diario_preferencias')
    .select('activo, hora_local')
    .eq('profile_id', user.id)
    .maybeSingle()

  return (
    <VidaHoyClient
      initialActive={Boolean(preferencia?.activo)}
      initialHour={Number.isInteger(preferencia?.hora_local) ? Number(preferencia.hora_local) : 7}
    />
  )
}
