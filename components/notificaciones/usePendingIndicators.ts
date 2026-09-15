'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUnreadPublicationsCount } from '@/components/avisos/usePublicationReads'
import { obtenerConteoSolicitudesGestionables } from '@/app/actions/centro-solicitudes-ministerio'

export const PENDING_INDICATORS_EVENT = 'vida-pending-indicators-refresh'
const SOLIDARITY_READ_EVENT = 'vida:solidarity-read'

const PENDING_FRESH_WINDOW_MS = 1_200
const PENDING_POLL_INTERVAL_MS = 30_000

type PendingSnapshot = {
  pendingMinisterioIngresos: number
  pendingServicios: number
  pendingSolicitudesGestionables: number
  pendingContactos: number
  pendingPreguntasPastorales: number
  pendingAyudaSolidaria: number
  pendingUsuariosAprobacion: number
}

const EMPTY_PENDING_SNAPSHOT: PendingSnapshot = {
  pendingMinisterioIngresos: 0,
  pendingServicios: 0,
  pendingSolicitudesGestionables: 0,
  pendingContactos: 0,
  pendingPreguntasPastorales: 0,
  pendingAyudaSolidaria: 0,
  pendingUsuariosAprobacion: 0,
}

let pendingSnapshot: PendingSnapshot = EMPTY_PENDING_SNAPSHOT
let pendingUserId: string | null = null
let pendingRefreshPromise: Promise<void> | null = null
let pendingForceRefreshQueued = false
let pendingLastRefreshAt = 0
let pendingLifecycleCleanup: (() => void) | null = null
let lastAppliedAppBadge: number | null = null
const pendingSubscribers = new Set<() => void>()

function publishPendingSnapshot(next: PendingSnapshot) {
  if (
    next.pendingMinisterioIngresos === pendingSnapshot.pendingMinisterioIngresos
    && next.pendingServicios === pendingSnapshot.pendingServicios
    && next.pendingSolicitudesGestionables === pendingSnapshot.pendingSolicitudesGestionables
    && next.pendingContactos === pendingSnapshot.pendingContactos
    && next.pendingPreguntasPastorales === pendingSnapshot.pendingPreguntasPastorales
    && next.pendingAyudaSolidaria === pendingSnapshot.pendingAyudaSolidaria
    && next.pendingUsuariosAprobacion === pendingSnapshot.pendingUsuariosAprobacion
  ) {
    return
  }

  pendingSnapshot = next
  pendingSubscribers.forEach((subscriber) => subscriber())
}

function resetPendingSnapshot() {
  publishPendingSnapshot({ ...EMPTY_PENDING_SNAPSHOT })
}

