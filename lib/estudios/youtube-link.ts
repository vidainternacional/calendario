import type { AudienciaSedes } from '@/lib/sedes/audiencias'

/** Acepta videos de YouTube; no resuelve páginas ni descarga archivos externos. */
export function youtubeVideo(value: string): { id: string; url: string; embed: string } | null {
  try {
    const parsed = new URL(value.trim())
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return null
    const host = parsed.hostname.toLowerCase()
    let id: string | null = null
    if (host === 'youtu.be') id = parsed.pathname.slice(1)
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      if (parsed.pathname === '/watch') id = parsed.searchParams.get('v')
      else id = /^\/(?:shorts|live|embed)\/([^/]+)\/?$/.exec(parsed.pathname)?.[1] ?? null
    }
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return null
    return { id, url: `https://www.youtube.com/watch?v=${id}`, embed: `https://www.youtube-nocookie.com/embed/${id}` }
  } catch {
    return null
  }
}

export type MensajeSemanal = {
  vidaAudiencia?: AudienciaSedes | null
  id: string
  titulo: string
  descripcion: string
  videoUrl: string
  publicado: boolean
  fecha: string | null
  revision: string
}

/** Un mensaje es un material pastoral sencillo: título, texto y un único enlace. */
export function esMensajeSemanal(row: Record<string, unknown>): boolean {
  return row.audiencia === 'iglesia' && !row.bosquejo_id && !row.coleccion_id &&
    Array.isArray(row.recurso_ids) && row.recurso_ids.length === 0 &&
    typeof row.instrucciones === 'string' && youtubeVideo(row.instrucciones)?.url === row.instrucciones
}

export function mensajeDesdeFila(row: Record<string, unknown>): MensajeSemanal | null {
  if (!esMensajeSemanal(row) || typeof row.id !== 'string') return null
  return {
    vidaAudiencia: (row.vida_audiencia as AudienciaSedes | null) || null,
    id: row.id, titulo: String(row.titulo ?? ''), descripcion: String(row.descripcion_publica ?? ''),
    videoUrl: String(row.instrucciones), publicado: row.publicado === true,
    fecha: typeof row.published_at === 'string' ? row.published_at : null,
    revision: typeof row.updated_at === 'string' ? row.updated_at : '',
  }
}
