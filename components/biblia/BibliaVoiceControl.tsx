'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Volume2, X } from 'lucide-react'

const VOICE_KEY = 'vida-biblia-voz'

type VozDisponible = {
  name: string
  lang: string
  voiceURI: string
  default: boolean
}

function ordenarVoces(voces: SpeechSynthesisVoice[]) {
  return [...voces]
    .filter((voz) => voz.lang.toLowerCase().startsWith('es'))
    .sort((a, b) => {
      if (a.default !== b.default) return a.default ? -1 : 1
      return a.name.localeCompare(b.name, 'es')
    })
}

export default function BibliaVoiceControl() {
  const [abierto, setAbierto] = useState(false)
  const [voces, setVoces] = useState<VozDisponible[]>([])
  const [vozSeleccionada, setVozSeleccionada] = useState('')

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return

    const cargar = () => {
      const disponibles = ordenarVoces(synth.getVoices()).map((voz) => ({
        name: voz.name,
        lang: voz.lang,
        voiceURI: voz.voiceURI,
        default: voz.default,
      }))
      setVoces(disponibles)

      const guardada = localStorage.getItem(VOICE_KEY) ?? ''
      if (guardada && disponibles.some((voz) => voz.voiceURI === guardada)) {
        setVozSeleccionada(guardada)
      } else {
        const primera = disponibles[0]?.voiceURI ?? ''
        setVozSeleccionada(primera)
        if (primera) localStorage.setItem(VOICE_KEY, primera)
      }
    }

    cargar()
    synth.addEventListener?.('voiceschanged', cargar)
    synth.onvoiceschanged = cargar

    const speakOriginal = synth.speak.bind(synth)
    synth.speak = (utterance: SpeechSynthesisUtterance) => {
      const voiceURI = localStorage.getItem(VOICE_KEY)
      const voz = synth.getVoices().find((item) => item.voiceURI === voiceURI)
      if (voz) {
        utterance.voice = voz
        utterance.lang = voz.lang
      }
      speakOriginal(utterance)
    }

    return () => {
      synth.removeEventListener?.('voiceschanged', cargar)
      synth.onvoiceschanged = null
      synth.speak = speakOriginal
    }
  }, [])

  const vozActual = useMemo(
    () => voces.find((voz) => voz.voiceURI === vozSeleccionada),
    [voces, vozSeleccionada],
  )

  const seleccionar = (voiceURI: string) => {
    setVozSeleccionada(voiceURI)
    localStorage.setItem(VOICE_KEY, voiceURI)
    window.speechSynthesis?.cancel()
    setAbierto(false)
  }

  if (!('speechSynthesis' in globalThis)) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-4 z-[75] flex min-h-11 items-center gap-2 rounded-full border border-indigo-200 bg-white/95 px-4 text-xs font-bold text-indigo-700 shadow-lg backdrop-blur-md"
        aria-label="Elegir voz de lectura"
      >
        <Volume2 className="h-4 w-4" />
        <span className="max-w-28 truncate">{vozActual?.name || 'Voz'}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {abierto && (
        <div
          className="modal-overlay-safe bg-black/55"
          onClick={(event) => { if (event.target === event.currentTarget) setAbierto(false) }}
        >
          <section className="modal-panel-safe flex max-h-[70dvh] w-full max-w-md flex-col rounded-3xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="voice-title">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 id="voice-title" className="font-bold text-slate-900">Voz de lectura</h2>
                <p className="mt-0.5 text-xs text-slate-500">Voces disponibles en este dispositivo.</p>
              </div>
              <button type="button" onClick={() => setAbierto(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-label="Cerrar selector de voz">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="modal-body-safe space-y-2 p-4">
              {voces.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center">
                  <Volume2 className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">No hay voces en español disponibles</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Instala o activa una voz en español desde los ajustes de accesibilidad del dispositivo.</p>
                </div>
              ) : voces.map((voz) => {
                const activa = voz.voiceURI === vozSeleccionada
                return (
                  <button
                    key={voz.voiceURI}
                    type="button"
                    onClick={() => seleccionar(voz.voiceURI)}
                    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left ${activa ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{voz.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{voz.lang}{voz.default ? ' · Predeterminada' : ''}</p>
                    </div>
                    {activa && <Check className="h-5 w-5 shrink-0 text-indigo-600" />}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
