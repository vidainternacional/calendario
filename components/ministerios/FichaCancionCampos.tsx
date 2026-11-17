'use client'

import { useId, useState } from 'react'

export type DatosFichaCancion = {
  titulo: string; artista: string; tonalidadBase: string; letra: string; acordes: string;
  notasPermanentes: string; spotifyUrl: string; youtubeUrl: string
}
const CAMPO = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400'

export default function FichaCancionCampos({ valores, iniciales, cambiar }: {
  valores?: DatosFichaCancion; iniciales?: DatosFichaCancion; cambiar?: (datos: DatosFichaCancion) => void
}) {
  const id = useId()
  const [seccion, setSeccion] = useState<'letra' | 'acordes' | 'notas'>('letra')
  const datos = valores || iniciales!
  function props(campo: keyof DatosFichaCancion) {
    return valores ? { value: valores[campo], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => cambiar?.({ ...valores, [campo]: event.target.value }) } : { defaultValue: ['letra', 'acordes', 'notasPermanentes'].includes(campo) ? datos[campo].replace(/\\n/g, '\n') : datos[campo] }
  }
  return <div className="space-y-5 text-slate-900">
    <div className="grid gap-3">
      <label className="text-xs font-bold text-slate-600">Nombre de la canción<input name="titulo" required maxLength={160} {...props('titulo')} className={`${CAMPO} h-12 text-base font-semibold`} placeholder="Nombre de la canción" /></label>
      <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
        <label className="min-w-0 text-xs font-bold text-slate-600">Artista / versión<input name="artista" {...props('artista')} className={`${CAMPO} h-11`} placeholder="Artista o versión" /></label>
        <label className="text-xs font-bold text-slate-600">Tono base<input name="tonalidad_base" {...props('tonalidadBase')} className={`${CAMPO} h-11 font-mono font-bold`} placeholder="Ej. D" /></label>
      </div>
    </div>
    <div>
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
        <label className="text-xs font-bold text-slate-600">Acordes y estructura<textarea name="acordes" wrap="off" {...props('acordes')} className={`${CAMPO} min-h-64 resize-y overflow-x-auto py-3 font-mono leading-7`} placeholder={'Intro: D - A - Bm - G\nEstrofa:\nCoro:\nPuente:'} /></label>
        <p className="mt-2 text-xs leading-5 text-slate-500">Separa los acordes con espacios. Puedes alinearlos encima de la letra y organizar Intro, Estrofa, Coro y Puente. El tono del servicio se elige en Programación.</p>
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
  </div>
}
