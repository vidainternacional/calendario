'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen, BookOpenText, CalendarDays, ChevronLeft, ChevronRight, Church,
  Languages, Maximize2, Minimize2, NotebookPen, Search, Send, Sparkles,
} from 'lucide-react'
import PastoralVisualCanvas from '@/components/pastoral/PastoralVisualCanvas'
import {
  normalizarPaginaCanvas,
  type DiapositivaCanvas,
  type RecursoPastoral,
} from '@/components/pastoral/pastoral-canvas-model'
import {
  crearNotaBiblicaLocal,
  guardarNotasBiblicasLocales,
  leerNotasBiblicasLocales,
} from '@/lib/biblia/notes-local'
import { mostrarToast } from '@/lib/ui/toast'

type PuntoBosquejo = { titulo?: string; contenido?: string }
type VersiculoMaterial = { referencia?: string; texto?: string; traduccion?: string }
type MaterialPastoral = {
  id: string
  titulo: string
  descripcion_publica?: string | null
  instrucciones?: string | null
  audiencia: string
  published_at?: string | null
  presentacion_diapositivas?: DiapositivaCanvas[]
  bosquejo?: {
    titulo?: string
    tema?: string
    pasaje_base?: string
    proposito?: string
    introduccion?: string
    puntos?: PuntoBosquejo[]
    conclusion?: string
  } | null
  coleccion?: {
    nombre?: string
    descripcion?: string
    versiculos?: VersiculoMaterial[]
  } | null
}

type Props = {
  material: MaterialPastoral
  biblioteca: RecursoPastoral[]
  userId: string
}

type Modo = 'presentacion' | 'estudio'

const HERRAMIENTAS = [
  { href: '/biblia', label: 'Biblia', icon: BookOpen },
  { href: '/estudios/profundo', label: 'Estudio Profundo', icon: Sparkles },
  { href: '/estudios/concordancias', label: 'Concordancias', icon: Search },
  { href: '/estudios/hebreo', label: 'Hebreo', icon: Languages },
  { href: '/biblia/notas', label: 'Cuaderno', icon: NotebookPen },
]

function etiquetaAudiencia(audiencia: string) {
  return audiencia === 'lideres' ? 'Líderes'
    : audiencia === 'servidores' ? 'Servidores'
      : 'Toda la congregación'
}

