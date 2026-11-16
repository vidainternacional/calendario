import { createClient } from '@supabase/supabase-js'
import { getServiceRoleKey } from './service-role-key'

/**
 * Cliente con service role para tareas internas del servidor.
 * Nunca debe importarse desde componentes cliente ni exponerse al navegador.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = getServiceRoleKey()

  if (!url || !serviceRoleKey) {
    throw new Error('Falta la URL o la clave de servidor del proyecto Supabase seleccionado')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
