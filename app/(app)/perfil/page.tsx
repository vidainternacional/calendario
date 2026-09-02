import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import Link from 'next/link'
import { User, Mail, Shield, Bell, Settings2, Users, BookHeart, HeartHandshake, MessageCircleQuestion, MessagesSquare, Sprout } from 'lucide-react'
import PushToggle from '@/components/pwa/PushToggle'
import EditarPerfilForm from '@/components/perfil/EditarPerfilForm'
import PerfilAmpliadoForm from '@/components/perfil/PerfilAmpliadoForm'
import AvatarUploader from '@/components/perfil/AvatarUploader'
import PushTestButton from '@/components/pwa/PushTestButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Mi Perfil' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: membresias },
    { data: details },
    { count: ayudasCount },
    { count: conversacionesVidaCount },
    { count: semillasCount },
  ] = await Promise.all([
    (supabase as any).from('profiles').select('nombre_completo, avatar_url, rol, telefono, fecha_nacimiento, estado_cuenta, acceso_centro_pastoral, es_pastor_general').eq('id', user.id).single(),
    supabase.from('ministerio_miembros').select(`id,es_lider,ministerios (id,nombre,color_primario)`).eq('profile_id', user.id),
    (supabase as any).from('member_profile_details').select('*').eq('profile_id', user.id).maybeSingle(),
    (supabase as any).from('solicitudes_ayuda_solidaria').select('id', { count: 'exact', head: true }).eq('profile_id', user.id),
    (supabase as any).from('solicitudes_ayuda_solidaria').select('id', { count: 'exact', head: true }).eq('profile_id', user.id).eq('contacto_preferido', 'aplicacion'),
    (supabase as any).from('aportes_ayuda_solidaria').select('id', { count: 'exact', head: true }).eq('profile_id', user.id).in('estado', ['recibido', 'completado']),
  ])

  const roles = {
    servidor: { bg: 'bg-slate-500/10', text: 'text-gray-500', border: 'border-slate-500/20', label: 'Servidor' },
    lider: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', label: 'Líder' },
    pastor: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', label: 'Pastor' },
    administrador: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', label: 'Admin' },
  }

  const rolActual = (profile as any)?.rol as keyof typeof roles
  const rolGlobal = roles[rolActual] || roles.servidor
  const tieneCentroPastoral = tieneAccesoPastoral(profile as any)
  const tienePanelAdministrativo = rolActual === 'administrador'
  const puedeGestionarAtencion = rolActual === 'pastor'
    || rolActual === 'administrador'
    || (profile as any)?.es_pastor_general === true
  const nombre = (profile as any)?.nombre_completo || 'Usuario'
  const totalAyudas = ayudasCount || 0
  const totalConversacionesVida = conversacionesVidaCount || 0
  const totalSemillas = semillasCount || 0

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 max-w-xl mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
        <div className="min-w-0"><h1 className="text-2xl font-bold text-[#171923]">Mi Perfil</h1><p className="mt-1 text-sm text-gray-500">Tu identidad dentro de la comunidad VIDA</p></div>
        <div className="shrink-0"><LogoutButton /></div>
      </header>

      <div className="space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex min-w-0 items-start gap-4">
            <AvatarUploader userId={user.id} nombre={nombre} avatarUrl={(profile as any)?.avatar_url ?? null} />
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="break-words text-lg font-bold leading-tight text-[#171923] sm:text-xl">{nombre}</h2>
              <span className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${rolGlobal.bg} ${rolGlobal.text} ${rolGlobal.border}`}><Shield className="h-3.5 w-3.5 shrink-0" /><span className="truncate">Rol global: {rolGlobal.label}</span></span>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">Tu foto ayuda a que líderes y compañeros puedan reconocerte dentro de VIDA.</p>
            </div>
          </div>
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex min-w-0 items-start gap-3 text-[#171923]"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" /><span className="min-w-0 break-all text-sm">{user.email}</span></div>
            <div className="flex min-w-0 items-start gap-3 text-[#171923]"><User className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" /><span className="min-w-0 break-words text-sm">{(profile as any)?.telefono || 'Sin teléfono registrado'}</span></div>
          </div>
          <EditarPerfilForm nombre={nombre} telefono={(profile as any)?.telefono ?? null} fechaNacimiento={(profile as any)?.fecha_nacimiento ?? null} />
        </section>

        <PerfilAmpliadoForm details={(details as any) ?? null} />

        <section className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#171923]">Tus Ministerios</h3>
          {!membresias || membresias.length === 0 ? (
            <EmptyState icon={Users} title="Aún no perteneces a un ministerio" description="Explora los ministerios de la iglesia y solicita ingreso al espacio donde deseas servir. Tus asignaciones aparecerán aquí cuando seas agregado." action={{ label: 'Explorar ministerios', href: '/ministerios' }} compact className="min-h-0 bg-slate-50 shadow-none" />
          ) : (
            <div className="space-y-1">{membresias.map((m: any) => <div key={m.id} className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"><div className="flex min-w-0 items-center gap-3"><div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: m.ministerios.color_primario }} /><span className="min-w-0 break-words font-medium text-[#171923]">{m.ministerios.nombre}</span></div><span className={`shrink-0 rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-xs ${m.es_lider ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-slate-200 bg-slate-100 text-gray-500'}`}>{m.es_lider ? 'Líder' : 'Servidor'}</span></div>)}</div>
          )}
        </section>

        <Link href="/contactos" className="block rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 active:scale-[0.99] sm:p-6"><div className="flex min-w-0 items-center justify-between gap-4"><div className="min-w-0"><h3 className="text-lg font-semibold text-[#171923]">Mis Contactos 🤝</h3><p className="mt-1 text-sm leading-relaxed text-slate-500">Tu código QR y tus conexiones con otros servidores</p></div><span className="shrink-0 text-2xl text-slate-300" aria-hidden="true">›</span></div></Link>

        <section className="overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-sm">
          <Link href="/ayuda-solidaria?tab=seguimiento" className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 transition hover:bg-violet-50/40 active:bg-violet-50">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600"><MessagesSquare className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="text-sm font-bold text-[#171923]">Mis ayudas</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{totalAyudas} pedido{totalAyudas === 1 ? '' : 's'} · {totalConversacionesVida} conversación{totalConversacionesVida === 1 ? '' : 'es'} dentro de VIDA</p></div>
            </div>
            <span className="shrink-0 text-xl text-slate-300">›</span>
          </Link>
          <Link href="/ayuda-solidaria?tab=seguimiento" className="flex min-w-0 items-center justify-between gap-4 px-5 py-4 transition hover:bg-emerald-50/40 active:bg-emerald-50">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Sprout className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="text-sm font-bold text-[#171923]">Mi jardín de semillas</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{totalSemillas} siembra{totalSemillas === 1 ? '' : 's'} completada{totalSemillas === 1 ? '' : 's'} · registro personal sin rankings</p></div>
            </div>
            <span className="shrink-0 text-xl text-slate-300">›</span>
          </Link>
        </section>

        <section className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-2"><Bell className="h-5 w-5 shrink-0 text-indigo-400" /><h3 className="text-lg font-semibold text-[#171923]">Notificaciones</h3></div><p className="mb-5 text-sm leading-relaxed text-gray-500">Activa las alertas push para recibir avisos, solicitudes e intercambios en tiempo real.</p><PushToggle /></section>

        {(tieneCentroPastoral || puedeGestionarAtencion || tienePanelAdministrativo) && <section className="space-y-3">
          {tieneCentroPastoral && <Link href="/pastoral" className="flex min-w-0 items-center justify-between gap-4 rounded-[20px] border border-indigo-200 bg-white px-4 py-4 text-[#171923] shadow-sm transition-all hover:border-indigo-300 active:scale-[.98] sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50"><BookHeart className="h-5 w-5 text-indigo-600" /></div><div className="min-w-0"><p className="break-words text-sm font-bold">Centro Pastoral</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">Versículos, bosquejos, biblioteca y materiales</p></div></div><span className="shrink-0 text-indigo-300">›</span></Link>}
          {puedeGestionarAtencion && <Link href="/pastoral/preguntas" className="flex min-w-0 items-center justify-between gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-[#171923] shadow-sm transition-all hover:border-indigo-200 active:scale-[.98] sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50"><MessageCircleQuestion className="h-5 w-5 text-indigo-600" /></div><div className="min-w-0"><p className="break-words text-sm font-bold">Buzón de preguntas</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">Preguntas y motivos de oración pendientes</p></div></div><span className="shrink-0 text-slate-300">›</span></Link>}
          {puedeGestionarAtencion && <Link href="/pastoral/ayuda-solidaria" className="flex min-w-0 items-center justify-between gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-[#171923] shadow-sm transition-all hover:border-rose-200 active:scale-[.98] sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50"><HeartHandshake className="h-5 w-5 text-rose-600" /></div><div className="min-w-0"><p className="break-words text-sm font-bold">Ayuda Solidaria</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">Solicitudes y aportes que requieren seguimiento</p></div></div><span className="shrink-0 text-slate-300">›</span></Link>}
          {tienePanelAdministrativo && <PushTestButton />}
          {tienePanelAdministrativo && <Link href="/admin" className="flex min-w-0 items-center justify-between gap-4 rounded-[20px] bg-indigo-600 px-4 py-4 text-white shadow-[0_6px_24px_rgba(79,70,229,0.30)] transition-all hover:bg-indigo-500 active:scale-[.98] sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15"><Settings2 className="h-5 w-5 text-white" /></div><div className="min-w-0"><p className="break-words text-sm font-bold">Panel de Administración</p><p className="mt-0.5 text-[11px] leading-relaxed text-indigo-200">Ministerios, usuarios y membresías</p></div></div><span className="shrink-0 text-indigo-200">›</span></Link>}
        </section>}
      </div>
    </main>
  )
}
