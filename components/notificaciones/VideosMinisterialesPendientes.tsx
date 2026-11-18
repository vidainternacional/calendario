'use client'

import Link from 'next/link'
import { PlayCircle } from 'lucide-react'
import { useVideosMinisteriales } from './useVideosMinisteriales'

export default function VideosMinisterialesPendientes() {
  const { pendientes } = useVideosMinisteriales()
  const primero = pendientes[0]
  if (!primero) return null
  return <section aria-label="Videos ministeriales nuevos" className="mb-5 border-y border-slate-200 py-4 text-slate-900">
    <Link href={`/estudios/mensajes/${primero.id}`} className="flex min-h-12 items-start gap-3">
      <span className="relative mt-1 text-[#C0392B]"><PlayCircle className="h-6 w-6" aria-hidden="true" /><span aria-label={`${pendientes.length} videos nuevos`} className="absolute -right-2 -top-2 min-w-4 rounded-full bg-[#C0392B] px-1 text-center text-[10px] font-bold text-white">{pendientes.length}</span></span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-wide text-[#C0392B]">Nuevo video ministerial</span><span className="mt-1 block break-words text-sm font-semibold">{primero.titulo}</span><span className="mt-1 block text-xs text-slate-500">Abrir video</span></span>
    </Link>
    {pendientes.length > 1 ? <details className="mt-2 pl-9 text-sm"><summary className="cursor-pointer py-2 font-semibold text-slate-600">Otros videos nuevos ({pendientes.length - 1})</summary><div className="divide-y divide-slate-200">{pendientes.slice(1).map((v) => <Link key={v.id} href={`/estudios/mensajes/${v.id}`} className="block min-h-11 break-words py-3 text-sm text-slate-700">{v.titulo}</Link>)}</div></details> : null}
  </section>
}
