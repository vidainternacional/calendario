'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Activity,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
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

function within(value: string | null, cutoff: number) {
  return Boolean(value && new Date(value).getTime() >= cutoff)
}

function dateLabel(value: string | null) {
  if (!value) return 'Sin actividad registrada'
  return new Date(value).toLocaleString('es-SV', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
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
  const cutoff = Date.now() - period * 24 * 60 * 60 * 1000

  const periodUsage = useMemo(() => usage.filter((item) => within(item.occurredAt, cutoff)), [usage, cutoff])
  const periodOperations = useMemo(() => operations.filter((item) => within(item.occurredAt, cutoff)), [operations, cutoff])
  const periodIssues = useMemo(() => issues.filter((item) => within(item.occurredAt, cutoff)), [issues, cutoff])
  const activeIds = useMemo(() => new Set(periodUsage.map((item) => item.profileId)), [periodUsage])

  const completed = participants.filter((item) => item.completed).length
  const pushEnabled = participants.filter((item) => item.hasPush).length
  const active = activeIds.size
  const openIssues = periodIssues.filter((item) => item.status !== 'resuelto').length
  const adoption = participants.length
    ? Math.round((percentage(completed, participants.length) + percentage(active, participants.length) + percentage(pushEnabled, participants.length)) / 3)
    : 0

  const operationGroups = {
    evento: periodOperations.filter((item) => item.kind === 'evento'),
    asignacion: periodOperations.filter((item) => item.kind === 'asignacion'),
    aviso: periodOperations.filter((item) => item.kind === 'aviso'),
    intercambio: periodOperations.filter((item) => item.kind === 'intercambio'),
  }

  const routes = useMemo(() => {
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

  const metrics = [
    { key: 'participantes' as PanelKey, label: 'Participantes', value: participants.length, detail: 'seleccionados', icon: Users, tone: 'bg-indigo-50 text-indigo-600' },
    { key: 'actividad' as PanelKey, label: 'Activos', value: active, detail: `últimos ${period} días`, icon: Activity, tone: 'bg-sky-50 text-sky-600' },
    { key: 'recorrido' as PanelKey, label: 'Recorrido', value: completed, detail: `${percentage(completed, participants.length)}% completo`, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
    { key: 'notificaciones' as PanelKey, label: 'Notificaciones', value: pushEnabled, detail: `${percentage(pushEnabled, participants.length)}% activadas`, icon: BellRing, tone: 'bg-amber-50 text-amber-600' },
  ]

  const operationCards = [
    { key: 'evento' as PanelKey, label: 'Eventos creados', value: operationGroups.evento.length, icon: CalendarCheck2, tone: 'bg-indigo-50 text-indigo-600' },
    { key: 'asignacion' as PanelKey, label: 'Asignaciones', value: operationGroups.asignacion.length, icon: ClipboardList, tone: 'bg-sky-50 text-sky-600' },
    { key: 'aviso' as PanelKey, label: 'Avisos publicados', value: operationGroups.aviso.length, icon: Eye, tone: 'bg-violet-50 text-violet-600' },
    { key: 'intercambio' as PanelKey, label: 'Intercambios', value: operationGroups.intercambio.length, icon: Repeat2, tone: 'bg-emerald-50 text-emerald-600' },
  ]

  const panelTitle: Record<PanelKey, string> = {
    participantes: 'Participantes del piloto',
    recorrido: 'Recorrido inicial',
    actividad: 'Actividad reciente',
    notificaciones: 'Notificaciones activas',
    problemas: 'Problemas reportados',
    evento: 'Eventos creados',
    asignacion: 'Asignaciones',
    aviso: 'Avisos publicados',
    intercambio: 'Intercambios',
    rutas: 'Pantallas más visitadas',
    solidaridad: 'Ayuda Solidaria',
  }

  function panelRows() {
    if (!panel) return []
    if (panel === 'participantes') return participants.map((item) => ({ title: item.name, detail: `${item.role} · ${dateLabel(item.lastSeenAt)}` }))
    if (panel === 'recorrido') return participants.map((item) => ({ title: item.name, detail: item.completed ? 'Recorrido completado' : 'Recorrido pendiente' }))
    if (panel === 'actividad') return participants.filter((item) => activeIds.has(item.id)).map((item) => ({ title: item.name, detail: `${item.pageViews} vistas · ${item.actions} acciones` }))
    if (panel === 'notificaciones') return participants.map((item) => ({ title: item.name, detail: item.hasPush ? 'Dispositivo registrado' : 'Sin notificaciones activas' }))
    if (panel === 'problemas') return periodIssues.map((item) => ({ title: item.name, detail: `${item.description} · ${item.status}` }))
    if (panel === 'rutas') return routes.map((item) => ({ title: item.route, detail: `${item.count} visitas · ${item.people} personas` }))
    if (panel === 'solidaridad') return [
      { title: 'Solicitudes activas', detail: String(solidarity.openRequests) },
      { title: 'Solicitudes totales', detail: String(solidarity.totalRequests) },
      { title: 'Aportes disponibles', detail: String(solidarity.availableContributions) },
      { title: 'Aportes totales', detail: String(solidarity.totalContributions) },
    ]
    return operationGroups[panel].map((item) => ({ title: item.title, detail: `${item.detail || 'Sin detalle'}${item.status ? ` · ${item.status}` : ''}` }))
  }

  return (
    <section className="w-full bg-[#f4f5f9] pb-7 pt-[calc(1rem+env(safe-area-inset-top))] text-[#171923]">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Piloto operativo</p>
            <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-[-0.04em] sm:text-[36px]">Centro de Análisis</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Adopción, actividad y operaciones reales de VIDA.</p>
          </div>
          <div className="grid grid-cols-3 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/[0.05]">
            {PERIODS.map((days) => (
              <button key={days} onClick={() => setPeriod(days)} className={`min-h-10 rounded-xl px-3 text-xs font-bold ${period === days ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                {days} días
              </button>
            ))}
          </div>
        </header>

        <div className="mt-5 overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-black/[0.045]">
          <button onClick={() => setPanel('participantes')} className="flex w-full items-center gap-4 border-b border-slate-100 p-5 text-left">
            <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#4f46e5 0 ${adoption}%, #eef0f6 ${adoption}% 100%)` }}>
              <span className="absolute inset-[8px] rounded-full bg-white" />
              <span className="relative text-2xl font-extrabold text-indigo-600">{adoption}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-extrabold">Adopción del piloto</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">Promedio de actividad, recorrido y notificaciones.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </button>
          <div className="grid grid-cols-2">
            {metrics.map(({ key, label, value, detail, icon: Icon, tone }, index) => (
              <button key={key} onClick={() => setPanel(key)} className={`min-w-0 p-4 text-left active:bg-slate-50 ${index % 2 === 0 ? 'border-r border-slate-100' : ''} ${index < 2 ? 'border-b border-slate-100' : ''}`}>
                <span className={`grid h-9 w-9 place-items-center rounded-full ${tone}`}><Icon className="h-[18px] w-[18px]" /></span>
                <p className="mt-3 text-2xl font-extrabold">{value}</p>
                <p className="mt-1 truncate text-xs font-bold">{label}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">{detail}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button onClick={() => setPanel('problemas')} className="rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/[0.045]">
            <div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-600"><MessageSquareWarning className="h-5 w-5" /></span><ChevronRight className="h-5 w-5 text-slate-300" /></div>
            <p className="mt-4 text-3xl font-extrabold">{openIssues}</p><p className="mt-1 text-xs font-bold">Problemas abiertos</p>
          </button>
          <button onClick={() => setPanel('solidaridad')} className="rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/[0.045]">
            <div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600"><HeartHandshake className="h-5 w-5" /></span><ChevronRight className="h-5 w-5 text-slate-300" /></div>
            <div className="mt-4 flex gap-8"><div><p className="text-3xl font-extrabold">{solidarity.openRequests}</p><p className="text-[11px] text-slate-400">solicitudes activas</p></div><div><p className="text-2xl font-extrabold text-emerald-600">{solidarity.availableContributions}</p><p className="text-[11px] text-slate-400">aportes</p></div></div>
          </button>
        </div>

        <section className="mt-4 overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-black/[0.045]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div><h2 className="font-extrabold">Flujo de operaciones</h2><p className="mt-1 text-xs text-slate-400">Últimos {period} días</p></div><Activity className="h-5 w-5 text-indigo-500" /></div>
          <div className="grid grid-cols-2">
            {operationCards.map(({ key, label, value, icon: Icon, tone }, index) => (
              <button key={key} onClick={() => setPanel(key)} className={`p-4 text-left ${index % 2 === 0 ? 'border-r border-slate-100' : ''} ${index < 2 ? 'border-b border-slate-100' : ''}`}>
                <span className={`grid h-9 w-9 place-items-center rounded-full ${tone}`}><Icon className="h-[18px] w-[18px]" /></span>
                <p className="mt-3 text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs font-bold">{label}</p>
              </button>
            ))}
          </div>
        </section>

        <button onClick={() => setPanel('rutas')} className="mt-4 flex w-full items-center gap-3 rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/[0.045]">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Route className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><p className="font-extrabold">Pantallas más visitadas</p><p className="mt-1 text-xs text-slate-400">Consulta rutas, visitas y personas únicas.</p></div><ChevronRight className="h-5 w-5 text-slate-300" />
        </button>

        <div className="mt-5"><Link href="/admin" className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-black/[0.05]">Volver a Administración</Link></div>
      </div>

      {panel && (
        <div className="fixed inset-0 z-[180] flex items-end bg-slate-950/25 sm:items-center sm:justify-center" onMouseDown={(event) => event.target === event.currentTarget && setPanel(null)}>
          <section className="max-h-[82dvh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-w-lg sm:rounded-[28px]">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div><p className="text-[11px] font-bold uppercase tracking-wide text-indigo-500">Detalle</p><h2 className="mt-1 text-lg font-extrabold">{panelTitle[panel]}</h2></div><button onClick={() => setPanel(null)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600"><X className="h-5 w-5" /></button></header>
            <div className="max-h-[65dvh] overflow-y-auto">
              {panelRows().length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-400">No hay información para este período.</p> : panelRows().map((row, index) => <article key={`${row.title}-${index}`} className="border-b border-slate-100 px-4 py-4 last:border-b-0"><p className="break-words text-sm font-bold">{row.title}</p><p className="mt-1 break-words text-xs leading-5 text-slate-500">{row.detail}</p></article>)}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
