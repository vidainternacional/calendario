'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  HeartHandshake,
  Mail,
  MapPin,
  UsersRound,
  X,
} from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { readUserCache, writeUserCache } from '@/lib/cache/userCache'
import MinisterioSwitcher from '@/components/inicio/MinisterioSwitcher'
import MaterialesInicio, { type MaterialVisible } from '@/components/inicio/MaterialesInicio'
import PublicacionCard from '@/components/avisos/PublicacionCard'
import {
  useUnreadPublicationIds,
  useUnreadPublicationsCount,
} from '@/components/avisos/usePublicationReads'
import InstallBanner from '@/components/pwa/InstallBanner'
import ShineSweep from '@/components/ui/ShineSweep'
import { SkeletonPage } from '@/components/ui/Skeleton'
import UserAvatar from '@/components/comunidad/UserAvatar'

type InicioData = {
  profile: any | null
  misEventos: any[]
  membresias: any[]
  publicaciones: any[]
  materiales: MaterialVisible[]
}

type InicioClientProps = {
  userId: string
  email?: string | null
}

const CACHE_SCOPE = 'inicio:v5'
const CACHE_TTL = 10 * 60 * 1000

const estadoConfig = {
  asignado: { label: 'Asignado', dot: 'bg-amber-400' },
  confirmado: { label: 'Confirmado', dot: 'bg-emerald-400' },
  declinado: { label: 'Declinado', dot: 'bg-rose-400' },
} as const

