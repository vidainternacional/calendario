'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookHeart, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type MaterialVisible = {
  id: string
  titulo: string
  descripcion_publica: string | null
  audiencia: 'iglesia' | 'lideres' | 'servidores' | 'publico'
  published_at: string | null
  public_slug: string
}

const audienciaLabel: Record<MaterialVisible['audiencia'], string> = {
  iglesia: 'Toda la iglesia',
  lideres: 'Líderes',
  servidores: 'Servidores',
  publico: 'Público',
}

export default function MaterialesInicio() {
  const [materiales, setMateriales] = useState<MaterialVisible[] | null>(null)

  useEffect(() => {
    let activo = true

    async function cargar() {
      const supabase = createClient()
      const { data } = await (supabase as any).rpc('get_visible_pastoral_packages')
      if (activo) setMateriales((data ?? []) as MaterialVisible[])
    }

    void cargar()
    return () => {
      activo = false
    }
  }, [])

  if (materiales === null) {
    return (
      <section aria-label="Materiales para la iglesia">
        <div className="mb-4 flex items-center gap-2">
          <BookHeart className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-bold text-[#171923]">Materiales para la iglesia</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-violet-100 bg-white" />)}
        </div>
      </section>
    )
  }

  if (materiales.length === 0) return null

  return (
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
  )
}
