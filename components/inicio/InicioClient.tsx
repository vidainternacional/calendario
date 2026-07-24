'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Clock, Megaphone, FileText, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { readUserCache, writeUserCache } from '@/lib/cache/userCache'
import LogoutButton from '@/components/auth/LogoutButton'
import InstallBanner from '@/components/pwa/InstallBanner'
import MinisterioSwitcher from '@/components/inicio/MinisterioSwitcher'
import PublicacionCard from '@/components/avisos/PublicacionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonPage } from '@/components/ui/Skeleton'

type InicioData = {
  profile: any | null
  misEventos: any[]
  membresias: any[]
  publicaciones: any[]
}

type InicioClientProps = {
  userId: string
  email?: string | null
}

const CACHE_SCOPE = 'inicio:v1'
const CACHE_TTL = 15 * 60 * 1000

export default function InicioClient({ userId, email }: InicioClientProps) {
  const [data, setData] = useState<InicioData | null>(() =>
    readUserCache<InicioData>(userId, CACHE_SCOPE),
  )
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      setIsRefreshing(true)
      const supabase = createClient()

      try {
        const [profileRes, misEventosRes, membresiasRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nombre_completo, rol')
            .eq('id', userId)
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
            .eq('evento_asignaciones.profile_id', userId)
            .gte('fecha_inicio', new Date().toISOString())
            .order('fecha_inicio', { ascending: true })
            .limit(5),
          supabase
            .from('ministerio_miembros')
            .select('ministerio_id, es_lider, ministerios ( nombre, emoji, color_primario )')
            .eq('profile_id', userId),
        ])

        const membresias = membresiasRes.data || []
        const ministerioIds = membresias.map((m: any) => m.ministerio_id)

        const publicacionesRes = await supabase
          .from('publicaciones')
          .select(`
            id,
            titulo,
            cuerpo,
            tipo,
            created_at,
            profiles!autor_id (nombre_completo)
          `)
          .or(`ministerio_id.is.null,ministerio_id.in.(${ministerioIds.length > 0 ? ministerioIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
          .eq('estado', 'aprobado')
          .order('created_at', { ascending: false })
          .limit(5)

        const freshData: InicioData = {
          profile: profileRes.data,
          misEventos: misEventosRes.data || [],
          membresias,
          publicaciones: publicacionesRes.data || [],
        }

        if (!cancelled) {
          setData(freshData)
          writeUserCache(userId, CACHE_SCOPE, freshData, CACHE_TTL)
        }
      } finally {
        if (!cancelled) setIsRefreshing(false)
      }
    }

    void refresh()
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!data) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8">
        <SkeletonPage cards={4} />
      </main>
    )
  }

  const { profile, misEventos, membresias, publicaciones } = data
  const nombre = profile?.nombre_completo || email?.split('@')[0] || 'Servidor'
  const rol = profile?.rol as string | undefined
  const inicial = nombre.charAt(0).toUpperCase()
  const puedeGestionarSolicitudes =
    rol === 'pastor' ||
    rol === 'administrador' ||
    membresias.some((m: any) => m.es_lider)

  const estadoConfig = {
    asignado: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    confirmado: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    declinado: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8 landscape:pt-4">
      <header className="mb-6 flex items-start justify-between gap-3 sm:mb-8 sm:items-center landscape:mb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{inicial}</div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Bienvenido,</p>
            <p className="break-words text-sm font-semibold text-[#171923]">{nombre}</p>
            {isRefreshing && <p className="text-[10px] text-gray-400">Actualizando…</p>}
          </div>
        </div>
        <div className="shrink-0"><LogoutButton /></div>
      </header>

      <div className="space-y-6 sm:space-y-8 landscape:space-y-5">
        {membresias.length > 0 && (
          <MinisterioSwitcher
            membresias={membresias.map((m: any) => ({
              ministerio_id: m.ministerio_id,
              es_lider: !!m.es_lider,
              nombre: m.ministerios?.nombre ?? 'Ministerio',
              emoji: m.ministerios?.emoji ?? '⛪',
              color: m.ministerios?.color_primario ?? '#C0392B',
            }))}
          />
        )}

        {puedeGestionarSolicitudes && (
          <section>
            <Link href="/solicitudes" className="group flex min-h-20 flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0"><h3 className="font-bold text-[#171923]">Solicitudes</h3><p className="mt-0.5 break-words text-xs leading-relaxed text-gray-500">Revisa, aprueba o crea solicitudes del ministerio.</p></div>
              </div>
              <span className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors group-hover:bg-indigo-100 sm:w-auto">Abrir</span>
            </Link>
          </section>
        )}

        {membresias.length === 0 && (
          <section data-id="sin-ministerio" className="rounded-2xl bg-gradient-to-br from-[#C0392B] to-[#8e2820] p-5 text-white sm:p-6">
            <h2 className="mb-1.5 text-lg font-bold">¡Bienvenido a la familia! 🙌</h2>
            <p className="mb-4 text-sm leading-relaxed text-white/85">Aún no perteneces a un ministerio. Explora los ministerios de la iglesia y solicita unirte al que Dios puso en tu corazón para servir.</p>
            <Link href="/ministerios" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#C0392B] sm:w-auto">Explorar ministerios →</Link>
          </section>
        )}

        <InstallBanner />

        <section>
          <Link href="/preguntas" className="group flex min-h-20 flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0"><div className="mb-1 flex items-center gap-2"><span className="text-xl">💬</span><h3 className="break-words font-bold text-[#171923]">Buzón de Congregación</h3></div><p className="break-words text-xs leading-relaxed text-gray-500">Envía tus dudas, motivos de oración o sugerencias.</p></div>
            <span className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors group-hover:bg-indigo-100 sm:w-auto">Escribir</span>
          </Link>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2"><Calendar className="h-5 w-5 shrink-0 text-indigo-400" /><h2 className="break-words text-lg font-bold text-[#171923]">Tus próximos eventos</h2></div>
            <Link href="/calendario" className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-indigo-600">Ver todos <ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>

          {misEventos.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No tienes eventos próximos"
              description="Cuando te asignen un turno o una actividad, aparecerá aquí. También puedes revisar el calendario completo."
              action={{ label: 'Abrir calendario', href: '/calendario' }}
              compact
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 landscape:grid-cols-2">
              {misEventos.map((evento: any) => {
                const asignacion = evento.evento_asignaciones[0]
                const config = estadoConfig[asignacion.estado as keyof typeof estadoConfig] || estadoConfig.asignado
                return (
                  <Link href="/calendario" key={evento.id} className="flex min-h-28 gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:gap-4">
                    <div className="flex min-w-12 shrink-0 flex-col items-center justify-center"><span className="text-xs font-medium capitalize text-gray-500">{format(new Date(evento.fecha_inicio), 'MMM', { locale: es })}</span><span className="text-lg font-bold text-[#171923]">{format(new Date(evento.fecha_inicio), 'dd')}</span></div>
                    <div className="min-w-0 flex-1 border-l border-slate-100 pl-3 sm:pl-4">
                      <h3 className="break-words text-sm font-semibold text-[#171923]">{evento.titulo}</h3>
                      <div className="mt-2 flex flex-col gap-1.5"><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color} ${config.border}`}>{asignacion.estado}</span><div className="flex items-center gap-1.5 text-xs text-gray-500"><Clock className="h-3.5 w-3.5 shrink-0" />{format(new Date(evento.fecha_inicio), 'HH:mm')}</div></div>{evento.ubicacion && <div className="flex min-w-0 items-start gap-1.5 text-xs text-gray-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="break-words">{evento.ubicacion}</span></div>}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Megaphone className="h-5 w-5 shrink-0 text-indigo-400" /><h2 className="break-words text-lg font-bold text-[#171923]">Publicaciones recientes</h2></div><Link href="/avisos" className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-indigo-600">Ver todas <ExternalLink className="h-3.5 w-3.5" /></Link></div>
          {publicaciones.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Aún no hay publicaciones recientes"
              description="Los avisos generales y las novedades de tus ministerios aparecerán aquí."
              action={{ label: 'Ir a avisos', href: '/avisos' }}
              compact
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 landscape:grid-cols-2">{publicaciones.map((pub: any) => <PublicacionCard key={pub.id} titulo={pub.titulo} cuerpo={pub.cuerpo} tipo={pub.tipo} fecha={format(new Date(pub.created_at), "d 'de' MMMM", { locale: es })} autor={pub.profiles?.nombre_completo || 'Autor desconocido'} compacta />)}</div>
          )}
        </section>
      </div>
    </main>
  )
}
