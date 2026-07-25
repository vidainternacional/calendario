'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookHeart, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { readUserCache } from '@/lib/cache/userCache'

type MaterialVisible = {
  id: string
  titulo: string
  descripcion_publica: string | null
  audiencia: 'iglesia' | 'lideres' | 'servidores' | 'publico'
  published_at: string | null
  public_slug: string
  destacado: boolean
}

type MaterialesInicioProps = {
  puedeAbrirCentroPastoral?: boolean
}

type InicioCache = {
  profile?: { rol?: string } | null
}

const audienciaLabel: Record<MaterialVisible['audiencia'], string> = {
  iglesia: 'Toda la iglesia',
  lideres: 'Líderes',
  servidores: 'Servidores',
  publico: 'Congregación',
}

function esNuevo(material: MaterialVisible) {
  if (!material.published_at) return false
  const publicado = new Date(material.published_at).getTime()
  return Number.isFinite(publicado) && Date.now() - publicado < 72 * 60 * 60 * 1000
}

export default function MaterialesInicio({ puedeAbrirCentroPastoral: permisoRecibido }: MaterialesInicioProps) {
  const [materiales, setMateriales] = useState<MaterialVisible[] | null>(null)
  const [puedeAbrirCentroPastoral, setPuedeAbrirCentroPastoral] = useState(Boolean(permisoRecibido))

  useEffect(() => {
    let activo = true

    async function cargar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const cache = user ? readUserCache<InicioCache>(user.id, 'inicio:v1') : null
      const rolCache = cache?.profile?.rol
      const permisoCache = rolCache === 'pastor' || rolCache === 'administrador'

      const { data } = await (supabase as any).rpc('get_visible_pastoral_packages')

      if (activo) {
        setMateriales((data ?? []) as MaterialVisible[])
        setPuedeAbrirCentroPastoral(Boolean(permisoRecibido) || permisoCache)
      }
    }

    void cargar()
    return () => {
      activo = false
    }
  }, [permisoRecibido])

  if (materiales === null) {
    return (
      <section aria-label="Área pastoral">
        <div className="h-24 animate-pulse rounded-2xl border border-indigo-100 bg-white" />
      </section>
    )
  }

  if (!puedeAbrirCentroPastoral && materiales.length === 0) return null

  return (
    <div className="space-y-6" data-build="pastoral-centro-v4">
      {puedeAbrirCentroPastoral && (
        <section aria-label="Centro Pastoral">
          <Link
            href="/pastoral"
            className="group relative flex min-h-24 items-center justify-between gap-4 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-sm transition hover:shadow-md active:scale-[0.99] sm:p-5"
          >
            <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent pastoral-card-shine" />
            <div className="relative flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100">Área de trabajo pastoral</p>
                <h2 className="mt-1 text-lg font-bold">Centro Pastoral</h2>
                <p className="mt-1 text-xs leading-5 text-indigo-100">Prepare mensajes, recursos, presentaciones y materiales desde un solo espacio.</p>
              </div>
            </div>
            <ChevronRight className="relative h-5 w-5 shrink-0 text-white/75 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      )}

      {materiales.length > 0 && (
        <section aria-labelledby="materiales-inicio">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <BookHeart className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 id="materiales-inicio" className="text-lg font-bold text-[#171923]">Materiales para la iglesia</h2>
              <p className="text-xs text-slate-500">Enseñanzas y guías compartidas por el equipo pastoral.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {materiales.map((material) => {
              const nuevo = esNuevo(material)
              const animado = material.destacado || nuevo
              return (
                <Link
                  key={material.id}
                  href={`/material/${material.public_slug}`}
                  className="group relative flex min-h-40 flex-col overflow-hidden rounded-2xl border border-violet-400/40 bg-gradient-to-br from-indigo-600 via-violet-650 to-violet-800 p-5 text-white shadow-[0_10px_28px_rgba(109,40,217,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(109,40,217,0.28)] active:scale-[0.99]"
                >
                  {animado && <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/28 to-transparent pastoral-card-shine" />}
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                      {audienciaLabel[material.audiencia]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {material.destacado && <span className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-amber-950"><Sparkles className="h-3 w-3" /> Importante</span>}
                      {!material.destacado && nuevo && <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-violet-700">Nuevo</span>}
                      <ChevronRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <h3 className="relative mt-4 line-clamp-2 text-lg font-bold leading-snug">{material.titulo}</h3>
                  <p className="relative mt-2 line-clamp-2 text-xs leading-5 text-violet-100">{material.descripcion_publica || 'Nuevo material pastoral disponible para la congregación.'}</p>
                  <span className="relative mt-auto pt-4 text-xs font-bold text-white">Abrir material →</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <style jsx global>{`
        @keyframes pastoral-card-shine {
          0%, 66% { transform: translateX(-150%) rotate(12deg); opacity: 0; }
          70% { opacity: 1; }
          92%, 100% { transform: translateX(520%) rotate(12deg); opacity: 0; }
        }
        .pastoral-card-shine { animation: pastoral-card-shine 7.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pastoral-card-shine { animation: none; display: none; }
        }
      `}</style>
    </div>
  )
}
