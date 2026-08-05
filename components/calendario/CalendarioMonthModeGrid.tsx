'use client'

import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns'
import { eventColor, eventosDelDia, type EventoCalendario, type ModoVisualCalendario } from './calendario-ios-types'
import selection from './CalendarioSelection.module.css'
import modeStyles from './CalendarioDisplayModes.module.css'

function numberClass(today: boolean, selected: boolean) {
  if (today) return `${modeStyles.modeNumber} ${selection.todayFilled}`
  if (selected) return `${modeStyles.modeNumber} ${selection.selectedRing}`
  return modeStyles.modeNumber
}

function uniqueColors(items: EventoCalendario[]) {
  return [...new Set(items.map((item) => eventColor(item)))].slice(0, 4)
}

function EventMarks({ items, mode }: { items: EventoCalendario[]; mode: ModoVisualCalendario }) {
  if (items.length === 0) return <span className={modeStyles.modeEvents} />
  const colors = uniqueColors(items)

  if (mode === 'compacta') {
    return (
      <span className={`${modeStyles.modeEvents} ${modeStyles.compactMarks}`} aria-hidden="true">
        {colors.slice(0, 3).map((color) => <span key={color} className={modeStyles.compactDot} style={{ backgroundColor: color }} />)}
      </span>
    )
  }

  if (mode === 'apilada') {
    return (
      <span className={modeStyles.modeEvents} aria-hidden="true">
        {items.slice(0, 3).map((item) => (
          <span key={item.asignacion_id} className={modeStyles.stackedChip} style={{ backgroundColor: eventColor(item) }}>
            {item.titulo}
          </span>
        ))}
        {items.length > 3 && <span className={modeStyles.stackedMore}>+{items.length - 3}</span>}
      </span>
    )
  }

  return (
    <span className={`${modeStyles.modeEvents} ${modeStyles.detailsBars}`} aria-hidden="true">
      {items.slice(0, 3).map((item, index) => (
        <span key={`${item.asignacion_id}-${index}`} className={modeStyles.detailsBar}>
          <span className={modeStyles.detailsSegment} style={{ backgroundColor: eventColor(item) }} />
        </span>
      ))}
      {items.length > 3 && <span className={modeStyles.stackedMore}>+{items.length - 3}</span>}
    </span>
  )
}

export default function CalendarioMonthModeGrid({
  month,
  selectedDay,
  events,
  mode,
  onSelectDay,
}: {
  month: Date
  selectedDay: Date
  events: EventoCalendario[]
  mode: ModoVisualCalendario
  onSelectDay: (day: Date) => void
}) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start, end })

  return (
    <div className={`${modeStyles.modeGrid} ${mode === 'lista' ? modeStyles.listMonth : ''}`}>
      {days.map((day) => {
        const belongs = isSameMonth(day, month)
        const selected = belongs && isSameDay(day, selectedDay)
        const today = belongs && isToday(day)
        const items = belongs ? eventosDelDia(events, day) : []
        return (
          <button
            key={day.toISOString()}
            className={`${modeStyles.modeDay} ${!belongs ? modeStyles.modeDayOutside : ''}`}
            onClick={() => belongs && onSelectDay(day)}
            aria-pressed={belongs ? selected : undefined}
          >
            {belongs && (
              <>
                <span className={numberClass(today, selected)}>{format(day, 'd')}</span>
                <EventMarks items={items} mode={mode} />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
