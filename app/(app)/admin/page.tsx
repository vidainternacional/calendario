import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

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
      rol,
      activo,
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

  // 5. Current User Role
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
