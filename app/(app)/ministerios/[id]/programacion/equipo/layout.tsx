import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EquipoMinisterialLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
  ])

  const autorizado = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (profile?.rol === 'administrador' || membresia?.es_lider === true)

  if (!autorizado) redirect(`/ministerios/${id}`)
  return children
}
