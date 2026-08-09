'use client'

import { useMemo, useState } from 'react'
import { Search, Shield, UserCog, Power, PowerOff } from 'lucide-react'
import UsuarioMembresiaModal from '@/components/admin/UsuarioMembresiaModal'
import { cambiarRolUsuario, setEstadoCuenta, togglePastorGeneral } from '@/app/actions/admin'

export default function UsuariosAdminClient({ usuarios, ministerios }: { usuarios: any[]; ministerios: any[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [error, setError] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return usuarios.filter((u) => {
      if (filtroRol !== 'todos' && u.rol !== filtroRol) return false
      if (!q) return true
      return (u.nombre_completo || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    })
  }, [usuarios, busqueda, filtroRol])

  const run = async (fn: () => Promise<any>) => {
    setError('')
    const result = await fn()
    if (result && result.success === false) setError(result.error || 'No fue posible completar la acción.')
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o correo" className="h-12 w-full rounded-2xl bg-slate-50 pl-10 pr-4 text-sm outline-none ring-1 ring-slate-100 focus:ring-indigo-300" />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {['todos','servidor','lider','pastor','administrador'].map((rol) => (
              <button key={rol} type="button" onClick={() => setFiltroRol(rol)} className={`min-h-10 rounded-xl px-2 text-[11px] font-bold capitalize ${filtroRol === rol ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{rol === 'todos' ? 'Todos' : rol}</button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}

        <div className="space-y-3">
          {filtrados.map((usuario) => (
            <article key={usuario.id} className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-sm font-extrabold text-[#171923]">{usuario.nombre_completo || 'Usuario sin nombre'}</h2>
                  <p className="mt-1 break-all text-xs text-slate-500">{usuario.email || 'Sin correo'}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold capitalize text-indigo-600">{usuario.rol}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${usuario.estado_cuenta === 'suspendido' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{usuario.estado_cuenta || 'activo'}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setEditingUser(usuario)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600" aria-label="Gestionar usuario"><UserCog className="h-4.5 w-4.5" /></button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Rol
                  <select value={usuario.rol} onChange={(e) => void run(() => cambiarRolUsuario(usuario.id, e.target.value as any))} className="mt-1 h-11 w-full rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none">
                    <option value="servidor">Servidor</option><option value="lider">Líder</option><option value="pastor">Pastor</option><option value="administrador">Administrador</option>
                  </select>
                </label>
                <button type="button" onClick={() => void run(() => setEstadoCuenta(usuario.id, usuario.estado_cuenta === 'suspendido' ? 'activo' : 'suspendido'))} className={`mt-[18px] flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold ${usuario.estado_cuenta === 'suspendido' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {usuario.estado_cuenta === 'suspendido' ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}{usuario.estado_cuenta === 'suspendido' ? 'Reactivar' : 'Suspender'}
                </button>
              </div>

              {(usuario.rol === 'pastor' || usuario.rol === 'administrador') && (
                <button type="button" onClick={() => void run(() => togglePastorGeneral(usuario.id, !usuario.es_pastor_general))} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-100 bg-amber-50 text-xs font-bold text-amber-700"><Shield className="h-4 w-4" />{usuario.es_pastor_general ? 'Quitar Pastor General' : 'Asignar Pastor General'}</button>
              )}
            </article>
          ))}
        </div>
      </div>

      <UsuarioMembresiaModal usuario={editingUser} todosMinisterios={ministerios} isOpen={!!editingUser} onClose={() => setEditingUser(null)} />
    </>
  )
}
