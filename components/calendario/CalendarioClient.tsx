'use client'

import { useMemo, useState } from 'react'
import CalendarioIOS from '@/components/calendario/CalendarioIOS'
import CalendarioSourcesPanel from '@/components/calendario/CalendarioSourcesPanel'
import { SkeletonPage } from '@/components/ui/Skeleton'
import { useCalendarEvents } from './useCalendarEvents'

type CalendarioClientProps = {
  userId: string
}

export default function CalendarioClient({ userId }: CalendarioClientProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [rangeYear, setRangeYear] = useState(() => new Date().getFullYear())

  const rangeStart = useMemo(() => new Date(rangeYear, 0, 1), [rangeYear])
  const rangeEnd = useMemo(() => new Date(rangeYear + 1, 0, 1), [rangeYear])

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
      <div className="min-h-screen w-full overflow-x-hidden bg-white pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        <div className="px-4 pt-4"><SkeletonPage cards={4} /></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-white">
      {error && (
        <div className="mx-4 mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="status">
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
      />

      <CalendarioSourcesPanel
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        userId={userId}
        onVisibilityChanged={reload}
      />
    </div>
  )
}
