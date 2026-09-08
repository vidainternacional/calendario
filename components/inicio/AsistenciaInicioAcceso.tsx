'use client'

import Link from 'next/link'
import { BarChart3, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AsistenciaInicioAcceso() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function comprobarAcceso() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return
      const rol = (profile as any)?.rol
      setVisible(rol === 'pastor' || rol === 'administrador')
    }

    void comprobarAcceso()
    return () => { cancelled = true }
  }, [])

  if (!visible) return null

  return (
    <section aria-label="Asistencia de la congregación">
      <Link
        href="/asistencia"
        className="group flex min-h-[74px] items-center gap-3 rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50/80 px-4 py-3.5 shadow-[0_7px_22px_rgba(16,185,129,0.06)] transition active:scale-[0.99]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">Control congregacional</span>
          <span className="mt-0.5 block text-sm font-bold text-[#171923]">Asistencia de la congregación</span>
          <span className="mt-0.5 block text-[11px] text-slate-500">Personas, eventos, historial y gráficas de asistencia.</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-emerald-400 transition-transform group-active:translate-x-0.5" aria-hidden="true" />
      </Link>
    </section>
  )
}
