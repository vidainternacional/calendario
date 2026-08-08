'use client'

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AvatarUploaderProps = {
  userId: string
  nombre: string
  avatarUrl?: string | null
}

const AVATAR_SIZE = 512
const MAX_SOURCE_BYTES = 12 * 1024 * 1024

function cargarImagen(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen.'))
    }
    image.src = url
  })
}

async function prepararAvatar(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Selecciona una fotografía válida.')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('La fotografía original es demasiado grande.')

  const image = await cargarImagen(file)
  const lado = Math.min(image.naturalWidth, image.naturalHeight)
  const sx = Math.max(0, (image.naturalWidth - lado) / 2)
  const sy = Math.max(0, (image.naturalHeight - lado) / 2)

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo preparar la fotografía.')

  context.drawImage(image, sx, sy, lado, lado, 0, 0, AVATAR_SIZE, AVATAR_SIZE)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.8)
  })

  if (!blob) throw new Error('No se pudo comprimir la fotografía.')
  if (blob.size > 512 * 1024) throw new Error('La fotografía no pudo optimizarse lo suficiente.')
  return blob
}

export default function AvatarUploader({ userId, nombre, avatarUrl }: AvatarUploaderProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentUrl, setCurrentUrl] = useState(avatarUrl || '')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const inicial = nombre.trim().charAt(0).toUpperCase() || 'U'

  const seleccionar = async (file?: File) => {
    if (!file) return
    setPending(true)
    setMessage(null)

    try {
      const avatar = await prepararAvatar(file)
      const supabase = createClient()
      const path = `${userId}/avatar.webp`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatar, {
          upsert: true,
          contentType: 'image/webp',
          cacheControl: '3600',
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (profileError) throw profileError

      setCurrentUrl(publicUrl)
      setMessage('Foto actualizada')
      router.refresh()
    } catch (error) {
      console.error('[AvatarUploader]', error)
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la fotografía.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
      setPending(false)
    }
  }

  const quitar = async () => {
    setPending(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const path = `${userId}/avatar.webp`
      await supabase.storage.from('avatars').remove([path])
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)
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

  return (
    <div className="shrink-0">
      <div className="relative h-16 w-16 sm:h-[72px] sm:w-[72px]">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={`Foto de ${nombre}`}
            className="h-full w-full rounded-full object-cover shadow-[0_8px_22px_rgba(15,23,42,0.16)] ring-4 ring-white"
          />
        ) : (
          <div className="grid h-full w-full place-items-center rounded-full bg-indigo-600 text-xl font-bold text-white shadow-[0_8px_22px_rgba(79,70,229,0.22)] ring-4 ring-white sm:text-2xl">
            {inicial}
          </div>
        )}

        <label
          className={`absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg transition active:scale-95 ${pending ? 'pointer-events-none opacity-70' : ''}`}
          aria-label="Cambiar foto de perfil"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            disabled={pending}
            onChange={(event) => void seleccionar(event.target.files?.[0])}
          />
        </label>
      </div>

      {currentUrl && (
        <button
          type="button"
          onClick={() => void quitar()}
          disabled={pending}
          className="mt-2 inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-slate-400 transition hover:text-rose-500 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
          Quitar
        </button>
      )}

      {message && (
        <p className={`mt-1 max-w-24 text-[10px] leading-4 ${message.startsWith('No ') || message.includes('demasiado') || message.includes('Selecciona') ? 'text-rose-500' : 'text-emerald-600'}`} role="status">
          {message}
        </p>
      )}
    </div>
  )
}
