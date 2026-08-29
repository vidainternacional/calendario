import { FUENTES_PASTORALES, clamp, type Alineacion } from '@/components/pastoral/pastoral-canvas-model'
import { PLANTILLAS_VISUALES, type PlantillaVisual } from '@/components/pastoral/pastoral-editor-presets'

export type RolPlantillaAdministrada = 'titulo' | 'subtitulo' | 'cuerpo'

export type CajaPlantillaAdministrada = {
  x: number
  y: number
  w: number
  h: number
  pt: number
  alineacion: Alineacion
  fuente: string
  interlineado: number
}

export type PlantillaAdministrada = {
  id: string
  nombre: string
  categoria: 'Cristianas' | 'Minimalistas' | 'Generales'
  activa: boolean
  orden: number
  fondo: string
  colorTexto: string
  muestras: Record<RolPlantillaAdministrada, string>
  titulo: CajaPlantillaAdministrada
  subtitulo: CajaPlantillaAdministrada
  cuerpo: CajaPlantillaAdministrada
}

const ESCALA_EDITOR_PLANTILLA = 0.56
const MARGEN_SEGURO_CANVAS = 4
const MAX_PT_POR_ROL: Record<RolPlantillaAdministrada, number> = {
  titulo: 42,
  subtitulo: 28,
  cuerpo: 22,
}
const FUENTES_EXTRA = new Set([
  'var(--font-pastoral-eb-garamond)',
  'var(--font-pastoral-montserrat)',
  'var(--font-pastoral-playfair-display)',
  'var(--font-pastoral-bebas-neue)',
])
const FUENTES_VALIDAS = new Set<string>([...FUENTES_PASTORALES, ...FUENTES_EXTRA])
const CATEGORIAS = new Set(['Cristianas', 'Minimalistas', 'Generales'])

const MUESTRA_CUERPO = 'Este es un texto de ejemplo\npara visualizar la composición\nde esta plantilla.'

