import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import BackButton from '@/components/navigation/BackButton'

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
    supabase.from('ministerios').select('id, nombre').eq('id', id).single(),
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

  const ministerio = minReq.data as { id: string; nombre: string } | null
  if (!ministerio) notFound()

  const profile = profileReq.data as any
  const isAdminOrPastor =
    profile?.rol === 'pastor' ||
    profile?.rol === 'administrador' ||
    profile?.es_pastor_general
  const esLider = Boolean((membresiaReq.data as any)?.es_lider)
  const puedeGestionarIngresos = esLider || isAdminOrPastor

  if (!membresiaReq.data && !isAdminOrPastor) {
    redirect('/ministerios')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f5f9]">
      <div
        className="relative z-10 mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2 px-4 pb-3"
        style={{ paddingTop: 'max(0.25rem, env(safe-area-inset-top))' }}
      >
        <BackButton />

        {puedeGestionarIngresos && (
          <Link
            href={`/ministerios/${id}/solicitudes-ingreso`}
            className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50 active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Solicitudes de ingreso</span>
          </Link>
        )}
      </div>

      <div>{children}</div>
    </div>
  )
}
