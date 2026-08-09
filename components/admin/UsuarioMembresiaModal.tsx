'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, BellRing, BriefcaseBusiness, CalendarDays, HeartHandshake, Languages, Loader2, Mail, MapPin, Phone, Shield, Sparkles, Trash2, Users, X } from 'lucide-react'
import { eliminarUsuarioDefinitivamente, toggleMembresia } from '@/app/actions/admin'
import { obtenerContextoAdministrador } from '@/app/actions/admin-permissions'
import { actualizarLiderazgoMinisterial } from '@/app/actions/liderazgo'
import { toggleCapacidadMinisterial, toggleResponsabilidadMinisterial } from '@/app/actions/programacion-ministerial'

function chips(items: unknown) { return Array.isArray(items) ? items.filter(Boolean) : [] }

export default function UsuarioMembresiaModal({
  usuario,
  todosMinisterios,
  capacidadesMinisteriales = [],
  responsabilidadesMinisteriales = [],
  isOpen,
  onClose,
}: {
  usuario: any | null
  todosMinisterios: any[]
  capacidadesMinisteriales?: any[]
  responsabilidadesMinisteriales?: any[]
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState(false)
  const [puedeEliminar, setPuedeEliminar] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [overrides, setOverrides] = useState<Record<string, { member: boolean; lider: boolean }>>({})
  const [capacidadOverrides, setCapacidadOverrides] = useState<Record<string, boolean>>({})
  const [responsabilidadOverrides, setResponsabilidadOverrides] = useState<Record<string, boolean>>({})
  const isProcessing = Object.values(loadingIds).some(Boolean) || deleting

  useEffect(() => {
    if (!isOpen) {
      setError('')
      setOverrides({})
      setCapacidadOverrides({})
      setResponsabilidadOverrides({})
      setPuedeEliminar(false)
      setCurrentUserId(null)
      return
    }

    let cancelled = false
    void (async () => {
      const contexto = await obtenerContextoAdministrador()
      if (!cancelled) {
        setPuedeEliminar(contexto.esAdministrador)
        setCurrentUserId(contexto.userId)
      }
    })()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !isProcessing) onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelled = true
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isProcessing, onClose])

  if (!isOpen || !usuario) return null

  const details = usuario.detalle_perfil || null
  const baseMembresias = usuario.ministerio_miembros || []
  const misMembresias = Array.isArray(baseMembresias) ? baseMembresias : [baseMembresias]
  const liderazgos = misMembresias.filter((m: any) => m.es_lider).length
  const habilidades = chips(details?.habilidades_personales)
  const idiomas = chips(details?.idiomas)
  const formacion = chips(details?.formacion_ministerial)
  const disponibilidad = chips(details?.disponibilidad_dias)
  const capacidadesAsignadas = chips(usuario.capacidades_ministeriales_ids) as string[]
  const responsabilidadesAsignadas = chips(usuario.responsabilidades_especiales_ids) as string[]
  const completionValues = [usuario.telefono, usuario.fecha_nacimiento, details?.estado_civil, details?.municipio, details?.departamento, details?.contacto_emergencia_nombre, details?.bautizado !== null && details?.bautizado !== undefined, details?.fecha_ingreso_vida, details?.profesion_oficio, habilidades.length, idiomas.length, disponibilidad.length]
  const completion = Math.round((completionValues.filter(Boolean).length / completionValues.length) * 100)

  const estadoMinisterio = (minId: string) => {
    if (overrides[minId]) return overrides[minId]
    const membresia = misMembresias.find((m: any) => m.ministerio_id === minId)
    return { member: !!membresia, lider: !!membresia?.es_lider }
  }

  const capacidadActiva = (capacidadId: string) => capacidadId in capacidadOverrides
    ? capacidadOverrides[capacidadId]
    : capacidadesAsignadas.includes(capacidadId)

  const responsabilidadActiva = (responsabilidadId: string) => responsabilidadId in responsabilidadOverrides
    ? responsabilidadOverrides[responsabilidadId]
    : responsabilidadesAsignadas.includes(responsabilidadId)

  const handleToggleMembresia = async (minId: string, isMember: boolean, currentlyLider: boolean) => {
    setLoadingIds((p) => ({ ...p, [minId]: true })); setError('')
    try {
      if (isMember && currentlyLider) {
        const liderazgo = await actualizarLiderazgoMinisterial(usuario.id, minId, false)
        if (!liderazgo.success) { setError(liderazgo.error || 'No fue posible quitar el liderazgo.'); return }
      }
      await toggleMembresia(usuario.id, minId, !isMember)
      setOverrides((p) => ({ ...p, [minId]: isMember ? { member: false, lider: false } : { member: true, lider: false } }))
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'No fue posible actualizar la membresía.')
    } finally {
      setLoadingIds((p) => ({ ...p, [minId]: false }))
    }
  }

  const handleToggleLider = async (minId: string, currentlyLider: boolean) => {
    setLoadingIds((p) => ({ ...p, [`lider_${minId}`]: true })); setError('')
    try {
      const result = await actualizarLiderazgoMinisterial(usuario.id, minId, !currentlyLider)
      if (!result.success) { setError(result.error || 'No fue posible cambiar el liderazgo.'); return }
      setOverrides((p) => ({ ...p, [minId]: { member: true, lider: !currentlyLider } }))
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'No fue posible cambiar el liderazgo.')
    } finally {
      setLoadingIds((p) => ({ ...p, [`lider_${minId}`]: false }))
    }
  }

  const handleToggleCapacidad = async (capacidad: any) => {
    const activa = capacidadActiva(capacidad.id)
    const key = `cap_${capacidad.id}`
    setLoadingIds((p) => ({ ...p, [key]: true })); setError('')
    try {
      const result = await toggleCapacidadMinisterial(usuario.id, capacidad.ministerio_id, capacidad.id, !activa)
      if (!result.success) { setError(result.error || 'No fue posible actualizar la capacidad.'); return }
      setCapacidadOverrides((p) => ({ ...p, [capacidad.id]: !activa }))
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'No fue posible actualizar la capacidad.')
    } finally {
      setLoadingIds((p) => ({ ...p, [key]: false }))
    }
  }

  const handleToggleResponsabilidad = async (responsabilidad: any) => {
    const activa = responsabilidadActiva(responsabilidad.id)
    const key = `resp_${responsabilidad.id}`
    setLoadingIds((p) => ({ ...p, [key]: true })); setError('')
    try {
      const result = await toggleResponsabilidadMinisterial(usuario.id, responsabilidad.id, !activa)
      if (!result.success) { setError(result.error || 'No fue posible actualizar la responsabilidad.'); return }
      setResponsabilidadOverrides((p) => ({ ...p, [responsabilidad.id]: !activa }))
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'No fue posible actualizar la responsabilidad.')
    } finally {
      setLoadingIds((p) => ({ ...p, [key]: false }))
    }
  }

  const handleEliminarUsuario = async () => {
    const confirmacion = window.prompt(`Vas a eliminar definitivamente a ${usuario.nombre_completo || 'este usuario'} y su acceso a VIDA. Esta acción no se puede deshacer.\n\nEscribe ELIMINAR para confirmar.`)
    if (confirmacion !== 'ELIMINAR') return
    setDeleting(true); setError('')
    try {
      const result = await eliminarUsuarioDefinitivamente(usuario.id)
      if (!result.success) { setError(result.error || 'No fue posible eliminar al usuario.'); return }
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'No fue posible eliminar al usuario.')
    } finally {
      setDeleting(false)
    }
  }

  const inicial = (usuario.nombre_completo || 'U').trim().charAt(0).toUpperCase()
  const label = (value: string | null | undefined) => value ? value.replaceAll('_', ' ') : 'No indicado'
  const ministeriosConCapacidades = todosMinisterios.filter((ministerio) =>
    estadoMinisterio(ministerio.id).member && capacidadesMinisteriales.some((capacidad) => capacidad.ministerio_id === ministerio.id),
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="ficha-usuario-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !isProcessing) onClose() }}>
      <div className="flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-md flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl sm:max-h-[88vh]">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Administración</p><h3 id="ficha-usuario-title" className="mt-0.5 font-bold text-[#171923]">Ficha integral del miembro</h3></div>
          <button type="button" onClick={onClose} disabled={isProcessing} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 text-gray-500 disabled:opacity-50" aria-label="Cerrar ficha del usuario"><X className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <section className="rounded-[20px] bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex items-center gap-3"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xl font-extrabold text-indigo-600 ring-2 ring-white shadow-sm">{usuario.avatar_url ? <img src={usuario.avatar_url} alt="" className="h-full w-full object-cover" /> : inicial}</div><div className="min-w-0 flex-1"><h4 className="break-words text-base font-extrabold text-[#171923]">{usuario.nombre_completo || 'Usuario sin nombre'}</h4><div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold capitalize text-indigo-700">{usuario.rol}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${usuario.estado_cuenta === 'suspendido' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{usuario.estado_cuenta || 'activo'}</span>{usuario.push_activo && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700"><BellRing className="h-3 w-3" />Push</span>}</div></div></div>
            <div className="mt-4 space-y-2 border-t border-slate-200/70 pt-4 text-xs text-slate-600">{usuario.email && <div className="flex min-w-0 items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="break-all">{usuario.email}</span></div>}{usuario.telefono && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span>{usuario.telefono}</span></div>}<div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span>En VIDA desde {usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }) : 'fecha no disponible'}</span></div><div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span>Última actividad: {usuario.ultima_actividad ? new Date(usuario.ultima_actividad).toLocaleString('es-SV') : 'sin registro reciente'}</span></div></div>
            <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white p-3 text-center shadow-sm"><p className="text-xl font-extrabold text-[#171923]">{misMembresias.length}</p><p className="text-[9px] uppercase tracking-wide text-slate-400">Ministerios</p></div><div className="rounded-xl bg-white p-3 text-center shadow-sm"><p className="text-xl font-extrabold text-[#171923]">{liderazgos}</p><p className="text-[9px] uppercase tracking-wide text-slate-400">Liderazgos</p></div><div className="rounded-xl bg-white p-3 text-center shadow-sm"><p className="text-xl font-extrabold text-indigo-600">{completion}%</p><p className="text-[9px] uppercase tracking-wide text-slate-400">Perfil</p></div></div>
          </section>

          <section className="mt-5 space-y-3 rounded-[20px] border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Información del miembro</p><h4 className="mt-0.5 text-sm font-extrabold text-[#171923]">Datos personales y comunitarios</h4></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-600">{details ? 'Completada' : 'Pendiente'}</span></div>
            {!details ? <p className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-500">Este miembro todavía no ha completado su ficha ampliada desde Mi Perfil.</p> : <>
              <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-white p-3"><p className="text-[9px] font-bold uppercase text-slate-400">Estado civil</p><p className="mt-1 capitalize font-semibold text-slate-700">{label(details.estado_civil)}</p></div><div className="rounded-xl bg-white p-3"><p className="text-[9px] font-bold uppercase text-slate-400">Sexo</p><p className="mt-1 capitalize font-semibold text-slate-700">{label(details.sexo)}</p></div></div>
              {(details.municipio || details.departamento || details.direccion_referencia) && <div className="rounded-xl bg-white p-3"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-500" /><p className="text-xs font-bold text-slate-700">Ubicación</p></div><p className="mt-1 text-xs leading-5 text-slate-500">{[details.municipio, details.departamento].filter(Boolean).join(', ')}{details.direccion_referencia ? ` · ${details.direccion_referencia}` : ''}</p></div>}
              {details.contacto_emergencia_nombre && <div className="rounded-xl bg-white p-3"><div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-rose-500" /><p className="text-xs font-bold text-slate-700">Contacto de emergencia</p></div><p className="mt-1 text-xs text-slate-500">{details.contacto_emergencia_nombre}{details.contacto_emergencia_relacion ? ` · ${details.contacto_emergencia_relacion}` : ''}{details.contacto_emergencia_telefono ? ` · ${details.contacto_emergencia_telefono}` : ''}</p></div>}
              <div className="rounded-xl bg-white p-3"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /><p className="text-xs font-bold text-slate-700">Vida espiritual</p></div><p className="mt-1 text-xs leading-5 text-slate-500">Bautizado/a: {details.bautizado === true ? 'Sí' : details.bautizado === false ? 'No' : 'No indicado'}{details.fecha_bautismo ? ` · ${new Date(`${details.fecha_bautismo}T12:00:00`).toLocaleDateString('es-SV')}` : ''}{details.fecha_ingreso_vida ? ` · En VIDA desde ${new Date(`${details.fecha_ingreso_vida}T12:00:00`).toLocaleDateString('es-SV')}` : ''}{details.iglesia_anterior ? ` · Iglesia anterior: ${details.iglesia_anterior}` : ''}</p></div>
              {(details.profesion_oficio || details.empresa_emprendimiento) && <div className="rounded-xl bg-white p-3"><div className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-emerald-500" /><p className="text-xs font-bold text-slate-700">Profesión y experiencia</p></div><p className="mt-1 text-xs font-semibold text-slate-700">{details.profesion_oficio || 'Sin profesión indicada'}{details.empresa_emprendimiento ? ` · ${details.empresa_emprendimiento}` : ''}</p>{details.descripcion_profesional && <p className="mt-1 text-xs leading-5 text-slate-500">{details.descripcion_profesional}</p>}</div>}
              {disponibilidad.length > 0 && <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold text-slate-700">Disponibilidad para servir</p><div className="mt-2 flex flex-wrap gap-1.5">{disponibilidad.map((item: string) => <span key={item} className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">{item}</span>)}</div>{details.disponibilidad_horarios && <p className="mt-2 text-xs text-slate-500">{details.disponibilidad_horarios}</p>}</div>}
              {(habilidades.length > 0 || idiomas.length > 0 || formacion.length > 0) && <div className="rounded-xl bg-white p-3"><div className="flex items-center gap-2"><Languages className="h-4 w-4 text-violet-500" /><p className="text-xs font-bold text-slate-700">Habilidades y formación</p></div>{habilidades.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{habilidades.map((item: string) => <span key={item} className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">{item}</span>)}</div>}{idiomas.length > 0 && <p className="mt-2 text-xs text-slate-500">Idiomas: {idiomas.join(', ')}</p>}{formacion.length > 0 && <p className="mt-1 text-xs text-slate-500">Formación: {formacion.join(', ')}</p>}</div>}
              {details.biografia && <p className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">{details.biografia}</p>}
            </>}
          </section>

          <section className="mt-5 rounded-[20px] border border-violet-100 bg-violet-50/45 p-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500">Programación ministerial</p><h4 className="mt-0.5 text-sm font-extrabold text-[#171923]">Capacidades oficiales</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Estas capacidades serán las que VIDA use para proponer y validar asignaciones de servicio. Son independientes de las habilidades personales escritas en el perfil.</p></div>
            {ministeriosConCapacidades.length === 0 ? <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-slate-500">No hay capacidades configuradas para los ministerios a los que pertenece esta persona.</p> : <div className="mt-3 space-y-3">{ministeriosConCapacidades.map((ministerio) => {
              const capacidades = capacidadesMinisteriales.filter((capacidad) => capacidad.ministerio_id === ministerio.id)
              const visibles = puedeEliminar ? capacidades : capacidades.filter((capacidad) => capacidadActiva(capacidad.id))
              return <div key={ministerio.id} className="rounded-2xl bg-white p-3 ring-1 ring-violet-100"><div className="flex items-center gap-2"><span className="text-base">{ministerio.emoji || '✨'}</span><p className="text-xs font-extrabold text-slate-700">{ministerio.nombre}</p></div>{visibles.length === 0 ? <p className="mt-2 text-[11px] text-slate-400">Sin capacidades oficiales asignadas.</p> : <div className="mt-2 flex flex-wrap gap-2">{visibles.map((capacidad) => {
                const activa = capacidadActiva(capacidad.id)
                const key = `cap_${capacidad.id}`
                return <button key={capacidad.id} type="button" aria-pressed={activa} onClick={() => void handleToggleCapacidad(capacidad)} disabled={!puedeEliminar || loadingIds[key]} className={`min-h-10 rounded-xl px-3 text-[11px] font-bold transition-colors disabled:cursor-default ${activa ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 ring-1 ring-violet-100'}`}>{loadingIds[key] ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : `${activa ? '✓ ' : ''}${capacidad.nombre}`}</button>
              })}</div>}</div>
            })}</div>}
            {!puedeEliminar && <p className="mt-3 text-[10px] leading-4 text-slate-400">Solo un Administrador puede modificar capacidades oficiales.</p>}
          </section>

          <section className="mt-5 rounded-[20px] border border-sky-100 bg-sky-50/45 p-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-500">Permisos especiales</p><h4 className="mt-0.5 text-sm font-extrabold text-[#171923]">Responsabilidades ministeriales</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Una responsabilidad especial otorga una tarea concreta sin convertir a la persona en líder ni exigir que pertenezca al ministerio.</p></div>
            {responsabilidadesMinisteriales.length === 0 ? <p className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-500">No hay responsabilidades especiales configuradas.</p> : <div className="mt-3 space-y-2">{responsabilidadesMinisteriales.map((responsabilidad) => {
              const activa = responsabilidadActiva(responsabilidad.id)
              if (!puedeEliminar && !activa) return null
              const ministerio = todosMinisterios.find((item) => item.id === responsabilidad.ministerio_id)
              const key = `resp_${responsabilidad.id}`
              return <button key={responsabilidad.id} type="button" aria-pressed={activa} onClick={() => void handleToggleResponsabilidad(responsabilidad)} disabled={!puedeEliminar || loadingIds[key]} className={`w-full rounded-2xl p-3 text-left transition-colors disabled:cursor-default ${activa ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 ring-1 ring-sky-100'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-extrabold">{responsabilidad.nombre}</p><p className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${activa ? 'text-sky-100' : 'text-sky-500'}`}>{ministerio?.nombre || 'Ministerio'}</p>{responsabilidad.descripcion && <p className={`mt-1 text-[11px] leading-relaxed ${activa ? 'text-sky-50' : 'text-slate-500'}`}>{responsabilidad.descripcion}</p>}</div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${activa ? 'bg-white/15 text-white' : 'bg-sky-50 text-sky-600'}`}>{loadingIds[key] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : activa ? 'Asignada' : 'Asignar'}</span></div></button>
            })}</div>}
          </section>

          <div className="mb-4 mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3"><p className="text-xs font-semibold text-amber-800">Ministerios y liderazgo</p><p className="mt-1 text-[11px] leading-relaxed text-amber-700/80">El liderazgo se asigna por ministerio. “Asignar como líder” agrega a la persona al ministerio si hace falta y sincroniza su rol automáticamente.</p></div>
          {error && <div className="sticky top-0 z-10 mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 shadow-sm" role="alert">{error}</div>}
          {todosMinisterios.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center"><Users className="mb-3 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold text-slate-600">No hay ministerios disponibles</p></div> : <div className="space-y-3">{todosMinisterios.map((ministerio) => {
            const { member, lider } = estadoMinisterio(ministerio.id)
            const loadingMem = loadingIds[ministerio.id]
            const loadingLider = loadingIds[`lider_${ministerio.id}`]
            return <section key={ministerio.id} className={`rounded-2xl border p-4 ${lider ? 'border-amber-200 bg-amber-50/45' : member ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-100 bg-white'}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">{ministerio.emoji || '✨'}</span><div className="min-w-0"><h4 className="break-words text-sm font-bold text-[#171923]">{ministerio.nombre}</h4><p className="mt-0.5 text-[11px] text-slate-500">{lider ? 'Líder del ministerio' : member ? 'Miembro del ministerio' : 'Sin asignar'}</p></div></div><button type="button" onClick={() => handleToggleMembresia(ministerio.id, member, lider)} disabled={loadingMem || loadingLider} className={`flex min-h-11 min-w-[88px] items-center justify-center rounded-xl px-3 text-xs font-bold disabled:opacity-50 ${member ? 'bg-rose-50 text-rose-600' : 'bg-indigo-600 text-white'}`}>{loadingMem ? <Loader2 className="h-4 w-4 animate-spin" /> : member ? 'Quitar' : 'Agregar'}</button></div><div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between"><span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">{lider ? <Shield className="h-4 w-4 text-amber-500" /> : <Users className="h-4 w-4 text-gray-400" />}{lider ? 'Gestiona este ministerio' : member ? 'Servidor del ministerio' : 'Puede asignarse directamente como líder'}</span><button type="button" onClick={() => handleToggleLider(ministerio.id, lider)} disabled={loadingLider || loadingMem} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold text-amber-700 disabled:opacity-50 min-[380px]:w-auto">{loadingLider ? <Loader2 className="h-4 w-4 animate-spin" /> : lider ? 'Quitar liderazgo' : 'Asignar como líder'}</button></div></section>
          })}</div>}

          {puedeEliminar && currentUserId !== usuario.id && <section className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm"><Trash2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><h4 className="text-sm font-bold text-rose-900">Eliminar usuario definitivamente</h4><p className="mt-1 text-xs leading-relaxed text-rose-700">Borra su cuenta de acceso y los datos configurados para eliminar con ella. No se puede deshacer.</p><button type="button" onClick={handleEliminarUsuario} disabled={deleting} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white disabled:opacity-50">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{deleting ? 'Eliminando…' : 'Eliminar definitivamente'}</button></div></div></section>}
        </div>

        <footer className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-4"><button type="button" onClick={onClose} disabled={isProcessing} className="min-h-12 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">Listo</button></footer>
      </div>
    </div>
  )
}
