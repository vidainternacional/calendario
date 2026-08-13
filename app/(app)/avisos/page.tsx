import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AvisosContentRefresh from '@/components/avisos/AvisosContentRefresh'

export const metadata: Metadata = {
  title: 'Avisos',
  description: 'Publicaciones e información importante de tu comunidad',
}

export default async function AvisosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <AvisosContentRefresh userId={user.id} />
}
