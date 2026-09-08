import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, ChevronRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InicioOnlineRefresh from '@/components/inicio/InicioOnlineRefresh'

export const metadata: Metadata = {
  title: 'Inicio',
}

export default async function InicioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: discipuladoEstado }] = await Promise.all([
    (supabase as any).from('profiles').select('rol').eq('id', user.id).single(),
    (supabase as any).rpc('discipulado_estado_personal'),
  ])

  const rol = (profile as any)?.rol as string | undefined
  const estado = (discipuladoEstado as any)?.estado as string | undefined
  const aprobado = (discipuladoEstado as any)?.aprobado === true
  const mostrarInvitacion = rol !== 'pastor' && rol !== 'administrador' && !aprobado
  const yaInicio = estado && !['sin_iniciar', 'sin_curso'].includes(estado)

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <InicioOnlineRefresh userId={user.id} email={user.email} />

      {mostrarInvitacion && (
        <section className="mx-auto max-w-3xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6">
          <Link
            href="/discipulado"
            className="group flex min-h-[104px] items-center gap-4 rounded-[24px] border border-violet-200 bg-white p-4 shadow-[0_10px_28px_rgba(79,70,229,0.08)] transition active:scale-[0.992] sm:p-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-violet-50 shadow-[0_6px_18px_rgba(124,58,237,0.22)]">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-violet-600">Discipulado</span>
              <span className="mt-1 block text-[15px] font-bold leading-snug text-[#171923]">
                {yaInicio ? 'Continúa tu discipulado' : '¿Aún no te has discipulado y quieres servir?'}
              </span>
              <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                {yaInicio ? 'Retoma tu curso desde el punto donde lo dejaste.' : 'Empecemos aquí. Avanza por el curso y prepárate para servir.'}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-violet-400 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  )
}
