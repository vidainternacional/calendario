import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscipuladoUserClient from '@/components/discipulado/DiscipuladoUserClient'

export const metadata: Metadata = { title: 'Discipulado' }

export default async function DiscipuladoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <DiscipuladoUserClient userId={user.id} />
}
