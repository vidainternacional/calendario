'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/types/database'

type MinisterioRow = Database['public']['Tables']['ministerios']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

const SUPERADMIN_EMAIL = 'publiartsv.info@gmail.com'

async function verificarAdministrador() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const rol = (profile as any)?.rol as string | undefined
  if (rol !== 'administrador') return { supabase, user, error: 'Solo un administrador puede realizar esta acción.' }

  return { supabase, user, error: null }
}

// --- MINISTERIOS ---

export async function guardarMinisterio(formData: FormData) {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) throw new Error(permisoError ?? 'No autorizado')

  const id = formData.get('id') as string | null
  const nombre = formData.get('nombre') as string
  const emoji = formData.get('emoji') as string
  const color_primario = formData.get('color_primario') as string
  const color_secundario = formData.get('color_secundario') as string
  const descripcion = formData.get('descripcion') as string
  const activo = formData.get('activo') === 'true'

  const payload = { nombre, emoji, color_primario, color_secundario, descripcion, activo }

  if (id) {
    const { error } = await (supabase as any).from('ministerios').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await (supabase as any).from('ministerios').insert([{ ...payload, orden: 99 }])
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath('/ministerios')
  return { success: true }
}

export async function toggleMinisterioActivo(id: string, activo: boolean) {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) throw new Error(permisoError ?? 'No autorizado')

  const { error } = await (supabase as any).from('ministerios').update({ activo }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/ministerios')
  return { success: true }
}

export async function eliminarMinisterioDefinitivamente(id: string) {
  const { user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  const admin = createAdminClient()
  const { data: ministerio, error: lookupError } = await (admin as any)
    .from('ministerios')
    .select('id, nombre')
    .eq('id', id)
    .maybeSingle()

  if (lookupError) return { success: false, error: lookupError.message }
  if (!ministerio) return { success: false, error: 'El ministerio ya no existe.' }

  const { error } = await (admin as any).from('ministerios').delete().eq('id', id)
  if (error) {
    return {
      success: false,
      error: error.message.includes('foreign key')
        ? 'Este ministerio conserva información relacionada que impide borrarlo de forma segura. No se eliminó ningún dato.'
        : error.message,
    }
  }

  revalidatePath('/admin')
  revalidatePath('/ministerios')
  revalidatePath('/inicio')
  revalidatePath('/avisos')
  revalidatePath('/calendario')
  return { success: true }
}

// --- USUARIOS Y MEMBRESÍAS ---

export async function cambiarRolUsuario(profileId: string, nuevoRol: 'servidor' | 'lider' | 'pastor' | 'administrador') {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  if (profileId === user.id) return { success: false, error: 'No puedes cambiar tu propio rol desde el panel de administración.' }

  const { error } = await (supabase as any).from('profiles').update({ rol: nuevoRol }).eq('id', profileId)
  if (error) {
    if (error.message?.includes('protected')) return { success: false, error: 'Este usuario está protegido y no puede cambiar de rol.' }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/perfil')
  return { success: true }
}

export async function eliminarUsuarioDefinitivamente(profileId: string) {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  if (profileId === user.id) {
    return { success: false, error: 'No puedes eliminar definitivamente tu propia cuenta mientras estás usando el panel.' }
  }

  const { data: target, error: targetError } = await supabase
    .from('profiles')
    .select('id, email, nombre_completo')
    .eq('id', profileId)
    .maybeSingle()

  if (targetError) return { success: false, error: targetError.message }
  if (!target) return { success: false, error: 'El usuario ya no existe.' }

  if (((target as any).email as string | null)?.toLowerCase() === SUPERADMIN_EMAIL) {
    return { success: false, error: 'La cuenta administradora principal está protegida y no puede eliminarse.' }
  }

  const admin = createAdminClient()
  const { error: authError } = await admin.auth.admin.deleteUser(profileId)
  if (authError) {
    return {
      success: false,
      error: authError.message.includes('foreign key')
        ? 'La cuenta conserva información relacionada que impide borrarla de forma segura. No se eliminó la cuenta.'
        : authError.message,
    }
  }

  await admin.storage.from('avatars').remove([
    `${profileId}/source.webp`,
    `${profileId}/avatar.webp`,
  ])

  revalidatePath('/admin')
  revalidatePath('/inicio')
  revalidatePath('/ministerios')
  revalidatePath('/avisos')
  return { success: true }
}

export async function toggleMembresia(profileId: string, ministerioId: string, agregar: boolean) {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) throw new Error(permisoError ?? 'No autorizado')

  if (agregar) {
    const { error } = await (supabase as any).from('ministerio_miembros').insert([{ profile_id: profileId, ministerio_id: ministerioId, es_lider: false }])
    if (error) throw new Error(error.message)
  } else {
    const { error } = await (supabase as any).from('ministerio_miembros').delete().eq('profile_id', profileId).eq('ministerio_id', ministerioId)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath('/ministerios')
  revalidatePath('/perfil')
  return { success: true }
}

export async function setEsLider(profileId: string, ministerioId: string, esLider: boolean) {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  const { error } = await (supabase as any)
    .from('ministerio_miembros')
    .update({ es_lider: esLider })
    .eq('profile_id', profileId)
    .eq('ministerio_id', ministerioId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/ministerios')
  revalidatePath('/perfil')
  return { success: true }
}

export async function updateIconVariant(variant: 'dorado' | 'blanco' | 'rojo') {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) throw new Error(permisoError ?? 'No autorizado')

  const { error } = await (supabase as any).from('app_settings').update({ valor: variant, updated_at: new Date().toISOString() }).eq('clave', 'active_icon_variant')
  if (error) await (supabase as any).from('app_settings').insert({ clave: 'active_icon_variant', valor: variant })

  revalidatePath('/admin')
  return { success: true }
}

export async function updateEstudioPrompt(prompt: string) {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) throw new Error(permisoError ?? 'No autorizado')

  const { error } = await (supabase as any).from('app_settings').upsert({ clave: 'estudio_system_prompt', valor: `"${prompt}"`, updated_at: new Date().toISOString() }, { onConflict: 'clave' })
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/estudios/profundo')
  return { success: true }
}

export async function togglePastorGeneral(profileId: string, esPastorGeneral: boolean) {
  const { supabase, user, error: permisoError } = await verificarAdministrador()
  if (permisoError || !user) return { success: false, error: permisoError ?? 'No autorizado' }

  const { error } = await (supabase as any).from('profiles').update({ es_pastor_general: esPastorGeneral }).eq('id', profileId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

type EstadoCuenta = 'pendiente' | 'activo' | 'suspendido' | 'rechazado'

async function verificarPermisoGestion() {
  const { supabase, user, error } = await verificarAdministrador()
  return { supabase, user, callerRol: user ? 'administrador' : null, error }
}

export async function setEstadoCuenta(profileId: string, estado: EstadoCuenta) {
  const { supabase, user, error: permError } = await verificarPermisoGestion()
  if (permError || !user) return { success: false, error: permError ?? 'No autorizado' }
  if (profileId === user.id) return { success: false, error: 'No puedes cambiar el estado de tu propia cuenta.' }

  const { error } = await (supabase as any).from('profiles').update({ estado_cuenta: estado }).eq('id', profileId)
  if (error) {
    if (error.message?.includes('protected')) return { success: false, error: 'Esta cuenta está protegida y no puede ser desactivada.' }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function aprobarUsuario(profileId: string) {
  return setEstadoCuenta(profileId, 'activo')
}

export async function rechazarUsuario(profileId: string) {
  return setEstadoCuenta(profileId, 'rechazado')
}
