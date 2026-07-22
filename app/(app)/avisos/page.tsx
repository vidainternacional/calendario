import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Info } from 'lucide-react'
import Link from 'next/link'
import NuevoAvisoModal from '@/components/avisos/NuevoAvisoModal'
import PublicacionCard from '@/components/avisos/PublicacionCard'

export const metadata: Metadata = {
  title: 'Avisos',
  description: 'Publicaciones e información importante de tu comunidad',
}

const tipoLabel: Record<string, string> = {
  aviso: 'Aviso',
  evento: 'Evento',
  comunicado: 'Comunicado',
  urgente: 'Urgente',
}

const tipoColor: Record<string, string> = {
  aviso: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  evento: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  comunicado: 'bg-sky-50 text-sky-600 border-sky-100',
  urgente: 'bg-rose-50 text-rose-600 border-rose-100',
}

export default async function AvisosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, nombre_completo')
    .eq('id', user.id)
    .single()

  const rol = (profile as any)?.rol as string | undefined
  const esPastorAdmin = rol === 'pastor' || rol === 'administrador'

  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id, es_lider, ministerios (id, nombre)')
    .eq('profile_id', user.id)

  const ministerioIds = (membresias || []).map((m: any) => m.ministerio_id)

  let ministeriosLider = []
  if (esPastorAdmin) {
    const { data: allMin } = await supabase.from('ministerios').select('id, nombre').eq('activo', true)
    ministeriosLider = (allMin || []).map((m: any) => ({ id: m.id, nombre: m.nombre }))
  } else {
    ministeriosLider = (membresias || [])
      .filter((m: any) => m.es_lider)
      .map((m: any) => ({ id: m.ministerios?.id ?? m.ministerio_id, nombre: m.ministerios?.nombre ?? 'Ministerio' }))
  }

  const puedeCrear = esPastorAdmin || ministeriosLider.length > 0

  let query = supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('publicaciones' as any)
    .select(`
      id,
      titulo,
      cuerpo,
      tipo,
      ministerio_id,
      created_at,
      profiles!autor_id (nombre_completo),
      ministerios (nombre)
    `)
    .eq('estado', 'aprobado')
    .order('created_at', { ascending: false })

  if (!esPastorAdmin && ministerioIds.length > 0) {
    query = query.or(`ministerio_id.is.null,ministerio_id.in.(${ministerioIds.join(',')})`)
  } else if (!esPastorAdmin && ministerioIds.length === 0) {
    query = query.is('ministerio_id', null)
  }

  const { data: publicaciones, error: pubError } = await query

  if (pubError) {
    console.error('[AvisosPage] Error al cargar publicaciones:', pubError)
  }

  const items = (publicaciones || []) as any[]

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 py-8 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 landscape:py-4">
      <header className="mb-7 flex items-start justify-between gap-4 landscape:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171923]">Avisos</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {items.length === 0
              ? 'Sin publicaciones por ahora'
              : `${items.length} publicación${items.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {puedeCrear && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {esPastorAdmin && (
              <Link
                href="/avisos/pendientes-aprobacion"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-100"
              >
                Revisar
              </Link>
            )}
            <NuevoAvisoModal ministeriosLider={ministeriosLider} esPastorAdmin={esPastorAdmin} />
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center landscape:py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <Info className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="max-w-[220px] text-sm text-gray-500">No hay publicaciones recientes para tu comunidad.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 landscape:grid-cols-2">
          {items.map((pub) => {
            const autor = (pub.profiles as any)?.nombre_completo ?? 'Autor desconocido'
            const minNombre = (pub.ministerios as any)?.nombre
            const fecha = new Date(pub.created_at)

            return (
              <PublicacionCard
                key={pub.id}
                titulo={pub.titulo}
                cuerpo={pub.cuerpo}
                tipo={pub.tipo}
                etiqueta={tipoLabel[pub.tipo] ?? pub.tipo}
                colorClass={tipoColor[pub.tipo] ?? tipoColor.aviso}
                fecha={formatDistanceToNow(fecha, { addSuffix: true, locale: es })}
                autor={autor}
                ministerio={minNombre}
              />
            )
          })}
        </div>
      )}
    </main>
  )
}
