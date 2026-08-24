'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

type Plantilla = 'limpia' | 'titulo' | 'imagen' | 'versiculo'
type Alineacion = 'izquierda' | 'centro' | 'derecha'
type Tamano = 'compacto' | 'normal' | 'grande'
type FormatoLienzo = '16:9' | '9:16' | '4:3' | '1:1'
type FondoModo = 'color' | 'tema' | 'imagen'
type TemaFondo = 'claro' | 'amanecer' | 'cielo' | 'bosque' | 'noche' | 'vino'
type TipoElemento = 'texto' | 'imagen' | 'versiculo'
type AjusteImagen = 'cover' | 'contain'

type ElementoCanvas = {
  id: string
  tipo: TipoElemento
  x: number
  y: number
  w: number
  h: number
  z: number
  contenido?: string
  recurso_id?: string | null
  rol?: 'titulo' | 'cuerpo' | 'libre'
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

type Diapositiva = {
  titulo: string
  contenido: string
  recurso_id: string | null
  plantilla: Plantilla
  fondo: string
  color_texto: string
  alineacion: Alineacion
  tamano: Tamano
  formato: FormatoLienzo
  fondo_modo: FondoModo
  fondo_tema: TemaFondo
  fondo_recurso_id: string | null
  elementos: ElementoCanvas[]
}

const FUENTES = new Set(['Inter', 'Arial', 'Georgia', 'Trebuchet MS', 'Times New Roman', 'Courier New'])
const TEMAS = new Set<TemaFondo>(['claro', 'amanecer', 'cielo', 'bosque', 'noche', 'vino'])

async function contextoPastoral() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Tu sesión expiró.' }
  const { data: profile } = await (supabase as any).from('profiles').select('rol, estado_cuenta, acceso_centro_pastoral').eq('id', user.id).single()
  if (!tieneAccesoPastoral(profile as any)) return { supabase, user, error: 'No tienes permiso para administrar proyectos pastorales.' }
  return { supabase, user, error: null }
}

function texto(formData: FormData, campo: string, maximo: number) { return String(formData.get(campo) ?? '').trim().slice(0, maximo) }
function uuidOpcional(valor: FormDataEntryValue | null) { const value = String(valor ?? '').trim(); return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null }
function estadoValido(valor: string) { return ['borrador', 'listo', 'compartido'].includes(valor) ? valor : 'borrador' }
function plantillaValida(valor: FormDataEntryValue | undefined): Plantilla { const value = String(valor ?? '').trim(); return ['limpia', 'titulo', 'imagen', 'versiculo'].includes(value) ? value as Plantilla : 'limpia' }
function alineacionValida(valor: unknown): Alineacion { const value = String(valor ?? '').trim(); return ['izquierda', 'centro', 'derecha'].includes(value) ? value as Alineacion : 'izquierda' }
function tamanoValido(valor: FormDataEntryValue | undefined): Tamano { const value = String(valor ?? '').trim(); return ['compacto', 'normal', 'grande'].includes(value) ? value as Tamano : 'normal' }
function formatoValido(valor: FormDataEntryValue | undefined): FormatoLienzo { const value = String(valor ?? '').trim(); return ['16:9', '9:16', '4:3', '1:1'].includes(value) ? value as FormatoLienzo : '16:9' }
function fondoModoValido(valor: FormDataEntryValue | undefined): FondoModo { const value = String(valor ?? '').trim(); return ['color', 'tema', 'imagen'].includes(value) ? value as FondoModo : 'color' }
function temaFondoValido(valor: FormDataEntryValue | undefined): TemaFondo { const value = String(valor ?? '').trim() as TemaFondo; return TEMAS.has(value) ? value : 'claro' }
function colorValido(valor: unknown, fallback: string) { const value = String(valor ?? '').trim(); return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback }
function numeroAcotado(valor: unknown, min: number, max: number, fallback: number) { const numero = Number(valor); return Number.isFinite(numero) ? Math.min(Math.max(numero, min), max) : fallback }
function recursosDesdeFormulario(formData: FormData) { return Array.from(new Set(formData.getAll('recurso_ids').map((valor) => uuidOpcional(valor)).filter(Boolean))).slice(0, 30) as string[] }

