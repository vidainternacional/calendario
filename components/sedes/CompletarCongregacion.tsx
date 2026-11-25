'use client'
import { useEffect } from 'react'
import MiCongregacionReview from '@/components/perfil/MiCongregacionReview'
import { useMisSedes } from '@/lib/sedes/useMisSedes'
import { aplicarCongregacionRegistro } from '@/app/actions/sedes'
export default function CompletarCongregacion({ userId }: { userId: string }) {
  const { loaded, seleccion, refresh } = useMisSedes(userId)
  useEffect(() => { if (!loaded || seleccion.definida) return;let active = true;void aplicarCongregacionRegistro(userId).then(r => { if (active && r.success) void refresh() });return () => { active = false } }, [loaded, seleccion.definida, refresh, userId])
  if (!loaded || seleccion.definida) return null
  return <aside className="mx-auto max-w-3xl px-4 pt-4 text-slate-800"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-3"><p className="text-sm">¿A qué congregación asistes?</p><div className="max-w-48"><MiCongregacionReview userId={userId} compact /></div></div></aside>
}
