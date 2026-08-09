'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type UserAvatarProps = {
  nombre?: string | null
  avatarUrl?: string | null
  size?: AvatarSize
  preview?: boolean
  className?: string
  ring?: boolean
}

type Crop = {
  src: string
  x: number
  y: number
  zoom: number
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-xl sm:h-[72px] sm:w-[72px] sm:text-2xl',
}

function numberParam(value: string | null, fallback: number) {
  const parsed = value === null ? Number.NaN : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function parseAvatarUrl(avatarUrl?: string | null): Crop | null {
  if (!avatarUrl) return null
  try {
    const url = new URL(avatarUrl)
    const x = Math.max(-1, Math.min(1, numberParam(url.searchParams.get('cx'), 0)))
    const y = Math.max(-1, Math.min(1, numberParam(url.searchParams.get('cy'), 0)))
    const zoom = Math.max(1, Math.min(3, numberParam(url.searchParams.get('cz'), 1)))
    url.searchParams.delete('cx')
    url.searchParams.delete('cy')
    url.searchParams.delete('cz')
    return { src: url.toString(), x, y, zoom }
  } catch {
    return { src: avatarUrl, x: 0, y: 0, zoom: 1 }
  }
}

export default function UserAvatar({
  nombre,
  avatarUrl,
  size = 'md',
  preview = true,
  className = '',
  ring = true,
}: UserAvatarProps) {
  const [open, setOpen] = useState(false)
  const [aspect, setAspect] = useState(1)
  const inicial = nombre?.trim().charAt(0).toUpperCase() || 'U'
  const crop = parseAvatarUrl(avatarUrl)
  const baseClass = `${sizeClasses[size]} shrink-0 overflow-hidden rounded-full ${ring ? 'ring-2 ring-white' : ''} ${className}`

  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const body = document.body
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
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
  }, [open])

  const baseWidth = aspect >= 1 ? aspect * 100 : 100
  const baseHeight = aspect >= 1 ? 100 : (100 / Math.max(aspect, 0.0001))

  const image = crop ? (
    <span className={`${baseClass} relative block bg-slate-100 shadow-sm`}>
      <img
        src={crop.src}
        alt={`Foto de ${nombre || 'miembro'}`}
        onLoad={(event) => {
          const img = event.currentTarget
          if (img.naturalWidth && img.naturalHeight) setAspect(img.naturalWidth / img.naturalHeight)
        }}
        className="pointer-events-none absolute max-w-none select-none"
        draggable={false}
        style={{
          width: `${baseWidth * crop.zoom}%`,
          height: `${baseHeight * crop.zoom}%`,
          left: `calc(50% + ${crop.x * 100}%)`,
          top: `calc(50% + ${crop.y * 100}%)`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </span>
  ) : (
    <span
      className={`${baseClass} grid place-items-center bg-indigo-50 font-bold text-indigo-600 ring-indigo-100`}
      aria-label={nombre ? `Avatar de ${nombre}` : 'Avatar de usuario'}
    >
      {inicial}
    </span>
  )

  const previewModal = open && crop && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[10020] flex items-center justify-center bg-slate-950/80 px-[max(1rem,env(safe-area-inset-left))] py-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm"
          style={{
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section role="dialog" aria-modal="true" aria-label={`Foto de ${nombre || 'miembro'}`} className="relative w-full max-w-lg">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-14 right-0 grid h-11 w-11 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/20 backdrop-blur-md transition active:scale-95"
              aria-label="Cerrar foto"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="overflow-hidden rounded-[30px] bg-black/35 shadow-[0_30px_90px_rgba(0,0,0,0.45)] ring-1 ring-white/15">
              <div className="flex min-h-[320px] max-h-[70vh] w-full items-center justify-center bg-slate-950">
                <img src={crop.src} alt={`Foto completa de ${nombre || 'miembro'}`} className="max-h-[70vh] w-full object-contain" />
              </div>
              {nombre && <div className="bg-slate-950/95 px-5 py-4 text-center text-sm font-semibold text-white">{nombre}</div>}
            </div>
          </section>
        </div>,
        document.body,
      )
    : null

  if (!crop || !preview) return image

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen(true)
        }}
        className="rounded-full transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        aria-label={`Ver foto de ${nombre || 'miembro'}`}
      >
        {image}
      </button>
      {previewModal}
    </>
  )
}
