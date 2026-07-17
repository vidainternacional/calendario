import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Obtener Ministerios
  const { data: ministerios, error: e1 } = await supabase
    .from('ministerios')
    .select('*')
    .order('orden', { ascending: true })

  if (e1) console.error('[Admin] Error ministerios:', e1)

  // 2. Obtener Usuarios
  const { data: usuarios, error: e2 } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre_completo,
      rol,
      activo,
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
      />
    </main>
  )
}
