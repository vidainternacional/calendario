import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import Link from 'next/link'
import { User, Mail, Shield, Bell, Settings2 } from 'lucide-react'
import PushToggle from '@/components/pwa/PushToggle'
import EditarPerfilForm from '@/components/perfil/EditarPerfilForm'
import PushTestButton from '@/components/pwa/PushTestButton'

export const metadata: Metadata = {
  title: 'Mi Perfil',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, rol, telefono')
    .eq('id', user.id)
    .single()

  // Obtener membresias
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

  const rolGlobal = roles[(profile as any)?.rol as keyof typeof roles] || roles.servidor

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#171923]">Mi Perfil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tu información y preferencias
          </p>
        </div>
        <LogoutButton />
      </header>

      <div className="space-y-8">
        {/* Info Personal */}
        <section className="bg-white border border-slate-100 rounded-[18px] p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {(profile as any)?.nombre_completo?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#171923]">{(profile as any)?.nombre_completo}</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mt-1.5 ${rolGlobal.bg} ${rolGlobal.text} ${rolGlobal.border}`}>
                <Shield className="w-3.5 h-3.5" />
                Rol global: {rolGlobal.label}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#171923]">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-[#171923]">
              <User className="w-5 h-5 text-gray-500" />
              <span className="text-sm">{(profile as any)?.telefono || 'Sin teléfono registrado'}</span>
            </div>
          </div>

          <EditarPerfilForm
            nombre={(profile as any)?.nombre_completo ?? ''}
            telefono={(profile as any)?.telefono ?? null}
            fechaNacimiento={(profile as any)?.fecha_nacimiento ?? null}
          />
        </section>

        {/* Ministerios y Roles */}
        <section className="bg-white border border-slate-100 rounded-[18px] p-6">
          <h3 className="text-lg font-semibold text-[#171923] mb-4">Tus Ministerios</h3>
          
          {!membresias || membresias.length === 0 ? (
            <p className="text-sm text-gray-500">No perteneces a ningún ministerio aún.</p>
          ) : (
            <div className="space-y-4">
              {membresias.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between pb-4 border-b border-slate-100/50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: m.ministerios.color_primario }}
                    />
                    <span className="font-medium text-[#171923]">{m.ministerios.nombre}</span>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
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

        {/* Contactos */}
        <Link href="/contactos" className="block bg-white border border-slate-100 rounded-[18px] p-6 hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#171923]">Mis Contactos 🤝</h3>
              <p className="text-sm text-slate-500 mt-1">Tu código QR y tus conexiones con otros servidores</p>
            </div>
            <span className="text-slate-300 text-xl">›</span>
          </div>
        </Link>

        {/* Notificaciones Push */}
        <section className="bg-white border border-slate-100 rounded-[18px] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-[#171923]">Notificaciones</h3>
          </div>
          
          <p className="text-sm text-gray-500 mb-5">
            Activa las alertas push para recibir avisos, solicitudes e intercambios en tiempo real.
          </p>

          <PushToggle />
        </section>
        {/* Panel de Administración (solo pastor/admin) */}
        {(['pastor', 'administrador'] as const).includes((profile as any)?.rol) && (
          <section className="space-y-3">
            <PushTestButton />
            <Link
              href="/admin"
              className="flex items-center justify-between gap-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[.98] text-white px-5 py-4 rounded-[18px] shadow-[0_6px_24px_rgba(79,70,229,0.30)] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Settings2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Panel de Administración</p>
                  <p className="text-[11px] text-indigo-200 mt-0.5">Ministerios, usuarios y membresías</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-indigo-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>
        )}
      </div>
    </main>
  )
}
