'use client'

import { useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { FileText, Music2, Plus, Search } from 'lucide-react'
import {
  agregarCancionExistenteCompleta,
  crearCancionCompletaYAgregar,
} from '@/app/actions/repertorio-programacion'

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

const inputClass = 'mt-1 w-full rounded-xl bg-white px-3 text-xs font-semibold text-slate-900 outline-none ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-violet-300'
const inputStyle = { color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' } as const

export default function RepertorioBibliotecaPicker({ canciones }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ministerioId = useMemo(() => pathname.match(/\/ministerios\/([^/]+)\/programacion/)?.[1] || '', [pathname])
  const eventoId = searchParams.get('evento') || ''

  const [busqueda, setBusqueda] = useState('')
  const [seleccionada, setSeleccionada] = useState<CancionBiblioteca | null>(null)
  const [tono, setTono] = useState('')

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es')
    if (!q) return canciones.slice(0, 10)
    return canciones
      .filter((song) => `${song.titulo} ${song.artista || ''}`.toLocaleLowerCase('es').includes(q))
      .slice(0, 16)
  }, [busqueda, canciones])

  function elegir(song: CancionBiblioteca) {
    setSeleccionada(song)
    setTono(song.ultimaTonalidad || song.tonalidades[0] || '')
  }

  const agregarExistente = agregarCancionExistenteCompleta.bind(null, ministerioId, eventoId)
  const crearNueva = crearCancionCompletaYAgregar.bind(null, ministerioId, eventoId)

  return (
    <details className="mt-4 overflow-hidden rounded-2xl bg-violet-50 ring-1 ring-violet-200">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-extrabold text-violet-700">
        <Plus className="h-4 w-4" />
        Agregar canción
      </summary>

      <div className="border-t border-violet-200 bg-[#fbfaff] p-3">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-violet-500">1 · Buscar canción</p>
          <label className="relative mt-2 block">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Nombre, versión o artista"
              className="h-11 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 outline-none placeholder:text-slate-400 focus:ring-violet-300"
              style={inputStyle}
            />
          </label>

          {canciones.length > 0 ? (
            <div className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-1.5 ring-1 ring-slate-100">
              {resultados.length ? resultados.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => elegir(song)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${seleccionada?.id === song.id ? 'bg-violet-100 ring-1 ring-violet-200' : 'bg-white active:bg-slate-100'}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600">
                    <Music2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-slate-800">{song.titulo}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                      {song.artista || 'Sin versión / artista'}
                    </span>
                    <span className="mt-0.5 block truncate text-[9px] text-slate-400">
                      {song.tonalidades.length ? `Tonalidades usadas: ${song.tonalidades.join(' · ')}` : 'Sin tonalidad previa'}
                    </span>
                  </span>
                </button>
              )) : (
                <p className="px-3 py-4 text-center text-xs text-slate-400">No encontramos una canción con ese nombre.</p>
              )}
            </div>
          ) : (
            <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-slate-100">La biblioteca está vacía. Crea la primera canción abajo.</p>
          )}
        </div>

        {seleccionada && ministerioId && eventoId && (
          <form action={agregarExistente} className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-violet-200">
            <input type="hidden" name="cancion_id" value={seleccionada.id} />
            <div className="bg-violet-50 px-3 py-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-violet-600">2 · Datos para este servicio</p>
            </div>
            <div className="grid gap-3 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Nombre
                  <input readOnly value={seleccionada.titulo} className={`${inputClass} h-11 bg-slate-50`} style={inputStyle} />
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Versión / artista
                  <input readOnly value={seleccionada.artista || ''} placeholder="Sin versión registrada" className={`${inputClass} h-11 bg-slate-50`} style={inputStyle} />
                </label>
              </div>

              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Tonalidad
                <input
                  name="tonalidad"
                  value={tono}
                  onChange={(event) => setTono(event.target.value)}
                  placeholder="Ej.: G, A, C#m"
                  className={`${inputClass} h-11 text-sm font-extrabold`}
                  style={inputStyle}
                />
              </label>

              {seleccionada.tonalidades.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {seleccionada.tonalidades.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTono(item)}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ring-1 ${tono === item ? 'bg-violet-600 text-white ring-violet-600' : 'bg-white text-slate-600 ring-violet-200'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Observación
                <textarea name="observacion" placeholder="Ej.: iniciar suave, entra batería en el coro…" className={`${inputClass} min-h-16 py-3`} style={inputStyle} />
              </label>

              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Notas de la canción
                <textarea name="notas" placeholder="Intro, cortes, puente, indicaciones para el equipo…" className={`${inputClass} min-h-20 py-3`} style={inputStyle} />
              </label>

              <button className="h-11 rounded-xl bg-violet-600 text-xs font-bold text-white">Agregar al repertorio</button>
            </div>
          </form>
        )}

        <details className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <summary className="flex cursor-pointer list-none items-center gap-2 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700">
            <Plus className="h-4 w-4 text-slate-500" /> Nueva canción en la biblioteca
          </summary>
          {ministerioId && eventoId ? (
            <form action={crearNueva} className="grid gap-3 border-t border-slate-200 p-3">
              <div className="rounded-xl bg-violet-50 px-3 py-2 ring-1 ring-violet-100">
                <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-violet-600"><Music2 className="h-3.5 w-3.5" /> Información de la canción</p>
              </div>

              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Nombre
                <input name="titulo" required placeholder="Nombre de la canción" className={`${inputClass} h-11`} style={inputStyle} />
              </label>

              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Versión / artista
                <input name="artista" placeholder="Ej.: Elevation Worship / versión acústica" className={`${inputClass} h-11`} style={inputStyle} />
              </label>

              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Tonalidad
                <input name="tonalidad" placeholder="Ej.: G" className={`${inputClass} h-11`} style={inputStyle} />
              </label>

              <div className="mt-1 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
                <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-700"><FileText className="h-3.5 w-3.5" /> Indicaciones para el servicio</p>
              </div>

              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Observación
                <textarea name="observacion" placeholder="Observación breve para este domingo" className={`${inputClass} min-h-16 py-3`} style={inputStyle} />
              </label>

              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Notas de la canción
                <textarea name="notas" placeholder="Intro, cortes, puente, dinámica, instrucciones…" className={`${inputClass} min-h-20 py-3`} style={inputStyle} />
              </label>

              <details className="rounded-xl bg-slate-50 ring-1 ring-slate-200">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-bold text-slate-600">Spotify y YouTube · opcional</summary>
                <div className="grid gap-2 border-t border-slate-200 bg-white p-2">
                  <input name="spotify_url" type="url" placeholder="Link de Spotify" className={`${inputClass} mt-0 h-10`} style={inputStyle} />
                  <input name="youtube_url" type="url" placeholder="Link de YouTube" className={`${inputClass} mt-0 h-10`} style={inputStyle} />
                </div>
              </details>

              <button className="h-11 rounded-xl bg-slate-900 text-xs font-bold text-white">Guardar y agregar al servicio</button>
            </form>
          ) : (
            <p className="border-t border-slate-200 p-3 text-xs text-slate-500">Abre primero la programación de un servicio.</p>
          )}
        </details>
      </div>
    </details>
  )
}
