import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

type EmptyStateAction = {
  label: string
  href?: string
  onClick?: () => void
}

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
  compact?: boolean
  className?: string
}

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ')
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const actionClassName =
    'inline-flex min-h-11 items-center justify-center rounded-xl bg-[#171923] px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'

  return (
    <section
      role="status"
      aria-live="polite"
      className={classes(
        'flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-center shadow-sm',
        compact ? 'min-h-48 px-5 py-8' : 'min-h-72 px-6 py-10',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>

      {action?.href ? (
        <Link href={action.href} className={classes(actionClassName, 'mt-6')}>
          {action.label}
        </Link>
      ) : action?.onClick ? (
        <button
          type="button"
          onClick={action.onClick}
          className={classes(actionClassName, 'mt-6')}
        >
          {action.label}
        </button>
      ) : null}
    </section>
  )
}
