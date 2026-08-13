'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
  backHref?: string
  backLabel?: string
}

export default function AuthFrame({
  title,
  subtitle,
  children,
  backHref = '/',
  backLabel = 'Inicio',
}: Props) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#f7f7f4] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] text-slate-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#C0392B]/10 blur-3xl" />
        <div className="absolute -right-24 top-[38%] h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/75 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-3 text-xs font-bold text-slate-600 shadow-sm backdrop-blur-xl transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <span className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 backdrop-blur-xl">
          Vida Internacional
        </span>
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col justify-center py-8">
        <div className="mb-6 text-center">
          <div className="relative mx-auto mb-4 w-fit">
            <div className="h-[84px] w-[84px] overflow-hidden rounded-[24px] bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/80">
              <Image
                src="/icons/variant-dorado/icon-192.png"
                alt="Logo Centro Cristiano Vida"
                width={84}
                height={84}
                className="h-full w-full rounded-[20px] object-cover"
                priority
              />
            </div>
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#f7f7f4] bg-emerald-500" aria-hidden />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C0392B]">Centro Cristiano Vida</p>
          <h1 className="mt-2 text-[30px] font-black tracking-[-0.035em] text-slate-950">{title}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/60 backdrop-blur-2xl sm:p-6">
          {children}
        </div>
      </section>
    </main>
  )
}
