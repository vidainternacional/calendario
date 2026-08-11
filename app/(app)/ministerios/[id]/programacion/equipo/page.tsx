import { notFound, redirect } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { crearFuncionMinisterial, actualizarFuncionMinisterial, cambiarEstadoFuncionMinisterial } from '@/app/actions/programacion-alabanza'
import { eliminarFuncionMinisterial } from '@/app/actions/funciones-ministeriales'
import { guardarDisponibilidadPersonaMinisterial } from '@/app/actions/equipo-ministerial'
import FuncionesAlabanzaEditor from '@/components/ministerios/FuncionesAlabanzaEditor'
import DisponibilidadEquipoEditor from '@/components/ministerios/DisponibilidadEquipoEditor'

export const dynamic = 'force-dynamic'

export default async function AjustesEquipoMinisterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient() as any
  const [{ data: ministerio }, { data: profile }, { data: membresia }, { data: funciones = [] }, { data: membresias = [] }] = await Promise.all([
    admin.from('ministerios').select('id,nombre,color_primario').eq('id', id).maybeSingle(),
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
    admin.from('ministerio_capacidades').select('id,nombre,categoria,activo,orden').eq('ministerio_id', id).order('orden').order('nombre'),
    admin.from('ministerio_miembros').select('profile_id').eq('ministerio_id', id),
  ])

  if (!ministerio) notFound()
  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') redirect('/inicio')
  const puedeAdministrar = ['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true
  if (!puedeAdministrar) redirect(`/ministerios/${id}`)

  const profileIds = (membresias as any[]).map((row: any) => String(row.profile_id))
  let miembros: Array<{ id: string; nombre_completo: string; avatar_url: string | null; capacidades: string[] }> = []
  if (profileIds.length > 0) {
    const [{ data: perfiles = [] }, { data: disponibilidad = [] }] = await Promise.all([
      admin.from('profiles').select('id,nombre_completo,avatar_url,activo,estado_cuenta').in('id', profileIds).order('nombre_completo'),
      admin.from('ministerio_miembro_capacidades').select('profile_id,capacidad_id').eq('ministerio_id', id).in('profile_id', profileIds),
    ])
    const porPersona = new Map<string, string[]>()
    for (const row of disponibilidad as any[]) {
      const profileId = String(row.profile_id)
      porPersona.set(profileId, [...(porPersona.get(profileId) || []), String(row.capacidad_id)])
    }
    miembros = (perfiles as any[])
      .filter((row: any) => row.activo === true && row.estado_cuenta === 'activo')
      .map((row: any) => ({ id: String(row.id), nombre_completo: String(row.nombre_completo || 'Integrante'), avatar_url: row.avatar_url || null, capacidades: porPersona.get(String(row.id)) || [] }))
  }

  const funcionesEditor = (funciones as any[]).map((row: any) => ({ id: String(row.id), nombre: String(row.nombre), categoria: row.categoria ? String(row.categoria) : null, activo: row.activo === true }))
  const funcionesActivas = funcionesEditor.filter((row) => row.activo).map((row) => ({ id: row.id, nombre: row.nombre, categoria: row.categoria || 'Servicio' }))

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
      <header className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: ministerio.color_primario || '#5b3df5' }}>Panel del líder</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-slate-900">Ajustes de roles y disponibilidad</h1>
        <p className="mt-1 text-xs leading-5 text-slate-500">Aquí administras qué roles existen y cuáles puede realizar cada integrante. La selección para una fecha se hace directamente en Equipo dentro de Programación.</p>
      </header>

      <div className="space-y-5">
        <DisponibilidadEquipoEditor funciones={funcionesActivas} miembros={miembros} guardarAction={guardarDisponibilidadPersonaMinisterial.bind(null, id)} />
        <div className="rounded-2xl bg-indigo-50 p-3 text-[10px] leading-4 text-indigo-700 ring-1 ring-indigo-100"><Settings2 className="mr-1 inline h-3.5 w-3.5" /> Retirar una función conserva el historial. Eliminarla permanentemente solo se permite cuando nunca se ha utilizado ni está asignada a integrantes.</div>
        <FuncionesAlabanzaEditor
          funciones={funcionesEditor}
          crearAction={crearFuncionMinisterial.bind(null, id)}
          editarAction={actualizarFuncionMinisterial.bind(null, id)}
          estadoAction={cambiarEstadoFuncionMinisterial.bind(null, id)}
          eliminarAction={eliminarFuncionMinisterial.bind(null, id)}
        />
      </div>
    </main>
  )
}
