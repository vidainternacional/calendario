import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import BackButton from '@/components/navigation/BackButton'
import UsuariosAdminClient from '@/components/admin/UsuariosAdminClient'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!['pastor', 'administrador'].includes((profile as any)?.rol)) redirect('/inicio')

  const service = createServiceClient()
  const [{ data: usuarios }, { data: ministerios }, { data: pushRows }, { data: activityRows }] = await Promise.all([
    supabase.from('profiles').select(`id,nombre_completo,email,telefono,avatar_url,rol,activo,estado_cuenta,created_at,es_pastor_general,ministerio_miembros(ministerio_id,es_lider,ministerios(nombre,color_primario))`).order('nombre_completo'),
    supabase.from('ministerios').select('*').order('orden', { ascending: true }),
    service.from('push_subscriptions').select('profile_id'),
    service.from('pilot_usage_events').select('profile_id,occurred_at').order('occurred_at', { ascending: false }).limit(5000),
  ])

  const pushProfiles = new Set((pushRows || []).map((row: any) => row.profile_id))
  const ultimaActividad = new Map<string, string>()
  for (const row of (activityRows || []) as any[]) {
    if (row.profile_id && !ultimaActividad.has(row.profile_id)) ultimaActividad.set(row.profile_id, row.occurred_at)
  }

  const usuariosEnriquecidos = ((usuarios || []) as any[]).map((usuario) => ({
    ...usuario,
    push_activo: pushProfiles.has(usuario.id),
    ultima_actividad: ultimaActividad.get(usuario.id) || null,
  }))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:px-6 sm:pt-12">
      <div className="mb-7"><BackButton /></div>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Administración</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Usuarios</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Consulta identidad, actividad, ministerios y permisos; entra a la ficha para gestionar cada persona.</p>
      </header>
      <UsuariosAdminClient usuarios={usuariosEnriquecidos} ministerios={(ministerios || []) as any[]} />
    </main>
  )
}
