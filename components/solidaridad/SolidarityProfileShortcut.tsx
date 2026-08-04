'use client'

import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'

export default function SolidarityProfileShortcut() {
  return (
    <Link
      href="/ayuda-solidaria"
      className="flex min-h-20 items-center justify-between gap-4 rounded-[22px] border border-violet-100 bg-white p-5 shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600">
          <HeartHandshake className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-extrabold text-[#171923]">Ayuda Solidaria</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Solicita una bolsa alimenticia o registra una donación o siembra.</p>
        </div>
      </div>
      <span className="shrink-0 text-2xl text-violet-300" aria-hidden="true">›</span>
    </Link>
  )
}
