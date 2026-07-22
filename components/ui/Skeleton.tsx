import type { HTMLAttributes, ReactNode } from 'react'

type SkeletonProps = HTMLAttributes<HTMLDivElement>

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ')
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={classes(
        'rounded-xl bg-slate-200/80 motion-safe:animate-pulse',
        className,
      )}
      {...props}
    />
  )
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div aria-hidden="true" className={classes('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={classes(
            'h-3.5',
            index === lines - 1 ? 'w-2/3' : 'w-full',
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  return <Skeleton className={classes('shrink-0 rounded-full', sizes[size])} />
}

export function SkeletonCard({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={classes(
        'rounded-2xl border border-slate-100 bg-white shadow-sm',
        compact ? 'p-4' : 'p-5',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <SkeletonAvatar size={compact ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <SkeletonText lines={compact ? 2 : 3} className="mt-4" />
    </div>
  )
}

export function SkeletonList({
  count = 4,
  compact = false,
  className,
}: {
  count?: number
  compact?: boolean
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando contenido"
      className={classes('space-y-3', className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} compact={compact} />
      ))}
      <span className="sr-only">Cargando contenido…</span>
    </div>
  )
}

export function SkeletonPage({
  children,
  cards = 4,
}: {
  children?: ReactNode
  cards?: number
}) {
  return (
    <main className="mx-auto w-full max-w-3xl pb-28">
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando página"
        className="space-y-6"
      >
        <header className="space-y-3">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </header>

        {children ?? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <Skeleton className="mt-4 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              ))}
            </div>
            <SkeletonList count={cards} />
          </>
        )}

        <span className="sr-only">Cargando página…</span>
      </div>
    </main>
  )
}
