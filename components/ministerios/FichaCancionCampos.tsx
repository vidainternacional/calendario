'use client'

import { useCallback, useId, useRef, useState } from 'react'
import PantallaCancion from './PantallaCancion'
import { transportarCifrado, transportarTono } from '@/lib/musica/transponer'

export type DatosFichaCancion = {
  titulo: string; artista: string; tonalidadBase: string; letra: string; acordes: string;
  notasPermanentes: string; spotifyUrl: string; youtubeUrl: string
}
const CAMPO = 'mt-1.5 w-full rounded-none border-0 border-b border-slate-200 bg-transparent px-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400'

export default function FichaCancionCampos({ valores, iniciales, cambiar, guardarTransposicion, guardandoTono }: {
  valores?: DatosFichaCancion; iniciales?: DatosFichaCancion; cambiar?: (datos: DatosFichaCancion) => void; guardarTransposicion?: (datos: DatosFichaCancion) => Promise<{ success: boolean; error?: string }>; guardandoTono?: (ocupado: boolean) => void
}) {
  const id = useId()
  const [grande, setGrande] = useState(false)
  const cerrarGrande = useCallback(() => setGrande(false), [])
  const [local, setLocal] = useState(() => {
    const datos = iniciales || valores!
    return { ...datos, letra: datos.letra.replace(/\\n/g, '\n'), acordes: datos.acordes.replace(/\\n/g, '\n'), notasPermanentes: datos.notasPermanentes.replace(/\\n/g, '\n') }
  })
  const datos = valores || local
  const [seccion, setSeccion] = useState<'letra' | 'acordes' | 'notas'>(() => datos.acordes && !datos.letra ? 'acordes' : 'letra')
  const [estadoTono, setEstadoTono] = useState('')
  const cola = useRef(Promise.resolve())
  const turno = useRef(0)
  function actualizar(nuevo: DatosFichaCancion) { if (valores) cambiar?.(nuevo); else setLocal(nuevo) }
  function props(campo: keyof DatosFichaCancion) {
    return { value: datos[campo], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => actualizar({ ...datos, [campo]: event.target.value }) }
  }
  function transportar(semitonos: number) {
    if (!/^[A-G](?:#|b)?(?:m|maj|min)?$/.test(datos.tonalidadBase.trim()) || !datos.acordes.trim()) { setEstadoTono('Escribe un tono válido y los acordes antes de transportar.'); return }
    const nuevo = { ...datos, tonalidadBase: transportarTono(datos.tonalidadBase, semitonos), acordes: transportarCifrado(datos.acordes, semitonos) }
    actualizar(nuevo)
    setSeccion('acordes')
    if (!guardarTransposicion) { setEstadoTono('El nuevo tono y los acordes se conservarán al guardar la canción.'); return }
    const actual = ++turno.current
    setEstadoTono('Guardando tono y acordes…'); guardandoTono?.(true)
    cola.current = cola.current.catch(() => {}).then(async () => {
      if (actual !== turno.current) return
      try { const r = await guardarTransposicion(nuevo); if (actual === turno.current) setEstadoTono(r.success ? 'Tono y acordes guardados en la biblioteca.' : r.error || 'No se pudo guardar; puedes usar Guardar.') }
      catch { if (actual === turno.current) setEstadoTono('No se pudo guardar el tono. Conserva la ficha abierta y vuelve a guardar.') }
      finally { if (actual === turno.current) guardandoTono?.(false) }
    })
  }
  return <div className="mx-auto w-full min-w-0 space-y-6 text-slate-900">
    <div className="grid gap-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Información general</h3>
      <label className="text-xs font-bold text-slate-600">Nombre de la canción<input name="titulo" required maxLength={160} {...props('titulo')} className={`${CAMPO} h-12 text-base font-semibold`} placeholder="Nombre de la canción" /></label>
      <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
        <label className="min-w-0 text-xs font-bold text-slate-600">Artista / versión<input name="artista" {...props('artista')} className={`${CAMPO} h-11`} placeholder="Artista o versión" /></label>
        <label className="text-xs font-bold text-slate-600">Tono base<input name="tonalidad_base" {...props('tonalidadBase')} className={`${CAMPO} h-11 font-mono font-bold`} placeholder="Ej. D" /></label>
      </div>
    </div>
    <div>
      <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Hoja musical</h3><button type="button" onClick={() => setGrande(true)} className="min-h-11 text-sm font-bold text-violet-700">Ver en grande</button></div>
      <div role="tablist" aria-label="Contenido de la ficha" onKeyDown={(event) => {
        const items = ['letra', 'acordes', 'notas'] as const
        const actual = items.indexOf(seccion)
        const indice = event.key === 'ArrowRight' ? (actual + 1) % items.length : event.key === 'ArrowLeft' ? (actual + items.length - 1) % items.length : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : -1
        if (indice >= 0) { event.preventDefault(); setSeccion(items[indice]); document.getElementById(`${id}-${items[indice]}-tab`)?.focus() }
      }} className="flex gap-1 border-b border-slate-200">
        {(['letra', 'acordes', 'notas'] as const).map((item) => <button key={item} type="button" role="tab" id={`${id}-${item}-tab`} aria-controls={`${id}-${item}`} aria-selected={seccion === item} onClick={() => setSeccion(item)} className={`min-h-11 flex-1 border-b-2 px-2 text-xs font-bold ${seccion === item ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500'}`}>{item === 'letra' ? 'Letra' : item === 'acordes' ? 'Acordes y estructura' : 'Notas'}</button>)}
      </div>
      {/* Los paneles se ocultan, pero sus campos siguen montados y se guardan juntos. */}
      <div role="tabpanel" id={`${id}-letra`} aria-labelledby={`${id}-letra-tab`} hidden={seccion !== 'letra'} className="pt-3">
        <label className="text-xs font-bold text-slate-600">Letra<textarea name="letra" {...props('letra')} className={`${CAMPO} min-h-64 resize-y py-3 font-mono leading-7`} placeholder="Pega o escribe la letra, separando estrofas y coro con una línea en blanco." /></label>
      </div>
      <div role="tabpanel" id={`${id}-acordes`} aria-labelledby={`${id}-acordes-tab`} hidden={seccion !== 'acordes'} className="pt-3">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 pb-2">
      <span className="text-sm font-bold text-slate-700">Tono: {datos.tonalidadBase || '—'}</span>
      <button type="button" onClick={() => transportar(-1)} className="min-h-11 px-3 text-sm font-bold text-violet-700" aria-label="Bajar medio tono">− ½ tono</button>
      <button type="button" onClick={() => transportar(1)} className="min-h-11 px-3 text-sm font-bold text-violet-700" aria-label="Subir medio tono">+ ½ tono</button>
    </div>
    {estadoTono ? <p role="status" className="text-xs text-slate-600">{estadoTono}</p> : null}
        <label className="text-xs font-bold text-slate-600">Acordes y estructura<textarea name="acordes" wrap="off" {...props('acordes')} className={`${CAMPO} min-h-64 resize-y overflow-x-auto py-3 font-mono leading-7`} placeholder={'Intro: D - A - Bm - G\nEstrofa:\nCoro:\nPuente:'} /></label>
        <p className="mt-2 text-xs leading-5 text-slate-500">Separa los acordes con espacios. Puedes alinearlos encima de la letra y organizar Intro, Estrofa, Coro y Puente. El tono y los acordes de esta ficha se transportan juntos; los tonos ya asignados a servicios se conservan.</p>
      </div>
      <div role="tabpanel" id={`${id}-notas`} aria-labelledby={`${id}-notas-tab`} hidden={seccion !== 'notas'} className="pt-3">
        <label className="text-xs font-bold text-slate-600">Indicaciones de la canción<textarea name="notas_permanentes" {...props('notasPermanentes')} className={`${CAMPO} min-h-40 resize-y py-3 leading-6`} placeholder="Entrada, cortes, repeticiones, dinámica o detalles del arreglo." /></label>
      </div>
    </div>
    <details className="border-y border-slate-200 py-3">
      <summary className="cursor-pointer text-xs font-bold text-slate-600">Enlaces de referencia · Spotify y YouTube</summary>
      <div className="mt-3 grid gap-3">
        <label className="text-xs font-bold text-slate-600">Spotify<input name="spotify_url" type="url" {...props('spotifyUrl')} className={`${CAMPO} h-11`} placeholder="https://open.spotify.com/track/…" /></label>
        <label className="text-xs font-bold text-slate-600">YouTube<input name="youtube_url" type="url" {...props('youtubeUrl')} className={`${CAMPO} h-11`} placeholder="https://www.youtube.com/watch?v=…" /></label>
      </div>
    </details>
    {grande && <PantallaCancion titulo={`${datos.titulo || 'Canción'} · ${seccion === 'acordes' ? 'Acordes y estructura' : seccion === 'letra' ? 'Letra' : 'Indicaciones'}`} cerrar={cerrarGrande}>
      {seccion === 'acordes' && <div className="mb-4 flex flex-wrap items-center gap-4"><span className="text-lg font-bold">Tono: {datos.tonalidadBase || '—'}</span><button type="button" onClick={() => transportar(-1)} className="min-h-11 px-2 font-bold text-violet-700" aria-label="Bajar medio tono">− ½ tono</button><button type="button" onClick={() => transportar(1)} className="min-h-11 px-2 font-bold text-violet-700" aria-label="Subir medio tono">+ ½ tono</button></div>}
      <label className="block text-sm font-bold text-slate-600">{seccion === 'acordes' ? 'Acordes y estructura' : seccion === 'letra' ? 'Letra' : 'Indicaciones de la canción'}
        <textarea aria-label="Contenido en grande" value={seccion === 'acordes' ? datos.acordes : seccion === 'letra' ? datos.letra : datos.notasPermanentes} onChange={e => actualizar({ ...datos, [seccion === 'acordes' ? 'acordes' : seccion === 'letra' ? 'letra' : 'notasPermanentes']: e.target.value })} className="mt-3 min-h-[65dvh] w-full resize-y border-0 bg-transparent py-3 font-mono text-lg leading-8 text-slate-900 outline-none" />
      </label>
      {estadoTono && <p role="status" className="mt-3 text-sm text-slate-600">{estadoTono}</p>}
    </PantallaCancion>}
  </div>
}
