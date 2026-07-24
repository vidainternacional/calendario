import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Megaphone, Users, ClipboardList, UserPlus, Send } from 'lucide-react'
import NotificarMinisterioForm from '@/components/ministerios/NotificarMinisterioForm'

export const dynamic = 'force-dynamic'

export default async function MinisterioHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabase as any
  const [
    { data: min },
    { data: mem },
    { data: pubs },
    { count: miembros },
    { data: eventosMin },
    { count: ingresosPendientes },
  ] = await Promise.all([
    db.from('ministerios').select('id, nombre, emoji, color_primario, color_secundario, descripcion').eq('id', id).single(),
    db.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
    db.from('publicaciones').select('id, titulo, cuerpo, created_at, autor:profiles!publicaciones_autor_id_fkey(nombre_completo)').eq('ministerio_id', id).order('created_at', { ascending: false }).limit(5),
    db.from('ministerio_miembros').select('id', { count: 'exact', head: true }).eq('ministerio_id', id),
    db.from('eventos').select('id, titulo, ubicacion, fecha_inicio').eq('ministerio_id', id).gte('fecha_inicio', new Date().toISOString()).order('fecha_inicio').limit(5),
    db.from('ministerio_solicitudes_ingreso').select('id', { count: 'exact', head: true }).eq('ministerio_id', id).eq('estado', 'pendiente'),
  ])
  if (!min) notFound()

  const { data: perfil } = await db.from('profiles').select('rol').eq('id', user.id).single()
  const esLider = mem?.es_lider === true || ['pastor', 'administrador'].includes(perfil?.rol)
  const esMiembro = !!mem || esLider

  return (
    <main className="pb-28">
      <section className="relative isolate min-h-[310px] overflow-hidden text-white sm:min-h-[350px]">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(145deg, ${min.color_primario}, ${min.color_secundario})`,
          }}
        />
        <div
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-30 blur-2xl"
          style={{ backgroundColor: min.color_secundario }}
        />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_84%_74%,rgba(255,255,255,0.12),transparent_24%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute right-5 top-16 select-none text-[7rem] leading-none opacity-[0.12] blur-[0.2px] sm:right-10 sm:text-[9rem]" aria-hidden="true">
          {min.emoji}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/50 to-transparent" />

        <div className="relative mx-auto flex min-h-[310px] max-w-2xl flex-col justify-end px-4 pb-9 pt-[calc(6rem+env(safe-area-inset-top))] sm:min-h-[350px] sm:pb-10">
          <div className="flex min-w-0 items-end gap-3 sm:gap-4">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[3px] border-white/90 bg-white/18 text-3xl shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur-md sm:h-20 sm:w-20 sm:text-4xl"
              aria-hidden="true"
            >
              {min.emoji}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Ministerio</p>
              <h1 className="break-words text-2xl font-bold leading-tight drop-shadow-sm sm:text-3xl">{min.nombre}</h1>
              <p className="mt-1 break-words text-sm leading-relaxed text-white/85">
                {miembros ?? 0} {miembros === 1 ? 'servidor' : 'servidores'}
                {esLider ? ' · Eres líder aquí' : esMiembro ? ' · Eres parte de este ministerio' : ''}
              </p>
            </div>
          </div>
          {min.descripcion && (
            <p className="mt-4 max-w-xl break-words text-sm leading-relaxed text-white/85 drop-shadow-sm">{min.descripcion}</p>
          )}
        </div>
      </section>

      <div className="mx-auto mt-4 max-w-2xl space-y-5 px-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href={`/ministerios/${id}/avisos`} className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <Megaphone className="h-5 w-5 shrink-0" style={{ color: min.color_primario }} />
            <span className="break-words text-sm font-semibold text-[#171923]">Avisos</span>
          </Link>
          <Link href={`/ministerios/${id}/miembros`} className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <Users className="h-5 w-5 shrink-0" style={{ color: min.color_primario }} />
            <span className="break-words text-sm font-semibold text-[#171923]">Miembros</span>
          </Link>
          {esMiembro && (
            <Link href={`/ministerios/${id}/solicitudes`} className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <ClipboardList className="h-5 w-5 shrink-0" style={{ color: min.color_primario }} />
              <span className="break-words text-sm font-semibold text-[#171923]">Solicitudes</span>
            </Link>
          )}
          {esLider && (ingresosPendientes || 0) > 0 && (
            <Link href={`/ministerios/${id}/solicitudes-ingreso`} className="flex min-h-14 items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
              <UserPlus className="h-5 w-5 shrink-0" style={{ color: min.color_primario }} />
              <span className="break-words text-sm font-semibold text-[#171923]">
                {ingresosPendientes === 1 ? '1 nuevo servidor' : `${ingresosPendientes} nuevos servidores`}
              </span>
            </Link>
          )}
        </div>

        {esLider && (
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#171923]">
              <Send className="h-4 w-4 shrink-0" style={{ color: min.color_primario }} /> Panel del líder
            </h2>
            <div className="mb-4">
              <Link
                href={`/ministerios/${id}/avisos/nuevo`}
                className="flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white"
                style={{ background: min.color_primario }}
              >
                ✍️ Publicar aviso
              </Link>
            </div>
            <NotificarMinisterioForm ministerioId={id} color={min.color_primario} />
          </section>
        )}

        <section>
          <h2 className="mb-3 break-words text-xs font-bold uppercase tracking-wide text-slate-400">Próximos eventos de {min.nombre}</h2>
          {(!eventosMin || eventosMin.length === 0) && (
            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-center text-sm text-slate-400">Sin eventos próximos.</p>
          )}
          <div className="space-y-3">
            {(eventosMin ?? []).map((e: any) => (
              <div key={e.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-l-4 border-slate-100 bg-white p-4 shadow-sm sm:gap-4" style={{ borderLeftColor: min.color_primario }}>
                <div className="min-w-[52px] shrink-0 rounded-xl px-1 py-2 text-center text-white" style={{ background: min.color_primario }}>
                  <p className="text-[10px] font-bold uppercase">{new Date(e.fecha_inicio).toLocaleDateString('es', { month: 'short' })}</p>
                  <p className="text-xl font-bold leading-none">{new Date(e.fecha_inicio).getDate()}</p>
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-[#171923]">{e.titulo}</p>
                  <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-500">
                    {new Date(e.fecha_inicio).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    {e.ubicacion ? ` · ${e.ubicacion}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Publicaciones recientes</h2>
          {(!pubs || pubs.length === 0) && (
            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-center text-sm text-slate-400">Aún no hay publicaciones.</p>
          )}
          <div className="space-y-3">
            {(pubs ?? []).map((p: any) => (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-l-4 border-slate-100 bg-white p-4 shadow-sm" style={{ borderLeftColor: min.color_primario }}>
                <p className="break-words text-sm font-bold text-[#171923]">{p.titulo}</p>
                {p.cuerpo && <p className="mt-1 line-clamp-3 break-words text-sm leading-relaxed text-slate-500">{p.cuerpo}</p>}
                <p className="mt-2 break-words text-[11px] text-slate-400">{p.autor?.nombre_completo} · {new Date(p.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
