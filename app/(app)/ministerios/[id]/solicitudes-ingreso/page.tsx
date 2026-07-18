import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, CheckCircle, XCircle } from 'lucide-react'
import SolicitudIngresoBotones from './SolicitudIngresoBotones'

export default async function SolicitudesIngresoPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar permisos (lider del ministerio, pastor o admin)
  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
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

  // Obtener nombre del ministerio
  const { data: ministerio } = await supabase
    .from('ministerios')
    .select('nombre, color_primario')
    .eq('id', params.id)
    .single()

  if (!ministerio) redirect('/ministerios')

  // Obtener solicitudes pendientes
  const { data: solicitudes } = await (supabase as any)
    .from('ministerio_solicitudes_ingreso')
    .select(`
      id,
      profile_id,
      created_at,
      profiles:profile_id (
        nombre_completo,
        telefono
      )
    `)
    .eq('ministerio_id', params.id)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  const min = ministerio as any
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
        <h1 className="text-2xl font-bold text-[#171923]">Solicitudes de Ingreso</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personas que desean unirse a {min.nombre}
        </p>
      </header>

      {!solicitudes || solicitudes.length === 0 ? (
        <div className="text-center py-12 px-4 border border-slate-100 rounded-[18px] bg-white">
          <p className="text-gray-500">No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {solicitudes.map((sol: any) => (
            <div key={sol.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-[#171923]">{sol.profiles?.nombre_completo || 'Usuario Desconocido'}</h3>
                  <p className="text-xs text-slate-500">
                    {sol.profiles?.telefono || 'Sin teléfono'} • {new Date(sol.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>

              <SolicitudIngresoBotones 
                solicitudId={sol.id} 
                profileId={sol.profile_id} 
                ministerioId={params.id} 
              />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
