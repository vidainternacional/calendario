'use client'

import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  HandHeart,
  HeartHandshake,
  MessageSquareWarning,
  Repeat2,
  Route,
  Users,
  X,
} from 'lucide-react'

type ParticipantSnapshot = {
  id: string
  name: string
  email: string | null
  role: string
  completed: boolean
  hasPush: boolean
  lastSeenAt: string | null
  pageViews: number
  actions: number
}

type UsageSnapshot = {
  profileId: string
  name: string
  eventName: string
  route: string | null
  occurredAt: string
}

type OperationKind = 'evento' | 'asignacion' | 'aviso' | 'intercambio'

type OperationSnapshot = {
  id: string
  kind: OperationKind
  title: string
  detail: string | null
  status: string | null
  occurredAt: string
}

type IssueSnapshot = {
  id: string
  name: string
  role: string
  route: string | null
  description: string
  status: string
  occurredAt: string
}

type SolidaritySnapshot = {
  totalRequests: number
  openRequests: number
  totalContributions: number
  availableContributions: number
}

type PanelKey =
  | 'participantes'
  | 'recorrido'
  | 'actividad'
  | 'notificaciones'
  | 'problemas'
  | 'evento'
  | 'asignacion'
  | 'aviso'
  | 'intercambio'
  | 'rutas'
  | 'solidaridad'

const PERIODS = [7, 30, 90] as const

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

function dateWithin(value: string | null, cutoff: number) {
  if (!value) return false
  return new Date(value).getTime() >= cutoff
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-SV', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function buildBuckets(values: string[], days: number) {
  const bucketCount = 14
  const now = Date.now()
  const rangeMs = days * 24 * 60 * 60 * 1000
  const bucketMs = rangeMs / bucketCount
  const counts = Array.from({ length: bucketCount }, () => 0)

  values.forEach((value) => {
    const age = now - new Date(value).getTime()
    if (age < 0 || age > rangeMs) return
    const fromOldest = bucketCount - 1 - Math.min(bucketCount - 1, Math.floor(age / bucketMs))
    counts[fromOldest] += 1
  })

  return counts
}

