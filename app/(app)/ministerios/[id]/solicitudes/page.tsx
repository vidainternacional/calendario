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

  // Verificar si es líder/pastor para mostrar botones de aprobar/rechazar
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

  // Obtener solicitudes
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
    pendiente: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    aprobada: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    rechazada: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#171923]">Solicitudes</h2>
        {/* Cualquier miembro puede crear */}
        <Link
          href={`/ministerios/${id}/solicitudes/nueva`}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva solicitud
        </Link>
      </div>

      {!solicitudes || solicitudes.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-slate-100 rounded-[18px]">
          <FileText className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500">No hay solicitudes en este ministerio.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((sol: any) => {
            const config = estadoConfig[sol.estado as keyof typeof estadoConfig]
            const StateIcon = config.icon
            
            return (
              <article 
                key={sol.id} 
                className="bg-white border border-slate-100 rounded-[18px] p-5 shadow-lg flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#171923]">{sol.titulo}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
                      <StateIcon className="w-3 h-3" />
                      {sol.estado.charAt(0).toUpperCase() + sol.estado.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-[#171923] text-sm mb-4">
                    {sol.detalle}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium text-gray-500">
                      Por: {sol.profiles?.nombre_completo || 'Usuario'}
                    </span>
                    <span>•</span>
                    <span className="uppercase">{sol.tipo.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(sol.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>

                {/* Si está pendiente y el usuario puede aprobar, mostramos los botones */}
                {sol.estado === 'pendiente' && puedeAprobar && (
                  <div className="sm:border-l border-slate-100 sm:pl-4 pt-4 sm:pt-0 flex flex-row sm:flex-col gap-2 justify-center shrink-0">
                    <AprobacionBotones solicitudId={sol.id} path={`/ministerios/${id}/solicitudes`} />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
