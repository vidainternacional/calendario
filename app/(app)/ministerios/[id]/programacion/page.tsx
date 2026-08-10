import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { CalendarDays, ChevronLeft, ExternalLink, Music2, Palette, Trash2, UserPlus, Users } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  agregarCancionAlabanza,
  asignarServidorAlabanza,
  actualizarCancionAlabanza,
  eliminarCancionAlabanza,
  guardarPaletaAlabanza,
  quitarServidorAlabanza,
} from '@/app/actions/programacion-alabanza'

export const dynamic = 'force-dynamic'

function mesActualSV() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit' }).formatToParts(new Date())
  const year = parts.find((p) => p.type === 'year')?.value || '2026'
  const month = parts.find((p) => p.type === 'month')?.value || '01'
  return `${year}-${month}`
}

function rangoMes(mes: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(mes)
  const y = match ? Number(match[1]) : Number(mesActualSV().slice(0, 4))
  const m = match ? Number(match[2]) : Number(mesActualSV().slice(5, 7))
  const nextY = m === 12 ? y + 1 : y
  const nextM = m === 12 ? 1 : m + 1
  const start = `${y}-${String(m).padStart(2, '0')}-01T00:00:00-06:00`
  const end = `${nextY}-${String(nextM).padStart(2, '0')}-01T00:00:00-06:00`
  return { start, end }
}

