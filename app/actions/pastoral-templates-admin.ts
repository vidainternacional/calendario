'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { normalizarCatalogoAdministradoParaGuardar } from '@/components/pastoral/pastoral-template-admin-model'

async function verificarAdministradorPlantillas() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'No autorizado' }
  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if ((profile as any)?.rol !== 'administrador') return { supabase, user, error: 'Solo el Administrador puede modificar las plantillas.' }
  return { supabase, user, error: null }
}

export async function guardarPlantillasPastoralesAdmin(valor: unknown) {
  const { supabase, user, error: permisoError } = await verificarAdministradorPlantillas()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  const catalogo = normalizarCatalogoAdministradoParaGuardar(valor)
  if (!catalogo.length) return { success: false, error: 'El catálogo de plantillas no puede quedar vacío.' }

  const { error } = await (supabase as any)
    .from('app_settings')
    .upsert({ clave: 'pastoral_templates', valor: catalogo, updated_at: new Date().toISOString() }, { onConflict: 'clave' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/configuracion')
  revalidatePath('/pastoral')
  return { success: true }
}
