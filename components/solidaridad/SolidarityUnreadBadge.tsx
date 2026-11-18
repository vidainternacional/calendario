'use client'

import { usePendingIndicators } from '@/components/notificaciones/usePendingIndicators'

export const SOLIDARITY_READ_EVENT = 'vida:solidarity-read'

type Scope = 'all' | 'solicitud' | 'aporte' | 'context'
type ContextType = 'solicitud' | 'aporte'

export default function SolidarityUnreadBadge({
  scope = 'all',
  contextType,
  contextId,
  className = '',
}: {
  scope?: Scope
  contextType?: ContextType
  contextId?: string
  className?: string
}) {
  const { mensajesSolidarios } = usePendingIndicators()
  const count = mensajesSolidarios.reduce((total, row) => {
    const coincide = scope === 'all' || (scope === 'solicitud' && row.contexto === 'solicitud')
      || (scope === 'aporte' && row.contexto === 'aporte')
      || (scope === 'context' && row.contexto === contextType && row.contexto_id === contextId)
    const n = Number(row.no_leidos)
    return total + (coincide && Number.isFinite(n) ? Math.max(0, n) : 0)
  }, 0)

  if (count <= 0) return null

  return (
    <span
      aria-label={`${count} ${count === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}`}
      title={`${count} ${count === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}`}
      className={`inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold leading-none text-white shadow-sm ring-2 ring-white ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
