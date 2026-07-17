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
    <main className="min-h-screen bg-[#f4f5f9] max-w-lg mx-auto">
      <div className="sticky top-0 z-40 bg-[#f4f5f9]/95 backdrop-blur-md px-4 pt-8 pb-4">
        <header>
          <h1 className="text-2xl font-bold text-[#171923]">Mi Calendario</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tus eventos y turnos asignados
          </p>
        </header>
      </div>

      <div className="px-4">
        <CalendarioViews asignaciones={asignaciones || []} />
      </div>
    </main>
  )
}

