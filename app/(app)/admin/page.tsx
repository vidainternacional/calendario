import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'
import Link from 'next/link'
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  MessageCircleQuestion,
  Megaphone,
  UserPlus,
  Users,
} from 'lucide-react'
import BackButton from '@/components/navigation/BackButton'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const initialTab = params.tab === 'usuarios' ? 'usuarios' : 'ministerios'
  const supabase = await createClient()

  const { data: ministerios, error: e1 } = await supabase
    .from('ministerios')
    .select('*')
    .order('orden', { ascending: true })
  if (e1) console.error('[Admin] Error ministerios:', e1)

  const { data: usuarios, error: e2 } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre_completo,
      email,
      rol,
      activo,
      estado_cuenta,
      created_at,
      es_pastor_general,
      ministerio_miembros (
        ministerio_id,
        es_lider,
        ministerios (
          nombre,
          color_primario
        )
      )
    `)
    .order('nombre_completo', { ascending: true })
  if (e2) console.error('[Admin] Error usuarios:', e2)

  const { data: iconSetting } = await (supabase as any)
    .from('app_settings')
    .select('valor')
    .eq('clave', 'active_icon_variant')
    .maybeSingle()
  const activeIconVariant: string = typeof iconSetting?.valor === 'string'
    ? iconSetting.valor.replace(/"/g, '')
    : 'dorado'

  const { data: promptSetting } = await (supabase as any)
    .from('app_settings')
    .select('valor')
    .eq('clave', 'estudio_system_prompt')
    .maybeSingle()
  const estudioPrompt: string = typeof promptSetting?.valor === 'string'
    ? promptSetting.valor.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
    : ''

  const [{ count: pendingPreguntas }, { count: pendingAvisos }, { count: pendingIngresos }] = await Promise.all([
    (supabase as any).from('preguntas_congregacion').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    (supabase as any).from('publicaciones').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    (supabase as any).from('ministerio_solicitudes_ingreso').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
  ])

  const { data: { user } } = await supabase.auth.getUser()
  let currentUserRol = 'servidor'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
    if ((profile as any)?.rol) currentUserRol = (profile as any).rol
  }

  const totalPendientes = (pendingIngresos || 0) + (pendingAvisos || 0) + (pendingPreguntas || 0)

  const resumen = [
    {
      label: 'Usuarios', value: usuarios?.length || 0, detail: 'Gestionar personas', href: '/admin?tab=usuarios#gestion',
      icon: Users, tone: 'bg-indigo-50 text-indigo-600', valueTone: 'text-[#171923]',
    },
    {
      label: 'Ministerios', value: ministerios?.length || 0, detail: 'Gestionar equipos', href: '/admin?tab=ministerios#gestion',
      icon: Building2, tone: 'bg-emerald-50 text-emerald-600', valueTone: 'text-[#171923]',
    },
    {
      label: 'Solicitudes', value: pendingIngresos || 0, detail: 'Ingresos pendientes', href: '/admin/solicitudes-ministerios',
      icon: UserPlus, tone: 'bg-sky-50 text-sky-600', valueTone: pendingIngresos ? 'text-sky-600' : 'text-[#171923]',
    },
    {
      label: 'Avisos', value: pendingAvisos || 0, detail: 'Pendientes de revisión', href: '/avisos',
      icon: Megaphone, tone: 'bg-amber-50 text-amber-600', valueTone: pendingAvisos ? 'text-amber-600' : 'text-[#171923]',
    },
    {
      label: 'Buzón', value: pendingPreguntas || 0, detail: 'Mensajes pendientes', href: '/admin/preguntas',
      icon: MessageCircleQuestion, tone: 'bg-rose-50 text-rose-600', valueTone: pendingPreguntas ? 'text-rose-600' : 'text-[#171923]',
    },
    {
      label: 'Análisis', value: '›', detail: 'Actividad y adopción', href: '/admin/analisis',
      icon: BarChart3, tone: 'bg-violet-50 text-violet-600', valueTone: 'text-violet-600',
    },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <div className="mb-5"><BackButton /></div>

      <header className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">Centro de control</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Administración</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">Personas, ministerios, pendientes y análisis desde un solo lugar.</p>
      </header>

      {totalPendientes === 0 && (usuarios?.length || 0) > 0 && (
        <section className="mb-4 flex items-center gap-3 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3" role="status">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600"><CheckCircle2 className="h-4.5 w-4.5" /></div>
          <div><p className="text-sm font-bold text-emerald-900">Todo está al día</p><p className="text-[11px] text-emerald-700">No hay solicitudes, avisos ni mensajes pendientes.</p></div>
        </section>
      )}

      <section aria-label="Resumen administrativo" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {resumen.map(({ label, value, detail, href, icon: Icon, tone, valueTone }) => (
          <Link key={label} href={href} className="group min-w-0 rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm transition-all active:scale-[0.98]">
            <div className="flex items-start justify-between gap-2">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4.5 w-4.5" /></span>
              <ChevronRight className="h-4 w-4 text-slate-250 group-hover:text-indigo-400" />
            </div>
            <p className={`mt-3 text-2xl font-extrabold leading-none ${valueTone}`}>{value}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</p>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">{detail}</p>
          </Link>
        ))}
      </section>

      <section className="mb-6" aria-labelledby="herramientas-admin">
        <div className="mb-3 flex items-end justify-between px-1">
          <h2 id="herramientas-admin" className="text-sm font-bold text-[#171923]">Herramientas administrativas</h2>
          <span className="text-[10px] text-slate-400">Accesos especializados</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {currentUserRol === 'administrador' && (
            <Link href="/admin/accesos-pastorales" className="flex items-center gap-3 rounded-[18px] border border-slate-100 bg-white p-4 shadow-sm active:scale-[0.99]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpenCheck className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#171923]">Accesos pastorales</p><p className="mt-0.5 text-[11px] text-slate-500">Permisos para preparar materiales.</p></div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
          )}
          <Link href="/admin/ayuda-solidaria" className="flex items-center gap-3 rounded-[18px] border border-slate-100 bg-white p-4 shadow-sm active:scale-[0.99]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><HeartHandshake className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#171923]">Ayuda Solidaria</p><p className="mt-0.5 text-[11px] text-slate-500">Solicitudes y aportes comunitarios.</p></div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
        </div>
      </section>

      <AdminClient
        ministerios={ministerios || []}
        usuarios={usuarios || []}
        activeIconVariant={activeIconVariant}
        initialEstudioPrompt={estudioPrompt}
        currentUserRol={currentUserRol}
        initialTab={initialTab}
      />
    </main>
  )
}
