import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User } from 'lucide-react'
import SolicitudIngresoBotones from './SolicitudIngresoBotones'

export const dynamic = 'force-dynamic'

export default async function SolicitudesIngresoPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, es_pastor_general')
    .eq('id', user.id)
    .single()

  const p = profile as any
  const isAdminOrPastor = p?.rol === 'administrador' || p?.rol === 'pastor' || p?.es_pastor_general

  const { data: membresiaLider } = await supabase
    .from('ministerio_miembros')
    .select('es_lider')
    .eq('profile_id', user.id)
    .eq('ministerio_id', params.id)
    .single()

  if (!isAdminOrPastor && !(membresiaLider as any)?.es_lider) {
    redirect('/ministerios')
  }

  const { data: ministerio } = await supabase
    .from('ministerios')
    .select('nombre')
    .eq('id', params.id)
    .single()

  if (!ministerio) redirect('/ministerios')

  const { data: solicitudes, error: solicitudesError } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .select('id, profile_id, created_at')
    .eq('ministerio_id', params.id)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  if (solicitudesError) {
    console.error('[SolicitudesIngresoPage] No se pudieron cargar las solicitudes pendientes', solicitudesError)
  }

  const profileIds = Array.from(
    new Set((solicitudes || []).map((sol: any) => String(sol.profile_id)).filter(Boolean)),
  )

  let perfilesPorId = new Map<string, any>()

  if (profileIds.length > 0) {
    const { data: perfiles, error: perfilesError } = await (supabase as any)
      .from('profiles')
      .select('id, nombre_completo, telefono')
      .in('id', profileIds)

    if (perfilesError) {
      console.error('[SolicitudesIngresoPage] No se pudieron cargar los perfiles solicitantes', perfilesError)
    } else {
      perfilesPorId = new Map((perfiles || []).map((perfil: any) => [String(perfil.id), perfil]))
    }
  }

  const solicitudesConPerfil = (solicitudes || []).map((sol: any) => ({
    ...sol,
    profile: perfilesPorId.get(String(sol.profile_id)) || null,
  }))

  const min = ministerio as any

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-[calc(env(safe-area-inset-top)+8rem)] sm:pt-32">
      <header className="mb-6 px-1">
        <h1 className="text-xl font-bold text-[#171923] sm:text-2xl">Solicitudes de ingreso</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Personas que desean unirse a {min.nombre}
        </p>
      </header>

      {solicitudesError ? (
        <div className="rounded-[24px] border border-rose-100 bg-white px-5 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#171923]">No pudimos cargar las solicitudes.</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Intenta abrir esta pantalla nuevamente.</p>
        </div>
      ) : solicitudesConPerfil.length === 0 ? (
        <div className="rounded-[24px] border border-slate-100 bg-white px-4 py-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {solicitudesConPerfil.map((sol: any) => (
            <article key={sol.id} className="overflow-hidden rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-5 w-5 text-slate-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-bold text-[#171923] sm:text-base">
                    {sol.profile?.nombre_completo || 'Usuario desconocido'}
                  </h3>
                  <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-2">
                    <span className="break-words">{sol.profile?.telefono || 'Sin teléfono'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      {new Date(sol.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <SolicitudIngresoBotones
                solicitudId={sol.id}
                profileId={sol.profile_id}
                ministerioId={params.id}
              />
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