function capitalize(text: string) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function greetingFor(date: Date | null) {
  if (!date) return 'Bienvenido'
  const hour = date.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function eventStatus(evento: any) {
  const estado = evento?.evento_asignaciones?.[0]?.estado as keyof typeof estadoConfig | undefined
  return estadoConfig[estado || 'asignado'] || estadoConfig.asignado
}

export default function InicioClient({ userId, email }: InicioClientProps) {
  const [data, setData] = useState<InicioData | null>(() =>
    readUserCache<InicioData>(userId, CACHE_SCOPE),
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [clock, setClock] = useState<Date | null>(null)
  const [avisosPreviewOpen, setAvisosPreviewOpen] = useState(false)

  useEffect(() => {
    const updateClock = () => setClock(new Date())
    updateClock()
    const interval = window.setInterval(updateClock, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      setIsRefreshing(true)
      const supabase = createClient()

      try {
        const [profileRes, misEventosRes, membresiasRes, materialesRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nombre_completo, avatar_url, rol, acceso_centro_pastoral')
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
            .limit(4),
          supabase
            .from('ministerio_miembros')
            .select('ministerio_id, es_lider, ministerios ( nombre, emoji, color_primario )')
            .eq('profile_id', userId),
          (supabase as any).rpc('get_visible_pastoral_packages'),
        ])

        const membresias = membresiasRes.data || []
        const ministerioIds = membresias.map((m: any) => m.ministerio_id)
        const role = (profileRes.data as any)?.rol as string | undefined
        const puedeVerTodoAvisos = role === 'pastor' || role === 'administrador'

        let publicacionesQuery = supabase
          .from('publicaciones')
          .select(`
            id,
            titulo,
            cuerpo,
            tipo,
            created_at,
            profiles!autor_id (nombre_completo, avatar_url)
          `)
          .eq('estado', 'aprobado')
          .order('created_at', { ascending: false })
          .limit(100)

        if (!puedeVerTodoAvisos) {
          publicacionesQuery = publicacionesQuery.or(
            `ministerio_id.is.null,ministerio_id.in.(${ministerioIds.length > 0 ? ministerioIds.join(',') : '00000000-0000-0000-0000-000000000000'})`,
          )
        }

        const publicacionesRes = await publicacionesQuery

        const freshData: InicioData = {
          profile: profileRes.data,
          misEventos: misEventosRes.data || [],
          membresias,
          publicaciones: publicacionesRes.data || [],
          materiales: (materialesRes.data || []) as MaterialVisible[],
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

  useEffect(() => {
    if (!avisosPreviewOpen) return
    const scrollY = window.scrollY
    const body = document.body
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAvisosPreviewOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.overflow = previous.overflow
      window.scrollTo(0, scrollY)
    }
  }, [avisosPreviewOpen])

  const currentPublicationIds = (data?.publicaciones || []).map((pub: any) => String(pub.id))
  const unreadIds = useUnreadPublicationIds(currentPublicationIds)
  const unreadCount = useUnreadPublicationsCount()

  if (!data) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
        <SkeletonPage cards={4} />
      </main>
    )
  }

  const { profile, misEventos, membresias, publicaciones, materiales = [] } = data
  const nombre = profile?.nombre_completo || email?.split('@')[0] || 'Servidor'
  const firstNameRaw = nombre.trim().split(/\s+/)[0] || 'Servidor'
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1)
  const rol = profile?.rol as string | undefined
  const puedeGestionarSolicitudes =
    rol === 'pastor' ||
    rol === 'administrador' ||
    membresias.some((m: any) => m.es_lider)
  const puedeAbrirCentroPastoral =
    Boolean(profile?.acceso_centro_pastoral) || rol === 'pastor' || rol === 'administrador'

  const nextEvent = misEventos[0] || null
  const nextEventStart = nextEvent ? new Date(nextEvent.fecha_inicio) : null
  const nextEventIsToday = Boolean(clock && nextEventStart && isSameDay(nextEventStart, clock))
  const nextEventState = nextEvent ? eventStatus(nextEvent) : estadoConfig.asignado
  const todayLabel = clock
    ? capitalize(format(clock, "EEEE, d 'de' MMMM", { locale: es }))
    : 'Tu espacio personal en VIDA'

  const avisosPreview = avisosPreviewOpen && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[9997] flex items-end justify-center bg-slate-950/35 px-0 backdrop-blur-[2px] sm:items-center sm:px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setAvisosPreviewOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="avisos-preview-title"
            className="flex max-h-[86dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[30px] border border-white/80 bg-[#f7f8fb] shadow-[0_-18px_60px_rgba(15,23,42,0.22)] sm:rounded-[30px]"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-4 backdrop-blur-xl sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-indigo-500">Vista rápida</p>
                <h2 id="avisos-preview-title" className="mt-0.5 text-xl font-bold tracking-[-0.025em] text-[#171923]">Avisos para ti</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'} · los dos checks indican leído
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvisosPreviewOpen(false)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95"
                aria-label="Cerrar vista rápida de avisos"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch] sm:px-4">
              {publicaciones.length === 0 ? (
                <div className="rounded-[22px] border border-white bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
                  No hay avisos disponibles por ahora.
                </div>
              ) : (
                <div className="overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.06)]">
                  {publicaciones.map((pub: any) => (
                    <PublicacionCard
                      key={pub.id}
                      publicationId={String(pub.id)}
                      unread={unreadIds.has(String(pub.id))}
                      titulo={pub.titulo}
                      cuerpo={pub.cuerpo}
                      tipo={pub.tipo}
                      fecha={format(new Date(pub.created_at), "d 'de' MMM", { locale: es })}
                      autor={pub.profiles?.nombre_completo || 'Autor desconocido'}
                      autorAvatarUrl={pub.profiles?.avatar_url ?? null}
                      variant="row"
                    />
                  ))}
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-slate-200/80 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
              <Link
                href="/avisos"
                onClick={() => setAvisosPreviewOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(79,70,229,0.22)] transition active:scale-[0.99]"
              >
                Abrir todos los avisos
              </Link>
            </footer>
          </section>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(.85rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
        <header className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.02em] text-slate-500">{todayLabel}</p>
            <h1 className="mt-1 truncate text-[26px] font-bold leading-tight tracking-[-0.035em] text-[#171923]">
              {greetingFor(clock)}, {firstName}
            </h1>
            {isRefreshing && (
              <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                Actualizando
              </span>
            )}
          </div>

          <UserAvatar
            nombre={nombre}
            avatarUrl={profile?.avatar_url}
            size="lg"
            className="shadow-[0_8px_20px_rgba(79,70,229,0.22)] ring-4 ring-white/80"
          />
        </header>

        <div className="space-y-5 sm:space-y-6">
          <section aria-label="Tu próxima actividad">
            {nextEvent && nextEventStart ? (
              <Link
                href={`/calendario?evento=${encodeURIComponent(String(nextEvent.id))}&fecha=${encodeURIComponent(String(nextEvent.fecha_inicio))}`}
                className="group relative block overflow-hidden rounded-[24px] border border-white/90 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.07)] transition active:scale-[0.993] sm:p-5"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#5b3df5] via-[#8b5cf6] to-[#5b3df5]" aria-hidden="true" />
                <ShineSweep className="opacity-25" />

                <div className="relative flex min-w-0 items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5b3df5] to-[#7c3aed] text-white shadow-[0_6px_16px_rgba(91,61,245,0.22)]">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[12px] font-extrabold text-[#171923]">Vida Internacional</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-500">
                        {nextEventIsToday ? 'Hoy' : 'Próxima actividad'}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {nextEventIsToday
                        ? format(nextEventStart, 'h:mm a', { locale: es })
                        : capitalize(format(nextEventStart, "EEE d MMM · h:mm a", { locale: es }))}
                    </span>
                  </span>
                </div>

                <div className="relative mt-4">
                  <h2 className="line-clamp-2 text-[19px] font-bold leading-snug tracking-[-0.02em] text-[#171923]">{nextEvent.titulo}</h2>
                  {nextEvent.ubicacion && (
                    <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden="true" />
                      <span className="truncate">{nextEvent.ubicacion}</span>
                    </p>
                  )}
                </div>

                <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-100">
                    <span className={`h-1.5 w-1.5 rounded-full ${nextEventState.dot}`} />
                    {nextEventState.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600">
                    Ver evento
                    <ChevronRight className="h-4 w-4 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex min-h-[118px] items-center gap-4 rounded-[28px] border border-white/90 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                  <CalendarDays className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold tracking-[0.14em] text-violet-600">HOY</span>
                  <span className="mt-1 block text-lg font-bold tracking-[-0.02em] text-[#171923]">Tu agenda está libre por ahora</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">No tienes actividades asignadas próximas.</span>
                </span>
              </div>
            )}
          </section>

          <MaterialesInicio
            materiales={materiales}
            mode="preparation"
            puedeAbrirCentroPastoral={puedeAbrirCentroPastoral}
          />

          {membresias.length > 0 ? (
            <MinisterioSwitcher
              membresias={membresias.map((m: any) => ({
                ministerio_id: m.ministerio_id,
                es_lider: !!m.es_lider,
                nombre: m.ministerios?.nombre ?? 'Ministerio',
                emoji: m.ministerios?.emoji ?? '⛪',
                color: m.ministerios?.color_primario ?? '#5B3DF5',
              }))}
            />
          ) : (
            <section aria-label="Explorar ministerios">
              <Link
                href="/ministerios"
                className="group relative flex min-h-[84px] items-center gap-3 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#5b3df5] via-[#6d43f5] to-[#7c3aed] px-4 py-3.5 text-white shadow-[0_14px_34px_rgba(91,61,245,0.22)] ring-1 ring-white/20 transition active:scale-[0.992]"
              >
                <ShineSweep />
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
                  <UsersRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/75">SERVIR</span>
                  <span className="mt-1 block text-[16px] font-bold tracking-[-0.02em] text-white">Explorar ministerios</span>
                  <span className="mt-0.5 block text-[11px] text-white/72">Encuentra un equipo donde puedas servir.</span>
                </span>
                <ChevronRight className="relative h-5 w-5 shrink-0 text-white/80 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
              </Link>
            </section>
          )}

          <section aria-labelledby="publicaciones-inicio">
            <div className="mb-3 flex items-end justify-between gap-3 px-1">
              <div className="min-w-0">
                <h2 id="publicaciones-inicio" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">Avisos para ti</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">Desliza dentro del bloque para revisar más.</p>
              </div>
              {publicaciones.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAvisosPreviewOpen(true)}
                  aria-haspopup="dialog"
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm transition active:scale-95 ${
                    unreadCount > 0 ? 'bg-rose-500 text-white' : 'bg-white text-indigo-600 ring-1 ring-slate-200'
                  }`}
                >
                  {unreadCount > 0 ? `${unreadCount > 99 ? '99+' : unreadCount} nuevo${unreadCount === 1 ? '' : 's'}` : 'Vista rápida'}
                </button>
              )}
            </div>

            {publicaciones.length === 0 ? (
              <div className="rounded-[24px] border border-white/90 bg-white px-4 py-5 text-sm text-slate-500 shadow-[0_8px_26px_rgba(15,23,42,0.045)]">
                No hay avisos nuevos por ahora.
              </div>
            ) : (
              <div className="max-h-[228px] overflow-y-auto overscroll-contain rounded-[24px] border border-white/90 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)] [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]">
                {publicaciones.map((pub: any) => (
                  <PublicacionCard
                    key={pub.id}
                    publicationId={String(pub.id)}
                    unread={unreadIds.has(String(pub.id))}
                    titulo={pub.titulo}
                    cuerpo={pub.cuerpo}
                    tipo={pub.tipo}
                    fecha={format(new Date(pub.created_at), "d 'de' MMM", { locale: es })}
                    autor={pub.profiles?.nombre_completo || 'Autor desconocido'}
                    autorAvatarUrl={pub.profiles?.avatar_url ?? null}
                    variant="row"
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="herramientas-inicio">
            <div className="mb-3 px-1">
              <h2 id="herramientas-inicio" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">Herramientas</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Atajos distintos según tu responsabilidad.</p>
            </div>

            <div className={`grid gap-3 ${puedeGestionarSolicitudes ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <Link href="/preguntas" className="group flex min-w-0 flex-col items-center rounded-[22px] border border-white/90 bg-white px-2 py-4 text-center shadow-[0_7px_22px_rgba(15,23,42,0.045)] transition active:scale-[0.985]">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-indigo-600 text-white shadow-[0_6px_16px_rgba(79,70,229,0.2)]">
                  <Mail className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="mt-2.5 text-[12px] font-bold text-[#171923]">Buzón</span>
                <span className="mt-0.5 line-clamp-2 text-[9px] leading-3.5 text-slate-400">Preguntas y oración</span>
              </Link>

              {puedeGestionarSolicitudes && (
                <Link href="/solicitudes" className="group flex min-w-0 flex-col items-center rounded-[22px] border border-white/90 bg-white px-2 py-4 text-center shadow-[0_7px_22px_rgba(15,23,42,0.045)] transition active:scale-[0.985]">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-amber-500 text-white shadow-[0_6px_16px_rgba(245,158,11,0.2)]">
                    <FileText className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="mt-2.5 text-[12px] font-bold text-[#171923]">Solicitudes</span>
                  <span className="mt-0.5 line-clamp-2 text-[9px] leading-3.5 text-slate-400">Recursos del equipo</span>
                </Link>
              )}

              <Link href="/ayuda-solidaria" className="group flex min-w-0 flex-col items-center rounded-[22px] border border-white/90 bg-white px-2 py-4 text-center shadow-[0_7px_22px_rgba(15,23,42,0.045)] transition active:scale-[0.985]">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-rose-600 text-rose-50 shadow-[0_6px_16px_rgba(225,29,72,0.22)]">
                  <HeartHandshake className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="mt-2.5 text-[12px] font-bold text-[#171923]">Ayuda</span>
                <span className="mt-0.5 line-clamp-2 text-[9px] leading-3.5 text-slate-400">Apoyo solidario</span>
              </Link>
            </div>
          </section>

          <MaterialesInicio
            materiales={materiales}
            mode="growth"
            puedeAbrirCentroPastoral={puedeAbrirCentroPastoral}
          />

          <InstallBanner />
        </div>
      </main>
      {avisosPreview}
    </>
  )
}
