'use client'

import Link from 'next/link'
import { BookHeart, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react'

export type MaterialVisible = {
  id: string
  titulo: string
  descripcion_publica: string | null
  audiencia: 'iglesia' | 'lideres' | 'servidores' | 'publico'
  published_at: string | null
  public_slug: string
  destacado: boolean
}

type MaterialesInicioProps = {
  materiales: MaterialVisible[]
  mode: 'preparation' | 'growth'
  puedeAbrirCentroPastoral?: boolean
}

const audienciaLabel: Record<MaterialVisible['audiencia'], string> = {
  iglesia: 'Toda la iglesia',
  lideres: 'Líderes',
  servidores: 'Servidores',
  publico: 'Congregación',
}

function publicadoRecientemente(material: MaterialVisible) {
  if (!material.published_at) return false
  const publicado = new Date(material.published_at).getTime()
  return Number.isFinite(publicado) && Date.now() - publicado < 8 * 24 * 60 * 60 * 1000
}

function preparationMaterial(materiales: MaterialVisible[]) {
  return materiales.find((material) => material.destacado || publicadoRecientemente(material)) || null
}

export default function MaterialesInicio({
  materiales,
  mode,
  puedeAbrirCentroPastoral = false,
}: MaterialesInicioProps) {
  const preparation = preparationMaterial(materiales)

  if (mode === 'preparation') {
    if (!preparation) return null

    return (
      <section aria-labelledby="preparacion-inicio" className="isolate">
        <Link
          href={`/material/${preparation.public_slug}`}
          className="group relative flex min-h-[92px] items-center gap-3 overflow-hidden rounded-[24px] border border-violet-100 bg-gradient-to-br from-white via-violet-50/55 to-indigo-50 px-4 py-4 shadow-[0_10px_28px_rgba(91,61,245,0.08)] transition-colors active:bg-violet-50/80"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-200/70">
            {preparation.destacado ? <Sparkles className="h-5 w-5" aria-hidden="true" /> : <BookHeart className="h-5 w-5" aria-hidden="true" />}
          </span>
          <span className="min-w-0 flex-1">
            <span id="preparacion-inicio" className="block text-[10px] font-extrabold uppercase tracking-[0.13em] text-violet-600">Preparación</span>
            <span className="mt-1 block truncate text-[15px] font-bold tracking-[-0.015em] text-[#171923]">{preparation.titulo}</span>
            <span className="mt-1 block line-clamp-1 text-[11px] text-slate-500">
              {preparation.descripcion_publica || 'Material pastoral disponible para esta semana.'}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-violet-600">
            Abrir
            <ChevronRight className="h-4 w-4 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      </section>
    )
  }

  const growthMaterials = materiales
    .filter((material) => material.id !== preparation?.id)
    .slice(0, 3)

  if (!puedeAbrirCentroPastoral && growthMaterials.length === 0) return null

  return (
    <div className="space-y-4" data-build="inicio-materiales-priorizados-v2">
      {puedeAbrirCentroPastoral && (
        <section aria-label="Centro Pastoral">
          <Link
            href="/pastoral"
            className="group flex min-h-[74px] items-center gap-3 rounded-[24px] border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50/80 px-4 py-3.5 shadow-[0_7px_22px_rgba(91,61,245,0.06)] transition active:scale-[0.99]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-violet-600">Área pastoral</span>
              <span className="mt-0.5 block text-sm font-bold text-[#171923]">Centro Pastoral</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">Mensajes, recursos y materiales en un solo espacio.</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-violet-400 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
          </Link>
        </section>
      )}

      {growthMaterials.length > 0 && (
        <section aria-labelledby="materiales-inicio">
          <div className="mb-3 flex items-center gap-3 px-1">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
              <BookHeart className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="materiales-inicio" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">Para tu crecimiento</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Enseñanzas y guías para seguir creciendo.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
            {growthMaterials.map((material) => (
              <Link
                key={material.id}
                href={`/material/${material.public_slug}`}
                className="group flex min-h-[76px] items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 active:bg-violet-50/45"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                  <BookHeart className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="truncate text-sm font-bold text-[#171923]">{material.titulo}</span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">{material.descripcion_publica || audienciaLabel[material.audiencia]}</span>
                  <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.08em] text-violet-500">{audienciaLabel[material.audiencia]}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
