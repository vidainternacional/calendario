import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SolicitarIngresoBoton from '@/components/ministerios/SolicitarIngresoBoton'

export const metadata: Metadata = {
  title: 'Ministerios',
}

export default async function MinisteriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: ministeriosActivos } = await supabase
    .from('ministerios')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })

  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id, es_lider')
    .eq('profile_id', user.id)

  const membresiaMap = new Map((membresias as any[])?.map(m => [m.ministerio_id, m]))

  const { data: solicitudes } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .select('ministerio_id, estado')
    .eq('profile_id', user.id)
    .in('estado', ['pendiente', 'rechazada'])

  const solicitudMap = new Map(solicitudes?.map((s: any) => [s.ministerio_id, s.estado]))
  const allMinisterios = ministeriosActivos || []

  return (
    <main className="mx-auto min-h-screen max-w-3xl overflow-x-hidden bg-[#f4f5f9] px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+7rem)] sm:px-6">
      <header className="mb-6 min-w-0 sm:mb-8">
        <h1 className="break-words text-2xl font-bold text-[#171923] sm:text-3xl">Ministerios</h1>
        <p className="mt-1 max-w-2xl break-words text-sm text-gray-500 sm:text-base">
          Descubre e intégrate a los ministerios de la iglesia
        </p>
      </header>

      {allMinisterios.length === 0 ? (
        <div className="rounded-[20px] border border-slate-100 bg-white px-4 py-12 text-center shadow-sm">
          <p className="break-words text-gray-500">No hay ministerios activos actualmente.</p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {allMinisterios.map((min: any) => {
            const mem = membresiaMap.get(min.id) as any
            const esMiembro = !!mem
            const esLider = mem?.es_lider
            const estadoSolicitud = solicitudMap.get(min.id) as 'pendiente' | 'rechazada' | undefined

            const CardContent = (
              <>
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ backgroundColor: min.color_primario || '#6366f1' }}
                />

                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 text-2xl shadow-inner sm:h-14 sm:w-14"
                    style={{ backgroundColor: `${min.color_primario || '#6366f1'}12` }}
                  >
                    {min.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-col items-start gap-2 min-[380px]:flex-row min-[380px]:justify-between">
                      <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-[#171923] sm:text-xl">
                        {min.nombre}
                      </h2>
                      {esLider && (
                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                          Líder
                        </span>
                      )}
                      {esMiembro && !esLider && (
                        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          Miembro
                        </span>
                      )}
                    </div>

                    {min.descripcion ? (
                      <p className="mt-1.5 line-clamp-2 break-words text-sm leading-relaxed text-gray-500">
                        {min.descripcion}
                      </p>
                    ) : (
                      <p className="mt-1.5 break-words text-sm text-gray-400">Conoce y sirve junto a este ministerio.</p>
                    )}

                    {!esMiembro && (
                      <div className="mt-4 min-w-0">
                        <SolicitarIngresoBoton ministerioId={min.id} estadoActual={estadoSolicitud || 'ninguno'} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )

            const baseClasses = 'group relative min-h-[132px] min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(20,24,40,0.06)] transition-all sm:p-5'

            if (esMiembro) {
              return (
                <Link
                  key={min.id}
                  href={`/ministerios/${min.id}/avisos`}
                  className={`${baseClasses} hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(20,24,40,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                >
                  {CardContent}
                </Link>
              )
            }

            return (
              <div key={min.id} className={baseClasses}>
                {CardContent}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
