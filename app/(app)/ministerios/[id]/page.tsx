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
      {/* Banner con la identidad del ministerio */}
      <div className="px-4 pt-3 pb-10 text-white" style={{ background: `linear-gradient(135deg, ${min.color_primario}, ${min.color_secundario})` }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{min.emoji}</div>
            <div>
              <h1 className="text-2xl font-bold">{min.nombre}</h1>
              <p className="text-white/80 text-sm">{miembros ?? 0} {miembros === 1 ? 'servidor' : 'servidores'}{esLider ? ' · Eres líder aquí 🛡️' : esMiembro ? ' · Eres parte de este ministerio' : ''}</p>
            </div>
          </div>
          {min.descripcion && <p className="text-white/85 text-sm mt-3 leading-relaxed">{min.descripcion}</p>}
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto -mt-3 space-y-5">
        {/* Herramientas */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/ministerios/${id}/avisos`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <Megaphone className="w-5 h-5" style={{ color: min.color_primario }} />
            <span className="text-sm font-semibold text-[#171923]">Avisos</span>
          </Link>
          <Link href={`/ministerios/${id}/miembros`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <Users className="w-5 h-5" style={{ color: min.color_primario }} />
            <span className="text-sm font-semibold text-[#171923]">Miembros</span>
          </Link>
          {esMiembro && (
            <Link href={`/ministerios/${id}/solicitudes`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <ClipboardList className="w-5 h-5" style={{ color: min.color_primario }} />
              <span className="text-sm font-semibold text-[#171923]">Solicitudes</span>
            </Link>
          )}
          {esLider && (
            <Link href={`/ministerios/${id}/solicitudes-ingreso`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <UserPlus className="w-5 h-5" style={{ color: min.color_primario }} />
              <span className="text-sm font-semibold text-[#171923]">Nuevos servidores</span>
            </Link>
          )}
        </div>

        {/* Panel del líder: publicar y notificar */}
        {esLider && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#171923] mb-3 flex items-center gap-2">
              <Send className="w-4 h-4" style={{ color: min.color_primario }} /> Panel del líder
            </h2>
            <div className="flex gap-2 mb-4">
              <Link href={`/ministerios/${id}/avisos/nuevo`} className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white" style={{ background: min.color_primario }}>
                ✍️ Publicar aviso
              </Link>
            </div>
            <NotificarMinisterioForm ministerioId={id} color={min.color_primario} />
          </section>
        )}

        {/* Eventos del ministerio */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Próximos eventos de {min.nombre}</h2>
          {(!eventosMin || eventosMin.length === 0) && <p className="text-sm text-slate-400 text-center py-6 bg-white rounded-2xl border border-slate-100">Sin eventos próximos.</p>}
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(eventosMin ?? []).map((e: any) => (
              <div key={e.id} className="bg-white rounded-2xl border-l-4 border border-slate-100 shadow-sm p-4 flex items-center gap-4" style={{ borderLeftColor: min.color_primario }}>
                <div className="text-center min-w-[52px] rounded-xl py-2 px-1 text-white" style={{ background: min.color_primario }}>
                  <p className="text-[10px] font-bold uppercase">{new Date(e.fecha_inicio).toLocaleDateString('es', { month: 'short' })}</p>
                  <p className="text-xl font-bold leading-none">{new Date(e.fecha_inicio).getDate()}</p>
                </div>
                <div>
                  <p className="font-bold text-sm text-[#171923]">{e.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(e.fecha_inicio).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true })}{e.ubicacion ? ` · ${e.ubicacion}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Publicaciones recientes del ministerio */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Publicaciones recientes</h2>
          {(!pubs || pubs.length === 0) && <p className="text-sm text-slate-400 text-center py-6 bg-white rounded-2xl border border-slate-100">Aún no hay publicaciones.</p>}
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(pubs ?? []).map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl border-l-4 border border-slate-100 shadow-sm p-4" style={{ borderLeftColor: min.color_primario }}>
                <p className="font-bold text-sm text-[#171923]">{p.titulo}</p>
                {p.cuerpo && <p className="text-sm text-slate-500 mt-1 line-clamp-3">{p.cuerpo}</p>}
                <p className="text-[11px] text-slate-400 mt-2">{p.autor?.nombre_completo} · {new Date(p.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}