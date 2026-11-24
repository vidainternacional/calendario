'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { esGestorGlobalSedes, validarSeleccionSedes, type Sede, type MisSedes } from '@/lib/sedes/modelo'

async function contextoSedes() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Inicia sesión para continuar.')
  const db = supabase as unknown as SupabaseClient
  const { data, error: perfilError } = await db.from('profiles').select('activo,estado_cuenta,rol,es_pastor_general').eq('id', user.id).single()
  const perfil = data as { activo: boolean; estado_cuenta: string; rol: string; es_pastor_general: boolean } | null
  if (perfilError || !perfil?.activo || perfil.estado_cuenta !== 'activo') throw new Error('Tu cuenta no está activa.')
  return { db, user, perfil }
}

export async function obtenerMisSedes(ownerId: string): Promise<{ sedes?: Sede[]; seleccion?: MisSedes; error?: string }> {
  try {
    const { db, user } = await contextoSedes()
    if (user.id !== ownerId) throw new Error('Tu sesión cambió. Vuelve a abrir tu Perfil.')
    const [catalogo, preferencias, seleccion] = await Promise.all([
      db.from('vida_sedes').select('id,slug,nombre,pais,zona_horaria,central,activa').eq('activa', true).order('central', { ascending: false }).order('nombre'),
      db.from('vida_sede_preferencias').select('congregacion_definida').eq('profile_id', user.id).maybeSingle(),
      db.from('vida_sede_selecciones').select('sede_id,pertenece,visible').eq('profile_id', user.id),
    ])
    if (catalogo.error || preferencias.error || seleccion.error) return { error: 'La configuración de sedes todavía no está disponible. Tu cuenta y equipos se conservan.' }
    const sedes = catalogo.data as Sede[]
    const activas = new Set(sedes.map(sede => sede.id))
    const filas = (seleccion.data || []) as { sede_id: string; pertenece: boolean; visible: boolean }[]
    const visibles = filas.filter(f => f.visible && activas.has(f.sede_id)).map(f => f.sede_id)
    return { sedes, seleccion: { definida: Boolean(preferencias.data?.congregacion_definida), congregacion: filas.filter(f => f.pertenece && activas.has(f.sede_id)).map(f => f.sede_id), visibles: visibles.length ? visibles : sedes.map(s => s.id) } }
  } catch (error) { return { error: error instanceof Error ? error.message : 'No se pudieron consultar tus sedes.' } }
}

export async function guardarMisSedes(tipo: 'congregacion' | 'visibles', seleccion: unknown, ownerId: string) {
  try {
    if (tipo !== 'congregacion' && tipo !== 'visibles') throw new Error('Selección no válida.')
    const ids = validarSeleccionSedes(seleccion, tipo === 'congregacion')
    const { db, user } = await contextoSedes()
    if (user.id !== ownerId) throw new Error('Tu sesión cambió. Vuelve a abrir tu Perfil.')
    // RPC invoker: auth.uid y RLS fijan el dueño; no acepta otro profile_id.
    const { error } = await db.rpc('vida_guardar_mis_sedes', {
      p_congregacion: tipo === 'congregacion' ? ids : null,
      p_visibles: tipo === 'visibles' ? ids : null,
    })
    if (error) return { error: 'No se pudo guardar la selección. Intenta de nuevo; tu selección anterior se conserva.' }
    revalidatePath('/perfil'); revalidatePath('/inicio')
    return { success: true }
  } catch (error) { return { error: error instanceof Error ? error.message : 'No se pudo guardar.' } }
}

export async function crearSede(formData: FormData, ownerId: string) {
  try {
    const { db, perfil, user } = await contextoSedes()
    if (user.id !== ownerId) throw new Error('Tu sesión cambió. Vuelve a abrir Administración.')
    if (!esGestorGlobalSedes(perfil)) throw new Error('Solo administración o el pastor general puede crear sedes.')
    const nombre = String(formData.get('nombre') || '').trim()
    const slug = String(formData.get('slug') || '').trim().toLowerCase()
    const pais = String(formData.get('pais') || '').trim()
    const zona_horaria = String(formData.get('zona_horaria') || '').trim()
    if (nombre.length < 3 || nombre.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80 || !/^[A-Z]{2}$/.test(pais)) throw new Error('Revisa nombre, identificador y país de la sede.')
    try { new Intl.DateTimeFormat('es', { timeZone: zona_horaria }).format() } catch { throw new Error('Selecciona una zona horaria válida.') }
    const { error } = await db.from('vida_sedes').insert({ nombre, slug, pais, zona_horaria, central: false, activa: true })
    if (error) return { error: 'No se pudo crear la sede. Comprueba que su identificador no exista.' }
    revalidatePath('/admin/sedes')
    return { success: true }
  } catch (error) { return { error: error instanceof Error ? error.message : 'No se pudo crear la sede.' } }
}
