'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { guardarMinisterio } from '@/app/actions/admin'

const EMOJIS_COMUNES = [
  '🎵', '🎶', '🎤', '🎧', '🎼', '🎹', '🎸', '🎺',
  '🎻', '🥁', '🪘', '🪇', '🙏', '🙌', '🤲', '👏',
  '🤝', '🫶', '❤️', '🧡', '💛', '💚', '💙', '💜',
  '🤍', '🕊️', '✝️', '⛪', '💒', '📖', '📚', '📝',
  '💡', '🌟', '✨', '🔥', '🌿', '🌱', '🌳', '🌈',
  '👶', '🧒', '👦', '👧', '👨', '👩', '👨‍👩‍👧‍👦', '🧑‍🤝‍🧑',
  '👥', '🫂', '👑', '🎯', '📣', '📢', '📱', '💻',
  '📸', '🎥', '🎨', '🖌️', '🍽️', '☕', '🥖', '🧃',
  '🏠', '🏕️', '🌍', '✈️', '🚐', '⚽', '🏀', '🏐',
  '🏆', '🎓', '🩺', '🛠️', '🧹', '🧼', '🚪', '🔑',
]

export default function MinisterioModal({
  ministerio,
  isOpen,
  onClose,
}: {
  ministerio: any | null
  isOpen: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(ministerio?.emoji || '✨')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    setSelectedEmoji(ministerio?.emoji || '✨')
    setShowPicker(false)
  }, [ministerio, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setError('')
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('emoji', selectedEmoji)
      await guardarMinisterio(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'No fue posible guardar el ministerio.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ministerio-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose()
      }}
    >
      <div className="flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:max-h-[88vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 pb-3 pt-4 sm:px-5">
          <div className="min-w-0 pr-3">
            <h3 id="ministerio-modal-title" className="truncate font-bold text-[#171923]">
              {ministerio ? 'Editar ministerio' : 'Nuevo ministerio'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Define la identidad básica que se mostrará en la aplicación.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 text-gray-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600" role="alert">
                {error}
              </div>
            )}

            {ministerio && <input type="hidden" name="id" value={ministerio.id} />}
            <input type="hidden" name="emoji" value={selectedEmoji} />

            <div className="space-y-2">
              <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-gray-500">Emoji</label>
                  <button
                    type="button"
                    onClick={() => setShowPicker((value) => !value)}
                    className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-[#f4f5f9] text-2xl outline-none transition-colors hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
                    aria-expanded={showPicker}
                    aria-label="Seleccionar emoji"
                  >
                    {selectedEmoji || '✨'}
                  </button>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="ministerio-nombre" className="block text-xs font-bold uppercase text-gray-500">
                    Nombre
                  </label>
                  <input
                    id="ministerio-nombre"
                    name="nombre"
                    defaultValue={ministerio?.nombre || ''}
                    required
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 text-base text-[#171923] outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. Alabanza"
                  />
                </div>
              </div>

              {showPicker && (
                <div className="rounded-2xl border border-slate-200 bg-[#f4f5f9] p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase text-gray-500">Selecciona o escribe uno</p>
                  <div className="mb-3 grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-8">
                    {EMOJIS_COMUNES.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji)
                          setShowPicker(false)
                        }}
                        className={`flex h-10 items-center justify-center rounded-lg text-xl transition-colors hover:bg-white hover:shadow-sm ${
                          selectedEmoji === emoji ? 'bg-white shadow-sm ring-2 ring-indigo-400' : ''
                        }`}
                        aria-label={`Usar ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="emoji-manual" className="shrink-0 text-[11px] font-medium text-gray-500">
                      Manual:
                    </label>
                    <input
                      id="emoji-manual"
                      type="text"
                      maxLength={12}
                      value={selectedEmoji}
                      onChange={(event) => setSelectedEmoji(event.target.value)}
                      className="h-11 w-24 rounded-lg border border-slate-200 bg-white px-2 text-center text-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPicker(false)}
                      className="min-h-11 flex-1 rounded-lg bg-indigo-50 px-4 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="color-primario" className="block text-xs font-bold uppercase text-gray-500">
                  Color principal
                </label>
                <input
                  id="color-primario"
                  name="color_primario"
                  type="color"
                  defaultValue={ministerio?.color_primario || '#4F46E5'}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="color-secundario" className="block text-xs font-bold uppercase text-gray-500">
                  Color secundario
                </label>
                <input
                  id="color-secundario"
                  name="color_secundario"
                  type="color"
                  defaultValue={ministerio?.color_secundario || '#E0E7FF'}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ministerio-descripcion" className="block text-xs font-bold uppercase text-gray-500">
                Descripción
              </label>
              <textarea
                id="ministerio-descripcion"
                name="descripcion"
                defaultValue={ministerio?.descripcion || ''}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-base leading-relaxed text-[#171923] outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe brevemente qué hace este ministerio."
              />
              <p className="text-[11px] text-slate-400">Este texto aparecerá en el listado general de ministerios.</p>
            </div>

            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                name="activo"
                value="true"
                defaultChecked={ministerio ? ministerio.activo : true}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <span className="block text-sm font-semibold text-[#171923]">Ministerio activo</span>
                <span className="block text-xs text-slate-500">Visible y disponible para los miembros.</span>
              </span>
            </label>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