const copiar = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T
const textoSeguro = (valor: unknown, max: number, fallback: string) => {
  const texto = String(valor ?? '').replace(/\u0000/g, '').trim().slice(0, max)
  return texto || fallback
}
const colorSeguro = (valor: unknown, fallback: string) => /^#[0-9a-f]{6}$/i.test(String(valor ?? '')) ? String(valor) : fallback
const fondoSeguro = (valor: unknown, fallback: string) => {
  const fondo = String(valor ?? '').trim().slice(0, 900)
  if (!fondo || /url\s*\(/i.test(fondo) || /[;{}]/.test(fondo)) return fallback
  if (/^#[0-9a-f]{6}$/i.test(fondo)) return fondo
  if (/^(?:linear-gradient|radial-gradient|repeating-linear-gradient)\(.+\)$/i.test(fondo)) return fondo
  return fallback
}
const alineacionSegura = (valor: unknown): Alineacion => valor === 'izquierda' || valor === 'derecha' || valor === 'justificado' ? valor : 'centro'
const fuenteSegura = (valor: unknown, fallback = 'Inter') => FUENTES_VALIDAS.has(String(valor ?? '')) ? String(valor) : fallback

function cajaSegura(valor: any, fallback: CajaPlantillaAdministrada, rol: RolPlantillaAdministrada): CajaPlantillaAdministrada {
  const limitePosicion = 100 - MARGEN_SEGURO_CANVAS - 6
  const x = clamp(Number(valor?.x ?? fallback.x), MARGEN_SEGURO_CANVAS, limitePosicion)
  const y = clamp(Number(valor?.y ?? fallback.y), MARGEN_SEGURO_CANVAS, limitePosicion)
  const limiteDerecho = 100 - MARGEN_SEGURO_CANVAS - x
  const limiteInferior = 100 - MARGEN_SEGURO_CANVAS - y
  return {
    x,
    y,
    w: clamp(Number(valor?.w ?? fallback.w), 6, limiteDerecho),
    h: clamp(Number(valor?.h ?? fallback.h), 6, limiteInferior),
    pt: clamp(Number(valor?.pt ?? fallback.pt), 8, MAX_PT_POR_ROL[rol]),
    alineacion: alineacionSegura(valor?.alineacion ?? fallback.alineacion),
    fuente: fuenteSegura(valor?.fuente, fallback.fuente),
    interlineado: Math.round(clamp(Number(valor?.interlineado ?? fallback.interlineado), .8, 2) * 100) / 100,
  }
}

function cajaBase(rol: RolPlantillaAdministrada, plantilla: PlantillaVisual): CajaPlantillaAdministrada {
  const layout = rol === 'titulo' ? plantilla.titulo : rol === 'subtitulo' ? plantilla.subtitulo : plantilla.cuerpo
  const fuenteFallback = layout?.fuente ?? (rol === 'titulo' ? plantilla.titulo.fuente : 'Inter')
  const interlineado = rol === 'titulo' ? 1.05 : rol === 'subtitulo' ? 1.12 : 1.2
  if (!layout) {
    if (rol === 'subtitulo') return { x: 12, y: 34, w: 76, h: 12, pt: 28, alineacion: 'centro', fuente: fuenteFallback, interlineado }
    return { x: 14, y: 50, w: 72, h: 30, pt: 22, alineacion: 'centro', fuente: fuenteFallback, interlineado }
  }
  return {
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
    pt: clamp(Math.round(layout.pt), 8, MAX_PT_POR_ROL[rol]),
    alineacion: layout.alineacion,
    fuente: fuenteFallback,
    interlineado,
  }
}

const PLANTILLAS_BASE: PlantillaAdministrada[] = PLANTILLAS_VISUALES.map((plantilla, orden) => ({
  id: plantilla.id,
  nombre: plantilla.nombre,
  categoria: plantilla.categoria,
  activa: true,
  orden,
  fondo: plantilla.fondo,
  colorTexto: plantilla.colorTexto,
  muestras: {
    titulo: plantilla.nombre,
    subtitulo: 'Subtítulo de ejemplo',
    cuerpo: MUESTRA_CUERPO,
  },
  titulo: cajaBase('titulo', plantilla),
  subtitulo: cajaBase('subtitulo', plantilla),
  cuerpo: cajaBase('cuerpo', plantilla),
}))

const IDS_BASE = new Set(PLANTILLAS_BASE.map((item) => item.id))

export function esPlantillaBase(id: string) {
  return IDS_BASE.has(id)
}

function normalizarUna(valor: any, fallback?: PlantillaAdministrada, indice = 0): PlantillaAdministrada | null {
  const id = textoSeguro(valor?.id, 80, fallback?.id ?? '')
  if (!id || !/^[a-z0-9][a-z0-9-]{1,79}$/i.test(id)) return null
  const base = fallback ?? {
    id,
    nombre: 'Nueva plantilla',
    categoria: 'Generales' as const,
    activa: true,
    orden: indice,
    fondo: '#ffffff',
    colorTexto: '#0f172a',
    muestras: { titulo: 'Título de ejemplo', subtitulo: 'Subtítulo de ejemplo', cuerpo: MUESTRA_CUERPO },
    titulo: { x: 10, y: 12, w: 80, h: 18, pt: 42, alineacion: 'centro' as Alineacion, fuente: 'Inter', interlineado: 1.05 },
    subtitulo: { x: 12, y: 34, w: 76, h: 12, pt: 28, alineacion: 'centro' as Alineacion, fuente: 'Inter', interlineado: 1.12 },
    cuerpo: { x: 14, y: 50, w: 72, h: 30, pt: 22, alineacion: 'centro' as Alineacion, fuente: 'Inter', interlineado: 1.2 },
  }
  const categoria = CATEGORIAS.has(String(valor?.categoria ?? '')) ? valor.categoria : base.categoria
  return {
    id,
    nombre: textoSeguro(valor?.nombre, 80, base.nombre),
    categoria,
    activa: valor?.activa !== false,
    orden: Math.max(0, Math.round(Number(valor?.orden ?? base.orden ?? indice))),
    fondo: fondoSeguro(valor?.fondo, base.fondo),
    colorTexto: colorSeguro(valor?.colorTexto, base.colorTexto),
    muestras: {
      titulo: textoSeguro(valor?.muestras?.titulo, 180, base.muestras.titulo),
      subtitulo: textoSeguro(valor?.muestras?.subtitulo, 220, base.muestras.subtitulo),
      cuerpo: textoSeguro(valor?.muestras?.cuerpo, 700, base.muestras.cuerpo),
    },
    titulo: cajaSegura(valor?.titulo, base.titulo, 'titulo'),
    subtitulo: cajaSegura(valor?.subtitulo, base.subtitulo, 'subtitulo'),
    cuerpo: cajaSegura(valor?.cuerpo, base.cuerpo, 'cuerpo'),
  }
}

function leerCrudo(valor: unknown): unknown[] {
  if (Array.isArray(valor)) return valor
  if (typeof valor === 'string') {
    try { const parsed = JSON.parse(valor); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
  }
  return []
}

export function combinarPlantillasAdministradas(valor: unknown): PlantillaAdministrada[] {
  const guardadas = leerCrudo(valor).slice(0, 180)
  const porId = new Map<string, any>()
  guardadas.forEach((item: any) => { if (item && typeof item.id === 'string') porId.set(item.id, item) })

  const base = PLANTILLAS_BASE.map((item, indice) => normalizarUna(porId.get(item.id) ?? item, item, indice) ?? copiar(item))
  const extras = guardadas
    .filter((item: any) => item && typeof item.id === 'string' && !IDS_BASE.has(item.id))
    .map((item: any, indice) => normalizarUna(item, undefined, base.length + indice))
    .filter(Boolean) as PlantillaAdministrada[]

  return [...base, ...extras]
    .sort((a, b) => (a.orden - b.orden) || a.nombre.localeCompare(b.nombre, 'es'))
    .map((item, orden) => ({ ...item, orden }))
}

export function normalizarCatalogoAdministradoParaGuardar(valor: unknown): PlantillaAdministrada[] {
  return combinarPlantillasAdministradas(valor).slice(0, 180)
}

export function crearPlantillaAdministrada(orden = 0): PlantillaAdministrada {
  const id = `admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  return normalizarUna({ id, orden }, undefined, orden) as PlantillaAdministrada
}

function aRuntime(item: PlantillaAdministrada): PlantillaVisual {
  const caja = (valor: CajaPlantillaAdministrada) => ({
    x: valor.x,
    y: valor.y,
    w: valor.w,
    h: valor.h,
    pt: Math.round(valor.pt / ESCALA_EDITOR_PLANTILLA),
    alineacion: valor.alineacion,
    fuente: valor.fuente,
  })
  const runtime = {
    id: item.id,
    nombre: item.nombre,
    categoria: item.categoria,
    fondo: item.fondo,
    colorTexto: item.colorTexto,
    titulo: caja(item.titulo),
    subtitulo: caja(item.subtitulo),
    cuerpo: caja(item.cuerpo),
  } as PlantillaVisual & { __vidaAdministrada?: boolean }
  runtime.__vidaAdministrada = true
  return runtime
}

export function aplicarCatalogoAdministrado(valor: unknown): PlantillaAdministrada[] {
  const catalogo = combinarPlantillasAdministradas(valor)
  const visibles = catalogo.filter((item) => item.activa)
  PLANTILLAS_VISUALES.splice(0, PLANTILLAS_VISUALES.length, ...visibles.map(aRuntime))
  return visibles
}