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
    <main className="min-h-screen bg-[#f4f5f9] px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+7rem)] sm:px-6 max-w-3xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#171923]">Ministerios</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1 max-w-2xl">
          Descubre e intégrate a los ministerios de la iglesia
        </p>
      </header>

      {allMinisterios.length === 0 ? (
        <div className="text-center py-12 px-4 border border-slate-100 rounded-[20px] bg-white shadow-sm">
          <p className="text-gray-500">No hay ministerios activos actualmente.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center text-2xl border border-slate-100 shadow-inner"
                    style={{ backgroundColor: `${min.color_primario || '#6366f1'}12` }}
                  >
                    {min.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-[#171923] leading-tight break-words min-w-0">
                        {min.nombre}
                      </h2>
                      {esLider && (
                        <span className="shrink-0 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          Líder
                        </span>
                      )}
                      {esMiembro && !esLider && (
                        <span className="shrink-0 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Miembro
                        </span>
                      )}
                    </div>

                    {min.descripcion ? (
                      <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                        {min.descripcion}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1.5">Conoce y sirve junto a este ministerio.</p>
                    )}

                    {!esMiembro && (
                      <div className="mt-4">
                        <SolicitarIngresoBoton ministerioId={min.id} estadoActual={estadoSolicitud || 'ninguno'} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )

            const baseClasses = 'group relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_6px_20px_rgba(20,24,40,0.06)] transition-all min-h-[132px]'

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
