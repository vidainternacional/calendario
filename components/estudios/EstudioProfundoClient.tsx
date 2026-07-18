'use client'

import { useActionState, useEffect, useState } from 'react'
import { Sparkles, Search, ChevronDown, ChevronUp, BookOpen, AlertCircle, RefreshCw, Clock, Save, Edit3 } from 'lucide-react'
import { analizarPasaje, obtenerHistorial, obtenerNota, guardarNota, type EstudioState, type EstudioResultado } from '@/app/actions/estudio'

const SECTIONS: { key: keyof EstudioResultado; label: string; bg: string; icon: any }[] = [
  { key: 'texto_original', label: '1. Texto Original', bg: 'bg-blue-50 text-blue-900 border-blue-100', icon: BookOpen },
  { key: 'transliteracion', label: '2. Transliteración', bg: 'bg-slate-50 text-slate-900 border-slate-200', icon: BookOpen },
  { key: 'traduccion_literal', label: '3. Traducción Literal', bg: 'bg-slate-50 text-slate-900 border-slate-200', icon: BookOpen },
  { key: 'traduccion_interpretativa', label: '4. Traducción Interpretativa', bg: 'bg-emerald-50 text-emerald-900 border-emerald-100', icon: BookOpen },
  { key: 'comparacion_versiones', label: '5. Comparación de Versiones', bg: 'bg-slate-50 text-slate-900 border-slate-200', icon: BookOpen },
  { key: 'contexto_historico', label: '6. Contexto Histórico, Cultural y Religioso', bg: 'bg-amber-50 text-amber-900 border-amber-100', icon: BookOpen },
  { key: 'analisis_linguistico', label: '7. Análisis Lingüístico Clave', bg: 'bg-indigo-50 text-indigo-900 border-indigo-100', icon: BookOpen },
  { key: 'que_quiso_comunicar', label: '8. Qué Quiso Comunicar Dios', bg: 'bg-purple-50 text-purple-900 border-purple-100', icon: Sparkles },
  { key: 'que_no_quiso_decir', label: '9. Qué NO Quiso Decir', bg: 'bg-rose-50 text-rose-900 border-rose-100', icon: AlertCircle },
  { key: 'explicacion', label: '10. Explicación Lógica y Coherente', bg: 'bg-slate-50 text-slate-900 border-slate-200', icon: BookOpen },
  { key: 'reflexion', label: '11. Reflexión Espiritual', bg: 'bg-teal-50 text-teal-900 border-teal-100', icon: Sparkles },
]

export default function EstudioProfundoClient() {
  const [state, formAction, isPending] = useActionState<EstudioState, FormData>(analizarPasaje, { status: 'idle' })
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const [historial, setHistorial] = useState<{pasaje: string, created_at: string}[]>([])
  
  const [nota, setNota] = useState('')
  const [notaGuardando, setNotaGuardando] = useState(false)
  const [notaSuccess, setNotaSuccess] = useState(false)

  // Fetch history on mount
  useEffect(() => {
    obtenerHistorial().then(setHistorial)
  }, [])

  // When a study is loaded (either via action or history click)
  useEffect(() => {
    if (state.status === 'success') {
      setOpenSections({
        texto_original: true,
        traduccion_interpretativa: true,
        que_quiso_comunicar: true,
        reflexion: true,
      })
      
      // Update history in background
      obtenerHistorial().then(setHistorial)

      // Fetch personal note
      obtenerNota(state.pasaje).then(n => {
        setNota(n || '')
      })
    }
  }, [state.status, state.status === 'success' ? state.pasaje : ''])

  const handleSaveNota = async () => {
    if (state.status !== 'success') return
    setNotaGuardando(true)
    setNotaSuccess(false)
    const res = await guardarNota(state.pasaje, nota)
    setNotaGuardando(false)
    if (res.success) {
      setNotaSuccess(true)
      setTimeout(() => setNotaSuccess(false), 3000)
    } else {
      alert(res.error)
    }
  }

  const loadFromHistory = (pasajeStr: string) => {
    // Just trigger a form submit programmatically
    const form = document.getElementById('estudio-form') as HTMLFormElement
    if (form) {
      const input = form.elements.namedItem('pasaje') as HTMLInputElement
      if (input) input.value = pasajeStr
      form.requestSubmit()
    }
  }
  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* ── Search Form ─────────────────────────────── */}
      <form id="estudio-form" action={formAction} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <label htmlFor="pasaje" className="block text-sm font-semibold text-slate-700 mb-2">
          Ingresa el pasaje a estudiar:
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              id="pasaje"
              name="pasaje"
              required
              disabled={isPending}
              placeholder="Ej: Juan 3:16, Romanos 8:28-30"
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C0392B] focus:border-[#C0392B] sm:text-sm disabled:opacity-50 transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#C0392B] hover:bg-[#a93226] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C0392B] disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analizar
              </>
            )}
          </button>
        </div>
        {state.status === 'error' && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {state.error}
          </p>
        )}
      </form>

      {/* ── Loading State ─────────────────────────────── */}
      {isPending && (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
            <Sparkles className="w-8 h-8 text-[#C0392B] animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Analizando con IA...</h3>
          <p className="text-slate-500 max-w-sm text-sm">
            Esto puede tardar entre 15 y 30 segundos. El experto está consultando los textos originales, el contexto histórico y la teología.
          </p>
        </div>
      )}

      {/* ── Results Accordion ─────────────────────────────── */}
      {!isPending && state.status === 'success' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C0392B]" />
              Estudio de: {state.pasaje}
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {SECTIONS.map((section) => {
              const content = state.resultado[section.key]
              if (!content) return null // Skip if missing for some reason
              
              const isOpen = !!openSections[section.key]
              const Icon = section.icon
              
              return (
                <div key={section.key} className="group">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className={`w-full px-5 py-4 flex items-center justify-between text-left transition-colors hover:bg-slate-50 focus:outline-none ${isOpen ? section.bg : 'bg-white'}`}
                  >
                    <span className="font-semibold text-[15px] flex items-center gap-2">
                      <Icon className="w-4 h-4 opacity-70" />
                      {section.label}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 opacity-50 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 opacity-50 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 py-5 bg-white text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                      {content}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Personal Notes ─────────────────────────────── */}
      {!isPending && state.status === 'success' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#C0392B]" />
              Mis notas sobre {state.pasaje}
            </h3>
            <div className="flex items-center gap-2">
              {notaSuccess && <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>}
              <button
                onClick={handleSaveNota}
                disabled={notaGuardando}
                className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {notaGuardando ? 'Guardando...' : 'Guardar nota'}
              </button>
            </div>
          </div>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Escribe aquí tus reflexiones, preguntas o apuntes personales sobre este pasaje..."
            className="w-full h-32 p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#C0392B] focus:outline-none resize-y"
          />
        </div>
      )}

      {/* ── History Section ─────────────────────────────── */}
      {historial.length > 0 && state.status === 'idle' && !isPending && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mt-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-500" />
            Mi historial reciente
          </h3>
          <div className="flex flex-wrap gap-2">
            {historial.map((h, i) => (
              <button
                key={i}
                onClick={() => loadFromHistory(h.pasaje)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                {h.pasaje}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
