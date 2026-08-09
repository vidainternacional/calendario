import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  BarChart3, BookOpenCheck, Building2, CheckCircle2, ChevronRight, HeartHandshake,
  MessageCircleQuestion, Megaphone, Settings2, UserPlus, Users,
} from 'lucide-react'
import BackButton from '@/components/navigation/BackButton'

export default async function AdminPage() {
  const supabase = await createClient()
  const [{ count: usuarios }, { count: ministerios }, { count: pendingPreguntas }, { count: pendingAvisos }, { count: pendingIngresos }] = await Promise.all([
    (supabase as any).from('profiles').select('*', { count: 'exact', head: true }),
    (supabase as any).from('ministerios').select('*', { count: 'exact', head: true }),
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
  const modulos = [
    { label: 'Usuarios', value: usuarios || 0, detail: 'Roles, membresías y acceso', href: '/admin/usuarios', icon: Users, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Ministerios', value: ministerios || 0, detail: 'Equipos, líderes y configuración', href: '/admin/ministerios', icon: Building2, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Solicitudes', value: pendingIngresos || 0, detail: 'Ingresos pendientes', href: '/admin/solicitudes-ministerios', icon: UserPlus, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Avisos', value: pendingAvisos || 0, detail: 'Publicaciones y revisión', href: '/admin/avisos', icon: Megaphone, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Buzón', value: pendingPreguntas || 0, detail: 'Preguntas y mensajes', href: '/admin/preguntas', icon: MessageCircleQuestion, tone: 'bg-rose-50 text-rose-600' },
    { label: 'Análisis', value: '›', detail: 'Comportamiento y operación', href: '/admin/analisis', icon: BarChart3, tone: 'bg-violet-50 text-violet-600' },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:px-6 sm:pt-12">
      <div className="mb-7"><BackButton /></div>
      <header className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">Centro de control</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Administración</h1><p className="mt-1.5 text-sm leading-6 text-slate-500">Entra directamente a cada área. El panel principal ya no mezcla las herramientas entre sí.</p></header>
      <section className="grid grid-cols-2 gap-3">
        {modulos.map(({ label, value, detail, href, icon: Icon, tone }) => <Link key={label} href={href} className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04] active:scale-[0.99]"><div className="flex items-start justify-between gap-2"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4.5 w-4.5" /></span><ChevronRight className="h-4 w-4 text-slate-300" /></div><p className="mt-3 text-2xl font-extrabold text-[#171923]">{value}</p><p className="mt-1 text-xs font-bold text-slate-700">{label}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-400">{detail}</p></Link>)}
      </section>
      <section className="mt-5 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-sm font-extrabold text-[#171923]">{totalPendientes ? `${totalPendientes} elementos pendientes` : 'Operación al día'}</p><p className="mt-0.5 text-[11px] text-slate-400">Contadores derivados del estado real de cada módulo.</p></div></div></section>
      <section className="mt-5 space-y-3">
        <Link href="/admin/ayuda-solidaria" className="flex items-center gap-3 rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-[0_6px_16px_rgba(225,29,72,0.2)]"><HeartHandshake className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#171923]">Ayuda Solidaria</p><p className="text-[11px] text-slate-400">Gestión pastoral de necesidades y aportes</p></div><ChevronRight className="h-4 w-4 text-slate-300" /></Link>
        {currentUserRol === 'administrador' && <Link href="/admin/accesos-pastorales" className="flex items-center gap-3 rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpenCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#171923]">Accesos pastorales</p><p className="text-[11px] text-slate-400">Permisos especiales para preparación de contenido</p></div><ChevronRight className="h-4 w-4 text-slate-300" /></Link>}
        <Link href="/admin/configuracion" className="flex items-center gap-3 rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Settings2 className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#171923]">Configuración avanzada</p><p className="text-[11px] text-slate-400">Ícono de la app y ajustes técnicos</p></div><ChevronRight className="h-4 w-4 text-slate-300" /></Link>
      </section>
    </main>
  )
}
