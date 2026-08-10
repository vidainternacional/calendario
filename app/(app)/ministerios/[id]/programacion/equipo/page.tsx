import { notFound, redirect } from 'next/navigation'
import { ChevronDown, Trash2, UserPlus, Users } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  asignarServidorAlabanza,
  quitarServidorAlabanza,
  crearFuncionMinisterial,
  actualizarFuncionMinisterial,
  cambiarEstadoFuncionMinisterial,
} from '@/app/actions/programacion-alabanza'
import FuncionesAlabanzaEditor from '@/components/ministerios/FuncionesAlabanzaEditor'

export const dynamic = 'force-dynamic'

function mesActualSV() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  return `${parts.find((part) => part.type === 'year')?.value || '2026'}-${parts.find((part) => part.type === 'month')?.value || '01'}`
}

function fechaSV(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function EquipoAlabanzaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mes?: string; evento?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient() as any
  const [{ data: ministerio }, { data: profile }, { data: membresia }] = await Promise.all([
    admin.from('ministerios').select('id,nombre,color_primario').eq('id', id).maybeSingle(),
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
  ])

  if (!ministerio) notFound()
  const puedeProgramar = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true)
  if (!puedeProgramar) redirect(`/ministerios/${id}`)

  const mes = /^\d{4}-\d{2}$/.test(query.mes || '') ? query.mes! : mesActualSV()
  const eventoId = String(query.evento || '')
  if (!eventoId) redirect(`/ministerios/${id}/programacion?mes=${mes}`)

  const [{ data: evento }, { data: funciones = [] }, { data: ministerioCalendars = [] }] = await Promise.all([
    admin.from('eventos').select('id,titulo,fecha_inicio,ubicacion,ministerio_id').eq('id', eventoId).maybeSingle(),
    admin.from('ministerio_capacidades').select('id,nombre,categoria,orden,activo').eq('ministerio_id', id).order('orden'),
    admin.from('calendars').select('id').eq('ministerio_id', id).limit(5),
  ])

  if (!evento) redirect(`/ministerios/${id}/programacion?mes=${mes}`)
  const ministerioCalendarIds = (ministerioCalendars || []).map((item: any) => String(item.id))
  let pertenece = String(evento.ministerio_id || '') === id
  if (!pertenece && ministerioCalendarIds.length > 0) {
    const { data: link } = await admin
      .from('evento_calendarios')
      .select('evento_id')
      .eq('evento_id', eventoId)
      .in('calendar_id', ministerioCalendarIds)
      .limit(1)
      .maybeSingle()
    pertenece = Boolean(link)
  }
  if (!pertenece) redirect(`/ministerios/${id}/programacion?mes=${mes}`)

  const funcionesActivas = (funciones as any[]).filter((item: any) => item.activo === true)
  const [asignacionesReq, miembrosReq] = await Promise.all([
    admin
      .from('evento_asignaciones')
      .select('id,profile_id,estado,capacidad_id,ministerio_id')
      .eq('evento_id', evento.id)
      .order('created_at'),
    admin.from('ministerio_miembros').select('profile_id').eq('ministerio_id', id),
  ])

  const profileIds = (miembrosReq.data || []).map((item: any) => item.profile_id)
  const candidatosPorCapacidad = new Map<string, any[]>()
  let asignaciones: any[] = []

  if (profileIds.length > 0) {
    const [{ data: perfiles = [] }, { data: capsMiembro = [] }] = await Promise.all([
      admin.from('profiles').select('id,nombre_completo,avatar_url,activo,estado_cuenta').in('id', profileIds),
      admin.from('ministerio_miembro_capacidades').select('profile_id,capacidad_id').eq('ministerio_id', id).in('profile_id', profileIds),
    ])
    const perfilPorId = new Map<string, any>((perfiles as any[]).map((item: any) => [String(item.id), item]))
    const capacidadPorId = new Map<string, any>((funciones as any[]).map((item: any) => [String(item.id), item]))

    for (const item of capsMiembro as any[]) {
      const persona = perfilPorId.get(String(item.profile_id))
      if (!persona || persona.activo !== true || persona.estado_cuenta !== 'activo') continue
      candidatosPorCapacidad.set(String(item.capacidad_id), [
        ...(candidatosPorCapacidad.get(String(item.capacidad_id)) || []),
        persona,
      ])
    }

    asignaciones = (asignacionesReq.data || [])
      .map((assignment: any) => ({
        ...assignment,
        persona: perfilPorId.get(String(assignment.profile_id)),
        capacidad: assignment.capacidad_id ? capacidadPorId.get(String(assignment.capacidad_id)) : null,
      }))
      .filter((assignment: any) => (
        String(assignment.ministerio_id || '') === id
        || (!assignment.ministerio_id && assignment.capacidad)
      ))
  }

  const asignadosIds = new Set(asignaciones.map((item: any) => String(item.profile_id)))
  const color = ministerio.color_primario || '#5b3df5'

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-5">
      <header className="mb-5 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>Panel del líder</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">Programar equipo</h1>
        <p className="mt-1 text-xs text-slate-500">{ministerio.nombre} · {fechaSV(evento.fecha_inicio)}</p>
        <p className="mt-1 text-sm font-bold text-slate-800">{evento.titulo}</p>
      </header>

      <details className="overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <summary className="flex min-h-[66px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-slate-800">Funciones de {ministerio.nombre}</span>
            <span className="mt-0.5 block text-[11px] text-slate-400">{funcionesActivas.length} activas · abre solo cuando necesites administrarlas</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </summary>
        <div className="border-t border-slate-100 bg-slate-50/60 p-3">
          <FuncionesAlabanzaEditor
            funciones={funciones as any[]}
            crearAction={crearFuncionMinisterial.bind(null, id)}
            editarAction={actualizarFuncionMinisterial.bind(null, id)}
            estadoAction={cambiarEstadoFuncionMinisterial.bind(null, id)}
          />
        </div>
      </details>

      <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className="text-sm font-extrabold text-[#171923]">Equipo de este servicio</h2>
            <p className="text-xs text-slate-500">{asignaciones.length} {asignaciones.length === 1 ? 'integrante' : 'integrantes'} programados.</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {asignaciones.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Todavía no hay integrantes asignados.</p>
          ) : asignaciones.map((assignment: any) => (
            <div key={assignment.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 font-extrabold text-indigo-600">
                {assignment.persona?.avatar_url
                  ? <img src={assignment.persona.avatar_url} alt="" className="h-full w-full object-cover" />
                  : (assignment.persona?.nombre_completo || 'U').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{assignment.persona?.nombre_completo || 'Servidor'}</p>
                <p className="truncate text-xs text-slate-500">{assignment.capacidad?.nombre || 'Función anterior'} · {assignment.estado}</p>
              </div>
              <form action={quitarServidorAlabanza.bind(null, id, evento.id)}>
                <input type="hidden" name="asignacion_id" value={assignment.id} />
                <button className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500" aria-label="Quitar del servicio">
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-2 text-xs font-extrabold text-slate-700"><UserPlus className="h-4 w-4 text-indigo-500" />Asignar integrante</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">Abre únicamente la función que necesitas. Solo aparecen personas compatibles y todavía no asignadas.</p>

          <div className="mt-3 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
            {funcionesActivas.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">No hay funciones activas. Ábrelas arriba para crear la primera.</p>
            ) : funcionesActivas.map((cap: any, index: number) => {
              const candidatos = (candidatosPorCapacidad.get(String(cap.id)) || [])
                .filter((persona: any) => !asignadosIds.has(String(persona.id)))
              return (
                <details key={cap.id} className={index ? 'border-t border-slate-100' : ''}>
                  <summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800">{cap.nombre}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">{candidatos.length} {candidatos.length === 1 ? 'persona compatible' : 'personas compatibles'}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  </summary>
                  <div className="border-t border-slate-100 bg-white p-3">
                    {candidatos.length ? (
                      <form action={asignarServidorAlabanza.bind(null, id, evento.id)} className="grid gap-2">
                        <input type="hidden" name="capacidad_id" value={cap.id} />
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Integrante
                          <select name="profile_id" className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-xs font-semibold">
                            {candidatos.map((persona: any) => <option key={persona.id} value={persona.id}>{persona.nombre_completo}</option>)}
                          </select>
                        </label>
                        <button className="h-11 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white">Asignar a {cap.nombre}</button>
                      </form>
                    ) : (
                      <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">No hay personas disponibles con esta función asignada en su ficha.</p>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
