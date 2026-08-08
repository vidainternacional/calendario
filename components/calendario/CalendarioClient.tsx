'use client'

import { useMemo, useState } from 'react'
import CalendarioIOS from '@/components/calendario/CalendarioIOS'
import CalendarioSourcesPanel from '@/components/calendario/CalendarioSourcesPanel'
import selectionFix from './CalendarioSelectionFix.module.css'
import sourcesGlass from './CalendarioSourcesGlass.module.css'
import { useCalendarEvents } from './useCalendarEvents'
import type { EventoCalendario } from './calendario-ios-types'

type CalendarioClientProps = {
  userId: string
  canCreateEvents: boolean
}

export default function CalendarioClient({ userId, canCreateEvents }: CalendarioClientProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [rangeYear, setRangeYear] = useState(() => new Date().getFullYear())
  const [externalDetail, setExternalDetail] = useState<EventoCalendario | null>(null)

  const rangeStart = useMemo(() => new Date(rangeYear - 3, 0, 1), [rangeYear])
  const rangeEnd = useMemo(() => new Date(rangeYear + 4, 0, 1), [rangeYear])

  const {
    events,
    editableCalendars,
    isRefreshing,
    error,
    reload,
  } = useCalendarEvents({
    userId,
    rangeStart,
    rangeEnd,
  })

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
        editableCalendars={editableCalendars}
        canCreateEvents={canCreateEvents}
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
