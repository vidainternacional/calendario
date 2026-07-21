import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'
import { Clock, ShieldAlert, XCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cuenta en revisión',
}

export const dynamic = 'force-dynamic'

export default async function PendientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('nombre_completo, estado_cuenta')
    .eq('id', user.id)
    .single()

  const estado: string = profile?.estado_cuenta ?? 'pendiente'

  // Si ya está activo, no tiene nada que hacer aquí
  if (estado === 'activo') redirect('/inicio')

  const vistas: Record<string, { icono: React.ReactNode; titulo: string; texto: string; color: string }> = {
    pendiente: {
      icono: <Clock className="w-8 h-8 text-amber-500" />,
      titulo: 'Tu cuenta está en revisión',
      texto: 'Un líder o administrador de Vida Internacional debe aprobar tu cuenta antes de que puedas entrar. Te avisaremos en cuanto esté lista. Normalmente toma menos de un día.',
      color: 'bg-amber-50 border-amber-100',
    },
    suspendido: {
      icono: <ShieldAlert className="w-8 h-8 text-rose-500" />,
      titulo: 'Tu cuenta está suspendida',
      texto: 'El acceso a tu cuenta fue pausado temporalmente. Si crees que es un error, habla con tu líder de ministerio o con la administración de la iglesia.',
      color: 'bg-rose-50 border-rose-100',
    },
    rechazado: {
      icono: <XCircle className="w-8 h-8 text-slate-400" />,
      titulo: 'Solicitud no aprobada',
      texto: 'Tu solicitud de cuenta no fue aprobada. Si crees que es un error, comunícate directamente con la administración de Vida Internacional.',
      color: 'bg-slate-50 border-slate-200',
    },
  }

  const v = vistas[estado] ?? vistas.pendiente

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f4f5f9] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className={`bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(20,24,40,0.08)] border ${v.color}`}>
          <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100">
            {v.icono}
          </div>

          <h1 className="text-xl font-bold text-[#171923] mb-2">{v.titulo}</h1>

          {profile?.nombre_completo && (
            <p className="text-sm font-medium text-slate-500 mb-3">
              Hola, {profile.nombre_completo} 👋
            </p>
          )}

          <p className="text-sm text-slate-500 leading-relaxed mb-8">{v.texto}</p>

          <div className="flex justify-center">
            <LogoutButton />
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400">Vida Internacional</p>
      </div>
    </main>
  )
}
