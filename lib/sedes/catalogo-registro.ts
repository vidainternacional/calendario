import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
export async function catalogoRegistroSedes(): Promise<{ id: string; nombre: string }[]> {
  const db = await createClient() as unknown as SupabaseClient
  const { data, error } = await db.rpc('vida_catalogo_registro')
  return !error && Array.isArray(data) ? data as { id: string; nombre: string }[] : []
}
