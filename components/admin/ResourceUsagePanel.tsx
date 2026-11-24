'use client'

import { useEffect, useState } from 'react'
import { Database, RefreshCw } from 'lucide-react'
import { formatResource, resourceLevel, type ResourceUsage } from '@/lib/admin/resource-metrics'

export default function ResourceUsagePanel() {
  const [resources, setResources] = useState<ResourceUsage[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin/recursos', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('No se pudo actualizar el consumo. Revisa tu sesión e inténtalo de nuevo.')
        return response.json()
      })
      .then(data => { if (!controller.signal.aborted) setResources(data.resources) })
      .catch(reason => { if (!controller.signal.aborted) setError(reason.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [request])

  const alerts = resources?.flatMap(resource => resource.metrics.filter(item => {
    const level = resourceLevel(item.used, item.limit)
    return level.percent !== null && level.percent >= 70
  }).map(item => `${resource.name}: ${item.label}`)) ?? []

  return (
    <section className="my-6 min-w-0 text-slate-900" aria-labelledby="resource-usage-title">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="resource-usage-title" className="flex items-center gap-2 text-base font-bold"><Database className="h-5 w-5 shrink-0" />Recursos y cuotas</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">Almacenamiento y consumo de los servicios de VIDA.</p>
        </div>
        <button type="button" onClick={() => { setLoading(true); setError(null); setRequest(value => value + 1) }} disabled={loading} aria-label="Actualizar consumo" className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>
      <div aria-live="polite">
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}{resources ? ' Los valores anteriores pueden estar desactualizados.' : ''}</p>}
        {loading && !resources && <p className="py-4 text-sm text-slate-600">Consultando recursos…</p>}
        {alerts.length > 0 && <p role="status" className="mt-3 text-sm font-semibold text-amber-800">Revisar consumo: {alerts.join('; ')}. Comprueba crecimiento y archivos duplicados antes de tomar medidas.</p>}
      </div>
      <div className="mt-4 divide-y divide-slate-200">
        {resources?.map(resource => (
          <article key={resource.id} className="min-w-0 py-5 first:pt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold">{resource.name}</h3>
              <span className="text-xs text-slate-600">{resource.status === 'ok' ? 'Lectura disponible' : resource.status === 'unconfigured' ? 'Pendiente de conexión' : 'Medición no disponible'}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">{resource.detail}</p>
            <div className="mt-3 space-y-4">
              {resource.metrics.map(item => {
                const level = resourceLevel(item.used, item.limit)
                const color = level.tone === 'critical' || level.tone === 'urgent' ? 'bg-red-600' : level.tone === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'
                return (
                  <div key={item.id}>
                    <div className="flex flex-wrap justify-between gap-1 text-xs"><span className="font-semibold">{item.label}</span><span>{formatResource(item.used, item.unit)} / {item.limit === null ? 'Cuota por confirmar' : formatResource(item.limit, item.unit)}</span></div>
                    {level.percent === null ? <p className="mt-1 text-xs text-slate-500">Sin porcentaje disponible</p> : <>
                      <div role="progressbar" aria-label={`${resource.name}: ${item.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, level.percent)} aria-valuetext={`${level.percent.toFixed(1)}% utilizado`} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, level.percent)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-700">{level.label} · {level.percent.toFixed(1)}% · {item.used! > item.limit! ? 'Cuota superada' : `${formatResource(Math.max(0, item.limit! - item.used!), item.unit)} de margen`}</p>
                    </>}
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
                  </div>
                )
              })}
            </div>
            <footer className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-600">
              <span>{resource.measuredAt ? `Consultado: ${new Date(resource.measuredAt).toLocaleString('es-SV')}` : 'Sin medición confirmada'}</span>
              <a href={resource.dashboard} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">Ver en proveedor</a>
            </footer>
          </article>
        ))}
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">Lecturas con caché de hasta 5 minutos. Avisos al 70%, 85% y 95%. Este panel se consulta al abrirlo o actualizarlo; no envía alertas en segundo plano ni bloquea gastos. Las métricas pendientes no equivalen a consumo cero.</p>
    </section>
  )
}
