import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react'
import NuevaSolicitudModal from '@/components/solicitudes/NuevaSolicitudModal'
import { BotonesAprobacion } from '@/components/solicitudes/BotonesAprobacion'
import BackButton from '@/components/navigation/BackButton'
import UserAvatar from '@/components/comunidad/UserAvatar'

export const metadata: Metadata = {
  title: 'Solicitudes',
  description: 'Gestiona solicitudes de recursos, espacios y presupuesto',
}

export const dynamic = 'force-dynamic'

const tipoLabel: Record<string, string> = {
  salon: '🏛️ Salón',
  equipo_sonido: '🎙️ Sonido',
  presupuesto: '💰 Presupuesto',
  otro: '📋 Otro',
}

const estadoConfig = {
  pendiente: {
    icon: Clock,
    label: 'Pendiente',
    card: 'border-l-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  aprobada: {
    icon: CheckCircle2,
    label: 'Aprobada',
    card: 'border-l-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  rechazada: {
    icon: XCircle,
    label: 'Rechazada',
    card: 'border-l-rose-400',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const rol = (profile as any)?.rol as string | undefined
  const esPastorAdmin = rol === 'pastor' || rol === 'administrador'

  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id, es_lider, ministerios (id, nombre)')
    .eq('profile_id', user.id)

  const ministeriosLider = (membresias || [])
    .filter((m: any) => m.es_lider)
    .map((m: any) => m.ministerio_id as string)

  const todosMinisterios = (membresias || []).map((m: any) => ({
    id: m.ministerios?.id ?? m.ministerio_id,
    nombre: m.ministerios?.nombre ?? 'Ministerio',
  }))

  let query = (supabase as any)
    .from('solicitudes')
    .select(`
      id,
      titulo,
      detalle,
      tipo,
      estado,
      ministerio_id,
      created_at,
      resuelto_at,
      solicitado_por,
      profiles!solicitado_por (nombre_completo, avatar_url),
      ministerios (nombre)
    `)
    .order('created_at', { ascending: false })

  if (!esPastorAdmin) {
    if (ministeriosLider.length > 0) {
      query = query.or(
        `solicitado_por.eq.${user.id},ministerio_id.in.(${ministeriosLider.join(',')})`,
      )
    } else {
      query = query.eq('solicitado_por', user.id)
    }
  }

  const { data: solicitudes, error: solError } = await query

  if (solError) {
    console.error('[SolicitudesPage]', solError)
  }

  const items = (solicitudes || []) as any[]
  const pendientes = items.filter((s) => s.estado === 'pendiente')
  const resueltas = items.filter((s) => s.estado !== 'pendiente')

  function puedeAprobar(sol: any) {
    if (esPastorAdmin) return true
    return ministeriosLider.includes(sol.ministerio_id)
  }

  function SolicitudCard({ sol }: { sol: any }) {
    const cfg = estadoConfig[sol.estado as keyof typeof estadoConfig] ?? estadoConfig.pendiente
    const StateIcon = cfg.icon
    const solicitante = (sol.profiles as any)?.nombre_completo ?? 'Usuario'
    const solicitanteAvatar = (sol.profiles as any)?.avatar_url ?? null
    const ministerioNombre = (sol.ministerios as any)?.nombre ?? 'Ministerio'
    const fecha = new Date(sol.created_at)

    return (
      <article className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-[0_4px_18px_rgba(20,24,40,0.07)]">
        <div className="flex gap-0">
          <div className={`w-1 shrink-0 ${cfg.card.replace('border-l-', 'bg-')}`} />
          <div className="min-w-0 flex-1 p-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold leading-snug text-[#171923]">
                  {sol.titulo}
                </h3>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.badge}`}>
                <StateIcon className="h-3 w-3" />
                {cfg.label}
              </span>
            </div>

            {sol.detalle && (
              <p className="mb-3 break-words text-sm leading-relaxed text-gray-500">
                {sol.detalle}
              </p>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-gray-400">
              <span className="font-medium text-gray-500">{tipoLabel[sol.tipo] ?? sol.tipo}</span>
              <span>·</span>
              <span className="font-semibold text-indigo-500">{ministerioNombre}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <UserAvatar nombre={solicitante} avatarUrl={solicitanteAvatar} size="xs" />
                <strong className="font-medium text-[#171923]">{solicitante}</strong>
              </span>
              <span>·</span>
              <time
                dateTime={fecha.toISOString()}
                title={format(fecha, "d 'de' MMMM yyyy, HH:mm", { locale: es })}
              >
                {formatDistanceToNow(fecha, { addSuffix: true, locale: es })}
              </time>
            </div>

            {sol.estado === 'pendiente' && puedeAprobar(sol) && (
              <BotonesAprobacion solicitudId={sol.id} />
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[#f4f5f9] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-8">
      <div className="mb-5">
        <BackButton />
      </div>

      <header className="mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#171923]">Solicitudes</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {items.length === 0
              ? 'Sin solicitudes por ahora'
              : `${items.length} solicitud${items.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {todosMinisterios.length > 0 && (
          <NuevaSolicitudModal ministerios={todosMinisterios} />
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <FileText className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="max-w-[240px] text-sm text-gray-500">
            No hay solicitudes para mostrar. Crea una nueva con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pendientes.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#171923]">
                  Pendientes ({pendientes.length})
                </h2>
              </div>
              <div className="space-y-3">
                {pendientes.map((sol) => (
                  <SolicitudCard key={sol.id} sol={sol} />
                ))}
              </div>
            </section>
          )}

          {resueltas.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">
                  Historial ({resueltas.length})
                </h2>
              </div>
              <div className="space-y-3">
                {resueltas.map((sol) => (
                  <SolicitudCard key={sol.id} sol={sol} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  )
}
