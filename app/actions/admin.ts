'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/types/database'

type MinisterioRow = Database['public']['Tables']['ministerios']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

// --- MINISTERIOS ---

export async function guardarMinisterio(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const _rol1 = (profile as any)?.rol
  if (_rol1 !== 'pastor' && _rol1 !== 'administrador') {
    throw new Error('Permisos insuficientes')
  }

  const id = formData.get('id') as string | null
  const nombre = formData.get('nombre') as string
  const emoji = formData.get('emoji') as string
  const color_primario = formData.get('color_primario') as string
  const color_secundario = formData.get('color_secundario') as string
  const descripcion = formData.get('descripcion') as string
  const activo = formData.get('activo') === 'true'

  const payload = {
    nombre,
    emoji,
    color_primario,
    color_secundario,
    descripcion,
    activo
  }

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const _rol2 = (profile as any)?.rol
  if (_rol2 !== 'pastor' && _rol2 !== 'administrador') {
    throw new Error('Permisos insuficientes')
  }

  const { error } = await (supabase as any).from('ministerios').update({ activo }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/ministerios')
  return { success: true }
}

// --- USUARIOS Y MEMBRESÍAS ---

export async function cambiarRolUsuario(profileId: string, nuevoRol: 'servidor' | 'lider' | 'pastor' | 'administrador') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: callerProfile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const callerRol = (callerProfile as any)?.rol
  if (callerRol !== 'pastor' && callerRol !== 'administrador') {
    return { success: false, error: 'Permisos insuficientes' }
  }

  // 🔒 Guard: cannot change your own role
  if (profileId === user.id) {
    return { success: false, error: 'No puedes cambiar tu propio rol desde el panel de administración.' }
  }

  // 🔒 Jerarquía de roles:
  //   - Solo un ADMINISTRADOR puede otorgar el rol 'administrador'
  //   - Solo un ADMINISTRADOR puede cambiar el rol de otro administrador
  //   (la BD también lo bloquea vía trigger guard_role_escalation — defensa doble)
  if (nuevoRol === 'administrador' && callerRol !== 'administrador') {
    return { success: false, error: 'Solo un administrador puede otorgar el rol de administrador.' }
  }

  const { data: targetProfile } = await supabase.from('profiles').select('rol').eq('id', profileId).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetRol = (targetProfile as any)?.rol
  if (targetRol === 'administrador' && callerRol !== 'administrador') {
    return { success: false, error: 'Solo un administrador puede modificar a otro administrador.' }
  }

  const { error } = await (supabase as any).from('profiles').update({ rol: nuevoRol }).eq('id', profileId)
  if (error) {
    // DB trigger will reject the superadmin account change
    if (error.message?.includes('protected')) {
      return { success: false, error: 'Este usuario está protegido y no puede cambiar de rol.' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function toggleMembresia(profileId: string, ministerioId: string, agregar: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const _rol4 = (profile as any)?.rol
  if (_rol4 !== 'pastor' && _rol4 !== 'administrador') {
    throw new Error('Permisos insuficientes')
  }

  if (agregar) {
    const { error } = await (supabase as any).from('ministerio_miembros').insert([{ profile_id: profileId, ministerio_id: ministerioId, es_lider: false }])
    if (error) throw new Error(error.message)
  } else {
    const { error } = await (supabase as any).from('ministerio_miembros').delete().eq('profile_id', profileId).eq('ministerio_id', ministerioId)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function setEsLider(profileId: string, ministerioId: string, esLider: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const _rol5 = (profile as any)?.rol
  if (_rol5 !== 'pastor' && _rol5 !== 'administrador') {
    throw new Error('Permisos insuficientes')
  }

  const { error } = await (supabase as any).from('ministerio_miembros')
    .update({ es_lider: esLider })
    .eq('profile_id', profileId)
    .eq('ministerio_id', ministerioId)
  
  if (error) {
    if (error.message.includes('No se puede ser líder de más de 2 ministerios')) {
      return { success: false, error: 'Un usuario no puede ser líder de más de 2 ministerios (Regla de negocio).' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function updateIconVariant(variant: 'dorado' | 'blanco' | 'rojo') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const rol = (profile as any)?.rol
  if (rol !== 'pastor' && rol !== 'administrador') {
    throw new Error('Permisos insuficientes')
  }

  const { error } = await (supabase as any)
    .from('app_settings')
    .update({ valor: variant, updated_at: new Date().toISOString() })
    .eq('clave', 'active_icon_variant')

  if (error) {
    // Si no existía, hacemos insert
    await (supabase as any).from('app_settings').insert({
      clave: 'active_icon_variant',
      valor: variant
    })
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function updateEstudioPrompt(prompt: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const rol = (profile as any)?.rol
  if (rol !== 'pastor' && rol !== 'administrador') {
    throw new Error('Permisos insuficientes')
  }

  const { error } = await (supabase as any)
    .from('app_settings')
    .upsert({
      clave: 'estudio_system_prompt',
      valor: `"${prompt}"`,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'clave'
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/estudios/profundo')
  return { success: true }
}

export async function togglePastorGeneral(profileId: string, esPastorGeneral: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  const rol = (profile as any)?.rol
  if (rol !== 'administrador') {
    return { success: false, error: 'Solo un administrador puede asignar el rol de Pastor General.' }
  }

  const { error } = await (supabase as any)
    .from('profiles')
    .update({ es_pastor_general: esPastorGeneral })
    .eq('id', profileId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}


// ─── FASE 1: Gestión de estados de cuenta ────────────────────────────────────

type EstadoCuenta = 'pendiente' | 'activo' | 'suspendido' | 'rechazado'

async function verificarPermisoGestion() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, callerRol: null, error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callerRol = (profile as any)?.rol as string | undefined

  if (callerRol !== 'pastor' && callerRol !== 'administrador') {
    return { supabase, user, callerRol, error: 'Permisos insuficientes' }
  }
  return { supabase, user, callerRol, error: null }
}

/**
 * Cambia el estado de cuenta de un usuario.
 * - Aprobar cuenta:   'activo'
 * - Rechazar cuenta:  'rechazado'
 * - Suspender:        'suspendido'
 * - Reactivar:        'activo'
 * Reglas: no puedes cambiarte a ti mismo; solo un administrador
 * puede suspender/rechazar a otro administrador. El superadmin está
 * protegido a nivel de base de datos.
 */
export async function setEstadoCuenta(profileId: string, estado: EstadoCuenta) {
  const { supabase, user, callerRol, error: permError } = await verificarPermisoGestion()
  if (permError || !user) return { success: false, error: permError ?? 'No autorizado' }

  if (profileId === user.id) {
    return { success: false, error: 'No puedes cambiar el estado de tu propia cuenta.' }
  }

  const { data: targetProfile } = await supabase.from('profiles').select('rol').eq('id', profileId).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetRol = (targetProfile as any)?.rol
  if (targetRol === 'administrador' && callerRol !== 'administrador') {
    return { success: false, error: 'Solo un administrador puede modificar a otro administrador.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ estado_cuenta: estado })
    .eq('id', profileId)

  if (error) {
    if (error.message?.includes('protected')) {
      return { success: false, error: 'Esta cuenta está protegida y no puede ser desactivada.' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

/** Aprueba una cuenta pendiente → acceso completo a la app. */
export async function aprobarUsuario(profileId: string) {
  return setEstadoCuenta(profileId, 'activo')
}

/** Rechaza una solicitud de cuenta. */
export async function rechazarUsuario(profileId: string) {
  return setEstadoCuenta(profileId, 'rechazado')
}
