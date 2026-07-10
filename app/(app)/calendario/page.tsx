import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Calendario',
}

export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener los ministerios a los que pertenece para filtrar eventos
  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id')
    .eq('profile_id', user.id)

  const ministerioIds = membresias?.map((m: any) => m.ministerio_id) || []

  // Obtener eventos globales (ministerio_id is null) O de sus ministerios
  const { data: eventos } = await supabase
    .from('eventos')
    .select(`
      id,
      titulo,
      descripcion,
      ubicacion,
      fecha_inicio,
      fecha_fin,
      todo_el_dia,
      ministerios (
        nombre,
        color_primario
      )
    `)
    .or(`ministerio_id.is.null,ministerio_id.in.(${ministerioIds.length > 0 ? ministerioIds.join(',') : 'uuid-00000000-0000-0000-0000-000000000000'})`)
    .gte('fecha_inicio', new Date().toISOString())
    .order('fecha_inicio', { ascending: true })

  // Agrupar por día
  const eventosPorDia = eventos?.reduce((acc: any, evento: any) => {
    const dateStr = format(new Date(evento.fecha_inicio), 'yyyy-MM-dd')
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(evento)
    return acc
  }, {})

  const dias = Object.keys(eventosPorDia || {}).sort()

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 max-w-lg mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Calendario</h1>
        <p className="text-sm text-slate-400 mt-1">
          Tus próximos eventos
        </p>
      </header>

      {!dias.length ? (
        <div className="text-center py-16 px-4 border border-dashed border-slate-700 rounded-2xl">
          <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No hay eventos próximos programados.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {dias.map(diaStr => {
            const date = new Date(diaStr + 'T12:00:00') // Truco para evitar problemas de timezone
            return (
              <div key={diaStr}>
                <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3 pl-2 border-l-2 border-indigo-500">
                  {format(date, "EEEE, d 'de' MMMM", { locale: es })}
                </h2>
                
                <div className="space-y-3">
                  {eventosPorDia[diaStr].map((evento: any) => (
                    <div 
                      key={evento.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4"
                    >
                      <div className="flex flex-col items-center justify-center min-w-14">
                        <span className="text-lg font-bold text-white">
                          {evento.todo_el_dia ? 'Todo el día' : format(new Date(evento.fecha_inicio), 'HH:mm')}
                        </span>
                        {!evento.todo_el_dia && !isSameDay(new Date(evento.fecha_inicio), new Date(evento.fecha_fin)) && (
                          <span className="text-[10px] text-slate-500 mt-1 uppercase">
                            Termina otro día
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 border-l border-slate-700/50 pl-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-semibold text-slate-100">
                            {evento.titulo}
                          </h3>
                          {evento.ministerios && (
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
                              style={{ 
                                color: evento.ministerios.color_primario, 
                                backgroundColor: `${evento.ministerios.color_primario}15`,
                                borderColor: `${evento.ministerios.color_primario}30`
                              }}
                            >
                              {evento.ministerios.nombre}
                            </span>
                          )}
                          {!evento.ministerios && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-300 bg-slate-800 border border-slate-700 whitespace-nowrap">
                              Global
                            </span>
                          )}
                        </div>
                        
                        {evento.descripcion && (
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                            {evento.descripcion}
                          </p>
                        )}
                        
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                          {evento.ubicacion && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {evento.ubicacion}
                            </div>
                          )}
                          {!evento.todo_el_dia && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(evento.fecha_fin), 'HH:mm')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
