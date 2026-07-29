import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Library, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BibliotecaPastoralClient from '@/components/pastoral/BibliotecaPastoralClient'
import PastoralPageHeader from '@/components/pastoral/PastoralPageHeader'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Biblioteca Pastoral' }

export default async function BibliotecaPastoralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('No fue posible verificar el acceso a la Biblioteca Pastoral.')
  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const { data, error } = await (supabase as any)
    .from('pastoral_biblioteca')
    .select('id, titulo, descripcion, categoria, etiquetas, tipo, url, storage_path, nombre_archivo, mime_type, tamano_bytes, updated_at')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('No fue posible cargar los recursos de la Biblioteca Pastoral.')

  const recursos = await Promise.all((data ?? []).map(async (recurso: any) => {
    if (recurso.tipo !== 'archivo' || !recurso.storage_path) return { ...recurso, signed_url: null }
    const { data: signed } = await supabase.storage
      .from('pastoral-library')
      .createSignedUrl(recurso.storage_path, 60 * 60)
    return { ...recurso, signed_url: signed?.signedUrl ?? null }
  }))

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <PastoralPageHeader
        eyebrow="Recursos"
        title="Biblioteca"
        description="Guarda archivos y enlaces para reutilizarlos en mensajes, estudios y materiales."
        icon={Library}
      />

      <details className="pastoral-help-card">
        <summary>
          <span className="flex items-center gap-2"><Tag className="h-4 w-4" aria-hidden="true" /> Cómo organizar los recursos</span>
        </summary>
        <div className="pastoral-help-content">
          <p><strong>Categoría:</strong> elige un grupo principal, como Estudios o Liderazgo.</p>
          <p><strong>Etiquetas:</strong> agrega palabras breves para encontrar el recurso después. Sepáralas con comas.</p>
          <p>La búsqueda revisa el título, la descripción, la categoría y las etiquetas.</p>
        </div>
      </details>

      <BibliotecaPastoralClient recursos={recursos as any} />
    </main>
  )
}
