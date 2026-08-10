'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type AccesoPaleta = {
  userId: string
  puedePaleta: boolean
}

function fail(message: string): never {
  throw new Error(message)
}

async function obtenerAccesoPaleta(ministerioId: string): Promise<AccesoPaleta | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membresia }, { data: asignaciones }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
    admin.from('ministerio_responsabilidad_asignaciones').select('responsabilidad_id').eq('profile_id', user.id),
  ])

  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') return null

  const puedeProgramar = ['administrador', 'pastor'].includes(profile.rol) || membresia?.es_lider === true
  let responsabilidadPaleta = false

  if (!puedeProgramar && (asignaciones || []).length > 0) {
    const ids = (asignaciones || []).map((item: any) => item.responsabilidad_id).filter(Boolean)
    if (ids.length > 0) {
      const { data: responsabilidad } = await admin
        .from('ministerio_responsabilidades')
        .select('id')
        .in('id', ids)
        .eq('ministerio_id', ministerioId)
        .eq('codigo', 'paleta_colores')
        .eq('activo', true)
        .limit(1)
      responsabilidadPaleta = (responsabilidad || []).length > 0
    }
  }

  return {
    userId: user.id,
    puedePaleta: puedeProgramar || responsabilidadPaleta,
  }
}

function leerColores(formData: FormData) {
  return ['color_1', 'color_2', 'color_3', 'color_4', 'color_5']
    .map((key) => String(formData.get(key) || '').trim().toUpperCase())
    .filter((value) => /^#[0-9A-F]{6}$/.test(value))
}

export async function listarPaletasBibliotecaMinisterial(ministerioId: string) {
  const acceso = await obtenerAccesoPaleta(ministerioId)
  if (!acceso?.puedePaleta) fail('No tienes permiso para ver la biblioteca de paletas.')

  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('ministerio_paletas')
    .select('id,nombre,colores,observaciones,referencia_url,updated_at')
    .eq('ministerio_id', ministerioId)
    .eq('activo', true)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) fail(error.message)

  return (data || []).map((item: any) => ({
    id: String(item.id),
    nombre: String(item.nombre || 'Paleta'),
    colores: Array.isArray(item.colores) ? item.colores.map(String) : [],
    observaciones: item.observaciones ? String(item.observaciones) : null,
    referencia_url: item.referencia_url ? String(item.referencia_url) : null,
  }))
}

export async function crearPaletaBibliotecaMinisterial(ministerioId: string, formData: FormData): Promise<void> {
  const acceso = await obtenerAccesoPaleta(ministerioId)
  if (!acceso?.puedePaleta) fail('No tienes permiso para crear paletas en este ministerio.')

  const nombre = String(formData.get('nombre') || '').trim()
  if (nombre.length < 2 || nombre.length > 80) fail('Escribe un nombre válido para la paleta.')

  const colores = leerColores(formData)
  if (colores.length < 2) fail('Selecciona al menos dos colores válidos.')

  const observaciones = String(formData.get('observaciones') || '').trim() || null
  const referenciaUrl = String(formData.get('referencia_url') || '').trim() || null
  const admin = createAdminClient() as any

  const { error } = await admin.from('ministerio_paletas').insert({
    ministerio_id: ministerioId,
    nombre,
    colores,
    observaciones,
    referencia_url: referenciaUrl,
    creado_por: acceso.userId,
    activo: true,
    updated_at: new Date().toISOString(),
  })

  if (error?.code === '23505') fail('Ya existe una paleta activa con ese nombre.')
  if (error) fail(error.message)

  revalidatePath(`/ministerios/${ministerioId}/programacion`)
}
