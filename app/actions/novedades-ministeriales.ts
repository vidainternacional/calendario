'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VideoMinisterial } from '@/lib/estudios/novedades-ministeriales'

/** Siempre usa el JWT del lector: solo devuelve publicaciones que su RLS permite. */
export async function listarNovedadesMinisteriales(): Promise<{ usuarioId: string | null; videos: VideoMinisterial[]; error?: string }> {
  const client = await createClient()
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) return { usuarioId: null, videos: [] }
  const db = client as unknown as SupabaseClient
  const videos: VideoMinisterial[] = []
  for (let desde = 0; desde < 10000; desde += 1000) {
    const { data, error } = await db.from('vida_devocionales').select('id,titulo,published_at')
      .eq('publicado', true).neq('autor_id', user.id)
      .order('published_at', { ascending: false }).order('id').range(desde, desde + 999)
    if (error || !data) return { usuarioId: user.id, videos: [], error: 'No se pudieron comprobar los videos nuevos.' }
    for (const row of data) if (row.published_at) videos.push({ id: String(row.id), titulo: String(row.titulo), publicadoEn: new Date(String(row.published_at)).toISOString() })
    if (data.length < 1000) return { usuarioId: user.id, videos }
  }
  return { usuarioId: user.id, videos: [], error: 'La lista de videos requiere una revisión antes de mostrar sus pendientes.' }
}
