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

  // 1. Obtener todos los ministerios activos
  const { data: ministeriosActivos } = await supabase
    .from('ministerios')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })

  // 2. Obtener las membresías del usuario
  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id, es_lider')
    .eq('profile_id', user.id)

  const membresiaMap = new Map((membresias as any[])?.map(m => [m.ministerio_id, m]))

  // 3. Obtener solicitudes pendientes del usuario
  const { data: solicitudes } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .select('ministerio_id, estado')
    .eq('profile_id', user.id)
    .in('estado', ['pendiente', 'rechazada'])

  const solicitudMap = new Map(solicitudes?.map((s: any) => [s.ministerio_id, s.estado]))

  const allMinisterios = ministeriosActivos || []

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto pb-28">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#171923]">Ministerios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Descubre e intégrate a los ministerios de la iglesia
        </p>
      </header>

      {allMinisterios.length === 0 ? (
        <div className="text-center py-12 px-4 border border-slate-100 rounded-[18px] bg-white">
          <p className="text-gray-500">No hay ministerios activos actualmente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {allMinisterios.map((min: any) => {
            const mem = membresiaMap.get(min.id) as any
            const esMiembro = !!mem
            const esLider = mem?.es_lider
            const estadoSolicitud = solicitudMap.get(min.id) as 'pendiente' | 'rechazada' | undefined

            const CardContent = (
              <>
                {/* Degradado sutil de fondo */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-opacity group-hover:opacity-30"
                  style={{ background: `linear-gradient(to bottom right, ${min.color_primario}, ${min.color_secundario})` }}
                />

                <div className="relative z-10 flex items-start gap-4">
                  <div 
                    className="w-12 h-12 shrink-0 rounded-[18px] flex items-center justify-center text-2xl shadow-inner border border-white/10"
                    style={{ background: `linear-gradient(135deg, ${min.color_primario}20, ${min.color_secundario}20)` }}
                  >
                    {min.emoji}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-[#171923] group-hover:text-transparent group-hover:bg-clip-text transition-colors truncate"
                          style={{ backgroundImage: `linear-gradient(to right, ${min.color_primario}, ${min.color_secundario})` }}>
                        {min.nombre}
                      </h2>
                      {esLider && (
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 whitespace-nowrap">
                          Líder
                        </span>
                      )}
                      {esMiembro && !esLider && (
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 whitespace-nowrap">
                          Miembro
                        </span>
                      )}
                    </div>
                    {min.descripcion && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {min.descripcion}
                      </p>
                    )}
                    
                    {!esMiembro && (
                      <div className="mt-3">
                        <SolicitarIngresoBoton ministerioId={min.id} estadoActual={estadoSolicitud || 'ninguno'} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )

            if (esMiembro) {
              return (
                <Link
                  key={min.id}
                  href={`/ministerios/${min.id}/avisos`}
                  className="group relative overflow-hidden rounded-[18px] border border-slate-100 hover:border-slate-100 transition-all p-5 bg-white backdrop-blur-sm cursor-pointer"
                  style={{ boxShadow: `0 4px 20px -10px ${min.color_primario}40` }}
                >
                  {CardContent}
                </Link>
              )
            }

            return (
              <div
                key={min.id}
                className="group relative overflow-hidden rounded-[18px] border border-slate-100 p-5 bg-white backdrop-blur-sm opacity-90"
              >
                {CardContent}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
