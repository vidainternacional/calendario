import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { cargarMensajesSemanales, cargarMisMensajesSemanales } from './mensajes-semanales'
import {
  adaptarLegado, desdeVideoDirigido, CAMPOS_DIRIGIDOS,
  type MensajeBiblioteca, type MensajeConAudiencia, type MinisterioDestino, type TipoDevocional,
} from './mensajes-dirigidos-tipos'

const POR_PAGINA = 12

/**
 * La consulta de videos dirigidos usa el cliente con JWT del lector.
 * Supabase aplica RLS incluso si alguien intenta entrar con un ID directo.
 * Los materiales pastorales históricos mantienen su lectura autorizada existente.
 */
export async function cargarBibliotecaDirigida(pagina = 1, categoria: 'todos' | TipoDevocional = 'todos') {
  const incluyeLegado = categoria === 'todos' || categoria === 'mensaje'
  const viejo = await cargarMensajesSemanales(incluyeLegado ? pagina : 1)
  if (!viejo.autenticado || viejo.error) {
    return { ...viejo, mensajes: viejo.mensajes.map(m => ({ ...adaptarLegado(m), autor: m.autor })) }
  }

  const client = await createClient()
  const db = client as unknown as SupabaseClient
  const page = Math.min(100, Math.max(1, Math.floor(pagina) || 1))
  const tope = page * POR_PAGINA + 1
  let consulta = db.from('vida_devocionales').select(CAMPOS_DIRIGIDOS).eq('publicado', true)
  if (categoria !== 'todos') consulta = consulta.eq('tipo', categoria)
  const { data: nuevos, error } = categoria === 'serie'
    ? await consulta.order('serie_titulo', { ascending: true }).order('serie_episodio', { ascending: true }).limit(tope)
    : await consulta.order('published_at', { ascending: false }).order('id').limit(tope)
  if (error) return { ...viejo, mensajes: [] as MensajeBiblioteca[], haySiguiente: false,
    error: 'No se pudieron cargar los mensajes. Intenta nuevamente.' }

  const convertidos = ((nuevos ?? []) as Record<string, unknown>[])
    .map(desdeVideoDirigido).filter((m): m is MensajeConAudiencia => Boolean(m))
  const paginaNueva = convertidos.slice((page - 1) * POR_PAGINA, page * POR_PAGINA)
  const idsAutores = [...new Set(((nuevos ?? []) as Record<string, unknown>[])
    .map(v => String(v.autor_id || '')).filter(Boolean))]
  const nombres = new Map<string, string>()
  if (idsAutores.length) {
    const { data: perfiles, error: perfilesError } = await db.from('profiles')
      .select('id,nombre_completo').in('id', idsAutores)
    if (perfilesError) return { ...viejo, mensajes: [] as MensajeBiblioteca[], haySiguiente: false,
      error: 'No se pudieron cargar los autores de los mensajes.' }
    for (const perfil of perfiles ?? []) nombres.set(String(perfil.id), String(perfil.nombre_completo || 'Equipo pastoral'))
  }
  const autoresPorVideo = new Map((nuevos ?? []).map((v: Record<string, unknown>) =>
    [String(v.id), nombres.get(String(v.autor_id)) || 'Equipo pastoral'] as const))

  const adaptados: MensajeBiblioteca[] = incluyeLegado ? viejo.mensajes.map(m => ({ ...adaptarLegado(m), autor: m.autor })) : []
  for (const v of paginaNueva) adaptados.push({ ...v, autor: autoresPorVideo.get(v.id) || 'Equipo pastoral' })
  adaptados.sort((a,b) => categoria === 'serie'
    ? (a.serieTitulo || '').localeCompare(b.serieTitulo || '', 'es') || (a.serieEpisodio ?? 0) - (b.serieEpisodio ?? 0)
    : (b.fecha || '').localeCompare(a.fecha || '') || a.id.localeCompare(b.id))
  return { ...viejo, mensajes: adaptados.slice(0, POR_PAGINA),
    haySiguiente: (incluyeLegado && viejo.haySiguiente) || convertidos.length > page * POR_PAGINA }
}

export async function cargarMisMensajesDirigidos() {
  const viejo = await cargarMisMensajesSemanales()
  const vacio: MinisterioDestino[] = []
  if (!viejo.autenticado || !viejo.puedeGestionar || viejo.error) {
    return { ...viejo, propios: viejo.propios.map(adaptarLegado), ministerios: vacio }
  }
  const client = await createClient()
  const db = client as unknown as SupabaseClient
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { ...viejo, autenticado: false, puedeGestionar: false, propios: [] as MensajeConAudiencia[], ministerios: vacio }
  const [videos, grupos] = await Promise.all([
    db.from('vida_devocionales').select(CAMPOS_DIRIGIDOS).eq('autor_id', user.id)
      .order('created_at', { ascending: false }).limit(100),
    db.from('ministerios').select('id,nombre').eq('activo', true).order('nombre'),
  ])
  if (videos.error || grupos.error) return { ...viejo, propios: [] as MensajeConAudiencia[], ministerios: vacio,
    error: 'No fue posible cargar los mensajes o los ministerios. Intenta nuevamente.' }
  const propios: MensajeConAudiencia[] = [
    ...viejo.propios.map(adaptarLegado),
    ...(videos.data ?? []).map((row: Record<string, unknown>) => desdeVideoDirigido(row))
      .filter((m): m is MensajeConAudiencia => Boolean(m)),
  ].sort((a,b) => b.revision.localeCompare(a.revision))
  return { ...viejo, propios, ministerios: (grupos.data ?? []) as MinisterioDestino[] }
}
