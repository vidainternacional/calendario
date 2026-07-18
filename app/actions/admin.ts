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

  // 🔒 Guard: only pastors can assign the "pastor" role
  if (nuevoRol === 'pastor' && callerRol !== 'pastor') {
    return { success: false, error: 'Solo un pastor puede asignar el rol de pastor a otro usuario.' }
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