async function refreshSharedPending(force = false) {
  if (pendingRefreshPromise) {
    if (force) pendingForceRefreshQueued = true
    return pendingRefreshPromise
  }

  const now = Date.now()
  if (!force && now - pendingLastRefreshAt < PENDING_FRESH_WINDOW_MS) return

  const refreshPromise = (async () => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user ?? null

    if (!user) {
      pendingUserId = null
      resetPendingSnapshot()
      return
    }

    if (pendingUserId !== user.id) {
      pendingUserId = user.id
      resetPendingSnapshot()
    }

    const [profileReq, liderazgosReq] = await Promise.all([
      supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).maybeSingle(),
      (supabase as any)
        .from('ministerio_miembros')
        .select('ministerio_id')
        .eq('profile_id', user.id)
        .eq('es_lider', true),
    ])

    const rol = (profileReq.data as any)?.rol as string | undefined
    const esPastorGeneral = (profileReq.data as any)?.es_pastor_general === true
    const esAdministrador = rol === 'administrador'
    const esGestorPastoral = rol === 'pastor' || esAdministrador || esPastorGeneral
    const ministeriosLiderados = Array.from(new Set(
      (liderazgosReq.data || []).map((row: any) => String(row.ministerio_id || '')).filter(Boolean),
    ))

    const leadershipQuery = esAdministrador
      ? (supabase as any)
          .from('ministerio_solicitudes_ingreso')
          .select('id, profile_id')
          .eq('estado', 'pendiente')
      : ministeriosLiderados.length > 0
        ? (supabase as any)
            .from('ministerio_solicitudes_ingreso')
            .select('id, profile_id')
            .eq('estado', 'pendiente')
            .in('ministerio_id', ministeriosLiderados)
        : Promise.resolve({ data: [], error: null })

    const preguntasQuery = esGestorPastoral
      ? (supabase as any)
          .from('preguntas_congregacion')
          .select('id', { count: 'exact', head: true })
          .eq('estado', 'pendiente')
      : Promise.resolve({ count: 0, error: null })

    const ayudaNoLeidosQuery = (supabase as any).rpc('ayuda_solidaria_no_leidos')

    const usuariosPendientesQuery = esAdministrador
      ? (supabase as any)
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('estado_cuenta', 'pendiente')
      : Promise.resolve({ count: 0, error: null })

    const [
      leadershipReq,
      serviciosReq,
      solicitudesGestionables,
      contactosReq,
      preguntasReq,
      ayudaNoLeidosReq,
      usuariosPendientesReq,
    ] = await Promise.all([
      leadershipQuery,
      (supabase as any)
        .from('evento_asignaciones')
        .select('evento_id, estado, eventos!inner(fecha_inicio)')
        .eq('profile_id', user.id)
        .in('estado', ['asignado', 'pendiente'])
        .gte('eventos.fecha_inicio', new Date().toISOString()),
      obtenerConteoSolicitudesGestionables().catch((error) => {
        console.error('No se pudieron cargar las solicitudes gestionables', error)
        return 0
      }),
      (supabase as any)
        .from('contactos')
        .select('id', { count: 'exact', head: true })
        .eq('destinatario_id', user.id)
        .eq('estado', 'pendiente'),
      preguntasQuery,
      ayudaNoLeidosQuery,
      usuariosPendientesQuery,
    ])

    let nextMinisterioIngresos = pendingSnapshot.pendingMinisterioIngresos
    let nextServicios = pendingSnapshot.pendingServicios
    let nextContactos = pendingSnapshot.pendingContactos
    let nextPreguntasPastorales = pendingSnapshot.pendingPreguntasPastorales
    let nextAyudaSolidaria = pendingSnapshot.pendingAyudaSolidaria
    let nextUsuariosAprobacion = pendingSnapshot.pendingUsuariosAprobacion

    if (leadershipReq.error) {
      console.error('No se pudieron cargar los pendientes de liderazgo', leadershipReq.error)
    } else {
      nextMinisterioIngresos = (leadershipReq.data || []).filter(
        (row: any) => String(row.profile_id || '') !== user.id,
      ).length
    }

    if (serviciosReq.error) {
      console.error('No se pudieron cargar los servicios pendientes', serviciosReq.error)
    } else {
      nextServicios = new Set(
        (serviciosReq.data || [])
          .map((row: any) => String(row.evento_id || ''))
          .filter(Boolean),
      ).size
    }

    if (contactosReq.error) {
      console.error('No se pudieron cargar las solicitudes de contacto', contactosReq.error)
    } else {
      nextContactos = Math.max(0, Number(contactosReq.count || 0))
    }

    if (preguntasReq.error) {
      console.error('No se pudieron cargar las preguntas pastorales pendientes', preguntasReq.error)
    } else {
      nextPreguntasPastorales = Math.max(0, Number(preguntasReq.count || 0))
    }

    if (ayudaNoLeidosReq.error) {
      console.error('No se pudieron cargar los mensajes pendientes de Ayuda Solidaria', ayudaNoLeidosReq.error)
    } else {
      nextAyudaSolidaria = (ayudaNoLeidosReq.data || []).reduce(
        (total: number, row: any) => total + Math.max(0, Number(row?.no_leidos || 0)),
        0,
      )
    }

    if (usuariosPendientesReq.error) {
      console.error('No se pudieron cargar los usuarios pendientes de aprobación', usuariosPendientesReq.error)
    } else {
      nextUsuariosAprobacion = Math.max(0, Number(usuariosPendientesReq.count || 0))
    }

    if (pendingUserId !== user.id) return

    publishPendingSnapshot({
      pendingMinisterioIngresos: nextMinisterioIngresos,
      pendingServicios: nextServicios,
      pendingSolicitudesGestionables: Math.max(0, Number(solicitudesGestionables || 0)),
      pendingContactos: nextContactos,
      pendingPreguntasPastorales: nextPreguntasPastorales,
      pendingAyudaSolidaria: nextAyudaSolidaria,
      pendingUsuariosAprobacion: nextUsuariosAprobacion,
    })
  })()

  pendingRefreshPromise = refreshPromise
  try {
    await refreshPromise
  } finally {
    pendingLastRefreshAt = Date.now()
    if (pendingRefreshPromise === refreshPromise) pendingRefreshPromise = null

    if (pendingForceRefreshQueued) {
      pendingForceRefreshQueued = false
      void refreshSharedPending(true)
    }
  }
}

