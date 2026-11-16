'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown, Loader2, Eye, PlayCircle, Users } from 'lucide-react'
import { guardarMensajeSemanal, cambiarPublicacionMensaje } from '@/app/actions/mensajes-semanales'
import { guardarMensajeDirigido, cambiarPublicacionDirigida } from '@/app/actions/mensajes-dirigidos'
import { youtubeVideo } from '@/lib/estudios/youtube-link'
import {
  ROLES_DESTINO, resumenAudiencia,
  type MensajeConAudiencia, type MinisterioDestino, type RolDestino, type TipoDevocional,
} from '@/lib/estudios/mensajes-dirigidos-tipos'

const campo = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'

function Editor({ mensaje, ministerios, onSaved }: {
  mensaje?: MensajeConAudiencia; ministerios: MinisterioDestino[]; onSaved: () => void
}) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [titulo, setTitulo] = useState(mensaje?.titulo ?? '')
  const [enlace, setEnlace] = useState(mensaje?.videoUrl ?? '')
  const [descripcion, setDescripcion] = useState(mensaje?.descripcion ?? '')
  const [tipo, setTipo] = useState<TipoDevocional>(mensaje?.tipo ?? 'mensaje')
  const [publicar, setPublicar] = useState(mensaje?.publicado ?? false)
  const [iglesia, setIglesia] = useState(mensaje?.audienciaIglesia ?? true)
  const [roles, setRoles] = useState<RolDestino[]>(mensaje?.rolesDestino ?? [])
  const [grupos, setGrupos] = useState<string[]>(mensaje?.ministeriosDestino ?? [])
  const [lideres, setLideres] = useState(mensaje?.lideresMinisterio ?? false)
  const [filtro, setFiltro] = useState('')
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const esLegado = mensaje?.origen === 'legado'
  const video = youtubeVideo(enlace)
  const seleccion = iglesia ? 'Toda la congregación' : [
    ...(lideres ? ['Líderes de ministerio'] : []),
    ...ROLES_DESTINO.filter(r => roles.includes(r.id)).map(r => r.nombre),
    ...ministerios.filter(m => grupos.includes(m.id)).map(m => m.nombre),
  ].join(' · ') || 'Ningún destinatario seleccionado'
  const activos = ministerios.filter(m => m.nombre.toLocaleLowerCase('es').includes(filtro.toLocaleLowerCase('es')))

  function restaurarFormulario() {
    setTitulo(''); setEnlace(''); setDescripcion(''); setTipo('mensaje')
    setPublicar(false); setIglesia(true); setRoles([]); setGrupos([])
    setLideres(false); setFiltro(''); setVistaPrevia(false)
  }

  return <form className="mt-4 space-y-4" onSubmit={event => {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setError(null)
    start(async () => {
      try {
        const result = esLegado ? await guardarMensajeSemanal(values) : await guardarMensajeDirigido(values)
        if (!result.success) { setError(result.error || 'No se pudo guardar.'); return }
        if (!mensaje) { form.reset(); restaurarFormulario() }
        onSaved()
        router.refresh()
      } catch { setError('No se pudo guardar. Conservá tus datos e intentá nuevamente.') }
    })
  }}>
    {mensaje && <><input type="hidden" name="id" value={mensaje.id} /><input type="hidden" name="revision" value={mensaje.revision} /></>}
    <label className="block text-sm font-semibold text-slate-700">Título
      <input className={campo} name="titulo" required maxLength={140} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título del mensaje o devocional" />
    </label>
    <label className="block text-sm font-semibold text-slate-700">Enlace de YouTube
      <input className={campo} type="url" name="video_url" required maxLength={1500} value={enlace} onChange={e => setEnlace(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
    </label>
    <label className="block text-sm font-semibold text-slate-700">Descripción <span className="font-normal text-slate-400">· opcional</span>
      <textarea className={campo} name="descripcion" rows={3} maxLength={2000} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Una breve reflexión para acompañar el video." />
    </label>
    <label className="block text-sm font-semibold text-slate-700">Categoría
      <select name="tipo" className={campo} value={tipo} disabled={esLegado} onChange={e => setTipo(e.target.value === 'devocional' ? 'devocional' : 'mensaje')}>
        <option value="mensaje">Mensaje</option><option value="devocional">Devocional</option>
      </select>
    </label>

    <div className="border-t border-slate-200 pt-4">
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
        <input className="mt-1 h-5 w-5 shrink-0 accent-violet-600" type="checkbox" name="publicar"
          checked={publicar} onChange={e => setPublicar(e.target.checked)} />
        <span><strong className="block text-slate-900">Publicar para los destinatarios seleccionados</strong>
          Sin marcar, se guarda como borrador visible solo para ti.</span>
      </label>
      <div className="mt-4">
        <p className="text-sm font-bold text-slate-800">¿Quiénes pueden ver este mensaje?</p>
        <p className="mt-1 break-words text-xs leading-5 text-violet-800">{seleccion}</p>
        <details className="mt-3 rounded-xl border border-slate-200 bg-white">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-3 py-3 text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-violet-700" aria-hidden="true" /> Elegir destinatarios</span>
            <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
          </summary>
          <div className="space-y-4 border-t border-slate-200 px-3 py-4">
            {esLegado && <p className="text-xs leading-5 text-amber-800">Este mensaje se creó en el formato anterior; conserva su publicación original para toda la iglesia.</p>}
            <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-900">
              <input type="checkbox" className="h-5 w-5 shrink-0 accent-violet-600" name="audiencia_iglesia" checked={iglesia}
                disabled={esLegado} onChange={e => {
                  setIglesia(e.target.checked)
                  if (e.target.checked) { setRoles([]); setGrupos([]); setLideres(false) }
                }} />
              Toda la congregación
            </label>
            <p className="text-xs leading-5 text-slate-500">Podés combinar varios ministerios y grupos. Un miembro podrá verlo si pertenece a cualquiera de los que seleccionés.</p>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Roles de la iglesia</p>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {ROLES_DESTINO.map(r => <label key={r.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-slate-800">
                  <input className="h-5 w-5 shrink-0 accent-violet-600" type="checkbox" name="rol_destino" value={r.id}
                    checked={roles.includes(r.id)} disabled={esLegado} onChange={e => {
                      setIglesia(false)
                      setRoles(prev => e.target.checked ? [...prev, r.id] : prev.filter(v => v !== r.id))
                    }} />{r.nombre}
                </label>)}
              </div>
            </div>
            <label className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-slate-800">
              <input className="h-5 w-5 shrink-0 accent-violet-600" type="checkbox" name="lideres_ministerio"
                checked={lideres} disabled={esLegado} onChange={e => { setIglesia(false); setLideres(e.target.checked) }} />
              Líderes de ministerio (según su asignación)
            </label>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-600">Ministerios</p>
              <p className="mb-2 text-xs leading-5 text-slate-500">Marcá todos los ministerios que deban recibirlo.</p>
              {ministerios.length > 6 && <input type="search" value={filtro} onChange={e => setFiltro(e.target.value)}
                placeholder="Buscar ministerio…" aria-label="Buscar ministerio" className="mb-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900" />}
              {grupos.filter(id => !activos.some(m => m.id === id)).map(id =>
                <input key={'oculto-' + id} type="hidden" name="ministerio_destino" value={id} />)}
              {activos.length === 0 ? <p className="py-2 text-xs text-slate-500">No hay ministerios con ese nombre.</p> :
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {activos.map(m => <label key={m.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-slate-800">
                    <input className="h-5 w-5 shrink-0 accent-violet-600" type="checkbox" name="ministerio_destino" value={m.id}
                      checked={grupos.includes(m.id)} disabled={esLegado} onChange={e => {
                        setIglesia(false)
                        setGrupos(prev => e.target.checked ? [...prev, m.id] : prev.filter(v => v !== m.id))
                      }} />{m.nombre}
                  </label>)}
                </div>}
            </div>
            <p className="text-xs leading-5 text-slate-500">Al publicar, solo aparecerá en la biblioteca de las cuentas autorizadas. La privacidad del video original se configura por separado en YouTube.</p>
          </div>
        </details>
      </div>
    </div>

    <section className="border-t border-slate-200 pt-4" aria-label="Vista previa del mensaje">
      <button type="button" onClick={() => setVistaPrevia(v => !v)} aria-expanded={vistaPrevia}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold text-slate-800">
        <span className="flex items-center gap-2"><Eye className="h-4 w-4 text-violet-700" aria-hidden="true" /> Vista previa de la publicación</span>
        <ChevronDown className={'h-4 w-4 text-slate-500 transition-transform ' + (vistaPrevia ? 'rotate-180' : '')} aria-hidden="true" />
      </button>
      {vistaPrevia && <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500">Solo una vista previa. No publica ni guarda los cambios.</p>
        <h3 className="break-words text-xl font-bold leading-snug text-slate-900">{titulo.trim() || 'Título del devocional o mensaje'}</h3>
        {video ? <div className="aspect-video overflow-hidden rounded-xl bg-black">
          <iframe key={video.id} className="h-full w-full border-0" src={video.embed} title="Vista previa del video" loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div> : <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl bg-slate-200 text-center text-slate-600">
          <PlayCircle className="h-10 w-10" aria-hidden="true" /><p className="px-3 text-xs">Pegá un enlace válido de YouTube para ver el video.</p>
        </div>}
        {descripcion.trim() && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{descripcion}</p>}
        <p className="text-xs font-medium text-violet-800">Audiencia: {seleccion} · {publicar ? 'Se publicará al guardar' : 'Se guardará como borrador'}</p>
      </div>}
    </section>
    {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
    <button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}Guardar mensaje
    </button>
  </form>
}

export default function MensajesSemanalesEditor({ mensajes, ministerios }: {
  mensajes: MensajeConAudiencia[]; ministerios: MinisterioDestino[]
}) {
  const router = useRouter()
  const [nuevo, setNuevo] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [busy, start] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)
  return <section className="my-7 border-y border-slate-200 py-5" aria-labelledby="gestion-mensajes">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="gestion-mensajes" className="font-bold text-slate-900">Tus mensajes</h2>
      <button aria-expanded={nuevo} onClick={() => setNuevo(v => !v)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white">
        <Plus className="h-4 w-4" />Nuevo mensaje
      </button>
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-500">Subí el video a YouTube y pegá su enlace. Podés guardar un borrador o publicarlo para los grupos que elijás.</p>
    {nuevo && <Editor onSaved={() => { setNuevo(false); setAviso('Mensaje guardado.') }} ministerios={ministerios} />}
    {aviso && <p role="status" className="mt-3 text-sm text-slate-700">{aviso}</p>}
    {mensajes.length > 0 && <div className="mt-4 divide-y divide-slate-200">{mensajes.map(m => <div key={m.id} className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-bold text-slate-900">{m.titulo}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{resumenAudiencia(m, ministerios)}</p>
        </div>
        <div className="flex gap-3">
          <button aria-expanded={editando === m.id} onClick={() => setEditando(v => v === m.id ? null : m.id)}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-violet-700">Editar<ChevronDown className="h-4 w-4" /></button>
          <button disabled={busy} className="min-h-11 text-sm font-semibold text-slate-600 disabled:opacity-50"
            onClick={() => { setAviso(null); start(async () => {
              try {
                const r = m.origen === 'legado'
                  ? await cambiarPublicacionMensaje(m.id, m.revision, !m.publicado)
                  : await cambiarPublicacionDirigida(m.id, m.revision, !m.publicado)
                setAviso(r.success ? (m.publicado ? 'El mensaje quedó como borrador.' : 'El mensaje ya está publicado.') : r.error || 'No se pudo actualizar.')
                if (r.success) router.refresh()
              } catch { setAviso('No se pudo actualizar. Intentá nuevamente.') }
            }) }}
          >{m.publicado ? 'Despublicar' : 'Publicar'}</button>
        </div>
      </div>
      {editando === m.id && <Editor key={m.id + m.revision} mensaje={m} ministerios={ministerios}
        onSaved={() => { setEditando(null); setAviso('Mensaje actualizado.') }} />}
    </div>)}</div>}
  </section>
}