function elementosValidos(valor: FormDataEntryValue | undefined): ElementoCanvas[] {
  let items: unknown = []
  try { items = JSON.parse(String(valor ?? '[]')) } catch { items = [] }
  if (!Array.isArray(items)) return []

  return items.slice(0, 60).flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object') return []
    const item = raw as Record<string, unknown>
    const tipo: TipoElemento = item.tipo === 'imagen' || item.tipo === 'versiculo' ? item.tipo : 'texto'
    const id = String(item.id ?? '').trim().slice(0, 80) || `elemento-${index + 1}`
    const recursoId = tipo === 'imagen' ? uuidOpcional(String(item.recurso_id ?? '')) : null
    if (tipo === 'imagen' && !recursoId) return []
    const rol = item.rol === 'titulo' || item.rol === 'cuerpo' ? item.rol : 'libre'
    const fuente = FUENTES.has(String(item.fuente ?? '')) ? String(item.fuente) : 'Inter'
    const ajuste: AjusteImagen = item.ajuste === 'contain' ? 'contain' : 'cover'
    return [{
      id,
      tipo,
      x: numeroAcotado(item.x, 0, 97, 8),
      y: numeroAcotado(item.y, 0, 97, 8),
      w: numeroAcotado(item.w, 5, 100, 84),
      h: numeroAcotado(item.h, 5, 100, tipo === 'imagen' ? 48 : 20),
      z: numeroAcotado(item.z, 0, 200, index + 1),
      contenido: tipo === 'imagen' ? undefined : String(item.contenido ?? '').slice(0, 7000),
      recurso_id: recursoId,
      rol,
      fuente,
      tamano_fuente: numeroAcotado(item.tamano_fuente, 10, 96, tipo === 'versiculo' ? 30 : 24),
      color: colorValido(item.color, '#0f172a'),
      alineacion: alineacionValida(item.alineacion),
      peso: numeroAcotado(item.peso, 300, 900, rol === 'titulo' ? 800 : 500),
      cursiva: Boolean(item.cursiva),
      subrayado: Boolean(item.subrayado),
      tachado: Boolean(item.tachado),
      interlineado: numeroAcotado(item.interlineado, 0.9, 2, 1.25),
      opacidad: numeroAcotado(item.opacidad, 0.1, 1, 1),
      ajuste,
      radio: numeroAcotado(item.radio, 0, 40, 14),
    } satisfies ElementoCanvas]
  })
}

function diapositivasDesdeFormulario(formData: FormData): Diapositiva[] {
  const titulos = formData.getAll('diapositiva_titulo')
  const contenidos = formData.getAll('diapositiva_contenido')
  const recursos = formData.getAll('diapositiva_recurso_id')
  const plantillas = formData.getAll('diapositiva_plantilla')
  const fondos = formData.getAll('diapositiva_fondo')
  const colores = formData.getAll('diapositiva_color_texto')
  const alineaciones = formData.getAll('diapositiva_alineacion')
  const tamanos = formData.getAll('diapositiva_tamano')
  const formatos = formData.getAll('diapositiva_formato')
  const fondosModo = formData.getAll('diapositiva_fondo_modo')
  const fondosTema = formData.getAll('diapositiva_fondo_tema')
  const fondosRecurso = formData.getAll('diapositiva_fondo_recurso_id')
  const elementos = formData.getAll('diapositiva_elementos')

  return titulos.map((valor, index) => ({
    titulo: String(valor).trim().slice(0, 160),
    contenido: String(contenidos[index] ?? '').trim().slice(0, 12000),
    recurso_id: uuidOpcional(recursos[index] ?? null),
    plantilla: plantillaValida(plantillas[index]),
    fondo: colorValido(fondos[index], '#ffffff'),
    color_texto: colorValido(colores[index], '#0f172a'),
    alineacion: alineacionValida(alineaciones[index]),
    tamano: tamanoValido(tamanos[index]),
    formato: formatoValido(formatos[index]),
    fondo_modo: fondoModoValido(fondosModo[index]),
    fondo_tema: temaFondoValido(fondosTema[index]),
    fondo_recurso_id: uuidOpcional(fondosRecurso[index] ?? null),
    elementos: elementosValidos(elementos[index]),
  })).filter((item) => item.titulo || item.contenido || item.recurso_id || item.fondo_recurso_id || item.elementos.length).slice(0, 50)
}

