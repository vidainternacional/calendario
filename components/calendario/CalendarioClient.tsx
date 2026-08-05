'use client'

import { useMemo, useState } from 'react'
import CalendarioIOS from '@/components/calendario/CalendarioIOS'
import CalendarioSourcesPanel from '@/components/calendario/CalendarioSourcesPanel'
import { SkeletonPage } from '@/components/ui/Skeleton'
import appearance from './CalendarioAppearance.module.css'
import polish from './CalendarioIOSPolish.module.css'
import { useCalendarEvents } from './useCalendarEvents'
import type { EventoCalendario } from './calendario-ios-types'

type CalendarioClientProps = {
  userId: string
}

export default function CalendarioClient({ userId }: CalendarioClientProps) {
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

  if (isRefreshing && events.length === 0) {
    return (
      <div data-calendar-shell className={`${appearance.root} ${polish.root} min-h-screen w-full overflow-x-hidden pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]`}>
        <div className="px-4 pt-4"><SkeletonPage cards={4} /></div>
      </div>
    )
  }

  return (
    <div data-calendar-shell className={`${appearance.root} ${polish.root} min-h-screen w-full min-w-0 overflow-x-hidden`}>
      {error && (
        <div className={appearance.errorBanner} role="status">
          {error}
        </div>
      )}

      <CalendarioIOS
        events={events}
        isRefreshing={isRefreshing}
        editableCalendars={editableCalendars}
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
