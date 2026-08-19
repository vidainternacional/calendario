'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClipboardCheck, Info, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { readUserCache, writeUserCache } from '@/lib/cache/userCache'
import NuevoAvisoModal from '@/components/avisos/NuevoAvisoModal'
import PublicacionCard from '@/components/avisos/PublicacionCard'
import { useUnreadPublicationIds } from '@/components/avisos/usePublicationReads'
import { SkeletonPage } from '@/components/ui/Skeleton'
import BackButton from '@/components/navigation/BackButton'

type AvisosData = {
  puedePublicarGlobal: boolean
  puedeRevisar: boolean
  ministeriosLider: Array<{ id: string; nombre: string }>
  publicaciones: any[]
}

type AvisosClientProps = {
  userId: string
  adminMode?: boolean
}

const CACHE_SCOPE = 'avisos:v5'
const CACHE_TTL = 10 * 60 * 1000

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

export default function AvisosClient({ userId, adminMode = false }: AvisosClientProps) {
  const [data, setData] = useState<AvisosData | null>(() => readUserCache<AvisosData>(userId, CACHE_SCOPE))
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      setIsRefreshing(true)
      const supabase = createClient()

      try {
        const [profileRes, membresiasRes] = await Promise.all([
          supabase.from('profiles').select('rol, es_pastor_general').eq('id', userId).single(),
          supabase.from('ministerio_miembros').select('ministerio_id, es_lider, ministerios (id, nombre)').eq('profile_id', userId),
        ])

        const rol = (profileRes.data as any)?.rol as string | undefined
        const esPastorGeneral = (profileRes.data as any)?.es_pastor_general === true
        const puedePublicarGlobal = rol === 'pastor' || rol === 'administrador' || esPastorGeneral
        const puedeRevisar = rol === 'administrador' || esPastorGeneral
        const membresias = membresiasRes.data || []
        const ministerioIds = membresias.map((m: any) => m.ministerio_id)

        let ministeriosLider: Array<{ id: string; nombre: string }> = []
        if (puedePublicarGlobal) {
          const { data: allMin } = await supabase.from('ministerios').select('id, nombre').eq('activo', true)
          ministeriosLider = (allMin || []).map((m: any) => ({ id: m.id, nombre: m.nombre }))
        } else {
          ministeriosLider = membresias
            .filter((m: any) => m.es_lider)
            .map((m: any) => ({ id: m.ministerios?.id ?? m.ministerio_id, nombre: m.ministerios?.nombre ?? 'Ministerio' }))
        }

        let query = supabase
          .from('publicaciones' as any)
          .select(`
            id,
            titulo,
            cuerpo,
            tipo,
            ministerio_id,
            remitente_tipo,
            remitente_nombre,
            created_at,
            profiles!autor_id (nombre_completo, avatar_url),
            ministerios (nombre)
          `)
          .eq('estado', 'aprobado')
          .order('created_at', { ascending: false })

        if (!puedePublicarGlobal && ministerioIds.length > 0) {
          query = query.or(`ministerio_id.is.null,ministerio_id.in.(${ministerioIds.join(',')})`)
        } else if (!puedePublicarGlobal && ministerioIds.length === 0) {
          query = query.is('ministerio_id', null)
        }

        const { data: publicaciones } = await query
        const fresh: AvisosData = {
          puedePublicarGlobal,
          puedeRevisar,
          ministeriosLider,
          publicaciones: (publicaciones || []) as any[],
        }

        if (!cancelled) {
          setData(fresh)
          writeUserCache(userId, CACHE_SCOPE, fresh, CACHE_TTL)
        }
      } finally {
        if (!cancelled) setIsRefreshing(false)
      }
    }

    const handleOnline = () => void refresh()

    void refresh()
    window.addEventListener('online', handleOnline)
    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
    }
  }, [userId])

  const currentItems = data?.publicaciones || []
  const unreadIds = useUnreadPublicationIds(currentItems.map((item: any) => String(item.id)))

  const shellClass = adminMode
    ? 'mx-auto min-h-screen max-w-3xl overflow-x-hidden bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:px-6 sm:pt-12'
    : 'mx-auto min-h-screen max-w-3xl overflow-x-hidden bg-[#f4f5f9] px-4 py-8 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 landscape:py-4'

  if (!data) {
    return (
      <main className={shellClass}>
        {adminMode && <div className="mb-7"><BackButton /></div>}
        <SkeletonPage cards={4} />
      </main>
    )
  }

  const { puedePublicarGlobal, puedeRevisar, ministeriosLider, publicaciones: items } = data
  const puedeCrear = puedePublicarGlobal || ministeriosLider.length > 0

  const abrirNuevoAviso = () => {
    const trigger = document.getElementById('btn-nuevo-aviso') as HTMLButtonElement | null
    trigger?.click()
  }

  return (
    <main className={shellClass}>
      {adminMode && <div className="mb-7"><BackButton /></div>}

      {adminMode && (
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500">Administración</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Gestión de avisos</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Publica, revisa y consulta los avisos desde el centro administrativo sin salir del flujo de gestión.</p>
        </div>
      )}

      <header className={`mb-7 flex min-w-0 flex-col gap-4 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between landscape:mb-4 ${adminMode ? 'rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]' : ''}`}>
        <div className="min-w-0">
          {!adminMode && <h1 className="break-words text-2xl font-bold text-[#171923]">Avisos</h1>}
          {adminMode && <h2 className="break-words text-base font-extrabold text-[#171923]">Publicaciones visibles</h2>}
          <p className="mt-0.5 break-words text-sm text-gray-500">
            {items.length === 0 ? 'Sin publicaciones por ahora' : `${items.length} publicación${items.length !== 1 ? 'es' : ''}`}
            {unreadIds.size > 0 && <span className="ml-2 font-semibold text-rose-500">· {unreadIds.size} sin leer</span>}
            {isRefreshing && <span className="ml-2 text-xs text-gray-400">Actualizando…</span>}
          </p>
        </div>

        {puedeCrear && (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 min-[430px]:w-auto min-[430px]:shrink-0 min-[430px]:justify-end">
            {puedeRevisar && (
              <Link href="/avisos/pendientes-aprobacion" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-100 min-[430px]:flex-none">Revisar</Link>
            )}
            <NuevoAvisoModal ministeriosLider={ministeriosLider} esPastorAdmin={puedePublicarGlobal} />
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <section className="overflow-hidden rounded-[26px] border border-white bg-white shadow-sm" aria-labelledby="avisos-vacio-titulo">
          <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-5 py-8 text-center sm:px-8 sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-white shadow-sm"><Info className="h-8 w-8 text-indigo-500" aria-hidden="true" /></div>
            <h2 id="avisos-vacio-titulo" className="mt-5 text-xl font-bold text-[#171923]">{puedeCrear ? 'Comparte la primera novedad' : 'Aún no hay avisos para ti'}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{puedeCrear ? 'Publica información importante, recordatorios o cambios para que todos reciban el mensaje con claridad.' : 'Cuando la iglesia o uno de tus ministerios publique una novedad, aparecerá aquí y podrás consultarla cuando la necesites.'}</p>
            {puedeCrear && (
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button type="button" onClick={abrirNuevoAviso} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-500 active:scale-[0.99]"><Megaphone className="h-4 w-4" aria-hidden="true" />Crear primer aviso</button>
                {puedeRevisar && <Link href="/avisos/pendientes-aprobacion" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"><ClipboardCheck className="h-4 w-4" aria-hidden="true" />Revisar pendientes</Link>}
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 landscape:grid-cols-2">
          {items.map((pub) => {
            const remitenteTipo = String(pub.remitente_tipo || 'autor')
            const nombreMinisterio = pub.ministerios?.nombre ?? 'Ministerio'
            const autor = remitenteTipo === 'vida'
              ? 'VIDA Internacional'
              : remitenteTipo === 'ministerio'
                ? nombreMinisterio
                : remitenteTipo === 'lider'
                  ? `Líder de ${nombreMinisterio}`
                  : remitenteTipo === 'personalizado'
                    ? pub.remitente_nombre || pub.profiles?.nombre_completo || 'Autor desconocido'
                    : pub.profiles?.nombre_completo ?? 'Autor desconocido'
            const avatarUrl = remitenteTipo === 'autor' ? pub.profiles?.avatar_url ?? null : null
            const minNombre = pub.ministerios?.nombre
            const publicationId = String(pub.id)
            return <PublicacionCard key={pub.id} publicationId={publicationId} unread={unreadIds.has(publicationId)} titulo={pub.titulo} cuerpo={pub.cuerpo} tipo={pub.tipo} etiqueta={tipoLabel[pub.tipo] ?? pub.tipo} colorClass={tipoColor[pub.tipo] ?? tipoColor.aviso} fecha={formatDistanceToNow(new Date(pub.created_at), { addSuffix: true, locale: es })} autor={autor} autorAvatarUrl={avatarUrl} ministerio={minNombre} />
          })}
        </div>
      )}
    </main>
  )
}
