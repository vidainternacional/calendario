import { readFile, writeFile } from 'node:fs/promises'

const actionPath = 'app/actions/biblia.ts'
const clientPath = 'components/biblia/BibliaClient.tsx'

const actionContent = `'use server'

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

  const { data: existente } = await db
    .from('versiculos_favoritos')
    .select('id')
    .eq('profile_id', user.id)
    .eq('traduccion', datos.traduccion)
    .eq('libro_id', datos.libro_id)
    .eq('capitulo', datos.capitulo)
    .eq('verso', datos.verso)
    .maybeSingle()

  if (existente) {
    await db.from('versiculos_favoritos').delete().eq('id', existente.id)
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
  const { data } = await (supabase as any)
    .from('versiculos_favoritos')
    .select('verso')
    .eq('profile_id', user.id)
    .eq('traduccion', traduccion)
    .eq('libro_id', libro_id)
    .eq('capitulo', capitulo)
  return (data ?? []).map((f: { verso: number }) => f.verso) as number[]
}

/** Lista completa de favoritos del usuario (más recientes primero). */
export async function listarFavoritos(): Promise<Favorito[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('versiculos_favoritos')
    .select('id, traduccion, libro_id, libro_nombre, capitulo, verso, texto, created_at')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)
  return (data ?? []) as Favorito[]
}
`

await writeFile(actionPath, actionContent, 'utf8')

let client = await readFile(clientPath, 'utf8')
const currentBlock = `    try {
      const resultado = await listarFavoritos()
      setListaFavs(resultado.favoritos)
      if (resultado.error) setErrorFavs(resultado.error)
    } catch {
      setListaFavs([])
      setErrorFavs('No se pudieron cargar los favoritos')
    } finally {
`
const compatibleBlock = `    try {
      const resultado = await listarFavoritos()
      const normalizado = resultado as unknown as Favorito[] | { favoritos?: Favorito[]; error?: string }
      const lista = Array.isArray(normalizado) ? normalizado : (normalizado.favoritos ?? [])
      setListaFavs(lista)
      if (!Array.isArray(normalizado) && normalizado.error) setErrorFavs(normalizado.error)
    } catch {
      setListaFavs([])
      setErrorFavs('No se pudieron cargar los favoritos')
    } finally {
`

if (client.includes(currentBlock)) {
  client = client.replace(currentBlock, compatibleBlock)
} else if (!client.includes('const normalizado = resultado as unknown as Favorito[]')) {
  throw new Error('No se encontró el bloque de favoritos esperado')
}

await writeFile(clientPath, client, 'utf8')
console.log('Compatibilidad de favoritos aplicada')
