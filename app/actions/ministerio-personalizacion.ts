'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const FUENTES_TITULO = new Set(['moderna', 'elegante', 'fuerte'])
const FUENTES_CUERPO = new Set(['clasica', 'amable', 'compacta'])

function urlImagenValida(value: string) {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.pathname.includes('/storage/v1/object/public/ministerios/')
  } catch {
    return false
  }
}

export async function personalizarMinisterio(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const ministerioId = String(formData.get('ministerio_id') || '')
  const nombre = String(formData.get('nombre') || '').trim()
  const descripcion = String(formData.get('descripcion') || '').trim()
  const emoji = String(formData.get('emoji') || '⛪').trim().slice(0, 12)
  const colorPrimario = String(formData.get('color_primario') || '')
  const colorSecundario = String(formData.get('color_secundario') || '')
  const portadaUrl = String(formData.get('portada_url') || '').trim()
  const avatarUrl = String(formData.get('avatar_url') || '').trim()
  const fuenteTitulo = String(formData.get('fuente_titulo') || 'moderna')
  const fuenteCuerpo = String(formData.get('fuente_cuerpo') || 'clasica')

  if (!ministerioId) return { success: false, error: 'Ministerio inválido.' }
  if (nombre.length < 2 || nombre.length > 80) {
    return { success: false, error: 'El nombre debe tener entre 2 y 80 caracteres.' }
  }
  if (descripcion.length > 500) {
    return { success: false, error: 'La descripción no puede superar 500 caracteres.' }
  }
  if (!HEX_COLOR.test(colorPrimario) || !HEX_COLOR.test(colorSecundario)) {
    return { success: false, error: 'Selecciona colores válidos.' }
  }
  if (!FUENTES_TITULO.has(fuenteTitulo) || !FUENTES_CUERPO.has(fuenteCuerpo)) {
    return { success: false, error: 'Selecciona tipografías válidas.' }
  }
  if (!urlImagenValida(portadaUrl) || !urlImagenValida(avatarUrl)) {
    return { success: false, error: 'Las imágenes seleccionadas no son válidas.' }
  }

  const [{ data: profile }, { data: membresia }] = await Promise.all([
    supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single(),
    supabase
      .from('ministerio_miembros')
      .select('es_lider')
      .eq('ministerio_id', ministerioId)
      .eq('profile_id', user.id)
      .maybeSingle(),
  ])

  const perfil = profile as any
  const puedeEditar =
    Boolean((membresia as any)?.es_lider) ||
    perfil?.rol === 'administrador' ||
    perfil?.rol === 'pastor' ||
    perfil?.es_pastor_general === true

  if (!puedeEditar) {
    return { success: false, error: 'Solo el líder de este ministerio puede personalizarlo.' }
  }

  const { error } = await (supabase as any)
    .from('ministerios')
    .update({
      nombre,
      descripcion: descripcion || null,
      emoji: emoji || '⛪',
      color_primario: colorPrimario,
      color_secundario: colorSecundario,
      portada_url: portadaUrl || null,
      avatar_url: avatarUrl || null,
      fuente_titulo: fuenteTitulo,
      fuente_cuerpo: fuenteCuerpo,
    })
    .eq('id', ministerioId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath('/ministerios')
  revalidatePath('/inicio')

  return { success: true }
}
