import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  BellRing,
  Building2,
  CalendarDays,
  ChevronLeft,
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

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await (supabase as any).from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const allowed = currentProfile?.rol === 'pastor' || currentProfile?.rol === 'administrador' || currentProfile?.es_pastor_general === true
  if (!allowed) redirect('/inicio')

  const service = createServiceClient()
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [profilesResult, ministriesResult, membershipsResult, pushesResult, eventsResult, noticesResult, requestsResult, questionsResult, usageResult, solidarityRequestsResult, solidarityContributionsResult] = await Promise.all([
    service.from('profiles').select('id,nombre_completo,rol,estado_cuenta,created_at').order('nombre_completo'),
    service.from('ministerios').select('id,nombre,activo'),
    service.from('ministerio_miembros').select('profile_id,ministerio_id,es_lider'),
    service.from('push_subscriptions').select('profile_id'),
    service.from('eventos').select('id,created_at').gte('created_at', since30),
    service.from('publicaciones').select('id,estado,created_at').gte('created_at', since30),
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
  const notices = (noticesResult.data || []) as any[]
  const joinRequests = (requestsResult.data || []) as any[]

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const usageByProfile = new Map<string, any[]>()
  usage.forEach((item) => usageByProfile.set(item.profile_id, [...(usageByProfile.get(item.profile_id) || []), item]))

  const behavioralUsers = activeProfiles.map((profile) => {
    const events = usageByProfile.get(profile.id) || []
    const pageViews = events.filter((item) => item.event_name === 'page_view')
    const actions = events.length - pageViews.length
    const routes = new Map<string, number>()
    pageViews.forEach((item) => { if (item.route) routes.set(item.route, (routes.get(item.route) || 0) + 1) })
    const favoriteRoute = [...routes.entries()].sort((a, b) => b[1] - a[1])[0]
    return {
      id: profile.id,
      name: profile.nombre_completo || 'Usuario',
      role: profile.rol,
      pageViews: pageViews.length,
      actions,
      lastSeen: events[0]?.occurred_at || null,
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
  const topRoutes = [...routesMap.entries()].map(([route, value]) => ({ route, views: value.views, people: value.people.size })).sort((a, b) => b.views - a.views).slice(0, 8)

  const activeUsers30 = behavioralUsers.filter((u) => u.lastSeen).length
  const totalPageViews = behavioralUsers.reduce((sum, u) => sum + u.pageViews, 0)
  const totalActions = behavioralUsers.reduce((sum, u) => sum + u.actions, 0)
  const pushPercent = activeProfiles.length ? Math.round((pushProfiles.size / activeProfiles.length) * 100) : 0
  const pendingJoin = joinRequests.filter((item) => item.estado === 'pendiente').length
  const openSolidarity = ((solidarityRequestsResult.data || []) as any[]).filter((item) => !['entregada','rechazada','cancelada'].includes(item.estado)).length
  const availableContributions = ((solidarityContributionsResult.data || []) as any[]).filter((item) => !['completado','cancelado'].includes(item.estado)).length

  const metrics = [
    { label: 'Usuarios activos', value: activeProfiles.length, detail: `${activeUsers30} con actividad registrada`, icon: Users, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Vistas de pantalla', value: totalPageViews, detail: 'últimos 30 días', icon: Eye, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Acciones', value: totalActions, detail: 'interacciones registradas', icon: Activity, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Push activado', value: `${pushPercent}%`, detail: `${pushProfiles.size} usuarios`, icon: BellRing, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Ministerios', value: ministries.filter((m) => m.activo).length, detail: `${leaders.size} líderes reales`, icon: Building2, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Eventos creados', value: (eventsResult.data || []).length, detail: 'últimos 30 días', icon: CalendarDays, tone: 'bg-fuchsia-50 text-fuchsia-600' },
    { label: 'Preguntas', value: questions.length, detail: 'Buzón en 30 días', icon: MessageCircleQuestion, tone: 'bg-rose-50 text-rose-600' },
    { label: 'Solicitudes', value: pendingJoin, detail: 'ingresos pendientes', icon: UserPlus, tone: 'bg-cyan-50 text-cyan-600' },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+2.25rem)] sm:px-6 sm:pt-10">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-black/[0.04]"><ChevronLeft className="h-4 w-4" />Administración</Link>

      <header className="mb-6 mt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">Comportamiento y operación</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Centro de Análisis</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Actividad real de los usuarios, rutas más utilizadas, preguntas, adopción de notificaciones y operación de la comunidad.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4.5 w-4.5" /></span>
            <p className="mt-3 text-2xl font-extrabold leading-none text-[#171923]">{value}</p>
            <p className="mt-2 text-[11px] font-bold text-slate-700">{label}</p>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-sm font-extrabold text-[#171923]">Comportamiento por usuario</h2><p className="mt-1 text-[11px] text-slate-400">Actividad registrada durante los últimos 30 días.</p></div>
        <div className="divide-y divide-slate-100">
          {behavioralUsers.map((u) => (
            <article key={u.id} className="p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#171923]">{u.name}</p><p className="mt-0.5 text-[11px] capitalize text-slate-400">{u.role}</p></div><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">{u.pageViews + u.actions} interacciones</span></div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 px-2 py-2"><p className="text-base font-extrabold text-[#171923]">{u.pageViews}</p><p className="text-[9px] uppercase text-slate-400">vistas</p></div><div className="rounded-xl bg-slate-50 px-2 py-2"><p className="text-base font-extrabold text-[#171923]">{u.actions}</p><p className="text-[9px] uppercase text-slate-400">acciones</p></div><div className="rounded-xl bg-slate-50 px-2 py-2"><p className="text-base font-extrabold text-[#171923]">{u.questions}</p><p className="text-[9px] uppercase text-slate-400">preguntas</p></div></div>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">Pantalla más visitada: <strong className="text-slate-700">{u.favoriteRoute || 'Sin actividad suficiente'}</strong>{u.favoriteRoute ? ` · ${u.favoriteRouteViews} visitas` : ''}</p>
              <p className="mt-1 text-[10px] text-slate-400">Última actividad: {u.lastSeen ? new Date(u.lastSeen).toLocaleString('es-SV') : 'sin registro en este período'}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4"><Route className="h-4 w-4 text-indigo-500" /><div><h2 className="text-sm font-extrabold text-[#171923]">Pantallas más utilizadas</h2><p className="mt-0.5 text-[11px] text-slate-400">Visitas y personas únicas.</p></div></div>
        <div className="divide-y divide-slate-100">
          {topRoutes.length ? topRoutes.map((r) => <div key={r.route} className="flex items-center justify-between gap-3 px-4 py-3"><p className="min-w-0 truncate text-xs font-semibold text-slate-700">{r.route}</p><p className="shrink-0 text-[10px] text-slate-400">{r.views} visitas · {r.people} personas</p></div>) : <p className="p-5 text-center text-xs text-slate-400">Todavía no hay navegación suficiente registrada.</p>}
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <article className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-500" /><h2 className="text-sm font-extrabold text-[#171923]">Estructura ministerial</h2></div><p className="mt-4 text-3xl font-extrabold text-[#171923]">{memberships.length}</p><p className="mt-1 text-xs text-slate-500">membresías · {leaders.size} personas con liderazgo real</p></article>
        <article className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-rose-500" /><h2 className="text-sm font-extrabold text-[#171923]">Ayuda Solidaria</h2></div><p className="mt-4 text-3xl font-extrabold text-[#171923]">{openSolidarity}</p><p className="mt-1 text-xs text-slate-500">solicitudes activas · {availableContributions} aportes disponibles</p></article>
      </section>

      <section className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-white/60 p-5">
        <h2 className="text-sm font-extrabold text-[#171923]">Métricas que todavía no se registran</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">VIDA todavía no guarda de forma global cada búsqueda escrita ni cada interacción social entre personas. No las mostramos como si existieran. El próximo paso de analítica será instrumentar esos eventos de manera explícita y respetando privacidad.</p>
      </section>
    </main>
  )
}
