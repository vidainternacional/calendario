import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscipuladoClient from '@/components/discipulado/DiscipuladoClient'

export const metadata: Metadata = { title: 'Discipulado' }

export default async function DiscipuladoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: canManage }] = await Promise.all([
    (supabase as any)
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single(),
    (supabase as any).rpc('puede_gestionar_discipulado'),
  ])

  return (
    <DiscipuladoClient
      userId={user.id}
      canManage={canManage === true}
      isAdmin={(profile as any)?.rol === 'administrador'}
    />
  )
}
