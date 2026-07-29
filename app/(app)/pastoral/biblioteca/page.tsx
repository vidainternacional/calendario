import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Library, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BibliotecaPastoralClient from '@/components/pastoral/BibliotecaPastoralClient'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Biblioteca Pastoral' }

export default async function BibliotecaPastoralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const { data } = await (supabase as any)
    .from('pastoral_biblioteca')
    .select('id, titulo, descripcion, categoria, etiquetas, tipo, url, storage_path, nombre_archivo, mime_type, tamano_bytes, updated_at')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  const recursos = await Promise.all((data ?? []).map(async (recurso: any) => {
    if (recurso.tipo !== 'archivo' || !recurso.storage_path) return { ...recurso, signed_url: null }
    const { data: signed } = await supabase.storage
      .from('pastoral-library')
      .createSignedUrl(recurso.storage_path, 60 * 60)
    return { ...recurso, signed_url: signed?.signedUrl ?? null }
  }))

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <Link href="/pastoral" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-indigo-700"><ArrowLeft className="h-4 w-4" /> Centro Pastoral</Link>
      <header className="mb-5 mt-3">
        <div className="flex items-center gap-2 text-indigo-600"><Library className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Recursos del pastor</p></div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Biblioteca Pastoral</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Guarde archivos y enlaces para volver a usarlos en prédicas, estudios y paquetes pastorales.</p>
      </header>

      <section className="mb-6 rounded-[20px] border border-indigo-100 bg-indigo-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm"><Tag className="h-5 w-5" /></span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Cómo organizar sus recursos</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600"><strong>Categoría:</strong> es el grupo principal, por ejemplo “Estudios” o “Liderazgo”. Solo se elige una.</p>
            <p className="mt-1 text-xs leading-5 text-slate-600"><strong>Etiquetas:</strong> son palabras libres que ayudan a encontrar el recurso después, por ejemplo “toros”, “jóvenes”, “fe” o “familia”. Puede escribir varias separadas por comas.</p>
            <p className="mt-2 text-xs font-semibold text-indigo-700">Al buscar una palabra, la Biblioteca también revisa las etiquetas.</p>
          </div>
        </div>
      </section>

      <BibliotecaPastoralClient recursos={recursos as any} />
    </main>
  )
}
