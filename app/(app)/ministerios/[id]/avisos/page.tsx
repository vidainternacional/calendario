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

  // Verificar si es líder
  const { data: membresia } = await supabase
    .from('ministerio_miembros')
    .select('es_lider')
    .eq('ministerio_id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  // O si es pastor (para darle permisos globales)
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

  // Obtener avisos (publicaciones)
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
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Avisos y Noticias</h2>
        {puedePublicar && (
          <Link
            href={`/ministerios/${id}/avisos/nuevo`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nuevo aviso
          </Link>
        )}
      </div>

      {!avisos || avisos.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-slate-700 rounded-2xl">
          <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No hay avisos recientes en este ministerio.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avisos.map((aviso: any) => (
            <article 
              key={aviso.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{aviso.titulo}</h3>
              <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed mb-4">
                {aviso.cuerpo}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
                <span className="font-medium text-slate-400">
                  {aviso.profiles?.nombre_completo || 'Usuario'}
                </span>
                <span>
                  {formatDistanceToNow(new Date(aviso.created_at), { 
                    addSuffix: true,
                    locale: es 
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
