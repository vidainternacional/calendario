'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { obtenerDatosEquipoServicio, type DatosEquipoServicio } from '@/app/actions/equipo-ministerial'
import { PENDING_INDICATORS_EVENT } from '@/components/notificaciones/usePendingIndicators'

type EstadoResumen = 'pendiente' | 'confirmado' | 'no_disponible'

type EstadoVisual = {
  label: string
  className: string
}

function normalizarEstado(estados: string[]): EstadoResumen {
  if (estados.some((estado) => estado === 'no_disponible' || estado === 'declinado')) return 'no_disponible'
  if (estados.length > 0 && estados.every((estado) => estado === 'confirmado')) return 'confirmado'
  return 'pendiente'
}

function visualEstado(estado: EstadoResumen): EstadoVisual {
  if (estado === 'confirmado') {
    return {
      label: 'Confirmado',
      className: 'rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700 ring-1 ring-emerald-100',
    }
  }

  if (estado === 'no_disponible') {
    return {
      label: 'No disponible',
      className: 'rounded-full bg-rose-50 px-2 py-1 text-[9px] font-extrabold text-rose-700 ring-1 ring-rose-100',
    }
  }

  return {
    label: 'Por confirmar',
    className: 'rounded-full bg-amber-50 px-2 py-1 text-[9px] font-extrabold text-amber-700 ring-1 ring-amber-100',
  }
}

function estadosPorPersona(datos: DatosEquipoServicio) {
  const porPersona = new Map<string, string[]>()
  for (const asignacion of datos.asignaciones) {
    const actuales = porPersona.get(asignacion.profile_id) || []
    actuales.push(String(asignacion.estado || 'asignado'))
    porPersona.set(asignacion.profile_id, actuales)
  }

  return datos.miembros
    .filter((miembro) => porPersona.has(miembro.id))
    .map((miembro) => ({
      profileId: miembro.id,
      estado: normalizarEstado(porPersona.get(miembro.id) || []),
    }))
}

function encontrarFilasEquipo() {
  const root = document.querySelector<HTMLElement>('[data-equipo-inline-root]')
  if (!root) return []

  const sections = Array.from(root.querySelectorAll<HTMLElement>('section'))
  const section = sections.find((item) => item.textContent?.includes('Sirven en este servicio'))
  if (!section) return []

  const lista = Array.from(section.children).find((child) => {
    const element = child as HTMLElement
    return element.className.includes('overflow-hidden') && element.className.includes('rounded-2xl')
  }) as HTMLElement | undefined

  return lista ? Array.from(lista.children) as HTMLElement[] : []
}

function aplicarEstados(datos: DatosEquipoServicio) {
  const resumenes = estadosPorPersona(datos)
  const filas = encontrarFilasEquipo()
  if (!filas.length) return

  filas.forEach((fila, index) => {
    const resumen = resumenes[index]
    if (!resumen) return

    const pill = Array.from(fila.querySelectorAll<HTMLElement>('span')).find((element) => {
      const text = element.textContent?.trim() || ''
      return ['Asignado', 'Por confirmar', 'Confirmado', 'No disponible'].includes(text)
        && element.className.includes('rounded-full')
    })
    if (!pill) return

    const visual = visualEstado(resumen.estado)
    pill.textContent = visual.label
    pill.className = visual.className
    pill.dataset.estadoAsignacion = resumen.estado
  })
}

export default function EquipoEstadoSync() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ministerioId = pathname.match(/\/ministerios\/([^/]+)\/programacion/)?.[1] || ''
  const eventoId = searchParams.get('evento') || ''
  const datosRef = useRef<DatosEquipoServicio | null>(null)

  useEffect(() => {
    if (!ministerioId || !eventoId) return
    let cancelled = false
    let observer: MutationObserver | null = null

    async function refresh() {
      try {
        const datos = await obtenerDatosEquipoServicio(ministerioId, eventoId)
        if (cancelled) return
        datosRef.current = datos
        aplicarEstados(datos)
      } catch (error) {
        console.error('[EquipoEstadoSync] No se pudo sincronizar el estado del equipo', error)
      }
    }

    const reapply = () => {
      if (datosRef.current) aplicarEstados(datosRef.current)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const onFocus = () => void refresh()
    const onPendingRefresh = () => void refresh()

    void refresh()

    observer = new MutationObserver(reapply)
    observer.observe(document.body, { childList: true, subtree: true })

    const interval = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', onFocus)
    window.addEventListener(PENDING_INDICATORS_EVENT, onPendingRefresh)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      observer?.disconnect()
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(PENDING_INDICATORS_EVENT, onPendingRefresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [eventoId, ministerioId])

  return null
}
