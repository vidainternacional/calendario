export type Plantilla = 'limpia' | 'titulo' | 'imagen' | 'versiculo'
export type Alineacion = 'izquierda' | 'centro' | 'derecha'
export type Tamano = 'compacto' | 'normal' | 'grande'
export type FormatoLienzo = '16:9' | '9:16' | '4:3' | '1:1'
export type FondoModo = 'color' | 'tema' | 'imagen'
export type TemaFondo = 'claro' | 'amanecer' | 'cielo' | 'bosque' | 'noche' | 'vino'
export type TipoElemento = 'texto' | 'imagen' | 'versiculo'
export type RolTexto = 'titulo' | 'subtitulo' | 'cuerpo' | 'libre'
export type AjusteImagen = 'cover' | 'contain'
export type PanelLienzo = 'fondo' | 'texto' | 'parrafo' | 'recursos' | 'biblia' | 'diseno' | null
export type VistaLienzo = 'contenido' | 'presentacion' | 'congregacion' | 'publicar'

export type ElementoCanvas = {
  id: string
  tipo: TipoElemento
  x: number
  y: number
  w: number
  h: number
  z: number
  contenido?: string
  recurso_id?: string | null
  rol?: RolTexto
  fuente?: string
  tamano_fuente?: number
  color?: string
  alineacion?: Alineacion
  peso?: number
  cursiva?: boolean
  subrayado?: boolean
  tachado?: boolean
  interlineado?: number
  opacidad?: number
  ajuste?: AjusteImagen
  radio?: number
}

export type DiapositivaCanvas = {
  titulo: string
  contenido: string
  recurso_id: string | null
  plantilla?: Plantilla
  fondo?: string
  color_texto?: string
  alineacion?: Alineacion
  tamano?: Tamano
  formato?: FormatoLienzo
  fondo_modo?: FondoModo
  fondo_tema?: TemaFondo
  fondo_recurso_id?: string | null
  elementos?: ElementoCanvas[]
}

export type RecursoPastoral = {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  tipo: 'archivo' | 'enlace'
  acceso_url: string | null
  mime_type?: string | null
  nombre_archivo?: string | null
}

/* Selector visible del editor: familias deliberadamente distintas entre sí.
   Se conservan las fuentes históricas en compatibilidad para no alterar proyectos ya guardados. */
export const FUENTES_PASTORALES = [
  'Inter', 'Avenir Next', 'Futura', 'Helvetica Neue', 'Trebuchet MS', 'Arial Black',
  'Didot', 'Baskerville', 'Georgia', 'Palatino Linotype', 'Garamond', 'Times New Roman',
  'Courier New', 'Lucida Console', 'Impact',
] as const

const FUENTES_PASTORALES_COMPATIBLES = new Set<string>([
  ...FUENTES_PASTORALES,
  'Arial', 'Helvetica', 'Verdana', 'Tahoma',
])

export const ESTILOS_TEXTO: Array<{ id: RolTexto; label: string; pt: number; peso: number }> = [
  { id: 'titulo', label: 'Título', pt: 54, peso: 800 },
  { id: 'subtitulo', label: 'Subtítulo', pt: 34, peso: 700 },
  { id: 'cuerpo', label: 'Cuerpo', pt: 22, peso: 500 },
  { id: 'libre', label: 'Libre', pt: 28, peso: 500 },
]

export const FORMATOS_LIENZO: Array<{ id: FormatoLienzo; label: string; detalle: string }> = [
  { id: '16:9', label: 'Horizontal', detalle: '16:9' },
  { id: '9:16', label: 'Vertical', detalle: '9:16' },
  { id: '4:3', label: 'Proyector', detalle: '4:3' },
  { id: '1:1', label: 'Cuadrado', detalle: '1:1' },
]
export const TEMAS_LIENZO: Array<{ id: TemaFondo; label: string; css: string; texto: string }> = [
  { id: 'claro', label: 'Claro', css: 'linear-gradient(145deg,#ffffff 0%,#f8fafc 100%)', texto: '#0f172a' },
  { id: 'amanecer', label: 'Amanecer', css: 'linear-gradient(135deg,#fff7ed 0%,#fde68a 48%,#fca5a5 100%)', texto: '#431407' },
  { id: 'cielo', label: 'Cielo', css: 'linear-gradient(145deg,#e0f2fe 0%,#bae6fd 45%,#c4b5fd 100%)', texto: '#172554' },
  { id: 'bosque', label: 'Bosque', css: 'linear-gradient(145deg,#052e16 0%,#14532d 50%,#365314 100%)', texto: '#f7fee7' },
  { id: 'noche', label: 'Noche', css: 'linear-gradient(145deg,#020617 0%,#172554 52%,#312e81 100%)', texto: '#f8fafc' },
  { id: 'vino', label: 'Vino', css: 'linear-gradient(145deg,#4c0519 0%,#881337 52%,#312e81 100%)', texto: '#fff1f2' },
]

export const clamp = (valor: number, min: number, max: number) => Math.min(Math.max(valor, min), max)
export const clonar = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T
export const nuevoIdCanvas = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `el-${Date.now()}-${Math.random().toString(36).slice(2)}`

