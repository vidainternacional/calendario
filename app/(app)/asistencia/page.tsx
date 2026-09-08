import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AsistenciaPastoralClient from '@/components/asistencia/AsistenciaPastoralClient'

export const metadata: Metadata = { title: 'Asistencia de la congregación' }
export const dynamic = 'force-dynamic'

export default async function AsistenciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, activo, estado_cuenta')
    .eq('id', user.id)
    .maybeSingle()

  const rol = (profile as any)?.rol
  const cuentaActiva = (profile as any)?.activo !== false && (profile as any)?.estado_cuenta !== 'inactivo'
  if (!cuentaActiva || (rol !== 'pastor' && rol !== 'administrador')) redirect('/inicio')

  return <AsistenciaPastoralClient />
}
