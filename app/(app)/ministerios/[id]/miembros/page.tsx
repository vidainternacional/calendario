import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, User } from 'lucide-react'

export default async function MiembrosPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, es_pastor_general')
    .eq('id', user.id)
    .single()

  const p = profile as any
  const isAdminOrPastor = p?.rol === 'pastor' || p?.rol === 'administrador' || p?.es_pastor_general

  const { data: membresiaActual } = await supabase
    .from('ministerio_miembros')
    .select('es_lider')
    .eq('profile_id', user.id)
    .eq('ministerio_id', params.id)
    .single()

  if (!isAdminOrPastor && !(membresiaActual as any)?.es_lider) {
    redirect('/ministerios')
  }

  const { data: ministerio } = await supabase
    .from('ministerios')
    .select('nombre, color_primario')
    .eq('id', params.id)
    .single()

  if (!ministerio) redirect('/ministerios')
  const min = ministerio as any

  const { data: miembros } = await supabase
    .from('ministerio_miembros')
    .select(`
      id,
      es_lider,
      created_at,
      profiles:profile_id (
        id,
        nombre_completo,
        telefono,
        rol
      )
    `)
    .eq('ministerio_id', params.id)
    .order('es_lider', { ascending: false })

  const miembrosList = (miembros as any[]) || []

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 sm:pt-6">
      <header className="mb-5 sm:mb-6">
        <h1 className="text-2xl font-bold text-[#171923]">Miembros</h1>
        <p className="mt-1 text-sm text-slate-500">
          {miembrosList.length} {miembrosList.length === 1 ? 'persona' : 'personas'} en {min.nombre}
        </p>
      </header>

      {miembrosList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
          <p className="text-sm text-slate-500">No hay miembros en este ministerio aún.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {miembrosList.map((m: any) => {
            const profile = m.profiles as any
            const desde = new Date(m.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            return (
              <article
                key={m.id}
                className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-5 w-5 text-slate-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                    <span className="max-w-full break-words text-sm font-bold text-[#171923]">
                      {profile?.nombre_completo || 'Desconocido'}
                    </span>
                    {m.es_lider && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                        <Shield className="h-2.5 w-2.5" /> Líder
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-2">
                    <span className="break-all">{profile?.telefono || 'Sin teléfono'}</span>
                    <span>Desde {desde}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
