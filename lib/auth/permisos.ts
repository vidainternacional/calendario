import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { tieneAccesoPastoral, type PerfilAccesoPastoral } from '@/lib/pastoral/access'

/** Contexto por petición; conserva la regla de acceso pastoral ya aprobada. */
export async function contextoPastoral(mensajeSinPermiso: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Tu sesión expiró.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (!tieneAccesoPastoral(profile as PerfilAccesoPastoral | null)) {
    return { supabase, user, error: mensajeSinPermiso }
  }

  return { supabase, user, error: null }
}
