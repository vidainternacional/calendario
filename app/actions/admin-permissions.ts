'use server'

import { createClient } from '@/lib/supabase/server'

export async function obtenerContextoAdministrador() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { esAdministrador: false, userId: null as string | null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  return {
    esAdministrador: (profile as any)?.rol === 'administrador',
    userId: user.id,
  }
}
