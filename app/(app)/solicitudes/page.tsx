import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react'
import NuevaSolicitudModal from '@/components/solicitudes/NuevaSolicitudModal'
import { BotonesAprobacion } from '@/components/solicitudes/BotonesAprobacion'

export const metadata: Metadata = {
  title: 'Solicitudes',
  description: 'Gestiona solicitudes de recursos, espacios y presupuesto',
}

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

  // ── 1. Rol y ministerios ──────────────────────────────────────────────────
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

  const ministerioIds = (membresias || []).map((m: any) => m.ministerio_id)
  const ministeriosLider = (membresias || [])
    .filter((m: any) => m.es_lider)
    .map((m: any) => m.ministerio_id as string)

  // Todos los ministerios del usuario para el form (puede solicitar en cualquiera en el que esté)
  const todosMinisterios = (membresias || []).map((m: any) => ({
    id: m.ministerios?.id ?? m.ministerio_id,
    nombre: m.ministerios?.nombre ?? 'Ministerio',
  }))

  // ── 2. Solicitudes visibles ───────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      profiles!solicitado_por (nombre_completo),
      ministerios (nombre)
    `)
    .order('created_at', { ascending: false })

  if (!esPastorAdmin) {
    if (ministerioIds.length > 0) {
      // Ve: las suyas propias + las de ministerios donde es líder
      query = query.or(
        `solicitado_por.eq.${user.id},ministerio_id.in.(${ministeriosLider.join(',')})`
      )
    } else {
      // Sin ministerios: solo las suyas
      query = query.eq('solicitado_por', user.id)
    }
  }
  // Pastor/admin: ve todas sin filtro

  const { data: solicitudes, error: solError } = await query

  if (solError) {
    console.error('[SolicitudesPage]', solError)
  }

  const items = (solicitudes || []) as any[]

  // ── 3. Separar por estado para agrupar visualmente ────────────────────────
  const pendientes = items.filter((s) => s.estado === 'pendiente')
  const resueltas = items.filter((s) => s.estado !== 'pendiente')

  // Helper: ¿puede aprobar esta solicitud?
  function puedeAprobar(sol: any) {
    if (esPastorAdmin) return true
    return ministeriosLider.includes(sol.ministerio_id)
  }

  function SolicitudCard({ sol }: { sol: any }) {
    const cfg = estadoConfig[sol.estado as keyof typeof estadoConfig] ?? estadoConfig.pendiente
    const StateIcon = cfg.icon
    const solicitante = (sol.profiles as any)?.nombre_completo ?? 'Usuario'
    const ministerioNombre = (sol.ministerios as any)?.nombre ?? 'Ministerio'
    const fecha = new Date(sol.created_at)
    const esMia = sol.profiles && solicitante === user?.email // fallback

    return (
      <article className="bg-white border border-slate-100 rounded-[20px] shadow-[0_4px_18px_rgba(20,24,40,0.07)] overflow-hidden">
        {/* Barra de color lateral */}
        <div className={`flex gap-0`}>
          <div className={`w-1 shrink-0 ${cfg.card.replace('border-l-', 'bg-')}`} />
          <div className="flex-1 p-5">
            {/* Header card */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#171923] text-sm leading-snug">
                  {sol.titulo}
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1 shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                <StateIcon className="w-3 h-3" />
                {cfg.label}
              </span>
            </div>

            {/* Detalle */}
            <p className="text-sm text-gray-500 leading-relaxed mb-3">
              {sol.detalle}
            </p>

            {/* Meta: tipo, ministerio, solicitante, fecha */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 mb-3">
              <span className="font-medium text-gray-500">{tipoLabel[sol.tipo] ?? sol.tipo}</span>
              <span>·</span>
              <span className="font-semibold text-indigo-500">{ministerioNombre}</span>
              <span>·</span>
              <span>Por <strong className="text-[#171923] font-medium">{solicitante}</strong></span>
              <span>·</span>
              <time
                dateTime={fecha.toISOString()}
                title={format(fecha, "d 'de' MMMM yyyy, HH:mm", { locale: es })}
              >
                {formatDistanceToNow(fecha, { addSuffix: true, locale: es })}
              </time>
            </div>

            {/* Botones aprobar/rechazar para pendientes */}
            {sol.estado === 'pendiente' && puedeAprobar(sol) && (
              <BotonesAprobacion solicitudId={sol.id} />
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto pb-28">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171923]">Solicitudes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length === 0
              ? 'Sin solicitudes por ahora'
              : `${items.length} solicitud${items.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {/* Cualquier usuario puede crear solicitudes si tiene al menos un ministerio */}
        {todosMinisterios.length > 0 && (
          <NuevaSolicitudModal ministerios={todosMinisterios} />
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
            <FileText className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-sm text-gray-500 max-w-[240px]">
            No hay solicitudes para mostrar. Crea una nueva con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Pendientes ──────────────────────────────────────────────── */}
          {pendientes.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-[#171923] uppercase tracking-wide">
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

          {/* ── Resueltas ───────────────────────────────────────────────── */}
          {resueltas.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
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
