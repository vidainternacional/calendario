import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Building2, User } from 'lucide-react'
import SolicitudIngresoBotones from '@/app/(app)/ministerios/[id]/solicitudes-ingreso/SolicitudIngresoBotones'

export default async function SolicitudesMinisteriosAdminPage() {
  const supabase = await createClient()

  const { data: solicitudes, error } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .select(`
      id,
      profile_id,
      ministerio_id,
      created_at,
      profiles:profile_id (
        nombre_completo,
        telefono,
        email
      ),
      ministerios:ministerio_id (
        nombre,
        color_primario,
        emoji
      )
    `)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  if (error) console.error('[Admin] Error solicitudes de ministerios:', error)

  const items = solicitudes || []

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl overflow-x-hidden bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link
        href="/admin"
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-white hover:text-[#171923]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a administración
      </Link>

      <header className="mb-6 sm:mb-8">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Accesos</p>
        <h1 className="break-words text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">
          Solicitudes de ministerios
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Aprueba o rechaza solicitudes de ingreso de todos los ministerios desde un solo lugar.
        </p>
      </header>

      {items.length === 0 ? (
        <section className="rounded-[20px] border border-slate-100 bg-white px-4 py-12 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-600">No hay solicitudes pendientes</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Las nuevas solicitudes aparecerán automáticamente en esta sección.
          </p>
        </section>
      ) : (
        <section className="grid gap-3 sm:gap-4" aria-label="Solicitudes pendientes">
          {items.map((solicitud: any) => {
            const persona = solicitud.profiles
            const ministerio = solicitud.ministerios

            return (
              <article
                key={solicitud.id}
                className="min-w-0 overflow-hidden rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="mb-4 flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <User className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-sm font-bold text-[#171923] sm:text-base">
                      {persona?.nombre_completo || 'Usuario sin nombre'}
                    </h2>
                    {persona?.email && <p className="mt-0.5 break-all text-xs text-slate-500">{persona.email}</p>}
                    {persona?.telefono && <p className="mt-0.5 break-words text-xs text-slate-500">{persona.telefono}</p>}
                  </div>
                </div>

                <div className="mb-4 flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: `${ministerio?.color_primario || '#6366f1'}15` }}
                    aria-hidden="true"
                  >
                    {ministerio?.emoji || '⛪'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ministerio solicitado</p>
                    <p className="break-words text-sm font-semibold text-[#171923]">
                      {ministerio?.nombre || 'Ministerio'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {new Date(solicitud.created_at).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <SolicitudIngresoBotones
                  solicitudId={solicitud.id}
                  profileId={solicitud.profile_id}
                  ministerioId={solicitud.ministerio_id}
                />
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
