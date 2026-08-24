import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type PastoralPageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  icon?: LucideIcon
  backHref?: string
  backLabel?: string
  action?: ReactNode
}

export default function PastoralPageHeader({
  eyebrow,
  title,
  icon: Icon,
  backHref = '/pastoral',
  backLabel = 'Centro Pastoral',
  action,
}: PastoralPageHeaderProps) {
  return (
    <header className="mb-5 border-b border-slate-200 pb-4">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex min-h-11 items-center gap-2 text-[12px] font-bold text-slate-500 transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600">
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            <span>{eyebrow}</span>
          </div>
          <h1 className="mt-1 text-[1.65rem] font-black leading-tight tracking-[-0.035em] text-slate-950">{title}</h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
