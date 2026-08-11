'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarCheck2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PENDING_INDICATORS_EVENT, usePendingIndicators } from '@/components/notificaciones/usePendingIndicators'

type ServicioResumen = {
  eventoId: string
  titulo: string
  fechaInicio: string
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

export default function MisServiciosShortcut() {
  const pathname = usePathname()
  const { pendingServicios } = usePendingIndicators()
  const [proximo, setProximo] = useState<ServicioResumen | null>(null)

  useEffect(() => {
    if (pathname !== '/inicio') return
    let cancelled = false

    async function refresh() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await (supabase as any)
        .from('evento_asignaciones')
        .select(`
          evento_id,
          capacidad_id,
          estado,
          eventos!inner(id,titulo,fecha_inicio),
          ministerio_capacidades(nombre)
        `)
        .eq('profile_id', user.id)
        .gte('eventos.fecha_inicio', new Date().toISOString())
        .limit(80)

      if (error) {
        console.error('No se pudo cargar el resumen de Mis servicios', error)
        return
      }

      const porEvento = new Map<string, { evento: any; funciones: string[]; estados: string[] }>()
      for (const row of data || []) {
        const evento = Array.isArray(row.eventos) ? row.eventos[0] : row.eventos
        if (!evento?.id || !evento?.fecha_inicio) continue
        const key = String(evento.id)
        const actual = porEvento.get(key) || { evento, funciones: [], estados: [] }
        const capacidad = Array.isArray(row.ministerio_capacidades) ? row.ministerio_capacidades[0] : row.ministerio_capacidades
        const funcion = capacidad?.nombre ? String(capacidad.nombre) : ''
        if (funcion && !actual.funciones.includes(funcion)) actual.funciones.push(funcion)
        actual.estados.push(String(row.estado || 'asignado'))
        porEvento.set(key, actual)
      }

      const servicios = Array.from(porEvento.values())
        .map((item) => ({
          eventoId: String(item.evento.id),
          titulo: String(item.evento.titulo || 'Servicio'),
          fechaInicio: String(item.evento.fecha_inicio),
          funciones: item.funciones,
          estado: normalizarEstado(item.estados),
        }))
        .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())

      if (!cancelled) setProximo(servicios[0] || null)
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
  }, [pathname])

  const estadoLabel = useMemo(() => {
    if (!proximo) return pendingServicios > 0 ? `${pendingServicios} pendiente${pendingServicios === 1 ? '' : 's'}` : 'Ver próximas asignaciones'
    if (proximo.estado === 'confirmado') return 'Confirmado'
    if (proximo.estado === 'no_disponible') return 'No disponible'
    return pendingServicios > 0 ? `${pendingServicios} por confirmar` : 'Pendiente'
  }, [pendingServicios, proximo])

  if (pathname !== '/inicio') return null

  return (
    <Link
      href="/intercambios"
      className="fixed z-[92] flex min-h-[62px] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-[22px] border border-white/90 bg-white/95 px-3.5 py-2.5 text-slate-900 shadow-[0_12px_34px_rgba(15,23,42,0.16)] backdrop-blur-xl transition active:scale-[0.985]"
      style={{ right: 'max(1rem, env(safe-area-inset-right, 0px))', bottom: 'calc(5.1rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label={pendingServicios > 0 ? `Mis servicios, ${pendingServicios} pendientes` : 'Mis servicios'}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-[0_6px_16px_rgba(79,70,229,0.22)]">
        <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
        {pendingServicios > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black leading-none text-white">
            {pendingServicios > 99 ? '99+' : pendingServicios}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-extrabold">Mis servicios</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${pendingServicios > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {estadoLabel}
          </span>
        </span>
        {proximo ? (
          <span className="mt-0.5 block max-w-[230px] truncate text-[10px] text-slate-500">
            {proximo.titulo} · {proximo.funciones.length > 0 ? proximo.funciones.join(' + ') : 'Asignado'} · {fechaCorta(proximo.fechaInicio)}
          </span>
        ) : (
          <span className="mt-0.5 block text-[10px] text-slate-400">Tus próximas asignaciones y respuestas</span>
        )}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
    </Link>
  )
}
