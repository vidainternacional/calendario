'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookHeart, ChevronRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { readUserCache } from '@/lib/cache/userCache'

type MaterialVisible = {
  id: string
  titulo: string
  descripcion_publica: string | null
  audiencia: 'iglesia' | 'lideres' | 'servidores' | 'publico'
  published_at: string | null
  public_slug: string
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
  publico: 'Público',
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
    <div className="space-y-6" data-build="pastoral-centro-v3">
      {puedeAbrirCentroPastoral && (
        <section aria-label="Centro Pastoral">
          <Link
            href="/pastoral"
            className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-sm transition hover:shadow-md active:scale-[0.99] sm:p-5"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100">Área de trabajo pastoral</p>
                <h2 className="mt-1 text-lg font-bold">Centro Pastoral</h2>
                <p className="mt-1 text-xs leading-5 text-indigo-100">Una sola entrada para bosquejos, versículos, biblioteca, paquetes y materiales.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/75 transition-transform group-hover:translate-x-1" />
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
              <p className="text-xs text-slate-500">Guías compartidas por el equipo pastoral.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {materiales.map((material) => (
              <Link
                key={material.id}
                href={`/material/${material.public_slug}`}
                className="group flex min-h-36 flex-col rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/55 via-white to-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full border border-violet-100 bg-white/90 px-3 py-1 text-[10px] font-bold text-violet-700">
                    {audienciaLabel[material.audiencia]}
                  </span>
                  <ChevronRight className="h-4 w-4 text-violet-300 transition-transform group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-slate-950">{material.titulo}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{material.descripcion_publica || 'Guía pastoral disponible dentro de la aplicación.'}</p>
                <span className="mt-auto pt-3 text-xs font-bold text-violet-700">Abrir material</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
