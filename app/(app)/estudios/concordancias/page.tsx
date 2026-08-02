import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, BookOpen, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buscarConcordanciasBiblicas, listarTemasConcordancia } from '@/lib/estudios/biblical-concordance'

export const metadata: Metadata = { title: 'Concordancias Bíblicas' }

const RELATION_LABELS = {
  direct: 'Mención directa',
  conceptual: 'Relación temática',
  cross_reference: 'Referencia relacionada',
  original_language: 'Idioma original',
} as const

export default async function ConcordanciasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { q = '' } = await searchParams
  const search = q.trim()
  const [response, temas] = await Promise.all([
    search ? buscarConcordanciasBiblicas(search) : Promise.resolve({ query: '', results: [] }),
    listarTemasConcordancia(80),
  ])

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/estudios" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-600 hover:bg-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Estudios
      </Link>

      <header className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0392B]">Buscar en la Biblia</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Concordancias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Escriba una palabra, situación o pregunta. El buscador relaciona temas, sinónimos e intenciones revisadas dentro de la biblioteca interna.
        </p>
      </header>

      <form className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" action="/estudios/concordancias" method="get">
        <label htmlFor="q" className="sr-only">Palabra, tema o pregunta</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="q"
              name="q"
              defaultValue={search}
              placeholder="Ejemplo: ¿cómo vencer el miedo?, matrimonio, perdón..."
              className="min-h-13 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/20"
            />
          </div>
          <button className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#C0392B] px-7 text-sm font-bold text-white shadow-sm hover:bg-[#a93226]" type="submit">
            <Search className="h-4 w-4" aria-hidden="true" />
            Buscar
          </button>
        </div>
      </form>

      {!search && (
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-[#C0392B]" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-slate-900">Explore temas</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                También puede escribir una pregunta con sus propias palabras. Estas sugerencias son solo un punto de partida.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {temas.map(tema => (
              <Link
                key={tema.id}
                href={`/estudios/concordancias?q=${encodeURIComponent(tema.term)}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#C0392B]/30 hover:bg-red-50 hover:text-[#C0392B]"
              >
                {tema.term}
              </Link>
            ))}
          </div>
        </section>
      )}

      {search && response.results.length === 0 && (
        <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-950">No encontramos una relación aprobada</h2>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Pruebe con otra forma de expresar “{search}” o seleccione un tema del catálogo. La aplicación no completó la respuesta con información inventada.
          </p>
          <details className="mt-4 rounded-2xl border border-amber-200 bg-white/70">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-amber-900 [&::-webkit-details-marker]:hidden">
              Ver temas disponibles
            </summary>
            <div className="flex flex-wrap gap-2 border-t border-amber-100 p-4">
              {temas.map(tema => (
                <Link key={tema.id} href={`/estudios/concordancias?q=${encodeURIComponent(tema.term)}`} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
                  {tema.term}
                </Link>
              ))}
            </div>
          </details>
        </section>
      )}

      {response.results.length > 0 && (
        <section className="mt-5 space-y-4" aria-label="Resultados de concordancias">
          {response.results.map(result => (
            <article key={result.termId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-lg font-bold text-slate-950">{result.term}</h2>
                {result.description && <p className="mt-1 text-sm leading-6 text-slate-500">{result.description}</p>}
              </header>
              <div className="divide-y divide-slate-100">
                {result.matches.map(match => (
                  <Link
                    key={`${result.termId}-${match.bookCode}-${match.chapter}-${match.verse}-${match.relationKind}`}
                    href={`/biblia?book=${encodeURIComponent(match.bookCode)}&chapter=${match.chapter}&verse=${match.verse}`}
                    className="block px-5 py-4 hover:bg-slate-50 sm:px-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{match.reference}</h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {RELATION_LABELS[match.relationKind]}
                      </span>
                    </div>
                    {match.excerpt && <p className="mt-2 text-sm leading-6 text-slate-600">{match.excerpt}</p>}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      <details className="mt-5 rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-4 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
          Cómo funciona esta búsqueda
        </summary>
        <div className="border-t border-slate-100 px-4 py-4 text-sm leading-6 text-slate-600">
          La búsqueda normaliza acentos, descarta palabras comunes, identifica términos importantes y compara la pregunta con temas, sinónimos, transliteraciones e intenciones previamente revisadas. Las referencias conservan fuente, licencia, localizador y estado de aprobación.
        </div>
      </details>
    </main>
  )
}
