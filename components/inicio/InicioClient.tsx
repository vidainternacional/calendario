'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  HeartHandshake,
  MapPin,
  Megaphone,
  MessageCircleMore,
  UsersRound,
} from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { readUserCache, writeUserCache } from '@/lib/cache/userCache'
import LogoutButton from '@/components/auth/LogoutButton'
import InstallBanner from '@/components/pwa/InstallBanner'
import MinisterioSwitcher from '@/components/inicio/MinisterioSwitcher'
import MaterialesInicio from '@/components/inicio/MaterialesInicio'
import PublicacionCard from '@/components/avisos/PublicacionCard'
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

const estadoConfig = {
  asignado: {
    label: 'Asignado',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  confirmado: {
    label: 'Confirmado',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  declinado: {
    label: 'Declinado',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
} as const

const quickActions = [
  { href: '/biblia', label: 'Biblia', Icon: BookOpen, tone: 'bg-violet-50 text-violet-700' },
  { href: '/calendario', label: 'Calendario', Icon: CalendarDays, tone: 'bg-indigo-50 text-indigo-700' },
  { href: '/avisos', label: 'Avisos', Icon: Megaphone, tone: 'bg-sky-50 text-sky-700' },
  { href: '/ministerios', label: 'Ministerios', Icon: UsersRound, tone: 'bg-emerald-50 text-emerald-700' },
]

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
      <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
        <SkeletonPage cards={4} />
      </main>
    )
  }

  const { profile, misEventos, membresias, publicaciones } = data
  const nombre = profile?.nombre_completo || email?.split('@')[0] || 'Servidor'
  const firstNameRaw = nombre.trim().split(/\s+/)[0] || 'Servidor'
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1)
  const rol = profile?.rol as string | undefined
  const inicial = nombre.charAt(0).toUpperCase()
  const puedeGestionarSolicitudes =
    rol === 'pastor' ||
    rol === 'administrador' ||
    membresias.some((m: any) => m.es_lider)

  const nextEvent = misEventos[0] || null
  const nextEventStart = nextEvent ? new Date(nextEvent.fecha_inicio) : null
  const nextEventIsToday = Boolean(clock && nextEventStart && isSameDay(nextEventStart, clock))
  const nextEventState = nextEvent ? eventStatus(nextEvent) : estadoConfig.asignado
  const upcomingEvents = nextEvent ? misEventos.slice(1, 4) : []
  const todayLabel = clock
    ? capitalize(format(clock, "EEEE, d 'de' MMMM", { locale: es }))
    : 'Tu espacio personal en VIDA'

  return (
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

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/perfil"
            aria-label="Abrir perfil"
            className="grid h-11 w-11 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-[0_7px_18px_rgba(79,70,229,0.22)] ring-4 ring-white/80 transition active:scale-95"
          >
            {inicial}
          </Link>
          <LogoutButton compact />
        </div>
      </header>

      <div className="space-y-5 sm:space-y-6">
        <section aria-label="Resumen de tu agenda">
          {nextEvent && nextEventStart ? (
            <Link
              href="/calendario"
              className="group relative block overflow-hidden rounded-[28px] bg-gradient-to-br from-[#5b3df5] via-[#6747f3] to-[#7c3aed] p-5 text-white shadow-[0_18px_44px_rgba(91,61,245,0.24)] transition active:scale-[0.992] sm:p-6"
            >
              <div className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <span className="inline-flex min-h-7 items-center rounded-full border border-white/20 bg-white/12 px-3 text-[10px] font-extrabold tracking-[0.14em] text-white/90 backdrop-blur-sm">
                  {nextEventIsToday ? 'HOY' : 'PRÓXIMO'}
                </span>
                <CalendarDays className="h-5 w-5 text-white/80" aria-hidden="true" />
              </div>

              <div className="relative mt-4">
                <h2 className="line-clamp-2 text-[21px] font-bold leading-tight tracking-[-0.025em]">{nextEvent.titulo}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/82">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {nextEventIsToday
                      ? format(nextEventStart, 'h:mm a', { locale: es })
                      : capitalize(format(nextEventStart, "EEE d MMM · h:mm a", { locale: es }))}
                  </span>
                  {nextEvent.ubicacion && (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="max-w-[220px] truncate">{nextEvent.ubicacion}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-bold text-white ring-1 ring-white/15">
                  <span className={`h-1.5 w-1.5 rounded-full ${nextEventState.dot}`} />
                  {nextEventState.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white">
                  Abrir calendario
                  <ChevronRight className="h-4 w-4 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/calendario"
              className="group flex min-h-[132px] items-center gap-4 rounded-[28px] border border-white/90 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition active:scale-[0.992]"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                <CalendarDays className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-violet-600">HOY</span>
                <span className="mt-1 block text-lg font-bold tracking-[-0.02em] text-[#171923]">Tu agenda está libre por ahora</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">Puedes revisar el calendario completo o ver próximas actividades.</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}
        </section>

        <nav aria-label="Accesos rápidos" className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {quickActions.map(({ href, label, Icon, tone }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[82px] min-w-0 flex-col items-center justify-center gap-2 rounded-[20px] border border-white/90 bg-white px-1.5 py-3 text-center shadow-[0_6px_20px_rgba(15,23,42,0.045)] transition active:scale-[0.97]"
            >
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="w-full truncate text-[10px] font-bold text-slate-700 sm:text-[11px]">{label}</span>
            </Link>
          ))}
        </nav>

        {upcomingEvents.length > 0 && (
          <section aria-labelledby="proximamente-inicio">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="min-w-0">
                <h2 id="proximamente-inicio" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">Próximamente</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">Tus siguientes asignaciones y actividades.</p>
              </div>
              <Link href="/calendario" className="inline-flex min-h-10 shrink-0 items-center gap-0.5 rounded-xl px-2 text-xs font-bold text-indigo-600">
                Ver calendario
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
              {upcomingEvents.map((evento: any) => {
                const date = new Date(evento.fecha_inicio)
                const config = eventStatus(evento)
                return (
                  <Link
                    href="/calendario"
                    key={evento.id}
                    className="group flex min-h-[72px] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 active:bg-slate-50"
                  >
                    <span className="flex w-10 shrink-0 flex-col items-center text-center">
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-indigo-500">{format(date, 'EEE', { locale: es }).replace('.', '')}</span>
                      <span className="mt-0.5 text-lg font-bold leading-none text-[#171923]">{format(date, 'd')}</span>
                    </span>
                    <span className="min-w-0 flex-1 border-l border-slate-100 pl-3">
                      <span className="block truncate text-sm font-semibold text-[#171923]">{evento.titulo}</span>
                      <span className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-slate-500">
                        <span className="inline-flex shrink-0 items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                          {format(date, 'h:mm a', { locale: es })}
                        </span>
                        {evento.ubicacion && (
                          <span className="truncate text-slate-400">· {evento.ubicacion}</span>
                        )}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

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
          <section aria-label="Ministerios">
            <Link
              href="/ministerios"
              className="group flex min-h-[76px] items-center gap-3 rounded-[24px] border border-white/90 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition active:scale-[0.992]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <UsersRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.11em] text-emerald-600">SERVIR</span>
                <span className="mt-0.5 block text-sm font-bold text-[#171923]">Encuentra tu lugar en un ministerio</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">Explora equipos y solicita unirte cuando estés listo.</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
            </Link>
          </section>
        )}

        <section aria-labelledby="herramientas-inicio">
          <div className="mb-3 px-1">
            <h2 id="herramientas-inicio" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">Herramientas</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Acciones rápidas para tu vida dentro de la iglesia.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/preguntas" className="group min-h-[102px] rounded-[22px] border border-white/90 bg-white p-4 shadow-[0_7px_22px_rgba(15,23,42,0.045)] transition active:scale-[0.985]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                <MessageCircleMore className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="mt-3 block text-sm font-bold text-[#171923]">Buzón</span>
              <span className="mt-1 block text-[11px] leading-4 text-slate-500">Oración, dudas y sugerencias.</span>
            </Link>

            <Link href="/ayuda-solidaria" className="group min-h-[102px] rounded-[22px] border border-white/90 bg-white p-4 shadow-[0_7px_22px_rgba(15,23,42,0.045)] transition active:scale-[0.985]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <HeartHandshake className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="mt-3 block text-sm font-bold text-[#171923]">Ayuda Solidaria</span>
              <span className="mt-1 block text-[11px] leading-4 text-slate-500">Solicita o brinda apoyo.</span>
            </Link>

            {puedeGestionarSolicitudes && (
              <Link href="/solicitudes" className="group col-span-2 flex min-h-[74px] items-center gap-3 rounded-[22px] border border-white/90 bg-white px-4 py-3 shadow-[0_7px_22px_rgba(15,23,42,0.045)] transition active:scale-[0.99]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <FileText className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#171923]">Solicitudes</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">Revisa y gestiona solicitudes de tu ministerio.</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>

        <section aria-labelledby="publicaciones-inicio">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <h2 id="publicaciones-inicio" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">Publicaciones recientes</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Lo más importante de la iglesia y tus ministerios.</p>
            </div>
            <Link href="/avisos" className="inline-flex min-h-10 shrink-0 items-center gap-0.5 rounded-xl px-2 text-xs font-bold text-indigo-600">
              Ver todas
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {publicaciones.length === 0 ? (
            <div className="rounded-[24px] border border-white/90 bg-white px-4 py-5 text-sm text-slate-500 shadow-[0_8px_26px_rgba(15,23,42,0.045)]">
              No hay publicaciones nuevas por ahora.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
              {publicaciones.slice(0, 3).map((pub: any) => (
                <PublicacionCard
                  key={pub.id}
                  titulo={pub.titulo}
                  cuerpo={pub.cuerpo}
                  tipo={pub.tipo}
                  fecha={format(new Date(pub.created_at), "d 'de' MMM", { locale: es })}
                  autor={pub.profiles?.nombre_completo || 'Autor desconocido'}
                  variant="row"
                />
              ))}
            </div>
          )}
        </section>

        <MaterialesInicio puedeAbrirCentroPastoral={rol === 'pastor' || rol === 'administrador'} />

        <InstallBanner />
      </div>
    </main>
  )
}
