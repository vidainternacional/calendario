import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  ArrowLeft,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Eye,
  MessageSquareWarning,
  Repeat2,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import PilotParticipantsManager from '@/components/pilot/PilotParticipantsManager'
import PilotIssueStatusControls from '@/components/pilot/PilotIssueStatusControls'
import type { PilotIssueStatus } from '@/lib/pilot/types'

export const dynamic = 'force-dynamic'

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

export default async function PilotAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await (supabase as any)
    .from('profiles')
    .select('rol, es_pastor_general')
    .eq('id', user.id)
    .single()

  const allowed = currentProfile?.rol === 'pastor'
    || currentProfile?.rol === 'administrador'
    || currentProfile?.es_pastor_general === true
  if (!allowed) redirect('/inicio')

  const service = createServiceClient()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    profilesResult,
    participantsResult,
    onboardingResult,
    usageResult,
    issuesResult,
    pushesResult,
    eventsResult,
    assignmentsResult,
    noticesResult,
    exchangesResult,
    pendingExchangesResult,
  ] = await Promise.all([
    service.from('profiles').select('id, nombre_completo, email, rol').eq('activo', true).eq('estado_cuenta', 'activo').order('nombre_completo'),
    service.from('pilot_participants').select('profile_id, active, invited_at, profiles(id, nombre_completo, email, rol)').order('invited_at', { ascending: false }),
    service.from('pilot_onboarding_progress').select('profile_id, completed, current_step, notifications_enabled, completed_at'),
    service.from('pilot_usage_events').select('profile_id, event_name, route, occurred_at, profiles(nombre_completo)').gte('occurred_at', since).order('occurred_at', { ascending: false }).limit(600),
    service.from('pilot_issue_reports').select('id, profile_id, role_snapshot, route, description, expected_result, status, created_at, profiles(nombre_completo)').order('created_at', { ascending: false }).limit(40),
    service.from('push_subscriptions').select('profile_id'),
    service.from('eventos').select('id', { count: 'exact', head: true }).gte('created_at', since),
    service.from('evento_asignaciones').select('id', { count: 'exact', head: true }).gte('created_at', since),
    service.from('publicaciones').select('id', { count: 'exact', head: true }).gte('created_at', since),
    service.from('intercambios').select('id', { count: 'exact', head: true }).gte('created_at', since),
    service.from('intercambios').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
  ])

  const profiles = (profilesResult.data || []) as any[]
  const participants = (participantsResult.data || []) as any[]
  const activeParticipants = participants.filter((participant) => participant.active)
  const activeIds = new Set(activeParticipants.map((participant) => participant.profile_id))
  const onboarding = (onboardingResult.data || []).filter((item: any) => activeIds.has(item.profile_id))
  const usage = (usageResult.data || []).filter((item: any) => activeIds.has(item.profile_id))
  const issues = (issuesResult.data || []).filter((item: any) => activeIds.has(item.profile_id))
  const pushProfiles = new Set((pushesResult.data || []).map((item: any) => item.profile_id).filter((id: string) => activeIds.has(id)))
  const activeLast7Days = new Set(usage.map((item: any) => item.profile_id))
  const completed = onboarding.filter((item: any) => item.completed).length
  const openIssues = issues.filter((item: any) => item.status !== 'resuelto').length

  const routeCounts = new Map<string, number>()
  usage.filter((item: any) => item.event_name === 'page_view' && item.route).forEach((item: any) => {
    routeCounts.set(item.route, (routeCounts.get(item.route) || 0) + 1)
  })
  const topRoutes = [...routeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxRoute = Math.max(1, ...topRoutes.map(([, count]) => count))

  const adoptionCards = [
    { label: 'Participantes', value: activeParticipants.length, detail: 'seleccionados', icon: Users, className: 'bg-violet-50 text-violet-600' },
    { label: 'Recorrido completo', value: completed, detail: `${percentage(completed, activeParticipants.length)}% del piloto`, icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600' },
    { label: 'Activos en 7 días', value: activeLast7Days.size, detail: `${percentage(activeLast7Days.size, activeParticipants.length)}% del piloto`, icon: Activity, className: 'bg-sky-50 text-sky-600' },
    { label: 'Notificaciones', value: pushProfiles.size, detail: `${percentage(pushProfiles.size, activeParticipants.length)}% con dispositivo`, icon: BellRing, className: 'bg-amber-50 text-amber-600' },
    { label: 'Problemas abiertos', value: openIssues, detail: 'requieren revisión', icon: MessageSquareWarning, className: openIssues ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500' },
  ]

  const operationCards = [
    { label: 'Eventos creados', value: eventsResult.count || 0, icon: CalendarCheck2 },
    { label: 'Asignaciones', value: assignmentsResult.count || 0, icon: ClipboardList },
    { label: 'Avisos publicados', value: noticesResult.count || 0, icon: Eye },
    { label: 'Intercambios', value: exchangesResult.count || 0, icon: Repeat2 },
  ]

  return (
    <main className="min-h-screen bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-start gap-3">
          <Link href="/admin" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-black/[0.05]" aria-label="Volver a Administración">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-violet-500">Piloto operativo</p>
            <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-[-0.04em] text-[#151923]">Centro de Análisis</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Adopción, actividad operativa y problemas reportados durante los últimos siete días.</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {adoptionCards.map(({ label, value, detail, icon: Icon, className }) => (
            <article key={label} className="min-w-0 rounded-[22px] bg-white p-4 ring-1 ring-black/[0.045]">
              <span className={`grid h-9 w-9 place-items-center rounded-full ${className}`}><Icon className="h-[18px] w-[18px]" /></span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-[#171923]">{value}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-7">
          <div className="mb-3 px-1">
            <h2 className="text-sm font-extrabold text-[#171923]">Actividad operativa</h2>
            <p className="mt-1 text-xs text-slate-400">Datos creados durante los últimos siete días.</p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
            {operationCards.map(({ label, value, icon: Icon }, index) => (
              <article key={label} className={`min-h-24 p-4 ${index % 2 === 0 ? 'border-r border-slate-100' : ''} ${index < 2 ? 'border-b border-slate-100' : ''}`}>
                <Icon className="h-5 w-5 text-violet-500" />
                <p className="mt-3 text-2xl font-extrabold text-[#171923]">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{label}</p>
              </article>
            ))}
          </div>
          {(pendingExchangesResult.count || 0) > 0 && (
            <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              {pendingExchangesResult.count} intercambio{pendingExchangesResult.count === 1 ? '' : 's'} pendiente{pendingExchangesResult.count === 1 ? '' : 's'} de resolver.
            </p>
          )}
        </section>

        <section className="mt-7">
          <h2 className="mb-3 px-1 text-sm font-extrabold text-[#171923]">Pantallas más visitadas</h2>
          <div className="rounded-[24px] bg-white p-4 ring-1 ring-black/[0.045]">
            {topRoutes.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">La actividad aparecerá cuando los participantes comiencen a usar VIDA.</p>
            ) : (
              <div className="space-y-4">
                {topRoutes.map(([route, count]) => (
                  <div key={route}>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-semibold text-slate-600">{route}</span>
                      <span className="shrink-0 font-bold text-slate-400">{count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(7, Math.round((count / maxRoute) * 100))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-7">
          <PilotParticipantsManager profiles={profiles} participants={participants} />
        </div>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-extrabold text-[#171923]">Problemas reportados</h2>
              <p className="mt-1 text-xs text-slate-400">No incluye contraseñas, notas bíblicas ni contenido pastoral.</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{issues.length}</span>
          </div>

          <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
            {issues.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">Todavía no se han enviado reportes.</p>
            ) : (
              issues.map((issue: any, index: number) => (
                <article key={issue.id} className={`p-4 sm:p-5 ${index < issues.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#171923]">{issue.profiles?.nombre_completo || 'Participante'}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{issue.role_snapshot} · {new Date(issue.created_at).toLocaleString('es-SV')}</p>
                    </div>
                    <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{issue.route || 'Ruta no disponible'}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{issue.description}</p>
                  {issue.expected_result && (
                    <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Esperaba</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">{issue.expected_result}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <PilotIssueStatusControls reportId={issue.id} status={issue.status as PilotIssueStatus} />
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
