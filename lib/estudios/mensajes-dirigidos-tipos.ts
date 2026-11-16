import { youtubeVideo, type MensajeSemanal } from './youtube-link'

export type RolDestino = 'pastor' | 'administrador' | 'lider' | 'servidor'
export type TipoDevocional = 'mensaje' | 'devocional' | 'serie' | 'estudio_biblico' | 'ensenanza' | 'reflexion' | 'testimonio' | 'conferencia' | 'capacitacion'
export const CATEGORIAS_DEVOCIONALES: Array<{ id: TipoDevocional; nombre: string }> = [
  { id: 'mensaje', nombre: 'Mensaje' },
  { id: 'devocional', nombre: 'Devocional' },
  { id: 'serie', nombre: 'Serie' },
  { id: 'estudio_biblico', nombre: 'Estudio bíblico' },
  { id: 'ensenanza', nombre: 'Enseñanza' },
  { id: 'reflexion', nombre: 'Reflexión' },
  { id: 'testimonio', nombre: 'Testimonio' },
  { id: 'conferencia', nombre: 'Conferencia' },
  { id: 'capacitacion', nombre: 'Capacitación' },
]
export const TIPO_DEVOCIONAL_IDS = new Set<TipoDevocional>(CATEGORIAS_DEVOCIONALES.map(c => c.id))
export function etiquetaTipo(tipo: TipoDevocional): string {
  return CATEGORIAS_DEVOCIONALES.find(c => c.id === tipo)?.nombre ?? 'Mensaje'
}
export type MinisterioDestino = { id: string; nombre: string }
export type MensajeConAudiencia = MensajeSemanal & {
  origen: 'dirigido' | 'legado'
  tipo: TipoDevocional
  serieTitulo: string | null
  serieEpisodio: number | null
  audienciaIglesia: boolean
  rolesDestino: RolDestino[]
  ministeriosDestino: string[]
  lideresMinisterio: boolean
}
export type MensajeBiblioteca = MensajeConAudiencia & { autor: string }

export const ROLES_DESTINO: Array<{ id: RolDestino; nombre: string }> = [
  { id: 'pastor', nombre: 'Pastores' },
  { id: 'administrador', nombre: 'Administradores' },
  { id: 'lider', nombre: 'Líderes (rol general)' },
  { id: 'servidor', nombre: 'Servidores (rol general)' },
]

export const ROL_DESTINO_IDS = new Set<RolDestino>(ROLES_DESTINO.map(r => r.id))

/** La tabla nueva es exclusiva de videos; jamás devuelve columnas privadas de otro módulo. */
export const CAMPOS_DIRIGIDOS = 'id,autor_id,titulo,descripcion,video_url,tipo,publicado,audiencia_iglesia,roles_destino,ministerios_destino,lideres_ministerio,serie_titulo,serie_episodio,published_at,updated_at'

export function adaptarLegado(m: MensajeSemanal): MensajeConAudiencia {
  return { ...m, origen: 'legado', tipo: 'mensaje', serieTitulo: null, serieEpisodio: null, audienciaIglesia: true,
    rolesDestino: [], ministeriosDestino: [], lideresMinisterio: false }
}

export function desdeVideoDirigido(row: Record<string, unknown>): MensajeConAudiencia | null {
  if (typeof row.id !== 'string' || typeof row.titulo !== 'string' || typeof row.video_url !== 'string') return null
  const video = youtubeVideo(row.video_url)
  if (!video || video.url !== row.video_url) return null
  return {
    id: row.id, titulo: row.titulo, descripcion: String(row.descripcion || ''),
    videoUrl: video.url, publicado: row.publicado === true,
    fecha: typeof row.published_at === 'string' ? row.published_at : null,
    revision: typeof row.updated_at === 'string' ? row.updated_at : '',
    origen: 'dirigido',
    tipo: TIPO_DEVOCIONAL_IDS.has(row.tipo as TipoDevocional) ? row.tipo as TipoDevocional : 'mensaje',
    serieTitulo: typeof row.serie_titulo === 'string' ? row.serie_titulo : null,
    serieEpisodio: typeof row.serie_episodio === 'number' ? row.serie_episodio : null,
    audienciaIglesia: row.audiencia_iglesia === true,
    rolesDestino: Array.isArray(row.roles_destino)
      ? row.roles_destino.filter((v): v is RolDestino => ROL_DESTINO_IDS.has(v as RolDestino)) : [],
    ministeriosDestino: Array.isArray(row.ministerios_destino) ? row.ministerios_destino.filter((v): v is string => typeof v === 'string') : [],
    lideresMinisterio: row.lideres_ministerio === true,
  }
}

export function resumenAudiencia(m: MensajeConAudiencia, ministerios: MinisterioDestino[] = []): string {
  if (!m.publicado) return 'Borrador · visible solo para ti'
  if (m.audienciaIglesia) return 'Publicado · toda la congregación'
  const nombres: string[] = []
  if (m.lideresMinisterio) nombres.push('líderes de ministerio')
  for (const r of ROLES_DESTINO) if (m.rolesDestino.includes(r.id)) nombres.push(r.nombre.toLowerCase())
  for (const id of m.ministeriosDestino) nombres.push(ministerios.find(x => x.id === id)?.nombre || 'ministerio')
  return 'Publicado · ' + (nombres.join(', ') || 'audiencia restringida')
}
