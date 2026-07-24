'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Palette, Pencil, X } from 'lucide-react'
import { personalizarMinisterio } from '@/app/actions/ministerio-personalizacion'

const EMOJIS = ['⛪', '🙏', '🙌', '🎵', '🎤', '📖', '🕊️', '🔥', '🌿', '🤝', '👥', '🎥', '📸', '🎨', '👶', '🏆']

type MinisterioEditable = {
  id: string
  nombre: string
  descripcion: string | null
  emoji: string | null
  color_primario: string | null
  color_secundario: string | null
}

export default function PersonalizarMinisterioButton({ ministerio }: { ministerio: MinisterioEditable }) {
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [nombre, setNombre] = useState(ministerio.nombre)
  const [descripcion, setDescripcion] = useState(ministerio.descripcion || '')
  const [emoji, setEmoji] = useState(ministerio.emoji || '⛪')
  const [colorPrimario, setColorPrimario] = useState(ministerio.color_primario || '#4F46E5')
  const [colorSecundario, setColorSecundario] = useState(ministerio.color_secundario || '#7C3AED')

  useEffect(() => {
    if (!abierto) return
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const cerrar = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !guardando) setAbierto(false)
    }
    window.addEventListener('keydown', cerrar)
    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', cerrar)
    }
  }, [abierto, guardando])

  const previewStyle = useMemo(
    () => ({ background: `linear-gradient(145deg, ${colorPrimario}, ${colorSecundario})` }),
    [colorPrimario, colorSecundario]
  )

  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGuardando(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const result = await personalizarMinisterio(formData)

    if (!result.success) {
      setError(result.error || 'No fue posible guardar los cambios.')
      setGuardando(false)
      return
    }

    setGuardando(false)
    setAbierto(false)
    window.location.reload()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/95 text-slate-700 shadow-lg backdrop-blur-md transition-transform active:scale-95"
        aria-label="Personalizar ministerio"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="personalizar-ministerio-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !guardando) setAbierto(false)
          }}
        >
          <div className="flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="min-w-0 pr-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Identidad visual</p>
                <h2 id="personalizar-ministerio-title" className="mt-1 truncate text-lg font-bold text-[#171923]">
                  Personalizar dashboard
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={guardando}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardar} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
                <input type="hidden" name="ministerio_id" value={ministerio.id} />
                <input type="hidden" name="emoji" value={emoji} />

                <section className="overflow-hidden rounded-[22px] text-white shadow-lg" style={previewStyle}>
                  <div className="relative min-h-44 overflow-hidden p-5">
                    <div className="absolute -right-8 -top-10 text-[7rem] opacity-15" aria-hidden="true">{emoji}</div>
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
                    <div className="relative flex min-h-36 flex-col justify-end">
                      <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-white/80 bg-white/15 text-3xl shadow-lg backdrop-blur-sm">
                        {emoji}
                      </div>
                      <h3 className="mt-3 break-words text-xl font-bold">{nombre || 'Nombre del ministerio'}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-white/85">{descripcion || 'Descripción breve del ministerio.'}</p>
                    </div>
                  </div>
                </section>

                {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600" role="alert">{error}</p>}

                <div className="space-y-1.5">
                  <label htmlFor="ministerio-personalizado-nombre" className="text-xs font-bold uppercase text-slate-500">Nombre visible</label>
                  <input
                    id="ministerio-personalizado-nombre"
                    name="nombre"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    maxLength={80}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 text-base text-[#171923] outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ministerio-personalizado-descripcion" className="text-xs font-bold uppercase text-slate-500">Descripción</label>
                  <textarea
                    id="ministerio-personalizado-descripcion"
                    name="descripcion"
                    value={descripcion}
                    onChange={(event) => setDescripcion(event.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-base leading-relaxed text-[#171923] outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-right text-[11px] text-slate-400">{descripcion.length}/500</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Ícono del ministerio</p>
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJIS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setEmoji(item)}
                        className={`grid aspect-square min-h-10 place-items-center rounded-xl text-xl ${emoji === item ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'bg-slate-50'}`}
                        aria-label={`Usar ${item}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500">
                    Color principal
                    <span className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2">
                      <Palette className="h-4 w-4 text-slate-400" />
                      <input name="color_primario" type="color" value={colorPrimario} onChange={(event) => setColorPrimario(event.target.value)} className="h-9 w-full cursor-pointer rounded-lg border-0 bg-transparent" />
                    </span>
                  </label>
                  <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500">
                    Color secundario
                    <span className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2">
                      <Palette className="h-4 w-4 text-slate-400" />
                      <input name="color_secundario" type="color" value={colorSecundario} onChange={(event) => setColorSecundario(event.target.value)} className="h-9 w-full cursor-pointer rounded-lg border-0 bg-transparent" />
                    </span>
                  </label>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-relaxed text-indigo-700">
                  Los cambios solo afectan este ministerio. La carga de portada y foto de perfil se habilitará cuando quede configurado el almacenamiento seguro de imágenes.
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-4">
                <button type="button" onClick={() => setAbierto(false)} disabled={guardando} className="min-h-12 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60">
                  {guardando ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando…</> : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
