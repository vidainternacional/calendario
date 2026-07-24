'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Eye,
  Expand,
  Loader2,
  Maximize2,
  Minimize2,
  MonitorPlay,
  Plus,
  Printer,
  Save,
  Share2,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react'
import { editarBosquejoPastoral } from '@/app/actions/pastoral-bosquejos'
import { mostrarToast } from '@/lib/ui/toast'

type Punto = { titulo: string; contenido: string }
type Modo = 'editar' | 'predicar' | 'diapositivas'
type Diapositiva = { etiqueta: string; titulo: string; contenido?: string; pasaje?: string }

type Bosquejo = {
  id: string
  titulo: string
  tema: string
  pasaje_base: string
  proposito: string
  introduccion: string
  puntos: Punto[]
  conclusion: string
  notas_privadas: string
  estado: 'borrador' | 'listo' | 'predicado'
  fecha_predicacion: string | null
}

export default function BosquejoEditorClient({ bosquejo }: { bosquejo: Bosquejo }) {
  const [modo, setModo] = useState<Modo>('editar')
  const [titulo, setTitulo] = useState(bosquejo.titulo)
  const [tema, setTema] = useState(bosquejo.tema)
  const [pasaje, setPasaje] = useState(bosquejo.pasaje_base)
  const [proposito, setProposito] = useState(bosquejo.proposito)
  const [introduccion, setIntroduccion] = useState(bosquejo.introduccion)
  const [conclusion, setConclusion] = useState(bosquejo.conclusion)
  const [notasPrivadas, setNotasPrivadas] = useState(bosquejo.notas_privadas ?? '')
  const [estado, setEstado] = useState(bosquejo.estado)
  const [fecha, setFecha] = useState(bosquejo.fecha_predicacion ?? '')
  const [puntos, setPuntos] = useState<Punto[]>(bosquejo.puntos?.length ? bosquejo.puntos : [{ titulo: '', contenido: '' }])
  const [diapositivaActual, setDiapositivaActual] = useState(0)
  const [presentacionAbierta, setPresentacionAbierta] = useState(false)
  const [mostrarNotas, setMostrarNotas] = useState(true)
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

  const contenidoTexto = useMemo(() => {
    const secciones = [
      titulo,
      tema ? `Tema: ${tema}` : '',
      pasaje ? `Pasaje base: ${pasaje}` : '',
      proposito ? `Propósito: ${proposito}` : '',
      introduccion ? `INTRODUCCIÓN\n${introduccion}` : '',
      ...puntos.filter((punto) => punto.titulo || punto.contenido).map((punto, index) => `${index + 1}. ${punto.titulo || 'Punto'}\n${punto.contenido}`),
      conclusion ? `CONCLUSIÓN Y LLAMADO\n${conclusion}` : '',
      'Vida Internacional',
    ]
    return secciones.filter(Boolean).join('\n\n')
  }, [titulo, tema, pasaje, proposito, introduccion, puntos, conclusion])

  const diapositivas = useMemo<Diapositiva[]>(() => {
    const resultado: Diapositiva[] = [{ etiqueta: 'Vida Internacional', titulo: titulo || 'Bosquejo pastoral', contenido: tema, pasaje }]
    if (proposito) resultado.push({ etiqueta: 'Idea central', titulo: proposito, pasaje })
    puntos.filter((punto) => punto.titulo || punto.contenido).forEach((punto, index) => {
      resultado.push({ etiqueta: `Punto ${index + 1}`, titulo: punto.titulo || `Punto ${index + 1}`, contenido: punto.contenido })
    })
    if (conclusion) resultado.push({ etiqueta: 'Conclusión y llamado', titulo: conclusion })
    return resultado
  }, [titulo, tema, pasaje, proposito, puntos, conclusion])

  useEffect(() => {
    if (diapositivaActual > diapositivas.length - 1) setDiapositivaActual(Math.max(0, diapositivas.length - 1))
  }, [diapositivas.length, diapositivaActual])

  useEffect(() => {
    if (!presentacionAbierta) return
    const manejarTecla = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ') setDiapositivaActual((actual) => Math.min(diapositivas.length - 1, actual + 1))
      if (event.key === 'ArrowLeft') setDiapositivaActual((actual) => Math.max(0, actual - 1))
      if (event.key === 'Escape') setPresentacionAbierta(false)
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [presentacionAbierta, diapositivas.length])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(contenidoTexto)
      mostrarToast('Bosquejo copiado')
    } catch {
      mostrarToast('No se pudo copiar el bosquejo')
    }
  }

  const compartir = async () => {
    try {
      if (navigator.share) await navigator.share({ title: titulo, text: contenidoTexto })
      else await copiar()
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') mostrarToast('No se pudo compartir')
    }
  }

  const modos: Array<{ id: Modo; label: string; icon: typeof Edit3 }> = [
    { id: 'editar', label: 'Editar', icon: Edit3 },
    { id: 'predicar', label: 'Predicar', icon: Eye },
    { id: 'diapositivas', label: 'Presentar', icon: MonitorPlay },
  ]

  const diapositiva = diapositivas[diapositivaActual] ?? diapositivas[0]

  const VistaDiapositiva = ({ completa = false }: { completa?: boolean }) => (
    <section className={`relative flex w-full flex-col justify-center overflow-hidden bg-slate-950 text-white ${completa ? 'min-h-screen px-6 py-16 sm:px-12 lg:px-20' : 'min-h-[420px] rounded-[26px] px-6 py-12 shadow-2xl sm:min-h-[520px] sm:px-10 lg:min-h-[620px] lg:px-16'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.28),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.14),transparent_35%)]" />
      <div className="relative mx-auto w-full max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-300 sm:text-sm">{diapositiva.etiqueta}</p>
        <h2 className={`mt-5 font-bold leading-[1.08] tracking-tight ${completa ? 'text-4xl sm:text-6xl lg:text-7xl' : 'text-3xl sm:text-5xl lg:text-6xl'}`}>{diapositiva.titulo}</h2>
        {diapositiva.pasaje && <p className="mt-6 text-lg font-semibold text-amber-300 sm:text-2xl">{diapositiva.pasaje}</p>}
        {diapositiva.contenido && <p className={`mt-7 whitespace-pre-wrap text-slate-300 ${completa ? 'max-w-4xl text-xl leading-9 sm:text-2xl sm:leading-10' : 'line-clamp-8 max-w-4xl text-lg leading-8 sm:text-xl'}`}>{diapositiva.contenido}</p>}
      </div>
    </section>
  )

  return (
    <>
      <section className="print:hidden sticky top-[calc(env(safe-area-inset-top)+0.5rem)] z-30 mb-5 rounded-[22px] border border-slate-200/80 bg-white/95 p-2 shadow-lg shadow-slate-200/60 backdrop-blur lg:mb-7">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {modos.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setModo(id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition sm:text-sm ${modo === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {modo !== 'editar' && (
          <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-100 pt-2 sm:gap-2">
            <button type="button" onClick={() => window.print()} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:text-sm"><Printer className="h-4 w-4" /> Imprimir</button>
            <button type="button" onClick={copiar} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:text-sm"><Copy className="h-4 w-4" /> Copiar</button>
            <button type="button" onClick={compartir} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:text-sm"><Share2 className="h-4 w-4" /> Compartir</button>
          </div>
        )}
      </section>

      {modo === 'editar' ? (
        <form action={guardar} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Mensaje</p><h2 className="mt-1 text-xl font-bold text-slate-950">Información principal</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold capitalize text-slate-600">{estado}</span></div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título</span><input name="titulo" value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={120} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Tema</span><input name="tema" value={tema} onChange={(event) => setTema(event.target.value)} maxLength={100} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Pasaje base</span><input name="pasaje_base" value={pasaje} onChange={(event) => setPasaje(event.target.value)} maxLength={120} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Estado</span><select name="estado" value={estado} onChange={(event) => setEstado(event.target.value as Bosquejo['estado'])} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="borrador">Borrador</option><option value="listo">Listo</option><option value="predicado">Predicado</option></select></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Fecha de predicación</span><input name="fecha_predicacion" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
                <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Propósito del mensaje</span><textarea name="proposito" value={proposito} onChange={(event) => setProposito(event.target.value)} maxLength={600} rows={4} placeholder="¿Qué debe comprender, sentir o aplicar la congregación?" className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Introducción</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Contexto, pregunta inicial, historia o conexión con la congregación.</p>
              <textarea name="introduccion" value={introduccion} onChange={(event) => setIntroduccion(event.target.value)} maxLength={4000} rows={8} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" />
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-lg font-bold text-slate-950">Puntos principales</h2><p className="mt-1 text-xs text-slate-500">Desarrolla la explicación, ilustración, aplicación y referencias.</p></div>
                <button type="button" onClick={() => setPuntos((actuales) => [...actuales, { titulo: '', contenido: '' }].slice(0, 12))} disabled={puntos.length >= 12} className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-50 px-4 text-xs font-bold text-indigo-700 disabled:opacity-40"><Plus className="h-4 w-4" /> Agregar punto</button>
              </div>
              <div className="mt-5 space-y-4">
                {puntos.map((punto, index) => (
                  <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3"><span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-indigo-600 px-2 text-xs font-bold text-white">{index + 1}</span>{puntos.length > 1 && <button type="button" onClick={() => setPuntos((actuales) => actuales.filter((_, posicion) => posicion !== index))} className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500" aria-label={`Eliminar punto ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}</div>
                    <input name="punto_titulo" value={punto.titulo} onChange={(event) => actualizarPunto(index, 'titulo', event.target.value)} maxLength={160} placeholder="Título del punto" className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900" />
                    <textarea name="punto_contenido" value={punto.contenido} onChange={(event) => actualizarPunto(index, 'contenido', event.target.value)} maxLength={5000} rows={7} placeholder="Explicación, ilustración, aplicación y referencias" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-base leading-7 text-slate-900" />
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Conclusión y llamado</h2>
              <textarea name="conclusion" value={conclusion} onChange={(event) => setConclusion(event.target.value)} maxLength={4000} rows={8} placeholder="Resume la idea central y define la aplicación o llamado final." className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" />
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-40">
            <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><StickyNote className="h-5 w-5" /></span><div><h2 className="font-bold text-amber-950">Notas privadas</h2><p className="text-xs text-amber-700">Solo aparecen en el modo Predicar.</p></div></div>
              <textarea name="notas_privadas" value={notasPrivadas} onChange={(event) => setNotasPrivadas(event.target.value)} maxLength={6000} rows={10} placeholder="Recordatorios, tiempos, transiciones, nombres o indicaciones personales." className="mt-4 w-full rounded-xl border border-amber-200 bg-white p-3 text-base leading-7 text-slate-900" />
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Vista rápida</p>
              <h3 className="mt-2 text-xl font-bold leading-tight text-slate-950">{titulo || 'Sin título'}</h3>
              {pasaje && <p className="mt-2 text-sm font-semibold text-indigo-700">{pasaje}</p>}
              <div className="mt-4 space-y-2">{puntos.filter((punto) => punto.titulo).slice(0, 5).map((punto, index) => <p key={index} className="text-sm text-slate-600"><span className="mr-2 font-bold text-indigo-600">{index + 1}.</span>{punto.titulo}</p>)}</div>
            </section>

            <button type="submit" disabled={isPending} className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-xl shadow-indigo-200 xl:static">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isPending ? 'Guardando…' : 'Guardar bosquejo'}
            </button>
          </aside>
        </form>
      ) : modo === 'predicar' ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <article className="bosquejo-print rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-9 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Vida Internacional</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">{titulo}</h1>
            {(tema || pasaje) && <div className="mt-5 flex flex-wrap gap-2">{tema && <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{tema}</span>}{pasaje && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{pasaje}</span>}</div>}
            {proposito && <section className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5"><h2 className="text-xs font-bold uppercase tracking-wide text-indigo-700">Propósito</h2><p className="mt-2 whitespace-pre-wrap text-lg leading-8 text-slate-800">{proposito}</p></section>}
            {introduccion && <section className="mt-10"><h2 className="text-xl font-bold text-slate-950">Introducción</h2><p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-slate-800 sm:text-xl sm:leading-9">{introduccion}</p></section>}
            <div className="mt-10 space-y-10">{puntos.filter((punto) => punto.titulo || punto.contenido).map((punto, index) => <section key={index} className="break-inside-avoid"><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Punto {index + 1}</p><h2 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{punto.titulo || `Punto ${index + 1}`}</h2>{punto.contenido && <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-slate-800 sm:text-xl sm:leading-9">{punto.contenido}</p>}</section>)}</div>
            {conclusion && <section className="mt-12 border-t border-slate-200 pt-8"><h2 className="text-2xl font-bold text-slate-950">Conclusión y llamado</h2><p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-slate-800 sm:text-xl sm:leading-9">{conclusion}</p></section>}
          </article>
          <aside className="print:hidden xl:sticky xl:top-40">
            <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <button type="button" onClick={() => setMostrarNotas((actual) => !actual)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left"><span className="flex items-center gap-3 font-bold text-amber-950"><StickyNote className="h-5 w-5" /> Notas privadas</span>{mostrarNotas ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
              {mostrarNotas && <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-amber-950">{notasPrivadas || 'No hay notas privadas para este mensaje.'}</p>}
            </section>
          </aside>
        </div>
      ) : (
        <div className="space-y-4">
          <VistaDiapositiva />
          <div className="print:hidden flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3 sm:justify-start"><button type="button" onClick={() => setDiapositivaActual((actual) => Math.max(0, actual - 1))} disabled={diapositivaActual === 0} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Anterior</button><span className="text-xs font-bold text-slate-500">{diapositivaActual + 1} / {diapositivas.length}</span><button type="button" onClick={() => setDiapositivaActual((actual) => Math.min(diapositivas.length - 1, actual + 1))} disabled={diapositivaActual === diapositivas.length - 1} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:opacity-40">Siguiente <ChevronRight className="h-4 w-4" /></button></div>
            <button type="button" onClick={() => setPresentacionAbierta(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"><Expand className="h-4 w-4" /> Pantalla completa</button>
          </div>
          <div className="print:hidden grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">{diapositivas.map((item, index) => <button key={`${item.etiqueta}-${index}`} type="button" onClick={() => setDiapositivaActual(index)} className={`min-h-14 rounded-xl border px-2 text-left text-[11px] font-bold leading-tight ${index === diapositivaActual ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-500'}`}><span className="block text-[9px] uppercase tracking-wide opacity-60">{index + 1}</span><span className="line-clamp-2">{item.titulo}</span></button>)}</div>
        </div>
      )}

      {presentacionAbierta && (
        <div className="fixed inset-0 z-[100] bg-slate-950" role="dialog" aria-modal="true" aria-label="Presentación del bosquejo">
          <VistaDiapositiva completa />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-12 sm:px-8">
            <button type="button" onClick={() => setDiapositivaActual((actual) => Math.max(0, actual - 1))} disabled={diapositivaActual === 0} className="flex min-h-12 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-bold text-white backdrop-blur disabled:opacity-30"><ChevronLeft className="h-5 w-5" /> <span className="hidden sm:inline">Anterior</span></button>
            <span className="text-xs font-bold text-white/70 sm:text-sm">{diapositivaActual + 1} de {diapositivas.length}</span>
            <button type="button" onClick={() => setDiapositivaActual((actual) => Math.min(diapositivas.length - 1, actual + 1))} disabled={diapositivaActual === diapositivas.length - 1} className="flex min-h-12 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-bold text-white backdrop-blur disabled:opacity-30"><span className="hidden sm:inline">Siguiente</span><ChevronRight className="h-5 w-5" /></button>
          </div>
          <button type="button" onClick={() => setPresentacionAbierta(false)} className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur sm:right-6" aria-label="Cerrar presentación"><X className="h-5 w-5" /></button>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .app-bottom-nav, header, .print\\:hidden { display: none !important; }
          main { max-width: none !important; padding: 0 !important; background: white !important; }
          .bosquejo-print { border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
          @page { margin: 14mm; }
        }
      `}</style>
    </>
  )
}
