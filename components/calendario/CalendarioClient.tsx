'use client'

import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { readUserCache, writeUserCache } from '@/lib/cache/userCache'
import CalendarioViews from '@/components/calendario/CalendarioViews'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonPage } from '@/components/ui/Skeleton'

type CalendarioClientProps = {
  userId: string
}

const CACHE_SCOPE = 'calendario:v1'
const CACHE_TTL = 10 * 60 * 1000

export default function CalendarioClient({ userId }: CalendarioClientProps) {
  const [asignaciones, setAsignaciones] = useState<any[] | null>(() =>
    readUserCache<any[]>(userId, CACHE_SCOPE),
  )
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      setIsRefreshing(true)
      const supabase = createClient()
      const inicioDeHoy = new Date()
      inicioDeHoy.setHours(0, 0, 0, 0)

      try {
        const { data } = await supabase
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
          .eq('profile_id', userId)
          .gte('eventos.fecha_inicio', inicioDeHoy.toISOString())
          .order('fecha_inicio', { referencedTable: 'eventos', ascending: true })

        const fresh = data || []
        if (!cancelled) {
          setAsignaciones(fresh)
          writeUserCache(userId, CACHE_SCOPE, fresh, CACHE_TTL)
        }
      } finally {
        if (!cancelled) setIsRefreshing(false)
      }
    }

    void refresh()
    return () => {
      cancelled = true
    }
  }, [userId])

  if (asignaciones === null) {
    return (
      <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4">
        <SkeletonPage cards={4} />
      </main>
    )
  }

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#f4f5f9] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div
        className="sticky top-0 z-40 border-b border-slate-100/70 bg-[#f4f5f9]/95 px-4 pb-4 backdrop-blur-md"
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <header className="mx-auto min-w-0 max-w-2xl">
          <h1 className="break-words text-2xl font-bold text-[#171923]">Mi Calendario</h1>
          <p className="mt-1 break-words text-sm text-gray-500">
            Tus eventos y turnos asignados
            {isRefreshing && <span className="ml-2 text-xs text-gray-400">Actualizando…</span>}
          </p>
        </header>
      </div>

      <div
        className="mx-auto min-w-0 max-w-2xl px-4"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        {asignaciones.length > 0 ? (
          <CalendarioViews asignaciones={asignaciones} />
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
