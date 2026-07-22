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
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 sm:px-0">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-[#171923] sm:mb-6">Crear nueva solicitud</h2>
        <NuevaSolicitudForm ministerioId={id} />
      </div>
    </div>
  )
}
