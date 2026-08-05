'use client'

import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'

export default function SolidarityProfileShortcut() {
  return (
    <div className="flex justify-center py-1">
      <Link href="/ayuda-solidaria" className="group flex w-24 flex-col items-center gap-2 text-center active:scale-95">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-100 transition group-active:bg-rose-100">
          <HeartHandshake className="h-8 w-8" />
        </span>
        <span className="text-xs font-extrabold leading-tight text-[#171923]">Ayuda Solidaria</span>
      </Link>
    </div>
  )
}
