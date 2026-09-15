'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClipboardCheck, Eye, EyeOff, Info, Megaphone, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { eliminarAvisoAdmin, ocultarAvisoAdmin, restaurarAvisoAdmin } from '@/app/actions/adminAvisos'
import NuevoAvisoModal from '@/components/avisos/NuevoAvisoModal'
import PublicacionCard from '@/components/avisos/PublicacionCard'
import { requestUnreadPublicationsRefresh, useUnreadPublicationIds } from '@/components/avisos/usePublicationReads'
import { SkeletonPage } from '@/components/ui/Skeleton'
import BackButton from '@/components/navigation/BackButton'
import { mostrarToast } from '@/lib/ui/toast'

type PublicacionAdmin = {
  id: string
  titulo: string
  cuerpo: string | null
  tipo: string
  ministerio_id: string | null
  remitente_tipo: string | null
  remitente_nombre: string | null
  created_at: string
  estado: 'aprobado' | 'oculto'
  profiles?: { nombre_completo?: string | null; avatar_url?: string | null } | null
  ministerios?: { nombre?: string | null } | null
}

type AdminAvisosClientProps = {
  userId: string
  esAdministrador: boolean
  puedeRevisar: boolean
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

export default function AdminAvisosClient({ userId, esAdministrador, puedeRevisar }: AdminAvisosClientProps) {
  const [items, setItems] = useState<PublicacionAdmin[] | null>(null)
  const [ministerios, setMinisterios] = useState<Array<{ id: string; nombre: string }>>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      setIsRefreshing(true)
      const supabase = createClient()

      try {
        let publicationsQuery = (supabase as any)
          .from('publicaciones')
          .select(`
            id,
            titulo,
            cuerpo,
            tipo,
            ministerio_id,
            remitente_tipo,
            remitente_nombre,
            created_at,
            estado,
            profiles!autor_id (nombre_completo, avatar_url),
            ministerios (nombre)
          `)
          .order('created_at', { ascending: false })

        publicationsQuery = esAdministrador
          ? publicationsQuery.in('estado', ['aprobado', 'oculto'])
          : publicationsQuery.eq('estado', 'aprobado')

        const [publicacionesRes, ministeriosRes] = await Promise.all([
          publicationsQuery,
          supabase.from('ministerios').select('id, nombre').eq('activo', true).order('nombre'),
        ])

        if (!cancelled) {
          setItems((publicacionesRes.data || []) as PublicacionAdmin[])
          setMinisterios((ministeriosRes.data || []).map((m: any) => ({ id: m.id, nombre: m.nombre })))
        }
      } finally {
        if (!cancelled) setIsRefreshing(false)
      }
    }

    void refresh()
    const handleOnline = () => void refresh()
    window.addEventListener('online', handleOnline)
    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
    }
  }, [esAdministrador, userId])

  const visibleIds = (items || []).filter((item) => item.estado === 'aprobado').map((item) => item.id)
  const unreadIds = useUnreadPublicationIds(visibleIds)
  const visibles = (items || []).filter((item) => item.estado === 'aprobado').length
  const ocultos = (items || []).filter((item) => item.estado === 'oculto').length

  const abrirNuevoAviso = () => {
    const trigger = document.getElementById('btn-nuevo-aviso') as HTMLButtonElement | null
    trigger?.click()
  }

  const ocultar = async (publicationId: string) => {
    setWorkingId(publicationId)
    const result = await ocultarAvisoAdmin(publicationId)
    setWorkingId(null)
    if (!result.success) {
      mostrarToast(result.error || 'No se pudo ocultar el aviso.')
      return
    }
    setItems((current) => (current || []).map((item) => item.id === publicationId ? { ...item, estado: 'oculto' } : item))
    requestUnreadPublicationsRefresh()
    mostrarToast('Aviso ocultado.')
  }

  const restaurar = async (publicationId: string) => {
    setWorkingId(publicationId)
    const result = await restaurarAvisoAdmin(publicationId)
    setWorkingId(null)
    if (!result.success) {
      mostrarToast(result.error || 'No se pudo volver a mostrar el aviso.')
      return
    }
    setItems((current) => (current || []).map((item) => item.id === publicationId ? { ...item, estado: 'aprobado' } : item))
    requestUnreadPublicationsRefresh()
    mostrarToast('Aviso visible nuevamente.')
  }

  const borrar = async (publicationId: string, titulo: string) => {
    const confirmed = window.confirm(`¿Borrar definitivamente “${titulo}”? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setWorkingId(publicationId)
    const result = await eliminarAvisoAdmin(publicationId)
    setWorkingId(null)
    if (!result.success) {
      mostrarToast(result.error || 'No se pudo borrar el aviso.')
      return
    }
    setItems((current) => (current || []).filter((item) => item.id !== publicationId))
    requestUnreadPublicationsRefresh()
    mostrarToast('Aviso borrado definitivamente.')
  }

  const shellClass = 'mx-auto min-h-screen max-w-3xl overflow-x-hidden bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:px-6 sm:pt-12'

  if (!items) {
    return (
      <main className={shellClass}>
        <div className="mb-7"><BackButton /></div>
        <SkeletonPage cards={4} />
      </main>
    )
  }

  return (
    <main className={shellClass}>
      <div className="mb-7"><BackButton /></div>

      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500">Administración</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Gestión de avisos</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Publica, revisa y decide qué avisos permanecen visibles para la congregación.</p>
      </div>

      <header className="mb-7 flex min-w-0 flex-col gap-4 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04] min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between landscape:mb-4">
        <div className="min-w-0">
          <h2 className="break-words text-base font-extrabold text-[#171923]">Publicaciones</h2>
          <p className="mt-0.5 break-words text-sm text-gray-500">
            {items.length === 0 ? 'Sin publicaciones por ahora' : `${visibles} visible${visibles !== 1 ? 's' : ''}${esAdministrador ? ` · ${ocultos} oculta${ocultos !== 1 ? 's' : ''}` : ''}`}
            {unreadIds.size > 0 && <span className="ml-2 font-semibold text-rose-500">· {unreadIds.size} sin leer</span>}
            {isRefreshing && <span className="ml-2 text-xs text-gray-400">Actualizando…</span>}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 min-[430px]:w-auto min-[430px]:shrink-0 min-[430px]:justify-end">
          {puedeRevisar && (
            <Link href="/avisos/pendientes-aprobacion" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-100 min-[430px]:flex-none">Revisar</Link>
          )}
          <NuevoAvisoModal ministeriosLider={ministerios} esPastorAdmin />
        </div>
      </header>

      {items.length === 0 ? (
        <section className="overflow-hidden rounded-[26px] border border-white bg-white shadow-sm" aria-labelledby="avisos-vacio-titulo">
          <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-5 py-8 text-center sm:px-8 sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-white shadow-sm"><Info className="h-8 w-8 text-indigo-500" aria-hidden="true" /></div>
            <h2 id="avisos-vacio-titulo" className="mt-5 text-xl font-bold text-[#171923]">Comparte la primera novedad</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Publica información importante, recordatorios o cambios para que todos reciban el mensaje con claridad.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={abrirNuevoAviso} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-500 active:scale-[0.99]"><Megaphone className="h-4 w-4" aria-hidden="true" />Crear primer aviso</button>
              {puedeRevisar && <Link href="/avisos/pendientes-aprobacion" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"><ClipboardCheck className="h-4 w-4" aria-hidden="true" />Revisar pendientes</Link>}
            </div>
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
            const oculto = pub.estado === 'oculto'
            const loading = workingId === pub.id

            return (
              <div key={pub.id} className={oculto ? 'opacity-75' : ''}>
                {oculto && (
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Oculto para usuarios
                  </div>
                )}
                <PublicacionCard publicationId={pub.id} unread={!oculto && unreadIds.has(pub.id)} titulo={pub.titulo} cuerpo={pub.cuerpo} tipo={pub.tipo} etiqueta={tipoLabel[pub.tipo] ?? pub.tipo} colorClass={tipoColor[pub.tipo] ?? tipoColor.aviso} fecha={formatDistanceToNow(new Date(pub.created_at), { addSuffix: true, locale: es })} autor={autor} autorAvatarUrl={avatarUrl} ministerio={minNombre} />

                {esAdministrador && (
                  <div className="mt-2 flex gap-2">
                    {oculto ? (
                      <button type="button" disabled={loading} onClick={() => void restaurar(pub.id)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"><Eye className="h-4 w-4" />Volver a mostrar</button>
                    ) : (
                      <button type="button" disabled={loading} onClick={() => void ocultar(pub.id)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"><EyeOff className="h-4 w-4" />Ocultar</button>
                    )}
                    <button type="button" disabled={loading} onClick={() => void borrar(pub.id, pub.titulo)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"><Trash2 className="h-4 w-4" />Borrar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