function stopPendingLifecycle() {
  pendingLifecycleCleanup?.()
  pendingLifecycleCleanup = null
}

function ensurePendingLifecycle() {
  if (pendingLifecycleCleanup || typeof window === 'undefined') return

  const handleFocus = () => void refreshSharedPending()
  const handleOnline = () => void refreshSharedPending(true)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') void refreshSharedPending()
  }
  const handleExplicitRefresh = () => void refreshSharedPending(true)

  const interval = window.setInterval(() => void refreshSharedPending(), PENDING_POLL_INTERVAL_MS)
  window.addEventListener('focus', handleFocus)
  window.addEventListener('online', handleOnline)
  window.addEventListener(PENDING_INDICATORS_EVENT, handleExplicitRefresh)
  window.addEventListener(SOLIDARITY_READ_EVENT, handleExplicitRefresh)
  document.addEventListener('visibilitychange', handleVisibility)

  pendingLifecycleCleanup = () => {
    window.clearInterval(interval)
    window.removeEventListener('focus', handleFocus)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener(PENDING_INDICATORS_EVENT, handleExplicitRefresh)
    window.removeEventListener(SOLIDARITY_READ_EVENT, handleExplicitRefresh)
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}

function subscribePending(subscriber: () => void) {
  pendingSubscribers.add(subscriber)
  ensurePendingLifecycle()
  void refreshSharedPending()

  return () => {
    pendingSubscribers.delete(subscriber)
    if (pendingSubscribers.size === 0) stopPendingLifecycle()
  }
}

function getPendingSnapshot() {
  return pendingSnapshot
}

function getPendingServerSnapshot() {
  return EMPTY_PENDING_SNAPSHOT
}

function applyAppBadge(total: number) {
  if (typeof navigator === 'undefined' || lastAppliedAppBadge === total) return
  lastAppliedAppBadge = total

  const badgeNavigator = navigator as Navigator & {
    setAppBadge?: (value?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }

  if (total > 0 && badgeNavigator.setAppBadge) {
    void badgeNavigator.setAppBadge(total).catch(() => {
      lastAppliedAppBadge = null
    })
  } else if (total === 0 && badgeNavigator.clearAppBadge) {
    void badgeNavigator.clearAppBadge().catch(() => {
      lastAppliedAppBadge = null
    })
  }
}

export function requestPendingIndicatorsRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PENDING_INDICATORS_EVENT))
}

export function usePendingIndicators() {
  const unreadAvisos = useUnreadPublicationsCount()
  const {
    pendingMinisterioIngresos,
    pendingServicios,
    pendingSolicitudesGestionables,
    pendingContactos,
    pendingPreguntasPastorales,
    pendingAyudaSolidaria,
    pendingUsuariosAprobacion,
  } = useSyncExternalStore(subscribePending, getPendingSnapshot, getPendingServerSnapshot)

  const total =
    Math.max(0, unreadAvisos)
    + Math.max(0, pendingMinisterioIngresos)
    + Math.max(0, pendingServicios)
    + Math.max(0, pendingSolicitudesGestionables)
    + Math.max(0, pendingContactos)
    + Math.max(0, pendingPreguntasPastorales)
    + Math.max(0, pendingAyudaSolidaria)
    + Math.max(0, pendingUsuariosAprobacion)

  useEffect(() => {
    applyAppBadge(total)
  }, [total])

  return {
    unreadAvisos,
    pendingMinisterioIngresos,
    pendingServicios,
    pendingSolicitudesGestionables,
    pendingContactos,
    pendingPreguntasPastorales,
    pendingAyudaSolidaria,
    pendingUsuariosAprobacion,
    total,
  }
}
