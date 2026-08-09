import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BackButton from '@/components/navigation/BackButton'
import UsuariosAdminClient from '@/components/admin/UsuariosAdminClient'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!['pastor', 'administrador'].includes((profile as any)?.rol)) redirect('/inicio')

  const [{ data: usuarios }, { data: ministerios }] = await Promise.all([
    supabase.from('profiles').select(`id,nombre_completo,email,rol,activo,estado_cuenta,created_at,es_pastor_general,ministerio_miembros(ministerio_id,es_lider,ministerios(nombre,color_primario))`).order('nombre_completo'),
    supabase.from('ministerios').select('*').order('orden', { ascending: true }),
  ])

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:px-6 sm:pt-8">
      <div className="mb-5"><BackButton /></div>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Administración</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Usuarios</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Gestiona roles, estado de cuenta, ministerios, liderazgo y eliminación permanente desde una sola ficha.</p>
      </header>
      <UsuariosAdminClient usuarios={(usuarios || []) as any[]} ministerios={(ministerios || []) as any[]} />
    </main>
  )
}
