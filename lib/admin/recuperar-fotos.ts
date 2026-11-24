import 'server-only'
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

const OLD = 'https://atjtjpchslxbseayzflz.supabase.co'
const NEW = 'https://lnkrojvyiwnlcoponxud.supabase.co'
// Huellas de las seis fotos cuya recuperación y retirada autorizó el propietario.
const ALLOWED = new Set([
  '20b7d44fd4a173588b43580f4d6d8c93208d0d236869a51faac4ca481e8fffe8',
  '36729efeecd1c0198a21ed3cad85555c36a48e7cfc637c6c54e6249782fe953c',
  '0691fc62dc53d063175945a54c273a54e2d9c25bd195e0d6448c8d20f3dc1ae2',
  'bd7ff792a510ed050417a37a542ff7cd770566370ded98acbc2112f37a0a02de',
  '6f53e0257984725f0b8852dc79257c1d8433435ed3bf283d59025e1f6e78ba07',
  '168265390684cb3fdaa9af0d633040385b5d6f264f362904801b9f64b398504b',
])

export const photoHash = (data: Uint8Array) => createHash('sha256').update(data).digest('hex')
export const approvedPhoto = (data: Uint8Array) => ALLOWED.has(photoHash(data))

export function replacePhotoUrl(value: string | null, path: string, replacement: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.origin !== OLD || decodeURIComponent(url.pathname) !== `/storage/v1/object/public/avatars/${path}`) return null
    return `${NEW}/storage/v1/object/public/avatars/${replacement.split('/').map(encodeURIComponent).join('/')}${url.search}${url.hash}`
  } catch { return null }
}

async function download(client: SupabaseClient, path: string) {
  const { data, error } = await client.storage.from('avatars').download(path)
  if (error || !data || data.size > 2 * 1024 * 1024) throw new Error('No se pudo leer una foto. Se conservan los originales pendientes.')
  return { bytes: new Uint8Array(await data.arrayBuffer()), type: data.type }
}

export async function recoverPhotos(source: SupabaseClient, target: SupabaseClient) {
  const photos: string[] = []
  const list = async (prefix = '', depth = 0): Promise<void> => {
    const { data, error } = await source.storage.from('avatars').list(prefix, { limit: 100 })
    if (error || !data || data.length >= 100) throw new Error('No se pudo inventariar el origen completo. No se retiraron originales.')
    for (const object of data) {
      const path = prefix ? `${prefix}/${object.name}` : object.name
      if (!object.id) {
        if (depth >= 2) throw new Error('Estructura de fotos inesperada.')
        await list(path, depth + 1)
      } else photos.push(path)
    }
  }
  await list()
  const verified: { path: string; destination: string; hash: string }[] = []
  let updated = 0
  for (const path of photos) {
    if (!/^[a-f0-9-]{36}\/[a-zA-Z0-9_.-]+$/.test(path)) throw new Error('Ruta de foto inesperada.')
    const original = await download(source, path)
    if (!approvedPhoto(original.bytes)) continue
    const hash = photoHash(original.bytes)
    // Ruta de recuperación única: no sobrescribe nunca el avatar vigente.
    const destination = `${path.split('/')[0]}/recuperada-${hash}.webp`
    const { error: uploadError } = await target.storage.from('avatars').upload(destination, original.bytes, { contentType: original.type || 'image/webp', upsert: false })
    if (uploadError && !['409', 'Duplicate'].includes(String(uploadError.statusCode ?? uploadError.name))) throw new Error('No se pudo guardar una foto. No se retiraron originales.')
    const saved = await download(target, destination)
    if (photoHash(saved.bytes) !== hash) throw new Error('La copia no coincide. No se retiraron originales.')
    const owner = path.split('/')[0]
    const { data: profile, error: profileError } = await target.from('profiles').select('avatar_url').eq('id', owner).maybeSingle()
    if (profileError) throw new Error('No se pudo comprobar la referencia del perfil.')
    const current = profile?.avatar_url as string | null
    const replacement = replacePhotoUrl(current, path, destination)
    if (replacement) {
      const { data, error } = await target.from('profiles').update({ avatar_url: replacement }).eq('id', owner).eq('avatar_url', current).select('id')
      if (error || data?.length !== 1) throw new Error('El perfil cambió durante la recuperación. Se conservan los originales.')
      updated++
    }
    verified.push({ path, destination, hash })
  }
  // Una consulta de referencias completa antes de retirar archivos; no exporta perfiles.
  const { data: profiles, error } = await target.from('profiles').select('avatar_url').not('avatar_url', 'is', null).limit(1000)
  if (error || !profiles || profiles.length >= 1000) throw new Error('No se pudo comprobar todas las referencias. Se conservan los originales.')
  let removed = 0
  for (const photo of verified) {
    if (profiles.some(p => replacePhotoUrl(p.avatar_url, photo.path, photo.destination))) throw new Error('Todavía hay un perfil usando el original. No se retiró esa foto.')
    const [original, saved] = await Promise.all([download(source, photo.path), download(target, photo.destination)])
    if (photoHash(original.bytes) !== photo.hash || photoHash(saved.bytes) !== photo.hash) throw new Error('La foto cambió durante la comprobación; se conserva el original.')
    const { error: removeError } = await source.storage.from('avatars').remove([photo.path])
    if (removeError) throw new Error('Copias verificadas; no se pudo retirar un original. Puede reintentarse.')
    removed++
  }
  return { copied: verified.length, updated, removed }
}
