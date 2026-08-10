import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { CalendarDays, ChevronLeft, ExternalLink, Music2, Palette, Trash2, UserPlus, Users } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { agregarCancionAlabanza, asignarServidorAlabanza, actualizarCancionAlabanza, eliminarCancionAlabanza, guardarPaletaAlabanza, quitarServidorAlabanza } from '@/app/actions/programacion-alabanza'

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

export default async function ProgramacionMinisterialPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mes?: string; evento?: string }> }) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient() as any
  const [{ data: ministerio }, { data: profile }, { data: membresia }, { data: respRows }] = await Promise.all([
    admin.from('ministerios').select('id,nombre,emoji,color_primario').eq('id', id).maybeSingle(),
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
    admin.from('ministerio_responsabilidad_asignaciones').select('responsabilidad_id').eq('profile_id', user.id),
  ])
  if (!ministerio) notFound()
  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') redirect('/inicio')

  let responsablePaleta = false
  if ((respRows || []).length) {
    const { data: paletaResp } = await admin.from('ministerio_responsabilidades').select('id').in('id', respRows.map((r: any) => r.responsabilidad_id)).eq('codigo', 'paleta_colores').eq('activo', true).limit(1)
    responsablePaleta = (paletaResp || []).length > 0
  }
  const puedeProgramar = ['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true
  const puedePaleta = puedeProgramar || responsablePaleta
  if (!puedeProgramar && !puedePaleta) redirect(`/ministerios/${id}`)

  const mes = /^\d{4}-\d{2}$/.test(query.mes || '') ? query.mes! : mesActualSV()
  const { start, end } = rangoMes(mes)
  const { data: eventos = [] } = await admin.from('eventos').select('id,titulo,fecha_inicio,ubicacion').eq('ministerio_id', id).gte('fecha_inicio', start).lt('fecha_inicio', end).order('fecha_inicio')
  const evento: any = eventos.find((e: any) => e.id === query.evento) || eventos[0] || null

  let asignaciones: any[] = []
  let repertorio: any[] = []
  let paleta: any = null
  let capacidades: any[] = []
  const candidatosPorCapacidad = new Map<string, any[]>()

  if (evento) {
    const [a, r, p, c, mm] = await Promise.all([
      admin.from('evento_asignaciones').select('id,profile_id,estado,capacidad_id').eq('evento_id', evento.id).order('created_at'),
      admin.from('evento_repertorio').select('*').eq('evento_id', evento.id).order('orden').order('created_at'),
      admin.from('evento_paletas').select('*').eq('evento_id', evento.id).maybeSingle(),
      admin.from('ministerio_capacidades').select('id,nombre,categoria,orden').eq('ministerio_id', id).eq('activo', true).order('orden'),
      admin.from('ministerio_miembros').select('profile_id').eq('ministerio_id', id),
    ])
    asignaciones = a.data || []; repertorio = r.data || []; paleta = p.data || null; capacidades = c.data || []
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
      asignaciones = asignaciones.map((a: any) => ({ ...a, persona: perfilPorId.get(a.profile_id), capacidad: capacidades.find((c: any) => c.id === a.capacidad_id) }))
    }
  }

  const color = ministerio.color_primario || '#5b3df5'
  const colores: string[] = Array.isArray(paleta?.colores) ? paleta.colores : []
  const defaults = ['#111827', '#f8fafc', '#7c3aed', '#d4a373']

  return <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-8">
    <header className="mb-5 flex items-center gap-3"><Link href={`/ministerios/${id}`} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]"><ChevronLeft className="h-5 w-5" /></Link><div><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>Programación ministerial</p><h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">{ministerio.nombre}</h1></div></header>

    <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-extrabold text-[#171923]">Servicios del Calendario</h2><p className="mt-1 text-xs leading-5 text-slate-500">Se usan las fechas reales; aquí no se crea un calendario paralelo.</p></div><CalendarDays className="h-5 w-5 text-slate-300" /></div><form method="get" className="mt-4"><input type="month" name="mes" defaultValue={mes} className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100" /><button className="mt-2 h-10 w-full rounded-xl bg-slate-100 text-xs font-bold text-slate-600">Ver mes</button></form><div className="mt-4 space-y-2">{eventos.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">Sin servicios este mes.</p> : eventos.map((e: any) => <Link key={e.id} href={`/ministerios/${id}/programacion?mes=${mes}&evento=${e.id}`} className={`block rounded-2xl p-3 ring-1 ${evento?.id === e.id ? 'bg-indigo-50 ring-indigo-200' : 'bg-slate-50 ring-slate-100'}`}><p className="text-sm font-extrabold text-slate-800">{e.titulo}</p><p className="mt-1 text-xs text-slate-500">{fechaSV(e.fecha_inicio)}{e.ubicacion ? ` · ${e.ubicacion}` : ''}</p></Link>)}</div></section>

    {evento && <>
      <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-500" /><div><h2 className="text-sm font-extrabold text-[#171923]">Equipo del servicio</h2><p className="text-xs text-slate-500">{fechaSV(evento.fecha_inicio)}</p></div></div><div className="mt-4 space-y-2">{asignaciones.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Sin servidores asignados.</p> : asignaciones.map((a: any) => <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-indigo-100 font-extrabold text-indigo-600">{a.persona?.avatar_url ? <img src={a.persona.avatar_url} alt="" className="h-full w-full object-cover" /> : (a.persona?.nombre_completo || 'U').charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{a.persona?.nombre_completo || 'Servidor'}</p><p className="truncate text-xs text-slate-500">{a.capacidad?.nombre || 'Función pendiente'} · {a.estado}</p></div>{puedeProgramar && <form action={quitarServidorAlabanza.bind(null, id, evento.id)}><input type="hidden" name="asignacion_id" value={a.id}/><button className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500"><Trash2 className="h-4 w-4"/></button></form>}</div>)}</div>{puedeProgramar && <div className="mt-5 border-t border-slate-100 pt-4"><p className="flex items-center gap-2 text-xs font-extrabold text-slate-700"><UserPlus className="h-4 w-4 text-indigo-500"/>Asignar por función compatible</p><div className="mt-3 space-y-3">{capacidades.map((cap: any) => { const candidatos = candidatosPorCapacidad.get(cap.id) || []; return <form key={cap.id} action={asignarServidorAlabanza.bind(null,id,evento.id)} className="rounded-2xl border border-slate-100 p-3"><input type="hidden" name="capacidad_id" value={cap.id}/><p className="text-xs font-bold text-slate-700">{cap.nombre}</p>{candidatos.length ? <div className="mt-2 flex gap-2"><select name="profile_id" className="h-11 min-w-0 flex-1 rounded-xl bg-slate-50 px-3 text-xs font-semibold">{candidatos.map((x:any)=><option key={x.id} value={x.id}>{x.nombre_completo}</option>)}</select><button className="h-11 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white">Asignar</button></div> : <p className="mt-2 text-[11px] text-slate-400">Sin candidatos compatibles.</p>}</form> })}</div></div>}</section>

      <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-center gap-2"><Music2 className="h-5 w-5 text-violet-500"/><div><h2 className="text-sm font-extrabold text-[#171923]">Repertorio</h2><p className="text-xs text-slate-500">Canciones y preparación para este servicio.</p></div></div><div className="mt-4 space-y-3">{repertorio.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Sin canciones todavía.</p> : repertorio.map((c:any,i:number)=><div key={c.id} className="rounded-2xl bg-slate-50 p-3"><p className="text-sm font-extrabold text-slate-800">{i+1}. {c.titulo}</p><p className="mt-1 text-xs text-slate-500">{c.tonalidad ? `Tonalidad ${c.tonalidad}`:'Sin tonalidad'}{c.notas ? ` · ${c.notas}`:''}</p>{c.enlace && <a href={c.enlace} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Abrir canción <ExternalLink className="h-3 w-3"/></a>}{puedeProgramar && <details className="mt-3"><summary className="text-[11px] font-bold text-slate-500">Editar</summary><form action={actualizarCancionAlabanza.bind(null,id,evento.id)} className="mt-2 grid gap-2"><input type="hidden" name="cancion_id" value={c.id}/><input name="titulo" defaultValue={c.titulo} required className="h-10 rounded-xl bg-white px-3 text-xs"/><input name="tonalidad" defaultValue={c.tonalidad || ''} placeholder="Tonalidad" className="h-10 rounded-xl bg-white px-3 text-xs"/><input name="enlace" defaultValue={c.enlace || ''} placeholder="Enlace" className="h-10 rounded-xl bg-white px-3 text-xs"/><textarea name="notas" defaultValue={c.notas || ''} placeholder="Notas" className="min-h-16 rounded-xl bg-white p-3 text-xs"/><button className="h-10 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar</button></form><form action={eliminarCancionAlabanza.bind(null,id,evento.id)} className="mt-2"><input type="hidden" name="cancion_id" value={c.id}/><button className="h-10 w-full rounded-xl bg-rose-50 text-xs font-bold text-rose-600">Eliminar</button></form></details>}</div>)}</div>{puedeProgramar && <form action={agregarCancionAlabanza.bind(null,id,evento.id)} className="mt-5 grid gap-2 border-t border-slate-100 pt-4"><p className="text-xs font-extrabold text-slate-700">Agregar canción</p><input name="titulo" required placeholder="Título" className="h-11 rounded-xl bg-slate-50 px-3 text-xs"/><div className="grid grid-cols-2 gap-2"><input name="tonalidad" placeholder="Tonalidad" className="h-11 rounded-xl bg-slate-50 px-3 text-xs"/><input name="enlace" placeholder="Enlace" className="h-11 rounded-xl bg-slate-50 px-3 text-xs"/></div><textarea name="notas" placeholder="Notas" className="min-h-20 rounded-xl bg-slate-50 p-3 text-xs"/><button className="h-11 rounded-xl bg-violet-600 text-xs font-bold text-white">Agregar al repertorio</button></form>}</section>

      <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-center gap-2"><Palette className="h-5 w-5 text-pink-500"/><div><h2 className="text-sm font-extrabold text-[#171923]">Paleta de colores</h2><p className="text-xs text-slate-500">La misma paleta queda ligada a este servicio.</p></div></div><div className="mt-4 flex gap-2">{(colores.length ? colores : defaults).map((c,i)=><span key={`${c}-${i}`} className="h-10 flex-1 rounded-xl ring-1 ring-black/5" style={{backgroundColor:c}}/>)}</div>{paleta?.observaciones && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{paleta.observaciones}</p>}{paleta?.referencia_url && <a href={paleta.referencia_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Referencia visual <ExternalLink className="h-3 w-3"/></a>}{puedePaleta && <form action={guardarPaletaAlabanza.bind(null,id,evento.id)} className="mt-5 grid gap-3 border-t border-slate-100 pt-4"><p className="text-xs font-extrabold text-slate-700">Editar paleta</p><div className="grid grid-cols-4 gap-2">{[0,1,2,3].map(i=><label key={i} className="rounded-xl bg-slate-50 p-2 text-center text-[9px] font-bold uppercase text-slate-400">Color {i+1}<input type="color" name={`color_${i+1}`} defaultValue={colores[i] || defaults[i]} className="mt-1 h-9 w-full border-0 bg-transparent p-0"/></label>)}</div><textarea name="observaciones" defaultValue={paleta?.observaciones || ''} placeholder="Observaciones" className="min-h-20 rounded-xl bg-slate-50 p-3 text-xs"/><input name="referencia_url" defaultValue={paleta?.referencia_url || ''} placeholder="Referencia visual (opcional)" className="h-11 rounded-xl bg-slate-50 px-3 text-xs"/><button className="h-11 rounded-xl bg-pink-600 text-xs font-bold text-white">Guardar paleta</button>{!puedeProgramar && <p className="text-center text-[10px] text-slate-400">Puedes editar la paleta, pero no músicos ni repertorio.</p>}</form>}</section>
    </>}
  </main>
}
