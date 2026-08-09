'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Shield, Trash2, Users } from 'lucide-react'
import { eliminarUsuarioDefinitivamente, toggleMembresia } from '@/app/actions/admin'
import { obtenerContextoAdministrador } from '@/app/actions/admin-permissions'
import { actualizarLiderazgoMinisterial } from '@/app/actions/liderazgo'

export default function UsuarioMembresiaModal({
  usuario,
  todosMinisterios,
  isOpen,
  onClose,
}: {
  usuario: any | null
  todosMinisterios: any[]
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

  const isProcessing = Object.values(loadingIds).some(Boolean) || deleting

  useEffect(() => {
    if (!isOpen) {
      setError('')
      setOverrides({})
      setPuedeEliminar(false)
      setCurrentUserId(null)
      return
    }

    let cancelled = false
    void (async () => {
      const contexto = await obtenerContextoAdministrador()
      if (cancelled) return
      setPuedeEliminar(contexto.esAdministrador)
      setCurrentUserId(contexto.userId)
    })()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelled = true
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isProcessing, onClose])

  if (!isOpen || !usuario) return null

  const baseMembresias = usuario.ministerio_miembros || []
  const misMembresias = Array.isArray(baseMembresias) ? baseMembresias : [baseMembresias]
  const estadoMinisterio = (minId: string) => {
    if (overrides[minId]) return overrides[minId]
    const membresia = misMembresias.find((m: any) => m.ministerio_id === minId)
    return { member: !!membresia, lider: !!membresia?.es_lider }
  }

  const handleToggleMembresia = async (minId: string, isMember: boolean, currentlyLider: boolean) => {
    setLoadingIds((previous) => ({ ...previous, [minId]: true }))
    setError('')

    try {
      if (isMember && currentlyLider) {
        const liderazgo = await actualizarLiderazgoMinisterial(usuario.id, minId, false)
        if (!liderazgo.success) {
          setError(liderazgo.error || 'No fue posible quitar el liderazgo antes de retirar la membresía.')
          return
        }
      }

      await toggleMembresia(usuario.id, minId, !isMember)
      setOverrides((previous) => ({
        ...previous,
        [minId]: isMember ? { member: false, lider: false } : { member: true, lider: false },
      }))
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'No fue posible actualizar la membresía.')
    } finally {
      setLoadingIds((previous) => ({ ...previous, [minId]: false }))
    }
  }

  const handleToggleLider = async (minId: string, currentlyLider: boolean) => {
    setLoadingIds((previous) => ({ ...previous, [`lider_${minId}`]: true }))
    setError('')

    try {
      const result = await actualizarLiderazgoMinisterial(usuario.id, minId, !currentlyLider)
      if (!result.success) {
        setError(result.error || 'No fue posible cambiar el liderazgo.')
        return
      }

      setOverrides((previous) => ({
        ...previous,
        [minId]: { member: true, lider: !currentlyLider },
      }))
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'No fue posible cambiar el liderazgo.')
    } finally {
      setLoadingIds((previous) => ({ ...previous, [`lider_${minId}`]: false }))
    }
  }

  const handleEliminarUsuario = async () => {
    const confirmacion = window.prompt(
      `Vas a eliminar definitivamente a ${usuario.nombre_completo || 'este usuario'} y su acceso a VIDA. Esta acción no se puede deshacer.\n\nEscribe ELIMINAR para confirmar.`
    )
    if (confirmacion !== 'ELIMINAR') return

    setDeleting(true)
    setError('')
    try {
      const result = await eliminarUsuarioDefinitivamente(usuario.id)
      if (!result.success) {
        setError(result.error || 'No fue posible eliminar al usuario.')
        return
      }
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'No fue posible eliminar al usuario.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="membresias-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isProcessing) onClose()
      }}
    >
      <div className="flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-md flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:max-h-[88vh]">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-3">
            <h3 id="membresias-modal-title" className="font-bold text-[#171923]">Membresías y liderazgo</h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">{usuario.nombre_completo}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isProcessing} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 text-gray-500 transition-colors hover:bg-slate-100 disabled:opacity-50" aria-label="Cerrar membresías y liderazgo">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
            <p className="text-xs font-semibold text-amber-800">El liderazgo se asigna por ministerio.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80">“Asignar como líder” agrega a la persona al ministerio si hace falta y sincroniza su rol automáticamente.</p>
          </div>

          {error && <div className="sticky top-0 z-10 mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 shadow-sm" role="alert">{error}</div>}

          {todosMinisterios.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
              <Users className="mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No hay ministerios disponibles</p>
              <p className="mt-1 text-xs text-slate-400">Crea un ministerio antes de asignar membresías.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todosMinisterios.map((ministerio) => {
                const { member, lider } = estadoMinisterio(ministerio.id)
                const loadingMem = loadingIds[ministerio.id]
                const loadingLider = loadingIds[`lider_${ministerio.id}`]
                return (
                  <section key={ministerio.id} className={`rounded-2xl border p-4 transition-colors ${lider ? 'border-amber-200 bg-amber-50/45' : member ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm" aria-hidden="true">{ministerio.emoji || '✨'}</span>
                        <div className="min-w-0">
                          <h4 className="break-words text-sm font-bold leading-snug text-[#171923]">{ministerio.nombre}</h4>
                          <p className="mt-0.5 text-[11px] text-slate-500">{lider ? 'Líder del ministerio' : member ? 'Miembro del ministerio' : 'Sin asignar'}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleToggleMembresia(ministerio.id, member, lider)} disabled={loadingMem || loadingLider} className={`flex min-h-11 min-w-[88px] shrink-0 items-center justify-center rounded-xl px-3 text-xs font-bold transition-colors disabled:opacity-50 ${member ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                        {loadingMem ? <Loader2 className="h-4 w-4 animate-spin" /> : member ? 'Quitar' : 'Agregar'}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        {lider ? <Shield className="h-4 w-4 text-amber-500" /> : <Users className="h-4 w-4 text-gray-400" />}
                        {lider ? 'Gestiona este ministerio' : member ? 'Servidor del ministerio' : 'Puede asignarse directamente como líder'}
                      </span>
                      <button type="button" onClick={() => handleToggleLider(ministerio.id, lider)} disabled={loadingLider || loadingMem} className={`flex min-h-11 w-full items-center justify-center rounded-xl border px-3 text-xs font-bold transition-colors disabled:opacity-50 min-[380px]:w-auto ${lider ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'}`}>
                        {loadingLider ? <Loader2 className="h-4 w-4 animate-spin" /> : lider ? 'Quitar liderazgo' : 'Asignar como líder'}
                      </button>
                    </div>
                  </section>
                )
              })}
            </div>
          )}

          {puedeEliminar && currentUserId !== usuario.id && (
            <section className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm"><Trash2 className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-rose-900">Eliminar usuario definitivamente</h4>
                  <p className="mt-1 text-xs leading-relaxed text-rose-700">Borra su cuenta de acceso y los datos que la base tenga configurados para eliminar con ella. No se puede deshacer.</p>
                  <button type="button" onClick={handleEliminarUsuario} disabled={deleting} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50">
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {deleting ? 'Eliminando…' : 'Eliminar definitivamente'}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-4">
          <button type="button" onClick={onClose} disabled={isProcessing} className="min-h-12 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50">Listo</button>
        </footer>
      </div>
    </div>
  )
}
