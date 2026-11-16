import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscipuladoTemasClient from '@/components/discipulado/DiscipuladoTemasClient'

export const metadata: Metadata = { title: 'Otros cursos' }

export default async function CursosTematicosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <DiscipuladoTemasClient userId={user.id} />
}
