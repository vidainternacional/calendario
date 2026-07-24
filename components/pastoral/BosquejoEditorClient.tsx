'use client'

import { useMemo, useState, useTransition } from 'react'
import { Copy, Edit3, Eye, Loader2, MonitorPlay, Plus, Printer, Save, Share2, Trash2 } from 'lucide-react'
import { editarBosquejoPastoral } from '@/app/actions/pastoral-bosquejos'
import { mostrarToast } from '@/lib/ui/toast'

type Punto = { titulo: string; contenido: string }
type Modo = 'editar' | 'predicar' | 'diapositivas'

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
  const [modo, setModo] = useState<Modo>('editar')
  const [titulo, setTitulo] = useState(bosquejo.titulo)
  const [tema, setTema] = useState(bosquejo.tema)
  const [pasaje, setPasaje] = useState(bosquejo.pasaje_base)
  const [proposito, setProposito] = useState(bosquejo.proposito)
  const [introduccion, setIntroduccion] = useState(bosquejo.introduccion)
  const [conclusion, setConclusion] = useState(bosquejo.conclusion)
  const [estado, setEstado] = useState(bosquejo.estado)
  const [fecha, setFecha] = useState(bosquejo.fecha_predicacion ?? '')
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
    { id: 'diapositivas', label: 'Diapositivas', icon: MonitorPlay },
  ]

  return (
    <>
      <section className="print:hidden mb-5 rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-3 gap-1">
          {modos.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setModo(id)} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold ${modo === id ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {modo !== 'editar' && (
          <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-100 pt-2">
            <button type="button" onClick={() => window.print()} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600"><Printer className="h-4 w-4" /> Imprimir</button>
            <button type="button" onClick={copiar} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600"><Copy className="h-4 w-4" /> Copiar</button>
            <button type="button" onClick={compartir} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600"><Share2 className="h-4 w-4" /> Compartir</button>
          </div>
        )}
      </section>

      {modo === 'editar' ? (
        <form action={guardar} className="space-y-5">
          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título</span><input name="titulo" value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={120} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Tema</span><input name="tema" value={tema} onChange={(event) => setTema(event.target.value)} maxLength={100} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Pasaje base</span><input name="pasaje_base" value={pasaje} onChange={(event) => setPasaje(event.target.value)} maxLength={120} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Estado</span><select name="estado" value={estado} onChange={(event) => setEstado(event.target.value as Bosquejo['estado'])} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="borrador">Borrador</option><option value="listo">Listo</option><option value="predicado">Predicado</option></select></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Fecha de predicación</span><input name="fecha_predicacion" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Propósito del mensaje</span><textarea name="proposito" value={proposito} onChange={(event) => setProposito(event.target.value)} maxLength={600} rows={4} placeholder="¿Qué debe comprender, sentir o aplicar la congregación?" className="w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" /></label>
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Introducción</h2>
            <p className="mt-1 text-xs text-slate-500">Contexto, pregunta inicial, historia o conexión con la congregación.</p>
            <textarea name="introduccion" value={introduccion} onChange={(event) => setIntroduccion(event.target.value)} maxLength={4000} rows={7} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" />
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-bold text-slate-900">Puntos principales</h2><p className="mt-1 text-xs text-slate-500">Ordena el desarrollo de la prédica en hasta 12 puntos.</p></div>
              <button type="button" onClick={() => setPuntos((actuales) => [...actuales, { titulo: '', contenido: '' }].slice(0, 12))} disabled={puntos.length >= 12} className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-50 px-3 text-xs font-bold text-indigo-700 disabled:opacity-40"><Plus className="h-4 w-4" /> Punto</button>
            </div>
            <div className="mt-4 space-y-4">
              {puntos.map((punto, index) => (
                <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-indigo-600">Punto {index + 1}</span>{puntos.length > 1 && <button type="button" onClick={() => setPuntos((actuales) => actuales.filter((_, posicion) => posicion !== index))} className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500" aria-label={`Eliminar punto ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}</div>
                  <input name="punto_titulo" value={punto.titulo} onChange={(event) => actualizarPunto(index, 'titulo', event.target.value)} maxLength={160} placeholder="Título del punto" className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900" />
                  <textarea name="punto_contenido" value={punto.contenido} onChange={(event) => actualizarPunto(index, 'contenido', event.target.value)} maxLength={5000} rows={6} placeholder="Explicación, ilustración, aplicación y referencias" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-base leading-7 text-slate-900" />
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Conclusión y llamado</h2>
            <textarea name="conclusion" value={conclusion} onChange={(event) => setConclusion(event.target.value)} maxLength={4000} rows={7} placeholder="Resume la idea central y define la aplicación o llamado final." className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" />
          </section>

          <button type="submit" disabled={isPending} className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isPending ? 'Guardando…' : 'Guardar bosquejo'}
          </button>
        </form>
      ) : modo === 'predicar' ? (
        <article className="bosquejo-print rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Vida Internacional</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950">{titulo}</h1>
          {(tema || pasaje) && <div className="mt-4 flex flex-wrap gap-2">{tema && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{tema}</span>}{pasaje && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{pasaje}</span>}</div>}
          {proposito && <section className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><h2 className="text-xs font-bold uppercase tracking-wide text-indigo-700">Propósito</h2><p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-800">{proposito}</p></section>}
          {introduccion && <section className="mt-8"><h2 className="text-lg font-bold text-slate-900">Introducción</h2><p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-slate-800">{introduccion}</p></section>}
          <div className="mt-8 space-y-8">{puntos.filter((punto) => punto.titulo || punto.contenido).map((punto, index) => <section key={index} className="break-inside-avoid"><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Punto {index + 1}</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{punto.titulo || `Punto ${index + 1}`}</h2>{punto.contenido && <p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-slate-800">{punto.contenido}</p>}</section>)}</div>
          {conclusion && <section className="mt-10 border-t border-slate-200 pt-7"><h2 className="text-xl font-bold text-slate-950">Conclusión y llamado</h2><p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-slate-800">{conclusion}</p></section>}
        </article>
      ) : (
        <article className="bosquejo-print overflow-hidden rounded-[24px] bg-slate-950 text-white shadow-xl">
          <section className="flex min-h-[360px] flex-col justify-center p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">Vida Internacional</p><h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">{titulo}</h1>{pasaje && <p className="mt-5 text-xl text-amber-300">{pasaje}</p>}{tema && <p className="mt-2 text-base text-slate-300">{tema}</p>}</section>
          {proposito && <section className="min-h-[300px] border-t border-white/10 p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">Idea central</p><p className="mt-6 text-3xl font-semibold leading-snug">{proposito}</p></section>}
          {puntos.filter((punto) => punto.titulo || punto.contenido).map((punto, index) => <section key={index} className="min-h-[300px] border-t border-white/10 p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">Punto {index + 1}</p><h2 className="mt-5 text-4xl font-bold leading-tight">{punto.titulo || `Punto ${index + 1}`}</h2>{punto.contenido && <p className="mt-6 line-clamp-6 whitespace-pre-wrap text-xl leading-relaxed text-slate-300">{punto.contenido}</p>}</section>)}
          {conclusion && <section className="min-h-[300px] border-t border-white/10 p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300">Conclusión y llamado</p><p className="mt-6 line-clamp-8 whitespace-pre-wrap text-2xl leading-relaxed">{conclusion}</p></section>}
        </article>
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
