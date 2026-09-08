import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AsistenciaEventoClient from '@/components/asistencia/AsistenciaEventoClient'

export const metadata: Metadata = { title: 'Asistencia' }
export const dynamic = 'force-dynamic'

export default async function AsistenciaEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: puedeGestionar }, { data: evento }] = await Promise.all([
    (supabase as any).rpc('puede_gestionar_asistencia'),
    (supabase as any).from('eventos').select('id,titulo,fecha_inicio').eq('id', id).maybeSingle(),
  ])

  if (puedeGestionar !== true) redirect(`/eventos/${id}`)
  if (!evento) notFound()

  return <AsistenciaEventoClient eventId={id} titulo={String(evento.titulo)} fechaInicio={String(evento.fecha_inicio)} />
}
