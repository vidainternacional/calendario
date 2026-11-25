'use client'

import { useEffect, useId, useState } from 'react'
import { obtenerOpcionesDestinatarios, obtenerAudienciaPaquete, guardarGrupoDestinatarios, archivarGrupoDestinatarios, type OpcionesDestinatarios } from '@/app/actions/sedes-audiencias'
import { normalizarAudiencia, ROLES_SEDES, type AudienciaSedes } from '@/lib/sedes/audiencias'

export default function DestinatariosSelector({ initial = null, preservarLegado = false, defaultMinisterio, paqueteId, onChange, onRevision, onCompatibilidad }: {
  initial?: AudienciaSedes | null; preservarLegado?: boolean; defaultMinisterio?: string; paqueteId?: string; onChange?: (value: AudienciaSedes | null) => void; onRevision?: (value: string) => void; onCompatibilidad?: (value: boolean) => void
}) {
  const [opciones, setOpciones] = useState<OpcionesDestinatarios | null>(null)
  const [value, setValue] = useState<AudienciaSedes | null>(initial)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [grupo, setGrupo] = useState('')
  const [busy, setBusy] = useState(false)
  const [legado, setLegado] = useState(preservarLegado && !initial)
  const [compatibilidad, setCompatibilidad] = useState(false)
  const id = useId()
  useEffect(() => {
    let active = true
    void Promise.all([obtenerOpcionesDestinatarios(), paqueteId ? obtenerAudienciaPaquete(paqueteId) : Promise.resolve(null)]).then(([result, paquete]) => {
      if (!active) return
      if (!result.opciones) { setError(result.error || 'No se pudieron cargar los destinatarios.'); return }
      setOpciones(result.opciones)
      if (paquete?.error) { setError(paquete.error); return }
      if (paquete?.revision) onRevision?.(paquete.revision)
      const historico = result.opciones.sedes.length === 0 && !initial && !paquete?.audiencia
      setCompatibilidad(historico); onCompatibilidad?.(historico)
      if (historico) { setValue(null); onChange?.(null); return }
      if (paquete?.audiencia) setLegado(false)
      if (paquete?.audiencia) { setValue(paquete.audiencia); onChange?.(paquete.audiencia); return }
      if (!initial && !preservarLegado) {
        const ministerio = result.opciones.ministerios.find(m => m.id === defaultMinisterio)
        const next: AudienciaSedes = { version: 1, sedes: ministerio ? [ministerio.sede] : (result.opciones.global ? result.opciones.sedes.map(s => s.id) : result.opciones.pastorales.length ? result.opciones.pastorales : result.opciones.sedes.map(s => s.id)), todos: !ministerio && (result.opciones.global || result.opciones.pastorales.length > 0), roles: [], ministerios: ministerio ? [ministerio.id] : [], personas: [], lideres: false }
        setValue(next); onChange?.(next)
      }
    }).catch(() => { if (active) setError('No se pudieron cargar los destinatarios. Revisa tu conexión.') })
    return () => { active = false }
    // Los valores iniciales pertenecen a una ficha; el padre la remonta al cambiarla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function cambiar(next: AudienciaSedes | null) { setValue(next); onChange?.(next); setError('') }
  function toggle(key: 'sedes' | 'ministerios' | 'personas' | 'roles', item: string) {
    const current = value || { version: 1 as const, sedes: [], todos: false, roles: [], ministerios: [], personas: [], lideres: false }
    const items = current[key].includes(item) ? current[key].filter(x => x !== item) : [...current[key], item]
    let next = { ...current, [key]: items, ...(key !== 'sedes' && items.includes(item) ? { todos: false } : {}) }
    if (key === 'sedes') {
      next = { ...next, ministerios: next.ministerios.filter(mid => opciones?.ministerios.some(m => m.id === mid && items.includes(m.sede))) }
      if (!opciones?.global && items.some(id => !opciones?.pastorales.includes(id))) next = { ...next, todos: false, roles: [], lideres: false, personas: [] }
    }
    cambiar(next)
  }
  const pastoral = Boolean(opciones?.global || (value?.sedes.length && value.sedes.every(sede => opciones?.pastorales.includes(sede))))
  const label = value ? `${value.sedes.length} sede${value.sedes.length === 1 ? '' : 's'} · ${value.todos ? 'Publicación para la congregación' : 'Destinatarios seleccionados'}` : 'Destinatarios actuales sin cambiar'
  if (compatibilidad) return <details className="border-t border-slate-200 pt-3 text-slate-800">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Destinatarios actuales</summary>
    <p className="mt-2 text-sm leading-6 text-slate-600">Puedes seguir usando los destinatarios habituales. Administración debe asociar tus equipos o responsabilidad pastoral con una sede para habilitar los nuevos filtros por congregación.</p>
  </details>
  return <details className="border-t border-slate-200 pt-3">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-slate-800">Destinatarios · {label}</summary>
    <input type="hidden" name="vida_audiencia" value={value ? JSON.stringify(value) : ''} />
    {!preservarLegado && <input type="hidden" name="vida_sedes_requeridas" value="1" />}
    <div className="mt-2 space-y-4 text-sm text-slate-800">
      {error && <p role="alert" className="text-rose-800">{error}</p>}
      {!opciones && !error && <p>Cargando opciones autorizadas…</p>}
      {opciones && <>
        {!opciones.sedes.length && <p className="text-amber-900">Administración debe asociar tus ministerios o tu responsabilidad pastoral con una sede antes de usar estos destinos.</p>}
        <fieldset><legend className="font-semibold">Sedes</legend><div className="mt-2 flex flex-wrap gap-x-4">{opciones.sedes.map(sede => <label key={sede.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-rose-700" checked={value?.sedes.includes(sede.id) || false} onChange={() => toggle('sedes', sede.id)} />{sede.nombre}</label>)}</div></fieldset>
        {pastoral && <fieldset className="space-y-1"><legend className="font-semibold">Quiénes</legend>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-rose-700" checked={value?.todos || false} onChange={e => cambiar({ ...(value || { version: 1, sedes: [], roles: [], ministerios: [], personas: [], lideres: false }), todos: e.target.checked, ...(e.target.checked ? { roles: [], ministerios: [], personas: [], lideres: false } : {}) })} />Toda la congregación · información pública de esas sedes</label>
          {ROLES_SEDES.map(rol => <label key={rol} className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-rose-700" checked={value?.roles.includes(rol) || false} onChange={() => toggle('roles', rol)} />{({ administrador: 'Administradores', pastor: 'Pastores', lider: 'Líderes', servidor: 'Servidores' })[rol]}</label>)}
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-rose-700" checked={value?.lideres || false} onChange={e => cambiar({ ...(value || { version: 1, sedes: [], roles: [], ministerios: [], personas: [], todos: false }), lideres: e.target.checked, ...(e.target.checked ? { todos: false } : {}) })} />Líderes de ministerio</label>
        </fieldset>}
        <fieldset><legend className="font-semibold">Ministerios</legend>{opciones.ministerios.filter(m => value?.sedes.includes(m.sede)).map(m => <label key={m.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-rose-700" checked={value?.ministerios.includes(m.id) || false} onChange={() => toggle('ministerios', m.id)} />{m.nombre} · {opciones.sedes.find(s => s.id === m.sede)?.nombre}</label>)}</fieldset>
        {pastoral && <details><summary className="min-h-11 cursor-pointer py-3 font-semibold">Personas específicas · {value?.personas.length || 0}</summary><label htmlFor={`${id}-buscar`} className="sr-only">Buscar persona</label><input id={`${id}-buscar`} value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar persona" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900" />
          <div className="mt-2 max-h-64 overflow-y-auto">{opciones.personas.filter(p => p.nombre.toLocaleLowerCase('es').includes(filtro.toLocaleLowerCase('es'))).map(p => <label key={p.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-rose-700" checked={value?.personas.includes(p.id) || false} onChange={() => toggle('personas', p.id)} />{p.nombre}</label>)}</div>
        </details>}
        <details><summary className="min-h-11 cursor-pointer py-3 font-semibold">Mis grupos guardados</summary>
          {opciones.grupos.map(g => <div key={g.id} className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-2"><button type="button" className="min-h-11 font-semibold underline" onClick={() => { try { cambiar(normalizarAudiencia(g.audiencia)) } catch { setError('El grupo necesita actualizarse.') } }}>{g.nombre}</button><button type="button" disabled={busy} className="min-h-11 text-xs text-slate-500" onClick={async () => { setBusy(true);try { const result = await archivarGrupoDestinatarios(g.id, g.updated_at);if (result.error) setError(result.error);else setOpciones({ ...opciones, grupos: opciones.grupos.filter(x => x.id !== g.id) }) } catch { setError('No se pudo archivar el grupo.') } finally { setBusy(false) } }}>Archivar</button></div>)}
          <label className="mt-3 block">Nombre para guardar esta selección<input value={grupo} onChange={e => setGrupo(e.target.value)} maxLength={80} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900" /></label>
          <button type="button" disabled={busy || !value || !grupo.trim()} className="mt-2 min-h-11 font-semibold underline disabled:opacity-40" onClick={async () => { if (!value) return;setBusy(true);try { const result = await guardarGrupoDestinatarios(grupo, value);if (result.error) setError(result.error);else { const next = await obtenerOpcionesDestinatarios();if (next.opciones) setOpciones(next.opciones);setGrupo('') } } catch { setError('No se pudo guardar el grupo.') } finally { setBusy(false) } }}>Guardar grupo</button>
        </details>
        <p className="text-xs leading-5 text-slate-500">Se comprueban los permisos al enviar, incluso usando un grupo guardado. Cada persona recibe un solo aviso. Ver otra sede no concede acceso a sus equipos privados.</p>
        {legado && <button type="button" className="min-h-11 text-xs underline" onClick={() => cambiar(null)}>Conservar destinatarios históricos</button>}
      </>}
    </div>
  </details>
}
