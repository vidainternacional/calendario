'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 25 * 1024 * 1024
const categorias = ['predica', 'estudio', 'liderazgo', 'consejeria', 'multimedia', 'administrativo', 'otro']

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
    return { supabase, user, error: 'No tienes permiso para administrar la biblioteca.' }
  }

  return { supabase, user, error: null }
}

function texto(formData: FormData, campo: string, maximo: number) {
  return String(formData.get(campo) ?? '').trim().slice(0, maximo)
}

function categoriaValida(valor: string) {
  return categorias.includes(valor) ? valor : 'otro'
}

function etiquetasDesdeTexto(valor: string) {
  return Array.from(new Set(valor.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean))).slice(0, 12)
}

function urlValida(valor: string) {
  try {
    const url = new URL(valor)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export async function crearEnlaceBibliotecaPastoral(formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const titulo = texto(formData, 'titulo', 140)
  const url = urlValida(texto(formData, 'url', 1500))
  if (!titulo) return { success: false, error: 'Escribe un título para el recurso.' }
  if (!url) return { success: false, error: 'Escribe un enlace válido que comience con http o https.' }

  const { error: insertError } = await (supabase as any).from('pastoral_biblioteca').insert({
    profile_id: user.id,
    titulo,
    descripcion: texto(formData, 'descripcion', 1200),
    categoria: categoriaValida(texto(formData, 'categoria', 40)),
    etiquetas: etiquetasDesdeTexto(texto(formData, 'etiquetas', 500)),
    tipo: 'enlace',
    url,
  })

  if (insertError) return { success: false, error: 'No se pudo guardar el enlace.' }
  revalidatePath('/pastoral')
  revalidatePath('/pastoral/biblioteca')
  return { success: true }
}

export async function subirArchivoBibliotecaPastoral(formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const titulo = texto(formData, 'titulo', 140)
  const archivo = formData.get('archivo')
  if (!titulo) return { success: false, error: 'Escribe un título para el recurso.' }
  if (!(archivo instanceof File) || archivo.size === 0) return { success: false, error: 'Selecciona un archivo.' }
  if (archivo.size > MAX_FILE_SIZE) return { success: false, error: 'El archivo supera el límite de 25 MB.' }

  const extension = archivo.name.includes('.') ? archivo.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const nombreSeguro = `${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
  const storagePath = `${user.id}/${nombreSeguro}`

  const { error: uploadError } = await supabase.storage
    .from('pastoral-library')
    .upload(storagePath, archivo, { contentType: archivo.type || 'application/octet-stream', upsert: false })

  if (uploadError) return { success: false, error: 'No se pudo subir el archivo. Revisa el formato y el tamaño.' }

  const { error: insertError } = await (supabase as any).from('pastoral_biblioteca').insert({
    profile_id: user.id,
    titulo,
    descripcion: texto(formData, 'descripcion', 1200),
    categoria: categoriaValida(texto(formData, 'categoria', 40)),
    etiquetas: etiquetasDesdeTexto(texto(formData, 'etiquetas', 500)),
    tipo: 'archivo',
    storage_path: storagePath,
    nombre_archivo: archivo.name.slice(0, 255),
    mime_type: archivo.type || null,
    tamano_bytes: archivo.size,
  })

  if (insertError) {
    await supabase.storage.from('pastoral-library').remove([storagePath])
    return { success: false, error: 'El archivo se subió, pero no pudo registrarse.' }
  }

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/biblioteca')
  return { success: true }
}

export async function editarRecursoBibliotecaPastoral(id: string, formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const titulo = texto(formData, 'titulo', 140)
  if (!titulo) return { success: false, error: 'El título es obligatorio.' }

  const { data: recurso } = await (supabase as any)
    .from('pastoral_biblioteca')
    .select('tipo')
    .eq('id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!recurso) return { success: false, error: 'No se encontró el recurso.' }

  const actualizacion: Record<string, unknown> = {
    titulo,
    descripcion: texto(formData, 'descripcion', 1200),
    categoria: categoriaValida(texto(formData, 'categoria', 40)),
    etiquetas: etiquetasDesdeTexto(texto(formData, 'etiquetas', 500)),
    updated_at: new Date().toISOString(),
  }

  if (recurso.tipo === 'enlace') {
    const url = urlValida(texto(formData, 'url', 1500))
    if (!url) return { success: false, error: 'Escribe un enlace válido.' }
    actualizacion.url = url
  }

  const { error: updateError } = await (supabase as any)
    .from('pastoral_biblioteca')
    .update(actualizacion)
    .eq('id', id)
    .eq('profile_id', user.id)

  if (updateError) return { success: false, error: 'No se pudo actualizar el recurso.' }
  revalidatePath('/pastoral/biblioteca')
  return { success: true }
}

export async function eliminarRecursoBibliotecaPastoral(id: string) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }

  const { data: recurso } = await (supabase as any)
    .from('pastoral_biblioteca')
    .select('storage_path')
    .eq('id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!recurso) return { success: false, error: 'No se encontró el recurso.' }

  const { error: deleteError } = await (supabase as any)
    .from('pastoral_biblioteca')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id)

  if (deleteError) return { success: false, error: 'No se pudo eliminar el recurso.' }
  if (recurso.storage_path) await supabase.storage.from('pastoral-library').remove([recurso.storage_path])

  revalidatePath('/pastoral')
  revalidatePath('/pastoral/biblioteca')
  return { success: true }
}