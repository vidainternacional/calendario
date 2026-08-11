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
    if (!surface) {
      setTarget(null)
      return
    }

    const main = document.querySelector<HTMLElement>('main')
    if (!main) return

    const mount = document.createElement('div')
    mount.dataset.misServiciosInline = surface

    if (surface === 'inicio') {
      const content = Array.from(main.children).find((node) => node.tagName === 'DIV') as HTMLElement | undefined
      if (!content) return
      const firstSection = Array.from(content.children).find((node) => node.tagName === 'SECTION')
      if (firstSection?.nextSibling) content.insertBefore(mount, firstSection.nextSibling)
      else content.appendChild(mount)
    } else if (surface === 'avisos') {
      const header = Array.from(main.children).find((node) => node.tagName === 'HEADER') as HTMLElement | undefined
      if (header?.nextSibling) main.insertBefore(mount, header.nextSibling)
      else main.appendChild(mount)
    } else {
      const content = Array.from(main.children).find((node) => node.tagName === 'DIV') as HTMLElement | undefined
      if (!content) return
      content.prepend(mount)
    }

    setTarget(mount)
    return () => {
      setTarget(null)
      mount.remove()
    }
  }, [surface, pathname])

  useEffect(() => {
    if (!surface) return
    let cancelled = false

    async function refresh() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await (supabase as any)
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

      if (error) {
        console.error('No se pudo cargar el resumen de Mis servicios', error)
        return
      }

      const porServicio = new Map<string, { evento: any; ministerioId: string; funciones: string[]; estados: string[] }>()
      for (const row of data || []) {
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
    return servicios[0] || null
  }, [ministerioEnPantalla, servicios, surface])

  if (!surface || !target || !servicioVisible) return null
  if (surface === 'avisos' && pendingServicios === 0) return null

  const pendiente = servicioVisible.estado === 'pendiente'
  const estadoTexto = servicioVisible.estado === 'confirmado'
    ? 'Confirmado'
    : servicioVisible.estado === 'no_disponible'
      ? 'No disponible'
      : 'Requiere respuesta'

  const tituloSuperior = surface === 'ministerio'
    ? 'Tu próximo servicio aquí'
    : surface === 'avisos'
      ? 'Asignación que requiere tu atención'
      : 'Tu próximo servicio'

  const card = (
    <section className={surface === 'avisos' ? 'mb-6' : ''} aria-label="Mis servicios">
      <Link
        href="/intercambios"
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
            Toca para revisar los detalles y confirmar o solicitar un cambio.
          </div>
        )}
      </Link>
    </section>
  )

  return createPortal(card, target)
}
