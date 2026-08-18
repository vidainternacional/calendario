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
  if ((profile as any)?.rol !== 'administrador') redirect('/inicio')

  const service = createServiceClient()
  const [
    { data: usuarios },
    { data: ministerios },
    { data: pushRows },
    { data: activityRows },
    { data: detailRows },
    { data: capacidades },
    { data: capacidadAsignaciones },
    { data: responsabilidades },
    { data: responsabilidadAsignaciones },
  ] = await Promise.all([
    supabase.from('profiles').select(`id,nombre_completo,email,telefono,avatar_url,rol,activo,estado_cuenta,created_at,es_pastor_general,fecha_nacimiento,ministerio_miembros(ministerio_id,es_lider,ministerios(nombre,color_primario))`).order('nombre_completo'),
    supabase.from('ministerios').select('*').order('orden', { ascending: true }),
    service.from('push_subscriptions').select('profile_id'),
    service.from('pilot_usage_events').select('profile_id,occurred_at').order('occurred_at', { ascending: false }).limit(5000),
    (service as any).from('member_profile_details').select('*'),
    (service as any).from('ministerio_capacidades').select('id,ministerio_id,nombre,categoria,activo,orden').eq('activo', true).order('ministerio_id').order('orden', { ascending: true }),
    (service as any).from('ministerio_miembro_capacidades').select('profile_id,capacidad_id'),
    (service as any).from('ministerio_responsabilidades').select('id,ministerio_id,codigo,nombre,descripcion,activo').eq('activo', true).order('nombre', { ascending: true }),
    (service as any).from('ministerio_responsabilidad_asignaciones').select('profile_id,responsabilidad_id'),
  ])

  const pushProfiles = new Set((pushRows || []).map((row: any) => row.profile_id))
  const ultimaActividad = new Map<string, string>()
  for (const row of (activityRows || []) as any[]) {
    if (row.profile_id && !ultimaActividad.has(row.profile_id)) ultimaActividad.set(row.profile_id, row.occurred_at)
  }

  const detailsByProfile = new Map(((detailRows || []) as any[]).map((row) => [row.profile_id, row]))
  const capacidadesByProfile = new Map<string, Set<string>>()
  for (const row of (capacidadAsignaciones || []) as any[]) {
    if (!row.profile_id || !row.capacidad_id) continue
    if (!capacidadesByProfile.has(row.profile_id)) capacidadesByProfile.set(row.profile_id, new Set())
    capacidadesByProfile.get(row.profile_id)?.add(row.capacidad_id)
  }

  const responsabilidadesByProfile = new Map<string, Set<string>>()
  for (const row of (responsabilidadAsignaciones || []) as any[]) {
    if (!row.profile_id || !row.responsabilidad_id) continue
    if (!responsabilidadesByProfile.has(row.profile_id)) responsabilidadesByProfile.set(row.profile_id, new Set())
    responsabilidadesByProfile.get(row.profile_id)?.add(row.responsabilidad_id)
  }

  const usuariosEnriquecidos = ((usuarios || []) as any[]).map((usuario) => ({
    ...usuario,
    push_activo: pushProfiles.has(usuario.id),
    ultima_actividad: ultimaActividad.get(usuario.id) || null,
    detalle_perfil: detailsByProfile.get(usuario.id) || null,
    capacidades_ministeriales_ids: Array.from(capacidadesByProfile.get(usuario.id) || []),
    responsabilidades_especiales_ids: Array.from(responsabilidadesByProfile.get(usuario.id) || []),
  }))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:px-6 sm:pt-12">
      <div className="mb-7"><BackButton /></div>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Administración</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Usuarios</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Consulta la ficha integral de cada miembro: identidad, actividad, ministerios, profesión, disponibilidad, capacidades oficiales y permisos.</p>
      </header>
      <UsuariosAdminClient
        usuarios={usuariosEnriquecidos}
        ministerios={(ministerios || []) as any[]}
        capacidades={(capacidades || []) as any[]}
        responsabilidades={(responsabilidades || []) as any[]}
      />
    </main>
  )
}
