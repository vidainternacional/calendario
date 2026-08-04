'use client'

import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { readUserCache, writeUserCache } from '@/lib/cache/userCache'
import CalendarioPilotoViews from '@/components/calendario/CalendarioPilotoViews'
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
      <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#f4f5f9] pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        <div className="px-4 pt-4">
          <SkeletonPage cards={4} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#f4f5f9] pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {asignaciones.length > 0 ? (
        <CalendarioPilotoViews asignaciones={asignaciones} isRefreshing={isRefreshing} />
      ) : (
        <div
          className="px-4"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
        >
          <header className="pb-5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Calendario</h1>
            <p className="mt-1 text-sm text-slate-500">Tus eventos y turnos asignados</p>
          </header>
          <EmptyState
            icon={CalendarDays}
            title="Aún no tienes eventos asignados"
            description="Cuando te asignen un turno o una actividad, aparecerá aquí con su fecha, horario y ministerio. Mientras tanto, puedes revisar los ministerios en los que participas."
            action={{ label: 'Ver mis ministerios', href: '/ministerios' }}
            compact
          />
        </div>
      )}
    </main>
  )
}
