'use client'

import { useMemo, useState, useTransition } from 'react'
import { Copy, Edit3, Eye, Loader2, Printer, Save, Share2 } from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { mostrarToast } from '@/lib/ui/toast'

type Punto = { titulo: string; contenido: string }
type Bosquejo = { id: string; titulo: string; tema: string; pasaje_base: string; proposito: string; introduccion: string; puntos: Punto[]; conclusion: string }
type Versiculo = { id: string; referencia: string; texto: string; traduccion: string; nota: string }
type Coleccion = { id: string; nombre: string; descripcion: string; versiculos: Versiculo[] }
type Recurso = { id: string; titulo: string; descripcion: string; categoria: string; tipo: 'archivo' | 'enlace'; acceso_url: string | null }
type Opcion = { id: string; titulo: string }
type Paquete = { id: string; titulo: string; descripcion_publica: string; instrucciones: string; bosquejo_id: string | null; coleccion_id: string | null; recurso_ids: string[]; estado: 'borrador' | 'listo' | 'compartido' }

export default function PaqueteDetalleClient({ paquete, bosquejo, coleccion, recursos, bosquejos, colecciones, biblioteca }: {
  paquete: Paquete
  bosquejo: Bosquejo | null
  coleccion: Coleccion | null
  recursos: Recurso[]
  bosquejos: Opcion[]
  colecciones: Opcion[]
  biblioteca: Array<Opcion & { categoria: string; tipo: 'archivo' | 'enlace' }>
}) {
  const [modo, setModo] = useState<'editar' | 'vista'>('editar')
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [descripcion, setDescripcion] = useState(paquete.descripcion_publica)
  const [instrucciones, setInstrucciones] = useState(paquete.instrucciones)
  const [estado, setEstado] = useState(paquete.estado)
  const [isPending, startTransition] = useTransition()

  const textoCompartible = useMemo(() => {
    const lineas = [titulo, descripcion, bosquejo?.pasaje_base ? `Pasaje base: ${bosquejo.pasaje_base}` : '', bosquejo?.proposito ? `Idea central: ${bosquejo.proposito}` : '']
    if (coleccion?.versiculos?.length) lineas.push('VERSÍCULOS', ...coleccion.versiculos.map((v) => `${v.referencia} (${v.traduccion})\n${v.texto}${v.nota ? `\nNota: ${v.nota}` : ''}`))
    if (bosquejo?.introduccion) lineas.push('INTRODUCCIÓN', bosquejo.introduccion)
    if (bosquejo?.puntos?.length) lineas.push(...bosquejo.puntos.map((p, i) => `${i + 1}. ${p.titulo || 'Punto'}\n${p.contenido}`))
    if (bosquejo?.conclusion) lineas.push('CONCLUSIÓN Y LLAMADO', bosquejo.conclusion)
    if (instrucciones) lineas.push('APLICACIÓN PARA LA SEMANA', instrucciones)
    if (recursos.length) lineas.push('RECURSOS', ...recursos.map((r) => `${r.titulo}${r.acceso_url ? `\n${r.acceso_url}` : ''}`))
    lineas.push('Vida Internacional')
    return lineas.filter(Boolean).join('\n\n')
  }, [titulo, descripcion, instrucciones, bosquejo, coleccion, recursos])

  const guardar = (formData: FormData) => {
    startTransition(async () => {
      const resultado = await editarPaquetePastoral(paquete.id, formData)
      mostrarToast(resultado.success ? 'Paquete guardado' : resultado.error)
    })
  }

  const copiar = async () => {
    try { await navigator.clipboard.writeText(textoCompartible); mostrarToast('Paquete copiado') }
    catch { mostrarToast('No se pudo copiar') }
  }

  const compartir = async () => {
    try {
      if (navigator.share) await navigator.share({ title: titulo, text: textoCompartible })
      else await copiar()
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') mostrarToast('No se pudo compartir')
    }
  }

  return (
    <>
      <section className="print:hidden mb-5 rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-1">
          <button type="button" onClick={() => setModo('editar')} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold ${modo === 'editar' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Edit3 className="h-4 w-4" /> Editar</button>
          <button type="button" onClick={() => setModo('vista')} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold ${modo === 'vista' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Eye className="h-4 w-4" /> Vista final</button>
        </div>
        {modo === 'vista' && <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-100 pt-2"><button type="button" onClick={() => window.print()} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600"><Printer className="h-4 w-4" /> PDF</button><button type="button" onClick={copiar} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600"><Copy className="h-4 w-4" /> Copiar</button><button type="button" onClick={compartir} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600"><Share2 className="h-4 w-4" /> Compartir</button></div>}
      </section>

      {modo === 'editar' ? (
        <form action={guardar} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título</span><input name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={140} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Estado</span><select name="estado" value={estado} onChange={(e) => setEstado(e.target.value as Paquete['estado'])} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="borrador">Borrador</option><option value="listo">Listo</option><option value="compartido">Compartido</option></select></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Bosquejo</span><select name="bosquejo_id" defaultValue={paquete.bosquejo_id ?? ''} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Sin bosquejo</option>{bosquejos.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
                <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Colección de versículos</span><select name="coleccion_id" defaultValue={paquete.coleccion_id ?? ''} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Sin colección</option>{colecciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
                <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Presentación para la iglesia</span><textarea name="descripcion_publica" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={2000} rows={5} className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>
                <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Aplicación, preguntas o instrucciones</span><textarea name="instrucciones" value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} maxLength={3000} rows={6} className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>
              </div>
            </section>

            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-bold text-slate-900">Recursos incluidos</h2><p className="mt-1 text-xs text-slate-500">Selecciona los materiales que acompañarán la guía.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{biblioteca.map((recurso) => <label key={recurso.id} className="flex min-h-14 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><input type="checkbox" name="recurso_ids" value={recurso.id} defaultChecked={paquete.recurso_ids.includes(recurso.id)} className="mt-0.5 h-4 w-4" /><span><span className="block font-semibold text-slate-800">{recurso.titulo}</span><span className="text-[11px] text-slate-500">{recurso.tipo === 'archivo' ? 'Archivo' : 'Enlace'} · {recurso.categoria}</span></span></label>)}</div></section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start"><section className="rounded-[22px] border border-indigo-100 bg-indigo-50/60 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Contenido enlazado</p><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-xs text-slate-500">Bosquejo</dt><dd className="font-semibold text-slate-900">{bosquejo?.titulo ?? 'No seleccionado'}</dd></div><div><dt className="text-xs text-slate-500">Colección</dt><dd className="font-semibold text-slate-900">{coleccion?.nombre ?? 'No seleccionada'}</dd></div><div><dt className="text-xs text-slate-500">Recursos</dt><dd className="font-semibold text-slate-900">{recursos.length}</dd></div></dl></section><button type="submit" disabled={isPending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg disabled:opacity-60">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isPending ? 'Guardando…' : 'Guardar paquete'}</button></aside>
        </form>
      ) : (
        <article className="paquete-print mx-auto max-w-4xl rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Vida Internacional</p><h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">{titulo}</h1>{descripcion && <p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-slate-600">{descripcion}</p>}
          {bosquejo && <section className="mt-8 rounded-2xl bg-indigo-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Mensaje principal</p><h2 className="mt-2 text-2xl font-bold text-slate-950">{bosquejo.titulo}</h2>{bosquejo.pasaje_base && <p className="mt-2 font-semibold text-amber-700">{bosquejo.pasaje_base}</p>}{bosquejo.proposito && <p className="mt-3 text-base leading-7 text-slate-700">{bosquejo.proposito}</p>}</section>}
          {coleccion?.versiculos?.length ? <section className="mt-9"><h2 className="text-xl font-bold text-slate-950">Versículos para estudiar</h2><div className="mt-4 space-y-4">{coleccion.versiculos.map((v) => <article key={v.id} className="break-inside-avoid rounded-2xl border border-slate-200 p-4"><p className="font-bold text-indigo-700">{v.referencia} <span className="text-xs font-normal text-slate-400">{v.traduccion}</span></p><p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-700">{v.texto}</p>{v.nota && <p className="mt-3 border-l-2 border-amber-300 pl-3 text-sm italic text-slate-500">{v.nota}</p>}</article>)}</div></section> : null}
          {bosquejo?.puntos?.length ? <section className="mt-9"><h2 className="text-xl font-bold text-slate-950">Desarrollo</h2><div className="mt-5 space-y-7">{bosquejo.puntos.map((p, i) => <article key={i} className="break-inside-avoid"><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Punto {i + 1}</p><h3 className="mt-1 text-xl font-bold text-slate-900">{p.titulo || `Punto ${i + 1}`}</h3>{p.contenido && <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-700">{p.contenido}</p>}</article>)}</div></section> : null}
          {instrucciones && <section className="mt-9 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-lg font-bold text-amber-900">Aplicación para la semana</h2><p className="mt-3 whitespace-pre-wrap text-base leading-7 text-amber-950/80">{instrucciones}</p></section>}
          {recursos.length > 0 && <section className="mt-9"><h2 className="text-xl font-bold text-slate-950">Recursos de apoyo</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{recursos.map((r) => <article key={r.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-bold text-slate-900">{r.titulo}</p>{r.descripcion && <p className="mt-1 text-sm leading-6 text-slate-500">{r.descripcion}</p>}{r.acceso_url && <a href={r.acceso_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-indigo-700">Abrir recurso</a>}</article>)}</div></section>}
        </article>
      )}

      <style jsx global>{`@media print { body { background: white !important; } .app-bottom-nav, header, .print\\:hidden { display: none !important; } main { max-width: none !important; padding: 0 !important; background: white !important; } .paquete-print { border: 0 !important; box-shadow: none !important; border-radius: 0 !important; } @page { margin: 14mm; } }`}</style>
    </>
  )
}
