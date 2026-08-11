import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import PublicacionDetalle from '@/components/avisos/PublicacionDetalle'

export const metadata: Metadata = {
  title: 'Aviso',
}

export default async function AvisoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await (supabase as any)
    .from('publicaciones')
    .select(`
      id,
      titulo,
      cuerpo,
      tipo,
      created_at,
      ministerio_id,
      remitente_tipo,
      profiles!autor_id (nombre_completo, avatar_url),
      ministerios (nombre)
    `)
    .eq('id', id)
    .eq('estado', 'aprobado')
    .maybeSingle()

  if (!data) notFound()

  const remitenteTipo = String(data.remitente_tipo || 'autor')
  const autor = remitenteTipo === 'vida'
    ? 'VIDA Internacional'
    : remitenteTipo === 'ministerio'
      ? data.ministerios?.nombre || 'Ministerio'
      : data.profiles?.nombre_completo || 'Usuario'
  const autorAvatarUrl = remitenteTipo === 'autor' ? data.profiles?.avatar_url || null : null

  return (
    <PublicacionDetalle
      id={String(data.id)}
      titulo={data.titulo}
      cuerpo={data.cuerpo}
      tipo={data.tipo || 'aviso'}
      fecha={formatDistanceToNow(new Date(data.created_at), { addSuffix: true, locale: es })}
      autor={autor}
      autorAvatarUrl={autorAvatarUrl}
      ministerioId={data.ministerio_id || null}
      ministerioNombre={data.ministerios?.nombre || null}
    />
  )
}
