'use client'

import { destinoSolidario } from '@/lib/notificaciones/solidaridad-atencion'
import { sumarAtencion } from '@/lib/notificaciones/atencion'
import { useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUnreadPublicationsCount } from '@/components/avisos/usePublicationReads'
import { obtenerResumenSolicitudesGestionables } from '@/app/actions/centro-solicitudes-ministerio'

export const PENDING_INDICATORS_EVENT = 'vida-pending-indicators-refresh'

const PENDING_FRESH_WINDOW_MS = 1_200
const PENDING_POLL_INTERVAL_MS = 30_000

type PendingSnapshot = {
  pendingMinisterioIngresos: number
  pendingServicios: number
  pendingSolicitudesGestionables: number
  pendingContactos: number
  pendingPreguntasPastorales: number
  pendingAyudaSolidaria: number
  pendingAvisosAprobacion: number
  pendingDiscipuladoRevision: number
  pendingMensajesSolidarios: number
  mensajesSolidarios: Array<{ contexto: string; contexto_id: string; no_leidos: number | string }>
  servicioPendienteHref: string | null
  ingresoPendienteHref: string | null
  solicitudesPendientesHref: string | null
  ayudaPendienteHref: string | null
  mensajesSolidariosHref: string | null
  ayudaPendienteDetalle: string
}

const EMPTY_PENDING_SNAPSHOT: PendingSnapshot = {
  pendingMinisterioIngresos: 0,
  pendingServicios: 0,
  pendingSolicitudesGestionables: 0,
  pendingContactos: 0,
  pendingPreguntasPastorales: 0,
  pendingAyudaSolidaria: 0,
  pendingAvisosAprobacion: 0,
  pendingDiscipuladoRevision: 0,
  pendingMensajesSolidarios: 0,
  mensajesSolidarios: [],
  servicioPendienteHref: null,
  ingresoPendienteHref: null,
  solicitudesPendientesHref: null,
  ayudaPendienteHref: null,
  mensajesSolidariosHref: null,
  ayudaPendienteDetalle: '',
}

let pendingSnapshot: PendingSnapshot = EMPTY_PENDING_SNAPSHOT
let pendingGeneration = 0
let pendingUserId: string | null = null
let pendingRefreshPromise: Promise<void> | null = null
let pendingForceRefreshQueued = false
let pendingLastRefreshAt = 0
let pendingLifecycleCleanup: (() => void) | null = null
const pendingSubscribers = new Set<() => void>()

