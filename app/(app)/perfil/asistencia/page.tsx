import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AsistenciaPastoralVistaClient from '@/components/asistencia/AsistenciaPastoralVistaClient'

export const metadata: Metadata = {
  title: 'Asistencia pastoral',
}

export const dynamic = 'force-dynamic'

export default async function AsistenciaPastoralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, activo, estado_cuenta')
    .eq('id', user.id)
    .maybeSingle()

  const rol = (profile as { rol?: string | null; activo?: boolean | null; estado_cuenta?: string | null } | null)?.rol
  const activo = Boolean((profile as { activo?: boolean | null } | null)?.activo)
  const estadoCuenta = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta

  if (!activo || estadoCuenta !== 'activo' || (rol !== 'pastor' && rol !== 'administrador')) {
    redirect('/perfil')
  }

  return <AsistenciaPastoralVistaClient />
}
