'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChartNoAxesCombined, HeartHandshake } from 'lucide-react'

export default function AdminPilotAnalyticsShortcut() {
  const pathname = usePathname()
  const showAnalysis = pathname !== '/admin/analisis'
  const showSolidarity = pathname !== '/admin/ayuda-solidaria'

  if (!showAnalysis && !showSolidarity) return null

  return (
    <div className="fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[75] inline-flex overflow-hidden rounded-full bg-slate-950/92 text-white shadow-lg backdrop-blur-md">
      {showAnalysis && (
        <Link href="/admin/analisis" className="inline-flex min-h-11 items-center gap-2 px-4 text-xs font-bold active:bg-white/10">
          <ChartNoAxesCombined className="h-4 w-4" />
          <span className="hidden sm:inline">Análisis</span>
        </Link>
      )}
      {showAnalysis && showSolidarity && <span className="my-2 w-px bg-white/15" />}
      {showSolidarity && (
        <Link href="/admin/ayuda-solidaria" className="inline-flex min-h-11 items-center gap-2 px-4 text-xs font-bold active:bg-white/10">
          <HeartHandshake className="h-4 w-4" />
          <span className="hidden sm:inline">Solidaridad</span>
        </Link>
      )}
    </div>
  )
}
