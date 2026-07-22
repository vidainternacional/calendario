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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: min }, { data: mem }, { data: pubs }, { count: miembros }, { data: eventosMin }] = await Promise.all([
    db.from('ministerios').select('id, nombre, emoji, color_primario, color_secundario, descripcion').eq('id', id).single(),
    db.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
    db.from('publicaciones').select('id, titulo, cuerpo, created_at, autor:profiles!publicaciones_autor_id_fkey(nombre_completo)').eq('ministerio_id', id).order('created_at', { ascending: false }).limit(5),
    db.from('ministerio_miembros').select('id', { count: 'exact', head: true }).eq('ministerio_id', id),
    db.from('eventos').select('id, titulo, ubicacion, fecha_inicio').eq('ministerio_id', id).gte('fecha_inicio', new Date().toISOString()).order('fecha_inicio').limit(5),
  ])
  if (!min) notFound()

  const { data: perfil } = await db.from('profiles').select('rol').eq('id', user.id).single()
  const esLider = mem?.es_lider === true || ['pastor', 'administrador'].includes(perfil?.rol)
  const esMiembro = !!mem || esLider

  return (
    <main className="pb-28">
      <div
        className="px-4 pb-9 pt-4 text-white sm:pb-10"
        style={{ background: `linear-gradient(135deg, ${min.color_primario}, ${min.color_secundario})` }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="shrink-0 text-4xl sm:text-5xl">{min.emoji}</div>
            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold sm:text-2xl">{min.nombre}</h1>
              <p className="mt-0.5 break-words text-sm leading-relaxed text-white/80">
                {miembros ?? 0} {miembros === 1 ? 'servidor' : 'servidores'}
                {esLider ? ' · Eres líder aquí 🛡️' : esMiembro ? ' · Eres parte de este ministerio' : ''}
              </p>
            </div>
          </div>
          {min.descripcion && (
            <p className="mt-3 break-words text-sm leading-relaxed text-white/85">{min.descripcion}</p>
          )}
        </div>
      </div>

      <div className="mx-auto -mt-3 max-w-2xl space-y-5 px-4">
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
          {esLider && (
            <Link href={`/ministerios/${id}/solicitudes-ingreso`} className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <UserPlus className="h-5 w-5 shrink-0" style={{ color: min.color_primario }} />
              <span className="break-words text-sm font-semibold text-[#171923]">Nuevos servidores</span>
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
