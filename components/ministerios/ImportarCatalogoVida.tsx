'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { importarCatalogoCancionesVida, revisarCatalogoCancionesVida } from '@/app/actions/biblioteca-alabanza'
import { MINISTERIO_CATALOGO_VIDA, type RevisionCatalogoVida } from '@/lib/musica/catalogo-vida'

export default function ImportarCatalogoVida({ ministerioId, prepararFicha }: {
  ministerioId: string
  prepararFicha: (song: RevisionCatalogoVida) => void
}) {
  const router = useRouter()
  const [canciones, setCanciones] = useState<RevisionCatalogoVida[] | null>(null)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [filtro, setFiltro] = useState('identificadas')
  const [busqueda, setBusqueda] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const bloqueo = useRef(false)
  if (ministerioId !== MINISTERIO_CATALOGO_VIDA) return null

  async function cargar() {
    if (bloqueo.current || canciones) return
    bloqueo.current = true; setOcupado(true)
    try {
      const result = await revisarCatalogoCancionesVida(ministerioId)
      if (result.error) setMensaje(result.error)
      else { setCanciones(result.canciones || []); setMensaje('Revisa la referencia y selecciona las fichas que deseas incorporar.') }
    } catch { setMensaje('No se pudo cargar. Vuelve a intentarlo.') }
    finally { bloqueo.current = false; setOcupado(false) }
  }

  async function importar() {
    if (bloqueo.current || !seleccion.size) return
    bloqueo.current = true; setOcupado(true)
    const ids = [...seleccion]
    const terminadas = new Set<string>()
    let creadas = 0; let omitidas = 0; let fallidas = 0
    try {
      for (let inicio = 0; inicio < ids.length; inicio += 20) {
        setMensaje(`Guardando ${inicio + 1}–${Math.min(inicio + 20, ids.length)} de ${ids.length}…`)
        const result = await importarCatalogoCancionesVida(ministerioId, ids.slice(inicio, inicio + 20))
        result.creadas.forEach((id) => terminadas.add(id))
        result.omitidas.forEach((id) => terminadas.add(id))
        creadas += result.creadas.length; omitidas += result.omitidas.length; fallidas += result.errores.length
        if (result.error) { setMensaje(`${creadas} nuevas, ${omitidas} ya existentes. ${result.error}`); return }
      }
      setMensaje(`${creadas} canciones incorporadas; ${omitidas} fichas existentes conservadas; ${fallidas} pendientes de reintento. Puedes editar las incorporadas en la biblioteca.`)
    } catch { setMensaje('Se perdió la conexión. Las fichas guardadas se conservan; puedes reintentar sin duplicarlas.') }
    finally {
      setCanciones((actuales) => actuales?.map((song) => terminadas.has(song.id) ? { ...song, yaExiste: true } : song) || null)
      setSeleccion((actual) => new Set([...actual].filter((id) => !terminadas.has(id))))
      bloqueo.current = false; setOcupado(false); router.refresh()
    }
  }

  const identificadas = canciones?.filter((song) => song.estado === 'identificada' && !song.yaExiste) || []
  const visibles = canciones?.filter((song) => {
    const coincide = `${song.titulo} ${song.artista || ''}`.toLocaleLowerCase('es').includes(busqueda.toLocaleLowerCase('es'))
    return coincide && (filtro === 'todas' || (filtro === 'identificadas' ? song.estado === 'identificada' && !song.yaExiste : song.estado === 'pendiente' && !song.yaExiste))
  }) || []

  return <details className="mb-5 border-y border-slate-200 py-3" onToggle={(event) => { if (event.currentTarget.open) void cargar() }}>
    <summary className="cursor-pointer text-sm font-bold">Revisar catálogo de canciones VIDA</summary>
    <p className="mt-3 text-sm text-slate-600">Referencias localizadas, con los acordes y tonos de los apuntes de la iglesia. Escucha los enlaces antes de importarlas: la grabación puede tener otro arreglo. Se conservan las fichas existentes.</p>
    <p className="mt-2 text-xs text-slate-600">Las letras quedan por completar. Los enlaces ausentes y las identificaciones dudosas se muestran como pendientes; no se sustituyen por otra canción.</p>
    <p role="status" aria-live="polite" className="my-3 text-sm">{ocupado && !canciones ? 'Cargando catálogo…' : mensaje}</p>
    {!canciones && !ocupado ? <button type="button" onClick={() => void cargar()} className="min-h-11 text-sm font-bold underline">Cargar catálogo</button> : null}
    {canciones ? <>
      <p className="text-xs text-slate-600">{canciones.length} entradas y variantes · {identificadas.length} referencias por incorporar · {canciones.filter((song) => song.estado === 'pendiente' && !song.yaExiste).length} pendientes · {canciones.filter((song) => song.yaExiste).length} existentes.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="text-xs">Mostrar<select aria-label="Filtrar catálogo" value={filtro} onChange={(event) => setFiltro(event.target.value)} className="ml-2 min-h-11 rounded border border-slate-200 bg-white px-2 text-slate-900"><option value="identificadas">Referencias encontradas</option><option value="pendientes">Pendientes de confirmar</option><option value="todas">Todas</option></select></label>
        <input aria-label="Buscar en catálogo VIDA" placeholder="Buscar en catálogo" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded border border-slate-200 bg-white px-3 text-sm text-slate-900" />
      </div>
      <div className="my-3 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" disabled={ocupado} onClick={() => setSeleccion(new Set(identificadas.map((song) => song.id)))} className="min-h-11 font-bold underline disabled:opacity-50">Seleccionar las {identificadas.length} referencias</button>
        <button type="button" disabled={ocupado} onClick={() => setSeleccion(new Set())} className="min-h-11 underline disabled:opacity-50">Quitar selección</button>
        <button type="button" disabled={ocupado || !seleccion.size} onClick={() => void importar()} className="min-h-11 rounded-xl border border-violet-200 bg-violet-50 px-4 font-bold text-violet-800 disabled:opacity-50">Importar {seleccion.size} seleccionadas</button>
      </div>
      <div className="max-h-[65vh] overflow-y-auto">
        {visibles.map((song) => <div key={song.id} className="border-t border-slate-200 py-3">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5" disabled={ocupado || song.yaExiste || song.estado !== 'identificada'} checked={seleccion.has(song.id)} onChange={(event) => setSeleccion((actual) => { const next = new Set(actual); if (event.target.checked) next.add(song.id); else next.delete(song.id); return next })} />
            <span><strong className="text-sm">{song.titulo}</strong><span className="block text-xs text-slate-600">{song.artista || 'Intérprete por confirmar'} · Tono del arreglo: {song.tonalidad_base || 'pendiente'}{song.yaExiste ? ' · Ficha existente conservada' : ''}</span></span>
          </label>
          <div className="ml-8 mt-2 flex flex-wrap gap-4 text-xs">
            {song.youtube_url ? <a href={song.youtube_url} target="_blank" rel="noopener noreferrer" className="py-2 underline">YouTube</a> : null}
            {song.spotify_url ? <a href={song.spotify_url} target="_blank" rel="noopener noreferrer" className="py-2 underline">Spotify</a> : null}
            {song.fuente_usuario ? <a href={song.fuente_usuario} target="_blank" rel="noopener noreferrer" className="py-2 underline">Referencia aportada</a> : null}
          </div>
          {song.campos_pendientes.length ? <p className="ml-8 mt-1 text-xs text-slate-600">Por completar: {song.campos_pendientes.map((campo) => ({ letra: 'letra', youtube_url: 'YouTube', spotify_url: 'Spotify' })[campo] || campo).join(', ')}.</p> : null}
          {song.observaciones_revision.length ? <p className="ml-8 mt-1 text-xs text-amber-800">{song.observaciones_revision.join(' ')}</p> : null}
          <details className="ml-8 mt-2 text-xs"><summary className="cursor-pointer py-2">Ver acordes y notas</summary><pre className="whitespace-pre-wrap font-mono">{song.acordes || 'Cifrado pendiente'}</pre><p className="mt-2 whitespace-pre-wrap text-slate-600">{song.notas_permanentes}</p></details>
          {song.estado === 'pendiente' && !song.yaExiste ? <button type="button" disabled={ocupado} onClick={() => prepararFicha(song)} className="ml-8 mt-2 min-h-11 text-xs font-bold underline disabled:opacity-50">Completar y revisar ficha antes de guardar</button> : null}
        </div>)}
        {!visibles.length ? <p className="py-4 text-sm">No hay canciones con este filtro.</p> : null}
      </div>
    </> : null}
  </details>
}
