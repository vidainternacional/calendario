import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import BibliotecaAlabanzaClient, { type CancionBibliotecaAlabanza } from '@/components/ministerios/BibliotecaAlabanzaClient'

export const dynamic = 'force-dynamic'

export default async function BibliotecaAlabanzaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient() as any
  const [{ data: ministerio }, { data: profile }, { data: membresia }] = await Promise.all([
    admin.from('ministerios').select('id,nombre,color_primario').eq('id', id).maybeSingle(),
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle(),
  ])

  if (!ministerio) notFound()
  if (!profile || profile.activo !== true || profile.estado_cuenta !== 'activo') redirect('/inicio')
  if (String(ministerio.nombre || '').trim().toLowerCase() !== 'alabanza') redirect(`/ministerios/${id}`)
  if (profile.rol !== 'administrador' && membresia?.es_lider !== true) redirect(`/ministerios/${id}`)

  const { data: rows = [] } = await admin.from('ministerio_canciones').select('id,titulo,artista,spotify_url,youtube_url,tonalidad_base,acordes,letra,notas_permanentes').eq('ministerio_id', id).eq('activo', true).order('titulo').limit(500)

  const canciones: CancionBibliotecaAlabanza[] = (rows as any[]).map((row) => ({
    id: String(row.id), titulo: String(row.titulo || 'Canción'), artista: row.artista || null, spotify_url: row.spotify_url || null, youtube_url: row.youtube_url || null, tonalidad_base: row.tonalidad_base || null, acordes: row.acordes || null, letra: row.letra || null, notas_permanentes: row.notas_permanentes || null,
  }))
  const color = ministerio.color_primario || '#5b3df5'

  return <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+5.25rem)] sm:px-6">
    <header className="pb-5">
      <Link href={`/ministerios/${id}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" /> Alabanza</Link>
      <div className="mt-3 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full text-white" style={{ backgroundColor: color }}><BookOpen className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}>Panel del líder</p><h1 className="mt-0.5 text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">Biblioteca de Alabanza</h1></div></div>
      <p className="mt-3 text-sm leading-6 text-slate-500">Aquí preparas una sola vez la letra, el cifrado, el tono base, las notas y los enlaces de cada canción.</p>
    </header>
    <section className="bg-white px-4 py-4 ring-1 ring-black/[0.04]"><BibliotecaAlabanzaClient ministerioId={id} canciones={canciones} /></section>
  </main>
}
