import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeftRight, Check, X, Clock } from 'lucide-react'
import { aceptarIntercambio, rechazarIntercambio } from '@/app/actions/intercambios'

export const metadata: Metadata = {
  title: 'Intercambios',
}

export default async function IntercambiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener membresias
  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id')
    .eq('profile_id', user.id)

  const misMinisterios = membresias?.map((m: any) => m.ministerio_id) || []

  // Obtener intercambios que me proponen (o abiertos de mis ministerios)
  // Como Supabase no soporta un join condicional complejo fácilmente en el client JS,
  // traemos los pendientes que me involucran y luego filtramos en JS.
  const { data: todosPendientes } = await supabase
    .from('intercambios')
    .select(`
      id,
      mensaje,
      estado,
      created_at,
      solicitante_id,
      destinatario_id,
      profiles!solicitante_id (nombre_completo),
      evento_asignaciones!asignacion_origen_id (
        eventos (
          titulo,
          fecha_inicio,
          ministerio_id
        )
      )
    `)
    .eq('estado', 'pendiente')

  const recibidos = (todosPendientes || []).filter((i: any) => {
    // Si soy el destinatario directo
    if (i.destinatario_id === user.id) return true
    
    // Si está abierto a cualquiera y soy del mismo ministerio del evento
    // Y yo no soy el solicitante
    const evt = i.evento_asignaciones?.eventos
    if (!i.destinatario_id && i.solicitante_id !== user.id && evt?.ministerio_id && misMinisterios.includes(evt.ministerio_id)) {
      return true
    }
    
    return false
  })

  // Obtener mis solicitudes (donde yo soy el solicitante)
  const { data: enviados } = await supabase
    .from('intercambios')
    .select(`
      id,
      mensaje,
      estado,
      created_at,
      destinatario_id,
      profiles!destinatario_id (nombre_completo),
      evento_asignaciones!asignacion_origen_id (
        eventos (
          titulo,
          fecha_inicio
        )
      )
    `)
    .eq('solicitante_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#171923]">Intercambios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona tus solicitudes de cambio de turno
        </p>
      </header>

      <div className="space-y-8">
        {/* Recibidos */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-[#171923]">Recibidos</h2>
          </div>

          {!recibidos.length ? (
            <div className="bg-white shadow-[0_4px_18px_rgba(20,24,40,0.08)] rounded-[18px] p-6 text-center border border-slate-100">
              <p className="text-sm text-gray-500">No tienes propuestas de intercambio pendientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recibidos.map((int: any) => {
                const evt = int.evento_asignaciones?.eventos
                return (
                  <div key={int.id} className="bg-white shadow-[0_4px_18px_rgba(20,24,40,0.08)] rounded-[18px] p-5 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-[#171923] text-sm">
                          {int.profiles?.nombre_completo}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                          Pendiente
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-3">
                        Solicita que cubras: <strong className="text-[#171923]">{evt?.titulo}</strong> el {evt ? format(new Date(evt.fecha_inicio), "d 'de' MMMM", { locale: es }) : ''}
                      </p>

                      {int.mensaje && (
                        <div className="bg-slate-50 p-3 rounded-xl text-xs text-gray-600 mb-4 border border-slate-100">
                          "{int.mensaje}"
                        </div>
                      )}

                      <div className="flex gap-2">
                        <form action={aceptarIntercambio as any} className="flex-1">
                          <input type="hidden" name="intercambio_id" value={int.id} />
                          <button type="submit" className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-colors">
                            <Check className="w-4 h-4" /> Aceptar
                          </button>
                        </form>
                        <form action={rechazarIntercambio as any} className="flex-1">
                          <input type="hidden" name="intercambio_id" value={int.id} />
                          <button type="submit" className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-semibold transition-colors">
                            <X className="w-4 h-4" /> Rechazar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Enviados */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-[#171923]">Mis Solicitudes</h2>
          </div>

          {!enviados?.length ? (
            <div className="bg-white shadow-[0_4px_18px_rgba(20,24,40,0.08)] rounded-[18px] p-6 text-center border border-slate-100">
              <p className="text-sm text-gray-500">No has propuesto ningún intercambio reciente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enviados.map((int: any) => {
                const evt = int.evento_asignaciones?.eventos
                const dest = int.profiles?.nombre_completo || 'Alguien del ministerio'
                
                let colorClass = 'bg-slate-100 text-gray-600'
                let bgBorder = 'bg-gray-300'
                if (int.estado === 'pendiente') { colorClass = 'bg-amber-100 text-amber-700'; bgBorder = 'bg-amber-500' }
                if (int.estado === 'aceptado') { colorClass = 'bg-emerald-100 text-emerald-700'; bgBorder = 'bg-emerald-500' }
                if (int.estado === 'rechazado') { colorClass = 'bg-rose-100 text-rose-700'; bgBorder = 'bg-rose-500' }

                return (
                  <div key={int.id} className="bg-white shadow-[0_4px_18px_rgba(20,24,40,0.08)] rounded-[18px] p-4 border border-slate-100 relative overflow-hidden flex gap-4">
                    <div className={`absolute top-0 left-0 w-1 h-full ${bgBorder}`}></div>
                    <div className="flex-1 pl-2">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-[#171923] text-sm line-clamp-1">
                          {evt?.titulo}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${colorClass}`}>
                          {int.estado}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Propuesto a: <strong className="text-[#171923]">{dest}</strong>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