function escaparHtml(valor: string) {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function parrafoNota(valor: string | null | undefined) {
  const limpio = String(valor ?? '').trim()
  if (!limpio) return ''
  return `<p>${escaparHtml(limpio).replace(/\n/g, '<br>')}</p>`
}

export default function MaterialPastoralExperience({ material, biblioteca, userId }: Props) {
  const [modo, setModo] = useState<Modo>('presentacion')
  const [indice, setIndice] = useState(0)
  const [presentando, setPresentando] = useState(false)
  const presentacionRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef(0)

  const diapositivas = useMemo(
    () => (Array.isArray(material.presentacion_diapositivas) ? material.presentacion_diapositivas : []).map((pagina) => normalizarPaginaCanvas(pagina)),
    [material.presentacion_diapositivas]
  )
  const pagina = diapositivas[indice] ?? null
  const bosquejo = material.bosquejo ?? null
  const puntos = Array.isArray(bosquejo?.puntos) ? bosquejo.puntos : []
  const versiculos = Array.isArray(material.coleccion?.versiculos) ? material.coleccion.versiculos : []

  const mover = (delta: number) => {
    if (!diapositivas.length) return
    setIndice((actual) => Math.min(Math.max(actual + delta, 0), diapositivas.length - 1))
  }

  useEffect(() => {
    if (!presentando) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') mover(-1)
      if (event.key === 'ArrowRight') mover(1)
      if (event.key === 'Escape') setPresentando(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [presentando, diapositivas.length])

  useEffect(() => {
    if (!presentando) return
    const html = document.documentElement
    const body = document.body
    const anteriorHtml = html.style.overflow
    const anteriorBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = anteriorHtml
      body.style.overflow = anteriorBody
    }
  }, [presentando])

  const abrirPantallaCompleta = () => {
    setPresentando(true)
    window.requestAnimationFrame(async () => {
      try {
        await presentacionRef.current?.requestFullscreen?.({ navigationUI: 'hide' })
      } catch {}
    })
  }

  const cerrarPantallaCompleta = async () => {
    setPresentando(false)
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
    } catch {}
  }

  const guardarNota = (titulo: string, contenido: string, referencia = '') => {
    const nota = crearNotaBiblicaLocal({
      titulo,
      contenido,
      tipo: referencia ? 'versiculo' : 'predicacion',
      referencia,
      paqueteId: material.id,
      paquete: material.titulo,
      origen: 'biblia_notas',
      origenKey: referencia ? `${material.id}:${referencia}` : material.id,
      contexto: {
        superficieOrigen: 'pastoral_material',
        materialId: material.id,
        materialTitulo: material.titulo,
      },
    })
    const actuales = leerNotasBiblicasLocales(userId)
    const guardada = guardarNotasBiblicasLocales([nota, ...actuales], userId)
    mostrarToast(guardada ? 'Enviado al Cuaderno' : 'No se pudo guardar en el Cuaderno')
  }

  const guardarPaqueteEnCuaderno = () => {
    const contenido = [
      parrafoNota(material.descripcion_publica),
      bosquejo?.pasaje_base ? `<p><strong>${escaparHtml(bosquejo.pasaje_base)}</strong></p>` : '',
      parrafoNota(bosquejo?.proposito),
      bosquejo?.introduccion ? `<h2>Introducción</h2>${parrafoNota(bosquejo.introduccion)}` : '',
      ...puntos.map((punto, index) => `<h2>${escaparHtml(punto.titulo || `Punto ${index + 1}`)}</h2>${parrafoNota(punto.contenido)}`),
      ...versiculos.map((versiculo) => `<p><strong>${escaparHtml(versiculo.referencia || '')}</strong>${versiculo.traduccion ? ` · ${escaparHtml(versiculo.traduccion)}` : ''}<br>${escaparHtml(versiculo.texto || '')}</p>`),
      bosquejo?.conclusion ? `<h2>Conclusión</h2>${parrafoNota(bosquejo.conclusion)}` : '',
      material.instrucciones ? `<h2>Aplicación</h2>${parrafoNota(material.instrucciones)}` : '',
    ].filter(Boolean).join('')
    guardarNota(material.titulo, contenido)
  }

  const fecha = material.published_at
    ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'long', timeZone: 'America/El_Salvador' }).format(new Date(material.published_at))
    : null

  const presentacion = pagina ? (
    <div
      onTouchStart={(event) => { touchStartRef.current = event.touches[0]?.clientX ?? 0 }}
      onTouchEnd={(event) => {
        const fin = event.changedTouches[0]?.clientX ?? touchStartRef.current
        const delta = fin - touchStartRef.current
        if (Math.abs(delta) > 45) mover(delta < 0 ? 1 : -1)
      }}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black"
    >
      <PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} fitViewport={presentando} />
      <button type="button" onClick={() => mover(-1)} disabled={indice === 0} className="absolute left-[max(8px,env(safe-area-inset-left))] top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm disabled:opacity-0" aria-label="Diapositiva anterior"><ChevronLeft className="h-5 w-5" /></button>
      <button type="button" onClick={() => mover(1)} disabled={indice >= diapositivas.length - 1} className="absolute right-[max(8px,env(safe-area-inset-right))] top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm disabled:opacity-0" aria-label="Diapositiva siguiente"><ChevronRight className="h-5 w-5" /></button>
      <span className="absolute bottom-[max(10px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur-sm">{indice + 1}/{diapositivas.length}</span>
    </div>
  ) : (
    <div className="grid min-h-[42vh] place-items-center bg-slate-950 px-6 text-center text-sm text-white/70">Esta publicación todavía no contiene diapositivas visuales.</div>
  )

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <Link href="/inicio" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-600" aria-label="Volver a Inicio"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{material.titulo}</p><p className="text-[11px] font-semibold text-slate-400">Material Pastoral · {etiquetaAudiencia(material.audiencia)}</p></div>
          <div className="flex rounded-full bg-slate-100 p-1 text-xs font-bold">
            <button type="button" onClick={() => setModo('presentacion')} className={`min-h-9 rounded-full px-3 ${modo === 'presentacion' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Presentación</button>
            <button type="button" onClick={() => setModo('estudio')} className={`min-h-9 rounded-full px-3 ${modo === 'estudio' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Estudio</button>
          </div>
        </div>
      </header>

      {modo === 'presentacion' ? (
        <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-7 lg:px-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h1 className="text-lg font-black sm:text-2xl">Presentación</h1><p className="text-xs text-slate-500">La composición visual original del pastor, sin reconstruir.</p></div>
            <button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-bold text-white"><Maximize2 className="h-4 w-4" /> <span className="hidden sm:inline">Pantalla completa</span></button>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-black/10 sm:rounded-3xl" style={{ minHeight: 'min(68dvh, 720px)' }}>{presentacion}</div>
          <p className="mx-auto mt-3 max-w-xl text-center text-xs leading-5 text-slate-500">En teléfono puedes girar el dispositivo. VIDA conserva la proporción de la diapositiva y se adapta al espacio disponible.</p>
        </section>
      ) : (
        <section className="mx-auto w-full max-w-4xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          <div className="mb-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2">
              {HERRAMIENTAS.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm"><Icon className="h-4 w-4 text-indigo-600" />{label}</Link>)}
            </div>
          </div>

          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <header className="bg-gradient-to-br from-indigo-800 via-violet-800 to-slate-950 px-6 py-9 text-white sm:px-10 sm:py-12">
              <div className="flex items-center gap-2 text-indigo-200"><Church className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Vida Internacional</span></div>
              <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">{material.titulo}</h1>
              {material.descripcion_publica && <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-white/80 sm:text-lg">{material.descripcion_publica}</p>}
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/80"><span className="rounded-full bg-white/10 px-3 py-1.5">{etiquetaAudiencia(material.audiencia)}</span>{fecha && <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><CalendarDays className="h-3.5 w-3.5" />{fecha}</span>}</div>
              <button type="button" onClick={guardarPaqueteEnCuaderno} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-indigo-800"><Send className="h-4 w-4" /> Enviar paquete al Cuaderno</button>
            </header>

            <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-12">
              {bosquejo && <section><div className="flex items-center gap-2 text-indigo-700"><BookOpenText className="h-5 w-5" /><h2 className="text-lg font-bold">Mensaje principal</h2></div><div className="mt-4 rounded-2xl bg-indigo-50 p-5 sm:p-6"><h3 className="text-2xl font-bold text-slate-950">{bosquejo.titulo || material.titulo}</h3>{bosquejo.pasaje_base && <p className="mt-2 font-semibold text-amber-700">{bosquejo.pasaje_base}</p>}{bosquejo.proposito && <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-700">{bosquejo.proposito}</p>}</div></section>}

              {versiculos.length > 0 && <section><h2 className="text-xl font-bold text-slate-950">Versículos para estudiar</h2><div className="mt-4 space-y-4">{versiculos.map((versiculo, index) => <article key={`${versiculo.referencia}-${index}`} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><p className="font-bold text-indigo-700">{versiculo.referencia} {versiculo.traduccion && <span className="text-xs font-normal text-slate-400">{versiculo.traduccion}</span>}</p><button type="button" onClick={() => guardarNota(`${versiculo.referencia || 'Versículo'} · ${material.titulo}`, parrafoNota(versiculo.texto), versiculo.referencia || '')} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[11px] font-bold text-slate-600"><NotebookPen className="h-3.5 w-3.5" /> Cuaderno</button></div><p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-700">{versiculo.texto}</p></article>)}</div></section>}

              {bosquejo?.introduccion && <section><h2 className="text-xl font-bold text-slate-950">Introducción</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{bosquejo.introduccion}</p></section>}
              {puntos.length > 0 && <section><h2 className="text-xl font-bold text-slate-950">Desarrollo</h2><div className="mt-5 space-y-7">{puntos.map((punto, index) => <article key={index}><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Punto {index + 1}</p><h3 className="mt-1 text-xl font-bold text-slate-900">{punto.titulo || `Punto ${index + 1}`}</h3>{punto.contenido && <p className="mt-2 whitespace-pre-wrap text-base leading-8 text-slate-700">{punto.contenido}</p>}</article>)}</div></section>}
              {bosquejo?.conclusion && <section><h2 className="text-xl font-bold text-slate-950">Conclusión</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{bosquejo.conclusion}</p></section>}
              {material.instrucciones && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6"><h2 className="text-lg font-bold text-amber-900">Aplicación para la semana</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-amber-950/80">{material.instrucciones}</p></section>}
            </div>
          </article>
        </section>
      )}

      {presentando && <div ref={presentacionRef} className="fixed inset-0 z-[999] flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-black"><button type="button" onClick={cerrarPantallaCompleta} className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-30 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm" aria-label="Salir de pantalla completa"><Minimize2 className="h-5 w-5" /></button>{presentacion}</div>}
    </main>
  )
}
