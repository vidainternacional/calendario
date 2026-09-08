import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscipuladoGestionClient from '@/components/discipulado/DiscipuladoGestionClient'

export const metadata: Metadata = { title: 'Gestión de Discipulado' }

export default async function GestionDiscipuladoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: canManage }, { data: profile }] = await Promise.all([
    (supabase as any).rpc('puede_gestionar_discipulado'),
    (supabase as any).from('profiles').select('rol').eq('id', user.id).single(),
  ])

  if (canManage !== true) redirect('/discipulado')

  return <DiscipuladoGestionClient userId={user.id} isAdmin={(profile as any)?.rol === 'administrador'} />
}
