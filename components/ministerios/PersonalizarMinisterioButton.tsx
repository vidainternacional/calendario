'use client'

import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Loader2, Palette, Pencil, Trash2, Upload, X } from 'lucide-react'
import { personalizarMinisterio } from '@/app/actions/ministerio-personalizacion'
import { createClient } from '@/lib/supabase/client'

const EMOJIS = ['⛪', '🙏', '🙌', '🎵', '🎤', '📖', '🕊️', '🔥', '🌿', '🤝', '👥', '🎥', '📸', '🎨', '👶', '🏆']
const TITULO_FONT: Record<string, string> = {
  moderna: 'ui-sans-serif, system-ui, sans-serif',
  elegante: 'Georgia, Cambria, serif',
  fuerte: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
}
const CUERPO_FONT: Record<string, string> = {
  clasica: 'ui-sans-serif, system-ui, sans-serif',
  amable: 'Trebuchet MS, ui-sans-serif, sans-serif',
  compacta: 'Arial Narrow, ui-sans-serif, sans-serif',
}

type MinisterioEditable = {
  id: string
  nombre: string
  descripcion: string | null
  emoji: string | null
  color_primario: string | null
  color_secundario: string | null
  portada_url: string | null
  avatar_url: string | null
  fuente_titulo: string | null
  fuente_cuerpo: string | null
}

async function comprimirImagen(file: File, tipo: 'portada' | 'avatar') {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Usa una imagen JPG, PNG o WEBP.')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('La imagen original no puede superar 12 MB.')
  }

  const bitmap = await createImageBitmap(file)
  const maxW = tipo === 'portada' ? 1600 : 512
  const maxH = tipo === 'portada' ? 900 : 512
  const ratio = tipo === 'avatar' ? Math.max(maxW / bitmap.width, maxH / bitmap.height) : Math.min(1, maxW / bitmap.width, maxH / bitmap.height)
  const drawW = bitmap.width * ratio
  const drawH = bitmap.height * ratio
  const canvas = document.createElement('canvas')
  canvas.width = tipo === 'avatar' ? maxW : Math.max(1, Math.round(drawW))
  canvas.height = tipo === 'avatar' ? maxH : Math.max(1, Math.round(drawH))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No fue posible procesar la imagen.')

  const x = tipo === 'avatar' ? (canvas.width - drawW) / 2 : 0
  const y = tipo === 'avatar' ? (canvas.height - drawH) / 2 : 0
  ctx.drawImage(bitmap, x, y, drawW, drawH)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
  if (!blob) throw new Error('No fue posible comprimir la imagen.')
  if (blob.size > 3 * 1024 * 1024) throw new Error('La imagen comprimida supera 3 MB.')
  return blob
}

