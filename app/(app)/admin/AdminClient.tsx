'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Ban,
  Check,
  ChevronDown,
  Clock,
  Edit3,
  Loader2,
  Plus,
  Power,
  PowerOff,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import MinisterioModal from '@/components/admin/MinisterioModal'
import UsuarioMembresiaModal from '@/components/admin/UsuarioMembresiaModal'
import { mostrarToast } from '@/lib/ui/toast'
import {
  aprobarUsuario,
  cambiarRolUsuario,
  rechazarUsuario,
  setEstadoCuenta,
  toggleMinisterioActivo,
  togglePastorGeneral,
  updateEstudioPrompt,
  updateIconVariant,
} from '@/app/actions/admin'

type AdminTab = 'ministerios' | 'usuarios'

export default function AdminClient({
  ministerios,
  usuarios,
  activeIconVariant,
  initialEstudioPrompt,
  currentUserRol,
  initialTab = 'ministerios',
}: {
  ministerios: any[]
  usuarios: any[]
  activeIconVariant?: string
  initialEstudioPrompt?: string
  currentUserRol?: string
  initialTab?: AdminTab
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab)
  const [minModalOpen, setMinModalOpen] = useState(false)
  const [editingMin, setEditingMin] = useState<any | null>(null)
  const [memModalOpen, setMemModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [rolError, setRolError] = useState<string | null>(null)
  const [selectedIcon, setSelectedIcon] = useState<'dorado' | 'blanco' | 'rojo'>((activeIconVariant as any) || 'dorado')
  const [iconSaving, setIconSaving] = useState(false)
  const [iconSuccess, setIconSuccess] = useState(false)
  const [promptValue, setPromptValue] = useState(initialEstudioPrompt || '')
  const [promptSaving, setPromptSaving] = useState(false)
  const [promptSuccess, setPromptSuccess] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [procesando, setProcesando] = useState<string | null>(null)

  const showError = (message: string) => {
    setRolError(message)
    setTimeout(() => setRolError(null), 5000)
  }

  const pendientes = useMemo(
    () => usuarios.filter((usuario) => usuario.estado_cuenta === 'pendiente'),
    [usuarios]
  )

  const usuariosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase()
    return usuarios.filter((usuario) => {
      if (usuario.estado_cuenta === 'pendiente') return false
      if (filtroRol !== 'todos' && usuario.rol !== filtroRol) return false
      if (filtroEstado !== 'todos' && (usuario.estado_cuenta ?? 'activo') !== filtroEstado) return false
      if (!query) return true
      return (usuario.nombre_completo ?? '').toLowerCase().includes(query)
        || (usuario.email ?? '').toLowerCase().includes(query)
    })
  }, [usuarios, busqueda, filtroRol, filtroEstado])

  const handleIconChange = async (variant: 'dorado' | 'blanco' | 'rojo') => {
    if (variant === selectedIcon) return
    setSelectedIcon(variant)
    setIconSaving(true)
    setIconSuccess(false)
    try {
      await updateIconVariant(variant)
      setIconSuccess(true)
      setTimeout(() => setIconSuccess(false), 3000)
    } catch (error) {
      console.error(error)
    } finally {
      setIconSaving(false)
    }
  }

  const handlePromptSave = async () => {
    setPromptSaving(true)
    setPromptSuccess(false)
    try {
      const result = await updateEstudioPrompt(promptValue)
      if (result.success) {
        setPromptSuccess(true)
        setTimeout(() => setPromptSuccess(false), 3000)
      } else {
        mostrarToast(result.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setPromptSaving(false)
    }
  }

  const handlePastorGeneralToggle = async (userId: string, currentState: boolean) => {
    const result = await togglePastorGeneral(userId, !currentState)
    if (!result.success && result.error) showError(result.error)
  }

  const handleRolChange = async (userId: string, nuevoRol: string) => {
    const result = await cambiarRolUsuario(userId, nuevoRol as any)
    if (!result.success && result.error) showError(result.error)
  }

  const handleAprobar = async (userId: string) => {
    setProcesando(userId)
    const result = await aprobarUsuario(userId)
    if (!result.success && result.error) showError(result.error)
    setProcesando(null)
  }

  const handleRechazar = async (userId: string) => {
    if (!confirm('¿Rechazar esta solicitud de cuenta? La persona no podrá entrar a la app.')) return
    setProcesando(userId)
    const result = await rechazarUsuario(userId)
    if (!result.success && result.error) showError(result.error)
    setProcesando(null)
  }

  const handleToggleSuspension = async (userId: string, estadoActual: string) => {
    const suspender = estadoActual !== 'suspendido'
    if (suspender && !confirm('¿Suspender esta cuenta? La persona perderá el acceso hasta que la reactives.')) return
    setProcesando(userId)
    const result = await setEstadoCuenta(userId, suspender ? 'suspendido' : 'activo')
    if (!result.success && result.error) showError(result.error)
    setProcesando(null)
  }

  return (
    <>
      <section id="gestion" className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Gestión</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#171923]">Personas y ministerios</h2>
          </div>
          <p className="text-[11px] text-slate-400">Acciones principales</p>
        </div>

        <div className="flex rounded-2xl bg-slate-200/55 p-1" role="tablist" aria-label="Gestión administrativa">
          {(['ministerios', 'usuarios'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-[#171923] shadow-sm' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'ministerios' && (
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => { setEditingMin(null); setMinModalOpen(true) }}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Nuevo ministerio
          </button>

          <div className="grid gap-3">
            {ministerios.map((ministerio) => (
              <article key={ministerio.id} className={`relative overflow-hidden rounded-[20px] border bg-white p-4 shadow-sm ${ministerio.activo ? 'border-slate-100' : 'border-rose-100 opacity-70'}`}>
                <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: ministerio.color_primario }} />
                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="text-2xl">{ministerio.emoji}</span>
                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-[#171923]">{ministerio.nombre}</h3>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ministerio.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {ministerio.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {ministerio.descripcion && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{ministerio.descripcion}</p>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => { setEditingMin(ministerio); setMinModalOpen(true) }} className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-500" aria-label={`Editar ${ministerio.nombre}`}>
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <form action={async () => { await toggleMinisterioActivo(ministerio.id, !ministerio.activo) }}>
                      <button type="submit" className={`flex h-11 w-11 items-center justify-center rounded-full ${ministerio.activo ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`} aria-label={ministerio.activo ? 'Desactivar ministerio' : 'Activar ministerio'}>
                        {ministerio.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'usuarios' && (
        <section className="space-y-4">
          {pendientes.length > 0 && (
            <div className="space-y-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-800">{pendientes.length === 1 ? '1 cuenta pendiente heredada' : `${pendientes.length} cuentas pendientes heredadas`}</h3>
              </div>
              {pendientes.map((usuario) => (
                <article key={usuario.id} className="rounded-2xl border border-amber-100 bg-white p-4">
                  <p className="text-sm font-bold text-[#171923]">{usuario.nombre_completo || 'Usuario sin nombre'}</p>
                  {usuario.email && <p className="mt-0.5 break-all text-xs text-slate-500">{usuario.email}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleAprobar(usuario.id)} disabled={procesando === usuario.id} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50">
                      {procesando === usuario.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />} Aprobar
                    </button>
                    <button type="button" onClick={() => handleRechazar(usuario.id)} disabled={procesando === usuario.id} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 disabled:opacity-50">
                      <UserX className="h-3.5 w-3.5" /> Rechazar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="rounded-[20px] border border-slate-100 bg-white p-3 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre o correo..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-base text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={filtroRol} onChange={(event) => setFiltroRol(event.target.value)} className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700">
                <option value="todos">Todos los roles</option><option value="servidor">Servidores</option><option value="lider">Líderes</option><option value="pastor">Pastores</option><option value="administrador">Administradores</option>
              </select>
              <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)} className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700">
                <option value="todos">Todos los estados</option><option value="activo">Activos</option><option value="suspendido">Suspendidos</option><option value="rechazado">Rechazados</option>
              </select>
            </div>
            <p className="mt-2 px-1 text-[11px] text-slate-400">{usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? 'usuario' : 'usuarios'}</p>
          </div>

          {usuariosFiltrados.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-white p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-600">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {usuariosFiltrados.map((usuario) => {
                const membresias = Array.isArray(usuario.ministerio_miembros) ? usuario.ministerio_miembros : usuario.ministerio_miembros ? [usuario.ministerio_miembros] : []
                const esLider = membresias.some((membresia: any) => membresia.es_lider)
                let roleClass = 'bg-slate-100 text-slate-600'
                if (usuario.rol === 'pastor') roleClass = 'bg-indigo-100 text-indigo-700'
                if (usuario.rol === 'administrador') roleClass = 'bg-rose-100 text-rose-700'
                if (usuario.rol === 'lider') roleClass = 'bg-amber-100 text-amber-700'

                return (
                  <article key={usuario.id} className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
                    <h3 className="break-words text-base font-bold text-[#171923]">{usuario.nombre_completo || 'Usuario sin nombre'}</h3>
                    {usuario.email && <p className="mt-1 break-all text-xs text-slate-400">{usuario.email}</p>}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select value={usuario.rol} onChange={(event) => handleRolChange(usuario.id, event.target.value)} className={`min-h-9 rounded-lg border-0 px-2.5 text-xs font-bold uppercase outline-none ${roleClass}`} aria-label={`Rol de ${usuario.nombre_completo}`}>
                        <option value="servidor">Servidor</option><option value="lider">Líder</option><option value="pastor">Pastor</option><option value="administrador">Admin</option>
                      </select>
                      {esLider && <span className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-amber-50 px-2 text-[10px] font-bold uppercase text-amber-700"><Shield className="h-3 w-3" /> Lidera ministerio</span>}
                      {usuario.estado_cuenta === 'suspendido' && <span className="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase text-rose-700">Suspendido</span>}
                    </div>

                    {usuario.rol === 'pastor' && (
                      <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-xs font-semibold text-slate-600">Pastor general</span>
                        <input type="checkbox" checked={!!usuario.es_pastor_general} disabled={currentUserRol !== 'administrador'} onChange={() => handlePastorGeneralToggle(usuario.id, !!usuario.es_pastor_general)} className="h-5 w-5 accent-indigo-600" />
                      </label>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setEditingUser(usuario); setMemModalOpen(true) }} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-[#171923]">
                        <Users className="h-3.5 w-3.5" /> Gestionar
                      </button>
                      <button type="button" onClick={() => handleToggleSuspension(usuario.id, usuario.estado_cuenta ?? 'activo')} disabled={procesando === usuario.id} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold disabled:opacity-50 ${usuario.estado_cuenta === 'suspendido' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-white text-rose-500'}`}>
                        {procesando === usuario.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />} {usuario.estado_cuenta === 'suspendido' ? 'Reactivar' : 'Suspender'}
                      </button>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      {membresias.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {membresias.map((membresia: any) => (
                            <span key={membresia.ministerio_id} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase" style={{ color: membresia.ministerios?.color_primario || '#64748b', backgroundColor: `${membresia.ministerios?.color_primario || '#64748b'}15` }}>
                              <span className="truncate">{membresia.ministerios?.nombre || 'Ministerio'}</span>{membresia.es_lider && <Shield className="h-2.5 w-2.5 shrink-0" />}
                            </span>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400">Sin ministerios asignados</p>}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      <details className="group mt-7 overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-sm">
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Sparkles className="h-4.5 w-4.5" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#171923]">Configuración avanzada</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Ícono de la app y prompt de Estudio Profundo</p>
          </div>
          <ChevronDown className="h-5 w-5 text-slate-300 transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-5 border-t border-slate-100 px-4 py-5">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Smartphone size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-[#171923]">Ícono de la aplicación</span>
              {iconSaving && <span className="ml-auto text-xs text-slate-400">Guardando…</span>}
              {iconSuccess && <span className="ml-auto text-xs font-medium text-emerald-600">✓ Guardado</span>}
            </div>
            <div className="flex justify-center gap-2">
              {([
                { key: 'dorado', label: 'Dorado', border: '#D4A017' },
                { key: 'blanco', label: 'Blanco', border: '#333' },
                { key: 'rojo', label: 'Rojo', border: '#CC0000' },
              ] as const).map(({ key, label, border }) => (
                <button key={key} type="button" onClick={() => handleIconChange(key)} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl p-2 ${selectedIcon === key ? 'bg-slate-50 ring-2 ring-offset-2' : 'opacity-70'}`}>
                  <div className="relative h-14 w-14 overflow-hidden rounded-[16px] shadow-md" style={{ outline: selectedIcon === key ? `2.5px solid ${border}` : '2px solid transparent' }}>
                    <Image src={`/icons/variant-${key}/icon-192.png`} alt={`Ícono ${label}`} fill className="object-cover" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600">{label}</span>
                  {selectedIcon === key && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500"><Check size={10} className="text-white" strokeWidth={3} /></span>}
                </button>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              <span className="text-sm font-semibold text-[#171923]">Estudio Profundo IA</span>
              {promptSuccess && <span className="ml-auto text-xs font-medium text-emerald-600">✓ Guardado</span>}
            </div>
            <textarea value={promptValue} onChange={(event) => setPromptValue(event.target.value)} className="h-52 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Escribe las instrucciones base para la IA..." />
            <button type="button" onClick={handlePromptSave} disabled={promptSaving || !promptValue.trim()} className="mt-3 min-h-11 w-full rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white disabled:opacity-50">
              {promptSaving ? 'Guardando…' : 'Guardar prompt'}
            </button>
          </section>
        </div>
      </details>

      {rolError && <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 right-4 z-[80] mx-auto max-w-sm rounded-2xl bg-rose-600 px-5 py-3 text-center text-sm font-medium text-white shadow-xl" role="alert">{rolError}</div>}

      <MinisterioModal isOpen={minModalOpen} onClose={() => setMinModalOpen(false)} ministerio={editingMin} />
      <UsuarioMembresiaModal isOpen={memModalOpen} onClose={() => setMemModalOpen(false)} usuario={editingUser} todosMinisterios={ministerios} />
    </>
  )
}
