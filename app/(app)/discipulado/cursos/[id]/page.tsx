import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscipuladoUserClient from '@/components/discipulado/DiscipuladoUserClient'

export const metadata: Metadata = { title: 'Curso temático' }

export default async function CursoTematicoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <DiscipuladoUserClient userId={user.id} courseId={id} />
}
