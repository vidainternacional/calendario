import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarioClient from '@/components/calendario/CalendarioClient'
import type { CalendarioOrigen } from '@/components/calendario/calendario-ios-types'

export const metadata: Metadata = {
  title: 'Calendario',
}

export const dynamic = 'force-dynamic'

function normalizarCalendario(value: any): CalendarioOrigen | null {
  if (!value?.id) return null
  return {
    id: String(value.id),
    nombre: String(value.nombre || 'Calendario'),
    color: String(value.color || '#5B3DF5'),
    owner_id: value.owner_id || null,
    tipo_cuenta: value.tipo_cuenta || 'interno',
    es_publico: Boolean(value.es_publico),
    ministerio_id: value.ministerio_id || null,
    visible: true,
    can_edit: true,
  }
}

function firstQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams?: Promise<{
    evento?: string | string[]
    fecha?: string | string[]
  }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const query = searchParams ? await searchParams : {}
  const eventParam = firstQueryValue(query.evento)?.trim() || null
  const initialEventId = eventParam && /^[0-9a-f-]{36}$/i.test(eventParam) ? eventParam : null
  if (initialEventId) redirect(`/eventos/${initialEventId}`)

  let initialEventDate = firstQueryValue(query.fecha)?.trim() || null
  if (initialEventDate && Number.isNaN(new Date(initialEventDate).getTime())) initialEventDate = null

  // Inicio enlaza por el instante exacto que ya muestra en la tarjeta. La RPC
  // resuelve ese instante únicamente entre los calendarios visibles del usuario,
  // incluso si el elemento acaba de empezar, y abre su ficha directa.
  if (initialEventDate) {
    const { data: resolvedRows } = await (supabase as any).rpc('resolve_visible_calendar_item_at', {
      p_fecha: new Date(initialEventDate).toISOString(),
    })
    const resolved = resolvedRows?.[0]
    if (resolved?.id) {
      redirect(resolved.item_type === 'reminder' ? `/recordatorios/${resolved.id}` : `/eventos/${resolved.id}`)
    }
  }

  const [profileReq, leaderReq] = await Promise.all([
    supabase
      .from('profiles')
      .select('rol, activo, estado_cuenta')
      .eq('id', user.id)
      .single(),
    supabase
      .from('ministerio_miembros')
      .select('ministerio_id')
      .eq('profile_id', user.id)
      .eq('es_lider', true),
  ])

  const profile = profileReq.data as {
    rol?: string | null
    activo?: boolean | null
    estado_cuenta?: string | null
  } | null

  const cuentaActiva = Boolean(profile?.activo) && profile?.estado_cuenta === 'activo'
  const esAdministrador = profile?.rol === 'administrador'
  const ministeriosLiderados = Array.from(new Set(
    (leaderReq.data || [])
      .map((item: any) => item.ministerio_id)
      .filter(Boolean)
      .map(String),
  ))

  let creationCalendars: CalendarioOrigen[] = []

  if (cuentaActiva && esAdministrador) {
    const { data } = await supabase
      .from('calendars')
      .select('id, nombre, color, owner_id, tipo_cuenta, es_publico, ministerio_id')
      .order('es_publico', { ascending: false })
      .order('nombre')

    creationCalendars = (data || [])
      .map(normalizarCalendario)
      .filter((calendar): calendar is CalendarioOrigen => Boolean(calendar))
  } else if (cuentaActiva) {
    const { data } = await supabase
      .from('calendar_subscriptions')
      .select(`
        can_edit,
        calendars (
          id,
          nombre,
          color,
          owner_id,
          tipo_cuenta,
          es_publico,
          ministerio_id
        )
      `)
      .eq('user_id', user.id)
      .eq('can_edit', true)

    creationCalendars = (data || [])
      .map((item: any) => normalizarCalendario(item.calendars))
      .filter((calendar): calendar is CalendarioOrigen =>
        Boolean(
          calendar && (
            !calendar.ministerio_id ||
            ministeriosLiderados.includes(String(calendar.ministerio_id))
          ),
        ),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }

  const canCreateEvents = cuentaActiva && creationCalendars.length > 0

  return (
    <CalendarioClient
      userId={user.id}
      canCreateEvents={canCreateEvents}
      creationCalendars={creationCalendars}
      initialEventId={null}
      initialEventDate={initialEventDate}
    />
  )
}
