import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { PlusCircle, Megaphone } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Avisos del Ministerio',
}

export default async function AvisosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: membresia } = await supabase
    .from('ministerio_miembros')
    .select('es_lider')
    .eq('ministerio_id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  let esPastor = false
  if (!(membresia as any)?.es_lider) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    esPastor = (profile as any)?.rol === 'pastor' || (profile as any)?.rol === 'administrador'
  }

  const puedePublicar = (membresia as any)?.es_lider || esPastor

  const { data: avisos } = await supabase
    .from('publicaciones')
    .select(`
      id,
      titulo,
      cuerpo,
      created_at,
      profiles (
        nombre_completo
      )
    `)
    .eq('ministerio_id', id)
    .eq('estado', 'aprobado')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5 px-4 pb-28 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[#171923]">Avisos y noticias</h2>
        {puedePublicar && (
          <Link
            href={`/ministerios/${id}/avisos/nuevo`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo aviso
          </Link>
        )}
      </div>

      {!avisos || avisos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm leading-relaxed text-slate-500">No hay avisos recientes en este ministerio.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisos.map((aviso: any) => (
            <article
              key={aviso.id}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
            >
              <h3 className="break-words text-base font-semibold text-[#171923] sm:text-lg">{aviso.titulo}</h3>
              <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {aviso.cuerpo}
              </p>
              <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span className="break-words font-medium">
                  {aviso.profiles?.nombre_completo || 'Usuario'}
                </span>
                <span>
                  {formatDistanceToNow(new Date(aviso.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