export default function PersonalizarMinisterioButton({ ministerio }: { ministerio: MinisterioEditable }) {
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState<'portada' | 'avatar' | null>(null)
  const [error, setError] = useState('')
  const [nombre, setNombre] = useState(ministerio.nombre)
  const [descripcion, setDescripcion] = useState(ministerio.descripcion || '')
  const [emoji, setEmoji] = useState(ministerio.emoji || '⛪')
  const [colorPrimario, setColorPrimario] = useState(ministerio.color_primario || '#4F46E5')
  const [colorSecundario, setColorSecundario] = useState(ministerio.color_secundario || '#7C3AED')
  const [portadaUrl, setPortadaUrl] = useState(ministerio.portada_url || '')
  const [avatarUrl, setAvatarUrl] = useState(ministerio.avatar_url || '')
  const [fuenteTitulo, setFuenteTitulo] = useState(ministerio.fuente_titulo || 'moderna')
  const [fuenteCuerpo, setFuenteCuerpo] = useState(ministerio.fuente_cuerpo || 'clasica')

  useEffect(() => {
    if (!abierto) return
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const cerrar = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !guardando && !subiendo) setAbierto(false)
    }
    window.addEventListener('keydown', cerrar)
    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', cerrar)
    }
  }, [abierto, guardando, subiendo])

  const previewStyle = useMemo(() => ({
    backgroundImage: portadaUrl
      ? `linear-gradient(180deg, rgba(15,23,42,.08), rgba(15,23,42,.62)), url("${portadaUrl}")`
      : `linear-gradient(145deg, ${colorPrimario}, ${colorSecundario})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }), [portadaUrl, colorPrimario, colorSecundario])

  async function subirImagen(file: File, tipo: 'portada' | 'avatar') {
    setSubiendo(tipo)
    setError('')
    try {
      const blob = await comprimirImagen(file, tipo)
      const supabase = createClient()
      const path = `${ministerio.id}/${tipo}.webp`
      const { error: uploadError } = await supabase.storage.from('ministerios').upload(path, blob, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('ministerios').getPublicUrl(path)
      const url = `${data.publicUrl}?v=${Date.now()}`
      if (tipo === 'portada') setPortadaUrl(url)
      else setAvatarUrl(url)
    } catch (err: any) {
      setError(err?.message || 'No fue posible subir la imagen.')
    } finally {
      setSubiendo(null)
    }
  }

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

  const ocupado = guardando || Boolean(subiendo)

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/95 text-slate-700 shadow-lg backdrop-blur-md transition-transform active:scale-95" aria-label="Personalizar ministerio">
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="personalizar-ministerio-title">
          <div className="flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="min-w-0 pr-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Identidad visual</p><h2 id="personalizar-ministerio-title" className="mt-1 truncate text-lg font-bold text-[#171923]">Personalizar dashboard</h2></div>
              <button type="button" onClick={() => setAbierto(false)} disabled={ocupado} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 disabled:opacity-50" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={guardar} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
                <input type="hidden" name="ministerio_id" value={ministerio.id} />
                <input type="hidden" name="emoji" value={emoji} />
                <input type="hidden" name="portada_url" value={portadaUrl} />
                <input type="hidden" name="avatar_url" value={avatarUrl} />

                <section className="overflow-hidden rounded-[22px] text-white shadow-lg" style={previewStyle}>
                  <div className="relative min-h-48 overflow-hidden p-5">
                    {!portadaUrl && <div className="absolute -right-8 -top-10 text-[7rem] opacity-15" aria-hidden="true">{emoji}</div>}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="relative flex min-h-40 flex-col justify-end">
                      <div className="grid h-16 w-16 overflow-hidden place-items-center rounded-full border-2 border-white/90 bg-white/15 text-3xl shadow-lg backdrop-blur-sm">
                        {avatarUrl ? <img src={avatarUrl} alt="Vista previa del perfil" className="h-full w-full object-cover" /> : emoji}
                      </div>
                      <h3 className="mt-3 break-words text-xl font-bold" style={{ fontFamily: TITULO_FONT[fuenteTitulo] }}>{nombre || 'Nombre del ministerio'}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-white/90" style={{ fontFamily: CUERPO_FONT[fuenteCuerpo] }}>{descripcion || 'Descripción breve del ministerio.'}</p>
                    </div>
                  </div>
                </section>

                {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600" role="alert">{error}</p>}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-3 text-center text-indigo-700">
                    {subiendo === 'portada' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                    <span className="mt-2 text-sm font-semibold">Cambiar portada</span>
                    <span className="mt-1 text-[10px]">JPG, PNG o WEBP · hasta 12 MB</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={ocupado} onChange={(e) => { const file = e.target.files?.[0]; if (file) void subirImagen(file, 'portada'); e.currentTarget.value = '' }} />
                  </label>
                  <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-slate-700">
                    {subiendo === 'avatar' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    <span className="mt-2 text-sm font-semibold">Subir foto de perfil</span>
                    <span className="mt-1 text-[10px]">Se recorta cuadrada automáticamente</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={ocupado} onChange={(e) => { const file = e.target.files?.[0]; if (file) void subirImagen(file, 'avatar'); e.currentTarget.value = '' }} />
                  </label>
                </div>

                {(portadaUrl || avatarUrl) && <div className="flex flex-wrap gap-2">
                  {portadaUrl && <button type="button" onClick={() => setPortadaUrl('')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600"><Trash2 className="h-4 w-4" />Quitar portada</button>}
                  {avatarUrl && <button type="button" onClick={() => setAvatarUrl('')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600"><Trash2 className="h-4 w-4" />Usar ícono</button>}
                </div>}

                <div className="space-y-1.5"><label htmlFor="ministerio-personalizado-nombre" className="text-xs font-bold uppercase text-slate-500">Nombre visible</label><input id="ministerio-personalizado-nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} required className="h-12 w-full rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 text-base text-[#171923] outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div className="space-y-1.5"><label htmlFor="ministerio-personalizado-descripcion" className="text-xs font-bold uppercase text-slate-500">Descripción</label><textarea id="ministerio-personalizado-descripcion" name="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={500} rows={4} className="w-full resize-none rounded-xl border border-slate-200 bg-[#f4f5f9] px-4 py-3 text-base leading-relaxed text-[#171923] outline-none focus:ring-2 focus:ring-indigo-500" /><p className="text-right text-[11px] text-slate-400">{descripcion.length}/500</p></div>

                <div className="space-y-2"><p className="text-xs font-bold uppercase text-slate-500">Ícono del ministerio</p><div className="grid grid-cols-8 gap-2">{EMOJIS.map((item) => <button key={item} type="button" onClick={() => setEmoji(item)} className={`grid aspect-square min-h-10 place-items-center rounded-xl text-xl ${emoji === item ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'bg-slate-50'}`} aria-label={`Usar ${item}`}>{item}</button>)}</div></div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500">Color principal<span className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2"><Palette className="h-4 w-4 text-slate-400" /><input name="color_primario" type="color" value={colorPrimario} onChange={(e) => setColorPrimario(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border-0 bg-transparent" /></span></label>
                  <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500">Color secundario<span className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2"><Palette className="h-4 w-4 text-slate-400" /><input name="color_secundario" type="color" value={colorSecundario} onChange={(e) => setColorSecundario(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border-0 bg-transparent" /></span></label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500">Fuente del título<select name="fuente_titulo" value={fuenteTitulo} onChange={(e) => setFuenteTitulo(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal normal-case text-slate-800"><option value="moderna">Moderna</option><option value="elegante">Elegante</option><option value="fuerte">Fuerte</option></select></label>
                  <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500">Fuente del texto<select name="fuente_cuerpo" value={fuenteCuerpo} onChange={(e) => setFuenteCuerpo(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal normal-case text-slate-800"><option value="clasica">Clásica</option><option value="amable">Amable</option><option value="compacta">Compacta</option></select></label>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-700">Las imágenes se convierten automáticamente a WEBP y se comprimen antes de subir. Portada recomendada: 1600 × 900 px. Perfil recomendado: imagen cuadrada de 512 × 512 px.</div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-4">
                <button type="button" onClick={() => setAbierto(false)} disabled={ocupado} className="min-h-12 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={ocupado} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{guardando ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando…</> : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
