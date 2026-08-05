'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { readUserCache, writeUserCache } from '@/lib/cache/userCache'
import CalendarioIOS from '@/components/calendario/CalendarioIOS'
import CalendarioSourcesPanel from '@/components/calendario/CalendarioSourcesPanel'
import { SkeletonPage } from '@/components/ui/Skeleton'

type CalendarioClientProps = { userId: string }

type MinisterioGestionado = {
  id: string
  nombre: string
  color_primario?: string | null
}

type PermisosCalendario = {
  puedeCrear: boolean
  puedeCrearGlobal: boolean
  ministerios: MinisterioGestionado[]
}

type PerfilCalendario = {
  rol: 'servidor' | 'lider' | 'pastor' | 'administrador'
  activo: boolean
  estado_cuenta: string
}

type LiderazgoCalendario = { ministerios: MinisterioGestionado | null }

const CACHE_SCOPE = 'calendario:v6:sources-panel'
const CACHE_TTL = 10 * 60 * 1000

export default function CalendarioClient({ userId }: CalendarioClientProps) {
  const [asignaciones, setAsignaciones] = useState<unknown[] | null>(() => readUserCache<unknown[]>(userId, CACHE_SCOPE))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [permisos, setPermisos] = useState<PermisosCalendario>({ puedeCrear: false, puedeCrearGlobal: false, ministerios: [] })
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false

    async function cargarCalendario() {
      setIsRefreshing(true)
      const supabase = createClient()
      const db = supabase as any
      const ahora = new Date()
      const desde = new Date(ahora.getFullYear() - 1, 0, 1)
      const hasta = new Date(ahora.getFullYear() + 2, 0, 1)

      try {
        const [eventosResult, perfilResult, liderazgosResult, suscripcionesResult] = await Promise.all([
          db
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
                tiempo_viaje_minutos,
                calendar_id,
                ministerio_id,
                calendars!inner (
                  id,
                  nombre,
                  color,
                  tipo_cuenta,
                  es_publico,
                  ministerio_id
                ),
                ministerios (nombre)
              )
            `)
            .eq('profile_id', userId)
            .gte('eventos.fecha_inicio', desde.toISOString())
            .lt('eventos.fecha_inicio', hasta.toISOString())
            .order('fecha_inicio', { referencedTable: 'eventos', ascending: true }),
          db.from('profiles').select('rol, activo, estado_cuenta').eq('id', userId).single(),
          db
            .from('ministerio_miembros')
            .select('ministerio_id, es_lider, ministerios(id, nombre, color_primario)')
            .eq('profile_id', userId)
            .eq('es_lider', true),
          db.from('calendar_subscriptions').select('calendar_id, visible, can_edit').eq('user_id', userId),
        ])

        const perfil = perfilResult.data as PerfilCalendario | null
        const liderazgos = (liderazgosResult.data || []) as LiderazgoCalendario[]
        const rol = perfil?.rol
        const esPastorAdmin = rol === 'pastor' || rol === 'administrador'
        const subscriptionMap = new Map((suscripcionesResult.data || []).map((item: any) => [item.calendar_id, item]))
        let ministerios: MinisterioGestionado[] = []

        if (esPastorAdmin) {
          const { data } = await db.from('ministerios').select('id, nombre, color_primario').eq('activo', true).order('orden')
          ministerios = (data || []) as MinisterioGestionado[]
        } else {
          ministerios = liderazgos.map((item) => item.ministerios).filter((item): item is MinisterioGestionado => Boolean(item))
        }

        if (!cancelled) {
          const fresh = ((eventosResult.data || []) as any[])
            .filter((assignment) => {
              const calendarId = assignment?.eventos?.calendar_id
              const subscription = calendarId ? subscriptionMap.get(calendarId) as any : null
              return subscription?.visible !== false
            })
            .map((assignment) => {
              const calendarId = assignment?.eventos?.calendar_id
              const subscription = calendarId ? subscriptionMap.get(calendarId) as any : null
              return {
                ...assignment,
                eventos: {
                  ...assignment.eventos,
                  calendars: assignment.eventos?.calendars
                    ? { ...assignment.eventos.calendars, visible: subscription?.visible ?? true, can_edit: subscription?.can_edit ?? false }
                    : null,
                },
              }
            })

          setAsignaciones(fresh)
          writeUserCache(userId, CACHE_SCOPE, fresh, CACHE_TTL)
          setPermisos({
            puedeCrear: Boolean(esPastorAdmin || ministerios.length > 0),
            puedeCrearGlobal: Boolean(esPastorAdmin),
            ministerios,
          })
        }
      } finally {
        if (!cancelled) setIsRefreshing(false)
      }
    }

    void cargarCalendario()
    return () => { cancelled = true }
  }, [userId, refreshToken])

  if (asignaciones === null) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-white pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        <div className="px-4 pt-4"><SkeletonPage cards={4} /></div>
      </div>
    )
  }

  return (
    <div className="calendar-sources-host min-h-screen w-full min-w-0 overflow-x-hidden bg-white">
      <CalendarioIOS
        asignaciones={asignaciones}
        isRefreshing={isRefreshing}
        puedeCrear={permisos.puedeCrear}
        puedeCrearGlobal={permisos.puedeCrearGlobal}
        ministeriosGestionados={permisos.ministerios}
        userId={userId}
        onRefresh={refresh}
      />

      <button
        type="button"
        onClick={() => setSourcesOpen(true)}
        aria-label="Abrir calendarios visibles"
        className="fixed bottom-[calc(6.65rem+env(safe-area-inset-bottom))] right-[5.1rem] z-[95] flex h-14 w-14 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-700 shadow-lg backdrop-blur-xl"
      >
        <CalendarDays size={23} />
      </button>

      <CalendarioSourcesPanel
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        userId={userId}
        onVisibilityChanged={refresh}
      />

      <style jsx global>{`
        .calendar-sources-host [class*='floatingGroup'] button[aria-label='Cambiar vista'] {
          display: none;
        }
      `}</style>
    </div>
  )
}
