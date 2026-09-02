'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpenText, CalendarDays, ChevronLeft, ChevronRight, Church,
  Maximize2, Minimize2, NotebookPen, Send,
} from 'lucide-react'
import PastoralVisualCanvas from '@/components/pastoral/PastoralVisualCanvas'
import {
  aspectoLienzo,
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
  userId?: string
  embeddedStudy?: boolean
}

type Modo = 'presentacion' | 'estudio'

function etiquetaAudiencia(audiencia: string) {
  return audiencia === 'lideres' ? 'Líderes'
    : audiencia === 'servidores' ? 'Servidores'
      : 'Toda la congregación'
}

function textoCanvasParaNota(valor: string | null | undefined) {
  const html = String(valor ?? '').trim()
  if (!html) return ''
  if (typeof document !== 'undefined') {
    const contenedor = document.createElement('div')
    contenedor.innerHTML = html.replace(/<br\s*\/?\s*>/gi, '\n')
    return String(contenedor.textContent ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
  return html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-3])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function textoNota(valor: string | null | undefined) {
  const limpio = String(valor ?? '').replace(/\r\n?/g, '\n').trim()
  if (!limpio) return ''
  return /<\/?[a-z][\s\S]*>/i.test(limpio) ? textoCanvasParaNota(limpio) : limpio
}

function bloqueNota(titulo: string, valor: string | null | undefined) {
  const limpio = textoNota(valor)
  return limpio ? `## ${titulo}\n${limpio}` : ''
}

function textosDeDiapositiva(diapositiva: DiapositivaCanvas) {
  const textosElementos = [...(diapositiva.elementos ?? [])]
    .filter((elemento) => !elemento.oculto && !elemento.fondo_visual && !elemento.es_capa_fondo && elemento.tipo !== 'imagen')
    .sort((a, b) => a.y - b.y || a.x - b.x || a.z - b.z)
    .map((elemento) => textoCanvasParaNota(elemento.contenido))
    .filter(Boolean)
  const textosLegado = [textoNota(diapositiva.titulo), textoNota(diapositiva.contenido)].filter(Boolean)
  return Array.from(new Set([...textosElementos, ...textosLegado]))
}

export default function MaterialPastoralExperience({ material, biblioteca, userId = '', embeddedStudy = false }: Props) {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>(embeddedStudy ? 'estudio' : 'presentacion')
  const [indice, setIndice] = useState(0)
  const [presentando, setPresentando] = useState(false)
  const presentacionRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef(0)

  const diapositivas = useMemo(
    () => (Array.isArray(material.presentacion_diapositivas) ? material.presentacion_diapositivas : []).map((pagina) => normalizarPaginaCanvas(pagina)),
    [material.presentacion_diapositivas]
  )
  const lecturaDiapositivas = useMemo(
    () => diapositivas
      .map((diapositiva, index) => ({ numero: index + 1, textos: textosDeDiapositiva(diapositiva) }))
      .filter((item) => item.textos.length > 0),
    [diapositivas]
  )
  const pagina = diapositivas[indice] ?? null
  const aspectoPagina = pagina ? aspectoLienzo(pagina.formato) : 16 / 9
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
    const origenKey = referencia ? `${material.id}:${referencia}` : material.id
    const actuales = leerNotasBiblicasLocales(userId)
    const existente = actuales.find((item) => item.paqueteId === material.id && item.origenKey === origenKey)
    const ahora = new Date().toISOString()
    const nota = crearNotaBiblicaLocal({
      ...(existente ? { id: existente.id, creadaEn: existente.creadaEn } : {}),
      titulo,
      contenido: textoNota(contenido),
      tipo: referencia ? 'versiculo' : 'predicacion',
      referencia,
      paqueteId: material.id,
      paquete: material.titulo,
      origen: 'biblia_notas',
      origenKey,
      actualizadaEn: ahora,
      contexto: {
        superficieOrigen: 'pastoral_material',
        materialId: material.id,
        materialTitulo: material.titulo,
      },
    })
    const guardada = guardarNotasBiblicasLocales([nota, ...actuales.filter((item) => item.id !== nota.id)], userId)
    mostrarToast(guardada ? 'Enviado al Cuaderno' : 'No se pudo guardar en el Cuaderno')
    return guardada ? nota.id : null
  }

  const guardarPaqueteEnCuaderno = () => {
    const textoDiapositivas = lecturaDiapositivas.map((diapositiva) => `### Diapositiva ${diapositiva.numero}\n${diapositiva.textos.join('\n')}`)
    const referenciaBase = textoNota(bosquejo?.pasaje_base)
    const contenido = [
      textoNota(material.descripcion_publica),
      bosquejo?.titulo && textoNota(bosquejo.titulo) !== textoNota(material.titulo) ? bloqueNota('Mensaje', bosquejo.titulo) : '',
      bloqueNota('Tema', bosquejo?.tema),
      referenciaBase ? `◈ ${referenciaBase}` : '',
      bloqueNota('Propósito', bosquejo?.proposito),
      bloqueNota('Introducción', bosquejo?.introduccion),
      ...puntos.map((punto, index) => bloqueNota(punto.titulo || `Punto ${index + 1}`, punto.contenido)),
      material.coleccion?.descripcion ? bloqueNota(material.coleccion.nombre || 'Colección bíblica', material.coleccion.descripcion) : '',
      ...versiculos.map((versiculo) => {
        const referencia = [textoNota(versiculo.referencia), textoNota(versiculo.traduccion)].filter(Boolean).join(' · ')
        const texto = textoNota(versiculo.texto)
        return [referencia ? `◈ ${referencia}` : '', texto].filter(Boolean).join('\n')
      }),
      bloqueNota('Conclusión', bosquejo?.conclusion),
      bloqueNota('Aplicación', material.instrucciones),
      textoDiapositivas.length ? `## Presentación\n${textoDiapositivas.join('\n\n')}` : '',
    ].filter(Boolean).join('\n\n')
    const notaId = guardarNota(material.titulo, contenido || textoNota(material.titulo))
    if (notaId) router.push(`/biblia/notas?nota=${encodeURIComponent(notaId)}`)
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
      <div className="mx-auto" style={{ width: presentando ? `min(100dvw, calc(100dvh * ${aspectoPagina}))` : '100%' }}>
        <PastoralVisualCanvas pagina={pagina} biblioteca={biblioteca} />
      </div>
      <button type="button" onClick={() => mover(-1)} disabled={indice === 0} className="absolute left-[max(8px,env(safe-area-inset-left))] top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm disabled:opacity-0" aria-label="Diapositiva anterior"><ChevronLeft className="h-5 w-5" /></button>
      <button type="button" onClick={() => mover(1)} disabled={indice >= diapositivas.length - 1} className="absolute right-[max(8px,env(safe-area-inset-right))] top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm disabled:opacity-0" aria-label="Diapositiva siguiente"><ChevronRight className="h-5 w-5" /></button>
      <span className="absolute bottom-[max(10px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur-sm">{indice + 1}/{diapositivas.length}</span>
    </div>
  ) : (
    <div className="grid min-h-[42vh] place-items-center bg-slate-950 px-6 text-center text-sm text-white/70">Esta publicación todavía no contiene diapositivas visuales.</div>
  )

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      {!embeddedStudy && <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[calc(.75rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <Link href="/inicio" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-600" aria-label="Volver a Inicio"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{material.titulo}</p><p className="text-[11px] font-semibold text-slate-400">Material Pastoral · {etiquetaAudiencia(material.audiencia)}</p></div>
          <div className="flex rounded-full bg-slate-100 p-1 text-xs font-bold">
            <button type="button" onClick={() => setModo('presentacion')} className={`min-h-9 rounded-full px-3 ${modo === 'presentacion' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Presentación</button>
            <button type="button" onClick={() => setModo('estudio')} className={`min-h-9 rounded-full px-3 ${modo === 'estudio' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Estudio</button>
          </div>
        </div>
      </header>}

      {modo === 'presentacion' ? (
        <section className="w-full py-4 sm:py-7">
          <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div><h1 className="text-lg font-black sm:text-2xl">Presentación</h1><p className="text-xs text-slate-500">La composición visual original del pastor, sin reconstruir.</p></div>
            <button type="button" onClick={abrirPantallaCompleta} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-bold text-white"><Maximize2 className="h-4 w-4" /> <span className="hidden sm:inline">Pantalla completa</span></button>
          </div>
          <div className="relative w-full overflow-hidden bg-black">{presentacion}</div>
          <p className="mx-auto mt-3 max-w-xl px-4 text-center text-xs leading-5 text-slate-500">En teléfono puedes girar el dispositivo. VIDA conserva la proporción de la diapositiva y se adapta al espacio disponible.</p>
        </section>
      ) : (
        <section className="w-full bg-white pb-16">
          <article className="w-full overflow-hidden bg-white">
            <header className="bg-gradient-to-br from-indigo-800 via-violet-800 to-slate-950 px-6 py-9 text-white sm:px-10 sm:py-12">
              <div className="flex items-center gap-2 text-indigo-200"><Church className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Vida Internacional</span></div>
              <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">{material.titulo}</h1>
              {material.descripcion_publica && <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-white/80 sm:text-lg">{textoNota(material.descripcion_publica)}</p>}
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/80"><span className="rounded-full bg-white/10 px-3 py-1.5">{etiquetaAudiencia(material.audiencia)}</span>{fecha && <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><CalendarDays className="h-3.5 w-3.5" />{fecha}</span>}</div>
              {userId && <button type="button" onClick={guardarPaqueteEnCuaderno} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-indigo-800"><Send className="h-4 w-4" /> Enviar paquete al Cuaderno</button>}
            </header>

            <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-12">
              {lecturaDiapositivas.length > 0 && (
                <section aria-labelledby="estudio-diapositivas">
                  <div className="flex items-center gap-2 text-indigo-700"><BookOpenText className="h-5 w-5" /><h2 id="estudio-diapositivas" className="text-xl font-bold">Estudio por diapositivas</h2></div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Desliza hacia abajo para leer todo el contenido del paquete en orden.</p>
                  <div className="mt-5 space-y-4">
                    {lecturaDiapositivas.map((diapositiva) => (
                      <article key={diapositiva.numero} className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/55">
                        <div className="border-b border-slate-200/80 px-5 py-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">Diapositiva {diapositiva.numero}</span>
                        </div>
                        <div className="space-y-4 px-5 py-5">
                          {diapositiva.textos.map((texto, textIndex) => textIndex === 0
                            ? <h3 key={`${diapositiva.numero}-${textIndex}`} className="whitespace-pre-wrap text-xl font-bold leading-7 text-slate-950">{texto}</h3>
                            : <p key={`${diapositiva.numero}-${textIndex}`} className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{texto}</p>)}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {bosquejo && <section><div className="flex items-center gap-2 text-indigo-700"><BookOpenText className="h-5 w-5" /><h2 className="text-lg font-bold">Mensaje principal</h2></div><div className="mt-4 rounded-2xl bg-indigo-50 p-5 sm:p-6"><h3 className="text-2xl font-bold text-slate-950">{textoNota(bosquejo.titulo) || material.titulo}</h3>{bosquejo.pasaje_base && <p className="mt-2 font-semibold text-amber-700">{textoNota(bosquejo.pasaje_base)}</p>}{bosquejo.proposito && <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-700">{textoNota(bosquejo.proposito)}</p>}</div></section>}

              {versiculos.length > 0 && <section><h2 className="text-xl font-bold text-slate-950">Versículos para estudiar</h2><div className="mt-4 space-y-4">{versiculos.map((versiculo, index) => <article key={`${versiculo.referencia}-${index}`} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><p className="font-bold text-indigo-700">{textoNota(versiculo.referencia)} {versiculo.traduccion && <span className="text-xs font-normal text-slate-400">{textoNota(versiculo.traduccion)}</span>}</p><button type="button" onClick={() => guardarNota(`${textoNota(versiculo.referencia) || 'Versículo'} · ${material.titulo}`, textoNota(versiculo.texto), textoNota(versiculo.referencia))} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[11px] font-bold text-slate-600"><NotebookPen className="h-3.5 w-3.5" /> Cuaderno</button></div><p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-700">{textoNota(versiculo.texto)}</p></article>)}</div></section>}

              {bosquejo?.introduccion && <section><h2 className="text-xl font-bold text-slate-950">Introducción</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{textoNota(bosquejo.introduccion)}</p></section>}
              {puntos.length > 0 && <section><h2 className="text-xl font-bold text-slate-950">Desarrollo</h2><div className="mt-5 space-y-7">{puntos.map((punto, index) => <article key={index}><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Punto {index + 1}</p><h3 className="mt-1 text-xl font-bold text-slate-900">{textoNota(punto.titulo) || `Punto ${index + 1}`}</h3>{punto.contenido && <p className="mt-2 whitespace-pre-wrap text-base leading-8 text-slate-700">{textoNota(punto.contenido)}</p>}</article>)}</div></section>}
              {bosquejo?.conclusion && <section><h2 className="text-xl font-bold text-slate-950">Conclusión</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{textoNota(bosquejo.conclusion)}</p></section>}
              {material.instrucciones && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6"><h2 className="text-lg font-bold text-amber-900">Aplicación para la semana</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-amber-950/80">{textoNota(material.instrucciones)}</p></section>}
            </div>
          </article>
        </section>
      )}

      {presentando && <div ref={presentacionRef} className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden overscroll-none bg-black"><button type="button" onClick={cerrarPantallaCompleta} className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-30 grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm" aria-label="Salir de pantalla completa"><Minimize2 className="h-5 w-5" /></button>{presentacion}</div>}
    </main>
  )
}
