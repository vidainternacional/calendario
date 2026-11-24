export type ResourceMetric = {
  id: string
  label: string
  used: number | null
  limit: number | null
  unit: 'bytes' | 'CU-h'
  note: string
}

export type ResourceUsage = {
  id: string
  name: string
  status: 'ok' | 'unconfigured' | 'unavailable'
  measuredAt: string | null
  detail: string
  dashboard: string
  metrics: ResourceMetric[]
}

export function finiteUsage(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

export function resourceLevel(used: number | null, limit: number | null) {
  if (used === null || limit === null || limit <= 0) return { label: 'Sin datos de cuota', percent: null, tone: 'unknown' }
  const percent = used / limit * 100
  const tone = percent >= 95 ? 'critical' : percent >= 85 ? 'urgent' : percent >= 70 ? 'warning' : 'normal'
  const label = tone === 'critical' ? 'Crítico' : tone === 'urgent' ? 'Urgente' : tone === 'warning' ? 'Revisar consumo' : 'Dentro del margen'
  return { label, percent, tone }
}

export function formatResource(value: number | null, unit: ResourceMetric['unit']) {
  if (value === null) return 'Sin datos'
  if (unit === 'CU-h') return `${value.toLocaleString('es-SV', { maximumFractionDigits: 1 })} CU-h`
  if (value >= 1e9) return `${(value / 1e9).toLocaleString('es-SV', { maximumFractionDigits: 2 })} GB`
  if (value >= 1e6) return `${(value / 1e6).toLocaleString('es-SV', { maximumFractionDigits: 1 })} MB`
  if (value >= 1e3) return `${(value / 1e3).toLocaleString('es-SV', { maximumFractionDigits: 1 })} KB`
  return `${value} B`
}
