'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'

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
          <BookOpen className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-[#171923]">Materiales para la iglesia</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-white" />)}
        </div>
      </section>
    )
  }

  if (materiales.length === 0) return null

  return (
    <section aria-labelledby="materiales-inicio">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-5 w-5 shrink-0 text-indigo-500" />
          <h2 id="materiales-inicio" className="text-lg font-bold text-[#171923]">Materiales para la iglesia</h2>
        </div>
      </div>

      {materiales.length === 0 ? (
        <EmptyState icon={BookOpen} title="No hay materiales disponibles" description="Cuando el pastor publique una guía de estudio, aparecerá aquí." compact />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {materiales.map((material) => (
            <Link
              key={material.id}
              href={`/material/${material.public_slug}`}
              className="group flex min-h-36 flex-col rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-700">
                  {audienciaLabel[material.audiencia]}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-slate-950">{material.titulo}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{material.descripcion_publica || 'Guía pastoral disponible dentro de la aplicación.'}</p>
              <span className="mt-auto pt-3 text-xs font-bold text-indigo-700">Abrir en la aplicación</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
