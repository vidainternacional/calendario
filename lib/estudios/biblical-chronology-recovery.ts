import 'server-only'

import { createAdminClient, createClient } from '@/lib/supabase/server'

const ROME_PACKAGE_KEY = 'rome-pilot-v1'
const ROME_PACKAGE_HASH = '67efcaa4e4cae2ec6f908f60a97850a1b7fd6ee223496fbc17438a87ea3a0550'

export type EstadoRecuperacionRoma = {
  authorized: boolean
  eligible: boolean
  dryRun: boolean
  counts: {
    places: number
    periods: number
    events: number
    relations: number
  }
  reason: string | null
}

type SolicitudRecuperacionRoma = {
  packageHash: string
  confirmation: 'RECOVER_ROME_PILOT_V1'
  dryRun?: boolean
}

function authorizedUserIds() {
  return new Set(
    (process.env.BIBLICAL_DATA_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  )
}

async function countPackageRows(admin: ReturnType<typeof createAdminClient>) {
  const metadataFilter = { package_key: ROME_PACKAGE_KEY, package_hash: ROME_PACKAGE_HASH }
  const tables = [
    ['places', 'biblical_places'],
    ['periods', 'biblical_timeline_periods'],
    ['events', 'biblical_timeline_events'],
    ['relations', 'biblical_timeline_event_places'],
  ] as const

  const counts = { places: 0, periods: 0, events: 0, relations: 0 }
  for (const [key, table] of tables) {
    const { count, error } = await (admin as any)
      .from(table)
      .select('*', { count: 'exact', head: true })
      .contains('metadata', metadataFilter)
      .eq('review_status', 'pending')
      .eq('enabled', false)

    if (error) throw new Error(`No se pudo auditar ${table}: ${error.message}`)
    counts[key] = count ?? 0
  }
  return counts
}

export async function recuperarPilotoRomaPendiente(
  request: SolicitudRecuperacionRoma
): Promise<EstadoRecuperacionRoma> {
  const dryRun = request.dryRun !== false
  if (request.packageHash !== ROME_PACKAGE_HASH || request.confirmation !== 'RECOVER_ROME_PILOT_V1') {
    return {
      authorized: false,
      eligible: false,
      dryRun,
      counts: { places: 0, periods: 0, events: 0, relations: 0 },
      reason: 'Confirmación o hash de paquete inválido',
    }
  }

  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user || !authorizedUserIds().has(user.id)) {
    return {
      authorized: false,
      eligible: false,
      dryRun,
      counts: { places: 0, periods: 0, events: 0, relations: 0 },
      reason: 'Usuario no autorizado para recuperación de datos bíblicos',
    }
  }

  const admin = createAdminClient()
  const counts = await countPackageRows(admin)
  const eligible = counts.places === 1 && counts.periods === 1 && counts.events === 2 && counts.relations === 2

  if (!eligible || dryRun) {
    return {
      authorized: true,
      eligible,
      dryRun,
      counts,
      reason: eligible ? null : 'Los conteos o estados no coinciden con el paquete fijado',
    }
  }

  const filter = { package_key: ROME_PACKAGE_KEY, package_hash: ROME_PACKAGE_HASH }
  const deletionOrder = [
    'biblical_timeline_event_places',
    'biblical_timeline_events',
    'biblical_timeline_periods',
    'biblical_places',
  ] as const

  for (const table of deletionOrder) {
    const { error } = await (admin as any)
      .from(table)
      .delete()
      .contains('metadata', filter)
      .eq('review_status', 'pending')
      .eq('enabled', false)

    if (error) throw new Error(`Recuperación cancelada en ${table}: ${error.message}`)
  }

  const remaining = await countPackageRows(admin)
  const recovered = Object.values(remaining).every((count) => count === 0)
  if (!recovered) throw new Error('La recuperación no eliminó exactamente el paquete fijado')

  return {
    authorized: true,
    eligible: true,
    dryRun: false,
    counts,
    reason: null,
  }
}
