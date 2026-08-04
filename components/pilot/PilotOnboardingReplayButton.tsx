'use client'

import { Compass } from 'lucide-react'

export default function PilotOnboardingReplayButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('vida:open-onboarding'))}
      className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-slate-100 bg-white p-5 text-left shadow-sm active:scale-[0.99]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600">
          <Compass className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#171923]">Ayuda y recorrido</span>
          <span className="mt-0.5 block text-xs leading-5 text-slate-500">Vuelve a ver la guía correspondiente a tu rol.</span>
        </span>
      </span>
      <span className="text-2xl text-slate-300" aria-hidden="true">›</span>
    </button>
  )
}
