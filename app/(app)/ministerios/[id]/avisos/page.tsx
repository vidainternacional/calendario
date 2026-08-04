import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Megaphone, Plus } from 'lucide-react'
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

  const [{ data: membresia }, { data: ministerio }] = await Promise.all([
    supabase
      .from('ministerio_miembros')
      .select('es_lider')
      .eq('ministerio_id', id)
      .eq('profile_id', user.id)
      .maybeSingle(),
    supabase
      .from('ministerios')
      .select('nombre, color_primario')
      .eq('id', id)
      .single(),
  ])

  let esPastor = false
  if (!(membresia as any)?.es_lider) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    esPastor = (profile as any)?.rol === 'pastor' || (profile as any)?.rol === 'administrador'
  }

  const puedePublicar = Boolean((membresia as any)?.es_lider || esPastor)
  const color = (ministerio as any)?.color_primario || '#5b3df5'

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
    <main className="min-h-screen bg-[#f5f5f7] pb-28 pt-[calc(env(safe-area-inset-top)+5.75rem)]">
      <header className="mx-auto max-w-2xl px-4 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {(ministerio as any)?.nombre || 'Ministerio'}
        </p>
        <div className="mt-1 flex min-w-0 items-end justify-between gap-3">
          <h1 className="min-w-0 break-words text-[32px] font-extrabold leading-[1.04] tracking-[-0.04em] text-[#111827] sm:text-[38px]">
            Avisos y noticias
          </h1>
          {puedePublicar && (
            <Link
              href={`/ministerios/${id}/avisos/nuevo`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-95"
              style={{ backgroundColor: color }}
              aria-label="Nuevo aviso"
            >
              <Plus className="h-6 w-6" />
            </Link>
          )}
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
          Comunicación oficial, recordatorios y novedades del equipo.
        </p>
      </header>

      <section className="mx-auto max-w-2xl px-4">
        {!avisos || avisos.length === 0 ? (
          <div className="rounded-[24px] bg-white px-5 py-14 text-center ring-1 ring-black/[0.045]">
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-full"
              style={{ backgroundColor: `${color}14`, color }}
            >
              <Megaphone className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-base font-bold text-[#171923]">Aún no hay avisos</h2>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-slate-500">
              Los avisos publicados para este ministerio aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
            {avisos.map((aviso: any, index: number) => (
              <article
                key={aviso.id}
                className={`relative px-4 py-4 sm:px-5 ${index < avisos.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: `${color}12`, color }}
                    aria-hidden="true"
                  >
                    <Megaphone className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-[16px] font-bold leading-snug text-[#171923]">
                      {aviso.titulo}
                    </h2>
                    {aviso.cuerpo && (
                      <p className="mt-1.5 break-words whitespace-pre-wrap text-[14px] leading-6 text-slate-600">
                        {aviso.cuerpo}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-400">
                      <span className="font-semibold text-slate-500">
                        {aviso.profiles?.nombre_completo || 'Usuario'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={aviso.created_at}>
                        {formatDistanceToNow(new Date(aviso.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
