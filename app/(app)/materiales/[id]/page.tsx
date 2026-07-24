import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, BookOpen, CalendarDays, Church, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Material para la iglesia' }

function etiquetaAudiencia(audiencia: string) {
  return {
    iglesia: 'Toda la iglesia',
    lideres: 'Líderes',
    servidores: 'Servidores',
    publico: 'Público',
  }[audiencia] ?? 'Iglesia'
}

export default async function MaterialInternoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/materiales/${id}`)}`)

  const { data, error } = await (supabase as any).rpc('get_internal_pastoral_package', { p_id: id })
  if (error || !data) notFound()

  const material = data as any
  if (material.access === 'login_required') redirect(`/login?next=${encodeURIComponent(`/materiales/${id}`)}`)

  if (material.access === 'forbidden') {
    return (
      <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
        <Link href="/inicio" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-amber-800"><ArrowLeft className="h-4 w-4" /> Volver al inicio</Link>
        <section className="mt-5 rounded-[26px] border border-amber-100 bg-white p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800"><ShieldAlert className="h-7 w-7" /></span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Material para {etiquetaAudiencia(material.audiencia).toLowerCase()}</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Este material requiere otro nivel de acceso</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Tu cuenta está activa, pero el contenido fue dirigido a otro equipo o rol.</p>
        </section>
      </main>
    )
  }

  if (material.access !== 'granted') notFound()

  const bosquejo = material.bosquejo as any | null
  const coleccion = material.coleccion as any | null
  const puntos = Array.isArray(bosquejo?.puntos) ? bosquejo.puntos : []
  const versiculos = Array.isArray(coleccion?.versiculos) ? coleccion.versiculos : []

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <Link href="/inicio" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-amber-800"><ArrowLeft className="h-4 w-4" /> Volver al inicio</Link>
      <article className="overflow-hidden rounded-[28px] border border-amber-100 bg-white shadow-sm">
        <header className="bg-gradient-to-br from-amber-950 via-stone-900 to-slate-950 px-6 py-9 text-white sm:px-10 sm:py-12">
          <div className="flex items-center gap-2 text-amber-200"><Church className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Material de Vida Internacional</span></div>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">{material.titulo}</h1>
          {material.descripcion_publica && <p className="mt-5 max-w-3xl whitespace-pre-wrap text-base leading-8 text-white/80 sm:text-lg">{material.descripcion_publica}</p>}
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/80">
            <span className="rounded-full bg-white/10 px-3 py-1.5">{etiquetaAudiencia(material.audiencia)}</span>
            {material.published_at && <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Intl.DateTimeFormat('es-SV', { dateStyle: 'long' }).format(new Date(material.published_at))}</span>}
          </div>
        </header>

        <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-12">
          {bosquejo && <section>
            <div className="flex items-center gap-2 text-amber-800"><BookOpen className="h-5 w-5" /><h2 className="text-lg font-bold">Mensaje principal</h2></div>
            <div className="mt-4 rounded-2xl bg-amber-50 p-5 sm:p-6">
              <h3 className="text-2xl font-bold text-slate-950">{bosquejo.titulo}</h3>
              {bosquejo.pasaje_base && <p className="mt-2 font-semibold text-amber-800">{bosquejo.pasaje_base}</p>}
              {bosquejo.proposito && <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-700">{bosquejo.proposito}</p>}
            </div>
          </section>}

          {versiculos.length > 0 && <section>
            <h2 className="text-xl font-bold text-slate-950">Versículos para estudiar</h2>
            <div className="mt-4 space-y-4">
              {versiculos.map((versiculo: any, index: number) => <article key={`${versiculo.referencia}-${index}`} className="rounded-2xl border border-slate-200 p-5">
                <p className="font-bold text-amber-800">{versiculo.referencia} <span className="text-xs font-normal text-slate-400">{versiculo.traduccion}</span></p>
                <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-700">{versiculo.texto}</p>
              </article>)}
            </div>
          </section>}

          {bosquejo?.introduccion && <section><h2 className="text-xl font-bold text-slate-950">Introducción</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{bosquejo.introduccion}</p></section>}

          {puntos.length > 0 && <section>
            <h2 className="text-xl font-bold text-slate-950">Desarrollo</h2>
            <div className="mt-5 space-y-7">
              {puntos.map((punto: any, index: number) => <article key={index}>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Punto {index + 1}</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{punto.titulo || `Punto ${index + 1}`}</h3>
                {punto.contenido && <p className="mt-2 whitespace-pre-wrap text-base leading-8 text-slate-700">{punto.contenido}</p>}
              </article>)}
            </div>
          </section>}

          {bosquejo?.conclusion && <section><h2 className="text-xl font-bold text-slate-950">Conclusión</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{bosquejo.conclusion}</p></section>}

          {material.instrucciones && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6"><h2 className="text-lg font-bold text-amber-950">Aplicación para la semana</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-amber-950/80">{material.instrucciones}</p></section>}
        </div>
      </article>
    </main>
  )
}
