import { notFound, redirect } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  crearFuncionMinisterial,
  actualizarFuncionMinisterial,
  cambiarEstadoFuncionMinisterial,
} from '@/app/actions/programacion-alabanza'
import {
  asignarFuncionEquipoMinisterial,
  cambiarDisponibilidadFuncionMiembro,
  quitarFuncionEquipoMinisterial,
} from '@/app/actions/equipo-ministerial'
import FuncionesAlabanzaEditor from '@/components/ministerios/FuncionesAlabanzaEditor'
import EquipoServicioEditor from '@/components/ministerios/EquipoServicioEditor'

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
  const [{ data: asignacionesRows = [] }, { data: miembrosRows = [] }] = await Promise.all([
    admin
      .from('evento_asignaciones')
      .select('id,profile_id,estado,capacidad_id,ministerio_id')
      .eq('evento_id', evento.id)
      .order('created_at'),
    admin.from('ministerio_miembros').select('profile_id').eq('ministerio_id', id),
  ])

  const profileIds = (miembrosRows as any[]).map((item: any) => String(item.profile_id))
  let miembrosEditor: Array<{ id: string; nombre_completo: string; avatar_url: string | null; capacidades: string[] }> = []
  let asignacionesEditor: Array<{ id: string; profile_id: string; capacidad_id: string; estado: string }> = []

  if (profileIds.length > 0) {
    const [{ data: perfiles = [] }, { data: capacidadesMiembro = [] }] = await Promise.all([
      admin
        .from('profiles')
        .select('id,nombre_completo,avatar_url,activo,estado_cuenta')
        .in('id', profileIds)
        .order('nombre_completo'),
      admin
        .from('ministerio_miembro_capacidades')
        .select('profile_id,capacidad_id')
        .eq('ministerio_id', id)
        .in('profile_id', profileIds),
    ])

    const capacidadesPorPersona = new Map<string, string[]>()
    for (const row of capacidadesMiembro as any[]) {
      const profileId = String(row.profile_id)
      capacidadesPorPersona.set(profileId, [
        ...(capacidadesPorPersona.get(profileId) || []),
        String(row.capacidad_id),
      ])
    }

    miembrosEditor = (perfiles as any[])
      .filter((persona: any) => persona.activo === true && persona.estado_cuenta === 'activo')
      .map((persona: any) => ({
        id: String(persona.id),
        nombre_completo: String(persona.nombre_completo || 'Integrante'),
        avatar_url: persona.avatar_url || null,
        capacidades: capacidadesPorPersona.get(String(persona.id)) || [],
      }))

    const funcionesPorId = new Map<string, any>((funciones as any[]).map((item: any) => [String(item.id), item]))
    const miembrosValidos = new Set(miembrosEditor.map((item) => item.id))

    asignacionesEditor = (asignacionesRows as any[])
      .filter((assignment: any) => {
        if (!miembrosValidos.has(String(assignment.profile_id))) return false
        const capacidad = assignment.capacidad_id ? funcionesPorId.get(String(assignment.capacidad_id)) : null
        return String(assignment.ministerio_id || '') === id
          || (!assignment.ministerio_id && Boolean(capacidad))
      })
      .filter((assignment: any) => Boolean(assignment.capacidad_id))
      .map((assignment: any) => ({
        id: String(assignment.id),
        profile_id: String(assignment.profile_id),
        capacidad_id: String(assignment.capacidad_id),
        estado: String(assignment.estado || 'asignado'),
      }))
  }

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
            <span className="mt-0.5 block text-[11px] text-slate-400">{funcionesActivas.length} activas · administra el catálogo solo cuando lo necesites</span>
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

      <EquipoServicioEditor
        funciones={funcionesActivas.map((funcion: any) => ({
          id: String(funcion.id),
          nombre: String(funcion.nombre),
          categoria: String(funcion.categoria || 'Servicio'),
        }))}
        miembros={miembrosEditor}
        asignaciones={asignacionesEditor}
        disponibilidadAction={cambiarDisponibilidadFuncionMiembro.bind(null, id)}
        asignarAction={asignarFuncionEquipoMinisterial.bind(null, id, evento.id)}
        quitarAction={quitarFuncionEquipoMinisterial.bind(null, id, evento.id)}
      />
    </main>
  )
}
