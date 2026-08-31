'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Languages, Maximize2, Minimize2, Search, Sparkles } from 'lucide-react'
import PastoralVisualCanvas from '@/components/pastoral/PastoralVisualCanvas'
import { normalizarPaginaCanvas, type DiapositivaCanvas, type RecursoPastoral } from '@/components/pastoral/pastoral-canvas-model'

type Material = {
  titulo: string
  descripcion_publica?: string | null
  instrucciones?: string | null
  audiencia: string
  published_at?: string | null
  bosquejo?: any | null
  coleccion?: any | null
  presentacion_diapositivas?: DiapositivaCanvas[] | null
}

export default function MaterialPastoralExperience({ material, biblioteca }: { material: Material; biblioteca: RecursoPastoral[] }) {
  const paginas = useMemo(() => (Array.isArray(material.presentacion_diapositivas) ? material.presentacion_diapositivas : []).map((item) => normalizarPaginaCanvas(item)), [material.presentacion_diapositivas])
  const [modo, setModo] = useState<'presentacion' | 'estudio'>(paginas.length ? 'presentacion' : 'estudio')
  const [indice, setIndice] = useState(0)
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const presentacionRef = useRef<HTMLDivElement | null>(null)
  const pagina = paginas[indice] ?? null
  const bosquejo = material.bosquejo ?? null
  const coleccion = material.coleccion ?? null
  const puntos = Array.isArray(bosquejo?.puntos) ? bosquejo.puntos : []
  const versiculos = Array.isArray(coleccion?.versiculos) ? coleccion.versiculos : []

  useEffect(() => {
    if (!pantallaCompleta) return
    const anteriorHtml = document.documentElement.style.overflow
    const anteriorBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = anteriorHtml
      document.body.style.overflow = anteriorBody
    }
  }, [pantallaCompleta])

  const mover = (delta: number) => setIndice((actual) => Math.min(Math.max(actual + delta, 0), Math.max(0, paginas.length - 1)))

  const abrirPantallaCompleta = async () => {
    setPantallaCompleta(true)
    try { await presentacionRef.current?.requestFullscreen?.({ navigationUI: 'hide' }) } catch {}
  }

  const cerrarPantallaCompleta = async () => {
    setPantallaCompleta(false)
    try { if (document.fullscreenElement) await document.exitFullscreen() } catch {}
  }

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-4 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{material.titulo}</p><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500">Vida Internacional</p></div>
          <div className="flex shrink-0 rounded-full bg-slate-100 p-1" role="tablist" aria-label="Modo del material">
            <button type="button" onClick={() => setModo('presentacion')} disabled={!paginas.length} className={`min-h-9 rounded-full px-3 text-xs font-black transition ${modo === 'presentacion' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'} disabled:opacity-35`}>Presentación</button>
            <button type="button" onClick={() => setModo('estudio')} className={`min-h-9 rounded-full px-3 text-xs font-black transition ${modo === 'estudio' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Estudio</button>
          </div>
        </div>
      </header>

      {modo === 'presentacion' && pagina && (
        <section className="mx-auto flex min-h-[calc(100dvh-74px)] max-w-7xl flex-col px-0 py-4 sm:px-6 sm:py-6">
          <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-0">
            <div><p className="text-xs font-bold text-slate-500">Diapositiva {indice + 1} de {paginas.length}</p><p className="text-sm font-semibold text-slate-700">Composición original del pastor</p></div>
            <button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"><Maximize2 className="h-4 w-4" /> Pantalla completa</button>
          </div>

          <div ref={presentacionRef} className={pantallaCompleta ? 'fixed inset-0 z-[200] flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-black' : 'relative flex flex-1 items-center justify-center overflow-hidden bg-black sm:rounded-[28px]'}>
            {pantallaCompleta && <button type="button" onClick={cerrarPantallaCompleta} className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[230] grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white" aria-label="Salir de pantalla completa"><Minimize2 className="h-5 w-5" /></button>}
            <PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} fitViewport={pantallaCompleta} />
            <button type="button" onClick={() => mover(-1)} disabled={indice === 0} className="absolute left-2 top-1/2 z-[220] -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white disabled:opacity-0" aria-label="Diapositiva anterior"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => mover(1)} disabled={indice === paginas.length - 1} className="absolute right-2 top-1/2 z-[220] -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white disabled:opacity-0" aria-label="Diapositiva siguiente"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </section>
      )}

      {modo === 'estudio' && (
        <section className="mx-auto max-w-4xl px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-500">Modo estudio</p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{material.titulo}</h1>
            {material.descripcion_publica && <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-600">{material.descripcion_publica}</p>}

            <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Link href="/biblia" className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-black text-slate-700"><BookOpen className="h-5 w-5 text-indigo-600" /> Biblia</Link>
              <Link href="/estudios/profundo" className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-black text-slate-700"><Sparkles className="h-5 w-5 text-indigo-600" /> Estudio profundo</Link>
              <Link href="/estudios/concordancias" className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-black text-slate-700"><Search className="h-5 w-5 text-indigo-600" /> Concordancias</Link>
              <Link href="/estudios/hebreo" className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-black text-slate-700"><Languages className="h-5 w-5 text-indigo-600" /> Hebreo</Link>
            </div>

            <div className="mt-9 space-y-9">
              {bosquejo && <section><h2 className="text-xl font-black">Mensaje principal</h2><div className="mt-3 rounded-2xl bg-indigo-50 p-5"><h3 className="text-2xl font-black">{bosquejo.titulo}</h3>{bosquejo.pasaje_base && <p className="mt-2 font-bold text-amber-700">{bosquejo.pasaje_base}</p>}{bosquejo.proposito && <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{bosquejo.proposito}</p>}</div></section>}
              {versiculos.length > 0 && <section><h2 className="text-xl font-black">Versículos para estudiar</h2><div className="mt-3 space-y-3">{versiculos.map((versiculo: any, i: number) => <article key={`${versiculo.referencia}-${i}`} className="rounded-2xl border border-slate-200 p-4"><p className="font-black text-indigo-700">{versiculo.referencia}</p><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{versiculo.texto}</p></article>)}</div></section>}
              {bosquejo?.introduccion && <section><h2 className="text-xl font-black">Introducción</h2><p className="mt-3 whitespace-pre-wrap leading-8 text-slate-700">{bosquejo.introduccion}</p></section>}
              {puntos.length > 0 && <section><h2 className="text-xl font-black">Desarrollo</h2><div className="mt-4 space-y-6">{puntos.map((punto: any, i: number) => <article key={i}><p className="text-xs font-black uppercase tracking-wide text-indigo-500">Punto {i + 1}</p><h3 className="mt-1 text-xl font-black">{punto.titulo || `Punto ${i + 1}`}</h3>{punto.contenido && <p className="mt-2 whitespace-pre-wrap leading-8 text-slate-700">{punto.contenido}</p>}</article>)}</div></section>}
              {bosquejo?.conclusion && <section><h2 className="text-xl font-black">Conclusión</h2><p className="mt-3 whitespace-pre-wrap leading-8 text-slate-700">{bosquejo.conclusion}</p></section>}
              {material.instrucciones && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-lg font-black text-amber-950">Aplicación para la semana</h2><p className="mt-3 whitespace-pre-wrap leading-8 text-amber-950/80">{material.instrucciones}</p></section>}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
