'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, ClipboardCheck, UserRoundPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { usePendingIndicators } from '@/components/notificaciones/usePendingIndicators'

type Rol = 'administrador' | 'pastor' | 'lider' | 'servidor' | null

export default function PendingAttentionShortcut() {
  const pathname = usePathname()
  const surface = pathname === '/inicio' ? 'inicio' : pathname === '/avisos' ? 'avisos' : null
  const { pendingMinisterioIngresos, pendingSolicitudesGestionables } = usePendingIndicators()
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [rol, setRol] = useState<Rol>(null)

  useEffect(() => {
    if (!surface) return
    let cancelled = false

    async function cargarRol() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return
      const { data } = await supabase.from('profiles').select('rol').eq('id', userId).maybeSingle()
      if (!cancelled) setRol(((data as any)?.rol || null) as Rol)
    }

    void cargarRol()
    return () => {
      cancelled = true
    }
  }, [surface])

  useEffect(() => {
    setTarget(null)
    if (!surface) return

    let disposed = false
    let mount: HTMLElement | null = null

    const ensureMount = () => {
      if (disposed || mount?.isConnected) return
      const main = document.querySelector<HTMLElement>('main')
      if (!main) return

      const nextMount = document.createElement('div')
      nextMount.dataset.pendingAttentionInline = surface

      if (surface === 'inicio') {
        const section = main.querySelector<HTMLElement>('section[aria-labelledby="publicaciones-inicio"]')
        const heading = section?.firstElementChild
        if (!section || !heading) return
        heading.insertAdjacentElement('afterend', nextMount)
      } else {
        const header = Array.from(main.children).find((node) => node.tagName === 'HEADER') as HTMLElement | undefined
        if (!header) return
        header.insertAdjacentElement('afterend', nextMount)
      }

      mount = nextMount
      setTarget(nextMount)
    }

    ensureMount()
    const observer = new MutationObserver(ensureMount)
    observer.observe(document.body, { childList: true, subtree: true })
    const retry = window.setInterval(ensureMount, 500)

    return () => {
      disposed = true
      observer.disconnect()
      window.clearInterval(retry)
      setTarget(null)
      mount?.remove()
    }
  }, [surface])

  const acciones = useMemo(() => {
    const items: Array<{
      key: string
      href: string
      label: string
      detail: string
      count: number
      icon: typeof ClipboardCheck
    }> = []

    if (pendingMinisterioIngresos > 0) {
      const accesoGlobal = rol === 'administrador' || rol === 'pastor'
      items.push({
        key: 'ingresos',
        href: accesoGlobal ? '/admin/solicitudes-ministerios' : '/ministerios',
        label: 'Solicitudes de ingreso',
        detail: accesoGlobal ? 'Personas esperando revisión en ministerios' : 'Personas esperando respuesta de tu ministerio',
        count: pendingMinisterioIngresos,
        icon: UserRoundPlus,
      })
    }

    if (pendingSolicitudesGestionables > 0) {
      items.push({
        key: 'solicitudes',
        href: '/solicitudes',
        label: 'Solicitudes por resolver',
        detail: 'Recursos, decisiones o reemplazos que requieren atención',
        count: pendingSolicitudesGestionables,
        icon: ClipboardCheck,
      })
    }

    return items
  }, [pendingMinisterioIngresos, pendingSolicitudesGestionables, rol])

  if (!surface || !target || acciones.length === 0) return null

  return createPortal(
    <section className={surface === 'avisos' ? 'mb-6' : 'mb-3'} aria-label="Requiere tu atención">
      <div className="overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200/80">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-rose-500">Requiere tu atención</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Tareas reales pendientes para tu responsabilidad actual.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {acciones.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={item.href}
                className="flex min-h-[66px] items-center gap-3 px-4 py-3 transition active:bg-slate-50"
              >
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[8px] font-black leading-none text-white ring-2 ring-white">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#171923]">{item.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">{item.detail}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </div>
    </section>,
    target,
  )
}
