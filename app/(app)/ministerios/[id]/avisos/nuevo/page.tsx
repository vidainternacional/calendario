import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NuevoAvisoForm from '@/components/ministerios/NuevoAvisoForm'

export const metadata: Metadata = {
  title: 'Nuevo Aviso',
}

export default async function NuevoAvisoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membresia } = await supabase
    .from('ministerio_miembros')
    .select('es_lider')
    .eq('ministerio_id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  let esPastor = false
  if (!(membresia as any)?.es_lider) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    esPastor = (profile as any)?.rol === 'pastor' || (profile as any)?.rol === 'administrador'
  }

  if (!(membresia as any)?.es_lider && !esPastor) {
    redirect(`/ministerios/${id}/avisos`)
  }

  return (
    <div className="px-4 pb-28 sm:px-0">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-[#171923] sm:mb-6">Crear nuevo aviso</h2>
        <NuevoAvisoForm ministerioId={id} />
      </div>
    </div>
  )
}
