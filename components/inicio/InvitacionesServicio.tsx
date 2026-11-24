'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerInvitacionesServicio } from '@/app/actions/sedes-eventos'
export default function InvitacionesServicio({ userId }: { userId: string }) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof obtenerInvitacionesServicio>> | null>(null)
  useEffect(() => { let active = true;void obtenerInvitacionesServicio(userId).then(r => { if (active) setResult(r) });return () => { active = false } }, [userId])
  if (!result?.invitaciones?.length) return null
  return <section className="mb-5 border-b border-slate-200 pb-4"><h2 className="text-sm font-semibold text-slate-800">Servicios compartidos contigo</h2>{result.invitaciones.map(i => <Link key={`${i.evento_id}-${i.ministerio_id}`} href={`/servicio-compartido/${i.evento_id}?ministerio=${i.ministerio_id}`} className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm font-semibold text-rose-800"><span>{i.eventos.titulo}</span><span aria-hidden="true">›</span></Link>)}</section>
}
