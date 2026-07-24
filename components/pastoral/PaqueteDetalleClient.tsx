'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Copy, Edit3, Expand, FileText, Image as ImageIcon, Loader2, MonitorPlay, Plus, Printer, Save, Share2, Trash2, Users } from 'lucide-react'
import { editarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { mostrarToast } from '@/lib/ui/toast'

type Punto = { titulo: string; contenido: string }
type Bosquejo = { id: string; titulo: string; tema: string; pasaje_base: string; proposito: string; introduccion: string; puntos: Punto[]; conclusion: string }
type Versiculo = { id: string; referencia: string; texto: string; traduccion: string; nota: string }
type Coleccion = { id: string; nombre: string; descripcion: string; versiculos: Versiculo[] }
type Recurso = { id: string; titulo: string; descripcion: string; categoria: string; tipo: 'archivo' | 'enlace'; acceso_url: string | null; mime_type?: string | null; nombre_archivo?: string | null }
type Opcion = { id: string; titulo: string }
type Diapositiva = { titulo: string; contenido: string; recurso_id: string | null }
type Paquete = { id: string; titulo: string; descripcion_publica: string; instrucciones: string; bosquejo_id: string | null; coleccion_id: string | null; recurso_ids: string[]; estado: 'borrador' | 'listo' | 'compartido'; presentacion_diapositivas: Diapositiva[]; presentacion_pdf_recurso_id: string | null }
type Modo = 'editar' | 'guia' | 'presentacion'

export default function PaqueteDetalleClient({ paquete, bosquejo, coleccion, recursos, pdfPresentacion, bosquejos, colecciones, biblioteca }: {
  paquete: Paquete; bosquejo: Bosquejo | null; coleccion: Coleccion | null; recursos: Recurso[]; pdfPresentacion: Recurso | null
  bosquejos: Opcion[]; colecciones: Opcion[]; biblioteca: Recurso[]
}) {
  const [modo, setModo] = useState<Modo>('editar')
  const [titulo, setTitulo] = useState(paquete.titulo)
  const [descripcion, setDescripcion] = useState(paquete.descripcion_publica)
  const [instrucciones, setInstrucciones] = useState(paquete.instrucciones)
  const [estado, setEstado] = useState(paquete.estado)
  const [indice, setIndice] = useState(0)
  const [isPending, startTransition] = useTransition()
  const iniciales = paquete.presentacion_diapositivas?.length ? paquete.presentacion_diapositivas : [
    { titulo: paquete.titulo, contenido: bosquejo?.pasaje_base ?? '', recurso_id: null },
    ...(bosquejo?.puntos ?? []).map((p) => ({ titulo: p.titulo || 'Punto principal', contenido: p.contenido, recurso_id: null })),
    ...(bosquejo?.conclusion ? [{ titulo: 'Conclusión y llamado', contenido: bosquejo.conclusion, recurso_id: null }] : []),
  ]
  const [diapositivas, setDiapositivas] = useState<Diapositiva[]>(iniciales)

  const imagenes = biblioteca.filter((item) => item.tipo === 'archivo' && item.mime_type?.startsWith('image/'))
  const pdfs = biblioteca.filter((item) => item.tipo === 'archivo' && (item.mime_type === 'application/pdf' || item.nombre_archivo?.toLowerCase().endsWith('.pdf')))
  const recursoPorId = (id: string | null) => biblioteca.find((item) => item.id === id) ?? null
  const diapositiva = diapositivas[indice] ?? { titulo, contenido: '', recurso_id: null }
  const imagenActual = recursoPorId(diapositiva.recurso_id)

  const textoCompartible = useMemo(() => {
    const lineas = [titulo, descripcion, bosquejo?.pasaje_base ? `Pasaje base: ${bosquejo.pasaje_base}` : '', bosquejo?.proposito ? `Idea central: ${bosquejo.proposito}` : '']
    if (coleccion?.versiculos?.length) lineas.push('VERSÍCULOS', ...coleccion.versiculos.map((v) => `${v.referencia} (${v.traduccion})\n${v.texto}`))
    if (bosquejo?.puntos?.length) lineas.push(...bosquejo.puntos.map((p, i) => `${i + 1}. ${p.titulo || 'Punto'}\n${p.contenido}`))
    if (instrucciones) lineas.push('APLICACIÓN PARA LA SEMANA', instrucciones)
    if (recursos.length) lineas.push('RECURSOS', ...recursos.map((r) => `${r.titulo}${r.acceso_url ? `\n${r.acceso_url}` : ''}`))
    return lineas.filter(Boolean).join('\n\n')
  }, [titulo, descripcion, instrucciones, bosquejo, coleccion, recursos])

  const guardar = (formData: FormData) => startTransition(async () => {
    const resultado = await editarPaquetePastoral(paquete.id, formData)
    mostrarToast(resultado.success ? 'Paquete guardado' : resultado.error)
  })

  const copiar = async () => { try { await navigator.clipboard.writeText(textoCompartible); mostrarToast('Guía copiada') } catch { mostrarToast('No se pudo copiar') } }
  const compartir = async () => { try { if (navigator.share) await navigator.share({ title: titulo, text: textoCompartible }); else await copiar() } catch (error) { if ((error as Error)?.name !== 'AbortError') mostrarToast('No se pudo compartir') } }
  const pantallaCompleta = async () => { try { await document.documentElement.requestFullscreen() } catch { mostrarToast('No se pudo abrir pantalla completa') } }
  const actualizarDiapositiva = (index: number, campo: keyof Diapositiva, valor: string | null) => setDiapositivas((actuales) => actuales.map((item, i) => i === index ? { ...item, [campo]: valor } : item))

  const modos = [
    { id: 'editar' as const, label: 'Preparar', icon: Edit3 },
    { id: 'guia' as const, label: 'Guía iglesia', icon: Users },
    { id: 'presentacion' as const, label: 'Presentar', icon: MonitorPlay },
  ]

  return <>
    <section className="print:hidden mb-5 rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-3 gap-1">{modos.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setModo(id)} className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold sm:text-sm ${modo === id ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
      {modo === 'guia' && <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-100 pt-2"><button onClick={() => window.print()} className="min-h-10 text-xs font-semibold text-slate-600"><Printer className="mx-auto mb-1 h-4 w-4" />PDF</button><button onClick={copiar} className="min-h-10 text-xs font-semibold text-slate-600"><Copy className="mx-auto mb-1 h-4 w-4" />Copiar</button><button onClick={compartir} className="min-h-10 text-xs font-semibold text-slate-600"><Share2 className="mx-auto mb-1 h-4 w-4" />Compartir</button></div>}
      {modo === 'presentacion' && <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2"><button onClick={pantallaCompleta} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-600"><Expand className="h-4 w-4" />Pantalla completa</button>{pdfPresentacion?.acceso_url && <a href={pdfPresentacion.acceso_url} target="_blank" rel="noreferrer" className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-600"><FileText className="h-4 w-4" />Abrir PDF</a>}</div>}
    </section>

    {modo === 'editar' ? <form action={guardar} className="grid gap-5 text-slate-900 lg:grid-cols-[minmax(0,1fr)_340px] [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_select]:text-slate-900 [&_textarea]:text-slate-900 [&_textarea]:placeholder:text-slate-400">
      <div className="space-y-5">
        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título</span><input name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={140} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900" /></label>
          <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Estado</span><select name="estado" value={estado} onChange={(e) => setEstado(e.target.value as Paquete['estado'])} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="borrador">Borrador</option><option value="listo">Listo</option><option value="compartido">Compartido</option></select></label>
          <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Bosquejo</span><select name="bosquejo_id" defaultValue={paquete.bosquejo_id ?? ''} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Sin bosquejo</option>{bosquejos.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Colección de versículos</span><select name="coleccion_id" defaultValue={paquete.coleccion_id ?? ''} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Sin colección</option>{colecciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Introducción para la congregación</span><textarea name="descripcion_publica" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} maxLength={2000} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base leading-7 text-slate-900" /></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Aplicación y preguntas</span><textarea name="instrucciones" value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} rows={5} maxLength={3000} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base leading-7 text-slate-900" /></label>
        </div></section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Presentación para pantalla</h2><p className="mt-1 text-xs text-slate-500">Una diapositiva por vez, con texto breve e imagen opcional.</p></div><button type="button" onClick={() => setDiapositivas((d) => [...d, { titulo: '', contenido: '', recurso_id: null }].slice(0, 30))} className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-50 px-3 text-xs font-bold text-indigo-700"><Plus className="h-4 w-4" />Diapositiva</button></div>
          <div className="mt-4 space-y-4">{diapositivas.map((item, index) => <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase text-indigo-600">Diapositiva {index + 1}</span>{diapositivas.length > 1 && <button type="button" onClick={() => setDiapositivas((d) => d.filter((_, i) => i !== index))} className="h-9 w-9 rounded-full bg-rose-50 text-rose-500"><Trash2 className="mx-auto h-4 w-4" /></button>}</div><input name="diapositiva_titulo" value={item.titulo} onChange={(e) => actualizarDiapositiva(index, 'titulo', e.target.value)} placeholder="Título" className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900 placeholder:text-slate-400" /><textarea name="diapositiva_contenido" value={item.contenido} onChange={(e) => actualizarDiapositiva(index, 'contenido', e.target.value)} rows={4} placeholder="Texto breve para proyectar" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-base leading-7 text-slate-900 placeholder:text-slate-400" /><select name="diapositiva_recurso_id" value={item.recurso_id ?? ''} onChange={(e) => actualizarDiapositiva(index, 'recurso_id', e.target.value || null)} className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Sin imagen</option>{imagenes.map((imagen) => <option key={imagen.id} value={imagen.id}>{imagen.titulo}</option>)}</select></article>)}</div>
          <label className="mt-5 block"><span className="mb-1.5 block text-xs font-bold text-slate-700">PDF de presentación opcional</span><select name="presentacion_pdf_recurso_id" defaultValue={paquete.presentacion_pdf_recurso_id ?? ''} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Sin PDF</option>{pdfs.map((pdf) => <option key={pdf.id} value={pdf.id}>{pdf.titulo}</option>)}</select><span className="mt-1.5 block text-xs text-slate-500">Suba primero el PDF a Biblioteca Pastoral y selecciónelo aquí.</span></label>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-bold text-slate-900">Recursos para la guía</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{biblioteca.map((recurso) => <label key={recurso.id} className="flex min-h-14 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><input type="checkbox" name="recurso_ids" value={recurso.id} defaultChecked={paquete.recurso_ids.includes(recurso.id)} className="mt-1 h-4 w-4" /><span><span className="block font-semibold text-slate-800">{recurso.titulo}</span><span className="text-[11px] text-slate-500">{recurso.tipo === 'archivo' ? 'Archivo' : 'Enlace'} · {recurso.categoria}</span></span></label>)}</div></section>
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start"><button type="submit" disabled={isPending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg disabled:opacity-60">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isPending ? 'Guardando…' : 'Guardar paquete'}</button></aside>
    </form> : modo === 'guia' ? <article className="paquete-print mx-auto max-w-4xl rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Vida Internacional</p><h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-5xl">{titulo}</h1>{descripcion && <p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-slate-600">{descripcion}</p>}{bosquejo && <section className="mt-8 rounded-2xl bg-indigo-50 p-5"><h2 className="text-2xl font-bold text-slate-950">{bosquejo.titulo}</h2>{bosquejo.pasaje_base && <p className="mt-2 font-semibold text-amber-700">{bosquejo.pasaje_base}</p>}{bosquejo.proposito && <p className="mt-3 leading-7 text-slate-700">{bosquejo.proposito}</p>}</section>}{coleccion?.versiculos?.length ? <section className="mt-9"><h2 className="text-xl font-bold">Versículos para estudiar</h2><div className="mt-4 space-y-4">{coleccion.versiculos.map((v) => <article key={v.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-bold text-indigo-700">{v.referencia}</p><p className="mt-2 leading-7 text-slate-700">{v.texto}</p></article>)}</div></section> : null}{bosquejo?.puntos?.length ? <section className="mt-9 space-y-6">{bosquejo.puntos.map((p, i) => <article key={i}><p className="text-xs font-bold uppercase text-indigo-500">Punto {i + 1}</p><h3 className="mt-1 text-xl font-bold">{p.titulo}</h3><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{p.contenido}</p></article>)}</section> : null}{instrucciones && <section className="mt-9 rounded-2xl bg-amber-50 p-5"><h2 className="font-bold text-amber-900">Aplicación para la semana</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-amber-950/80">{instrucciones}</p></section>}</article> : <section className="presentation-shell overflow-hidden rounded-[24px] bg-slate-950 text-white shadow-xl"><div className="relative flex min-h-[62vh] flex-col justify-center overflow-hidden p-7 sm:min-h-[68vh] sm:p-12 lg:p-16">{imagenActual?.acceso_url && <><img src={imagenActual.acceso_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" /><div className="absolute inset-0 bg-slate-950/55" /></>}<div className="relative z-10 max-w-5xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">Vida Internacional</p><h2 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">{diapositiva.titulo || titulo}</h2>{diapositiva.contenido && <p className="mt-7 whitespace-pre-wrap text-xl leading-relaxed text-slate-200 sm:text-3xl lg:text-4xl">{diapositiva.contenido}</p>}</div></div><div className="print:hidden flex items-center justify-between gap-3 border-t border-white/10 p-3 sm:p-4"><button onClick={() => setIndice((i) => Math.max(0, i - 1))} disabled={indice === 0} className="flex min-h-12 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-bold disabled:opacity-30"><ChevronLeft className="h-5 w-5" />Anterior</button><span className="text-sm text-slate-400">{indice + 1} / {diapositivas.length}</span><button onClick={() => setIndice((i) => Math.min(diapositivas.length - 1, i + 1))} disabled={indice >= diapositivas.length - 1} className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 disabled:opacity-30">Siguiente<ChevronRight className="h-5 w-5" /></button></div></section>}

    <style jsx global>{`@media print { body{background:white!important}.app-bottom-nav,header,.print\\:hidden{display:none!important}main{max-width:none!important;padding:0!important;background:white!important}.paquete-print{border:0!important;box-shadow:none!important;border-radius:0!important}@page{margin:14mm}}`}</style>
  </>
}
