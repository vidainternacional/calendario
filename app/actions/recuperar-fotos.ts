'use server'

import { createClient as createApiClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { recoverPhotos } from '@/lib/admin/recuperar-fotos'
import { revalidatePath } from 'next/cache'

export async function recuperarFotosAnteriores() {
  const session = await createClient()
  const { data: { user }, error } = await session.auth.getUser()
  if (error || !user) return { error: 'Inicia sesión con tu cuenta administradora.' }
  const { data } = await session.from('profiles').select('rol,estado_cuenta').eq('id', user.id).single()
  const profile = data as { rol?: string; estado_cuenta?: string } | null
  if (profile?.rol !== 'administrador' || profile.estado_cuenta !== 'activo') return { error: 'Solo administradores activos.' }
  const sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://lnkrojvyiwnlcoponxud.supabase.co' || !sourceKey || !process.env.CCVIDA_SUPABASE_SERVICE_ROLE_KEY) return { error: 'Falta la configuración de recuperación del servidor.' }
  try {
    const claims = JSON.parse(Buffer.from(sourceKey.split('.')[1], 'base64url').toString())
    if (claims.ref !== 'atjtjpchslxbseayzflz' || claims.role !== 'service_role') return { error: 'La credencial del origen no corresponde al Supabase anterior.' }
    const source = createApiClient('https://atjtjpchslxbseayzflz.supabase.co', sourceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const result = await recoverPhotos(source, createServiceClient())
    revalidatePath('/perfil')
    revalidatePath('/inicio')
    return { success: true, ...result }
  } catch {
    return { error: 'La recuperación no terminó. Las fotos nuevas se conservan; solo se retiran originales con copia verificada. Puede reintentarse.' }
  }
}
