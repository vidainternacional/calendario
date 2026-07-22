import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { PlusCircle, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { AprobacionBotones } from './AprobacionBotones'

export const metadata: Metadata = {
  title: 'Solicitudes',
}

export default async function SolicitudesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: membresia } = await supabase
    .from('ministerio_miembros')
    .select('es_lider')
    .eq('ministerio_id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  let esPastor = false
  if (!(membresia as any)?.es_lider) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    esPastor = (profile as any)?.rol === 'pastor' || (profile as any)?.rol === 'administrador'
  }

  const puedeAprobar = (membresia as any)?.es_lider || esPastor

  const { data: solicitudes } = await supabase
    .from('solicitudes')
    .select(`
      id,
      titulo,
      detalle,
      estado,
      tipo,
      created_at,
      profiles!solicitado_por (
        nombre_completo
      )
    `)
    .eq('ministerio_id', id)
    .order('created_at', { ascending: false })

  const estadoConfig = {
    pendiente: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    aprobada: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    rechazada: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  }

  return (
    <div className="space-y-5 px-4 pb-28 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[#171923]">Solicitudes</h2>
        <Link
          href={`/ministerios/${id}/solicitudes/nueva`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          Nueva solicitud
        </Link>
      </div>

      {!solicitudes || solicitudes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm leading-relaxed text-slate-500">No hay solicitudes en este ministerio.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((sol: any) => {
            const config = estadoConfig[sol.estado as keyof typeof estadoConfig] ?? estadoConfig.pendiente
            const StateIcon = config.icon

            return (
              <article
                key={sol.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <h3 className="break-words text-base font-semibold text-[#171923] sm:text-lg">{sol.titulo}</h3>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color} ${config.border}`}>
                        <StateIcon className="h-3 w-3" />
                        {sol.estado.charAt(0).toUpperCase() + sol.estado.slice(1)}
                      </span>
                    </div>

                    <p className="break-words text-sm leading-relaxed text-slate-700">{sol.detalle}</p>

                    <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                      <span className="break-words font-medium">Por: {sol.profiles?.nombre_completo || 'Usuario'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="uppercase">{sol.tipo.replace('_', ' ')}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatDistanceToNow(new Date(sol.created_at), { addSuffix: true, locale: es })}</span>
                    </div>
                  </div>

                  {sol.estado === 'pendiente' && puedeAprobar && (
                    <div className="flex w-full shrink-0 border-t border-slate-100 pt-4 sm:w-auto sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      <AprobacionBotones solicitudId={sol.id} path={`/ministerios/${id}/solicitudes`} />
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
