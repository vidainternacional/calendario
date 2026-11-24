import Link from 'next/link'
import { redirect } from 'next/navigation'
import SedesCatalogo from '@/components/admin/SedesCatalogo'
import { sesionSedes } from '@/lib/sedes/servidor'
import { esGestorGlobalSedes } from '@/lib/sedes/modelo'

export default async function AdministrarSedesPage() {
  const { user, perfil } = await sesionSedes()
  if (!esGestorGlobalSedes(perfil)) redirect('/inicio')
  return <main className="mx-auto max-w-3xl px-5 pb-28 pt-16 text-slate-900"><Link href="/perfil" className="inline-flex min-h-11 items-center text-sm font-semibold">← Perfil</Link><SedesCatalogo userId={user.id} /></main>
}
