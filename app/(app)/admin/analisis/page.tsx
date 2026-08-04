import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquareWarning } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import PilotAnalyticsDashboard from '@/components/pilot/PilotAnalyticsDashboard'
import PilotParticipantsManager from '@/components/pilot/PilotParticipantsManager'
import PilotIssueStatusControls from '@/components/pilot/PilotIssueStatusControls'
import type { PilotIssueStatus } from '@/lib/pilot/types'

export const dynamic = 'force-dynamic'

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
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

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
    solidarityRequestsResult,
    solidarityContributionsResult,
  ] = await Promise.all([
    service.from('profiles').select('id, nombre_completo, email, rol').eq('activo', true).eq('estado_cuenta', 'activo').order('nombre_completo'),
    service.from('pilot_participants').select('profile_id, active, invited_at, profiles(id, nombre_completo, email, rol)').order('invited_at', { ascending: false }),
    service.from('pilot_onboarding_progress').select('profile_id, completed, current_step, notifications_enabled, completed_at, last_seen_at'),
    service.from('pilot_usage_events').select('profile_id, event_name, route, occurred_at, profiles(nombre_completo)').gte('occurred_at', since90).order('occurred_at', { ascending: false }).limit(2500),
    service.from('pilot_issue_reports').select('id, profile_id, role_snapshot, route, description, expected_result, status, created_at, profiles(nombre_completo)').order('created_at', { ascending: false }).limit(120),
    service.from('push_subscriptions').select('profile_id'),
    service.from('eventos').select('id, titulo, created_at, ministerios(nombre)').gte('created_at', since90).order('created_at', { ascending: false }).limit(500),
    service.from('evento_asignaciones').select('id, estado, created_at, profiles(nombre_completo), eventos(titulo)').gte('created_at', since90).order('created_at', { ascending: false }).limit(1000),
    service.from('publicaciones').select('id, titulo, estado, created_at, ministerios(nombre)').gte('created_at', since90).order('created_at', { ascending: false }).limit(500),
    service.from('intercambios').select('id, estado, created_at').gte('created_at', since90).order('created_at', { ascending: false }).limit(500),
    service.from('solicitudes_ayuda_solidaria').select('id, estado'),
    service.from('aportes_ayuda_solidaria').select('id, estado'),
  ])

  const profiles = (profilesResult.data || []) as any[]
  const participants = (participantsResult.data || []) as any[]
  const activeParticipants = participants.filter((participant) => participant.active)
  const activeIds = new Set(activeParticipants.map((participant) => participant.profile_id))
  const onboarding = (onboardingResult.data || []) as any[]
  const usage = ((usageResult.data || []) as any[]).filter((item) => activeIds.has(item.profile_id))
  const issues = ((issuesResult.data || []) as any[]).filter((item) => activeIds.has(item.profile_id))
  const pushProfiles = new Set((pushesResult.data || []).map((item: any) => item.profile_id))

  const onboardingByProfile = new Map(onboarding.map((item) => [item.profile_id, item]))
  const usageByProfile = new Map<string, any[]>()
  usage.forEach((item) => usageByProfile.set(item.profile_id, [...(usageByProfile.get(item.profile_id) || []), item]))

  const participantSnapshots = activeParticipants.map((participant) => {
    const profile = participant.profiles || {}
    const progress = onboardingByProfile.get(participant.profile_id)
    const participantUsage = usageByProfile.get(participant.profile_id) || []
    const lastUsage = participantUsage[0]?.occurred_at || progress?.last_seen_at || null

    return {
      id: participant.profile_id,
      name: profile.nombre_completo || 'Participante',
      email: profile.email || null,
      role: profile.rol || 'servidor',
      completed: Boolean(progress?.completed),
      hasPush: pushProfiles.has(participant.profile_id),
      lastSeenAt: lastUsage,
      pageViews: participantUsage.filter((item) => item.event_name === 'page_view').length,
      actions: participantUsage.filter((item) => item.event_name !== 'page_view').length,
    }
  })

  const usageSnapshots = usage.map((item) => ({
    profileId: item.profile_id,
    name: item.profiles?.nombre_completo || 'Participante',
    eventName: item.event_name,
    route: item.route || null,
    occurredAt: item.occurred_at,
  }))

  const operations = [
    ...((eventsResult.data || []) as any[]).map((item) => ({
      id: item.id,
      kind: 'evento' as const,
      title: item.titulo,
      detail: item.ministerios?.nombre || 'Evento general',
      status: null,
      occurredAt: item.created_at,
    })),
    ...((assignmentsResult.data || []) as any[]).map((item) => ({
      id: item.id,
      kind: 'asignacion' as const,
      title: item.eventos?.titulo || 'Asignación',
      detail: item.profiles?.nombre_completo || 'Servidor',
      status: item.estado || null,
      occurredAt: item.created_at,
    })),
    ...((noticesResult.data || []) as any[]).map((item) => ({
      id: item.id,
      kind: 'aviso' as const,
      title: item.titulo,
      detail: item.ministerios?.nombre || 'Anuncio general',
      status: item.estado || null,
      occurredAt: item.created_at,
    })),
    ...((exchangesResult.data || []) as any[]).map((item) => ({
      id: item.id,
      kind: 'intercambio' as const,
      title: 'Solicitud de intercambio',
      detail: null,
      status: item.estado || null,
      occurredAt: item.created_at,
    })),
  ]

  const issueSnapshots = issues.map((item) => ({
    id: item.id,
    name: item.profiles?.nombre_completo || 'Participante',
    role: item.role_snapshot,
    route: item.route || null,
    description: item.description,
    status: item.status,
    occurredAt: item.created_at,
  }))

  const solidarityRequests = (solidarityRequestsResult.data || []) as any[]
  const solidarityContributions = (solidarityContributionsResult.data || []) as any[]
  const solidarity = {
    totalRequests: solidarityRequests.length,
    openRequests: solidarityRequests.filter((item) => !['entregada', 'rechazada', 'cancelada'].includes(item.estado)).length,
    totalContributions: solidarityContributions.length,
    availableContributions: solidarityContributions.filter((item) => !['completado', 'cancelado'].includes(item.estado)).length,
  }

  return (
    <main className="min-h-screen bg-[#eef0f6] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <PilotAnalyticsDashboard
        participants={participantSnapshots}
        usage={usageSnapshots}
        operations={operations}
        issues={issueSnapshots}
        solidarity={solidarity}
      />

      <div className="mx-auto max-w-4xl space-y-7 px-4 py-7 sm:px-6">
        <div>
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-black/[0.05]">
            <ArrowLeft className="h-4 w-4" /> Volver a Administración
          </Link>
        </div>

        <PilotParticipantsManager profiles={profiles} participants={participants} />

        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-base font-extrabold text-[#171923]">Gestión de problemas reportados</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Los paneles superiores resumen la información; aquí puedes cambiar el estado de cada reporte.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-black/[0.05]"><MessageSquareWarning className="h-3.5 w-3.5" /> {issues.length}</span>
          </div>

          <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.05]">
            {issues.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-400">Todavía no se han enviado reportes.</p>
            ) : issues.map((issue: any, index: number) => (
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
                <div className="mt-4"><PilotIssueStatusControls reportId={issue.id} status={issue.status as PilotIssueStatus} /></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
