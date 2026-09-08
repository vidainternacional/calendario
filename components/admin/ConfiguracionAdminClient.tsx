'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, Landmark, Loader2, MapPin, Smartphone, Sparkles } from 'lucide-react'
import { updateEstudioPrompt, updateIconVariant } from '@/app/actions/admin'
import BankAccountManager from '@/components/solidaridad/BankAccountManager'
import type { ChurchBankAccount } from '@/lib/solidarity/types'
import { createClient } from '@/lib/supabase/client'

type ChurchLocation = { latitud?: number; longitud?: number; radio_metros?: number } | null

export default function ConfiguracionAdminClient({
  activeIconVariant,
  initialEstudioPrompt,
  isAdministrator,
  initialPastoralTemplates,
  bankAccounts,
  initialChurchLocation,
}: {
  activeIconVariant: string
  initialEstudioPrompt: string
  isAdministrator: boolean
  initialPastoralTemplates: unknown
  bankAccounts: ChurchBankAccount[]
  initialChurchLocation: ChurchLocation
}) {
  void initialPastoralTemplates
  const supabase = useMemo(() => createClient() as any, [])
  const [selectedIcon, setSelectedIcon] = useState<'dorado' | 'blanco' | 'rojo'>((activeIconVariant as any) || 'dorado')
  const [iconSaving, setIconSaving] = useState(false)
  const [prompt, setPrompt] = useState(initialEstudioPrompt || '')
  const [promptSaving, setPromptSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [locationConfigured, setLocationConfigured] = useState(Boolean(initialChurchLocation?.latitud && initialChurchLocation?.longitud))
  const [locationSaving, setLocationSaving] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [churchRadius, setChurchRadius] = useState(Number(initialChurchLocation?.radio_metros || 150))

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

  const saveChurchLocation = async () => {
    setLocationSaving(true)
    setLocationError('')
    setSaved('')
    try {
      if (!('geolocation' in navigator)) throw new Error('Este dispositivo no permite obtener la ubicación.')
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 })
      })
      const { error } = await supabase.rpc('ubicacion_iglesia_guardar', {
        p_latitud: position.coords.latitude,
        p_longitud: position.coords.longitude,
        p_radio_metros: churchRadius,
      })
      if (error) throw error
      setLocationConfigured(true)
      setSaved('Ubicación principal de la iglesia guardada')
    } catch (error: any) {
      setLocationError(error?.message || 'No fue posible guardar la ubicación principal.')
    } finally {
      setLocationSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {saved && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{saved}</div>}
      <section className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-slate-600" /><h2 className="text-sm font-extrabold text-[#171923]">Ícono de la aplicación</h2>{iconSaving && <span className="ml-auto text-[11px] text-slate-500">Guardando…</span>}</div>
        <p className="mt-1 text-xs leading-5 text-slate-600">Variante utilizada en nuevas instalaciones de VIDA.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(['dorado','blanco','rojo'] as const).map((key) => (
            <button key={key} type="button" onClick={() => void changeIcon(key)} className={`relative rounded-2xl p-2 ${selectedIcon === key ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-50'}`}>
              <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-[16px] shadow-sm"><Image src={`/icons/variant-${key}/icon-192.png`} alt={`Ícono ${key}`} fill className="object-cover" /></div>
              <p className="mt-2 text-[11px] font-bold capitalize text-slate-700">{key}</p>
              {selectedIcon === key && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-white"><Check className="h-3 w-3" /></span>}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /><h2 className="text-sm font-extrabold text-[#171923]">Estudio Profundo IA</h2></div>
        <p className="mt-1 text-xs leading-5 text-slate-600">Instrucciones base que guían el módulo de Estudio Profundo.</p>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mt-4 min-h-64 w-full resize-y rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none ring-1 ring-slate-100 focus:ring-indigo-300" />
        <button type="button" onClick={() => void savePrompt()} disabled={promptSaving || !prompt.trim()} className="mt-3 min-h-12 w-full rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-50">{promptSaving ? 'Guardando…' : 'Guardar prompt'}</button>
      </section>

      {isAdministrator ? (
        <>
          <section className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-violet-600" /><h2 className="text-sm font-extrabold text-[#171923]">Ubicación principal de la iglesia</h2></div>
            <p className="mt-1 text-xs leading-5 text-slate-600">Dato general institucional que VIDA reutiliza para servicios y actividades realizadas en la iglesia.</p>
            <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-bold ${locationConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>{locationConfigured ? 'Ubicación principal configurada' : 'Aún no se ha configurado la ubicación principal'}</div>
            <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Radio de check-in (metros)
              <input type="number" min={25} max={1000} value={churchRadius} onChange={(e) => setChurchRadius(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" />
            </label>
            {locationError && <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{locationError}</div>}
            <button type="button" onClick={() => void saveChurchLocation()} disabled={locationSaving || churchRadius < 25 || churchRadius > 1000} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-50">{locationSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} {locationSaving ? 'Guardando…' : 'Usar mi ubicación actual'}</button>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">Guarda únicamente el punto fijo de la iglesia. No almacena recorridos ni ubicaciones personales de los miembros.</p>
          </section>

          <section>
            <div className="mb-2 px-1">
              <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-violet-600" /><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-violet-700">Configuración avanzada</p></div>
              <p className="mt-1 text-xs leading-5 text-slate-600">Datos internos reutilizables por cualquier módulo de la app.</p>
            </div>
            <BankAccountManager accounts={bankAccounts} />
          </section>
        </>
      ) : null}
    </div>
  )
}
