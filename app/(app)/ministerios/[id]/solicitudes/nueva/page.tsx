import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NuevaSolicitudForm from '@/components/ministerios/NuevaSolicitudForm'

export const metadata: Metadata = {
  title: 'Nueva Solicitud',
}

export default async function NuevaSolicitudPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="bg-white border border-slate-100 rounded-[18px] p-6 shadow-xl">
      <h2 className="text-xl font-bold text-[#171923] mb-6">Crear Nueva Solicitud</h2>
      <NuevaSolicitudForm ministerioId={id} />
    </div>
  )
}
