'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, BookHeart, ChevronRight, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
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
      <section aria-label="Materiales para la iglesia" aria-busy="true">
        <div className="h-20 animate-pulse rounded-[24px] border border-white/90 bg-white" />
        <span className="sr-only">Cargando materiales pastorales…</span>
      </section>
    )
  }

  if (!puedeAbrirCentroPastoral && errorCarga) {
    return (
      <section aria-label="Error al cargar materiales pastorales" className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-amber-950">No pudimos cargar los materiales</h2>
            <p className="mt-1 text-xs leading-5 text-amber-900/75">El resto de Inicio continúa disponible.</p>
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
    <div className="space-y-4" data-build="inicio-materiales-compactos-v1">
      {puedeAbrirCentroPastoral && (
        <section aria-label="Centro Pastoral">
          <Link
            href="/pastoral"
            className="group flex min-h-[76px] items-center gap-3 rounded-[24px] border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50/80 px-4 py-3.5 shadow-[0_7px_22px_rgba(91,61,245,0.06)] transition active:scale-[0.99]"
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

      {errorCarga && puedeAbrirCentroPastoral && (
        <section aria-label="Error al cargar materiales pastorales" className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs leading-5 text-amber-900">El Centro Pastoral está disponible, pero los materiales no pudieron cargarse.</p>
            <button
              type="button"
              onClick={() => {
                setMateriales(null)
                setIntento((valor) => valor + 1)
              }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-800 ring-1 ring-amber-200 active:scale-95"
              aria-label="Reintentar carga de materiales"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {!errorCarga && materiales.length > 0 && (
        <section aria-labelledby="materiales-inicio">
          <div className="mb-3 flex items-center gap-3 px-1">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
              <BookHeart className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="materiales-inicio" className="text-[17px] font-bold tracking-[-0.02em] text-[#171923]">Para tu crecimiento</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Enseñanzas y guías compartidas por el equipo pastoral.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
            {materiales.map((material) => {
              const nuevo = esNuevo(material)
              return (
                <Link
                  key={material.id}
                  href={`/material/${material.public_slug}`}
                  className="group flex min-h-[78px] items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 active:bg-violet-50/45"
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${material.destacado ? 'bg-violet-100 text-violet-800' : 'bg-violet-50 text-violet-700'}`}>
                    {material.destacado ? <Sparkles className="h-5 w-5" aria-hidden="true" /> : <BookHeart className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-bold text-[#171923]">{material.titulo}</span>
                      {material.destacado && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-amber-800">Importante</span>}
                      {!material.destacado && nuevo && <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-violet-700 ring-1 ring-violet-100">Nuevo</span>}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-slate-500">{material.descripcion_publica || audienciaLabel[material.audiencia]}</span>
                    <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.08em] text-violet-500">{audienciaLabel[material.audiencia]}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
