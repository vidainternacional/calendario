import { createClient } from '@/lib/supabase/server'
import { Building2, User } from 'lucide-react'
import SolicitudIngresoBotones from '@/app/(app)/ministerios/[id]/solicitudes-ingreso/SolicitudIngresoBotones'
import BackButton from '@/components/navigation/BackButton'

export default async function SolicitudesMinisteriosAdminPage() {
  const supabase = await createClient()

  const { data: solicitudes, error } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .select('id, profile_id, ministerio_id, created_at')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  if (error) console.error('[Admin] Error solicitudes de ministerios:', error)

  const solicitudesBase = solicitudes || []
  const profileIds = [...new Set(solicitudesBase.map((item: any) => item.profile_id).filter(Boolean))]
  const ministerioIds = [...new Set(solicitudesBase.map((item: any) => item.ministerio_id).filter(Boolean))]

  const [profilesReq, ministeriosReq] = await Promise.all([
    profileIds.length > 0
      ? supabase.from('profiles').select('id, nombre_completo, telefono, email').in('id', profileIds)
      : Promise.resolve({ data: [], error: null }),
    ministerioIds.length > 0
      ? supabase.from('ministerios').select('id, nombre, color_primario, emoji').in('id', ministerioIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (profilesReq.error) console.error('[Admin] Error perfiles de solicitudes:', profilesReq.error)
  if (ministeriosReq.error) console.error('[Admin] Error ministerios de solicitudes:', ministeriosReq.error)

  const profilesMap = new Map((profilesReq.data || []).map((profile: any) => [profile.id, profile]))
  const ministeriosMap = new Map((ministeriosReq.data || []).map((ministerio: any) => [ministerio.id, ministerio]))
  const items = solicitudesBase.map((solicitud: any) => ({ ...solicitud, profiles: profilesMap.get(solicitud.profile_id) || null, ministerios: ministeriosMap.get(solicitud.ministerio_id) || null }))

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl overflow-x-hidden bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(4.75rem+env(safe-area-inset-top))] sm:px-6 sm:pt-12">
      <div className="mb-7"><BackButton /></div>

      <header className="mb-6 sm:mb-8">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Accesos</p>
        <h1 className="break-words text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">Solicitudes de ministerios</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">Aprueba o rechaza solicitudes de ingreso de todos los ministerios desde un solo lugar.</p>
      </header>

      {items.length === 0 ? (
        <section className="rounded-[20px] border border-slate-100 bg-white px-4 py-12 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-600">No hay solicitudes pendientes</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">Las nuevas solicitudes aparecerán automáticamente en esta sección.</p>
        </section>
      ) : (
        <section className="grid gap-3 sm:gap-4" aria-label="Solicitudes pendientes">
          {items.map((solicitud: any) => {
            const persona = solicitud.profiles
            const ministerio = solicitud.ministerios
            return (
              <article key={solicitud.id} className="min-w-0 overflow-hidden rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100"><User className="h-5 w-5 text-slate-400" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-sm font-bold text-[#171923] sm:text-base">{persona?.nombre_completo || 'Usuario sin nombre'}</h2>
                    {persona?.email && <p className="mt-0.5 break-all text-xs text-slate-500">{persona.email}</p>}
                    {persona?.telefono && <p className="mt-0.5 break-words text-xs text-slate-500">{persona.telefono}</p>}
                  </div>
                </div>
                <div className="mb-4 flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-xl" aria-hidden="true">{ministerio?.emoji || '🤝'}</span>
                  <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Ministerio</p><p className="truncate text-sm font-semibold text-slate-700">{ministerio?.nombre || 'Ministerio'}</p></div>
                </div>
                <SolicitudIngresoBotones solicitudId={solicitud.id} ministerioId={solicitud.ministerio_id} />
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
