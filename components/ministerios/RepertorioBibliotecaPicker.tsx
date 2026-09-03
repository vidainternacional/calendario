'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, Music2, Plus, Search, X } from 'lucide-react'
import {
  agregarCancionExistenteCompleta,
  crearCancionCompletaYAgregar,
  obtenerBibliotecaRepertorioMinisterio,
} from '@/app/actions/repertorio-programacion'

export type CancionBiblioteca = {
  id: string
  titulo: string
  artista?: string | null
  spotify_url?: string | null
  youtube_url?: string | null
  tonalidades: string[]
  ultimaTonalidad?: string | null
  recuperada?: boolean
}

type ServerAction = (formData: FormData) => void | Promise<void>

type Props = {
  canciones: CancionBiblioteca[]
  agregarAction: ServerAction
  crearAction: ServerAction
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400'
const inputStyle = { color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' } as const

export default function RepertorioBibliotecaPicker({ canciones }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ministerioId = useMemo(() => pathname.match(/\/ministerios\/([^/]+)\/programacion/)?.[1] || '', [pathname])
  const eventoId = searchParams.get('evento') || ''

  const [biblioteca, setBiblioteca] = useState<CancionBiblioteca[]>(canciones)
  const [agregando, setAgregando] = useState(false)
  const [creando, setCreando] = useState(false)
  const [linksAbiertos, setLinksAbiertos] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionada, setSeleccionada] = useState<CancionBiblioteca | null>(null)
  const [tono, setTono] = useState('')

  useEffect(() => {
    setBiblioteca(canciones)
    if (!ministerioId) return

    let cancelled = false
    void obtenerBibliotecaRepertorioMinisterio(ministerioId)
      .then((items) => {
        if (!cancelled) setBiblioteca(items as CancionBiblioteca[])
      })
      .catch((error) => console.error('No se pudo recuperar la biblioteca histórica de repertorio', error))

    return () => { cancelled = true }
  }, [canciones, ministerioId])

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es')
    if (!q) return biblioteca.slice(0, 12)
    return biblioteca
      .filter((song) => `${song.titulo} ${song.artista || ''}`.toLocaleLowerCase('es').includes(q))
      .slice(0, 20)
  }, [busqueda, biblioteca])

  function elegir(song: CancionBiblioteca) {
    setSeleccionada(song)
    setTono(song.ultimaTonalidad || song.tonalidades[0] || '')
    setCreando(false)
  }

  const agregarExistente = agregarCancionExistenteCompleta.bind(null, ministerioId, eventoId)
  const crearNueva = crearCancionCompletaYAgregar.bind(null, ministerioId, eventoId)

  return (
    <div className="mt-5 border-t border-slate-200 pt-4 text-slate-900">
      <button
        type="button"
        onClick={() => {
          setAgregando((value) => !value)
          setSeleccionada(null)
          setCreando(false)
          setLinksAbiertos(false)
        }}
        className="flex min-h-11 w-full items-center justify-between text-left text-sm font-extrabold text-violet-700"
        aria-expanded={agregando}
      >
        <span className="inline-flex items-center gap-2">{agregando ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}Agregar canción</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${agregando ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-all duration-200 ease-out ${agregando ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="pb-2 pt-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por nombre, versión o artista"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
                style={inputStyle}
              />
            </label>

            <div className="mt-3 max-h-64 overflow-y-auto border-y border-slate-200">
              {resultados.length ? resultados.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => elegir(song)}
                  className={`flex min-h-[58px] w-full items-center gap-3 border-b border-slate-100 px-1 py-2.5 text-left last:border-b-0 ${seleccionada?.id === song.id ? 'bg-violet-50/70' : ''}`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600"><Music2 className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-800">{song.titulo}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-400">{song.artista || 'Sin versión registrada'}{song.tonalidades.length ? ` · tonos: ${song.tonalidades.join(' · ')}` : ''}</span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              )) : <p className="py-5 text-center text-sm text-slate-400">No encontramos esa canción.</p>}
            </div>

            {seleccionada && ministerioId && eventoId ? (
              <form action={agregarExistente} className="mt-4 grid gap-3 border-b border-slate-200 pb-4">
                <input type="hidden" name="cancion_id" value={seleccionada.id} />
                <input type="hidden" name="observacion" value="" />
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{seleccionada.titulo}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{seleccionada.artista || 'Canción de la biblioteca'}</p>
                </div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Tono de este servicio
                  <input name="tonalidad" value={tono} onChange={(event) => setTono(event.target.value)} placeholder="Ej. G, A, C#m" className={`${inputClass} h-11 font-extrabold`} style={inputStyle} />
                </label>
                {seleccionada.tonalidades.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {seleccionada.tonalidades.map((item) => (
                      <button key={item} type="button" onClick={() => setTono(item)} className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${tono === item ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{item}</button>
                    ))}
                  </div>
                ) : null}
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Indicación del servicio
                  <textarea name="notas" placeholder="Entrada, cortes, dinámica o cualquier indicación para este servicio" className={`${inputClass} min-h-20 resize-y py-3`} style={inputStyle} />
                </label>
                <button className="h-11 rounded-xl bg-violet-600 text-xs font-bold text-white">Agregar al repertorio</button>
              </form>
            ) : null}

            <button
              type="button"
              onClick={() => { setCreando((value) => !value); setSeleccionada(null); setLinksAbiertos(false) }}
              className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-extrabold text-slate-600"
              aria-expanded={creando}
            >
              {creando ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {creando ? 'Cancelar nueva canción' : 'No está en la lista · crear nueva'}
            </button>

            <div className={`grid transition-all duration-200 ease-out ${creando ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                {ministerioId && eventoId ? (
                  <form action={crearNueva} className="grid gap-3 border-t border-slate-200 pb-1 pt-4">
                    <input type="hidden" name="observacion" value="" />
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Nombre<input name="titulo" required placeholder="Nombre de la canción" className={`${inputClass} h-11 font-semibold`} style={inputStyle} /></label>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Versión / artista<input name="artista" placeholder="Ej. versión acústica" className={`${inputClass} h-11`} style={inputStyle} /></label>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tono de este servicio<input name="tonalidad" placeholder="Ej. G" className={`${inputClass} h-11 font-extrabold`} style={inputStyle} /></label>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Indicación del servicio<textarea name="notas" placeholder="Entrada, cortes, dinámica o indicación para este servicio" className={`${inputClass} min-h-20 resize-y py-3`} style={inputStyle} /></label>

                    <button type="button" onClick={() => setLinksAbiertos((value) => !value)} className="flex min-h-10 items-center justify-between border-y border-slate-200 text-left text-[10px] font-bold text-slate-500" aria-expanded={linksAbiertos}>
                      Spotify y YouTube · opcional <ChevronDown className={`h-4 w-4 transition-transform ${linksAbiertos ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`grid transition-all duration-200 ease-out ${linksAbiertos ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden"><div className="grid gap-2 py-1"><input name="spotify_url" type="url" placeholder="Link de Spotify" className={`${inputClass} mt-0 h-10`} style={inputStyle} /><input name="youtube_url" type="url" placeholder="Link de YouTube" className={`${inputClass} mt-0 h-10`} style={inputStyle} /></div></div>
                    </div>

                    <button className="h-11 rounded-xl bg-slate-900 text-xs font-bold text-white">Guardar y agregar</button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
