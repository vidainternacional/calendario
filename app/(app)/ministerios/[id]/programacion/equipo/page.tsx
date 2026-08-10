import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { CalendarDays, ChevronDown, ChevronLeft, Trash2, UserPlus, Users } from 'lucide-react'
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
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit' }).formatToParts(new Date())
  return `${parts.find((p) => p.type === 'year')?.value || '2026'}-${parts.find((p) => p.type === 'month')?.value || '01'}`
}
function rangoMes(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  const nextY = m === 12 ? y + 1 : y
  const nextM = m === 12 ? 1 : m + 1
  return { start: `${y}-${String(m).padStart(2, '0')}-01T00:00:00-06:00`, end: `${nextY}-${String(nextM).padStart(2, '0')}-01T00:00:00-06:00` }
}
function fechaSV(value: string) {
  return new Intl.DateTimeFormat('es-SV', { timeZone: 'America/El_Salvador', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export default async function EquipoAlabanzaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mes?: string; evento?: string }> }) {
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
  const puedeProgramar = profile?.activo === true && profile?.estado_cuenta === 'activo' && (['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true)
  if (!puedeProgramar) redirect(`/ministerios/${id}`)

  const mes = /^\d{4}-\d{2}$/.test(query.mes || '') ? query.mes! : mesActualSV()
  const { start, end } = rangoMes(mes)
  const [{ data: eventos = [] }, { data: funciones = [] }] = await Promise.all([
    admin.from('eventos').select('id,titulo,fecha_inicio,ubicacion').eq('ministerio_id', id).gte('fecha_inicio', start).lt('fecha_inicio', end).order('fecha_inicio'),
    admin.from('ministerio_capacidades').select('id,nombre,categoria,orden,activo').eq('ministerio_id', id).order('orden'),
  ])
  const evento: any = eventos.find((e: any) => e.id === query.evento) || eventos[0] || null
  const funcionesActivas = (funciones as any[]).filter((f: any) => f.activo === true)

  let asignaciones: any[] = []
  const candidatosPorCapacidad = new Map<string, any[]>()
  if (evento) {
    const [a, mm] = await Promise.all([
      admin.from('evento_asignaciones').select('id,profile_id,estado,capacidad_id').eq('evento_id', evento.id).order('created_at'),
      admin.from('ministerio_miembros').select('profile_id').eq('ministerio_id', id),
    ])
    asignaciones = a.data || []
    const ids = (mm.data || []).map((x: any) => x.profile_id)
    if (ids.length) {
      const [{ data: perfiles = [] }, { data: capsMiembro = [] }] = await Promise.all([
        admin.from('profiles').select('id,nombre_completo,avatar_url,activo,estado_cuenta').in('id', ids),
        admin.from('ministerio_miembro_capacidades').select('profile_id,capacidad_id').eq('ministerio_id', id).in('profile_id', ids),
      ])
      const perfilPorId = new Map<string, any>((perfiles as any[]).map((x: any) => [x.id, x] as [string, any]))
      for (const item of capsMiembro as any[]) {
        const persona: any = perfilPorId.get(item.profile_id)
        if (!persona || persona.activo !== true || persona.estado_cuenta !== 'activo') continue
        candidatosPorCapacidad.set(item.capacidad_id, [...(candidatosPorCapacidad.get(item.capacidad_id) || []), persona])
      }
      asignaciones = asignaciones.map((a: any) => ({ ...a, persona: perfilPorId.get(a.profile_id), capacidad: (funciones as any[]).find((c: any) => c.id === a.capacidad_id) }))
    }
  }

  const color = ministerio.color_primario || '#5b3df5'
  return <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-8">
    <header className="mb-5 flex items-center gap-3">
      <Link href={`/ministerios/${id}/programacion?mes=${mes}${evento ? `&evento=${evento.id}` : ''}`} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]"><ChevronLeft className="h-5 w-5" /></Link>
      <div><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>Panel del líder</p><h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">Programar equipo</h1><p className="mt-1 text-xs text-slate-500">{ministerio.nombre}</p></div>
    </header>

    <FuncionesAlabanzaEditor funciones={funciones as any[]} crearAction={crearFuncionMinisterial.bind(null, id)} editarAction={actualizarFuncionMinisterial.bind(null, id)} estadoAction={cambiarEstadoFuncionMinisterial.bind(null, id)} />

    <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-500"/><div><h2 className="text-sm font-extrabold text-[#171923]">Servicio</h2><p className="text-xs text-slate-500">Elige una fecha real del Calendario.</p></div></div>
      <form method="get" className="mt-4"><label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Mes<input type="month" name="mes" defaultValue={mes} className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100"/></label><button className="mt-2 h-10 w-full rounded-xl bg-slate-100 text-xs font-bold text-slate-600">Ver mes</button></form>
      <div className="mt-4 space-y-2">{eventos.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">Sin servicios este mes.</p> : eventos.map((e:any)=><Link key={e.id} href={`/ministerios/${id}/programacion/equipo?mes=${mes}&evento=${e.id}`} className={`block rounded-2xl p-3 ring-1 ${evento?.id===e.id?'bg-indigo-50 ring-indigo-200':'bg-slate-50 ring-slate-100'}`}><p className="text-sm font-extrabold text-slate-800">{e.titulo}</p><p className="mt-1 text-xs text-slate-500">{fechaSV(e.fecha_inicio)}{e.ubicacion?` · ${e.ubicacion}`:''}</p></Link>)}</div>
    </section>

    {evento && <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-500"/><div><h2 className="text-sm font-extrabold text-[#171923]">Integrantes asignados</h2><p className="text-xs text-slate-500">{fechaSV(evento.fecha_inicio)}</p></div></div>
      <div className="mt-4 space-y-2">{asignaciones.length===0?<p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Todavía no hay integrantes asignados.</p>:asignaciones.map((a:any)=><div key={a.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 font-extrabold text-indigo-600">{a.persona?.avatar_url?<img src={a.persona.avatar_url} alt="" className="h-full w-full object-cover"/>:(a.persona?.nombre_completo||'U').charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{a.persona?.nombre_completo||'Servidor'}</p><p className="truncate text-xs text-slate-500">{a.capacidad?.nombre||'Función anterior'} · {a.estado}</p></div><form action={quitarServidorAlabanza.bind(null,id,evento.id)}><input type="hidden" name="asignacion_id" value={a.id}/><button className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500" aria-label="Quitar del servicio"><Trash2 className="h-4 w-4"/></button></form></div>)}</div>

      <div className="mt-5 border-t border-slate-100 pt-4"><p className="flex items-center gap-2 text-xs font-extrabold text-slate-700"><UserPlus className="h-4 w-4 text-indigo-500"/>Asignar integrante</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Abre únicamente la función que necesitas. Solo aparecen personas compatibles.</p><div className="mt-3 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">{funcionesActivas.map((cap:any, index:number)=>{const candidatos=candidatosPorCapacidad.get(cap.id)||[];return <details key={cap.id} className={index ? 'border-t border-slate-100' : ''}><summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5"><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-800">{cap.nombre}</span><span className="mt-0.5 block text-[10px] text-slate-400">{candidatos.length} {candidatos.length === 1 ? 'persona compatible' : 'personas compatibles'}</span></span><ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /></summary><div className="border-t border-slate-100 bg-white p-3">{candidatos.length ? <form action={asignarServidorAlabanza.bind(null,id,evento.id)} className="grid gap-2"><input type="hidden" name="capacidad_id" value={cap.id}/><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Integrante<select name="profile_id" className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-xs font-semibold">{candidatos.map((x:any)=><option key={x.id} value={x.id}>{x.nombre_completo}</option>)}</select></label><button className="h-11 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white">Asignar a {cap.nombre}</button></form> : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">No hay personas con esta función asignada en su ficha.</p>}</div></details>})}</div></div>
    </section>}
  </main>
}
