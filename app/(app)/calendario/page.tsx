import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarioViews from '@/components/calendario/CalendarioViews'

export const metadata: Metadata = {
  title: 'Calendario',
}

export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener SOLO los eventos personales asignados al usuario
  const { data: asignaciones } = await supabase
    .from('evento_asignaciones')
    .select(`
      id,
      estado,
      eventos!inner (
        id,
        titulo,
        descripcion,
        ubicacion,
        fecha_inicio,
        fecha_fin,
        todo_el_dia,
        ministerios (
          nombre,
          color_primario
        )
      )
    `)
    .eq('profile_id', user.id)
    // Se ordenará en el cliente por fecha ya que date-fns nos da más control

  return (
    <main className="min-h-screen bg-[#f4f5f9] pb-28">
      <div
        className="sticky top-0 z-40 border-b border-slate-100/70 bg-[#f4f5f9]/95 px-4 pb-4 backdrop-blur-md"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <header className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-[#171923]">Mi Calendario</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tus eventos y turnos asignados
          </p>
        </header>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        <CalendarioViews asignaciones={asignaciones || []} />
      </div>
    </main>
  )
}
