import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeftRight, Check, X, Clock } from 'lucide-react'
import { aceptarIntercambio, rechazarIntercambio } from '@/app/actions/intercambios'
import BackButton from '@/components/navigation/BackButton'
import UserAvatar from '@/components/comunidad/UserAvatar'

export const metadata: Metadata = {
  title: 'Intercambios',
}

export default async function IntercambiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id')
    .eq('profile_id', user.id)

  const misMinisterios = membresias?.map((m: any) => m.ministerio_id) || []

  const { data: todosPendientes } = await supabase
    .from('intercambios')
    .select(`
      id,
      mensaje,
      estado,
      created_at,
      solicitante_id,
      destinatario_id,
      profiles!solicitante_id (nombre_completo, avatar_url),
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
    if (i.destinatario_id === user.id) return true

    const evt = i.evento_asignaciones?.eventos
    if (!i.destinatario_id && i.solicitante_id !== user.id && evt?.ministerio_id && misMinisterios.includes(evt.ministerio_id)) {
      return true
    }

    return false
  })

  const { data: enviados } = await supabase
    .from('intercambios')
    .select(`
      id,
      mensaje,
      estado,
      created_at,
      destinatario_id,
      profiles!destinatario_id (nombre_completo, avatar_url),
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
    <main className="mx-auto min-h-screen max-w-lg bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:pt-8">
      <div className="mb-5">
        <BackButton />
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#171923]">Intercambios</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona tus solicitudes de cambio de turno
        </p>
      </header>

      <div className="space-y-8">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-[#171923]">Recibidos</h2>
          </div>

          {!recibidos.length ? (
            <div className="rounded-[18px] border border-slate-100 bg-white p-6 text-center shadow-[0_4px_18px_rgba(20,24,40,0.08)]">
              <p className="text-sm text-gray-500">No tienes propuestas de intercambio pendientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recibidos.map((int: any) => {
                const evt = int.evento_asignaciones?.eventos
                const persona = int.profiles as any
                return (
                  <div key={int.id} className="relative overflow-hidden rounded-[18px] border border-slate-100 bg-white p-5 shadow-[0_4px_18px_rgba(20,24,40,0.08)]">
                    <div className="absolute left-0 top-0 h-full w-1 bg-amber-500" />
                    <div className="pl-2">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <UserAvatar nombre={persona?.nombre_completo} avatarUrl={persona?.avatar_url} size="sm" />
                          <h3 className="min-w-0 break-words text-sm font-bold text-[#171923]">
                            {persona?.nombre_completo || 'Usuario'}
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          Pendiente
                        </span>
                      </div>

                      <p className="mb-3 text-sm text-gray-500">
                        Solicita que cubras: <strong className="text-[#171923]">{evt?.titulo}</strong> el {evt ? format(new Date(evt.fecha_inicio), "d 'de' MMMM", { locale: es }) : ''}
                      </p>

                      {int.mensaje && (
                        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-gray-600">
                          “{int.mensaje}”
                        </div>
                      )}

                      <div className="flex gap-2">
                        <form action={aceptarIntercambio as any} className="flex-1">
                          <input type="hidden" name="intercambio_id" value={int.id} />
                          <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-100">
                            <Check className="h-4 w-4" /> Aceptar
                          </button>
                        </form>
                        <form action={rechazarIntercambio as any} className="flex-1">
                          <input type="hidden" name="intercambio_id" value={int.id} />
                          <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-50 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100">
                            <X className="h-4 w-4" /> Rechazar
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

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-[#171923]">Mis Solicitudes</h2>
          </div>

          {!enviados?.length ? (
            <div className="rounded-[18px] border border-slate-100 bg-white p-6 text-center shadow-[0_4px_18px_rgba(20,24,40,0.08)]">
              <p className="text-sm text-gray-500">No has propuesto ningún intercambio reciente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enviados.map((int: any) => {
                const evt = int.evento_asignaciones?.eventos
                const persona = int.profiles as any
                const dest = persona?.nombre_completo || 'Alguien del ministerio'

                let colorClass = 'bg-slate-100 text-gray-600'
                let bgBorder = 'bg-gray-300'
                if (int.estado === 'pendiente') { colorClass = 'bg-amber-100 text-amber-700'; bgBorder = 'bg-amber-500' }
                if (int.estado === 'aceptado') { colorClass = 'bg-emerald-100 text-emerald-700'; bgBorder = 'bg-emerald-500' }
                if (int.estado === 'rechazado') { colorClass = 'bg-rose-100 text-rose-700'; bgBorder = 'bg-rose-500' }

                return (
                  <div key={int.id} className="relative flex gap-4 overflow-hidden rounded-[18px] border border-slate-100 bg-white p-4 shadow-[0_4px_18px_rgba(20,24,40,0.08)]">
                    <div className={`absolute left-0 top-0 h-full w-1 ${bgBorder}`} />
                    <div className="flex-1 pl-2">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-sm font-bold text-[#171923]">
                          {evt?.titulo}
                        </h3>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${colorClass}`}>
                          {int.estado}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <UserAvatar nombre={dest} avatarUrl={persona?.avatar_url} size="xs" />
                        <span>Propuesto a: <strong className="text-[#171923]">{dest}</strong></span>
                      </div>
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
