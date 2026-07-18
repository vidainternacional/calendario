'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Shield, Users } from 'lucide-react'
import { toggleMembresia, setEsLider } from '@/app/actions/admin'

export default function UsuarioMembresiaModal({ 
  usuario, 
  todosMinisterios,
  isOpen, 
  onClose 
}: { 
  usuario: any | null
  todosMinisterios: any[]
  isOpen: boolean
  onClose: () => void 
}) {
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setError('')
    }
  }, [isOpen])

  if (!isOpen || !usuario) return null

  // Mapeo fácil
  const baseMembresias = usuario.ministerio_miembros || []
  const misMembresias = Array.isArray(baseMembresias) ? baseMembresias : [baseMembresias]
  const hasMinisterio = (minId: string) => misMembresias.some((m: any) => m.ministerio_id === minId)
  const isLider = (minId: string) => misMembresias.some((m: any) => m.ministerio_id === minId && m.es_lider)

  const handleToggleMembresia = async (minId: string, isMember: boolean) => {
    setLoadingIds(prev => ({ ...prev, [minId]: true }))
    setError('')
    try {
      await toggleMembresia(usuario.id, minId, !isMember)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingIds(prev => ({ ...prev, [minId]: false }))
    }
  }

  const handleToggleLider = async (minId: string, currentlyLider: boolean) => {
    setLoadingIds(prev => ({ ...prev, [`lider_${minId}`]: true }))
    setError('')
    try {
      const res = await setEsLider(usuario.id, minId, !currentlyLider)
      if (res && !res.success) {
        setError(res.error || 'Error al cambiar liderazgo')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingIds(prev => ({ ...prev, [`lider_${minId}`]: false }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-[#171923] text-sm">Membresías</h3>
            <p className="text-xs text-gray-500 truncate">{usuario.nombre_completo}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-200 sticky top-0 z-10 shadow-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-3 pb-8">
            {todosMinisterios.map(m => {
              const member = hasMinisterio(m.id)
              const lider = isLider(m.id)
              const loadingMem = loadingIds[m.id]
              const loadingLider = loadingIds[`lider_${m.id}`]

              return (
                <div key={m.id} className={`p-3 rounded-xl border transition-colors ${member ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.emoji}</span>
                      <span className="font-bold text-sm text-[#171923]">{m.nombre}</span>
                    </div>
                    <button 
                      onClick={() => handleToggleMembresia(m.id, member)}
                      disabled={loadingMem}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase flex items-center justify-center min-w-[70px] ${
                        member ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {loadingMem ? <Loader2 className="w-3 h-3 animate-spin" /> : (member ? 'Quitar' : 'Agregar')}
                    </button>
                  </div>
                  
                  {member && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {lider ? <Shield className="w-3 h-3 text-amber-500" /> : <Users className="w-3 h-3 text-gray-400" />}
                        {lider ? 'Líder' : 'Servidor'}
                      </span>
                      <button 
                        onClick={() => handleToggleLider(m.id, lider)}
                        disabled={loadingLider}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase border flex items-center justify-center min-w-[90px] ${
                          lider ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100' : 'border-slate-200 text-gray-500 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {loadingLider ? <Loader2 className="w-3 h-3 animate-spin" /> : (lider ? 'Quitar Liderazgo' : 'Hacer Líder')}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
