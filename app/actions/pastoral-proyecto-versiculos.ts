'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type VersiculoProyecto = {
  id: string
  referencia: string
  texto: string
  traduccion: string
  nota: string
}

function uuidValido(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor)
}

async function contextoPastoral() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Tu sesión expiró.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, estado_cuenta')
    .eq('id', user.id)
    .single()

  const rol = (profile as { rol?: string } | null)?.rol
  const estado = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estado !== 'activo') {
    return { supabase, user, error: 'No tienes permiso para administrar este proyecto pastoral.' }
  }

  return { supabase, user, error: null }
}

function datosVersiculo(formData: FormData) {
  const libroNombre = String(formData.get('libro_nombre') ?? '').trim()
  const capitulo = Number(formData.get('capitulo'))
  const verso = Number(formData.get('verso'))
  const texto = String(formData.get('texto') ?? '').trim()
  const traduccion = String(formData.get('traduccion') ?? 'Referencia personal').trim()

  if (!libroNombre || !Number.isInteger(capitulo) || capitulo < 1 || !Number.isInteger(verso) || verso < 1 || !texto) {
    return { error: 'No se pudo identificar correctamente el versículo.' as const }
  }
  if (texto.length > 2000) return { error: 'El texto del versículo es demasiado largo.' as const }

  return {
    error: null,
    libroNombre,
    capitulo,
    verso,
    texto,
    traduccion: traduccion || 'Referencia personal',
  }
}

async function obtenerPaquete(supabase: any, profileId: string, paqueteId: string) {
  if (!uuidValido(paqueteId)) return null
  const { data } = await supabase
    .from('pastoral_paquetes')
    .select('id, titulo, coleccion_id')
    .eq('id', paqueteId)
    .eq('profile_id', profileId)
    .maybeSingle()
  return data ?? null
}

export async function obtenerVersiculosDelProyecto(paqueteId: string) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.', versiculos: [] as VersiculoProyecto[] }

  const paquete = await obtenerPaquete(supabase as any, user.id, paqueteId)
  if (!paquete) return { success: false, error: 'No se encontró el proyecto pastoral.', versiculos: [] as VersiculoProyecto[] }
  if (!paquete.coleccion_id) return { success: true, versiculos: [] as VersiculoProyecto[] }

  const { data, error: queryError } = await (supabase as any)
    .from('pastoral_versiculos')
    .select('id, referencia, texto, traduccion, nota')
    .eq('coleccion_id', paquete.coleccion_id)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: true })

  if (queryError) return { success: false, error: 'No se pudieron cargar los versículos.', versiculos: [] as VersiculoProyecto[] }
  return { success: true, versiculos: (data ?? []) as VersiculoProyecto[] }
}

export async function agregarVersiculoAlProyecto(paqueteId: string, formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const datos = datosVersiculo(formData)
  if (datos.error) return { success: false, error: datos.error }

  const paquete = await obtenerPaquete(supabase as any, user.id, paqueteId)
  if (!paquete) return { success: false, error: 'No se encontró el proyecto pastoral.' }

  let coleccionId = paquete.coleccion_id as string | null
  if (!coleccionId) {
    const nombreBase = String(paquete.titulo || 'Proyecto pastoral').trim().slice(0, 58)
    const { data: nuevaColeccion, error: collectionError } = await (supabase as any)
      .from('pastoral_colecciones')
      .insert({
        profile_id: user.id,
        nombre: `${nombreBase} · Versículos`.slice(0, 80),
        descripcion: 'Versículos agregados desde el espacio de trabajo pastoral.',
        color: 'violet',
      })
      .select('id')
      .single()

    if (collectionError || !nuevaColeccion) return { success: false, error: 'No se pudo preparar el espacio de versículos.' }
    coleccionId = nuevaColeccion.id as string

    const { error: linkError } = await (supabase as any)
      .from('pastoral_paquetes')
      .update({ coleccion_id: coleccionId, updated_at: new Date().toISOString() })
      .eq('id', paqueteId)
      .eq('profile_id', user.id)

    if (linkError) return { success: false, error: 'No se pudo conectar el versículo con el proyecto.' }
  }

  const { error: insertError } = await (supabase as any)
    .from('pastoral_versiculos')
    .insert({
      coleccion_id: coleccionId,
      profile_id: user.id,
      traduccion: datos.traduccion,
      libro_id: datos.libroNombre.toLowerCase().replace(/\s+/g, '-'),
      libro_nombre: datos.libroNombre,
      capitulo: datos.capitulo,
      verso: datos.verso,
      texto: datos.texto,
      nota: '',
    })

  if (insertError) {
    if (insertError.code === '23505') return { success: false, error: 'Ese versículo ya está agregado al proyecto.' }
    return { success: false, error: 'No se pudo agregar el versículo al proyecto.' }
  }

  await (supabase as any)
    .from('pastoral_colecciones')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', coleccionId)
    .eq('profile_id', user.id)

  revalidatePath(`/pastoral/paquetes/${paqueteId}`)
  return { success: true }
}

export async function eliminarVersiculoDelProyecto(paqueteId: string, versiculoId: string) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }
  if (!uuidValido(versiculoId)) return { success: false, error: 'No se pudo identificar el versículo.' }

  const paquete = await obtenerPaquete(supabase as any, user.id, paqueteId)
  const coleccionId = paquete?.coleccion_id as string | null
  if (!coleccionId) return { success: false, error: 'Este proyecto todavía no tiene versículos.' }

  const { error: deleteError } = await (supabase as any)
    .from('pastoral_versiculos')
    .delete()
    .eq('id', versiculoId)
    .eq('coleccion_id', coleccionId)
    .eq('profile_id', user.id)

  if (deleteError) return { success: false, error: 'No se pudo quitar el versículo del proyecto.' }

  revalidatePath(`/pastoral/paquetes/${paqueteId}`)
  return { success: true }
}
