'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react'
import ShineSweep from '@/components/ui/ShineSweep'
import { obtenerPendientesMinisterioDashboard } from '@/app/actions/pendientes-ministerio-dashboard'
import { PENDING_INDICATORS_EVENT } from '@/components/notificaciones/usePendingIndicators'

type Mem = {
  ministerio_id: string
  es_lider: boolean
  nombre: string
  emoji: string
  color: string
}

type PendingByMinistry = Record<string, number>

export default function MinisterioSwitcher({ membresias }: { membresias: Mem[] }) {
  const [abierto, setAbierto] = useState(false)
  const [pendientes, setPendientes] = useState<PendingByMinistry>({})
  const menuRef = useRef<HTMLElement>(null)

  const ministryIds = useMemo(
    () => membresias.map((item) => item.ministerio_id),
    [membresias],
  )
  const ministryKey = ministryIds.join('|')

  useEffect(() => {
    if (!abierto) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierto(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [abierto])

  useEffect(() => {
    let cancelled = false
    const ids = ministryKey ? ministryKey.split('|') : []

    if (ids.length === 0) {
      setPendientes({})
      return
    }

    async function refreshPending() {
      try {
        const next = await obtenerPendientesMinisterioDashboard(ids)
        if (!cancelled) setPendientes(next)
      } catch (error) {
        console.error('No se pudieron cargar los pendientes del dashboard ministerial', error)
      }
    }

    const handleFocus = () => void refreshPending()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshPending()
    }
    const handlePendingRefresh = () => void refreshPending()

    void refreshPending()
    const interval = window.setInterval(refreshPending, 30_000)
    window.addEventListener('focus', handleFocus)
    window.addEventListener(PENDING_INDICATORS_EVENT, handlePendingRefresh)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener(PENDING_INDICATORS_EVENT, handlePendingRefresh)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [ministryKey])

  if (!membresias.length) return null
  const principal = membresias[0]
  const principalPendientes = pendientes[principal.ministerio_id] || 0
  const totalPendientes = Object.values(pendientes).reduce((total, value) => total + value, 0)

  return (
    <section aria-label={membresias.length > 1 ? 'Mis ministerios' : 'Mi ministerio'} ref={menuRef} className="relative z-30">
      <div
        className="relative flex min-h-[84px] overflow-hidden rounded-[24px] text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] ring-1 ring-white/20"
        style={{ background: `linear-gradient(135deg, ${principal.color}, ${principal.color}d9)` }}
      >
        <ShineSweep />

        <Link
          href={`/ministerios/${principal.ministerio_id}`}
          className="relative flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 transition active:bg-white/5"
        >
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl ring-1 ring-white/25 backdrop-blur-sm">
            {principal.emoji}
            {principalPendientes > 0 && (
              <span
                className="absolute -right-2.5 -top-2.5 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 text-[9px] font-black leading-none text-white shadow-sm ring-2 ring-white"
                aria-label={`${principalPendientes} pendiente${principalPendientes === 1 ? '' : 's'} por revisar en ${principal.nombre}`}
              >
                {principalPendientes > 99 ? '99+' : principalPendientes}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/78">
              {membresias.length > 1 ? 'Mis ministerios' : 'Mi ministerio'}
              {principal.es_lider && (
                <span className="rounded-full bg-white/16 px-2 py-0.5 text-[8px] font-extrabold text-white ring-1 ring-white/20">Líder</span>
              )}
            </span>
            <span className="mt-1 block truncate text-[16px] font-bold tracking-[-0.02em] text-white">{principal.nombre}</span>
            <span className="mt-0.5 block truncate text-[11px] text-white/72">
              {principalPendientes > 0
                ? `${principalPendientes} ${principalPendientes === 1 ? 'acción pendiente' : 'acciones pendientes'} por revisar.`
                : principal.es_lider
                  ? 'Dashboard, equipo y actividad del ministerio.'
                  : 'Equipo, actividades y recursos del ministerio.'}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-white/75" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          aria-expanded={abierto}
          aria-haspopup="menu"
          aria-label="Cambiar o explorar ministerios"
          className="relative flex w-[58px] shrink-0 flex-col items-center justify-center gap-1 border-l border-white/15 bg-white/8 text-white transition active:bg-white/15"
        >
          <span className="rounded-full bg-white/16 px-2 py-0.5 text-[9px] font-extrabold ring-1 ring-white/20">{membresias.length}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {abierto && (
        <>
          <button type="button" aria-label="Cerrar selector de ministerios" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={() => setAbierto(false)} />
          <div role="menu" className="absolute left-0 right-0 z-50 mt-2 max-h-[min(70vh,420px)] overflow-y-auto rounded-[24px] border border-slate-200/80 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)] [-webkit-overflow-scrolling:touch]">
            <div className="px-3 pb-2 pt-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Mis ministerios</p>
              <p className="mt-1 text-xs text-slate-500">
                {totalPendientes > 0
                  ? 'El círculo rojo marca decisiones o solicitudes pendientes en cada dashboard.'
                  : 'Elige el dashboard que deseas abrir o explora otros equipos.'}
              </p>
            </div>
            <div className="space-y-1">
              {membresias.map((ministerio, index) => {
                const pendingCount = pendientes[ministerio.ministerio_id] || 0
                return (
                  <Link
                    key={ministerio.ministerio_id}
                    href={`/ministerios/${ministerio.ministerio_id}`}
                    role="menuitem"
                    onClick={() => setAbierto(false)}
                    className="flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors active:bg-slate-100"
                  >
                    <span
                      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg text-white shadow-sm"
                      style={{ backgroundColor: ministerio.color }}
                    >
                      {ministerio.emoji}
                      {pendingCount > 0 && (
                        <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[8px] font-black leading-none text-white ring-2 ring-white">
                          {pendingCount > 99 ? '99+' : pendingCount}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="truncate text-sm font-semibold text-[#171923]">{ministerio.nombre}</span>
                      <span className={`mt-0.5 block text-[10px] font-medium ${pendingCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {pendingCount > 0
                          ? `${pendingCount} ${pendingCount === 1 ? 'pendiente' : 'pendientes'} por revisar`
                          : index === 0
                            ? 'Ministerio principal'
                            : ministerio.es_lider
                              ? 'Liderazgo'
                              : 'Miembro'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {ministerio.es_lider && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100">Líder</span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2">
              <Link
                href="/ministerios"
                role="menuitem"
                onClick={() => setAbierto(false)}
                className="flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-indigo-600 transition-colors active:bg-indigo-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50"><LayoutGrid className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">Explorar ministerios</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
