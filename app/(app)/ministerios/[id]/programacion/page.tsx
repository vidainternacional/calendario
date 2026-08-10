import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Music2, Palette, Users } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { agregarCancionAlabanza, actualizarCancionAlabanza, eliminarCancionAlabanza, guardarPaletaAlabanza } from '@/app/actions/programacion-alabanza'
import PaletaAlabanzaEditor from '@/components/ministerios/PaletaAlabanzaEditor'

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

  let repertorio: any[] = []
  let paleta: any = null
  if (evento) {
    const [r, p] = await Promise.all([
      admin.from('evento_repertorio').select('*').eq('evento_id', evento.id).order('orden').order('created_at'),
      admin.from('evento_paletas').select('*').eq('evento_id', evento.id).maybeSingle(),
    ])
    repertorio = r.data || []
    paleta = p.data || null
  }

  const color = ministerio.color_primario || '#5b3df5'
  const colores: string[] = Array.isArray(paleta?.colores) ? paleta.colores : []
  const defaults = ['#111827', '#F8FAFC', '#7C3AED', '#D4A373', '#94A3B8']

  return <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-8">
    <header className="mb-5 flex items-center gap-3"><Link href={`/ministerios/${id}`} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]"><ChevronLeft className="h-5 w-5" /></Link><div><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>{puedeProgramar ? 'Panel del líder' : 'Programación ministerial'}</p><h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">{ministerio.nombre}</h1></div></header>

    {puedeProgramar && <section className="mb-5 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.04]"><Link href={`/ministerios/${id}/programacion/equipo?mes=${mes}${evento ? `&evento=${evento.id}` : ''}`} className="flex min-h-[76px] items-center justify-between gap-3 p-4 active:bg-slate-50"><span className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Users className="h-5 w-5"/></span><span className="min-w-0"><span className="block text-sm font-extrabold text-[#171923]">Programar equipo</span><span className="mt-0.5 block text-xs text-slate-500">Funciones del ministerio, integrantes y asignaciones</span></span></span><ChevronRight className="h-5 w-5 shrink-0 text-slate-300"/></Link></section>}

    <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-extrabold text-[#171923]">Servicios del Calendario</h2><p className="mt-1 text-xs leading-5 text-slate-500">Aquí se prepara el contenido de cada servicio real.</p></div><CalendarDays className="h-5 w-5 text-slate-300" /></div><form method="get" className="mt-4"><input type="month" name="mes" defaultValue={mes} className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100" /><button className="mt-2 h-10 w-full rounded-xl bg-slate-100 text-xs font-bold text-slate-600">Ver mes</button></form><div className="mt-4 space-y-2">{eventos.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">Sin servicios este mes.</p> : eventos.map((e: any) => <Link key={e.id} href={`/ministerios/${id}/programacion?mes=${mes}&evento=${e.id}`} className={`block rounded-2xl p-3 ring-1 ${evento?.id === e.id ? 'bg-indigo-50 ring-indigo-200' : 'bg-slate-50 ring-slate-100'}`}><p className="text-sm font-extrabold text-slate-800">{e.titulo}</p><p className="mt-1 text-xs text-slate-500">{fechaSV(e.fecha_inicio)}{e.ubicacion ? ` · ${e.ubicacion}` : ''}</p></Link>)}</div></section>

    {evento && <>
      <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-center gap-2"><Music2 className="h-5 w-5 text-violet-500"/><div><h2 className="text-sm font-extrabold text-[#171923]">Repertorio</h2><p className="text-xs text-slate-500">Canciones y preparación para este servicio.</p></div></div><div className="mt-4 space-y-3">{repertorio.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Sin canciones todavía.</p> : repertorio.map((c:any,i:number)=><div key={c.id} className="rounded-2xl bg-slate-50 p-3"><p className="text-sm font-extrabold text-slate-800">{i+1}. {c.titulo}</p><p className="mt-1 text-xs text-slate-500">{c.tonalidad ? `Tonalidad ${c.tonalidad}`:'Sin tonalidad'}{c.notas ? ` · ${c.notas}`:''}</p>{c.enlace && <a href={c.enlace} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Abrir canción <ExternalLink className="h-3 w-3"/></a>}{puedeProgramar && <details className="mt-3"><summary className="text-[11px] font-bold text-slate-500">Editar</summary><form action={actualizarCancionAlabanza.bind(null,id,evento.id)} className="mt-2 grid gap-2"><input type="hidden" name="cancion_id" value={c.id}/><input name="titulo" defaultValue={c.titulo} required className="h-10 rounded-xl bg-white px-3 text-xs"/><input name="tonalidad" defaultValue={c.tonalidad || ''} placeholder="Tonalidad" className="h-10 rounded-xl bg-white px-3 text-xs"/><input name="enlace" defaultValue={c.enlace || ''} placeholder="Enlace" className="h-10 rounded-xl bg-white px-3 text-xs"/><textarea name="notas" defaultValue={c.notas || ''} placeholder="Notas" className="min-h-16 rounded-xl bg-white p-3 text-xs"/><button className="h-10 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar</button></form><form action={eliminarCancionAlabanza.bind(null,id,evento.id)} className="mt-2"><input type="hidden" name="cancion_id" value={c.id}/><button className="h-10 w-full rounded-xl bg-rose-50 text-xs font-bold text-rose-600">Eliminar</button></form></details>}</div>)}</div>{puedeProgramar && <form action={agregarCancionAlabanza.bind(null,id,evento.id)} className="mt-5 grid gap-2 border-t border-slate-100 pt-4"><p className="text-xs font-extrabold text-slate-700">Agregar canción</p><input name="titulo" required placeholder="Título" className="h-11 rounded-xl bg-slate-50 px-3 text-xs"/><div className="grid grid-cols-2 gap-2"><input name="tonalidad" placeholder="Tonalidad" className="h-11 rounded-xl bg-slate-50 px-3 text-xs"/><input name="enlace" placeholder="Enlace" className="h-11 rounded-xl bg-slate-50 px-3 text-xs"/></div><textarea name="notas" placeholder="Notas" className="min-h-20 rounded-xl bg-slate-50 p-3 text-xs"/><button className="h-11 rounded-xl bg-violet-600 text-xs font-bold text-white">Agregar al repertorio</button></form>}</section>

      <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-center gap-2"><Palette className="h-5 w-5 text-pink-500"/><div><h2 className="text-sm font-extrabold text-[#171923]">Paleta de colores</h2><p className="text-xs text-slate-500">Vestuario y referencia visual vinculados a este servicio.</p></div></div><div className="mt-4 flex overflow-hidden rounded-xl ring-1 ring-black/5">{(colores.length ? colores : defaults).map((c,i)=><span key={`${c}-${i}`} className="h-12 flex-1" style={{backgroundColor:c}}/>)}</div>{paleta?.observaciones && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{paleta.observaciones}</p>}{paleta?.referencia_url && <a href={paleta.referencia_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Referencia visual <ExternalLink className="h-3 w-3"/></a>}{puedePaleta && <PaletaAlabanzaEditor action={guardarPaletaAlabanza.bind(null,id,evento.id)} initialColors={colores.length ? colores : defaults} initialObservaciones={paleta?.observaciones} initialReferenciaUrl={paleta?.referencia_url} puedeProgramar={puedeProgramar}/>}</section>
    </>}
  </main>
}
