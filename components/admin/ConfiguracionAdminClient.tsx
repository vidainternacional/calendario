'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Smartphone, Sparkles } from 'lucide-react'
import { updateEstudioPrompt, updateIconVariant } from '@/app/actions/admin'

export default function ConfiguracionAdminClient({
  activeIconVariant,
  initialEstudioPrompt,
  isAdministrator,
  initialPastoralTemplates,
}: {
  activeIconVariant: string
  initialEstudioPrompt: string
  isAdministrator: boolean
  initialPastoralTemplates: unknown
}) {
  void isAdministrator
  void initialPastoralTemplates
  const [selectedIcon, setSelectedIcon] = useState<'dorado' | 'blanco' | 'rojo'>((activeIconVariant as any) || 'dorado')
  const [iconSaving, setIconSaving] = useState(false)
  const [prompt, setPrompt] = useState(initialEstudioPrompt || '')
  const [promptSaving, setPromptSaving] = useState(false)
  const [saved, setSaved] = useState('')

  const changeIcon = async (variant: 'dorado' | 'blanco' | 'rojo') => {
    setSelectedIcon(variant); setIconSaving(true); setSaved('')
    try { await updateIconVariant(variant); setSaved('Ícono guardado') } finally { setIconSaving(false) }
  }

  const savePrompt = async () => {
    setPromptSaving(true); setSaved('')
    try {
      const result = await updateEstudioPrompt(prompt)
      setSaved(result.success ? 'Prompt guardado' : (result.error || 'No se pudo guardar'))
    } finally { setPromptSaving(false) }
  }

  return (
    <div className="space-y-4">
      {saved && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{saved}</div>}
      <section className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-slate-500" /><h2 className="text-sm font-extrabold text-[#171923]">Ícono de la aplicación</h2>{iconSaving && <span className="ml-auto text-[11px] text-slate-400">Guardando…</span>}</div>
        <p className="mt-1 text-xs leading-5 text-slate-500">Variante utilizada en nuevas instalaciones de VIDA.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(['dorado','blanco','rojo'] as const).map((key) => (
            <button key={key} type="button" onClick={() => void changeIcon(key)} className={`relative rounded-2xl p-2 ${selectedIcon === key ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-50'}`}>
              <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-[16px] shadow-sm"><Image src={`/icons/variant-${key}/icon-192.png`} alt={`Ícono ${key}`} fill className="object-cover" /></div>
              <p className="mt-2 text-[11px] font-bold capitalize text-slate-600">{key}</p>
              {selectedIcon === key && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-white"><Check className="h-3 w-3" /></span>}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /><h2 className="text-sm font-extrabold text-[#171923]">Estudio Profundo IA</h2></div>
        <p className="mt-1 text-xs leading-5 text-slate-500">Instrucciones base que guían el módulo de Estudio Profundo.</p>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mt-4 min-h-64 w-full resize-y rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-indigo-300" />
        <button type="button" onClick={() => void savePrompt()} disabled={promptSaving || !prompt.trim()} className="mt-3 min-h-12 w-full rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-50">{promptSaving ? 'Guardando…' : 'Guardar prompt'}</button>
      </section>
    </div>
  )
}
