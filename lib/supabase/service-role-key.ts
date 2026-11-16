import 'server-only'

/** Mantiene cada clave de servidor asociada al proyecto al que pertenece. */
export function getServiceRoleKey() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')
  if (url === 'https://lnkrojvyiwnlcoponxud.supabase.co') {
    return process.env.CCVIDA_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}
