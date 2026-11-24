'use client'

import { useId, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown, Loader2, Eye, PlayCircle, Users } from 'lucide-react'
import { guardarMensajeSemanal, cambiarPublicacionMensaje, eliminarMensajeSemanal } from '@/app/actions/mensajes-semanales'
import { guardarMensajeDirigido, cambiarPublicacionDirigida, avisarMensajeDirigido, eliminarMensajeDirigido } from '@/app/actions/mensajes-dirigidos'
import { youtubeVideo } from '@/lib/estudios/youtube-link'
import {
  ROLES_DESTINO, CATEGORIAS_DEVOCIONALES, TIPO_DEVOCIONAL_IDS, etiquetaTipo, resumenAudiencia,
  type MensajeConAudiencia, type MinisterioDestino, type RolDestino, type TipoDevocional,
} from '@/lib/estudios/mensajes-dirigidos-tipos'

import DestinatariosSelector from '@/components/sedes/DestinatariosSelector'
import type { AudienciaSedes } from '@/lib/sedes/audiencias'

const campo = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'

function Editor({ mensaje, ministerios, seriesDisponibles, onSaved }: {
  mensaje?: MensajeConAudiencia; ministerios: MinisterioDestino[]; seriesDisponibles: string[]; onSaved: (aviso?: string) => void
}) {
  const router = useRouter()
  const seriesListId = useId()
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [titulo, setTitulo] = useState(mensaje?.titulo ?? '')
  const [enlace, setEnlace] = useState(mensaje?.videoUrl ?? '')
  const [descripcion, setDescripcion] = useState(mensaje?.descripcion ?? '')
  const [tipo, setTipo] = useState<TipoDevocional>(mensaje?.tipo ?? 'mensaje')
  const [serieTitulo, setSerieTitulo] = useState(mensaje?.serieTitulo ?? '')
  const [serieEpisodio, setSerieEpisodio] = useState(mensaje?.serieEpisodio?.toString() ?? '1')
  const [publicar, setPublicar] = useState(mensaje?.publicado ?? false)
  const [scoped, setScoped] = useState<AudienciaSedes | null>(mensaje?.vidaAudiencia || null)
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
    setSerieTitulo(''); setSerieEpisodio('1')
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
        const result: { success: boolean; error?: string; aviso?: string } = esLegado ? await guardarMensajeSemanal(values) : await guardarMensajeDirigido(values)
        if (!result.success) { setError(result.error || 'No se pudo guardar.'); return }
        if (!mensaje) { form.reset(); restaurarFormulario() }
        onSaved(result.aviso)
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
      <select name="tipo" className={campo} value={tipo} disabled={esLegado}
        onChange={e => { const nuevo = e.target.value as TipoDevocional; if (TIPO_DEVOCIONAL_IDS.has(nuevo)) setTipo(nuevo) }}>
        {CATEGORIAS_DEVOCIONALES.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>
    </label>
    {tipo === 'serie' && !esLegado && <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3" aria-label="Datos de la serie">
      <p className="text-sm font-bold text-violet-900">Organizar serie por episodios</p>
      <label className="block text-sm font-semibold text-slate-700">Nombre de la serie
        <input className={campo} name="serie_titulo" list={seriesListId} required maxLength={100}
          value={serieTitulo} onChange={e => setSerieTitulo(e.target.value)} placeholder="Ej. Fundamentos de la fe" />
      </label>
      <datalist id={seriesListId}>{seriesDisponibles.map(nombre => <option key={nombre} value={nombre} />)}</datalist>
      <label className="block text-sm font-semibold text-slate-700">Número de episodio
        <input className={campo} name="serie_episodio" type="number" inputMode="numeric" min={1} max={999} step={1} required
          value={serieEpisodio} onChange={e => setSerieEpisodio(e.target.value)} />
      </label>
      <p className="text-xs leading-5 text-slate-600">Usá el mismo nombre de serie en cada episodio. La biblioteca los agrupará y ordenará por número.</p>
    </div>}

    {!scoped && Boolean(mensaje) && <>
    <div className="border-t border-slate-200 pt-4">
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
        <input className="mt-1 h-5 w-5 shrink-0 accent-violet-600" type="checkbox" name="publicar"
          checked={publicar} onChange={e => setPublicar(e.target.checked)} />
        <span><strong className="block text-slate-900">Publicar para los destinatarios seleccionados</strong>
          {esLegado ? 'Sin marcar, se guarda como borrador visible solo para ti.' : 'Sin marcar, se guarda como borrador para su autor y los administradores activos.'}</span>
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
            <p className="text-xs leading-5 text-slate-500">Al publicar, aparecerá en la biblioteca de las cuentas autorizadas y se les enviará el aviso si tienen notificaciones activadas. La privacidad del video original se configura por separado en YouTube.</p>
          </div>
        </details>
      </div>
    </div>

    </>}
    <DestinatariosSelector key={mensaje?.id || 'nuevo'} initial={mensaje?.vidaAudiencia} preservarLegado={Boolean(mensaje)} onChange={setScoped} />

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
        <p className="text-xs font-medium text-violet-800">Audiencia: {scoped ? `${scoped.sedes.length} sede(s) · ${scoped.todos ? 'Congregación' : 'Destinatarios seleccionados'}` : seleccion} · {publicar ? 'Se publicará al guardar' : 'Se guardará como borrador'}</p>
      </div>}
    </section>
    {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
    <button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}Guardar mensaje
    </button>
  </form>
}

