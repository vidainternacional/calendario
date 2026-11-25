import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HandHeart, UsersRound } from 'lucide-react'
import SolicitarIngresoBoton from '@/components/ministerios/SolicitarIngresoBoton'
import { EmptyState } from '@/components/ui/EmptyState'
import BackButton from '@/components/navigation/BackButton'

export const metadata: Metadata = {
  title: 'Ministerios',
}

export default async function MinisteriosPage({ searchParams }: { searchParams: Promise<{ sede?: string }> }) {
  const { sede: filtroSede } = await searchParams
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

  const { data: accesibles } = await (supabase as unknown as SupabaseClient).rpc('vida_ministerios_accesibles')
  const ministeriosAccesibles = new Set<string>((accesibles || []).map((m: { id: string }) => m.id))

  const membresiaMap = new Map((membresias as any[])?.map(m => [m.ministerio_id, m]))

  const { data: solicitudes } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .select('ministerio_id, estado')
    .eq('profile_id', user.id)
    .in('estado', ['pendiente', 'rechazada'])

  const solicitudMap = new Map(solicitudes?.map((s: any) => [s.ministerio_id, s.estado]))
  const { data: mapaSedes } = await (supabase as unknown as SupabaseClient).from('vida_ministerio_sedes').select('ministerio_id,sede_id,vida_sedes(nombre)')
  const { data: sedes } = await (supabase as unknown as SupabaseClient).from('vida_sedes').select('id,nombre').eq('activa', true).order('central', { ascending: false })
  const sedePorMinisterio = new Map<string, { sede_id: string; nombre: string }>((mapaSedes || []).map((r: { ministerio_id: string; sede_id: string; vida_sedes: { nombre: string } | { nombre: string }[] }) => [r.ministerio_id, { sede_id: r.sede_id, nombre: (Array.isArray(r.vida_sedes) ? r.vida_sedes[0]?.nombre : r.vida_sedes?.nombre) || 'Sede' }]))
  const sedeValida = (sedes || []).some((s: { id: string }) => s.id === filtroSede) ? filtroSede : null
  const allMinisterios = ((ministeriosActivos || []) as { id: string; nombre: string; emoji: string; descripcion: string | null; color_primario: string }[]).filter(m => !sedeValida || sedePorMinisterio.get(m.id)?.sede_id === sedeValida)
  const sinMembresias = !membresias || membresias.length === 0

  return (
    <main className="mx-auto min-h-screen max-w-3xl overflow-x-hidden bg-[#f4f5f9] px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+7rem)] sm:px-6">
      <div className="mb-5">
        <BackButton />
      </div>

      <header className="mb-6 min-w-0 sm:mb-8">
        <h1 className="break-words text-2xl font-bold text-[#171923] sm:text-3xl">Ministerios</h1>
        <p className="mt-1 max-w-2xl break-words text-sm text-gray-500 sm:text-base">
          Descubre e intégrate a los ministerios de la iglesia
        </p>
      </header>

      <nav aria-label="Filtrar ministerios por sede" className="mb-5 flex flex-wrap gap-2"><Link href="/ministerios" aria-current={!sedeValida ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700">Todas</Link>{(sedes || []).map((s: { id: string; nombre: string }) => <Link key={s.id} href={`/ministerios?sede=${s.id}`} aria-current={sedeValida === s.id ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${sedeValida === s.id ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-700'}`}>{s.nombre}</Link>)}</nav>
      {allMinisterios.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No hay ministerios disponibles"
          description="Cuando se habiliten ministerios activos, aparecerán aquí para que puedas conocerlos e integrarte."
          compact
          className="bg-white"
        />
      ) : (
        <>
          {sinMembresias && (
            <section className="mb-5 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-indigo-950 shadow-sm sm:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <HandHeart className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold">Encuentra dónde servir</h2>
                <p className="mt-1 text-sm leading-6 text-indigo-800/80">
                  Revisa los ministerios disponibles y toca <strong>Solicitar ingreso</strong> en el que deseas integrarte. Recibirás una respuesta cuando revisen tu solicitud.
                </p>
              </div>
            </section>
          )}

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {allMinisterios.map((min: any) => {
              const mem = membresiaMap.get(min.id) as any
              const esMiembro = !!mem
              const esLider = mem?.es_lider
              const puedeVer = esMiembro || ministeriosAccesibles.has(min.id)
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

                      {!esMiembro && puedeVer && <p className="mt-1 text-xs font-semibold text-indigo-700">Acceso pastoral autorizado</p>}
                      {sedePorMinisterio.get(min.id) && <p className="mt-1 text-xs font-semibold text-rose-700">{sedePorMinisterio.get(min.id)?.nombre}</p>}
                      {min.descripcion ? (
                        <p className="mt-1.5 line-clamp-2 break-words text-sm leading-relaxed text-gray-500">
                          {min.descripcion}
                        </p>
                      ) : (
                        <p className="mt-1.5 break-words text-sm text-gray-400">Conoce y sirve junto a este ministerio.</p>
                      )}

                      {!puedeVer && (
                        <div className="mt-4 min-w-0">
                          <SolicitarIngresoBoton ministerioId={min.id} estadoActual={estadoSolicitud || 'ninguno'} />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )

              const baseClasses = 'group relative min-h-[132px] min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(20,24,40,0.06)] transition-all sm:p-5'

              if (puedeVer) {
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
        </>
      )}
    </main>
  )
}
