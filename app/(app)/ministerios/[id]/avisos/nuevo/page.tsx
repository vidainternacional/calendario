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

  // Verificar si tiene permisos (es líder del ministerio o pastor)
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6">Crear Nuevo Aviso</h2>
      <NuevoAvisoForm ministerioId={id} />
    </div>
  )
}
