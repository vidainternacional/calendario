import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, User } from 'lucide-react'

export default async function MiembrosPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar permisos
  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
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

  // Obtener datos del ministerio
  const { data: ministerio } = await supabase
    .from('ministerios')
    .select('nombre, color_primario')
    .eq('id', params.id)
    .single()

  if (!ministerio) redirect('/ministerios')
  const min = ministerio as any

  // Obtener todos los miembros con su perfil
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
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto pb-28">
      <div className="mb-6">
        <Link
          href={`/ministerios/${params.id}/avisos`}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a {min.nombre}
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#171923]">Miembros</h1>
        <p className="text-sm text-gray-500 mt-1">
          {miembrosList.length} {miembrosList.length === 1 ? 'persona' : 'personas'} en {min.nombre}
        </p>
      </header>

      {miembrosList.length === 0 ? (
        <div className="text-center py-12 px-4 border border-slate-100 rounded-[18px] bg-white">
          <p className="text-gray-500">No hay miembros en este ministerio aún.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {miembrosList.map((m: any) => {
            const profile = m.profiles as any
            const desde = new Date(m.created_at).toLocaleDateString('es-ES', {
              day: '2-digit', month: 'short', year: 'numeric'
            })
            return (
              <div key={m.id} className="bg-white px-5 py-4 rounded-[18px] shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#171923] text-sm truncate">{profile?.nombre_completo || 'Desconocido'}</span>
                    {m.es_lider && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                        <Shield className="w-2.5 h-2.5" /> Líder
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {profile?.telefono || 'Sin teléfono'} · Desde {desde}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
