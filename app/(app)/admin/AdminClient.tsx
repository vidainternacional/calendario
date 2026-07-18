'use client'

import { useState } from 'react'
import { Plus, Users, Shield, Power, PowerOff, Edit3, Smartphone, Check, Sparkles } from 'lucide-react'
import MinisterioModal from '@/components/admin/MinisterioModal'
import UsuarioMembresiaModal from '@/components/admin/UsuarioMembresiaModal'
import { toggleMinisterioActivo, cambiarRolUsuario, updateIconVariant, updateEstudioPrompt, togglePastorGeneral } from '@/app/actions/admin'
import Image from 'next/image'

export default function AdminClient({ ministerios, usuarios, activeIconVariant, initialEstudioPrompt, currentUserRol }: { 
  ministerios: any[], 
  usuarios: any[],
  activeIconVariant?: string
  initialEstudioPrompt?: string
  currentUserRol?: string
}) {
  const [activeTab, setActiveTab] = useState<'ministerios' | 'usuarios'>('ministerios')
  
  // Modals state
  const [minModalOpen, setMinModalOpen] = useState(false)
  const [editingMin, setEditingMin] = useState<any | null>(null)
  
  const [memModalOpen, setMemModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)

  const [rolError, setRolError] = useState<string | null>(null)
  const [selectedIcon, setSelectedIcon] = useState<'dorado' | 'blanco' | 'rojo'>(
    (activeIconVariant as any) || 'dorado'
  )
  const [iconSaving, setIconSaving] = useState(false)
  const [iconSuccess, setIconSuccess] = useState(false)

  // IA Prompt state
  const [promptValue, setPromptValue] = useState(initialEstudioPrompt || '')
  const [promptSaving, setPromptSaving] = useState(false)
  const [promptSuccess, setPromptSuccess] = useState(false)

  const handleIconChange = async (variant: 'dorado' | 'blanco' | 'rojo') => {
    if (variant === selectedIcon) return
    setSelectedIcon(variant)
    setIconSaving(true)
    setIconSuccess(false)
    try {
      await updateIconVariant(variant)
      setIconSuccess(true)
      setTimeout(() => setIconSuccess(false), 3000)
    } catch (e) {
      console.error(e)
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
        alert(result.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPromptSaving(false)
    }
  }

  const handlePastorGeneralToggle = async (userId: string, currentState: boolean) => {
    const result = await togglePastorGeneral(userId, !currentState)
    if (!result.success && result.error) {
      setRolError(result.error)
      setTimeout(() => setRolError(null), 5000)
    }
  }

  const handleRolChange = async (userId: string, nuevoRol: string) => {
    const result = await cambiarRolUsuario(userId, nuevoRol as any)
    if (!result.success && result.error) {
      setRolError(result.error)
      setTimeout(() => setRolError(null), 5000)
    }
  }

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
      {/* ── Icon Variant Picker ─────────────────────────────── */}
      <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={16} className="text-slate-500" />
          <span className="text-sm font-semibold text-[#171923]">Ícono de la aplicación</span>
          {iconSaving && <span className="text-xs text-slate-400 ml-auto">Guardando…</span>}
          {iconSuccess && <span className="text-xs text-emerald-600 ml-auto font-medium">✓ Guardado</span>}
        </div>
        <p className="text-xs text-slate-400 mb-4">Selecciona la variante de ícono para nuevas instalaciones de la PWA.</p>
        <div className="flex gap-3 justify-center">
          {([
            { key: 'dorado', label: 'Dorado', border: '#D4A017' },
            { key: 'blanco', label: 'Blanco', border: '#333' },
            { key: 'rojo',   label: 'Rojo',   border: '#CC0000' },
          ] as const).map(({ key, label, border }) => (
            <button
              key={key}
              onClick={() => handleIconChange(key)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                selectedIcon === key
                  ? 'ring-2 ring-offset-2 bg-slate-50'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className="relative w-16 h-16 rounded-[18px] overflow-hidden shadow-md"
                style={{ outline: selectedIcon === key ? `2.5px solid ${border}` : '2px solid transparent' }}
              >
                <Image
                  src={`/icons/variant-${key}/icon-192.png`}
                  alt={`Ícono ${label}`}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-slate-600">{label}</span>
              {selectedIcon === key && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-amber-600 mt-3 text-center">
          ⚠️ El cambio solo afecta a nuevas instalaciones — los usuarios que ya instalaron la app conservan el ícono anterior.
        </p>
      </div>

      {/* ── IA Prompt Editor ─────────────────────────────── */}
      <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500" />
            <span className="text-sm font-semibold text-[#171923]">Estudio Profundo IA (System Prompt)</span>
          </div>
          <div className="flex items-center gap-2">
            {promptSuccess && <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>}
            <button
              onClick={handlePromptSave}
              disabled={promptSaving || !promptValue.trim()}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {promptSaving ? 'Guardando...' : 'Guardar Prompt'}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Este es el <strong>System Prompt</strong> que guía a la IA en el módulo de "Estudio Profundo".
          Modifícalo para ajustar el tono, metodología o instrucciones de la respuesta.
        </p>
        <textarea
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          className="w-full h-64 p-3 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
          placeholder="Escribe las instrucciones base para la IA..."
        />
      </div>

      {/* ── Tabs ─────────────────────────────── */}
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
                        onChange={(e) => handleRolChange(u.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase cursor-pointer border-none outline-none ${badgeColors}`}
                      >
                        <option value="servidor">Servidor</option>
                        <option value="lider">Líder</option>
                        <option value="pastor">Pastor</option>
                        <option value="administrador">Admin</option>
                      </select>
                      {esLider && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                    </div>

                    {u.rol === 'pastor' && (
                      <div className="mt-3 flex items-center gap-2">
                        <label className="flex items-center cursor-pointer gap-2">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={!!u.es_pastor_general}
                              disabled={currentUserRol !== 'administrador'}
                              onChange={() => handlePastorGeneralToggle(u.id, !!u.es_pastor_general)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${u.es_pastor_general ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${u.es_pastor_general ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">Pastor General</span>
                        </label>
                      </div>
                    )}

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

      {/* Role change error toast */}
      {rolError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl max-w-xs text-center animate-in slide-in-from-bottom-4">
          {rolError}
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
