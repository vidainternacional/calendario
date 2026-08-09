'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCheck, Globe, Megaphone } from 'lucide-react'
import UserAvatar from '@/components/comunidad/UserAvatar'
import { markPublicationRead } from '@/components/avisos/usePublicationReads'

type Props = {
  id: string
  titulo: string
  cuerpo?: string | null
  tipo: string
  fecha: string
  autor: string
  autorAvatarUrl?: string | null
  ministerioId?: string | null
  ministerioNombre?: string | null
}

export default function PublicacionDetalle({
  id,
  titulo,
  cuerpo,
  tipo,
  fecha,
  autor,
  autorAvatarUrl,
  ministerioId,
  ministerioNombre,
}: Props) {
  useEffect(() => {
    void markPublicationRead(id)
  }, [id])

  const backHref = ministerioId ? `/ministerios/${ministerioId}/avisos` : '/avisos'

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur-md transition active:scale-[0.98]"
          aria-label="Regresar a avisos"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Avisos</span>
        </Link>

        <article className="mt-5 overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
          <header className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-indigo-600">
                <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
                {tipo.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-500">
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Leído
              </span>
            </div>
            <h1 className="mt-3 break-words text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[#171923] sm:text-[34px]">
              {titulo}
            </h1>
          </header>

          <div className="px-5 py-5 sm:px-7 sm:py-7">
            <div className="rounded-[22px] bg-slate-50 px-5 py-5 ring-1 ring-slate-100">
              {cuerpo ? (
                <p className="whitespace-pre-wrap break-words text-[17px] leading-8 text-slate-700">{cuerpo}</p>
              ) : (
                <p className="text-sm text-slate-500">Esta publicación no tiene contenido adicional.</p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <UserAvatar nombre={autor} avatarUrl={autorAvatarUrl} size="sm" />
              <span className="font-semibold text-slate-700">{autor}</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span>{fecha}</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              {ministerioNombre ? (
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-600">{ministerioNombre}</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-500">
                  <Globe className="h-3 w-3" aria-hidden="true" /> Global
                </span>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}