export function escaparHtmlCanvas(valor: string) {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export function limpiarHtmlCanvas(html: string) {
  const basico = String(html ?? '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  if (typeof window === 'undefined') return basico.replace(/<(?!\/?(?:p|br|div|strong|b|em|i|u|s|ul|ol|li|blockquote|h[1-3])\b)[^>]*>/gi, '')
  const permitidos = new Set(['P', 'BR', 'DIV', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3'])
  const contenedor = document.createElement('div')
  contenedor.innerHTML = basico
  const recorrer = (nodo: Node) => Array.from(nodo.childNodes).forEach((hijo) => {
    if (hijo.nodeType !== Node.ELEMENT_NODE) return
    const elemento = hijo as HTMLElement
    if (!permitidos.has(elemento.tagName)) { elemento.replaceWith(...Array.from(elemento.childNodes)); return }
    Array.from(elemento.attributes).forEach((atributo) => elemento.removeAttribute(atributo.name))
    recorrer(elemento)
  })
  recorrer(contenedor)
  return contenedor.innerHTML
}

function rolTextoValido(rol: unknown): RolTexto {
  return rol === 'titulo' || rol === 'subtitulo' || rol === 'cuerpo' ? rol : 'libre'
}

export function normalizarElementoCanvas(item: Partial<ElementoCanvas>, index = 0): ElementoCanvas {
  const tipo: TipoElemento = item.tipo === 'imagen' || item.tipo === 'versiculo' ? item.tipo : 'texto'
  const rol = rolTextoValido(item.rol)
  const estilo = ESTILOS_TEXTO.find((opcion) => opcion.id === rol) ?? ESTILOS_TEXTO[3]
  const fuenteGuardada = String(item.fuente ?? '')
  return {
    id: String(item.id || nuevoIdCanvas()), tipo,
    x: clamp(Number(item.x ?? 8), 0, 97), y: clamp(Number(item.y ?? 8), 0, 97),
    w: clamp(Number(item.w ?? 84), 5, 100), h: clamp(Number(item.h ?? (tipo === 'imagen' ? 48 : 20)), 5, 100),
    z: clamp(Number(item.z ?? index + 1), 0, 200),
    contenido: tipo === 'imagen' ? undefined : limpiarHtmlCanvas(String(item.contenido ?? '')),
    recurso_id: tipo === 'imagen' ? item.recurso_id ?? null : undefined,
    rol, fuente: FUENTES_PASTORALES_COMPATIBLES.has(fuenteGuardada) ? fuenteGuardada : 'Inter',
    tamano_fuente: clamp(Number(item.tamano_fuente ?? (tipo === 'versiculo' ? 30 : estilo.pt)), 8, 160),
    color: /^#[0-9a-f]{6}$/i.test(String(item.color ?? '')) ? item.color : '#0f172a',
    alineacion: item.alineacion === 'centro' || item.alineacion === 'derecha' ? item.alineacion : 'izquierda',
    peso: clamp(Number(item.peso ?? estilo.peso), 300, 900),
    cursiva: Boolean(item.cursiva), subrayado: Boolean(item.subrayado), tachado: Boolean(item.tachado),
    interlineado: clamp(Number(item.interlineado ?? 1.25), .9, 2), opacidad: clamp(Number(item.opacidad ?? 1), .1, 1),
    ajuste: item.ajuste === 'contain' ? 'contain' : 'cover', radio: clamp(Number(item.radio ?? 14), 0, 40),
  }
}

export function normalizarPaginaCanvas(item: DiapositivaCanvas): DiapositivaCanvas {
  const elementos = Array.isArray(item.elementos) ? item.elementos.map((el, i) => normalizarElementoCanvas(el, i)) : []
  if (!elementos.length && item.titulo) elementos.push(normalizarElementoCanvas({ tipo: 'texto', rol: 'titulo', contenido: escaparHtmlCanvas(item.titulo), x: 8, y: 8, w: 84, h: 20, tamano_fuente: 54, color: item.color_texto, alineacion: item.alineacion, peso: 800 }, 0))
  if (!elementos.length && item.contenido) elementos.push(normalizarElementoCanvas({ tipo: 'texto', rol: 'cuerpo', contenido: limpiarHtmlCanvas(item.contenido), x: 8, y: 16, w: 84, h: 68, tamano_fuente: 22, color: item.color_texto, alineacion: item.alineacion }, 1))
  else if (item.contenido && !elementos.some((el) => el.rol === 'cuerpo')) elementos.push(normalizarElementoCanvas({ tipo: 'texto', rol: 'cuerpo', contenido: limpiarHtmlCanvas(item.contenido), x: 8, y: 30, w: 84, h: 55, tamano_fuente: 22, color: item.color_texto, alineacion: item.alineacion }, elementos.length))
  return { ...item, formato: item.formato ?? '16:9', fondo_modo: item.fondo_modo ?? (item.fondo_recurso_id || item.recurso_id ? 'imagen' : 'color'), fondo_tema: item.fondo_tema ?? 'claro', fondo_recurso_id: item.fondo_recurso_id ?? item.recurso_id ?? null, fondo: item.fondo ?? '#ffffff', color_texto: item.color_texto ?? '#0f172a', plantilla: item.plantilla ?? 'limpia', alineacion: item.alineacion ?? 'izquierda', tamano: item.tamano ?? 'normal', elementos }
}

export function nuevaPaginaCanvas(): DiapositivaCanvas {
  return normalizarPaginaCanvas({ titulo: '', contenido: '', recurso_id: null, formato: '16:9', fondo_modo: 'color', fondo_tema: 'claro', fondo: '#ffffff', elementos: [] })
}

export function aspectoLienzo(formato: FormatoLienzo | undefined) {
  if (formato === '9:16') return '9 / 16'
  if (formato === '4:3') return '4 / 3'
  if (formato === '1:1') return '1 / 1'
  return '16 / 9'
}
