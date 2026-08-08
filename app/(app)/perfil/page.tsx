import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import Link from 'next/link'
import { User, Mail, Shield, Bell, Settings2, Users, BookHeart } from 'lucide-react'
import PushToggle from '@/components/pwa/PushToggle'
import EditarPerfilForm from '@/components/perfil/EditarPerfilForm'
import AvatarUploader from '@/components/perfil/AvatarUploader'
import PushTestButton from '@/components/pwa/PushTestButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = {
  title: 'Mi Perfil',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('nombre_completo, avatar_url, rol, telefono, fecha_nacimiento, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select(`
      id,
      es_lider,
      ministerios (
        id,
        nombre,
        color_primario
      )
    `)
    .eq('profile_id', user.id)

  const roles = {
    servidor: { bg: 'bg-slate-500/10', text: 'text-gray-500', border: 'border-slate-500/20', label: 'Servidor' },
    lider: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', label: 'Líder' },
    pastor: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', label: 'Pastor' },
    administrador: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', label: 'Admin' }
  }

  const rolActual = (profile as any)?.rol as keyof typeof roles
  const rolGlobal = roles[rolActual] || roles.servidor
  const tieneCentroPastoral = tieneAccesoPastoral(profile as any)
  const tienePanelAdministrativo = ['pastor', 'administrador'].includes(rolActual)
  const nombre = (profile as any)?.nombre_completo || 'Usuario'

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 max-w-xl mx-auto">
      <header className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#171923]">Mi Perfil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tu identidad dentro de la comunidad VIDA
          </p>
        </div>
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </header>

      <div className="space-y-5 sm:space-y-6">
        <section className="bg-white border border-slate-100 rounded-[22px] p-5 sm:p-6 shadow-sm overflow-hidden">
          <div className="flex items-start gap-4 mb-5 min-w-0">
            <AvatarUploader
              userId={user.id}
              nombre={nombre}
              avatarUrl={(profile as any)?.avatar_url ?? null}
            />
            <div className="min-w-0 flex-1 pt-1">
              <h2 className="text-lg sm:text-xl font-bold text-[#171923] leading-tight break-words">
                {nombre}
              </h2>
              <span className={`inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mt-2 ${rolGlobal.bg} ${rolGlobal.text} ${rolGlobal.border}`}>
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Rol global: {rolGlobal.label}</span>
              </span>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                Tu foto ayuda a que líderes y compañeros puedan reconocerte dentro de VIDA.
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-start gap-3 text-[#171923] min-w-0">
              <Mail className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <span className="text-sm break-all min-w-0">{user.email}</span>
            </div>
            <div className="flex items-start gap-3 text-[#171923] min-w-0">
              <User className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <span className="text-sm break-words min-w-0">{(profile as any)?.telefono || 'Sin teléfono registrado'}</span>
            </div>
          </div>

          <EditarPerfilForm
            nombre={nombre}
            telefono={(profile as any)?.telefono ?? null}
            fechaNacimiento={(profile as any)?.fecha_nacimiento ?? null}
          />
        </section>

        <section className="bg-white border border-slate-100 rounded-[22px] p-5 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#171923] mb-4">Tus Ministerios</h3>

          {!membresias || membresias.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aún no perteneces a un ministerio"
              description="Explora los ministerios de la iglesia y solicita ingreso al espacio donde deseas servir. Tus asignaciones aparecerán aquí cuando seas agregado."
              action={{ label: 'Explorar ministerios', href: '/ministerios' }}
              compact
              className="min-h-0 bg-slate-50 shadow-none"
            />
          ) : (
            <div className="space-y-1">
              {membresias.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: m.ministerios.color_primario }}
                    />
                    <span className="font-medium text-[#171923] break-words min-w-0">{m.ministerios.nombre}</span>
                  </div>
                  <span className={`shrink-0 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                    m.es_lider
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-slate-100 text-gray-500 border-slate-200'
                  }`}>
                    {m.es_lider ? 'Líder' : 'Servidor'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link href="/contactos" className="block bg-white border border-slate-100 rounded-[22px] p-5 sm:p-6 hover:border-indigo-200 active:scale-[0.99] transition-all shadow-sm">
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[#171923]">Mis Contactos 🤝</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">Tu código QR y tus conexiones con otros servidores</p>
            </div>
            <span className="text-slate-300 text-2xl shrink-0" aria-hidden="true">›</span>
          </div>
        </Link>

        <section className="bg-white border border-slate-100 rounded-[22px] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="text-lg font-semibold text-[#171923]">Notificaciones</h3>
          </div>

          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Activa las alertas push para recibir avisos, solicitudes e intercambios en tiempo real.
          </p>

          <PushToggle />
        </section>

        {(tieneCentroPastoral || tienePanelAdministrativo) && (
          <section className="space-y-3">
            {tieneCentroPastoral && (
              <Link
                href="/pastoral"
                className="flex items-center justify-between gap-4 bg-white border border-indigo-200 hover:border-indigo-300 active:scale-[.98] text-[#171923] px-4 sm:px-5 py-4 rounded-[20px] shadow-sm transition-all min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <BookHeart className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm break-words">Centro Pastoral</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Versículos, bosquejos, biblioteca y materiales</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-indigo-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            {tienePanelAdministrativo && <PushTestButton />}

            {tienePanelAdministrativo && (
              <Link
                href="/admin"
                className="flex items-center justify-between gap-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[.98] text-white px-4 sm:px-5 py-4 rounded-[20px] shadow-[0_6px_24px_rgba(79,70,229,0.30)] transition-all min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <Settings2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm break-words">Panel de Administración</p>
                    <p className="text-[11px] text-indigo-200 mt-0.5 leading-relaxed">Ministerios, usuarios y membresías</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-indigo-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
