export const MINISTERIO_CATALOGO_VIDA = '335daa03-4b5a-4ff5-8958-851de6b641ed'

export type CancionCatalogoVida = {
  id: string
  indice_origen: number
  titulo: string
  artista: string | null
  tonalidad_base: string | null
  acordes: string | null
  letra: null
  notas_permanentes: string
  spotify_url: string | null
  youtube_url: string | null
  estado: string
  campos_pendientes: string[]
  observaciones_revision: string[]
  fuentes_verificacion: string[]
  fuente_usuario: string | null
}

export type RevisionCatalogoVida = CancionCatalogoVida & { yaExiste: boolean }

// Un cambio de mayúsculas, acento o puntuación no crea otra ficha.
export function claveCancionVida(titulo: string) {
  return titulo.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function seleccionarLoteVida(catalogo: CancionCatalogoVida[], ids: unknown) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 20 || ids.some((id) => typeof id !== 'string')) return null
  const unicos = [...new Set(ids as string[])]
  const lote = unicos.map((id) => catalogo.find((song) => song.id === id))
  if (lote.some((song) => !song || song.estado !== 'identificada')) return null
  return lote as CancionCatalogoVida[]
}
