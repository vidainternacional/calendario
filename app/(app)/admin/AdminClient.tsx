'use client'

import { useState } from 'react'
import { Plus, Users, Shield, Power, PowerOff, Edit3 } from 'lucide-react'
import MinisterioModal from '@/components/admin/MinisterioModal'
import UsuarioMembresiaModal from '@/components/admin/UsuarioMembresiaModal'
import { toggleMinisterioActivo, cambiarRolUsuario } from '@/app/actions/admin'

export default function AdminClient({ ministerios, usuarios }: { ministerios: any[], usuarios: any[] }) {
  const [activeTab, setActiveTab] = useState<'ministerios' | 'usuarios'>('ministerios')
  
  // Modals state
  const [minModalOpen, setMinModalOpen] = useState(false)
  const [editingMin, setEditingMin] = useState<any | null>(null)
  
  const [memModalOpen, setMemModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)

  const handleOpenMinModal = (min: any | null = null) => {
    setEditingMin(min)
    setMinModalOpen(true)
  }

  const handleOpenMemModal = (user: any) => {
    setEditingUser(user)
    setMemModalOpen(true)
  }

  return (
    <>
      <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('ministerios')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'ministerios' ? 'bg-white text-[#171923] shadow-sm' : 'text-gray-500 hover:text-[#171923]'
          }`}
        >
          Ministerios
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'usuarios' ? 'bg-white text-[#171923] shadow-sm' : 'text-gray-500 hover:text-[#171923]'
          }`}
        >
          Usuarios
        </button>
      </div>

      {activeTab === 'ministerios' && (
        <div className="space-y-4">
          <button 
            onClick={() => handleOpenMinModal()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nuevo Ministerio
          </button>
          
          <div className="grid gap-4">
            {ministerios.map(m => (
              <div key={m.id} className={`bg-white p-5 rounded-[20px] shadow-[0_4px_18px_rgba(20,24,40,0.05)] border ${m.activo ? 'border-slate-100' : 'border-rose-100 opacity-60'} relative overflow-hidden flex flex-col gap-3`}>
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: m.color_primario }}></div>
                <div className="flex items-start justify-between pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{m.emoji}</span>
                    <div>
                      <h3 className="font-bold text-[#171923]">{m.nombre}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${m.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {m.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenMinModal(m)}
                      className="p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <form action={async () => { await toggleMinisterioActivo(m.id, !m.activo); }}>
                      <button type="submit" className={`p-2 rounded-full transition-colors ${m.activo ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' : 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100'}`}>
                        {m.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                </div>
                {m.descripcion && (
                  <p className="text-sm text-gray-500 pl-2 leading-relaxed">
                    {m.descripcion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          {usuarios.map(u => {
            const esLider = u.ministerio_miembros?.some((m:any) => m.es_lider)
            let badgeColors = 'bg-slate-100 text-slate-600'
            if (u.rol === 'pastor') badgeColors = 'bg-indigo-100 text-indigo-700'
            if (u.rol === 'administrador') badgeColors = 'bg-rose-100 text-rose-700'
            if (u.rol === 'lider') badgeColors = 'bg-amber-100 text-amber-700'

            return (
              <div key={u.id} className="bg-white p-5 rounded-[20px] shadow-[0_4px_18px_rgba(20,24,40,0.05)] border border-slate-100 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[#171923] text-sm">{u.nombre_completo}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRolUsuario(u.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase cursor-pointer border-none outline-none ${badgeColors}`}
                      >
                        <option value="servidor">Servidor</option>
                        <option value="lider">Líder</option>
                        <option value="pastor">Pastor</option>
                        <option value="administrador">Admin</option>
                      </select>
                      {esLider && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenMemModal(u)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-[#171923] rounded-lg transition-colors border border-slate-200"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Membresías
                  </button>
                </div>
                
                {u.ministerio_miembros?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
                    {u.ministerio_miembros.map((m:any) => (
                      <span key={m.ministerio_id} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-slate-200" style={{ color: m.ministerios?.color_primario || '#64748b', backgroundColor: `${m.ministerios?.color_primario || '#64748b'}15` }}>
                        {m.ministerios?.nombre}
                        {m.es_lider && <Shield className="w-2.5 h-2.5" />}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 text-xs text-gray-400">Sin ministerios asignados</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <MinisterioModal
        isOpen={minModalOpen}
        onClose={() => setMinModalOpen(false)}
        ministerio={editingMin}
      />

      <UsuarioMembresiaModal
        isOpen={memModalOpen}
        onClose={() => setMemModalOpen(false)}
        usuario={editingUser}
        todosMinisterios={ministerios}
      />
    </>
  )
}
