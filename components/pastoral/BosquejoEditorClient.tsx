'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { editarBosquejoPastoral } from '@/app/actions/pastoral-bosquejos'
import { mostrarToast } from '@/lib/ui/toast'

type Punto = { titulo: string; contenido: string }

type Bosquejo = {
  id: string
  titulo: string
  tema: string
  pasaje_base: string
  proposito: string
  introduccion: string
  puntos: Punto[]
  conclusion: string
  estado: 'borrador' | 'listo' | 'predicado'
  fecha_predicacion: string | null
}

export default function BosquejoEditorClient({ bosquejo }: { bosquejo: Bosquejo }) {
  const [puntos, setPuntos] = useState<Punto[]>(bosquejo.puntos?.length ? bosquejo.puntos : [{ titulo: '', contenido: '' }])
  const [isPending, startTransition] = useTransition()

  const guardar = (formData: FormData) => {
    startTransition(async () => {
      const resultado = await editarBosquejoPastoral(bosquejo.id, formData)
      mostrarToast(resultado.success ? 'Bosquejo guardado' : resultado.error)
    })
  }

  const actualizarPunto = (index: number, campo: keyof Punto, valor: string) => {
    setPuntos((actuales) => actuales.map((punto, posicion) => posicion === index ? { ...punto, [campo]: valor } : punto))
  }

  return (
    <form action={guardar} className="space-y-5">
      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título</span><input name="titulo" defaultValue={bosquejo.titulo} required maxLength={120} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
          <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Tema</span><input name="tema" defaultValue={bosquejo.tema} maxLength={100} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
          <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Pasaje base</span><input name="pasaje_base" defaultValue={bosquejo.pasaje_base} maxLength={120} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
          <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Estado</span><select name="estado" defaultValue={bosquejo.estado} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="borrador">Borrador</option><option value="listo">Listo</option><option value="predicado">Predicado</option></select></label>
          <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Fecha de predicación</span><input name="fecha_predicacion" type="date" defaultValue={bosquejo.fecha_predicacion ?? ''} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Propósito del mensaje</span><textarea name="proposito" defaultValue={bosquejo.proposito} maxLength={600} rows={4} placeholder="¿Qué debe comprender, sentir o aplicar la congregación?" className="w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" /></label>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Introducción</h2>
        <p className="mt-1 text-xs text-slate-500">Contexto, pregunta inicial, historia o conexión con la congregación.</p>
        <textarea name="introduccion" defaultValue={bosquejo.introduccion} maxLength={4000} rows={7} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" />
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-bold text-slate-900">Puntos principales</h2><p className="mt-1 text-xs text-slate-500">Ordena el desarrollo de la prédica en hasta 12 puntos.</p></div>
          <button type="button" onClick={() => setPuntos((actuales) => [...actuales, { titulo: '', contenido: '' }].slice(0, 12))} disabled={puntos.length >= 12} className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-50 px-3 text-xs font-bold text-indigo-700 disabled:opacity-40"><Plus className="h-4 w-4" /> Punto</button>
        </div>

        <div className="mt-4 space-y-4">
          {puntos.map((punto, index) => (
            <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">Punto {index + 1}</span>
                {puntos.length > 1 && <button type="button" onClick={() => setPuntos((actuales) => actuales.filter((_, posicion) => posicion !== index))} className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500" aria-label={`Eliminar punto ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}
              </div>
              <input name="punto_titulo" value={punto.titulo} onChange={(event) => actualizarPunto(index, 'titulo', event.target.value)} maxLength={160} placeholder="Título del punto" className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900" />
              <textarea name="punto_contenido" value={punto.contenido} onChange={(event) => actualizarPunto(index, 'contenido', event.target.value)} maxLength={5000} rows={6} placeholder="Explicación, ilustración, aplicación y referencias" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-base leading-7 text-slate-900" />
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Conclusión y llamado</h2>
        <textarea name="conclusion" defaultValue={bosquejo.conclusion} maxLength={4000} rows={7} placeholder="Resume la idea central y define la aplicación o llamado final." className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" />
      </section>

      <button type="submit" disabled={isPending} className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isPending ? 'Guardando…' : 'Guardar bosquejo'}
      </button>
    </form>
  )
}