export default function MensajesSemanalesEditor({ mensajes, ministerios, esAdministrador = false }: {
  mensajes: MensajeConAudiencia[]; ministerios: MinisterioDestino[]; esAdministrador?: boolean
}) {
  const router = useRouter()
  const [nuevo, setNuevo] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('todos')
  const visibles = mensajes.filter(m => (estado === 'todos' || (estado === 'publicados' ? m.publicado : !m.publicado)) && `${m.titulo} ${m.descripcion} ${m.serieTitulo || ''}`.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es')))
  const [busy, start] = useTransition()
  const [aviso, setAviso] = useState<string | null>(null)
  const seriesDisponibles = [...new Set(mensajes.filter(m => m.tipo === 'serie' && m.serieTitulo).map(m => m.serieTitulo!))].sort((a, b) => a.localeCompare(b, 'es'))
  return <section className="my-7 border-y border-slate-200 py-5" aria-labelledby="gestion-mensajes">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="gestion-mensajes" className="font-bold text-slate-900">Galería de mensajes</h2>
      <button aria-expanded={nuevo} onClick={() => { setNuevo(v => !v); setEditando(null); setEliminando(null) }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white">
        <Plus className="h-4 w-4" />Nuevo mensaje
      </button>
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-500">Encontrá tus publicaciones y borradores. Desde aquí podés corregir el título, la descripción o el video, y administrar su publicación.</p>
    {nuevo && <Editor onSaved={(aviso) => { setNuevo(false); setAviso(aviso || 'Mensaje guardado.') }} ministerios={ministerios} seriesDisponibles={seriesDisponibles} />}
    {aviso && <p role="status" className="mt-3 text-sm text-slate-700">{aviso}</p>}
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Buscar en tus mensajes
        <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} className={campo} placeholder="Título, descripción o serie…" />
      </label>
      <label className="text-xs font-semibold text-slate-600">Mostrar
        <select value={estado} onChange={e => setEstado(e.target.value)} className={campo}>
          <option value="todos">Todos</option><option value="publicados">Publicados</option><option value="borradores">Borradores</option>
        </select>
      </label>
    </div>
    <p className="mt-3 text-xs text-slate-500">{visibles.length} de {mensajes.length} mensajes · {esAdministrador ? 'Administración general de mensajes.' : 'Administrás tus propios mensajes.'}</p>
    {visibles.length === 0 && <p className="py-7 text-sm text-slate-500">{mensajes.length ? 'No hay mensajes con esos filtros.' : 'Tus mensajes aparecerán aquí cuando guardés el primero.'}</p>}
    {visibles.length > 0 && <div className="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2">{visibles.map(m => <div key={m.id} className={'min-w-0 border-t border-slate-200 py-4 ' + (editando === m.id || eliminando === m.id ? 'sm:col-span-2' : '')}>
      <button type="button" aria-label={`Editar video: ${m.titulo}`} disabled={busy} onClick={() => { setEditando(m.id); setNuevo(false); setEliminando(null) }} className="mb-3 block w-full overflow-hidden rounded-lg text-left disabled:opacity-50">
        {youtubeVideo(m.videoUrl) ? <Image src={`https://i.ytimg.com/vi/${youtubeVideo(m.videoUrl)!.id}/hqdefault.jpg`} alt="" width={480} height={270} unoptimized className="aspect-video w-full object-cover" /> : <span className="flex aspect-video items-center justify-center bg-slate-100 text-slate-500"><PlayCircle className="h-8 w-8" /></span>}
      </button>
      <p className="mb-2 text-xs font-bold text-slate-600">{m.publicado ? 'Publicado' : 'Borrador'}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-bold text-slate-900">{m.titulo}</h3>
          <p className="mt-1 text-xs font-medium text-violet-700">{etiquetaTipo(m.tipo)}{m.tipo === 'serie' ? ` · ${m.serieTitulo || 'Serie'} · Episodio ${m.serieEpisodio ?? '—'}` : ''}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{resumenAudiencia(m, ministerios)}</p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1">
          <button aria-expanded={editando === m.id} disabled={busy} onClick={() => { setEditando(v => v === m.id ? null : m.id); setNuevo(false); setEliminando(null) }}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-violet-700">Editar<ChevronDown className="h-4 w-4" /></button>
          <button disabled={busy} className="min-h-11 text-sm font-semibold text-slate-600 disabled:opacity-50"
            onClick={() => { setAviso(null); start(async () => {
              try {
                const r: { success: boolean; error?: string; aviso?: string } = m.origen === 'legado'
                  ? await cambiarPublicacionMensaje(m.id, m.revision, !m.publicado)
                  : await cambiarPublicacionDirigida(m.id, m.revision, !m.publicado)
                setAviso(r.success ? r.aviso || (m.publicado ? 'El mensaje quedó como borrador.' : 'El mensaje ya está publicado.') : r.error || 'No se pudo actualizar.')
                if (r.success) router.refresh()
              } catch { setAviso('No se pudo actualizar. Intentá nuevamente.') }
            }) }}
          >{m.publicado ? 'Despublicar' : 'Publicar'}</button>
          {m.publicado && <Link href={`/estudios/mensajes/${m.id}?origen=pastoral`} className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600">Ver publicación</Link>}
          {esAdministrador && <button type="button" disabled={busy} className="min-h-11 text-sm font-semibold text-red-700 disabled:opacity-50" onClick={() => { setEliminando(m.id); setEditando(null); setNuevo(false); setAviso(null) }}>Eliminar</button>}
          {m.publicado && m.origen !== 'legado' ? <button type="button" disabled={busy} className="min-h-11 text-sm font-semibold text-violet-700 disabled:opacity-50" onClick={() => { setAviso(null); start(async () => { try { const r = await avisarMensajeDirigido(m.id); setAviso(r.success ? r.aviso || 'Aviso preparado.' : r.error || 'No se pudo enviar.'); } catch { setAviso('No se pudo completar el aviso. Puedes reintentar.'); } }) }}>Reenviar aviso pendiente</button> : null}
        </div>
      </div>
      {eliminando === m.id && <div role="group" aria-label={`Confirmar eliminación: ${m.titulo}`} className="mt-3 border-t border-red-200 pt-4">
        <p className="text-sm font-semibold text-slate-900">¿Eliminar «{m.titulo}»?</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">Se quitará de VIDA y no podrás deshacerlo. El video original seguirá en YouTube. Si solo querés ocultarlo, podés despublicarlo.</p>
        <div className="mt-2 flex flex-wrap gap-5">
          <button type="button" disabled={busy} className="min-h-11 text-sm font-bold text-slate-600 disabled:opacity-50" onClick={() => setEliminando(null)}>Cancelar</button>
          <button type="button" disabled={busy} className="min-h-11 text-sm font-bold text-red-700 disabled:opacity-50" onClick={() => { start(async () => {
            try {
              const r = m.origen === 'legado' ? await eliminarMensajeSemanal(m.id, m.revision) : await eliminarMensajeDirigido(m.id, m.revision)
              if (!r.success) { setAviso(r.error || 'No se pudo eliminar.'); return }
              setEliminando(null); setAviso('Mensaje eliminado.'); router.refresh()
            } catch { setAviso('No se pudo eliminar. Conservamos el mensaje para que puedas reintentar.') }
          }) }}>{busy ? 'Eliminando…' : 'Sí, eliminar mensaje'}</button>
        </div>
      </div>}
      {editando === m.id && <Editor key={m.id + m.revision} mensaje={m} ministerios={ministerios}
        onSaved={(aviso) => { setEditando(null); setAviso(aviso || 'Mensaje actualizado.') }} seriesDisponibles={seriesDisponibles} />}
    </div>)}</div>}
  </section>
}
