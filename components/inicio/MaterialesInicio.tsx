'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Archive, BookOpen, ChevronRight, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'
import AsistenciaInicioAcceso from '@/components/inicio/AsistenciaInicioAcceso'
import { createClient } from '@/lib/supabase/client'

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

const PREPARATION_WINDOW_MS = 48 * 60 * 60 * 1000

function publishedTime(material: MaterialVisible) {
  if (!material.published_at) return 0
  const timestamp = new Date(material.published_at).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function publicadoRecientemente(material: MaterialVisible) {
  const publicado = publishedTime(material)
  return publicado > 0 && Date.now() - publicado < PREPARATION_WINDOW_MS
}

function preparationMaterial(materiales: MaterialVisible[]) {
  return [...materiales]
    .filter(publicadoRecientemente)
    .sort((a, b) => publishedTime(b) - publishedTime(a))[0] || null
}

export default function MaterialesInicio({
  materiales,
  mode,
  puedeAbrirCentroPastoral = false,
}: MaterialesInicioProps) {
  const preparation = preparationMaterial(materiales)
  const [discipulado, setDiscipulado] = useState<{ visible: boolean; yaInicio: boolean }>({
    visible: false,
    yaInicio: false,
  })

  useEffect(() => {
    if (mode !== 'growth') return

    let cancelled = false

    async function cargarDiscipulado() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const [{ data: profile }, { data: discipuladoEstado }] = await Promise.all([
        (supabase as any).from('profiles').select('rol').eq('id', user.id).single(),
        (supabase as any).rpc('discipulado_estado_personal'),
      ])

      if (cancelled) return

      const rol = (profile as any)?.rol as string | undefined
      const estado = (discipuladoEstado as any)?.estado as string | undefined
      const aprobado = (discipuladoEstado as any)?.aprobado === true

      setDiscipulado({
        visible: rol !== 'pastor' && rol !== 'administrador' && !aprobado,
        yaInicio: Boolean(estado && !['sin_iniciar', 'sin_curso'].includes(estado)),
      })
    }

    void cargarDiscipulado()
    return () => { cancelled = true }
  }, [mode])

  if (mode === 'preparation') {
    if (!preparation) return null

    return (
      <section aria-labelledby="preparacion-inicio" className="isolate">
        <Link
          href={`/material/${preparation.public_slug}`}
          style={{ transform: 'none' }}
          className="group relative flex min-h-[92px] items-center gap-3 overflow-hidden rounded-[24px] border border-violet-100 bg-gradient-to-br from-white via-violet-50/55 to-indigo-50 px-4 py-4 shadow-[0_10px_28px_rgba(91,61,245,0.08)] transition-[background-color,box-shadow,filter] duration-100 active:bg-violet-50/80 active:brightness-[0.97] active:shadow-[inset_0_2px_8px_rgba(91,61,245,0.18)]"
        >
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-200/70">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            {preparation.destacado && <Sparkles className="absolute -right-1.5 -top-1.5 h-4 w-4 fill-amber-300/60 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.65)]" aria-hidden="true" />}
          </span>
          <span className="min-w-0 flex-1">
            <span id="preparacion-inicio" className="block text-[10px] font-extrabold uppercase tracking-[0.13em] text-violet-600">Preparación</span>
            <span className="mt-1 block truncate text-[15px] font-bold tracking-[-0.015em] text-[#171923]">{preparation.titulo}</span>
            <span className="mt-1 block line-clamp-1 text-[11px] text-slate-500">
              {preparation.descripcion_publica || 'Material pastoral disponible durante las próximas 48 horas.'}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-violet-600">
            Abrir
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-4" data-build="inicio-materiales-priorizados-v5">
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

      <AsistenciaInicioAcceso />

      <section aria-label="Paquetes recibidos">
        <Link
          href="/paquetes-recibidos"
          className="group flex min-h-[76px] items-center gap-3 rounded-[24px] border border-white/90 bg-white px-4 py-3.5 shadow-[0_8px_26px_rgba(15,23,42,0.05)] transition active:scale-[0.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
            <Archive className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#171923]">Paquetes recibidos</span>
            <span className="mt-1 block text-[11px] text-slate-500">
              {materiales.length > 0
                ? 'Todos los paquetes pastorales que has recibido, guardados en un solo lugar.'
                : 'Aquí se guardarán los paquetes pastorales que recibas.'}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
        </Link>
      </section>

      {discipulado.visible && (
        <section aria-label="Discipulado">
          <Link
            href="/discipulado"
            className="group flex min-h-[104px] items-center gap-4 rounded-[24px] border border-violet-200 bg-white p-4 shadow-[0_10px_28px_rgba(79,70,229,0.08)] transition active:scale-[0.992] sm:p-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-violet-50 shadow-[0_6px_18px_rgba(124,58,237,0.22)]">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-violet-600">Discipulado</span>
              <span className="mt-1 block text-[15px] font-bold leading-snug text-[#171923]">
                {discipulado.yaInicio ? 'Continúa tu discipulado' : '¿Aún no te has discipulado y quieres servir?'}
              </span>
              <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                {discipulado.yaInicio ? 'Retoma tu curso desde el punto donde lo dejaste.' : 'Empecemos aquí. Avanza por el curso y prepárate para servir.'}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-violet-400 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  )
}