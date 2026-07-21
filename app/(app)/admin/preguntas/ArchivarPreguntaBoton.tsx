'use client'

import { mostrarToast } from '@/lib/ui/toast'

import { useState } from 'react'
import { archivarPregunta } from '@/app/actions/preguntas'
import { Archive, Loader2 } from 'lucide-react'

export default function ArchivarPreguntaBoton({ preguntaId }: { preguntaId: string }) {
  const [loading, setLoading] = useState(false)

  const handleArchivar = async () => {
    if (!confirm('¿Archivar esta pregunta? No se enviará ninguna respuesta.')) return
    
    setLoading(true)
    const res = await archivarPregunta(preguntaId)
    if (!res?.success) {
      mostrarToast(res?.error || 'Error al archivar.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleArchivar}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
      Archivar sin responder
    </button>
  )
}
