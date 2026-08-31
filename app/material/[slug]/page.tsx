import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LockKeyhole, ShieldAlert } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import MaterialPastoralExperience from '@/components/pastoral/MaterialPastoralExperience'

export const metadata: Metadata = { title: 'Material Pastoral' }

function etiquetaAudiencia(audiencia: string) {
  return {
    iglesia: 'Toda la congregación',
    publico: 'Toda la congregación',
    lideres: 'Líderes',
    servidores: 'Servidores',
  }[audiencia] ?? 'Congregación'
}

function AccesoRestringido({ slug, audiencia, requiereLogin }: { slug: string; audiencia: string; requiereLogin: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7fb] px-4 py-10">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
          {requiereLogin ? <LockKeyhole className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Material para {etiquetaAudiencia(audiencia).toLowerCase()}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{requiereLogin ? 'Inicia sesión para continuar' : 'Este material requiere otro nivel de acceso'}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {requiereLogin ? 'Este contenido está disponible para personas registradas en Vida Internacional.' : 'Tu cuenta está activa, pero este contenido fue dirigido a un equipo o rol diferente.'}
        </p>
        <Link href={requiereLogin ? `/login?next=${encodeURIComponent(`/material/${slug}`)}` : '/inicio'} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">
          {requiereLogin ? 'Iniciar sesión' : 'Volver al inicio'}
        </Link>
      </section>
    </main>
  )
}

export default async function MaterialPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!/^[0-9a-f-]{36}$/i.test(slug)) notFound()

  const supabase = await createClient()
  let publicSlug = slug

  const { data: paquetePorId } = await (supabase as any).from('pastoral_paquetes').select('public_slug').eq('id', slug).maybeSingle()
  if (paquetePorId?.public_slug) publicSlug = paquetePorId.public_slug

  const { data, error } = await (supabase as any).rpc('get_public_pastoral_package', { p_slug: publicSlug })
  if (error || !data) notFound()

  const material = data as any
  if (material.access === 'login_required') return <AccesoRestringido slug={publicSlug} audiencia={material.audiencia} requiereLogin />
  if (material.access === 'forbidden') return <AccesoRestringido slug={publicSlug} audiencia={material.audiencia} requiereLogin={false} />
  if (material.access !== 'granted') notFound()

  const paginas = Array.isArray(material.presentacion_diapositivas) ? material.presentacion_diapositivas : []
  const recursoIds = Array.from(new Set(paginas.flatMap((pagina: any) => [pagina?.recurso_id, pagina?.fondo_recurso_id, ...(Array.isArray(pagina?.elementos) ? pagina.elementos.map((elemento: any) => elemento?.recurso_id) : [])]).filter(Boolean))) as string[]

  const biblioteca: any[] = []
  if (recursoIds.length) {
    const admin = createAdminClient()
    const { data: recursos } = await (admin as any)
      .from('pastoral_biblioteca')
      .select('id, titulo, descripcion, categoria, tipo, url, storage_path, mime_type, nombre_archivo')
      .in('id', recursoIds.slice(0, 30))

    for (const item of recursos ?? []) {
      let acceso_url: string | null = item.tipo === 'enlace' ? item.url : null
      if (item.tipo === 'archivo' && item.storage_path) {
        const { data: signed } = await (admin as any).storage.from('pastoral-library').createSignedUrl(item.storage_path, 60 * 60)
        acceso_url = signed?.signedUrl ?? null
      }
      biblioteca.push({ ...item, acceso_url })
    }
  }

  return <MaterialPastoralExperience material={material} biblioteca={biblioteca} />
}
