'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronDown, ExternalLink, Music2, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ImportarCatalogoVida from './ImportarCatalogoVida'
import FichaCancionCampos from './FichaCancionCampos'
import { guardarVersionOficialCancionSetlist } from '@/app/actions/setlist-alabanza'
import {
  archivarCancionBibliotecaAlabanza,
  guardarCancionBibliotecaAlabanza,
} from '@/app/actions/biblioteca-alabanza'

export type CancionBibliotecaAlabanza = {
  id: string
  titulo: string
  artista: string | null
  spotify_url: string | null
  youtube_url: string | null
  tonalidad_base: string | null
  acordes: string | null
  letra: string | null
  notas_permanentes: string | null
}

const vacia = {
  titulo: '',
  artista: '',
  tonalidadBase: '',
  letra: '',
  acordes: '',
  notasPermanentes: '',
  spotifyUrl: '',
  youtubeUrl: '',
}

export default function BibliotecaAlabanzaClient({ ministerioId, canciones, cargarCatalogo = false }: { ministerioId: string; canciones: CancionBibliotecaAlabanza[]; cargarCatalogo?: boolean }) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [nueva, setNueva] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [guardandoTono, setGuardandoTono] = useState(false)
  const [pending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [formNueva, setFormNueva] = useState(vacia)

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es')
    if (!q) return canciones
    return canciones.filter((song) => `${song.titulo} ${song.artista || ''}`.toLocaleLowerCase('es').includes(q))
  }, [busqueda, canciones])

  const guardarNueva = () => {
    setMensaje(null)
    startTransition(async () => {
      const result = await guardarCancionBibliotecaAlabanza(ministerioId, formNueva)
      if (!result.success) return setMensaje(result.error || 'No fue posible guardar.')
      setFormNueva(vacia)
      setNueva(false)
      setMensaje('Canción guardada en la biblioteca.')
      router.refresh()
    })
  }

  const guardarExistente = (song: CancionBibliotecaAlabanza, form: HTMLFormElement) => {
    const data = new FormData(form)
    setMensaje(null)
    startTransition(async () => {
      const result = await guardarCancionBibliotecaAlabanza(ministerioId, {
        id: song.id,
        titulo: String(data.get('titulo') || ''),
        artista: String(data.get('artista') || ''),
        tonalidadBase: String(data.get('tonalidad_base') || ''),
        letra: String(data.get('letra') || ''),
        acordes: String(data.get('acordes') || ''),
        notasPermanentes: String(data.get('notas_permanentes') || ''),
        spotifyUrl: String(data.get('spotify_url') || ''),
        youtubeUrl: String(data.get('youtube_url') || ''),
      })
      if (!result.success) return setMensaje(result.error || 'No fue posible guardar.')
      setMensaje('Cambios guardados.')
      setAbierta(null)
      router.refresh()
    })
  }

  const archivar = (song: CancionBibliotecaAlabanza) => {
    if (!window.confirm(`¿Retirar “${song.titulo}” de la biblioteca? Su historial de servicios se conserva.`)) return
    setMensaje(null)
    startTransition(async () => {
      const result = await archivarCancionBibliotecaAlabanza(ministerioId, song.id)
      if (!result.success) return setMensaje(result.error || 'No fue posible retirar la canción.')
      setAbierta(null)
      setMensaje('Canción retirada de la biblioteca.')
      router.refresh()
    })
  }

  return <div className="text-slate-900">
    <ImportarCatalogoVida ministerioId={ministerioId} habilitada={cargarCatalogo} />
    <div className="flex items-center gap-2">
      <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar canción o artista" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400" /></label>
      <button type="button" onClick={() => { setNueva((value) => !value); setAbierta(null); setMensaje(null) }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-600 text-white" aria-label={nueva ? 'Cerrar nueva canción' : 'Nueva canción'}>{nueva ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</button>
    </div>

    {mensaje ? <p className="mt-3 text-xs font-semibold text-slate-600">{mensaje}</p> : null}

    {nueva ? <div id="nueva-cancion-vida" className="mt-4 border-y border-slate-200 py-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-violet-500">Nueva canción</p>
      <div className="mt-3 grid gap-3">
        <FichaCancionCampos valores={formNueva} cambiar={setFormNueva} />
        <button type="button" disabled={pending || guardandoTono} onClick={guardarNueva} className="h-11 rounded-xl bg-violet-600 text-xs font-extrabold text-white disabled:opacity-50">Guardar canción</button>
      </div>
    </div> : null}

    <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
      {filtradas.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No encontramos canciones.</p> : filtradas.map((song) => {
        const open = abierta === song.id
        return <div key={song.id}>
          {!open && <button type="button" onClick={() => { setAbierta(open ? null : song.id); setNueva(false); setMensaje(null) }} className="flex min-h-[64px] w-full items-center gap-3 py-3 text-left" aria-expanded={open}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600"><Music2 className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-slate-900">{song.titulo}</span><span className="mt-0.5 block truncate text-[11px] text-slate-400">{song.artista || 'Sin versión'}{song.tonalidad_base ? ` · ${song.tonalidad_base}` : ''}</span></span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>}
          {open ? <form onSubmit={(event) => { event.preventDefault(); guardarExistente(song, event.currentTarget) }} className="grid gap-4 pb-5">
            <FichaCancionCampos cabeceraCompacta cerrarFicha={() => setAbierta(null)} guardandoTono={setGuardandoTono} guardarTransposicion={async (datos) => { const r = await guardarVersionOficialCancionSetlist(ministerioId, song.id, { tonalidadBase: datos.tonalidadBase, acordes: datos.acordes }); if (r.success) router.refresh(); return r }} iniciales={{ titulo: song.titulo, artista: song.artista || '', tonalidadBase: song.tonalidad_base || '', letra: song.letra || '', acordes: song.acordes || '', notasPermanentes: song.notas_permanentes || '', spotifyUrl: song.spotify_url || '', youtubeUrl: song.youtube_url || '' }} />
            <div className="flex items-center justify-between gap-3"><button disabled={pending || guardandoTono} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-extrabold text-white disabled:opacity-50"><Save className="h-4 w-4" />Guardar</button><button type="button" disabled={pending || guardandoTono} onClick={() => archivar(song)} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-rose-600 disabled:opacity-50"><Trash2 className="h-4 w-4" />Retirar</button></div>
            {(song.spotify_url || song.youtube_url) ? <div className="flex gap-4 text-[11px] font-bold text-slate-500">{song.spotify_url ? <a href={song.spotify_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">Spotify <ExternalLink className="h-3 w-3" /></a> : null}{song.youtube_url ? <a href={song.youtube_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">YouTube <ExternalLink className="h-3 w-3" /></a> : null}</div> : null}
          </form> : null}
        </div>
      })}
    </div>
  </div>
}
