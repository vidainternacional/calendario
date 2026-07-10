import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import { Calendar, Bell, ArrowLeftRight, FileText, User } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Inicio',
}

const modules = [
  {
    href: '/calendario',
    icon: Calendar,
    label: 'Calendario',
    desc: 'Eventos del ministerio',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    href: '/avisos',
    icon: Bell,
    label: 'Avisos',
    desc: 'Publicaciones internas',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    href: '/solicitudes',
    icon: FileText,
    label: 'Solicitudes',
    desc: 'Permisos y ausencias',
    color: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
  {
    href: '/intercambios',
    icon: ArrowLeftRight,
    label: 'Intercambios',
    desc: 'Cambios de turno',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    href: '/perfil',
    icon: User,
    label: 'Mi perfil',
    desc: 'Datos personales',
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
]

export default async function InicioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const nombre =
    user.user_metadata?.nombre || user.email?.split('@')[0] || 'Servidor'
  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm">
            {inicial}
          </div>
          <div>
            <p className="text-xs text-slate-500">Bienvenido,</p>
            <p className="text-sm font-semibold text-white">{nombre}</p>
          </div>
        </div>
        <LogoutButton />
      </header>

      {/* Título */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Inicio</h1>
        <p className="text-sm text-slate-400 mt-1">
          Selecciona un módulo para continuar
        </p>
      </div>

      {/* Módulos */}
      <div className="grid grid-cols-2 gap-3">
        {modules.map(({ href, icon: Icon, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 transition-all hover:bg-slate-800/70"
          >
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Info debug */}
      <div className="mt-8 rounded-xl bg-slate-900/50 border border-slate-800 p-4">
        <p className="text-xs text-slate-500">
          Sesión activa · {user.email}
        </p>
      </div>
    </main>
  )
}
