'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronDown, ExternalLink, Music2, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

const FIELD = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400'

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

export default function BibliotecaAlabanzaClient({ ministerioId, canciones }: { ministerioId: string; canciones: CancionBibliotecaAlabanza[] }) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [nueva, setNueva] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [linksNueva, setLinksNueva] = useState(false)
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
      setLinksNueva(false)
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
    <div className="flex items-center gap-2">
      <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar canción o artista" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400" /></label>
      <button type="button" onClick={() => { setNueva((value) => !value); setAbierta(null); setMensaje(null) }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-600 text-white" aria-label={nueva ? 'Cerrar nueva canción' : 'Nueva canción'}>{nueva ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</button>
    </div>

    {mensaje ? <p className="mt-3 text-xs font-semibold text-slate-600">{mensaje}</p> : null}

    {nueva ? <div className="mt-4 border-y border-slate-200 py-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-violet-500">Nueva canción</p>
      <div className="mt-3 grid gap-3">
        <label className="text-xs font-bold text-slate-600">Nombre<input value={formNueva.titulo} onChange={(e) => setFormNueva((c) => ({ ...c, titulo: e.target.value }))} className={`${FIELD} h-11`} placeholder="Nombre de la canción" /></label>
        <label className="text-xs font-bold text-slate-600">Artista / versión<input value={formNueva.artista} onChange={(e) => setFormNueva((c) => ({ ...c, artista: e.target.value }))} className={`${FIELD} h-11`} placeholder="Artista o versión" /></label>
        <label className="text-xs font-bold text-slate-600">Tono base<input value={formNueva.tonalidadBase} onChange={(e) => setFormNueva((c) => ({ ...c, tonalidadBase: e.target.value }))} className={`${FIELD} h-11 font-extrabold`} placeholder="Ej. D" /></label>
        <label className="text-xs font-bold text-slate-600">Notas de la canción<textarea value={formNueva.notasPermanentes} onChange={(e) => setFormNueva((c) => ({ ...c, notasPermanentes: e.target.value }))} className={`${FIELD} min-h-20 py-3`} placeholder="Estructura, entrada, referencia o información permanente" /></label>
        <label className="text-xs font-bold text-slate-600">Letra<textarea value={formNueva.letra} onChange={(e) => setFormNueva((c) => ({ ...c, letra: e.target.value }))} className={`${FIELD} min-h-40 py-3`} placeholder="Letra para estudio de los cantantes" /></label>
        <label className="text-xs font-bold text-slate-600">Cifrado / acordes<textarea value={formNueva.acordes} onChange={(e) => setFormNueva((c) => ({ ...c, acordes: e.target.value }))} className={`${FIELD} min-h-48 py-3 font-mono`} placeholder={'D   A   Bm   G\n...'} /></label>
        <button type="button" onClick={() => setLinksNueva((value) => !value)} className="flex min-h-10 items-center justify-between border-y border-slate-200 text-left text-xs font-bold text-slate-600" aria-expanded={linksNueva}>Spotify y YouTube · opcional<ChevronDown className={`h-4 w-4 transition-transform ${linksNueva ? 'rotate-180' : ''}`} /></button>
        {linksNueva ? <div className="grid gap-2"><input value={formNueva.spotifyUrl} onChange={(e) => setFormNueva((c) => ({ ...c, spotifyUrl: e.target.value }))} className={`${FIELD} mt-0 h-11`} placeholder="Link de Spotify" /><input value={formNueva.youtubeUrl} onChange={(e) => setFormNueva((c) => ({ ...c, youtubeUrl: e.target.value }))} className={`${FIELD} mt-0 h-11`} placeholder="Link de YouTube" /></div> : null}
        <button type="button" disabled={pending} onClick={guardarNueva} className="h-11 rounded-xl bg-violet-600 text-xs font-extrabold text-white disabled:opacity-50">Guardar canción</button>
      </div>
    </div> : null}

    <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
      {filtradas.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No encontramos canciones.</p> : filtradas.map((song) => {
        const open = abierta === song.id
        return <div key={song.id}>
          <button type="button" onClick={() => { setAbierta(open ? null : song.id); setNueva(false); setMensaje(null) }} className="flex min-h-[64px] w-full items-center gap-3 py-3 text-left" aria-expanded={open}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600"><Music2 className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-slate-900">{song.titulo}</span><span className="mt-0.5 block truncate text-[11px] text-slate-400">{song.artista || 'Sin versión'}{song.tonalidad_base ? ` · ${song.tonalidad_base}` : ''}</span></span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open ? <form onSubmit={(event) => { event.preventDefault(); guardarExistente(song, event.currentTarget) }} className="grid gap-3 pb-5 pl-12">
            <label className="text-xs font-bold text-slate-600">Nombre<input name="titulo" defaultValue={song.titulo} className={`${FIELD} h-11`} /></label>
            <label className="text-xs font-bold text-slate-600">Artista / versión<input name="artista" defaultValue={song.artista || ''} className={`${FIELD} h-11`} /></label>
            <label className="text-xs font-bold text-slate-600">Tono base<input name="tonalidad_base" defaultValue={song.tonalidad_base || ''} className={`${FIELD} h-11 font-extrabold`} /></label>
            <label className="text-xs font-bold text-slate-600">Notas de la canción<textarea name="notas_permanentes" defaultValue={song.notas_permanentes || ''} className={`${FIELD} min-h-20 py-3`} /></label>
            <label className="text-xs font-bold text-slate-600">Letra<textarea name="letra" defaultValue={song.letra || ''} className={`${FIELD} min-h-40 py-3`} /></label>
            <label className="text-xs font-bold text-slate-600">Cifrado / acordes<textarea name="acordes" defaultValue={song.acordes || ''} className={`${FIELD} min-h-48 py-3 font-mono`} /></label>
            <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Spotify<input name="spotify_url" defaultValue={song.spotify_url || ''} className={`${FIELD} h-11`} /></label><label className="text-xs font-bold text-slate-600">YouTube<input name="youtube_url" defaultValue={song.youtube_url || ''} className={`${FIELD} h-11`} /></label></div>
            <div className="flex items-center justify-between gap-3"><button disabled={pending} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-extrabold text-white disabled:opacity-50"><Save className="h-4 w-4" />Guardar</button><button type="button" disabled={pending} onClick={() => archivar(song)} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-rose-600 disabled:opacity-50"><Trash2 className="h-4 w-4" />Retirar</button></div>
            {(song.spotify_url || song.youtube_url) ? <div className="flex gap-4 text-[11px] font-bold text-slate-500">{song.spotify_url ? <a href={song.spotify_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">Spotify <ExternalLink className="h-3 w-3" /></a> : null}{song.youtube_url ? <a href={song.youtube_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">YouTube <ExternalLink className="h-3 w-3" /></a> : null}</div> : null}
          </form> : null}
        </div>
      })}
    </div>
  </div>
}
