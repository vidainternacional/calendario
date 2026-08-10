'use client'

import { useMemo, useState } from 'react'
import { Check, Palette, SlidersHorizontal } from 'lucide-react'

type Props = {
  action: (formData: FormData) => void | Promise<void>
  initialColors: string[]
  initialObservaciones?: string | null
  initialReferenciaUrl?: string | null
  puedeProgramar: boolean
}

const PRESETS = [
  { nombre: 'Neutros cálidos', estilo: 'Editorial', colores: ['#F7F2EA', '#D8C5B2', '#A88F7A', '#6D5B4D', '#2F2925'] },
  { nombre: 'Blanco y negro', estilo: 'Clásica', colores: ['#FFFFFF', '#E5E7EB', '#9CA3AF', '#374151', '#111827'] },
  { nombre: 'Tierra', estilo: 'Natural', colores: ['#F4E9DC', '#D4A373', '#A26745', '#6B4F3A', '#3F352F'] },
  { nombre: 'Sage y crema', estilo: 'Suave', colores: ['#FAF7EF', '#DDE5D1', '#A7B892', '#71816D', '#38443A'] },
  { nombre: 'Azul noche', estilo: 'Elegante', colores: ['#F8FAFC', '#CBD5E1', '#64748B', '#1E3A5F', '#0F172A'] },
  { nombre: 'Pastel suave', estilo: 'Luminoso', colores: ['#FFF7F3', '#F8D7DA', '#E9D5FF', '#BFDBFE', '#D1FAE5'] },
  { nombre: 'Borgoña y nude', estilo: 'Formal', colores: ['#F7EDE8', '#E6C8BD', '#B97878', '#7F1D3A', '#3B1725'] },
  { nombre: 'Otoño', estilo: 'Cálido', colores: ['#F5E6CC', '#D9A05B', '#B85C38', '#7A3E2B', '#3D2B24'] },
]

const FALLBACK = ['#111827', '#F8FAFC', '#7C3AED', '#D4A373', '#94A3B8']

function normalizarHex(value: string, fallback: string) {
  const clean = value.trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(clean) ? clean : fallback
}

export default function PaletaAlabanzaEditor({ action, initialColors, initialObservaciones, initialReferenciaUrl, puedeProgramar }: Props) {
  const inicial = useMemo(() => Array.from({ length: 5 }, (_, i) => normalizarHex(initialColors[i] || FALLBACK[i], FALLBACK[i])), [initialColors])
  const [colores, setColores] = useState<string[]>(inicial)
  const [preset, setPreset] = useState<string | null>(null)

  function cambiarColor(index: number, value: string) {
    setPreset(null)
    setColores((prev) => prev.map((color, i) => i === index ? normalizarHex(value, color) : color))
  }

  function aplicarPreset(nombre: string, nuevos: string[]) {
    setPreset(nombre)
    setColores(nuevos)
  }

  return <form action={action} className="mt-5 grid gap-4 border-t border-slate-100 pt-4">
    <div>
      <div className="flex items-center gap-2"><Palette className="h-4 w-4 text-pink-500"/><p className="text-xs font-extrabold text-slate-700">Plantillas rápidas</p></div>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">Elige una base y después ajusta cualquier tono a la medida.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {PRESETS.map((item) => <button key={item.nombre} type="button" onClick={() => aplicarPreset(item.nombre, item.colores)} className={`rounded-2xl p-3 text-left ring-1 transition active:scale-[0.99] ${preset === item.nombre ? 'bg-pink-50 ring-pink-200' : 'bg-slate-50 ring-slate-100'}`}>
          <div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-extrabold text-slate-700">{item.nombre}</span>{preset === item.nombre && <Check className="h-3.5 w-3.5 shrink-0 text-pink-500"/>}</div>
          <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">{item.estilo}</span>
          <span className="mt-2 flex overflow-hidden rounded-lg ring-1 ring-black/5">{item.colores.map((color) => <span key={color} className="h-6 flex-1" style={{ backgroundColor: color }}/>)}</span>
        </button>)}
      </div>
    </div>

    <div className="rounded-[20px] bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-indigo-500"/><p className="text-xs font-extrabold text-slate-700">Personalizar colores</p></div>
      <p className="mt-1 text-[11px] text-slate-500">Toca el cuadro de color para abrir el selector visual o escribe el código HEX exacto.</p>
      <div className="mt-3 space-y-2">
        {colores.map((color, index) => <div key={index} className="flex items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-slate-100">
          <input type="color" value={color} onChange={(e) => cambiarColor(index, e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0" aria-label={`Elegir color ${index + 1}`}/>
          <input name={`color_${index + 1}`} value={color} onChange={(e) => cambiarColor(index, e.target.value)} onBlur={(e) => cambiarColor(index, e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg bg-slate-50 px-3 font-mono text-xs font-bold uppercase text-slate-700 outline-none ring-1 ring-slate-100" maxLength={7} aria-label={`HEX color ${index + 1}`}/>
          <span className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-black/5" style={{ backgroundColor: color }}/>
        </div>)}
      </div>
      <div className="mt-3 flex overflow-hidden rounded-xl ring-1 ring-black/5">{colores.map((color, index) => <span key={`${color}-${index}`} className="h-12 flex-1" style={{ backgroundColor: color }}/>)}</div>
    </div>

    <textarea name="observaciones" defaultValue={initialObservaciones || ''} placeholder="Ej.: tonos neutros, evitar estampados fuertes, pantalón oscuro…" className="min-h-24 rounded-xl bg-slate-50 p-3 text-xs outline-none ring-1 ring-slate-100"/>
    <input name="referencia_url" defaultValue={initialReferenciaUrl || ''} placeholder="Referencia visual o moodboard (opcional)" className="h-11 rounded-xl bg-slate-50 px-3 text-xs outline-none ring-1 ring-slate-100"/>
    <button className="h-11 rounded-xl bg-pink-600 text-xs font-bold text-white">Guardar paleta del servicio</button>
    {!puedeProgramar && <p className="text-center text-[10px] leading-4 text-slate-400">Puedes editar la paleta, pero no el equipo ni el repertorio.</p>}
  </form>
}
