import { redirect } from 'next/navigation'
import {
  Activity,
  BellRing,
  Building2,
  CalendarDays,
  Eye,
  HeartHandshake,
  MessageCircleQuestion,
  Route,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import BackButton from '@/components/navigation/BackButton'

export const dynamic = 'force-dynamic'

function formatDay(date: Date) {
  return date.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' })
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await (supabase as any).from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const allowed = currentProfile?.rol === 'pastor' || currentProfile?.rol === 'administrador' || currentProfile?.es_pastor_general === true
  if (!allowed) redirect('/inicio')

  const service = createServiceClient()
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [profilesResult, ministriesResult, membershipsResult, pushesResult, eventsResult, requestsResult, questionsResult, usageResult, solidarityRequestsResult, solidarityContributionsResult] = await Promise.all([
    service.from('profiles').select('id,nombre_completo,rol,estado_cuenta,created_at').order('nombre_completo'),
    service.from('ministerios').select('id,nombre,activo'),
    service.from('ministerio_miembros').select('profile_id,ministerio_id,es_lider'),
    service.from('push_subscriptions').select('profile_id'),
    service.from('eventos').select('id,created_at').gte('created_at', since30),
    service.from('ministerio_solicitudes_ingreso').select('id,profile_id,estado,created_at').gte('created_at', since30),
    service.from('preguntas_congregacion').select('id,profile_id,texto,estado,created_at').gte('created_at', since30).order('created_at', { ascending: false }).limit(200),
    service.from('pilot_usage_events').select('profile_id,event_name,route,occurred_at').gte('occurred_at', since30).order('occurred_at', { ascending: false }).limit(3000),
    service.from('solicitudes_ayuda_solidaria').select('id,estado'),
    service.from('aportes_ayuda_solidaria').select('id,estado'),
  ])

  const profiles = (profilesResult.data || []) as any[]
  const ministries = (ministriesResult.data || []) as any[]
  const memberships = (membershipsResult.data || []) as any[]
  const activeProfiles = profiles.filter((item) => (item.estado_cuenta ?? 'activo') === 'activo')
  const pushProfiles = new Set((pushesResult.data || []).map((item: any) => item.profile_id))
  const leaders = new Set(memberships.filter((item) => item.es_lider).map((item) => item.profile_id))
  const usage = (usageResult.data || []) as any[]
  const questions = (questionsResult.data || []) as any[]
  const joinRequests = (requestsResult.data || []) as any[]

  const usageByProfile = new Map<string, any[]>()
  usage.forEach((item) => usageByProfile.set(item.profile_id, [...(usageByProfile.get(item.profile_id) || []), item]))

  const behavioralUsers = activeProfiles.map((profile) => {
    const userEvents = usageByProfile.get(profile.id) || []
    const pageViews = userEvents.filter((item) => item.event_name === 'page_view')
    const actions = userEvents.length - pageViews.length
    const routes = new Map<string, number>()
    pageViews.forEach((item) => { if (item.route) routes.set(item.route, (routes.get(item.route) || 0) + 1) })
    const favoriteRoute = [...routes.entries()].sort((a, b) => b[1] - a[1])[0]
    return {
      id: profile.id,
      name: profile.nombre_completo || 'Usuario',
      role: profile.rol,
      pageViews: pageViews.length,
      actions,
      lastSeen: userEvents[0]?.occurred_at || null,
      favoriteRoute: favoriteRoute?.[0] || null,
      favoriteRouteViews: favoriteRoute?.[1] || 0,
      questions: questions.filter((q) => q.profile_id === profile.id).length,
    }
  }).sort((a, b) => (b.pageViews + b.actions) - (a.pageViews + a.actions))

  const routesMap = new Map<string, { views: number; people: Set<string> }>()
  usage.filter((item) => item.event_name === 'page_view' && item.route).forEach((item) => {
    const current = routesMap.get(item.route) || { views: 0, people: new Set<string>() }
    current.views += 1
    current.people.add(item.profile_id)
    routesMap.set(item.route, current)
  })
  const topRoutes = [...routesMap.entries()].map(([route, value]) => ({ route, views: value.views, people: value.people.size })).sort((a, b) => b.views - a.views).slice(0, 6)

  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (29 - index))
    const key = date.toISOString().slice(0, 10)
    return { date, key, count: 0 }
  })
  const dayMap = new Map(days.map((day) => [day.key, day]))
  usage.forEach((item) => {
    const key = new Date(item.occurred_at).toISOString().slice(0, 10)
    const day = dayMap.get(key)
    if (day) day.count += 1
  })
  const maxDaily = Math.max(1, ...days.map((day) => day.count))
  const chartPoints = days.map((day, index) => {
    const x = (index / Math.max(1, days.length - 1)) * 100
    const y = 42 - (day.count / maxDaily) * 34
    return `${x},${y}`
  }).join(' ')

  const activeUsers30 = behavioralUsers.filter((u) => u.lastSeen).length
  const totalPageViews = behavioralUsers.reduce((sum, u) => sum + u.pageViews, 0)
  const totalActions = behavioralUsers.reduce((sum, u) => sum + u.actions, 0)
  const totalInteractions = totalPageViews + totalActions
  const pushPercent = activeProfiles.length ? Math.round((pushProfiles.size / activeProfiles.length) * 100) : 0
  const pendingJoin = joinRequests.filter((item) => item.estado === 'pendiente').length
  const openSolidarity = ((solidarityRequestsResult.data || []) as any[]).filter((item) => !['entregada','rechazada','cancelada'].includes(item.estado)).length
  const availableContributions = ((solidarityContributionsResult.data || []) as any[]).filter((item) => !['completado','cancelado'].includes(item.estado)).length
  const topRouteMax = Math.max(1, ...topRoutes.map((route) => route.views))

  const roleCounts = activeProfiles.reduce((acc: Record<string, number>, profile) => {
    const role = profile.rol || 'servidor'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-[#f4f5f9] px-6 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+6.5rem)] sm:px-8 sm:pt-14">
      <div className="mb-8"><BackButton /></div>

      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-500">Comportamiento y operación</p>
        <h1 className="mt-2 text-[34px] font-extrabold leading-none tracking-[-0.045em] text-[#171923]">Centro de Análisis</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Una vista visual del uso real de VIDA durante los últimos 30 días.</p>
      </header>

      <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#17132e,#392681_55%,#6b4cff)] p-5 text-white shadow-[0_16px_40px_rgba(67,43,153,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">Actividad total</p><p className="mt-2 text-4xl font-extrabold tracking-[-0.05em]">{totalInteractions}</p><p className="mt-1 text-xs text-white/60">interacciones registradas</p></div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-right ring-1 ring-white/10"><p className="text-2xl font-extrabold">{activeUsers30}</p><p className="text-[10px] text-white/60">usuarios activos</p></div>
        </div>
        <div className="mt-5 h-32 rounded-[20px] bg-white/[0.07] p-3 ring-1 ring-white/10">
          <svg viewBox="0 0 100 46" className="h-full w-full overflow-visible" preserveAspectRatio="none" aria-label="Actividad de los últimos 30 días">
            <defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.32"/><stop offset="100%" stopColor="white" stopOpacity="0"/></linearGradient></defs>
            <polygon points={`0,46 ${chartPoints} 100,46`} fill="url(#activityFill)" />
            <polyline points={chartPoints} fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="mt-2 flex justify-between text-[9px] font-medium text-white/40"><span>{formatDay(days[0].date)}</span><span>{formatDay(days[14].date)}</span><span>Hoy</span></div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-3">
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><Eye className="h-4 w-4 text-sky-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{totalPageViews}</p><p className="text-[10px] font-bold text-slate-500">Vistas</p></article>
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><Activity className="h-4 w-4 text-violet-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{totalActions}</p><p className="text-[10px] font-bold text-slate-500">Acciones</p></article>
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><CalendarDays className="h-4 w-4 text-fuchsia-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{(eventsResult.data || []).length}</p><p className="text-[10px] font-bold text-slate-500">Eventos</p></article>
      </section>

      <section className="mt-5 rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-extrabold text-[#171923]">Pantallas más utilizadas</p><p className="mt-1 text-[10px] text-slate-400">Dónde pasa más tiempo la comunidad</p></div><Route className="h-5 w-5 text-indigo-500"/></div>
        <div className="mt-5 space-y-4">
          {topRoutes.length ? topRoutes.map((route) => (
            <div key={route.route}>
              <div className="mb-1.5 flex items-center justify-between gap-3"><p className="min-w-0 truncate text-[11px] font-bold text-slate-600">{route.route}</p><p className="shrink-0 text-[10px] text-slate-400">{route.views}</p></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[linear-gradient(90deg,#7654ff,#b15cff)]" style={{ width: `${Math.max(6, (route.views / topRouteMax) * 100)}%` }} /></div>
            </div>
          )) : <p className="py-5 text-center text-xs text-slate-400">Todavía no hay navegación suficiente registrada.</p>}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <article className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-2"><BellRing className="h-4 w-4 text-amber-500"/><p className="text-xs font-extrabold text-[#171923]">Push activado</p></div>
          <div className="mt-4 flex items-center gap-4"><div className="relative h-20 w-20 shrink-0 rounded-full" style={{ background: `conic-gradient(#f59e0b ${pushPercent * 3.6}deg,#f1f5f9 0deg)` }}><div className="absolute inset-[9px] grid place-items-center rounded-full bg-white"><span className="text-lg font-extrabold text-[#171923]">{pushPercent}%</span></div></div><div><p className="text-2xl font-extrabold text-[#171923]">{pushProfiles.size}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">de {activeProfiles.length} usuarios activos</p></div></div>
        </article>
        <article className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500"/><p className="text-xs font-extrabold text-[#171923]">Distribución</p></div>
          <div className="mt-4 space-y-2.5">{Object.entries(roleCounts).map(([role, count]) => <div key={role} className="flex items-center justify-between"><span className="text-[10px] capitalize text-slate-500">{role}</span><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">{count}</span></div>)}</div>
        </article>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><Building2 className="h-4 w-4 text-emerald-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{ministries.filter((m) => m.activo).length}</p><p className="text-[10px] font-bold text-slate-500">Ministerios</p><p className="mt-1 text-[9px] text-slate-400">{leaders.size} líderes</p></article>
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><MessageCircleQuestion className="h-4 w-4 text-rose-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{questions.length}</p><p className="text-[10px] font-bold text-slate-500">Preguntas</p></article>
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><UserPlus className="h-4 w-4 text-cyan-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{pendingJoin}</p><p className="text-[10px] font-bold text-slate-500">Solicitudes</p></article>
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><HeartHandshake className="h-4 w-4 text-pink-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{openSolidarity}</p><p className="text-[10px] font-bold text-slate-500">Ayuda activa</p><p className="mt-1 text-[9px] text-slate-400">{availableContributions} aportes</p></article>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-extrabold text-[#171923]">Comportamiento por usuario</h2><p className="mt-1 text-[10px] text-slate-400">Ordenado por nivel de actividad.</p></div>
        <div className="divide-y divide-slate-100">
          {behavioralUsers.map((u) => (
            <article key={u.id} className="p-4">
              <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#171923]">{u.name}</p><p className="mt-0.5 text-[10px] capitalize text-slate-400">{u.role}</p></div><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">{u.pageViews + u.actions}</span></div>
              <div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-base font-extrabold text-[#171923]">{u.pageViews}</p><p className="text-[9px] text-slate-400">vistas</p></div><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-base font-extrabold text-[#171923]">{u.actions}</p><p className="text-[9px] text-slate-400">acciones</p></div><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-base font-extrabold text-[#171923]">{u.questions}</p><p className="text-[9px] text-slate-400">preguntas</p></div></div>
              <p className="mt-3 truncate text-[10px] text-slate-500">Más usada: <strong>{u.favoriteRoute || 'Sin actividad suficiente'}</strong></p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-white/60 p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-400"/><h2 className="text-sm font-extrabold text-[#171923]">Próxima capa de analítica</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">Las búsquedas escritas y las interacciones sociales entre personas todavía no se registran globalmente. Se añadirán únicamente cuando exista telemetría explícita y respetuosa con la privacidad.</p></section>
    </main>
  )
}