import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProgramacionUXEnhancer from '@/components/ministerios/ProgramacionUXEnhancer'

export const dynamic = 'force-dynamic'

export default async function ProgramacionMinisterialLayout({
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
  const [{ data: profile }, { data: membresia }, { data: asignaciones = [] }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
    admin.from('ministerio_responsabilidad_asignaciones').select('responsabilidad_id').eq('profile_id', user.id),
  ])

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') redirect('/inicio')

  const esAdministrador = profile.rol === 'administrador'
  const esLider = membresia?.es_lider === true
  let responsablePaleta = false

  if (!esAdministrador && !esLider && asignaciones.length > 0) {
    const { data: responsabilidad } = await admin
      .from('ministerio_responsabilidades')
      .select('id')
      .in('id', asignaciones.map((item: any) => item.responsabilidad_id))
      .eq('ministerio_id', id)
      .eq('codigo', 'paleta_colores')
      .eq('activo', true)
      .limit(1)
    responsablePaleta = Boolean(responsabilidad?.length)
  }

  if (!esAdministrador && !esLider && !responsablePaleta) {
    redirect(`/ministerios/${id}`)
  }

  return (
    <div id="programacion-ministerial-root" className="programacion-ministerial min-h-screen bg-[#f5f5f7] pt-16 sm:pt-0">
      <ProgramacionUXEnhancer />
      {children}
    </div>
  )
}
