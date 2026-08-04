'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChartNoAxesCombined } from 'lucide-react'

export default function AdminPilotAnalyticsShortcut() {
  const pathname = usePathname()
  if (pathname === '/admin/analisis') return null

  return (
    <Link
      href="/admin/analisis"
      className="fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[75] inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950/92 px-4 text-xs font-bold text-white shadow-lg backdrop-blur-md active:scale-95"
    >
      <ChartNoAxesCombined className="h-4 w-4" />
      Análisis
    </Link>
  )
}
