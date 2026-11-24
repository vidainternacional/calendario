import Link from 'next/link'
import SedesReviewWorkspace from '@/components/admin/SedesReviewWorkspace'
import SedesCatalogo from '@/components/admin/SedesCatalogo'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SedesReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <main className="mx-auto max-w-3xl px-5 pb-28 pt-24 text-slate-900">
    <nav className="flex flex-wrap gap-4 text-sm font-semibold"><Link href="/admin" className="inline-flex min-h-11 items-center">← Administración</Link><Link href="/admin/fotos" className="inline-flex min-h-11 items-center underline">Recuperar fotos</Link></nav>
    <SedesCatalogo userId={user.id} />
    <details className="mt-8 border-t border-slate-200 pt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Propuesta de mensajería · ejemplos sin envío</summary><SedesReviewWorkspace /></details>
  </main>
}
