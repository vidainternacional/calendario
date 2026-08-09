import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AvisosClient from '@/components/avisos/AvisosClient'

export const metadata: Metadata = {
  title: 'Gestión de avisos',
  description: 'Administración de publicaciones y avisos de Vida Internacional',
}

export default async function AdminAvisosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, es_pastor_general')
    .eq('id', user.id)
    .single()

  const p = profile as any
  const allowed = p?.rol === 'administrador' || p?.rol === 'pastor' || p?.es_pastor_general === true
  if (!allowed) redirect('/inicio')

  return <AvisosClient userId={user.id} adminMode />
}
