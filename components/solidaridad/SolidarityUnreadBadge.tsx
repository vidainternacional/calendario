'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const SOLIDARITY_READ_EVENT = 'vida:solidarity-read'

type Scope = 'all' | 'solicitud' | 'aporte' | 'context'
type ContextType = 'solicitud' | 'aporte'

type UnreadRow = {
  contexto: ContextType
  contexto_id: string
  no_leidos: number | string
}

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
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await (supabase as any).rpc('ayuda_solidaria_no_leidos')
      if (error) throw error
      const rows = (data || []) as UnreadRow[]
      const next = rows.reduce((total, row) => {
        const rowCount = Number(row.no_leidos || 0)
        if (scope === 'all') return total + rowCount
        if (scope === 'solicitud' && row.contexto === 'solicitud') return total + rowCount
        if (scope === 'aporte' && row.contexto === 'aporte') return total + rowCount
        if (scope === 'context' && row.contexto === contextType && row.contexto_id === contextId) return total + rowCount
        return total
      }, 0)
      setCount(next)
    } catch (error) {
      console.error('[solidarity-unread] cargar', error)
      setCount(0)
    }
  }, [scope, contextType, contextId])

  useEffect(() => {
    void refresh()
    const onRefresh = () => void refresh()
    window.addEventListener(SOLIDARITY_READ_EVENT, onRefresh)
    window.addEventListener('focus', onRefresh)
    return () => {
      window.removeEventListener(SOLIDARITY_READ_EVENT, onRefresh)
      window.removeEventListener('focus', onRefresh)
    }
  }, [refresh])

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
