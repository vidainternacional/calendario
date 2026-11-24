import 'server-only'
import { unstable_cache } from 'next/cache'
import { finiteUsage, type ResourceUsage, type ResourceMetric } from './resource-metrics'

const SUPABASE_PROJECT = 'lnkrojvyiwnlcoponxud'
type Environment = Record<string, string | undefined>
const metric = (id: string, label: string, used: unknown, limit: number | null, note: string, unit: ResourceMetric['unit'] = 'bytes'): ResourceMetric => ({ id, label, used: finiteUsage(used), limit, note, unit })
const configuredLimit = (env: Environment, name: string) => {
  const value = finiteUsage(env[name])
  return value !== null && value > 0 ? value : null
}

async function jsonRequest(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(12000), headers: { ...init?.headers, Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error('Proveedor no disponible')
  return response.json()
}

// Todas las consultas son agregados técnicos. No se consultan perfiles, archivos ni notas.
export async function collectResourceUsage(env: Environment = process.env): Promise<ResourceUsage[]> {
  const supabase: ResourceUsage = {
    id: 'supabase', name: 'Supabase · ccvida', status: 'unconfigured', measuredAt: null,
    detail: 'Falta habilitar la lectura de métricas del servidor.',
    dashboard: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT}/settings/usage`,
    metrics: [metric('database', 'Base de datos', null, 500000000, 'Referencia conservadora: 500 MB. Avisos al 70%, 85% y 95%.'), metric('storage', 'Archivos', null, configuredLimit(env, 'VIDA_SUPABASE_STORAGE_LIMIT_BYTES'), 'Límite del plan pendiente de confirmar. Tráfico y Auth se revisan aparte.')],
  }
  const neon = (['A', 'B'] as const).map((target): ResourceUsage => ({
    id: `neon-${target}`, name: `Neon ${target} · ${target === 'A' ? 'Léxico' : 'Textos'}`, status: 'unconfigured', measuredAt: null,
    detail: 'Falta habilitar la lectura de consumo del proyecto.',
    dashboard: `https://console.neon.tech/app/projects/${target === 'A' ? 'rough-glitter-04635242' : 'curly-scene-97670657'}`,
    metrics: [metric('storage', 'Almacenamiento de la rama principal', null, null, 'Tamaño lógico y límite por rama del proveedor; no incluye otras ramas ni historial.'), metric('compute', 'Cómputo del período', null, configuredLimit(env, `VIDA_NEON_${target}_COMPUTE_LIMIT_CUH`), 'CU-h del período del proveedor; no tiempo de conexión.', 'CU-h'), metric('transfer', 'Transferencia del período', null, configuredLimit(env, `VIDA_NEON_${target}_TRANSFER_LIMIT_BYTES`), 'Cuota y período propios de este proyecto.')],
  }))
  const cloudflare: ResourceUsage = {
    id: 'r2', name: 'Cloudflare R2 · Materiales', status: 'unconfigured', measuredAt: null,
    detail: 'Pendiente conectar Cloudflare R2 con la aplicación.', dashboard: 'https://dash.cloudflare.com/?to=/:account/r2/overview',
    metrics: [metric('storage', 'Archivos Standard de la cuenta', null, 10000000000, 'Referencia preventiva: 10 GB. La franquicia se factura por GB-mes; esta barra muestra tamaño actual, no una factura.')],
  }
  await Promise.all([
    (async () => {
      if (!env.VIDA_SUPABASE_METRICS_TOKEN) return
      try {
        // Este endpoint ejecuta como supabase_read_only_user, sin crear funciones ni grants.
        const data = await jsonRequest(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT}/database/query/read-only`, env.VIDA_SUPABASE_METRICS_TOKEN, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "select now() as measured_at, pg_database_size(current_database()) as database_bytes, (select coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::numeric else 0 end),0) from storage.objects) as storage_bytes" }),
        })
        if (!Array.isArray(data) || !data[0] || finiteUsage(data[0].database_bytes) === null || finiteUsage(data[0].storage_bytes) === null) throw new Error('Medición inválida')
        supabase.metrics[0].used = finiteUsage(data[0].database_bytes)
        supabase.metrics[1].used = finiteUsage(data[0].storage_bytes)
        supabase.status = 'ok'; supabase.measuredAt = new Date(data[0].measured_at).toISOString()
        supabase.detail = 'Medición de solo lectura. No incluye otras cuotas de tráfico, Auth o WAL.'
      } catch { supabase.status = 'unavailable'; supabase.detail = 'No se pudo medir Supabase. Revisa autorización y panel del proveedor.' }
    })(),
    ...neon.map(async (resource, index) => {
      if (!env.VIDA_NEON_METRICS_TOKEN) return
      const project = index === 0 ? 'rough-glitter-04635242' : 'curly-scene-97670657'
      try {
        const data = await jsonRequest(`https://console.neon.tech/api/v2/projects/${project}`, env.VIDA_NEON_METRICS_TOKEN)
        const value = data.project
        if (!value || value.id !== project) throw new Error('Proyecto inválido')
        // synthetic_storage_size y cpu_used_sec son campos heredados que pueden devolver cero.
        try {
          const branches = await jsonRequest(`https://console.neon.tech/api/v2/projects/${project}/branches?limit=100`, env.VIDA_NEON_METRICS_TOKEN)
          const primary = branches.branches?.find((branch: { default?: boolean; primary?: boolean }) => branch.default || branch.primary)
          resource.metrics[0].used = finiteUsage(primary?.logical_size)
          const sizeLimit = finiteUsage(value.branch_logical_size_limit_bytes)
          resource.metrics[0].limit = sizeLimit && sizeLimit > 0 ? sizeLimit : null
        } catch { /* Las demás métricas siguen disponibles si falla el listado de ramas. */ }
        const cpu = finiteUsage(value.compute_time_seconds)
        resource.metrics[1].used = cpu === null ? null : cpu / 3600
        resource.metrics[2].used = finiteUsage(value.data_transfer_bytes)
        if (value.owner?.subscription_type === 'free_v3') {
          resource.metrics[1].limit ??= 100
          resource.metrics[2].limit ??= 5000000000
          resource.metrics[1].note += ' Referencia Free v3: 100 CU-h/mes; confirmar en el panel si cambia el plan.'
          resource.metrics[2].note += ' Referencia Free v3: 5 GB/mes; confirmar en el panel si cambia el plan.'
        }
        if (resource.metrics.every(item => item.used === null)) throw new Error('Sin métricas')
        resource.status = 'ok'; resource.measuredAt = new Date().toISOString()
        resource.detail = value.consumption_period_start && value.consumption_period_end
          ? `Período informado: ${String(value.consumption_period_start).slice(0, 10)} a ${String(value.consumption_period_end).slice(0, 10)}. Puede haber retraso del proveedor.`
          : 'Lectura del proveedor. El período mensual no está disponible.'
      } catch { resource.status = 'unavailable'; resource.detail = 'No se pudo consultar este proyecto Neon. Revisa su autorización.' }
    }),
    (async () => {
      if (!env.VIDA_CLOUDFLARE_METRICS_TOKEN || !env.VIDA_CLOUDFLARE_ACCOUNT_ID) return
      try {
        const data = await jsonRequest(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.VIDA_CLOUDFLARE_ACCOUNT_ID)}/r2/metrics`, env.VIDA_CLOUDFLARE_METRICS_TOKEN)
        const size = finiteUsage(data.result?.standard?.published?.payloadSize)
        if (!data.success || size === null) throw new Error('Sin métricas')
        cloudflare.metrics[0].used = size
        cloudflare.status = 'ok'; cloudflare.measuredAt = new Date().toISOString()
        cloudflare.detail = 'Toda la cuenta R2, incluidos otros buckets. No incluye cargas incompletas, metadatos ni almacenamiento Infrequent Access. Operaciones y facturación deben revisarse en Cloudflare.'
      } catch { cloudflare.status = 'unavailable'; cloudflare.detail = 'No se pudo medir R2. Revisa la conexión y los permisos de métricas.' }
    })(),
  ])
  return [supabase, ...neon, cloudflare]
}

// Se autoriza cada petición ANTES de acceder a esta caché técnica compartida.
export const getResourceUsage = unstable_cache(() => collectResourceUsage(), ['vida-resource-usage-v1'], { revalidate: 300 })
