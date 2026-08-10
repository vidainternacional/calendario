'use client'

import { useMemo, useState } from 'react'
import { Music2, Plus, Search } from 'lucide-react'

export type CancionBiblioteca = {
  id: string
  titulo: string
  artista?: string | null
  spotify_url?: string | null
  youtube_url?: string | null
  tonalidades: string[]
  ultimaTonalidad?: string | null
}

type ServerAction = (formData: FormData) => void | Promise<void>

type Props = {
  canciones: CancionBiblioteca[]
  agregarAction: ServerAction
  crearAction: ServerAction
}

export default function RepertorioBibliotecaPicker({ canciones, agregarAction, crearAction }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [seleccionada, setSeleccionada] = useState<CancionBiblioteca | null>(null)
  const [tono, setTono] = useState('')

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es')
    if (!q) return canciones.slice(0, 8)
    return canciones
      .filter((song) => `${song.titulo} ${song.artista || ''}`.toLocaleLowerCase('es').includes(q))
      .slice(0, 12)
  }, [busqueda, canciones])

  function elegir(song: CancionBiblioteca) {
    setSeleccionada(song)
    setTono(song.ultimaTonalidad || song.tonalidades[0] || '')
  }

  return (
    <details className="mt-3 overflow-hidden rounded-2xl bg-violet-50 ring-1 ring-violet-100">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-extrabold text-violet-700">
        <Plus className="h-4 w-4" />
        Agregar canción
      </summary>

      <div className="border-t border-violet-100 bg-white p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar en la biblioteca de Alabanza"
            className="h-11 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-100 outline-none focus:ring-violet-200"
          />
        </label>

        {canciones.length > 0 ? (
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-1.5">
            {resultados.length ? resultados.map((song) => (
              <button
                key={song.id}
                type="button"
                onClick={() => elegir(song)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${seleccionada?.id === song.id ? 'bg-violet-100' : 'bg-white active:bg-slate-100'}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600">
                  <Music2 className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-extrabold text-slate-800">{song.titulo}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                    {song.artista ? `${song.artista} · ` : ''}
                    {song.tonalidades.length ? `Tonos usados: ${song.tonalidades.join(' · ')}` : 'Sin tonalidad previa'}
                  </span>
                </span>
              </button>
            )) : (
              <p className="px-3 py-4 text-center text-xs text-slate-400">No encontramos una canción con ese nombre.</p>
            )}
          </div>
        ) : (
          <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">La biblioteca está vacía. Agrega la primera canción abajo.</p>
        )}

        {seleccionada && (
          <form action={agregarAction} className="mt-3 rounded-2xl bg-violet-50 p-3 ring-1 ring-violet-100">
            <input type="hidden" name="cancion_id" value={seleccionada.id} />
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Seleccionada</p>
            <p className="mt-1 text-sm font-extrabold text-slate-800">{seleccionada.titulo}</p>
            {seleccionada.artista && <p className="text-xs text-slate-500">{seleccionada.artista}</p>}

            {seleccionada.tonalidades.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {seleccionada.tonalidades.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTono(item)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ring-1 ${tono === item ? 'bg-violet-600 text-white ring-violet-600' : 'bg-white text-slate-600 ring-violet-100'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Tonalidad para este servicio
              <input
                name="tonalidad"
                value={tono}
                onChange={(event) => setTono(event.target.value)}
                placeholder="Ej.: G, A, C#m"
                className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-sm font-extrabold text-slate-800 ring-1 ring-violet-100"
              />
            </label>
            <button className="mt-2 h-11 w-full rounded-xl bg-violet-600 text-xs font-bold text-white">Agregar al repertorio</button>
          </form>
        )}

        <details className="mt-3 rounded-xl bg-slate-50 ring-1 ring-slate-100">
          <summary className="cursor-pointer list-none px-3 py-3 text-xs font-bold text-slate-600">＋ Nueva canción en la biblioteca</summary>
          <form action={crearAction} className="grid gap-2 border-t border-slate-100 bg-white p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Canción
                <input name="titulo" required placeholder="Nombre" className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-3 text-xs font-semibold" />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Tono
                <input name="tonalidad" placeholder="G" className="mt-1 h-10 w-full rounded-xl bg-slate-50 px-2 text-center text-xs font-extrabold" />
              </label>
            </div>
            <input name="artista" placeholder="Artista / versión (opcional)" className="h-10 w-full rounded-xl bg-slate-50 px-3 text-xs" />
            <details className="rounded-xl bg-slate-50">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-bold text-slate-500">Spotify y YouTube (opcional)</summary>
              <div className="grid gap-2 border-t border-slate-100 bg-white p-2">
                <input name="spotify_url" type="url" placeholder="Link de Spotify" className="h-10 w-full rounded-xl bg-slate-50 px-3 text-xs" />
                <input name="youtube_url" type="url" placeholder="Link de YouTube" className="h-10 w-full rounded-xl bg-slate-50 px-3 text-xs" />
              </div>
            </details>
            <button className="h-11 rounded-xl bg-slate-900 text-xs font-bold text-white">Guardar y agregar</button>
          </form>
        </details>
      </div>
    </details>
  )
}