export async function listarPaquetesPastoralesParaNotas() {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false as const, paquetes: [] as Array<{ id: string; titulo: string }>, error }
  const { data, error: queryError } = await (supabase as any).from('pastoral_paquetes').select('id, titulo').eq('profile_id', user.id).order('updated_at', { ascending: false }).limit(50)
  if (queryError) return { success: false as const, paquetes: [] as Array<{ id: string; titulo: string }>, error: 'No se pudieron cargar los proyectos.' }
  return { success: true as const, paquetes: (data ?? []) as Array<{ id: string; titulo: string }> }
}

export async function crearPaquetePastoral(formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }
  const titulo = texto(formData, 'titulo', 140)
  if (!titulo) return { success: false, error: 'Escribe un título para el proyecto.' }
  const { data, error: insertError } = await (supabase as any).from('pastoral_paquetes').insert({
    profile_id: user.id, titulo, descripcion_publica: texto(formData, 'descripcion_publica', 2000), instrucciones: texto(formData, 'instrucciones', 3000), notas_privadas: texto(formData, 'notas_privadas', 12000), bosquejo_id: uuidOpcional(formData.get('bosquejo_id')), coleccion_id: uuidOpcional(formData.get('coleccion_id')), recurso_ids: recursosDesdeFormulario(formData), presentacion_diapositivas: diapositivasDesdeFormulario(formData), presentacion_pdf_recurso_id: uuidOpcional(formData.get('presentacion_pdf_recurso_id')), estado: estadoValido(texto(formData, 'estado', 20)),
  }).select('id').single()
  if (insertError || !data) return { success: false, error: 'No se pudo crear el proyecto pastoral.' }
  revalidatePath('/pastoral'); revalidatePath('/pastoral/paquetes')
  return { success: true, id: data.id as string }
}

export async function editarPaquetePastoral(id: string, formData: FormData) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }
  const titulo = texto(formData, 'titulo', 140)
  if (!titulo) return { success: false, error: 'El título es obligatorio.' }
  const { error: updateError } = await (supabase as any).from('pastoral_paquetes').update({
    titulo, descripcion_publica: texto(formData, 'descripcion_publica', 2000), instrucciones: texto(formData, 'instrucciones', 3000), notas_privadas: texto(formData, 'notas_privadas', 12000), bosquejo_id: uuidOpcional(formData.get('bosquejo_id')), coleccion_id: uuidOpcional(formData.get('coleccion_id')), recurso_ids: recursosDesdeFormulario(formData), presentacion_diapositivas: diapositivasDesdeFormulario(formData), presentacion_pdf_recurso_id: uuidOpcional(formData.get('presentacion_pdf_recurso_id')), estado: estadoValido(texto(formData, 'estado', 20)), updated_at: new Date().toISOString(),
  }).eq('id', id).eq('profile_id', user.id)
  if (updateError) return { success: false, error: 'No se pudo guardar el proyecto pastoral.' }
  revalidatePath('/pastoral'); revalidatePath('/pastoral/paquetes'); revalidatePath(`/pastoral/paquetes/${id}`)
  return { success: true }
}

export async function eliminarPaquetePastoral(id: string) {
  const { supabase, user, error } = await contextoPastoral()
  if (error || !user) return { success: false, error: error ?? 'No autorizado.' }
  const { error: deleteError } = await (supabase as any).from('pastoral_paquetes').delete().eq('id', id).eq('profile_id', user.id)
  if (deleteError) return { success: false, error: 'No se pudo eliminar el proyecto pastoral.' }
  revalidatePath('/pastoral'); revalidatePath('/pastoral/paquetes')
  return { success: true }
}
