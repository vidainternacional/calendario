'use client'

import { useMemo, useState, useTransition } from 'react'
import { BriefcaseBusiness, Check, ChevronUp, Languages, MapPin, Pencil, PhoneCall, Sparkles, UserRound } from 'lucide-react'
import { guardarMiFichaVida } from '@/app/actions/member-profile'

const inputCls = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 sm:text-sm'
const areaCls = `${inputCls} min-h-24 resize-y`
const labelCls = 'text-xs font-semibold text-slate-600'
const legendCls = 'mb-3 flex items-center gap-2 text-sm font-bold text-[#171923]'
const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

function joinList(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : ''
}

export default function PerfilAmpliadoForm({ details }: { details: any | null }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  const completion = useMemo(() => {
    const values = [
      details?.estado_civil, details?.municipio, details?.departamento,
      details?.contacto_emergencia_nombre, details?.bautizado !== null && details?.bautizado !== undefined,
      details?.fecha_ingreso_vida, details?.profesion_oficio,
      Array.isArray(details?.disponibilidad_dias) && details.disponibilidad_dias.length > 0,
      Array.isArray(details?.habilidades_personales) && details.habilidades_personales.length > 0,
      Array.isArray(details?.idiomas) && details.idiomas.length > 0,
      details?.biografia,
    ]
    return Math.round((values.filter(Boolean).length / values.length) * 100)
  }, [details])

  const submit = (fd: FormData) => startTransition(async () => {
    setMessage('')
    const result = await guardarMiFichaVida(fd)
    if (!result.success) {
      setMessage(result.error || 'No fue posible guardar la ficha.')
      return
    }
    setMessage('✓ Ficha actualizada')
    setTimeout(() => window.location.reload(), 700)
  })

  return (
    <section className="overflow-hidden rounded-[22px] border border-indigo-100 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">Ficha de miembro</p>
            <h3 className="mt-1 text-lg font-bold text-[#171923]">Completa tu ficha VIDA</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Esta información ayuda a conocerte, servirte mejor y ubicar tus capacidades dentro de la comunidad.</p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm">{completion}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${completion}%` }} /></div>
        {!open && <div className="mt-4 flex flex-wrap gap-2">
          {details?.profesion_oficio && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">{details.profesion_oficio}</span>}
          {details?.municipio && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">{details.municipio}</span>}
          {Array.isArray(details?.habilidades_personales) && details.habilidades_personales.slice(0, 2).map((skill: string) => <span key={skill} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-indigo-600 shadow-sm">{skill}</span>)}
        </div>}
        <button type="button" onClick={() => setOpen((value) => !value)} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm">
          {open ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}{open ? 'Cerrar edición' : completion ? 'Actualizar mi ficha' : 'Completar mi ficha'}
        </button>
      </div>

      {open && <form action={submit} className="space-y-6 border-t border-slate-100 p-5 sm:p-6">
        <fieldset className="space-y-3">
          <legend className={legendCls}><UserRound className="h-4 w-4 text-indigo-500" />Datos personales</legend>
          <div>
            <p className={labelCls}>Sexo</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <label className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 ${details?.sexo === 'masculino' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                <input type="radio" name="sexo" value="masculino" defaultChecked={details?.sexo === 'masculino'} className="h-4 w-4 accent-indigo-600" />
                <span className="text-sm font-semibold">Masculino</span>
              </label>
              <label className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 ${details?.sexo === 'femenino' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                <input type="radio" name="sexo" value="femenino" defaultChecked={details?.sexo === 'femenino'} className="h-4 w-4 accent-indigo-600" />
                <span className="text-sm font-semibold">Femenino</span>
              </label>
            </div>
          </div>
          <div className="grid gap-3 min-[420px]:grid-cols-2">
            <label className={labelCls}>Estado civil<select name="estado_civil" defaultValue={details?.estado_civil || ''} className={`mt-1.5 ${inputCls}`}><option value="">No indicado</option><option value="soltero">Soltero/a</option><option value="casado">Casado/a</option><option value="divorciado">Divorciado/a</option><option value="viudo">Viudo/a</option><option value="prefiere_no_indicar">Prefiero no indicar</option></select></label>
            <label className={labelCls}>Municipio<input name="municipio" defaultValue={details?.municipio || ''} className={`mt-1.5 ${inputCls}`} /></label>
            <label className={labelCls}>Departamento<input name="departamento" defaultValue={details?.departamento || ''} className={`mt-1.5 ${inputCls}`} /></label>
          </div>
          <label className={`block ${labelCls}`}>Referencia de dirección<textarea name="direccion_referencia" defaultValue={details?.direccion_referencia || ''} className={`mt-1.5 ${areaCls}`} placeholder="Zona o referencia útil; evita escribir más detalle del necesario." /></label>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className={legendCls}><span className="grid h-7 w-7 place-items-center rounded-full bg-rose-50"><PhoneCall className="h-4 w-4 text-rose-600" /></span>Contacto de emergencia</legend>
          <label className={`block ${labelCls}`}>Nombre<input name="contacto_emergencia_nombre" defaultValue={details?.contacto_emergencia_nombre || ''} className={`mt-1.5 ${inputCls}`} /></label>
          <div className="grid gap-3 min-[420px]:grid-cols-2">
            <label className={labelCls}>Teléfono<input name="contacto_emergencia_telefono" type="tel" defaultValue={details?.contacto_emergencia_telefono || ''} className={`mt-1.5 ${inputCls}`} /></label>
            <label className={labelCls}>Relación<input name="contacto_emergencia_relacion" defaultValue={details?.contacto_emergencia_relacion || ''} className={`mt-1.5 ${inputCls}`} placeholder="Mamá, esposo, amigo…" /></label>
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className={legendCls}><Sparkles className="h-4 w-4 text-amber-500" />Vida espiritual</legend>
          <div className="grid gap-3 min-[420px]:grid-cols-2">
            <label className={labelCls}>¿Bautizado/a?<select name="bautizado" defaultValue={details?.bautizado === true ? 'si' : details?.bautizado === false ? 'no' : ''} className={`mt-1.5 ${inputCls}`}><option value="">No indicado</option><option value="si">Sí</option><option value="no">No</option></select></label>
            <label className={labelCls}>¿Deseas bautizarte?<select name="desea_bautizarse" defaultValue={details?.desea_bautizarse === true ? 'si' : details?.desea_bautizarse === false ? 'no' : ''} className={`mt-1.5 ${inputCls}`}><option value="">No indicado</option><option value="si">Sí</option><option value="no">No</option></select></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <span className={labelCls}>Fecha de bautismo</span>
              <input name="fecha_bautismo" type="date" defaultValue={details?.fecha_bautismo || ''} className={`mt-2 ${inputCls}`} />
            </label>
            <label className="block rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <span className={labelCls}>Desde cuándo estás en VIDA</span>
              <input name="fecha_ingreso_vida" type="date" defaultValue={details?.fecha_ingreso_vida || ''} className={`mt-2 ${inputCls}`} />
            </label>
          </div>
          <label className={`block ${labelCls}`}>Iglesia anterior <span className="font-normal text-slate-400">(opcional)</span><input name="iglesia_anterior" defaultValue={details?.iglesia_anterior || ''} className={`mt-1.5 ${inputCls}`} /></label>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className={legendCls}><BriefcaseBusiness className="h-4 w-4 text-emerald-500" />Profesión y experiencia</legend>
          <label className={`block ${labelCls}`}>Profesión u oficio<input name="profesion_oficio" defaultValue={details?.profesion_oficio || ''} className={`mt-1.5 ${inputCls}`} /></label>
          <label className={`block ${labelCls}`}>Empresa o emprendimiento <span className="font-normal text-slate-400">(opcional)</span><input name="empresa_emprendimiento" defaultValue={details?.empresa_emprendimiento || ''} className={`mt-1.5 ${inputCls}`} /></label>
          <label className={`block ${labelCls}`}>Descripción profesional<textarea name="descripcion_profesional" defaultValue={details?.descripcion_profesional || ''} className={`mt-1.5 ${areaCls}`} placeholder="Describe brevemente lo que haces o los servicios que puedes aportar." /></label>
          <label className="flex min-h-11 items-center gap-3 rounded-xl bg-emerald-50 px-3 text-xs font-semibold text-emerald-800"><input name="visibilidad_profesional" type="checkbox" defaultChecked={!!details?.visibilidad_profesional} className="h-5 w-5 rounded border-emerald-200" />Permitir usar estos datos más adelante en el Directorio VIDA.</label>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className={legendCls}><MapPin className="h-4 w-4 text-sky-500" />Disponibilidad para servir</legend>
          <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">{days.map((day) => <label key={day} className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-600"><input type="checkbox" name="disponibilidad_dias" value={day} defaultChecked={details?.disponibilidad_dias?.includes(day)} className="h-4 w-4" />{day}</label>)}</div>
          <label className={`block ${labelCls}`}>Horarios disponibles<textarea name="disponibilidad_horarios" defaultValue={details?.disponibilidad_horarios || ''} className={`mt-1.5 ${areaCls}`} placeholder="Ej: domingos por la mañana, miércoles después de las 6 pm…" /></label>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className={legendCls}><Languages className="h-4 w-4 text-violet-500" />Habilidades y formación</legend>
          <label className={`block ${labelCls}`}>Habilidades personales<input name="habilidades_personales" defaultValue={joinList(details?.habilidades_personales)} className={`mt-1.5 ${inputCls}`} placeholder="Guitarra, fotografía, cocina, electricidad…" /></label>
          <label className={`block ${labelCls}`}>Idiomas<input name="idiomas" defaultValue={joinList(details?.idiomas)} className={`mt-1.5 ${inputCls}`} placeholder="Español, inglés…" /></label>
          <label className={`block ${labelCls}`}>Formación ministerial<input name="formacion_ministerial" defaultValue={joinList(details?.formacion_ministerial)} className={`mt-1.5 ${inputCls}`} placeholder="Discipulado, Escuela Bíblica, talleres…" /></label>
          <label className={`block ${labelCls}`}>Sobre mí<textarea name="biografia" defaultValue={details?.biografia || ''} className={`mt-1.5 ${areaCls}`} placeholder="Algo breve que ayude a la comunidad a conocerte mejor." /></label>
        </fieldset>

        <p className="rounded-xl bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">Los datos sensibles de esta ficha no se muestran públicamente. El acceso administrativo/pastoral está protegido por permisos.</p>
        {message && <p role="status" className={`text-xs font-semibold ${message.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>}
        <button type="submit" disabled={pending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />{pending ? 'Guardando…' : 'Guardar ficha VIDA'}</button>
      </form>}
    </section>
  )
}
