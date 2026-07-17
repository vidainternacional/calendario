import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Megaphone, Info, Globe } from 'lucide-react'
import NuevoAvisoModal from '@/components/avisos/NuevoAvisoModal'

export const metadata: Metadata = {
  title: 'Avisos',
  description: 'Publicaciones e información importante de tu comunidad',
}

// Etiqueta del tipo de aviso
const tipoLabel: Record<string, string> = {
  aviso: 'Aviso',
  evento: 'Evento',
  comunicado: 'Comunicado',
  urgente: 'Urgente',
}

// Paleta de colores por tipo
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

  // ── 1. Perfil del usuario (rol) ─────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, nombre_completo')
    .eq('id', user.id)
    .single()

  const rol = (profile as any)?.rol as string | undefined
  const esPastorAdmin = rol === 'pastor' || rol === 'administrador'

  // ── 2. Ministerios del usuario ──────────────────────────────────────────
  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select('ministerio_id, es_lider, ministerios (id, nombre)')
    .eq('profile_id', user.id)

  const ministerioIds = (membresias || []).map((m: any) => m.ministerio_id)

  // Ministerios donde el usuario es líder (para el formulario)
  const ministeriosLider = (membresias || [])
    .filter((m: any) => m.es_lider)
    .map((m: any) => ({ id: m.ministerios?.id ?? m.ministerio_id, nombre: m.ministerios?.nombre ?? 'Ministerio' }))

  // Puede crear aviso si es pastor/admin O si es líder de al menos un ministerio
  const puedeCrear = esPastorAdmin || ministeriosLider.length > 0

  // ── 3. Publicaciones visibles ───────────────────────────────────────────
  // Regla: globales (ministerio_id IS NULL) + las de mis ministerios
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
    .order('created_at', { ascending: false })

  if (!esPastorAdmin && ministerioIds.length > 0) {
    // Servidores: globales + sus ministerios
    query = query.or(`ministerio_id.is.null,ministerio_id.in.(${ministerioIds.join(',')})`)
  } else if (!esPastorAdmin && ministerioIds.length === 0) {
    // Sin ministerios: solo globales
    query = query.is('ministerio_id', null)
  }
  // Pastor/admin: sin filtro → ve todo

  const { data: publicaciones, error: pubError } = await query

  if (pubError) {
    console.error('[AvisosPage] Error al cargar publicaciones:', pubError)
  }

  const items = (publicaciones || []) as any[]

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto pb-28">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171923]">Avisos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length === 0
              ? 'Sin publicaciones por ahora'
              : `${items.length} publicación${items.length !== 1 ? 'es' : ''}`}
          </p>
        </div>

        {puedeCrear && (
          <NuevoAvisoModal
            ministeriosLider={ministeriosLider}
            esPastorAdmin={esPastorAdmin}
          />
        )}
      </header>

      {/* ── Lista de avisos ─────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
            <Info className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-sm text-gray-500 max-w-[220px]">
            No hay publicaciones recientes para tu comunidad.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((pub) => {
            const colorClass = tipoColor[pub.tipo] ?? tipoColor.aviso
            const label = tipoLabel[pub.tipo] ?? pub.tipo
            const autor = (pub.profiles as any)?.nombre_completo ?? 'Autor desconocido'
            const minNombre = (pub.ministerios as any)?.nombre
            const inicial = autor.charAt(0).toUpperCase()
            const fecha = new Date(pub.created_at)

            return (
              <article
                key={pub.id}
                className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-[0_4px_18px_rgba(20,24,40,0.07)] flex flex-col gap-3"
              >
                {/* Tipo + fecha */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${colorClass}`}
                  >
                    <Megaphone className="w-3 h-3" />
                    {label}
                  </span>
                  <time
                    dateTime={fecha.toISOString()}
                    className="text-[11px] text-gray-400"
                    title={format(fecha, "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                  >
                    {formatDistanceToNow(fecha, { addSuffix: true, locale: es })}
                  </time>
                </div>

                {/* Título */}
                <h2 className="text-base font-bold text-[#171923] leading-snug">
                  {pub.titulo}
                </h2>

                {/* Cuerpo */}
                {pub.cuerpo && (
                  <p className="text-sm text-gray-500 whitespace-pre-line leading-relaxed">
                    {pub.cuerpo}
                  </p>
                )}

                {/* Footer: autor + ministerio */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">{inicial}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex-1 min-w-0">
                    <span className="font-medium text-[#171923]">{autor}</span>
                  </span>

                  {/* Ministerio o Global */}
                  {minNombre ? (
                    <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                      {minNombre}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                      <Globe className="w-2.5 h-2.5" />
                      Global
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
