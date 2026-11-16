'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown, Loader2, Eye, PlayCircle } from 'lucide-react'
import { guardarMensajeSemanal, cambiarPublicacionMensaje } from '@/app/actions/mensajes-semanales'
import { youtubeVideo, type MensajeSemanal } from '@/lib/estudios/youtube-link'

const campo = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'

function Editor({ mensaje, onSaved }: { mensaje?: MensajeSemanal; onSaved: () => void }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [titulo, setTitulo] = useState(mensaje?.titulo ?? '')
  const [enlace, setEnlace] = useState(mensaje?.videoUrl ?? '')
  const [descripcion, setDescripcion] = useState(mensaje?.descripcion ?? '')
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const video = youtubeVideo(enlace)
  return <form className="mt-4 space-y-4" onSubmit={event => {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setError(null)
    start(async () => {
      try {
        const result = await guardarMensajeSemanal(values)
        if (!result.success) { setError(result.error || 'No se pudo guardar.'); return }
        if (!mensaje) { form.reset(); setTitulo(''); setEnlace(''); setDescripcion(''); setVistaPrevia(false) }
        onSaved()
        router.refresh()
      } catch { setError('No se pudo guardar. Conserva tus datos e intenta de nuevo.') }
    })
  }}>
    {mensaje && <><input type="hidden" name="id" value={mensaje.id} /><input type="hidden" name="revision" value={mensaje.revision} /></>}
    <label className="block text-sm font-semibold text-slate-700">Título<input className={campo} name="titulo" required maxLength={140} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Mensaje de esta semana" /></label>
    <label className="block text-sm font-semibold text-slate-700">Enlace de YouTube<input className={campo} type="url" name="video_url" required maxLength={1500} value={enlace} onChange={e => setEnlace(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" /></label>
    <label className="block text-sm font-semibold text-slate-700">Descripción <span className="font-normal text-slate-400">· opcional</span><textarea className={campo} name="descripcion" rows={3} maxLength={2000} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Una breve introducción o reflexión para acompañar el video." /></label>
    <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input className="mt-1 h-4 w-4 accent-violet-600" type="checkbox" name="publicar" defaultChecked={mensaje?.publicado ?? false} /><span>Publicar para toda la iglesia. Sin marcar, se guarda como borrador visible solo para ti.</span></label>

    <section className="border-t border-slate-200 pt-4" aria-label="Vista previa del mensaje">
      <button type="button" onClick={() => setVistaPrevia(v => !v)} aria-expanded={vistaPrevia}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold text-slate-800">
        <span className="flex items-center gap-2"><Eye className="h-4 w-4 text-violet-700" aria-hidden="true" /> Vista previa de la publicación</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${vistaPrevia ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {vistaPrevia && <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500">Solo una vista previa. No publica ni guarda los cambios.</p>
        <h3 className="break-words text-xl font-bold leading-snug text-slate-900">{titulo.trim() || 'Título del devocional o mensaje'}</h3>
        {video ? <div className="aspect-video overflow-hidden rounded-xl bg-black">
          <iframe key={video.id} className="h-full w-full border-0" src={video.embed} title="Vista previa del video" loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div> : <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl bg-slate-200 text-center text-slate-600">
          <PlayCircle className="h-10 w-10" aria-hidden="true" />
          <p className="px-3 text-xs">Pegá un enlace válido de YouTube para ver el video.</p>
        </div>}
        {descripcion.trim() && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{descripcion}</p>}
      </div>}
    </section>
    {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
    <button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Guardar mensaje</button>
  </form>
}

export default function MensajesSemanalesEditor({ mensajes }: { mensajes: MensajeSemanal[] }) {
  const router = useRouter()
  const [nuevo, setNuevo] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [busy, start] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)
  return <section className="my-7 border-y border-slate-200 py-5" aria-labelledby="gestion-mensajes">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="gestion-mensajes" className="font-bold text-slate-900">Tus mensajes</h2><button aria-expanded={nuevo} onClick={() => setNuevo(v => !v)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Nuevo mensaje</button></div>
    <p className="mt-2 text-sm leading-6 text-slate-500">Sube el video a YouTube y pega su enlace aquí. Puedes preparar un borrador antes de publicarlo.</p>
    {nuevo && <Editor onSaved={() => { setNuevo(false); setAviso('Mensaje guardado.') }} />}
    {aviso && <p role="status" className="mt-3 text-sm text-slate-700">{aviso}</p>}
    {mensajes.length > 0 && <div className="mt-4 divide-y divide-slate-200">{mensajes.map(m => <div key={m.id} className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-sm font-bold text-slate-900">{m.titulo}</h3><p className="mt-1 text-xs text-slate-500">{m.publicado ? 'Publicado para la iglesia' : 'Borrador'}</p></div><div className="flex gap-3">
        <button aria-expanded={editando === m.id} onClick={() => setEditando(v => v === m.id ? null : m.id)} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-violet-700">Editar<ChevronDown className="h-4 w-4" /></button>
        <button disabled={busy} className="min-h-11 text-sm font-semibold text-slate-600 disabled:opacity-50" onClick={() => { setAviso(null); start(async () => {
          try { const r = await cambiarPublicacionMensaje(m.id, m.revision, !m.publicado); setAviso(r.success ? (m.publicado ? 'El mensaje quedó como borrador.' : 'El mensaje ya está publicado.') : r.error || 'No se pudo actualizar.'); if (r.success) router.refresh() }
          catch { setAviso('No se pudo actualizar. Intenta nuevamente.') }
        }) }}>{m.publicado ? 'Despublicar' : 'Publicar'}</button>
      </div></div>
      {editando === m.id && <Editor key={m.id + m.revision} mensaje={m} onSaved={() => { setEditando(null); setAviso('Mensaje actualizado.') }} />}
    </div>)}</div>}
  </section>
}
