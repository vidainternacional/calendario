import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarioClient from '@/components/calendario/CalendarioClient'

export const metadata: Metadata = {
  title: 'Calendario',
}

export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileReq, leaderReq] = await Promise.all([
    supabase
      .from('profiles')
      .select('rol, es_pastor_general, activo, estado_cuenta')
      .eq('id', user.id)
      .single(),
    supabase
      .from('ministerio_miembros')
      .select('ministerio_id')
      .eq('profile_id', user.id)
      .eq('es_lider', true)
      .limit(1),
  ])

  const profile = profileReq.data as {
    rol?: string | null
    es_pastor_general?: boolean | null
    activo?: boolean | null
    estado_cuenta?: string | null
  } | null

  const cuentaActiva = Boolean(profile?.activo) && profile?.estado_cuenta === 'activo'
  const esPastorOAdmin =
    profile?.rol === 'pastor' ||
    profile?.rol === 'administrador' ||
    Boolean(profile?.es_pastor_general)
  const esLider = (leaderReq.data || []).length > 0
  const canCreateEvents = cuentaActiva && (esPastorOAdmin || esLider)

  return <CalendarioClient userId={user.id} canCreateEvents={canCreateEvents} />
}
