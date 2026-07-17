'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { guardarMinisterio } from '@/app/actions/admin'

export default function MinisterioModal({ 
  ministerio, 
  isOpen, 
  onClose 
}: { 
  ministerio: any | null
  isOpen: boolean
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const formData = new FormData(e.currentTarget)
      await guardarMinisterio(formData)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-[#171923]">
            {ministerio ? 'Editar Ministerio' : 'Nuevo Ministerio'}
          </h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-200">
              {error}
            </div>
          )}

          {ministerio && <input type="hidden" name="id" value={ministerio.id} />}
          
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase">Emoji</label>
              <input 
                name="emoji" 
                defaultValue={ministerio?.emoji || '✨'}
                required
                maxLength={2}
                className="w-full bg-[#f4f5f9] border border-slate-200 rounded-xl px-3 py-2.5 text-center text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase">Nombre</label>
              <input 
                name="nombre" 
                defaultValue={ministerio?.nombre || ''}
                required
                className="w-full bg-[#f4f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#171923] focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase">Color Principal</label>
              <input 
                name="color_primario" 
                type="color"
                defaultValue={ministerio?.color_primario || '#4F46E5'}
                className="w-full h-10 rounded-xl cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase">Color Secundario</label>
              <input 
                name="color_secundario" 
                type="color"
                defaultValue={ministerio?.color_secundario || '#E0E7FF'}
                className="w-full h-10 rounded-xl cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase">Descripción</label>
            <textarea 
              name="descripcion" 
              defaultValue={ministerio?.descripcion || ''}
              rows={3}
              className="w-full bg-[#f4f5f9] border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#171923] focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              name="activo" 
              id="activo-check"
              value="true"
              defaultChecked={ministerio ? ministerio.activo : true}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="activo-check" className="text-sm font-semibold text-[#171923]">Ministerio activo</label>
          </div>

          <div className="pt-4 pb-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-xl transition-colors active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
