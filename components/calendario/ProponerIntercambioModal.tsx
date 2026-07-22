'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { proponerIntercambio } from '@/app/actions/intercambios'
import { createClient } from '@/lib/supabase/client'

export default function ProponerIntercambioModal({ 
  asignacion_origen_id, 
  evento_titulo, 
  ministerio_id,
  isOpen, 
  onClose 
}: { 
  asignacion_origen_id: string
  evento_titulo: string
  ministerio_id: string | null
  isOpen: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<{id: string, nombre: string}[]>([])
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (isOpen && ministerio_id) {
      setFetching(true)
      const fetchMembers = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('ministerio_miembros')
          .select(`
            profile_id,
            profiles (nombre_completo)
          `)
          .eq('ministerio_id', ministerio_id)
        
        if (data) {
          setMembers(data.map((m: any) => ({
            id: m.profile_id,
            nombre: m.profiles?.nombre_completo
          })))
        }
        setFetching(false)
      }
      fetchMembers()
    }
  }, [isOpen, ministerio_id])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await proponerIntercambio(formData)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm overflow-hidden p-[max(1rem,env(safe-area-inset-top))]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Proponer intercambio"
        className="bg-white rounded-[24px] shadow-[0_8px_32px_rgba(20,24,40,0.15)] w-full max-w-sm max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-[#171923] break-safe">Proponer Intercambio</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-slate-100 rounded-full transition-colors shrink-0" aria-label="Cerrar modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="min-h-0 flex flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 [-webkit-overflow-scrolling:touch] touch-pan-y">
            <input type="hidden" name="asignacion_origen_id" value={asignacion_origen_id} />
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Evento a ceder</p>
              <p className="text-sm font-semibold text-[#171923] break-safe">{evento_titulo}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#171923] mb-1.5">
                Destinatario (opcional)
              </label>
              {fetching ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando miembros...
                </div>
              ) : (
                <select 
                  name="destinatario_id" 
                  className="w-full bg-[#f4f5f9] border-none rounded-xl px-4 py-3 text-[#171923] focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Abierto a cualquier miembro</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-gray-500 mt-1.5 break-safe">
                Si lo dejas abierto, cualquier miembro del ministerio podrá aceptarlo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#171923] mb-1.5">
                Mensaje (opcional)
              </label>
              <textarea 
                name="mensaje"
                rows={3}
                placeholder="Ej: Tengo una emergencia, ¿alguien puede cubrirme?"
                className="w-full bg-[#f4f5f9] border-none rounded-xl px-4 py-3 text-[#171923] placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-[#171923] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || fetching}
              className="flex-[2] flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proponer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
