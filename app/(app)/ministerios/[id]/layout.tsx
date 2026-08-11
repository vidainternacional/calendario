import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import BackButton from '@/components/navigation/BackButton'
import MinisterioDashboardSwitcher from '@/components/ministerios/MinisterioDashboardSwitcher'
import PersonalizarMinisterioButton from '@/components/ministerios/PersonalizarMinisterioButton'
import MinisterioSolicitudesEnhancer from '@/components/ministerios/MinisterioSolicitudesEnhancer'
import styles from './MinisterioLayout.module.css'

export const dynamic = 'force-dynamic'

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
      .select('id, nombre, descripcion, emoji, color_primario, color_secundario, portada_url, avatar_url, fuente_titulo, fuente_cuerpo')
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
    portada_url: string | null
    avatar_url: string | null
    fuente_titulo: string | null
    fuente_cuerpo: string | null
  } | null
  if (!ministerio) notFound()

  const profile = profileReq.data as any
  const isAdminOrPastor =
    profile?.rol === 'pastor' ||
    profile?.rol === 'administrador' ||
    profile?.es_pastor_general
  const esLider = Boolean((membresiaReq.data as any)?.es_lider)
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

  return (
    <div className={`${styles.shell} relative min-h-screen overflow-x-hidden bg-[#f4f5f9]`}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 mx-auto max-w-2xl px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <div className="pointer-events-auto flex min-w-0 items-center gap-2">
          <div className="rounded-full bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur-md">
            <BackButton />
          </div>
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
      </div>

      <MinisterioSolicitudesEnhancer ministerioId={id} puedeGestionar={puedePersonalizar} />
      <div>{children}</div>
    </div>
  )
}
