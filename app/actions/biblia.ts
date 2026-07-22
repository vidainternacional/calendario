'use server'

import { createClient } from '@/lib/supabase/server'

export type Favorito = {
  id: string
  traduccion: string
  libro_id: string
  libro_nombre: string
  capitulo: number
  verso: number
  texto: string
  created_at: string
}

export type ResultadoFavoritos = {
  favoritos: Favorito[]
  error?: string
}

/** Guarda o quita un versículo de favoritos. Devuelve el estado final. */
export async function toggleFavorito(datos: {
  traduccion: string; libro_id: string; libro_nombre: string
  capitulo: number; verso: number; texto: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existente, error: buscarError } = await db
    .from('versiculos_favoritos')
    .select('id')
    .eq('profile_id', user.id)
    .eq('traduccion', datos.traduccion)
    .eq('libro_id', datos.libro_id)
    .eq('capitulo', datos.capitulo)
    .eq('verso', datos.verso)
    .maybeSingle()

  if (buscarError) return { error: 'No se pudo consultar el favorito.' }

  if (existente) {
    const { error } = await db.from('versiculos_favoritos').delete().eq('id', existente.id)
    if (error) return { error: 'No se pudo eliminar el favorito.' }
    return { favorito: false }
  }

  const { error } = await db.from('versiculos_favoritos').insert({
    profile_id: user.id,
    ...datos,
    texto: datos.texto.slice(0, 1000),
  })
  if (error) return { error: 'No se pudo guardar.' }
  return { favorito: true }
}

/** Números de versículos favoritos del capítulo actual. */
export async function favoritosDelCapitulo(traduccion: string, libro_id: string, capitulo: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('versiculos_favoritos')
    .select('verso')
    .eq('profile_id', user.id)
    .eq('traduccion', traduccion)
    .eq('libro_id', libro_id)
    .eq('capitulo', capitulo)

  if (error) throw new Error('No se pudieron cargar los favoritos del capítulo.')
  return (data ?? []).map((f: { verso: number }) => f.verso) as number[]
}

/** Lista completa de favoritos del usuario (más recientes primero). */
export async function listarFavoritos(): Promise<ResultadoFavoritos> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { favoritos: [], error: 'Tu sesión expiró. Vuelve a iniciar sesión.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('versiculos_favoritos')
    .select('id, traduccion, libro_id, libro_nombre, capitulo, verso, texto, created_at')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[listarFavoritos] Error al cargar favoritos:', error)
    return { favoritos: [], error: 'No se pudieron cargar tus versículos favoritos.' }
  }

  return { favoritos: (data ?? []) as Favorito[] }
}
