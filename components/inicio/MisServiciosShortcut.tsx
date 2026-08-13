'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { CalendarCheck2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PENDING_INDICATORS_EVENT, usePendingIndicators } from '@/components/notificaciones/usePendingIndicators'

type ServicioResumen = {
  key: string
  eventoId: string
  ministerioId: string
  titulo: string
  fechaInicio: string
  ubicacion: string | null
  funciones: string[]
  estado: 'pendiente' | 'confirmado' | 'no_disponible'
}

function normalizarEstado(estados: string[]): ServicioResumen['estado'] {
  if (estados.some((estado) => estado === 'no_disponible' || estado === 'declinado')) return 'no_disponible'
  if (estados.length > 0 && estados.every((estado) => estado === 'confirmado')) return 'confirmado'
  return 'pendiente'
}

function fechaCorta(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function exactMinisterioId(pathname: string) {
  return pathname.match(/^\/ministerios\/([0-9a-f-]{36})$/i)?.[1] || null
}

export default function MisServiciosShortcut() {
  const pathname = usePathname()
  const ministerioEnPantalla = exactMinisterioId(pathname)
  const { pendingServicios } = usePendingIndicators()
  const [servicios, setServicios] = useState<ServicioResumen[]>([])
  const [target, setTarget] = useState<HTMLElement | null>(null)

  const surface = pathname === '/inicio'
    ? 'inicio'
    : pathname === '/avisos'
      ? 'avisos'
      : ministerioEnPantalla
        ? 'ministerio'
        : null

  useEffect(() => {
    if (!surface) return
    let cancelled = false

    async function refresh() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const assignmentsResult = await (supabase as any)
        .from('evento_asignaciones')
        .select(`
          evento_id,
          ministerio_id,
          capacidad_id,
          estado,
          eventos!inner(id,titulo,fecha_inicio,ubicacion),
          ministerio_capacidades(nombre)
        `)
        .eq('profile_id', user.id)
        .gte('eventos.fecha_inicio', new Date().toISOString())
        .limit(100)

      if (assignmentsResult.error) {
        console.error('No se pudo cargar el resumen de Mis servicios', assignmentsResult.error)
        return
      }

      const porServicio = new Map<string, { evento: any; ministerioId: string; funciones: string[]; estados: string[] }>()
      for (const row of assignmentsResult.data || []) {
        const evento = Array.isArray(row.eventos) ? row.eventos[0] : row.eventos
        if (!evento?.id || !evento?.fecha_inicio) continue
        const ministerioId = String(row.ministerio_id || '')
        if (!ministerioId) continue
        const key = `${evento.id}:${ministerioId}`
        const actual = porServicio.get(key) || { evento, ministerioId, funciones: [], estados: [] }
        const capacidad = Array.isArray(row.ministerio_capacidades) ? row.ministerio_capacidades[0] : row.ministerio_capacidades
        const funcion = capacidad?.nombre ? String(capacidad.nombre) : ''
        if (funcion && !actual.funciones.includes(funcion)) actual.funciones.push(funcion)
        actual.estados.push(String(row.estado || 'asignado'))
        porServicio.set(key, actual)
      }

      const next = Array.from(porServicio.values())
        .map((item) => ({
          key: `${item.evento.id}:${item.ministerioId}`,
          eventoId: String(item.evento.id),
          ministerioId: item.ministerioId,
          titulo: String(item.evento.titulo || 'Servicio'),
          fechaInicio: String(item.evento.fecha_inicio),
          ubicacion: item.evento.ubicacion ? String(item.evento.ubicacion) : null,
          funciones: item.funciones,
          estado: normalizarEstado(item.estados),
        }))
        .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())

      if (!cancelled) setServicios(next)
    }

    const handleFocus = () => void refresh()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const handleExplicitRefresh = () => void refresh()

    void refresh()
    const interval = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', handleFocus)
    window.addEventListener(PENDING_INDICATORS_EVENT, handleExplicitRefresh)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener(PENDING_INDICATORS_EVENT, handleExplicitRefresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [surface])

  const servicioVisible = useMemo(() => {
    if (surface === 'ministerio' && ministerioEnPantalla) {
      return servicios.find((servicio) => servicio.ministerioId === ministerioEnPantalla) || null
    }
    if (surface === 'avisos') {
      return servicios.find((servicio) => servicio.estado === 'pendiente') || null
    }
    if (surface === 'inicio') {
      return servicios.find((servicio) => servicio.estado === 'pendiente') || servicios[0] || null
    }
    return servicios[0] || null
  }, [ministerioEnPantalla, servicios, surface])

  useEffect(() => {
    setTarget(null)
    if (!surface || !servicioVisible) return

    let disposed = false
    let mount: HTMLElement | null = null

    const restoreEventState = () => {
      document.querySelectorAll<HTMLElement>('[data-servicio-state-hidden="true"]').forEach((element) => {
        element.style.display = ''
        delete element.dataset.servicioStateHidden
      })
    }

    const hideDuplicatedEventState = (main: HTMLElement) => {
      restoreEventState()
      if (surface !== 'inicio') return

      const content = Array.from(main.children).find((node) => node.tagName === 'DIV') as HTMLElement | undefined
      const firstSection = content
        ? Array.from(content.children).find((node) => node.tagName === 'SECTION') as HTMLElement | undefined
        : undefined
      const eventCard = firstSection?.querySelector<HTMLAnchorElement>('a')
      if (!eventCard) return

      const fechaParam = new URL(eventCard.href, window.location.origin).searchParams.get('fecha')
      const mismoEvento = Boolean(
        fechaParam
        && new Date(fechaParam).getTime() === new Date(servicioVisible.fechaInicio).getTime(),
      )
      if (!mismoEvento) return

      const assignmentLabels = new Set(['Asignado', 'Pendiente', 'Por confirmar', 'Confirmado', 'Declinado', 'No disponible'])
      const statusPill = Array.from(eventCard.querySelectorAll<HTMLElement>('span')).find((element) => {
        const text = element.textContent?.trim() || ''
        return assignmentLabels.has(text) && element.className.includes('rounded-full')
      })

      if (statusPill) {
        statusPill.dataset.servicioStateHidden = 'true'
        statusPill.style.display = 'none'
      }
    }

    const ensureMount = () => {
      if (disposed) return
      if (mount?.isConnected) return
      if (mount && !mount.isConnected) {
        mount = null
        setTarget(null)
      }

      const main = document.querySelector<HTMLElement>('main')
      if (!main) return

      const nextMount = document.createElement('div')
      nextMount.dataset.misServiciosInline = surface
      nextMount.className = 'shrink-0'

      if (surface === 'inicio') {
        const header = Array.from(main.children).find((node) => node.tagName === 'HEADER') as HTMLElement | undefined
        if (!header) return
        const avatar = header.lastElementChild
        if (avatar) header.insertBefore(nextMount, avatar)
        else header.appendChild(nextMount)
        hideDuplicatedEventState(main)
      } else if (surface === 'avisos') {
        const header = Array.from(main.children).find((node) => node.tagName === 'HEADER') as HTMLElement | undefined
        if (header?.nextSibling) main.insertBefore(nextMount, header.nextSibling)
        else main.appendChild(nextMount)
      } else {
        const content = Array.from(main.children).find((node) => node.tagName === 'DIV') as HTMLElement | undefined
        if (!content) return
        content.prepend(nextMount)
      }

      mount = nextMount
      setTarget(nextMount)
    }

    ensureMount()
    const observer = new MutationObserver(ensureMount)
    observer.observe(document.body, { childList: true, subtree: true })
    const retry = window.setInterval(ensureMount, 500)

    return () => {
      disposed = true
      observer.disconnect()
      window.clearInterval(retry)
      restoreEventState()
      setTarget(null)
      mount?.remove()
    }
  }, [servicioVisible?.fechaInicio, servicioVisible?.key, surface])

  if (!surface || !target || !servicioVisible) return null
  if (surface === 'avisos' && pendingServicios === 0) return null

  const pendiente = servicioVisible.estado === 'pendiente'
  const estadoTexto = servicioVisible.estado === 'confirmado'
    ? 'Confirmado'
    : servicioVisible.estado === 'no_disponible'
      ? 'No disponible'
      : 'Requiere respuesta'

  if (surface === 'inicio') {
    const circle = (
      <Link
        href={`/eventos/${servicioVisible.eventoId}`}
        className={`relative grid h-12 w-12 place-items-center rounded-full ring-1 transition active:scale-95 ${
          pendiente
            ? 'bg-amber-50 text-amber-700 ring-amber-200 shadow-[0_7px_18px_rgba(245,158,11,0.16)]'
            : servicioVisible.estado === 'confirmado'
              ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
              : 'bg-rose-50 text-rose-600 ring-rose-100'
        }`}
        aria-label={`Próximo servicio: ${servicioVisible.titulo}. ${estadoTexto}`}
        title={`Próximo servicio: ${servicioVisible.titulo}`}
      >
        <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
        {pendingServicios > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#f4f5f9] bg-rose-500 px-1 text-[9px] font-black leading-none text-white">
            {pendingServicios > 99 ? '99+' : pendingServicios}
          </span>
        )}
      </Link>
    )
    return createPortal(circle, target)
  }

  const tituloSuperior = surface === 'ministerio'
    ? 'Tu próximo servicio aquí'
    : 'Asignación que requiere tu atención'

  const card = (
    <section className={surface === 'avisos' ? 'mb-6' : ''} aria-label="Mis servicios">
      <Link
        href={`/eventos/${servicioVisible.eventoId}`}
        className={`group block overflow-hidden rounded-[24px] border bg-white shadow-[0_8px_26px_rgba(15,23,42,0.055)] transition active:scale-[0.993] ${pendiente ? 'border-rose-100 ring-1 ring-rose-50' : 'border-white/90'}`}
        aria-label={`${tituloSuperior}: ${servicioVisible.titulo}. ${estadoTexto}`}
      >
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-[0_6px_16px_rgba(79,70,229,0.18)]">
            <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
            {pendingServicios > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black leading-none text-white">
                {pendingServicios > 99 ? '99+' : pendingServicios}
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-500">{tituloSuperior}</span>
                <span className="mt-1 block truncate text-[16px] font-extrabold tracking-[-0.02em] text-[#171923]">{servicioVisible.titulo}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold ${pendiente ? 'bg-rose-50 text-rose-600' : servicioVisible.estado === 'confirmado' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {estadoTexto}
              </span>
            </span>

            <span className="mt-1.5 block text-[11px] leading-5 text-slate-500">
              {fechaCorta(servicioVisible.fechaInicio)}{servicioVisible.ubicacion ? ` · ${servicioVisible.ubicacion}` : ''}
            </span>

            <span className="mt-2 flex flex-wrap gap-1.5">
              {(servicioVisible.funciones.length ? servicioVisible.funciones : ['Asignado']).map((funcion) => (
                <span key={funcion} className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-600">{funcion}</span>
              ))}
            </span>
          </span>

          <ChevronRight className="mt-3 h-5 w-5 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
        </div>

        {pendiente && (
          <div className="border-t border-rose-100 bg-rose-50/60 px-4 py-2.5 text-[10px] font-bold text-rose-600 sm:px-5">
            Toca para revisar los detalles, confirmar o gestionar un reemplazo.
          </div>
        )}
      </Link>
    </section>
  )

  return createPortal(card, target)
}