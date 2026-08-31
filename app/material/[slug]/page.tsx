import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LockKeyhole, ShieldAlert } from 'lucide-react'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import MaterialPastoralExperience from '@/components/pastoral/MaterialPastoralExperience'
import type { DiapositivaCanvas, RecursoPastoral } from '@/components/pastoral/pastoral-canvas-model'

export const metadata: Metadata = { title: 'Material Pastoral' }

function etiquetaAudiencia(audiencia: string) {
  return audiencia === 'lideres' ? 'Líderes'
    : audiencia === 'servidores' ? 'Servidores'
      : 'Toda la congregación'
}

function AccesoRestringido({ slug, audiencia, requiereLogin }: { slug: string; audiencia: string; requiereLogin: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7fb] px-4 py-10">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">{requiereLogin ? <LockKeyhole className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}</span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Material para {etiquetaAudiencia(audiencia).toLowerCase()}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{requiereLogin ? 'Inicia sesión para continuar' : 'Este material requiere otro nivel de acceso'}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{requiereLogin ? 'Todos los materiales pastorales de VIDA requieren una cuenta activa.' : 'Tu cuenta está activa, pero este contenido fue dirigido a un equipo o rol diferente.'}</p>
        {requiereLogin ? <Link href={`/login?next=${encodeURIComponent(`/material/${slug}`)}`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">Iniciar sesión</Link> : <Link href="/inicio" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-700">Volver al inicio</Link>}
      </section>
    </main>
  )
}

function idsRecursos(diapositivas: DiapositivaCanvas[]) {
  const ids = new Set<string>()
  const agregar = (valor: unknown) => {
    const id = String(valor ?? '')
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) ids.add(id)
  }
  diapositivas.forEach((pagina) => {
    agregar(pagina.recurso_id)
    agregar(pagina.fondo_recurso_id)
    ;(pagina.elementos ?? []).forEach((elemento) => agregar(elemento.recurso_id))
  })
  return Array.from(ids).slice(0, 60)
}

export default async function MaterialPastoralPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!/^[0-9a-f-]{36}$/i.test(slug)) notFound()

  const supabase = await createClient()
  const { data, error } = await (supabase as any).rpc('get_public_pastoral_package', { p_slug: slug })
  if (error || !data) notFound()

  const material = data as any
  if (material.access === 'login_required') return <AccesoRestringido slug={slug} audiencia={material.audiencia} requiereLogin />
  if (material.access === 'forbidden') return <AccesoRestringido slug={slug} audiencia={material.audiencia} requiereLogin={false} />
  if (material.access !== 'granted') notFound()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <AccesoRestringido slug={slug} audiencia={material.audiencia} requiereLogin />

  const diapositivas = Array.isArray(material.presentacion_diapositivas) ? material.presentacion_diapositivas as DiapositivaCanvas[] : []
  const recursoIds = idsRecursos(diapositivas)
  const biblioteca: RecursoPastoral[] = []

  if (recursoIds.length > 0) {
    const admin = createAdminClient()
    const { data: paquete } = await (admin as any).from('pastoral_paquetes').select('profile_id').eq('id', material.id).maybeSingle()
    if (paquete?.profile_id) {
      const { data: recursos } = await (admin as any)
        .from('pastoral_biblioteca')
        .select('id, titulo, descripcion, categoria, tipo, url, storage_path, mime_type, nombre_archivo')
        .eq('profile_id', paquete.profile_id)
        .in('id', recursoIds)

      for (const item of recursos ?? []) {
        let accesoUrl: string | null = item.tipo === 'enlace' ? item.url : null
        if (item.tipo === 'archivo' && item.storage_path) {
          const { data: signed } = await admin.storage.from('pastoral-library').createSignedUrl(item.storage_path, 60 * 60 * 6)
          accesoUrl = signed?.signedUrl ?? null
        }
        biblioteca.push({
          id: item.id,
          titulo: item.titulo,
          descripcion: item.descripcion ?? '',
          categoria: item.categoria ?? '',
          tipo: item.tipo,
          acceso_url: accesoUrl,
          mime_type: item.mime_type,
          nombre_archivo: item.nombre_archivo,
        })
      }
    }
  }

  return <MaterialPastoralExperience material={{ ...material, presentacion_diapositivas: diapositivas }} biblioteca={biblioteca} userId={user.id} />
}
