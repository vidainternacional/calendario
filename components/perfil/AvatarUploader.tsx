'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UserAvatar, { parseAvatarUrl } from '@/components/comunidad/UserAvatar'

type AvatarUploaderProps = {
  userId: string
  nombre: string
  avatarUrl?: string | null
}

type EditorState = {
  objectUrl: string
  image: HTMLImageElement
  baseWidth: number
  baseHeight: number
  zoom: number
  offsetX: number
  offsetY: number
  sourceBlob?: Blob
}

const SOURCE_MAX_SIDE = 1600
const EDITOR_SIZE = 280
const MAX_SOURCE_BYTES = 30 * 1024 * 1024
const MAX_STORED_BYTES = 512 * 1024
const TARGET_STORED_BYTES = 480 * 1024
const SOURCE_MIN_SIDE = 640

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampOffsets(editor: EditorState, x: number, y: number) {
  const maxX = Math.max(0, (editor.baseWidth - EDITOR_SIZE) / 2)
  const maxY = Math.max(0, (editor.baseHeight - EDITOR_SIZE) / 2)
  return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) }
}

function abrirBlob(blob: Blob) {
  return new Promise<{ image: HTMLImageElement; objectUrl: string }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => resolve({ image, objectUrl })
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo leer esta fotografía en el dispositivo. Prueba convertirla a JPG, PNG o WebP.'))
    }
    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

async function optimizarFuente(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Selecciona una fotografía válida.')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('La fotografía es demasiado grande para procesarla en el teléfono.')

  const { image, objectUrl } = await abrirBlob(file)
  try {
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('La fotografía no tiene dimensiones válidas.')

    const originalMaxSide = Math.max(image.naturalWidth, image.naturalHeight)
    const initialMaxSide = Math.min(SOURCE_MAX_SIDE, originalMaxSide)
    const dimensionSteps = [initialMaxSide, 1440, 1280, 1120, 1024, 900, 800, 720, SOURCE_MIN_SIDE]
      .filter((value, index, values) => value <= initialMaxSide && values.indexOf(value) === index)
    const qualities = [0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36]
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo preparar la fotografía.')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    let smallestBlob: Blob | null = null

    for (const maxSide of dimensionSteps) {
      const scale = Math.min(1, maxSide / originalMaxSide)
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.width = width
      canvas.height = height
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)

      for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, quality)
        if (!blob) continue
        if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob
        if (blob.size <= TARGET_STORED_BYTES) return blob
      }
    }

    if (smallestBlob && smallestBlob.size <= MAX_STORED_BYTES) return smallestBlob

    for (const maxSide of [576, 512]) {
      const scale = Math.min(1, maxSide / originalMaxSide)
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.width = width
      canvas.height = height
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      for (const quality of [0.42, 0.34, 0.28]) {
        const blob = await canvasToBlob(canvas, quality)
        if (blob && blob.size <= MAX_STORED_BYTES) return blob
      }
    }

    throw new Error('No se pudo preparar esta fotografía. Prueba con otra imagen válida.')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function crearEditorDesdeBlob(blob: Blob, crop?: { x: number; y: number }, sourceBlob?: Blob): Promise<EditorState> {
  const { image, objectUrl } = await abrirBlob(blob)
  const scale = Math.max(EDITOR_SIZE / image.naturalWidth, EDITOR_SIZE / image.naturalHeight)
  const editor: EditorState = {
    objectUrl,
    image,
    baseWidth: image.naturalWidth * scale,
    baseHeight: image.naturalHeight * scale,
    zoom: 1,
    offsetX: (crop?.x ?? 0) * EDITOR_SIZE,
    offsetY: (crop?.y ?? 0) * EDITOR_SIZE,
    sourceBlob,
  }
  const next = clampOffsets(editor, editor.offsetX, editor.offsetY)
  editor.offsetX = next.x
  editor.offsetY = next.y
  return editor
}

