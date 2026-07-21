import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Ministerios
  const { data: ministerios, error: e1 } = await supabase
    .from('ministerios')
    .select('*')
    .order('orden', { ascending: true })

  if (e1) console.error('[Admin] Error ministerios:', e1)

  // 2. Usuarios
  const { data: usuarios, error: e2 } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre_completo,
      email,
      rol,
      activo,
      estado_cuenta,
      created_at,
      es_pastor_general,
      ministerio_miembros (
        ministerio_id,
        es_lider,
        ministerios (
          nombre,
          color_primario
        )
      )
    `)
    .order('nombre_completo', { ascending: true })

  if (e2) console.error('[Admin] Error usuarios:', e2)

  // 3. Ícono activo de la app
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: iconSetting } = await (supabase as any)
    .from('app_settings')
    .select('valor')
    .eq('clave', 'active_icon_variant')
    .maybeSingle()

  // Limpia comillas si se guardó como '"dorado"'
  const activeIconVariant: string =
    typeof iconSetting?.valor === 'string'
      ? iconSetting.valor.replace(/"/g, '')
      : 'dorado'

  // 4. Estudio Profundo System Prompt
  const { data: promptSetting } = await (supabase as any)
    .from('app_settings')
    .select('valor')
    .eq('clave', 'estudio_system_prompt')
    .maybeSingle()

  const estudioPrompt: string =
    typeof promptSetting?.valor === 'string'
      ? promptSetting.valor.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
      : ''

  // 5. Contadores de elementos pendientes
  const { count: pendingPreguntas } = await (supabase as any)
    .from('preguntas_congregacion')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  const { count: pendingAvisos } = await (supabase as any)
    .from('publicaciones')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  // 6. Current User Role
  const { data: { user } } = await supabase.auth.getUser()
  let currentUserRol = 'servidor'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
    if ((profile as any)?.rol) currentUserRol = (profile as any).rol
  }

  return (
    <main className="px-4 py-8 max-w-2xl mx-auto pb-28">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#171923]">Administración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona ministerios, usuarios y accesos
        </p>
      </header>

      {/* ── Estadísticas Generales ────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuarios</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#171923]">{usuarios?.length || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ministerios</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#171923]">{ministerios?.length || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">Avisos Pendientes</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${pendingAvisos ? 'text-amber-500' : 'text-[#171923]'}`}>
              {pendingAvisos || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">Dudas / Buzón</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${pendingPreguntas ? 'text-rose-500' : 'text-[#171923]'}`}>
              {pendingPreguntas || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ── Accesos Rápidos ─────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          href="/admin/preguntas"
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow group"
        >
          <div>
            <h3 className="font-bold text-[#171923]">Buzón de Congregación</h3>
            <p className="text-xs text-gray-500 mt-1">Preguntas y sugerencias</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <span className="text-xl">💬</span>
          </div>
        </Link>
      </div>

      <AdminClient
        ministerios={ministerios || []}
        usuarios={usuarios || []}
        activeIconVariant={activeIconVariant}
        initialEstudioPrompt={estudioPrompt}
        currentUserRol={currentUserRol}
      />
    </main>
  )
}
