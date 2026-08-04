'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { actualizarEstadoReportePiloto } from '@/app/actions/piloto'
import type { PilotIssueStatus } from '@/lib/pilot/types'
import { mostrarToast } from '@/lib/ui/toast'

export default function PilotIssueStatusControls({
  reportId,
  status,
}: {
  reportId: string
  status: PilotIssueStatus
}) {
  const [pending, startTransition] = useTransition()

  const update = (next: PilotIssueStatus) => {
    startTransition(async () => {
      const result = await actualizarEstadoReportePiloto(reportId, next)
      mostrarToast(result.error || 'Estado actualizado.', result.success ? 'ok' : 'error')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      {(['nuevo', 'revisando', 'resuelto'] as PilotIssueStatus[]).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => update(item)}
          disabled={pending || item === status}
          className={`min-h-9 rounded-full px-3 text-[11px] font-bold capitalize disabled:cursor-default ${
            item === status
              ? item === 'resuelto'
                ? 'bg-emerald-100 text-emerald-700'
                : item === 'revisando'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
