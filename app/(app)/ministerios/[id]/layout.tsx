import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import BackButton from '@/components/navigation/BackButton'
import MinisterioDashboardSwitcher from '@/components/ministerios/MinisterioDashboardSwitcher'
import PersonalizarMinisterioButton from '@/components/ministerios/PersonalizarMinisterioButton'

export default async function MinisterioLayout({
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

  const [minReq, membresiaReq, profileReq] = await Promise.all([
    supabase
      .from('ministerios')
      .select('id, nombre, descripcion, emoji, color_primario, color_secundario')
      .eq('id', id)
      .single(),
    supabase
      .from('ministerio_miembros')
      .select('es_lider')
      .eq('ministerio_id', id)
      .eq('profile_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('rol, es_pastor_general')
      .eq('id', user.id)
      .single(),
  ])

  const ministerio = minReq.data as {
    id: string
    nombre: string
    descripcion: string | null
    emoji: string | null
    color_primario: string | null
    color_secundario: string | null
  } | null
  if (!ministerio) notFound()

  const profile = profileReq.data as any
  const isAdminOrPastor =
    profile?.rol === 'pastor' ||
    profile?.rol === 'administrador' ||
    profile?.es_pastor_general
  const esLider = Boolean((membresiaReq.data as any)?.es_lider)
  const puedeGestionarIngresos = esLider || isAdminOrPastor
  const puedePersonalizar = esLider || isAdminOrPastor

  if (!membresiaReq.data && !isAdminOrPastor) {
    redirect('/ministerios')
  }

  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id')
    .eq('profile_id', user.id)

  const ids = (membresias || []).map((item: any) => item.ministerio_id)
  let ministeriosAccesibles: Array<{
    id: string
    nombre: string
    emoji: string | null
    color: string | null
  }> = []

  if (ids.length > 0) {
    const { data } = await supabase
      .from('ministerios')
      .select('id, nombre, emoji, color_primario')
      .in('id', ids)
      .eq('activo', true)
      .order('orden', { ascending: true })

    ministeriosAccesibles = (data || []).map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      emoji: item.emoji,
      color: item.color_primario,
    }))
  }

  let solicitudesPendientes = 0
  if (puedeGestionarIngresos) {
    const { count } = await (supabase as any)
      .from('ministerio_solicitudes_ingreso')
      .select('id', { count: 'exact', head: true })
      .eq('ministerio_id', id)
      .eq('estado', 'pendiente')

    solicitudesPendientes = count || 0
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f4f5f9]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 mx-auto max-w-2xl px-4"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <div className="pointer-events-auto flex min-w-0 items-center gap-2">
          <BackButton />
          <MinisterioDashboardSwitcher
            actualId={id}
            actual={{
              id: ministerio.id,
              nombre: ministerio.nombre,
              emoji: ministerio.emoji,
              color: ministerio.color_primario,
            }}
            ministerios={ministeriosAccesibles}
          />
          {puedePersonalizar && <PersonalizarMinisterioButton ministerio={ministerio} />}
        </div>

        {solicitudesPendientes > 0 && (
          <Link
            href={`/ministerios/${id}/solicitudes-ingreso`}
            className="pointer-events-auto mt-2 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/95 px-3 py-2 text-sm font-semibold text-indigo-600 shadow-lg backdrop-blur-md transition-colors hover:bg-white active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {solicitudesPendientes === 1
                ? '1 solicitud de ingreso'
                : `${solicitudesPendientes} solicitudes de ingreso`}
            </span>
          </Link>
        )}
      </div>

      <div>{children}</div>
    </div>
  )
}