function buildAvatarUrl(baseUrl: string, editor: EditorState) {
  const url = new URL(baseUrl)
  url.searchParams.set('v', String(Date.now()))
  url.searchParams.set('cx', (editor.offsetX / EDITOR_SIZE).toFixed(5))
  url.searchParams.set('cy', (editor.offsetY / EDITOR_SIZE).toFixed(5))
  url.searchParams.set('cz', '1')
  return url.toString()
}

export default function AvatarUploader({ userId, nombre, avatarUrl }: AvatarUploaderProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null)
  const [currentUrl, setCurrentUrl] = useState(avatarUrl || '')
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const cancelarEditor = () => {
    setEditor((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl)
      return null
    })
    dragRef.current = null
    if (inputRef.current) inputRef.current.value = ''
  }

  useEffect(() => {
    if (!editor) return
    const scrollY = window.scrollY
    const body = document.body
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) cancelarEditor()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.overflow = previous.overflow
      window.scrollTo(0, scrollY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(editor), pending])

  const seleccionar = async (file?: File) => {
    if (!file) return
    setPending(true)
    setMessage(null)
    try {
      const sourceBlob = await optimizarFuente(file)
      const nextEditor = await crearEditorDesdeBlob(sourceBlob, undefined, sourceBlob)
      setEditor((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl)
        return nextEditor
      })
    } catch (error) {
      if (inputRef.current) inputRef.current.value = ''
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir la fotografía.')
    } finally {
      setPending(false)
    }
  }

  const editarActual = async () => {
    if (!currentUrl || pending) return
    setPending(true)
    setMessage(null)
    try {
      const parsed = parseAvatarUrl(currentUrl)
      if (!parsed || !parsed.src.includes('/source.webp')) {
        setMessage('Esta foto fue guardada con el sistema anterior y ya no conserva las partes recortadas. Reemplázala una vez para habilitar el reencuadre completo.')
        return
      }
      const supabase = createClient()
      const { data: source, error } = await supabase.storage.from('avatars').download(`${userId}/source.webp`)
      if (error || !source) throw new Error('No se encontró la fotografía completa guardada.')
      const nextEditor = await crearEditorDesdeBlob(source, { x: parsed.x, y: parsed.y })
      setEditor((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl)
        return nextEditor
      })
    } catch (error) {
      console.error('[AvatarUploader:editarActual]', error)
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir la fotografía para editarla.')
    } finally {
      setPending(false)
    }
  }

  const guardar = async () => {
    if (!editor) return
    setPending(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const sourcePath = `${userId}/source.webp`
      if (editor.sourceBlob) {
        const { error: sourceError } = await supabase.storage.from('avatars').upload(sourcePath, editor.sourceBlob, {
          upsert: true,
          contentType: 'image/webp',
          cacheControl: '3600',
        })
        if (sourceError) throw sourceError
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(sourcePath)
      const publicUrl = buildAvatarUrl(data.publicUrl, editor)
      const { error: profileError } = await (supabase as any).from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
      if (profileError) throw profileError
      if (editor.sourceBlob) await supabase.storage.from('avatars').remove([`${userId}/avatar.webp`])
      setCurrentUrl(publicUrl)
      setMessage(editor.sourceBlob ? 'Foto actualizada' : 'Encuadre actualizado')
      URL.revokeObjectURL(editor.objectUrl)
      setEditor(null)
      if (inputRef.current) inputRef.current.value = ''
      router.refresh()
    } catch (error) {
      console.error('[AvatarUploader]', error)
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la fotografía.')
    } finally {
      setPending(false)
    }
  }

  const quitar = async () => {
    setPending(true)
    setMessage(null)
    try {
      const supabase = createClient()
      await supabase.storage.from('avatars').remove([`${userId}/source.webp`, `${userId}/avatar.webp`])
      const { error } = await (supabase as any).from('profiles').update({ avatar_url: null }).eq('id', userId)
      if (error) throw error
      setCurrentUrl('')
      setMessage('Foto eliminada')
      router.refresh()
    } catch (error) {
      console.error('[AvatarUploader]', error)
      setMessage('No se pudo eliminar la fotografía.')
    } finally {
      setPending(false)
    }
  }

  const editorModal = editor && typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[10030] flex items-end justify-center bg-slate-950/70 px-0 backdrop-blur-sm sm:items-center sm:px-4" onClick={(event) => { if (event.target === event.currentTarget && !pending) cancelarEditor() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title" className="w-full max-w-md overflow-hidden rounded-t-[30px] bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-20px_70px_rgba(15,23,42,0.35)] sm:rounded-[30px] sm:pb-4">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 sm:pt-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-500">Foto de perfil</p>
            <h2 id="avatar-editor-title" className="mt-0.5 text-xl font-bold text-[#171923]">Ajusta tu foto</h2>
          </div>
          <button type="button" onClick={cancelarEditor} disabled={pending} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-50" aria-label="Cancelar edición"><X className="h-5 w-5" /></button>
        </header>

        <div className="px-4 py-5 sm:px-5">
          <p className="mb-4 text-center text-xs leading-5 text-slate-500">La foto completa queda guardada. Arrástrala hacia arriba, abajo, izquierda o derecha para elegir el encuadre.</p>
          <div
            className="relative mx-auto h-[280px] w-[280px] touch-none select-none overflow-hidden rounded-full bg-slate-950 shadow-inner ring-4 ring-slate-100"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: editor.offsetX, offsetY: editor.offsetY }
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current
              if (!drag || drag.pointerId !== event.pointerId) return
              const next = clampOffsets(editor, drag.offsetX + (event.clientX - drag.startX), drag.offsetY + (event.clientY - drag.startY))
              setEditor((prev) => prev ? { ...prev, offsetX: next.x, offsetY: next.y } : prev)
            }}
            onPointerUp={(event) => {
              if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onPointerCancel={() => { dragRef.current = null }}
          >
            <img src={editor.objectUrl} alt="Vista previa para encuadrar" draggable={false} className="pointer-events-none absolute max-w-none select-none" style={{ width: editor.baseWidth, height: editor.baseHeight, left: `calc(50% + ${editor.offsetX}px)`, top: `calc(50% + ${editor.offsetY}px)`, transform: 'translate(-50%, -50%)' }} />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/40" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={cancelarEditor} disabled={pending} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={() => void guardar()} disabled={pending} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(79,70,229,0.22)] disabled:opacity-50">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {pending ? 'Guardando…' : 'Guardar encuadre'}
            </button>
          </div>
        </div>
      </section>
    </div>, document.body) : null

  return (
    <div className="shrink-0">
      <div className="relative h-16 w-16 sm:h-[72px] sm:w-[72px]">
        <UserAvatar nombre={nombre} avatarUrl={currentUrl} size="xl" className="shadow-[0_8px_22px_rgba(15,23,42,0.16)] ring-4 ring-white" />
        <label className={`absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg transition active:scale-95 ${pending ? 'pointer-events-none opacity-70' : ''}`} aria-label="Cambiar foto de perfil">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" disabled={pending} onChange={(event) => void seleccionar(event.target.files?.[0])} />
        </label>
      </div>

      {currentUrl && (
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={() => void editarActual()} disabled={pending} className="inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-indigo-500 transition hover:text-indigo-600 disabled:opacity-50"><Pencil className="h-3 w-3" aria-hidden="true" />Editar</button>
          <span className="text-slate-200" aria-hidden="true">·</span>
          <button type="button" onClick={() => void quitar()} disabled={pending} className="inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-slate-400 transition hover:text-rose-500 disabled:opacity-50"><Trash2 className="h-3 w-3" aria-hidden="true" />Quitar</button>
        </div>
      )}

      {message && <p className={`mt-1 max-w-48 text-[10px] leading-4 ${message.includes('sistema anterior') || message.startsWith('No ') || message.includes('demasiado') || message.includes('Selecciona') ? 'text-rose-500' : 'text-emerald-600'}`} role="status">{message}</p>}
      {editorModal}
    </div>
  )
}
