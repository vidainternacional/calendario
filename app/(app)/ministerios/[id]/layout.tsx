import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
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

  if (!membresiaReq.data && !isAdminOrPastor) {
    redirect('/ministerios')
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <div
        className="relative z-10 mx-auto max-w-2xl px-4 pb-2"
        style={{ paddingTop: 'max(0.25rem, env(safe-area-inset-top))' }}
      >
        <BackButton />
      </div>

      <div>{children}</div>
    </div>
  )
}
