'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, BookHeart, ChevronRight, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { readUserCache } from '@/lib/cache/userCache'
import ShineSweep from '@/components/ui/ShineSweep'

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
  const [errorCarga, setErrorCarga] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true

    async function cargar() {
      setErrorCarga(false)

      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError

        const cache = user ? readUserCache<InicioCache>(user.id, 'inicio:v1') : null
        const rolCache = cache?.profile?.rol
        const permisoCache = rolCache === 'pastor' || rolCache === 'administrador'
        const { data, error } = await (supabase as any).rpc('get_visible_pastoral_packages')
        if (error) throw error

        if (activo) {
          setMateriales((data ?? []) as MaterialVisible[])
          setPuedeAbrirCentroPastoral(Boolean(permisoRecibido) || permisoCache)
        }
      } catch (error) {
        console.error('No se pudieron cargar los materiales pastorales', error)
        if (activo) {
          setMateriales([])
          setErrorCarga(true)
        }
      }
    }

    void cargar()
    return () => { activo = false }
  }, [permisoRecibido, intento])

  if (materiales === null) {
    return (
      <section aria-label="Área pastoral" aria-busy="true">
        <div className="h-24 animate-pulse rounded-2xl border border-indigo-100 bg-white" />
        <span className="sr-only">Cargando materiales pastorales…</span>
      </section>
    )
  }

  if (!puedeAbrirCentroPastoral && errorCarga) {
    return (
      <section aria-label="Error al cargar materiales pastorales" className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-amber-950">No pudimos cargar los materiales</h2>
            <p className="mt-1 text-xs leading-5 text-amber-900/75">Puede intentar nuevamente. El resto de Inicio continúa disponible.</p>
            <button
              type="button"
              onClick={() => {
                setMateriales(null)
                setIntento((valor) => valor + 1)
              }}
              className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 text-xs font-bold text-white active:scale-[0.99]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Intentar de nuevo
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!puedeAbrirCentroPastoral && materiales.length === 0) return null

  return (
    <div className="space-y-6" data-build="pastoral-centro-v6">
      {puedeAbrirCentroPastoral && (
        <section aria-label="Centro Pastoral">
          <Link
            href="/pastoral"
            className="group relative flex min-h-24 items-center justify-between gap-4 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-[0_12px_30px_rgba(91,33,182,0.24)] transition hover:shadow-[0_16px_38px_rgba(91,33,182,0.32)] active:scale-[0.99] sm:p-5"
          >
            <ShineSweep />
            <div className="relative flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100">Área de trabajo pastoral</p>
                <h2 className="mt-1 text-lg font-bold">Centro Pastoral</h2>
                <p className="mt-1 text-xs leading-5 text-indigo-100">Prepare mensajes, recursos, presentaciones y materiales desde un solo espacio.</p>
              </div>
            </div>
            <ChevronRight className="relative h-5 w-5 shrink-0 text-white/80 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      )}

      {errorCarga && (
        <section aria-label="Error al cargar materiales pastorales" className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <p className="text-xs leading-5 text-amber-900">El Centro Pastoral está disponible, pero los materiales publicados no pudieron cargarse.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMateriales(null)
                setIntento((valor) => valor + 1)
              }}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3 text-xs font-bold text-amber-900 active:scale-[0.99]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </section>
      )}

      {!errorCarga && materiales.length > 0 && (
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
                  className="group relative flex min-h-40 flex-col overflow-hidden rounded-2xl border border-violet-300/55 bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-900 p-5 text-white shadow-[0_12px_32px_rgba(109,40,217,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(109,40,217,0.36)] active:scale-[0.99]"
                >
                  {animado && <ShineSweep />}
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                      {audienciaLabel[material.audiencia]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {material.destacado && <span className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-amber-950"><Sparkles className="h-3 w-3" /> Importante</span>}
                      {!material.destacado && nuevo && <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-violet-700">Nuevo</span>}
                      <ChevronRight className="h-4 w-4 text-white/75 transition-transform group-hover:translate-x-0.5" />
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
    </div>
  )
}
