'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CalendarioIOS from '@/components/calendario/CalendarioIOS'
import CalendarioSourcesPanel from '@/components/calendario/CalendarioSourcesPanel'
import selectionFix from './CalendarioSelectionFix.module.css'
import sourcesGlass from './CalendarioSourcesGlass.module.css'
import { useCalendarEvents } from './useCalendarEvents'
import type { CalendarioOrigen, EventoCalendario } from './calendario-ios-types'

type CalendarioClientProps = {
  userId: string
  canCreateEvents: boolean
  creationCalendars: CalendarioOrigen[]
  initialEventId?: string | null
  initialEventDate?: string | null
}

function initialYearFor(dateValue?: string | null) {
  if (!dateValue) return new Date().getFullYear()
  const parsed = new Date(dateValue)
  return Number.isNaN(parsed.getTime()) ? new Date().getFullYear() : parsed.getFullYear()
}

export default function CalendarioClient({
  userId,
  canCreateEvents,
  creationCalendars,
  initialEventId = null,
  initialEventDate = null,
}: CalendarioClientProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [rangeYear, setRangeYear] = useState(() => initialYearFor(initialEventDate))
  const [externalDetail, setExternalDetail] = useState<EventoCalendario | null>(null)
  const initialEventHandled = useRef(false)

  const rangeStart = useMemo(() => new Date(rangeYear - 3, 0, 1), [rangeYear])
  const rangeEnd = useMemo(() => new Date(rangeYear + 4, 0, 1), [rangeYear])

  const {
    events,
    subscriptions,
    isRefreshing,
    error,
    reload,
  } = useCalendarEvents({
    userId,
    rangeStart,
    rangeEnd,
  })

  useEffect(() => {
    if (!initialEventId || initialEventHandled.current || isRefreshing) return

    let cancelled = false

    async function openInitialEvent() {
      let target = events.find((item) => item.kind === 'event' && item.id === initialEventId) || null

      if (!target) {
        const supabase = createClient() as any
        const { data: row, error: directError } = await supabase
          .from('eventos')
          .select(`
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
            ministerios (nombre)
          `)
          .eq('id', initialEventId)
          .maybeSingle()

        if (directError) {
          console.error('[CalendarioClient] No se pudo abrir el evento enlazado', directError)
        }

        if (row) {
          const calendarId = String(row.calendar_id)
          const calendar = subscriptions.find((item) => item.calendar_id === calendarId)?.calendars || null
          target = {
            kind: 'event',
            id: String(row.id),
            titulo: String(row.titulo),
            descripcion: row.descripcion || null,
            ubicacion: row.ubicacion || null,
            fecha_inicio: String(row.fecha_inicio),
            fecha_fin: row.fecha_fin ? String(row.fecha_fin) : null,
            todo_el_dia: Boolean(row.todo_el_dia),
            tiempo_viaje_minutos: Number(row.tiempo_viaje_minutos || 0),
            calendar_id: calendarId,
            calendar_ids: [calendarId],
            calendars: calendar,
            ministerio_id: row.ministerio_id || null,
            ministerios: row.ministerios || null,
            asignacion_id: null,
            estadoAsignacion: null,
          }
        }
      }

      if (cancelled) return
      initialEventHandled.current = true

      if (target) {
        setExternalDetail({ ...target })
      }

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('evento')
        url.searchParams.delete('fecha')
        const next = `${url.pathname}${url.search}${url.hash}`
        window.history.replaceState(window.history.state, '', next)
      }
    }

    void openInitialEvent()
    return () => {
      cancelled = true
    }
  }, [events, initialEventId, isRefreshing, subscriptions])

  return (
    <div className={`${selectionFix.selectionFix} ${sourcesGlass.host} min-h-screen w-full min-w-0 overflow-x-hidden bg-white`}>
      {error && (
        <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[120] rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg" role="status">
          {error}
        </div>
      )}

      <CalendarioIOS
        events={events}
        isRefreshing={isRefreshing}
        editableCalendars={creationCalendars}
        canCreateEvents={canCreateEvents && creationCalendars.length > 0}
        userId={userId}
        onRefresh={reload}
        onOpenCalendars={() => setSourcesOpen(true)}
        onRangeYearChange={setRangeYear}
        externalDetail={externalDetail}
        onExternalDetailConsumed={() => setExternalDetail(null)}
      />

      <CalendarioSourcesPanel
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        userId={userId}
        items={events}
        onOpenItem={(item) => {
          setSourcesOpen(false)
          setExternalDetail({ ...item })
        }}
        onVisibilityChanged={reload}
      />
    </div>
  )
}
