import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  BellRing,
  Building2,
  CalendarDays,
  ChevronLeft,
  HeartHandshake,
  Megaphone,
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
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    profilesResult,
    ministriesResult,
    membershipsResult,
    pushesResult,
    eventsResult,
    noticesResult,
    requestsResult,
    solidarityRequestsResult,
    solidarityContributionsResult,
  ] = await Promise.all([
    service.from('profiles').select('id, rol, estado_cuenta, created_at'),
    service.from('ministerios').select('id, activo'),
    service.from('ministerio_miembros').select('profile_id, ministerio_id, es_lider'),
    service.from('push_subscriptions').select('profile_id'),
    service.from('eventos').select('id, created_at').gte('created_at', since30),
    service.from('publicaciones').select('id, estado, created_at').gte('created_at', since30),
    service.from('ministerio_solicitudes_ingreso').select('id, estado, created_at').gte('created_at', since30),
    service.from('solicitudes_ayuda_solidaria').select('id, estado'),
    service.from('aportes_ayuda_solidaria').select('id, estado'),
  ])

  const profiles = (profilesResult.data || []) as any[]
  const ministries = (ministriesResult.data || []) as any[]
  const memberships = (membershipsResult.data || []) as any[]
  const activeProfiles = profiles.filter((item) => (item.estado_cuenta ?? 'activo') === 'activo')
  const pushProfiles = new Set((pushesResult.data || []).map((item: any) => item.profile_id))
  const leaders = new Set(memberships.filter((item) => item.es_lider).map((item) => item.profile_id))
  const notices = (noticesResult.data || []) as any[]
  const joinRequests = (requestsResult.data || []) as any[]
  const solidarityRequests = (solidarityRequestsResult.data || []) as any[]
  const solidarityContributions = (solidarityContributionsResult.data || []) as any[]

  const byRole = {
    servidor: activeProfiles.filter((item) => item.rol === 'servidor').length,
    lider: activeProfiles.filter((item) => item.rol === 'lider').length,
    pastor: activeProfiles.filter((item) => item.rol === 'pastor').length,
    administrador: activeProfiles.filter((item) => item.rol === 'administrador').length,
  }

  const pushPercent = activeProfiles.length > 0 ? Math.round((pushProfiles.size / activeProfiles.length) * 100) : 0
  const pendingJoin = joinRequests.filter((item) => item.estado === 'pendiente').length
  const approvedNotices = notices.filter((item) => item.estado === 'aprobado').length
  const pendingNotices = notices.filter((item) => item.estado === 'pendiente').length
  const openSolidarity = solidarityRequests.filter((item) => !['entregada', 'rechazada', 'cancelada'].includes(item.estado)).length
  const availableContributions = solidarityContributions.filter((item) => !['completado', 'cancelado'].includes(item.estado)).length

  const metrics = [
    { label: 'Usuarios activos', value: activeProfiles.length, detail: `${profiles.length} registrados`, icon: Users, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Ministerios activos', value: ministries.filter((item) => item.activo).length, detail: `${ministries.length} totales`, icon: Building2, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Liderazgos reales', value: leaders.size, detail: 'personas con liderazgo', icon: ShieldCheck, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Push activado', value: `${pushPercent}%`, detail: `${pushProfiles.size} usuarios`, icon: BellRing, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Eventos creados', value: (eventsResult.data || []).length, detail: 'últimos 30 días', icon: CalendarDays, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Avisos publicados', value: approvedNotices, detail: `${pendingNotices} pendientes`, icon: Megaphone, tone: 'bg-fuchsia-50 text-fuchsia-600' },
    { label: 'Solicitudes ingreso', value: pendingJoin, detail: 'pendientes en 30 días', icon: UserPlus, tone: 'bg-cyan-50 text-cyan-600' },
    { label: 'Ayuda Solidaria', value: openSolidarity, detail: `${availableContributions} aportes disponibles`, icon: HeartHandshake, tone: 'bg-rose-50 text-rose-600' },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-black/[0.04]">
        <ChevronLeft className="h-4 w-4" /> Administración
      </Link>

      <header className="mt-6 mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">Visión general</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Centro de Análisis</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">Estado de la comunidad y de las operaciones reales de VIDA.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4.5 w-4.5" /></span>
            <p className="mt-3 text-2xl font-extrabold leading-none text-[#171923]">{value}</p>
            <p className="mt-2 text-[11px] font-bold text-slate-700">{label}</p>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div><h2 className="text-sm font-extrabold text-[#171923]">Composición por rol</h2><p className="mt-0.5 text-[11px] text-slate-400">Solo cuentas activas</p></div>
          <Activity className="h-5 w-5 text-indigo-500" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {Object.entries(byRole).map(([role, count], index) => (
            <div key={role} className={`p-4 ${index % 2 === 0 ? 'border-r border-slate-100 sm:border-r' : 'sm:border-r'} ${index < 2 ? 'border-b border-slate-100 sm:border-b-0' : ''}`}>
              <p className="text-2xl font-extrabold text-[#171923]">{count}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#171923]">Lectura rápida</h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <p><strong className="text-[#171923]">{memberships.length}</strong> membresías ministeriales activas registradas en la estructura actual.</p>
          <p><strong className="text-[#171923]">{leaders.size}</strong> personas figuran como líderes reales de al menos un ministerio.</p>
          <p><strong className="text-[#171923]">{pushProfiles.size}</strong> usuarios tienen al menos un dispositivo registrado para notificaciones push.</p>
          <p>Los indicadores de actividad operacional muestran únicamente los <strong className="text-[#171923]">últimos 30 días</strong>; usuarios y ministerios representan el estado actual.</p>
        </div>
      </section>
    </main>
  )
}
