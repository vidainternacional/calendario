import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import InstallBanner from '@/components/pwa/InstallBanner'
import Link from 'next/link'
import MinisterioSwitcher from '@/components/inicio/MinisterioSwitcher'
import { Calendar, MapPin, Clock, Megaphone, Info, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const metadata: Metadata = {
  title: 'Inicio',
}

export default async function InicioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Parallelize independent queries
  const [profileRes, misEventosRes, membresiasRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre_completo, rol')
      .eq('id', user.id)
      .single(),
    supabase
      .from('eventos')
      .select(`
        id,
        titulo,
        fecha_inicio,
        ubicacion,
        evento_asignaciones!inner (
          estado,
          profile_id
        )
      `)
      .eq('evento_asignaciones.profile_id', user.id)
      .gte('fecha_inicio', new Date().toISOString())
      .order('fecha_inicio', { ascending: true })
      .limit(5),
    supabase
      .from('ministerio_miembros')
      .select('ministerio_id, es_lider, ministerios ( nombre, emoji, color_primario )')
      .eq('profile_id', user.id)
  ])

  const profile = profileRes.data
  const misEventos = misEventosRes.data
  const membresias = membresiasRes.data

  const nombre = (profile as any)?.nombre_completo || user.email?.split('@')[0] || 'Servidor'
  const rol = (profile as any)?.rol as string | undefined
  const inicial = nombre.charAt(0).toUpperCase()
  const puedeGestionarSolicitudes =
    rol === 'pastor' ||
    rol === 'administrador' ||
    (membresias || []).some((m: any) => m.es_lider)

  const ministerioIds = membresias?.map((m: any) => m.ministerio_id) || []
  
  const { data: publicaciones } = await supabase
    .from('publicaciones')
    .select(`
      id,
      titulo,
      cuerpo,
      tipo,
      created_at,
      profiles!autor_id (nombre_completo)
    `)
    .or(`ministerio_id.is.null,ministerio_id.in.(${ministerioIds.length > 0 ? ministerioIds.join(',') : 'uuid-00000000-0000-0000-0000-000000000000'})`)
    .eq('estado', 'aprobado')
    .order('created_at', { ascending: false })
    .limit(5)

  const estadoConfig = {
    asignado: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    confirmado: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    declinado: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  }

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm">
            {inicial}
          </div>
          <div>
            <p className="text-xs text-gray-500">Bienvenido,</p>
            <p className="text-sm font-semibold text-[#171923]">{nombre}</p>
          </div>
        </div>
        <LogoutButton />
      </header>

      <div className="space-y-8">
        {membresias && membresias.length > 0 && (
          <MinisterioSwitcher membresias={(membresias as any[]).map((m: any) => ({
            ministerio_id: m.ministerio_id,
            es_lider: !!m.es_lider,
            nombre: m.ministerios?.nombre ?? 'Ministerio',
            emoji: m.ministerios?.emoji ?? '⛪',
            color: m.ministerios?.color_primario ?? '#C0392B',
          }))} />
        )}

        {puedeGestionarSolicitudes && (
          <section>
            <Link
              href="/solicitudes"
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#171923]">Solicitudes</h3>
                  <p className="text-xs text-gray-500">Revisa, aprueba o crea solicitudes del ministerio.</p>
                </div>
              </div>
              <span className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl text-xs font-semibold group-hover:bg-indigo-100 transition-colors shrink-0">
                Abrir
              </span>
            </Link>
          </section>
        )}

        {(!membresias || membresias.length === 0) && (
          <section data-id="sin-ministerio" className="bg-gradient-to-br from-[#C0392B] to-[#8e2820] text-white rounded-[20px] p-6 mb-6">
            <h2 className="text-lg font-bold mb-1.5">¡Bienvenido a la familia! 🙌</h2>
            <p className="text-sm text-white/85 leading-relaxed mb-4">
              Aún no perteneces a un ministerio. Explora los ministerios de la iglesia y solicita unirte al que Dios puso en tu corazón para servir.
            </p>
            <Link href="/ministerios" className="inline-block bg-white text-[#C0392B] text-sm font-bold px-5 py-2.5 rounded-xl">
              Explorar ministerios →
            </Link>
          </section>
        )}
        <InstallBanner />
        
        {/* Buzón Rápido */}
        <section>
          <Link 
            href="/preguntas"
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">💬</span>
                <h3 className="font-bold text-[#171923]">Buzón de Congregación</h3>
              </div>
              <p className="text-xs text-gray-500">Envía tus dudas, motivos de oración o sugerencias.</p>
            </div>
            <div className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl text-xs font-semibold group-hover:bg-indigo-100 transition-colors">
              Escribir
            </div>
          </Link>
        </section>
        
        {/* Próximos Eventos Personales */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-[#171923]">Tus Próximos Eventos</h2>
          </div>

          {!misEventos || misEventos.length === 0 ? (
            <div className="bg-white border border-slate-100 border-dashed rounded-[18px] p-6 text-center">
              <p className="text-sm text-gray-500">No tienes eventos próximos asignados. ¡Disfruta tu tiempo libre!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {misEventos.map((evento: any) => {
                const asignacion = evento.evento_asignaciones[0]
                const config = estadoConfig[asignacion.estado as keyof typeof estadoConfig] || estadoConfig.asignado

                return (
                  <article key={evento.id} className="bg-white border border-slate-100 rounded-[18px] p-4 flex gap-4 shadow-[0_4px_18px_rgba(20,24,40,0.08)]">
                    <div className="flex flex-col items-center justify-center min-w-[3.5rem]">
                      <span className="text-xs text-gray-500 capitalize font-medium">
                        {format(new Date(evento.fecha_inicio), 'MMM', { locale: es })}
                      </span>
                      <span className="text-lg font-bold text-[#171923]">
                        {format(new Date(evento.fecha_inicio), 'dd')}
                      </span>
                    </div>
                    
                    <div className="flex-1 border-l border-slate-100 pl-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-[#171923]">{evento.titulo}</h3>
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${config.bg} ${config.color} ${config.border}`}>
                            {asignacion.estado}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(evento.fecha_inicio), 'HH:mm')}
                          </div>
                        </div>
                        {evento.ubicacion && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="line-clamp-1">{evento.ubicacion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Publicaciones Recientes */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-[#171923]">Publicaciones Recientes</h2>
          </div>

          {!publicaciones || publicaciones.length === 0 ? (
            <div className="bg-white border border-slate-100 border-dashed rounded-[18px] p-6 text-center flex flex-col items-center justify-center gap-2">
              <Info className="w-6 h-6 text-gray-500" />
              <p className="text-sm text-gray-500">No hay publicaciones recientes de tus ministerios.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {publicaciones.map((pub: any) => (
                <article key={pub.id} className="bg-white border border-slate-100 rounded-[18px] p-5 shadow-[0_4px_18px_rgba(20,24,40,0.08)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-gray-600 border border-slate-200">
                      {pub.tipo.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(pub.created_at), "d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-semibold text-[#171923] mb-2">{pub.titulo}</h3>
                  
                  {pub.cuerpo && (
                    <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                      {pub.cuerpo}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-slate-100 pt-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                      {(pub.profiles?.nombre_completo || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span>Por {pub.profiles?.nombre_completo || 'Autor desconocido'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}