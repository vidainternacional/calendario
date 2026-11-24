import Link from 'next/link'
import { notFound } from 'next/navigation'
import { obtenerServicioCompartido } from '@/app/actions/sedes-eventos'
import MusicianSetlistClient from '@/components/ministerios/MusicianSetlistClient'
export default async function ServicioCompartidoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ministerio?: string }> }) {
  const { id } = await params, { ministerio } = await searchParams
  if (!ministerio) notFound()
  const data = await obtenerServicioCompartido(id, ministerio)
  if (!data) notFound()
  return <main className="mx-auto max-w-3xl px-4 pb-28 pt-14 text-slate-900"><Link href="/inicio" className="inline-flex min-h-11 items-center text-sm font-semibold">← Inicio</Link><h1 className="mt-3 text-xl font-bold">{data.evento.titulo}</h1><p className="my-3 text-sm text-slate-500">{new Date(data.evento.fecha).toLocaleString('es-SV', { timeZone: 'America/El_Salvador' })}{data.evento.ubicacion ? ` · ${data.evento.ubicacion}` : ''}</p><MusicianSetlistClient ministerioId={ministerio} eventoId={id} songs={data.canciones} canEditOfficial={false} /></main>
}
