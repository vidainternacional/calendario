import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import CalendarioViews from '@/components/calendario/CalendarioViews'
import { EmptyState } from '@/components/ui/EmptyState'

export const metadata: Metadata = {
  title: 'Calendario',
}

export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const inicioDeHoy = new Date()
  inicioDeHoy.setHours(0, 0, 0, 0)

  // Traer solo eventos vigentes reduce datos transferidos y trabajo de renderizado.
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
    .gte('eventos.fecha_inicio', inicioDeHoy.toISOString())
    .order('fecha_inicio', { referencedTable: 'eventos', ascending: true })

  const eventosAsignados = asignaciones || []

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
        {eventosAsignados.length > 0 ? (
          <CalendarioViews asignaciones={eventosAsignados} />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="Aún no tienes eventos asignados"
            description="Cuando te asignen un turno o una actividad, aparecerá aquí con su fecha, horario y ministerio."
            compact
            className="mt-4"
          />
        )}
      </div>
    </main>
  )
}