function publishPendingSnapshot(next: PendingSnapshot) {
  if (Object.keys(next).every(key => next[key as keyof PendingSnapshot] === pendingSnapshot[key as keyof PendingSnapshot])) return

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
    const generacion = pendingGeneration
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (generacion !== pendingGeneration) return
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
      supabase.from('profiles').select('rol, es_pastor_general, activo, estado_cuenta').eq('id', user.id).maybeSingle(),
      (supabase as any)
        .from('ministerio_miembros')
        .select('ministerio_id')
        .eq('profile_id', user.id)
        .eq('es_lider', true),
    ])

    if (generacion !== pendingGeneration || pendingUserId !== user.id) return
    if (profileReq.error) throw profileReq.error
    if ((profileReq.data as any)?.activo !== true || (profileReq.data as any)?.estado_cuenta !== 'activo') { resetPendingSnapshot(); return }
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
          .select('id, profile_id, ministerio_id')
          .eq('estado', 'pendiente')
      : ministeriosLiderados.length > 0
        ? (supabase as any)
            .from('ministerio_solicitudes_ingreso')
            .select('id, profile_id, ministerio_id')
            .eq('estado', 'pendiente')
            .in('ministerio_id', ministeriosLiderados)
        : Promise.resolve({ data: [], error: null })

    const preguntasQuery = esGestorPastoral
      ? (supabase as any)
          .from('preguntas_congregacion')
          .select('id', { count: 'exact', head: true })
          .eq('estado', 'pendiente')
      : Promise.resolve({ count: 0, error: null })

    const ayudaSolicitudesQuery = esGestorPastoral
      ? (supabase as any)
          .from('solicitudes_ayuda_solidaria')
          .select('id', { count: 'exact', head: true })
          .eq('estado', 'enviada')
      : Promise.resolve({ count: 0, error: null })

    const ayudaAportesQuery = esGestorPastoral
      ? (supabase as any)
          .from('aportes_ayuda_solidaria')
          .select('id', { count: 'exact', head: true })
          .eq('estado', 'ofrecido')
      : Promise.resolve({ count: 0, error: null })

    const [
      leadershipReq,
      serviciosReq,
      solicitudesGestionables,
      contactosReq,
      preguntasReq,
      ayudaSolicitudesReq,
      ayudaAportesReq,
      avisosReq,
      discipuladoReq,
      mensajesReq,
    ] = await Promise.all([
      leadershipQuery,
      (supabase as any)
        .from('evento_asignaciones')
        .select('evento_id, estado, eventos!inner(fecha_inicio)')
        .eq('profile_id', user.id)
        .in('estado', ['asignado', 'pendiente'])
        .gte('eventos.fecha_inicio', new Date().toISOString()),
      obtenerResumenSolicitudesGestionables().catch((error) => {
        console.error('No se pudieron cargar las solicitudes gestionables', error)
        return null
      }),
      (supabase as any)
        .from('contactos')
        .select('id', { count: 'exact', head: true })
        .eq('destinatario_id', user.id)
        .eq('estado', 'pendiente'),
      preguntasQuery,
      ayudaSolicitudesQuery,
      ayudaAportesQuery,
      esAdministrador || esPastorGeneral ? (supabase as any).from('publicaciones').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente') : Promise.resolve({ count: 0 }),
      (async () => {
        const acceso = await (supabase as any).rpc('puede_gestionar_discipulado')
        if (acceso.error) return { error: acceso.error }
        return acceso.data === true ? (supabase as any).from('discipulado_asignaciones').select('id', { count: 'exact', head: true }).eq('estado', 'revision') : { count: 0 }
      })(),
      (supabase as any).rpc('ayuda_solidaria_no_leidos'),
    ])

    let nextMinisterioIngresos = pendingSnapshot.pendingMinisterioIngresos
    let nextServicios = pendingSnapshot.pendingServicios
    let nextContactos = pendingSnapshot.pendingContactos
    let nextPreguntasPastorales = pendingSnapshot.pendingPreguntasPastorales
    let nextAyudaSolidaria = pendingSnapshot.pendingAyudaSolidaria

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

    if (ayudaSolicitudesReq.error || ayudaAportesReq.error) {
      console.error('No se pudieron cargar los pendientes de Ayuda Solidaria', ayudaSolicitudesReq.error || ayudaAportesReq.error)
    } else {
      nextAyudaSolidaria = Math.max(0, Number(ayudaSolicitudesReq.count || 0))
        + Math.max(0, Number(ayudaAportesReq.count || 0))
    }

    if (pendingUserId !== user.id || generacion !== pendingGeneration) return

    publishPendingSnapshot({
      pendingMinisterioIngresos: nextMinisterioIngresos,
      pendingServicios: nextServicios,
      pendingSolicitudesGestionables: solicitudesGestionables === null ? pendingSnapshot.pendingSolicitudesGestionables : Math.max(0, Number(solicitudesGestionables?.total || 0)),
      solicitudesPendientesHref: solicitudesGestionables === null ? pendingSnapshot.solicitudesPendientesHref : solicitudesGestionables.href,
      pendingContactos: nextContactos,
      pendingPreguntasPastorales: nextPreguntasPastorales,
      pendingAyudaSolidaria: nextAyudaSolidaria,
      ayudaPendienteHref: ayudaSolicitudesReq.error || ayudaAportesReq.error ? pendingSnapshot.ayudaPendienteHref : Number(ayudaSolicitudesReq.count || 0) > 0 ? destinoSolidario('solicitud', undefined, true) : Number(ayudaAportesReq.count || 0) > 0 ? destinoSolidario('aporte', undefined, true) : null,
      ayudaPendienteDetalle: ayudaSolicitudesReq.error || ayudaAportesReq.error ? pendingSnapshot.ayudaPendienteDetalle : `${Number(ayudaSolicitudesReq.count || 0)} solicitudes de ayuda y ${Number(ayudaAportesReq.count || 0)} siembras por atender. Leer el chat no cambia su estado.`,
      mensajesSolidariosHref: mensajesReq.error ? pendingSnapshot.mensajesSolidariosHref : mensajesReq.data?.[0] ? destinoSolidario(mensajesReq.data[0].contexto, mensajesReq.data[0].contexto_id) : null,
      pendingAvisosAprobacion: avisosReq.error ? pendingSnapshot.pendingAvisosAprobacion : Number(avisosReq.count || 0),
      pendingDiscipuladoRevision: discipuladoReq.error ? pendingSnapshot.pendingDiscipuladoRevision : Number(discipuladoReq.count || 0),
      mensajesSolidarios: mensajesReq.error ? pendingSnapshot.mensajesSolidarios : mensajesReq.data || [],
      pendingMensajesSolidarios: mensajesReq.error ? pendingSnapshot.pendingMensajesSolidarios : (mensajesReq.data || []).reduce((n: number, row: { no_leidos: number }) => n + Math.max(0, Number(row.no_leidos || 0)), 0),
      servicioPendienteHref: serviciosReq.error ? pendingSnapshot.servicioPendienteHref : serviciosReq.data?.[0]?.evento_id ? `/eventos/${serviciosReq.data[0].evento_id}` : null,
      ingresoPendienteHref: leadershipReq.error ? pendingSnapshot.ingresoPendienteHref : esAdministrador ? '/admin/solicitudes-ministerios' : leadershipReq.data?.find((r: { profile_id: string }) => r.profile_id !== user.id)?.ministerio_id ? `/ministerios/${leadershipReq.data.find((r: { profile_id: string }) => r.profile_id !== user.id).ministerio_id}/solicitudes-ingreso` : null,
    })
  })()

  pendingRefreshPromise = refreshPromise
  try {
    await refreshPromise
  } catch (error) {
    console.error('No se pudieron actualizar los pendientes; se conserva el último recuento de la cuenta.', error)
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

  const client = createClient()
  const { data: auth } = client.auth.onAuthStateChange((_event, session) => {
    const usuario = session?.user.id || null
    if (pendingUserId !== usuario) {
      pendingGeneration++; pendingUserId = usuario; pendingLastRefreshAt = 0; resetPendingSnapshot()
      Promise.resolve().then(() => void refreshSharedPending(true))
    }
  })
  const handleFocus = () => void refreshSharedPending()
  const handleOnline = () => void refreshSharedPending(true)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') void refreshSharedPending()
  }
  const handleExplicitRefresh = () => void refreshSharedPending(true)

  const interval = window.setInterval(() => { if (document.visibilityState === 'visible' && navigator.onLine) void refreshSharedPending() }, PENDING_POLL_INTERVAL_MS)
  window.addEventListener('focus', handleFocus)
  window.addEventListener('online', handleOnline)
  window.addEventListener(PENDING_INDICATORS_EVENT, handleExplicitRefresh)
  window.addEventListener('vida:solidarity-read', handleExplicitRefresh)
  document.addEventListener('visibilitychange', handleVisibility)

  pendingLifecycleCleanup = () => {
    auth.subscription.unsubscribe()
    window.clearInterval(interval)
    window.removeEventListener('focus', handleFocus)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener(PENDING_INDICATORS_EVENT, handleExplicitRefresh)
    window.removeEventListener('vida:solidarity-read', handleExplicitRefresh)
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}

function subscribePending(subscriber: () => void) {
  pendingSubscribers.add(subscriber)
  ensurePendingLifecycle()
  void refreshSharedPending()

  return () => {
    pendingSubscribers.delete(subscriber)
    if (pendingSubscribers.size === 0) { stopPendingLifecycle(); pendingGeneration++; pendingUserId = null; pendingLastRefreshAt = 0; resetPendingSnapshot() }
  }
}

function getPendingSnapshot() {
  return pendingSnapshot
}

function getPendingServerSnapshot() {
  return EMPTY_PENDING_SNAPSHOT
}

export function requestPendingIndicatorsRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PENDING_INDICATORS_EVENT))
}

export function usePendingIndicators() {
  const unreadAvisos = useUnreadPublicationsCount()
  const snapshot = useSyncExternalStore(subscribePending, getPendingSnapshot, getPendingServerSnapshot)
  const { servicioPendienteHref, ingresoPendienteHref, solicitudesPendientesHref, ayudaPendienteHref, mensajesSolidariosHref, ayudaPendienteDetalle, mensajesSolidarios, ...conteos } = snapshot
  return { ...snapshot, unreadAvisos, total: sumarAtencion({ ...conteos, unreadAvisos }) }
}
