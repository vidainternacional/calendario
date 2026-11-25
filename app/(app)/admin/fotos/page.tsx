import Link from 'next/link'
import RecuperarFotosButton from '@/components/admin/RecuperarFotosButton'

export default function FotosAnterioresPage() {
  return <main className="mx-auto max-w-2xl px-5 pb-28 pt-24 text-slate-900">
    <Link href="/admin" className="inline-flex min-h-11 items-center text-sm font-semibold">← Administración</Link>
    <h1 className="mt-5 text-2xl font-bold">Recuperar fotografías</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">Las fotografías recuperadas se guardan en ccvida, la base que utiliza la aplicación habitual.</p>
    <RecuperarFotosButton />
    <Link href="/admin/sedes" className="mt-5 inline-flex min-h-11 items-center font-semibold underline">Continuar con sedes y mensajería →</Link>
  </main>
}
