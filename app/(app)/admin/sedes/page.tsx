import Link from 'next/link'
import SedesReviewWorkspace from '@/components/admin/SedesReviewWorkspace'

export default function SedesReviewPage() {
  return <main className="mx-auto max-w-3xl px-5 pb-28 pt-24 text-slate-900">
    <nav className="flex flex-wrap gap-4 text-sm font-semibold"><Link href="/admin" className="inline-flex min-h-11 items-center">← Administración</Link><Link href="/admin/fotos" className="inline-flex min-h-11 items-center underline">Recuperar fotos</Link></nav>
    <SedesReviewWorkspace />
  </main>
}
