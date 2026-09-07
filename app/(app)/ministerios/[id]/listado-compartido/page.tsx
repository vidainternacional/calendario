import { CalendarDays, ExternalLink, Music2 } from 'lucide-react'
import { obtenerListadosCompartidosMinisterio } from '@/app/actions/repertorio-compartido'

export const dynamic = 'force-dynamic'

function fechaServicio(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: 'America/El_Salvador',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function ListadoCompartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listados = await obtenerListadosCompartidosMinisterio(id)

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+5.5rem)] sm:px-6">
      <header className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Preparación del servicio</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#171923]">Listados compartidos</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">Canciones y versiones compartidas por otros ministerios para preparar este servicio.</p>
      </header>

      {listados.length === 0 ? (
        <div className="rounded-[24px] bg-white px-5 py-12 text-center ring-1 ring-black/[0.04]">
          <Music2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">No hay listados compartidos en este momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listados.map((listado) => (
            <section key={listado.id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.04]">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-violet-600">Listado compartido por {listado.ministerioOrigenNombre}</p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-900">{listado.eventoTitulo}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{fechaServicio(listado.fechaInicio)}</p>
              </div>

              <div className="divide-y divide-slate-100">
                {listado.canciones.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-400">Todavía no hay canciones en este listado.</p>
                ) : listado.canciones.map((cancion, index) => (
                  <div key={cancion.id} className="flex min-h-[66px] items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-extrabold text-violet-600">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-800">{cancion.titulo}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{cancion.artista || 'Versión no especificada'}</p>
                    </div>
                    {(cancion.spotifyUrl || cancion.youtubeUrl) ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {cancion.spotifyUrl ? <a href={cancion.spotifyUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-500" aria-label={`Abrir ${cancion.titulo} en Spotify`}>Spotify <ExternalLink className="inline h-3 w-3" /></a> : null}
                        {cancion.youtubeUrl ? <a href={cancion.youtubeUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-500" aria-label={`Abrir ${cancion.titulo} en YouTube`}>YouTube <ExternalLink className="inline h-3 w-3" /></a> : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