function formatFecha(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function ProgramacionMinisterialPage({
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
  const [{ data: ministerio }, { data: profile }, { data: membresia }, { data: responsabilidad }] = await Promise.all([
    admin.from('ministerios').select('id,nombre,emoji,color_primario').eq('id', id).maybeSingle(),
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
    admin
      .from('ministerio_responsabilidad_asignaciones')
      .select('id, ministerio_responsabilidades!inner(codigo,activo)')
      .eq('profile_id', user.id)
      .eq('ministerio_responsabilidades.codigo', 'paleta_colores')
      .eq('ministerio_responsabilidades.activo', true)
      .maybeSingle(),
  ])

  if (!ministerio) notFound()
  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') redirect('/inicio')

  const puedeProgramar = ['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true
  const puedePaleta = puedeProgramar || !!responsabilidad
  if (!puedeProgramar && !puedePaleta) redirect(`/ministerios/${id}`)

  const mes = /^\d{4}-\d{2}$/.test(query.mes || '') ? query.mes! : mesActualSV()
  const { start, end } = rangoMes(mes)
  const { data: eventos = [] } = await admin
    .from('eventos')
    .select('id,titulo,fecha_inicio,fecha_fin,ubicacion,descripcion')
    .eq('ministerio_id', id)
    .gte('fecha_inicio', start)
    .lt('fecha_inicio', end)
    .order('fecha_inicio', { ascending: true })

  const eventoSeleccionado = eventos.find((e: any) => e.id === query.evento) || eventos[0] || null
  let asignaciones: any[] = []
  let repertorio: any[] = []
  let paleta: any = null
  let capacidades: any[] = []
  let candidatosPorCapacidad = new Map<string, any[]>()

  if (eventoSeleccionado) {
    const [asigRes, repRes, palRes, capRes, miembrosRes] = await Promise.all([
      admin.from('evento_asignaciones').select('id,profile_id,estado,capacidad_id').eq('evento_id', eventoSeleccionado.id).order('created_at'),
      admin.from('evento_repertorio').select('*').eq('evento_id', eventoSeleccionado.id).order('orden').order('created_at'),
      admin.from('evento_paletas').select('*').eq('evento_id', eventoSeleccionado.id).maybeSingle(),
      admin.from('ministerio_capacidades').select('id,nombre,categoria,orden').eq('ministerio_id', id).eq('activo', true).order('orden'),
      admin.from('ministerio_miembros').select('profile_id').eq('ministerio_id', id),
    ])
    asignaciones = asigRes.data || []
    repertorio = repRes.data || []
    paleta = palRes.data || null
    capacidades = capRes.data || []

    const miembroIds = (miembrosRes.data || []).map((m: any) => m.profile_id)
    if (miembroIds.length > 0) {
      const [{ data: perfiles = [] }, { data: capacidadesMiembro = [] }] = await Promise.all([
        admin.from('profiles').select('id,nombre_completo,avatar_url,activo,estado_cuenta').in('id', miembroIds),
        admin.from('ministerio_miembro_capacidades').select('profile_id,capacidad_id').eq('ministerio_id', id).in('profile_id', miembroIds),
      ])
      const perfilPorId = new Map(perfiles.map((p: any) => [p.id, p]))
      candidatosPorCapacidad = new Map()
      for (const item of capacidadesMiembro) {
        const persona = perfilPorId.get(item.profile_id)
        if (!persona || persona.activo !== true || persona.estado_cuenta !== 'activo') continue
        const lista = candidatosPorCapacidad.get(item.capacidad_id) || []
        lista.push(persona)
        candidatosPorCapacidad.set(item.capacidad_id, lista)
      }

      asignaciones = asignaciones.map((a: any) => ({
        ...a,
        persona: perfilPorId.get(a.profile_id) || null,
        capacidad: capacidades.find((c: any) => c.id === a.capacidad_id) || null,
      }))
    }
  }

  const color = ministerio.color_primario || '#5b3df5'
  const colores = Array.isArray(paleta?.colores) ? paleta.colores : []
  const colorDefault = ['#111827', '#f8fafc', '#7c3aed', '#d4a373']

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-8">
      <div className="mb-5 flex items-center gap-3">
        <Link href={`/ministerios/${id}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-black/[0.04]" aria-label="Volver al ministerio"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>Programación ministerial</p>
          <h1 className="truncate text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">{ministerio.nombre}</h1>
        </div>
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-extrabold text-[#171923]">Servicios del Calendario</p><p className="mt-1 text-xs text-slate-500">No se crean fechas aquí. Se usan los eventos reales del ministerio.</p></div>
          <CalendarDays className="h-5 w-5 text-slate-300" />
        </div>
        <form method="get" className="mt-4">
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Mes
            <input type="month" name="mes" defaultValue={mes} className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-100" />
          </label>
          <button className="mt-2 h-10 w-full rounded-xl bg-slate-100 text-xs font-bold text-slate-600">Ver mes</button>
        </form>

        {eventos.length === 0 ? <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-7 text-center text-sm text-slate-400">No hay servicios de {ministerio.nombre} en este mes.</p> : <div className="mt-4 space-y-2">{eventos.map((evento: any) => {
          const activo = eventoSeleccionado?.id === evento.id
          return <Link key={evento.id} href={`/ministerios/${id}/programacion?mes=${mes}&evento=${evento.id}`} className={`block rounded-2xl p-3 ring-1 transition ${activo ? 'bg-indigo-50 ring-indigo-200' : 'bg-slate-50 ring-slate-100'}`}><p className="text-sm font-extrabold text-[#171923]">{evento.titulo}</p><p className="mt-1 text-xs text-slate-500">{formatFecha(evento.fecha_inicio)}{evento.ubicacion ? ` · ${evento.ubicacion}` : ''}</p></Link>
        })}</div>}
      </section>

      {eventoSeleccionado && <>
        <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-500" /><div><h2 className="text-sm font-extrabold text-[#171923]">Equipo del servicio</h2><p className="text-xs text-slate-500">{formatFecha(eventoSeleccionado.fecha_inicio)}</p></div></div>
          {asignaciones.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Todavía no hay servidores asignados.</p> : <div className="mt-4 space-y-2">{asignaciones.map((asignacion: any) => <div key={asignacion.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 text-sm font-extrabold text-indigo-600">{asignacion.persona?.avatar_url ? <img src={asignacion.persona.avatar_url} alt="" className="h-full w-full object-cover" /> : (asignacion.persona?.nombre_completo || 'U').charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{asignacion.persona?.nombre_completo || 'Servidor'}</p><p className="truncate text-xs text-slate-500">{asignacion.capacidad?.nombre || 'Función pendiente'} · {asignacion.estado}</p></div>{puedeProgramar && <form action={quitarServidorAlabanza.bind(null, id, eventoSeleccionado.id)}><input type="hidden" name="asignacion_id" value={asignacion.id} /><button className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500" aria-label="Quitar del servicio"><Trash2 className="h-4 w-4" /></button></form>}</div>)}</div>}

          {puedeProgramar && <div className="mt-5 border-t border-slate-100 pt-4"><div className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-indigo-500" /><p className="text-xs font-extrabold text-slate-700">Asignar por función compatible</p></div><div className="mt-3 space-y-3">{capacidades.map((capacidad: any) => {
            const candidatos = candidatosPorCapacidad.get(capacidad.id) || []
            return <form key={capacidad.id} action={asignarServidorAlabanza.bind(null, id, eventoSeleccionado.id)} className="rounded-2xl border border-slate-100 p-3"><input type="hidden" name="capacidad_id" value={capacidad.id} /><p className="text-xs font-bold text-slate-700">{capacidad.nombre}</p>{candidatos.length === 0 ? <p className="mt-2 text-[11px] text-slate-400">No hay candidatos con esta capacidad oficial.</p> : <div className="mt-2 flex gap-2"><select name="profile_id" required className="h-11 min-w-0 flex-1 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none">{candidatos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}</select><button className="h-11 shrink-0 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white">Asignar</button></div>}</form>
          })}</div></div>}
        </section>

        <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-2"><Music2 className="h-5 w-5 text-violet-500" /><div><h2 className="text-sm font-extrabold text-[#171923]">Repertorio</h2><p className="text-xs text-slate-500">Canciones, tonalidades, enlaces y notas de este servicio.</p></div></div>
          {repertorio.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Todavía no hay canciones agregadas.</p> : <div className="mt-4 space-y-3">{repertorio.map((cancion: any, index: number) => <div key={cancion.id} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-[11px] font-black text-violet-600">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-800">{cancion.titulo}</p><p className="mt-0.5 text-xs text-slate-500">{cancion.tonalidad ? `Tonalidad ${cancion.tonalidad}` : 'Sin tonalidad'}{cancion.notas ? ` · ${cancion.notas}` : ''}</p>{cancion.enlace && <a href={cancion.enlace} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Abrir canción <ExternalLink className="h-3 w-3" /></a>}</div></div>{puedeProgramar && <details className="mt-3"><summary className="cursor-pointer text-[11px] font-bold text-slate-500">Editar canción</summary><form action={actualizarCancionAlabanza.bind(null, id, eventoSeleccionado.id)} className="mt-3 grid gap-2"><input type="hidden" name="cancion_id" value={cancion.id} /><input name="titulo" defaultValue={cancion.titulo} required className="h-11 rounded-xl bg-white px-3 text-xs ring-1 ring-slate-200" /><input name="tonalidad" defaultValue={cancion.tonalidad || ''} placeholder="Tonalidad" className="h-11 rounded-xl bg-white px-3 text-xs ring-1 ring-slate-200" /><input name="enlace" defaultValue={cancion.enlace || ''} placeholder="Enlace" className="h-11 rounded-xl bg-white px-3 text-xs ring-1 ring-slate-200" /><textarea name="notas" defaultValue={cancion.notas || ''} placeholder="Notas" className="min-h-20 rounded-xl bg-white p-3 text-xs ring-1 ring-slate-200" /><button className="h-11 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar cambios</button></form><form action={eliminarCancionAlabanza.bind(null, id, eventoSeleccionado.id)} className="mt-2"><input type="hidden" name="cancion_id" value={cancion.id} /><button className="h-10 w-full rounded-xl bg-rose-50 text-xs font-bold text-rose-600">Eliminar canción</button></form></details>}</div>)}</div>}

          {puedeProgramar && <form action={agregarCancionAlabanza.bind(null, id, eventoSeleccionado.id)} className="mt-5 grid gap-2 border-t border-slate-100 pt-4"><p className="text-xs font-extrabold text-slate-700">Agregar canción</p><input name="titulo" required placeholder="Título" className="h-11 rounded-xl bg-slate-50 px-3 text-xs outline-none ring-1 ring-slate-100" /><div className="grid grid-cols-2 gap-2"><input name="tonalidad" placeholder="Tonalidad" className="h-11 rounded-xl bg-slate-50 px-3 text-xs outline-none ring-1 ring-slate-100" /><input name="enlace" placeholder="Enlace" className="h-11 rounded-xl bg-slate-50 px-3 text-xs outline-none ring-1 ring-slate-100" /></div><textarea name="notas" placeholder="Notas de preparación" className="min-h-20 rounded-xl bg-slate-50 p-3 text-xs outline-none ring-1 ring-slate-100" /><button className="h-11 rounded-xl bg-violet-600 text-xs font-bold text-white">Agregar al repertorio</button></form>}
        </section>

        <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-pink-500" /><div><h2 className="text-sm font-extrabold text-[#171923]">Paleta de colores</h2><p className="text-xs text-slate-500">Pertenece a este servicio y se comparte con el equipo de Alabanza.</p></div></div>
          <div className="mt-4 flex gap-2">{(colores.length ? colores : colorDefault).map((c: string, i: number) => <span key={`${c}-${i}`} className="h-10 flex-1 rounded-xl ring-1 ring-black/5" style={{ backgroundColor: c }} title={c} />)}</div>
          {paleta?.observaciones && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{paleta.observaciones}</p>}
          {paleta?.referencia_url && <a href={paleta.referencia_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Ver referencia visual <ExternalLink className="h-3 w-3" /></a>}

          {puedePaleta && <form action={guardarPaletaAlabanza.bind(null, id, eventoSeleccionado.id)} className="mt-5 grid gap-3 border-t border-slate-100 pt-4"><p className="text-xs font-extrabold text-slate-700">Editar paleta</p><div className="grid grid-cols-4 gap-2">{[0,1,2,3].map((i) => <label key={i} className="rounded-xl bg-slate-50 p-2 text-center text-[9px] font-bold uppercase text-slate-400">Color {i + 1}<input type="color" name={`color_${i + 1}`} defaultValue={colores[i] || colorDefault[i]} className="mt-1 h-10 w-full cursor-pointer rounded-lg border-0 bg-transparent p-0" /></label>)}</div><textarea name="observaciones" defaultValue={paleta?.observaciones || ''} placeholder="Observaciones para el equipo" className="min-h-20 rounded-xl bg-slate-50 p-3 text-xs outline-none ring-1 ring-slate-100" /><input name="referencia_url" defaultValue={paleta?.referencia_url || ''} placeholder="Enlace de referencia visual (opcional)" className="h-11 rounded-xl bg-slate-50 px-3 text-xs outline-none ring-1 ring-slate-100" /><button className="h-11 rounded-xl bg-pink-600 text-xs font-bold text-white">Guardar paleta</button>{!puedeProgramar && <p className="text-center text-[10px] leading-4 text-slate-400">Tu responsabilidad especial permite editar únicamente esta sección; no puedes cambiar músicos ni repertorio.</p>}</form>}
        </section>
      </>}
    </main>
  )
}
