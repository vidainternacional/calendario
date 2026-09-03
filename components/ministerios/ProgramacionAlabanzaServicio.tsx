import { ExternalLink } from 'lucide-react'
import {
  actualizarCancionAlabanza,
  eliminarCancionAlabanza,
  guardarPaletaAlabanza,
} from '@/app/actions/programacion-alabanza'
import {
  asignarFuncionEquipoMinisterial,
  cambiarDisponibilidadFuncionMiembro,
  obtenerDatosEquipoServicio,
  quitarFuncionEquipoMinisterial,
} from '@/app/actions/equipo-ministerial'
import EquipoServicioEditor from '@/components/ministerios/EquipoServicioEditor'
import PaletaAlabanzaEditor from '@/components/ministerios/PaletaAlabanzaEditor'
import ProgramacionAlabanzaSecciones from '@/components/ministerios/ProgramacionAlabanzaSecciones'
import RepertorioBibliotecaPicker, { type CancionBiblioteca } from '@/components/ministerios/RepertorioBibliotecaPicker'

type Props = {
  ministerioId: string
  eventoId: string
  puedeEditarProgramacion: boolean
  puedePaleta: boolean
  asignadosEvento: any[]
  repertorio: any[]
  biblioteca: CancionBiblioteca[]
  paleta: any
  colores: string[]
  defaults: string[]
}