export default function PilotAnalyticsDashboard({
  participants,
  usage,
  operations,
  issues,
  solidarity,
}: {
  participants: ParticipantSnapshot[]
  usage: UsageSnapshot[]
  operations: OperationSnapshot[]
  issues: IssueSnapshot[]
  solidarity: SolidaritySnapshot
}) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(7)
  const [panel, setPanel] = useState<PanelKey | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const cutoff = Date.now() - period * 24 * 60 * 60 * 1000
  const periodUsage = useMemo(() => usage.filter((item) => dateWithin(item.occurredAt, cutoff)), [usage, cutoff])
  const periodOperations = useMemo(() => operations.filter((item) => dateWithin(item.occurredAt, cutoff)), [operations, cutoff])
  const periodIssues = useMemo(() => issues.filter((item) => dateWithin(item.occurredAt, cutoff)), [issues, cutoff])

  const activeIds = useMemo(() => new Set(periodUsage.map((item) => item.profileId)), [periodUsage])
  const completed = participants.filter((item) => item.completed).length
  const pushEnabled = participants.filter((item) => item.hasPush).length
  const active = activeIds.size
  const openIssues = periodIssues.filter((item) => item.status !== 'resuelto').length
  const adoption = participants.length > 0
    ? Math.round((percentage(completed, participants.length) + percentage(active, participants.length) + percentage(pushEnabled, participants.length)) / 3)
    : 0

  const routeCounts = useMemo(() => {
    const map = new Map<string, { count: number; people: Set<string> }>()
    periodUsage.filter((item) => item.eventName === 'page_view' && item.route).forEach((item) => {
      const route = item.route || '/'
      const current = map.get(route) || { count: 0, people: new Set<string>() }
      current.count += 1
      current.people.add(item.profileId)
      map.set(route, current)
    })
    return [...map.entries()]
      .map(([route, value]) => ({ route, count: value.count, people: value.people.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [periodUsage])

  const operationGroups = useMemo(() => ({
    evento: periodOperations.filter((item) => item.kind === 'evento'),
    asignacion: periodOperations.filter((item) => item.kind === 'asignacion'),
    aviso: periodOperations.filter((item) => item.kind === 'aviso'),
    intercambio: periodOperations.filter((item) => item.kind === 'intercambio'),
  }), [periodOperations])

  const progressMetrics = [
    { key: 'participantes' as PanelKey, label: 'Participantes', value: participants.length, detail: 'seleccionados para el piloto', icon: Users, tone: 'text-violet-200 bg-violet-400/12' },
    { key: 'actividad' as PanelKey, label: `Activos en ${period} días`, value: active, detail: `${percentage(active, participants.length)}% de la cohorte`, icon: Activity, tone: 'text-cyan-200 bg-cyan-400/12' },
    { key: 'recorrido' as PanelKey, label: 'Recorrido completo', value: completed, detail: `${percentage(completed, participants.length)}% completado`, icon: CheckCircle2, tone: 'text-emerald-200 bg-emerald-400/12' },
    { key: 'notificaciones' as PanelKey, label: 'Notificaciones', value: pushEnabled, detail: `${percentage(pushEnabled, participants.length)}% con dispositivo`, icon: BellRing, tone: 'text-amber-200 bg-amber-400/12' },
  ]

  const operationCards = [
    { key: 'evento' as PanelKey, label: 'Eventos creados', values: operationGroups.evento, icon: CalendarCheck2, gradient: 'from-violet-500 to-fuchsia-400' },
    { key: 'asignacion' as PanelKey, label: 'Asignaciones', values: operationGroups.asignacion, icon: ClipboardList, gradient: 'from-cyan-400 to-sky-500' },
    { key: 'aviso' as PanelKey, label: 'Avisos publicados', values: operationGroups.aviso, icon: Eye, gradient: 'from-indigo-400 to-violet-500' },
    { key: 'intercambio' as PanelKey, label: 'Intercambios', values: operationGroups.intercambio, icon: Repeat2, gradient: 'from-emerald-400 to-cyan-400' },
  ]

  const selectedPanel = panel ? panelContent(panel, {
    participants,
    activeIds,
    usage: periodUsage,
    issues: periodIssues,
    operationGroups,
    routes: routeCounts,
    solidarity,
    period,
  }) : null

  return (
    <>
      <section className="relative overflow-hidden bg-[#0b1020] px-4 pb-7 pt-[calc(1.25rem+env(safe-area-inset-top))] text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-90" style={{ backgroundImage: 'radial-gradient(circle at 12% 4%, rgba(124,58,237,.34), transparent 32%), radial-gradient(circle at 88% 18%, rgba(34,211,238,.18), transparent 28%), linear-gradient(180deg, rgba(255,255,255,.025), transparent 50%)' }} />
        <div className="relative mx-auto max-w-4xl">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">Piloto operativo</p>
              <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-[-0.04em] sm:text-[36px]">Centro de Análisis Global</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Adopción, recorridos, actividad, operaciones y bloqueos reales de VIDA.</p>
            </div>
            <div className="grid grid-cols-3 rounded-2xl bg-white/[0.07] p-1 ring-1 ring-white/10 backdrop-blur">
              {PERIODS.map((days) => (
                <button key={days} onClick={() => setPeriod(days)} className={`min-h-10 rounded-xl px-3 text-xs font-bold transition ${period === days ? 'bg-violet-500 text-white shadow-lg shadow-violet-950/30' : 'text-slate-300'}`}>
                  {days} días
                </button>
              ))}
            </div>
          </header>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
            <article className="rounded-[26px] border border-violet-400/35 bg-white/[0.055] p-4 shadow-[0_24px_80px_rgba(0,0,0,.26)] backdrop-blur-xl sm:p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <button onClick={() => setPanel('participantes')} className="relative mx-auto grid h-44 w-44 shrink-0 place-items-center rounded-full text-center sm:mx-0" style={{ background: `conic-gradient(#7c5cff 0 ${adoption}%, rgba(255,255,255,.08) ${adoption}% 100%)` }}>
                  <span className="absolute inset-[11px] rounded-full bg-[#10162b] ring-1 ring-cyan-300/20" />
                  <span className="relative">
                    <span className="block text-4xl font-extrabold tracking-[-0.05em] text-cyan-200">{adoption}%</span>
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">adopción</span>
                  </span>
                </button>

                <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5">
                  {progressMetrics.map(({ key, label, value, detail, icon: Icon, tone }) => (
                    <button key={key} onClick={() => setPanel(key)} className="min-w-0 rounded-2xl border border-white/[0.08] bg-black/10 p-3 text-left transition active:scale-[0.985]">
                      <span className={`grid h-8 w-8 place-items-center rounded-full ${tone}`}><Icon className="h-4 w-4" /></span>
                      <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">{value}</p>
                      <p className="mt-1 truncate text-[11px] font-bold text-slate-300">{label}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">{detail}</p>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <button onClick={() => setPanel('problemas')} className={`rounded-[24px] border p-4 text-left ${openIssues > 0 ? 'border-rose-400/35 bg-rose-500/10' : 'border-emerald-400/25 bg-emerald-500/8'}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${openIssues > 0 ? 'bg-rose-400/15 text-rose-200' : 'bg-emerald-400/15 text-emerald-200'}`}><MessageSquareWarning className="h-5 w-5" /></span>
                  <ChevronRight className="h-5 w-5 text-white/35" />
                </div>
                <p className="mt-4 text-3xl font-extrabold">{openIssues}</p>
                <p className="mt-1 text-xs font-bold text-slate-200">Problemas abiertos</p>
                <p className="mt-1 text-[11px] text-slate-500">Reportados durante el período</p>
              </button>

              <button onClick={() => setPanel('solidaridad')} className="rounded-[24px] border border-cyan-300/25 bg-cyan-400/[0.07] p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-cyan-300/12 text-cyan-200"><HeartHandshake className="h-5 w-5" /></span>
                  <ChevronRight className="h-5 w-5 text-white/35" />
                </div>
                <div className="mt-4 flex items-end gap-4">
                  <div><p className="text-3xl font-extrabold">{solidarity.openRequests}</p><p className="mt-1 text-[11px] text-slate-400">solicitudes activas</p></div>
                  <div><p className="text-2xl font-extrabold text-cyan-200">{solidarity.availableContributions}</p><p className="mt-1 text-[11px] text-slate-400">aportes disponibles</p></div>
                </div>
              </button>
            </div>
          </div>

          <section className="mt-3 rounded-[26px] border border-violet-400/30 bg-white/[0.045] p-4 backdrop-blur-xl sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="font-extrabold">Flujo de operaciones</h2><p className="mt-1 text-xs text-slate-500">Actividad registrada en los últimos {period} días.</p></div>
              <Activity className="h-5 w-5 text-cyan-200/70" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {operationCards.map(({ key, label, values, icon: Icon, gradient }) => {
                const bars = buildBuckets(values.map((item) => item.occurredAt), period)
                const max = Math.max(1, ...bars)
                return (
                  <button key={key} onClick={() => setPanel(key)} className="min-w-0 rounded-2xl border border-white/[0.07] bg-black/10 p-3 text-left transition active:scale-[0.985]">
                    <div className="flex items-center justify-between gap-2"><Icon className="h-4 w-4 text-slate-300" /><ChevronRight className="h-4 w-4 text-white/25" /></div>
                    <p className="mt-3 text-2xl font-extrabold">{values.length}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-300">{label}</p>
                    <div className="mt-3 flex h-9 items-end gap-[3px]" aria-hidden="true">
                      {bars.map((value, index) => <span key={index} className={`min-w-0 flex-1 rounded-t-sm bg-gradient-to-t ${gradient}`} style={{ height: `${Math.max(8, Math.round((value / max) * 100))}%`, opacity: value === 0 ? .18 : .9 }} />)}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-3 grid gap-3 lg:grid-cols-[1fr_.7fr]">
            <button onClick={() => setPanel('rutas')} className="rounded-[26px] border border-cyan-300/25 bg-white/[0.04] p-4 text-left backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between gap-3"><div><h2 className="font-extrabold">Pantallas más visitadas</h2><p className="mt-1 text-xs text-slate-500">Toque para ver visitas y personas.</p></div><Route className="h-5 w-5 text-cyan-200" /></div>
              <div className="mt-4 space-y-3">
                {routeCounts.length === 0 ? <p className="py-5 text-center text-sm text-slate-500">La actividad aparecerá cuando la cohorte use VIDA.</p> : routeCounts.slice(0, 5).map((item) => {
                  const max = Math.max(1, routeCounts[0]?.count || 1)
                  return <div key={item.route}><div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate font-semibold text-slate-300">{item.route}</span><span className="shrink-0 text-slate-500">{item.count}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300" style={{ width: `${Math.max(5, Math.round((item.count / max) * 100))}%` }} /></div></div>
                })}
              </div>
            </button>

            <Link href="/admin/ayuda-solidaria" className="group flex min-h-[190px] flex-col justify-between rounded-[26px] border border-emerald-300/25 bg-[linear-gradient(145deg,rgba(16,185,129,.14),rgba(34,211,238,.05))] p-5">
              <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-300/12 text-emerald-200"><HandHeart className="h-5 w-5" /></span><ChevronRight className="h-5 w-5 text-white/35 transition group-hover:translate-x-1" /></div>
              <div><p className="text-xl font-extrabold">Gestión solidaria</p><p className="mt-2 text-sm leading-6 text-slate-400">Revisar solicitudes privadas, coordinar entregas y contactar a donantes.</p></div>
            </Link>
          </section>
        </div>
      </section>

      {mounted && selectedPanel && createPortal(
        <div className="fixed inset-0 z-[170] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setPanel(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="analytics-panel-title" className="flex max-h-[84dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-violet-500">Detalle interactivo</p><h2 id="analytics-panel-title" className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#171923]">{selectedPanel.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{selectedPanel.subtitle}</p></div>
              <button onClick={() => setPanel(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </header>
            <div className="overflow-y-auto p-4 sm:p-5">{selectedPanel.content}</div>
          </section>
        </div>,
        document.body,
      )}
    </>
  )
}

function panelContent(panel: PanelKey, data: {
  participants: ParticipantSnapshot[]
  activeIds: Set<string>
  usage: UsageSnapshot[]
  issues: IssueSnapshot[]
  operationGroups: Record<OperationKind, OperationSnapshot[]>
  routes: Array<{ route: string; count: number; people: number }>
  solidarity: SolidaritySnapshot
  period: number
}) {
  if (panel === 'participantes') return { title: 'Participantes del piloto', subtitle: `${data.participants.length} personas seleccionadas`, content: <ParticipantList items={data.participants} activeIds={data.activeIds} /> }
  if (panel === 'recorrido') return { title: 'Progreso del recorrido', subtitle: 'Quién completó la guía inicial y quién continúa pendiente.', content: <ParticipantList items={[...data.participants].sort((a, b) => Number(b.completed) - Number(a.completed))} activeIds={data.activeIds} mode="onboarding" /> }
  if (panel === 'actividad') return { title: `Actividad en ${data.period} días`, subtitle: 'Personas que generaron actividad registrada durante el período.', content: <ParticipantList items={data.participants.filter((item) => data.activeIds.has(item.id))} activeIds={data.activeIds} mode="activity" /> }
  if (panel === 'notificaciones') return { title: 'Estado de notificaciones', subtitle: 'Dispositivos registrados para recibir avisos push.', content: <ParticipantList items={[...data.participants].sort((a, b) => Number(b.hasPush) - Number(a.hasPush))} activeIds={data.activeIds} mode="push" /> }
  if (panel === 'problemas') return { title: 'Problemas reportados', subtitle: `${data.issues.filter((item) => item.status !== 'resuelto').length} requieren atención`, content: <IssueList items={data.issues} /> }
  if (panel === 'rutas') return { title: 'Pantallas más visitadas', subtitle: 'Visitas y participantes únicos por pantalla.', content: <div className="space-y-2">{data.routes.length === 0 ? <EmptyPanel /> : data.routes.map((item) => <div key={item.route} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#171923]">{item.route}</p><p className="mt-1 text-xs text-slate-400">{item.people} persona{item.people === 1 ? '' : 's'} distinta{item.people === 1 ? '' : 's'}</p></div><span className="shrink-0 text-2xl font-extrabold text-violet-600">{item.count}</span></div>)}</div> }
  if (panel === 'solidaridad') return { title: 'Ayuda Solidaria', subtitle: 'Solo se muestran totales. Los motivos permanecen en el panel privado.', content: <div className="space-y-3"><div className="grid grid-cols-2 gap-3"><Stat label="Solicitudes totales" value={data.solidarity.totalRequests} /><Stat label="Solicitudes activas" value={data.solidarity.openRequests} /><Stat label="Aportes totales" value={data.solidarity.totalContributions} /><Stat label="Aportes disponibles" value={data.solidarity.availableContributions} /></div><Link href="/admin/ayuda-solidaria" className="flex min-h-12 items-center justify-center rounded-2xl bg-[#5b3df5] px-4 text-sm font-extrabold text-white">Abrir gestión privada</Link></div> }

  const kind = panel as OperationKind
  const labels: Record<OperationKind, string> = { evento: 'Eventos creados', asignacion: 'Asignaciones', aviso: 'Avisos publicados', intercambio: 'Intercambios' }
  return { title: labels[kind], subtitle: `Actividad de los últimos ${data.period} días`, content: <OperationList items={data.operationGroups[kind]} /> }
}

function ParticipantList({ items, activeIds, mode = 'general' }: { items: ParticipantSnapshot[]; activeIds: Set<string>; mode?: 'general' | 'onboarding' | 'activity' | 'push' }) {
  if (items.length === 0) return <EmptyPanel />
  return <div className="overflow-hidden rounded-[22px] border border-slate-100">{items.map((item, index) => {
    const status = mode === 'onboarding' ? (item.completed ? 'Completado' : 'Pendiente') : mode === 'push' ? (item.hasPush ? 'Dispositivo activo' : 'Sin dispositivo') : mode === 'activity' ? `${item.pageViews} vistas · ${item.actions} acciones` : (activeIds.has(item.id) ? 'Activo en el período' : 'Sin actividad reciente')
    const positive = mode === 'onboarding' ? item.completed : mode === 'push' ? item.hasPush : activeIds.has(item.id)
    return <div key={item.id} className={`flex items-center gap-3 px-4 py-3.5 ${index < items.length - 1 ? 'border-b border-slate-100' : ''}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-50 text-sm font-extrabold text-violet-600">{item.name.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#171923]">{item.name}</p><p className="mt-1 truncate text-xs text-slate-400">{item.role} · {item.email || 'sin correo'}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{status}</span></div>
  })}</div>
}

function OperationList({ items }: { items: OperationSnapshot[] }) {
  if (items.length === 0) return <EmptyPanel />
  return <div className="space-y-2">{items.slice(0, 100).map((item) => <div key={`${item.kind}-${item.id}`} className="rounded-2xl bg-slate-50 px-4 py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#171923]">{item.title}</p>{item.detail && <p className="mt-1 truncate text-xs text-slate-500">{item.detail}</p>}</div>{item.status && <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{item.status}</span>}</div><p className="mt-2 text-[11px] text-slate-400">{formatDate(item.occurredAt)}</p></div>)}</div>
}

function IssueList({ items }: { items: IssueSnapshot[] }) {
  if (items.length === 0) return <EmptyPanel />
  return <div className="space-y-2">{items.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-[#171923]">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.role} · {item.route || 'ruta no disponible'}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.status === 'resuelto' ? 'bg-emerald-50 text-emerald-700' : item.status === 'revisando' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{item.status}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-5 text-slate-600">{item.description}</p><p className="mt-2 text-[11px] text-slate-400">{formatDate(item.occurredAt)}</p></div>)}</div>
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-3xl font-extrabold text-[#171923]">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>
}

function EmptyPanel() {
  return <div className="py-12 text-center"><p className="text-sm font-semibold text-slate-400">Todavía no hay información para este período.</p></div>
}