export default async function ProgramacionAlabanzaServicio({
  ministerioId,
  eventoId,
  puedeEditarProgramacion,
  puedePaleta,
  asignadosEvento,
  repertorio,
  biblioteca,
  paleta,
  colores,
  defaults,
}: Props) {
  let equipo: Awaited<ReturnType<typeof obtenerDatosEquipoServicio>> | null = null
  if (puedeEditarProgramacion) {
    try {
      equipo = await obtenerDatosEquipoServicio(ministerioId, eventoId)
    } catch {
      equipo = null
    }
  }

  const personasAsignadas = new Set(asignadosEvento.map((item) => String(item.profile_id))).size

  const equipoContenido = equipo ? (
    <EquipoServicioEditor
      funciones={equipo.funciones}
      miembros={equipo.miembros}
      asignaciones={equipo.asignaciones}
      disponibilidadAction={cambiarDisponibilidadFuncionMiembro.bind(null, ministerioId)}
      asignarAction={asignarFuncionEquipoMinisterial.bind(null, ministerioId, eventoId)}
      quitarAction={quitarFuncionEquipoMinisterial.bind(null, ministerioId, eventoId)}
    />
  ) : (
    <div className="text-slate-900">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-500">Equipo del servicio</p>
      <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
        {asignadosEvento.length === 0 ? (
          <p className="py-5 text-sm text-slate-500">Todavía no hay integrantes asignados.</p>
        ) : asignadosEvento.map((assignment, index) => (
          <div key={`${assignment.profile_id}-${assignment.capacidad_id}-${index}`} className="flex min-h-[58px] items-center justify-between gap-3 py-2.5">
            <p className="min-w-0 truncate text-sm font-extrabold text-slate-800">{assignment.persona?.nombre_completo || 'Servidor'}</p>
            <span className="shrink-0 text-[10px] font-bold text-indigo-600">{assignment.capacidad?.nombre || 'Sin función'}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const repertorioContenido = (
    <div className="text-slate-900">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-violet-500">Repertorio del servicio</p>
          <h3 className="mt-1 text-lg font-extrabold text-slate-900">{repertorio.length} {repertorio.length === 1 ? 'canción' : 'canciones'}</h3>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
        {repertorio.length === 0 ? (
          <p className="py-5 text-sm text-slate-500">Todavía no hay canciones en este servicio.</p>
        ) : repertorio.map((row: any, index: number) => {
          const librarySong = Array.isArray(row.ministerio_canciones) ? row.ministerio_canciones[0] : row.ministerio_canciones
          const title = librarySong?.titulo || row.titulo
          const spotify = librarySong?.spotify_url || row.spotify_url || null
          const youtube = librarySong?.youtube_url || row.youtube_url || null
          return (
            <details key={row.id} className="group">
              <summary className="flex min-h-[62px] cursor-pointer list-none items-center gap-3 py-2.5 [&::-webkit-details-marker]:hidden">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-extrabold text-violet-600">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-slate-800">{title}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-400">{librarySong?.artista || 'Canción del repertorio'}</span>
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-700">{row.tonalidad || '—'}</span>
                <span className="text-sm text-slate-300 transition-transform group-open:rotate-45">+</span>
              </summary>

              <div className="pb-4 pl-11">
                {row.notas ? <p className="mb-3 whitespace-pre-wrap text-[11px] leading-5 text-slate-500">{row.notas}</p> : null}
                {(spotify || youtube || row.enlace) ? (
                  <div className="mb-3 flex flex-wrap gap-3">
                    {spotify ? <a href={spotify} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">Spotify <ExternalLink className="h-3 w-3" /></a> : null}
                    {youtube ? <a href={youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">YouTube <ExternalLink className="h-3 w-3" /></a> : null}
                  </div>
                ) : null}

                {puedeEditarProgramacion ? (
                  <>
                    <form action={actualizarCancionAlabanza.bind(null, ministerioId, eventoId)} className="grid gap-3">
                      <input type="hidden" name="repertorio_id" value={row.id} />
                      <input type="hidden" name="titulo" value={title} />
                      <input type="hidden" name="spotify_url" value={spotify || ''} />
                      <input type="hidden" name="youtube_url" value={youtube || ''} />
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Tono de este servicio
                        <input name="tonalidad" defaultValue={row.tonalidad || ''} placeholder="Ej. G" className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400" />
                      </label>
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Indicación del servicio
                        <textarea name="notas" defaultValue={row.notas || ''} placeholder="Entrada, cortes, dinámica o indicación para este servicio" className="mt-1 min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                      </label>
                      <button className="h-10 rounded-xl bg-indigo-600 text-xs font-bold text-white">Guardar</button>
                    </form>
                    <form action={eliminarCancionAlabanza.bind(null, ministerioId, eventoId)} className="mt-2">
                      <input type="hidden" name="repertorio_id" value={row.id} />
                      <button className="h-9 text-[10px] font-bold text-rose-600">Quitar del servicio</button>
                    </form>
                  </>
                ) : null}
              </div>
            </details>
          )
        })}
      </div>

      {puedeEditarProgramacion ? (
        <RepertorioBibliotecaPicker canciones={biblioteca} agregarAction={async () => {}} crearAction={async () => {}} />
      ) : null}
    </div>
  )

  const paletaContenido = (
    <div className="text-slate-900">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-pink-500">Paleta del servicio</p>
      <div className="mt-3 flex h-5 overflow-hidden rounded-full ring-1 ring-black/5">
        {(colores.length ? colores : defaults).map((item, index) => <span key={`${item}-${index}`} className="flex-1" style={{ backgroundColor: item }} />)}
      </div>
      {paleta?.observaciones ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{paleta.observaciones}</p> : null}
      {paleta?.referencia_url ? <a href={paleta.referencia_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Referencia visual <ExternalLink className="h-3 w-3" /></a> : null}
      {puedePaleta ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <PaletaAlabanzaEditor
            action={guardarPaletaAlabanza.bind(null, ministerioId, eventoId)}
            initialColors={colores.length ? colores : defaults}
            initialObservaciones={paleta?.observaciones}
            initialReferenciaUrl={paleta?.referencia_url}
            puedeProgramar={puedeEditarProgramacion}
          />
        </div>
      ) : null}
    </div>
  )

  return (
    <ProgramacionAlabanzaSecciones
      equipoCount={personasAsignadas}
      repertorioCount={repertorio.length}
      paletaLista={Boolean(colores.length || paleta?.observaciones || paleta?.referencia_url)}
      equipo={equipoContenido}
      repertorio={repertorioContenido}
      paleta={paletaContenido}
    />
  )
}
