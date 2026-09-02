'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type PlanActionResult = {
  success?: boolean
  id?: string
  error?: string
}

type GestionError = { error: string }
type GestionContext = { supabase: any; user: { id: string }; rol: string }
type GestionPlanContext = GestionContext & { plan: any }

type PlanInput = {
  titulo: string
  descripcion: string
  duracionDias: number
}

type DiaInput = {
  numeroDia: number
  titulo: string
  bookCode: string
  bookName: string
  chapter: number
  verseStart?: number | null
  verseEnd?: number | null
  referencia: string
  devocional: string
  preguntaReflexion: string
}

function texto(value: unknown) {
  return String(value ?? '').trim()
}

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'plan'
}

async function contextoGestion(): Promise<GestionContext | GestionError> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('rol, activo, estado_cuenta')
    .eq('id', user.id)
    .single()

  if (error || !profile) return { error: 'No fue posible verificar tus permisos.' }

  const rol = String(profile.rol ?? '')
  const autorizado = Boolean(profile.activo) && profile.estado_cuenta === 'activo' && (rol === 'pastor' || rol === 'administrador')
  if (!autorizado) return { error: 'No tienes permiso para administrar planes de lectura.' }

  return { supabase, user: { id: user.id }, rol }
}

async function puedeGestionar(planId: string): Promise<GestionPlanContext | GestionError> {
  const ctx = await contextoGestion()
  if ('error' in ctx) return ctx

  const { data: plan, error } = await (ctx.supabase as any)
    .from('planes_lectura')
    .select('id, creado_por, duracion_dias, publicado')
    .eq('id', planId)
    .maybeSingle()

  if (error || !plan) return { error: 'Plan no encontrado.' }
  if (ctx.rol !== 'administrador' && plan.creado_por !== ctx.user.id) {
    return { error: 'Solo puedes editar tus propios planes.' }
  }

  return { ...ctx, plan }
}

export async function crearPlanPastoral(input: PlanInput): Promise<PlanActionResult> {
  const ctx = await contextoGestion()
  if ('error' in ctx) return ctx

  const titulo = texto(input.titulo)
  const descripcion = texto(input.descripcion)
  const duracionDias = Number(input.duracionDias)

  if (!titulo) return { error: 'Escribe un título para el plan.' }
  if (!descripcion) return { error: 'Describe el objetivo del plan.' }
  if (!Number.isInteger(duracionDias) || duracionDias < 1 || duracionDias > 90) {
    return { error: 'La duración debe estar entre 1 y 90 días.' }
  }

  const id = `${slug(titulo)}-${randomUUID().slice(0, 8)}`
  const now = new Date().toISOString()
  const { error } = await (ctx.supabase as any)
    .from('planes_lectura')
    .insert({
      id,
      titulo,
      descripcion,
      duracion_dias: duracionDias,
      publicado: false,
      creado_por: ctx.user.id,
      created_at: now,
      updated_at: now,
    })

  if (error) {
    console.error('[planes-pastoral] crear plan', error)
    return { error: 'No se pudo crear el plan.' }
  }

  revalidatePath('/pastoral/planes')
  return { success: true, id }
}

export async function guardarPlanPastoral(planId: string, input: PlanInput): Promise<PlanActionResult> {
  const ctx = await puedeGestionar(planId)
  if ('error' in ctx) return ctx

  const titulo = texto(input.titulo)
  const descripcion = texto(input.descripcion)
  const duracionDias = Number(input.duracionDias)

  if (!titulo) return { error: 'Escribe un título para el plan.' }
  if (!descripcion) return { error: 'Describe el objetivo del plan.' }
  if (!Number.isInteger(duracionDias) || duracionDias < 1 || duracionDias > 90) {
    return { error: 'La duración debe estar entre 1 y 90 días.' }
  }

  const { data: ultimoDia } = await (ctx.supabase as any)
    .from('planes_lectura_dias')
    .select('numero_dia')
    .eq('plan_id', planId)
    .order('numero_dia', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (Number(ultimoDia?.numero_dia ?? 0) > duracionDias) {
    return { error: `El plan ya tiene contenido hasta el día ${ultimoDia.numero_dia}. Elimina primero los días que quedarían fuera de la nueva duración.` }
  }

  const { error } = await (ctx.supabase as any)
    .from('planes_lectura')
    .update({ titulo, descripcion, duracion_dias: duracionDias, updated_at: new Date().toISOString() })
    .eq('id', planId)

  if (error) {
    console.error('[planes-pastoral] guardar plan', error)
    return { error: 'No se pudieron guardar los cambios.' }
  }

  revalidatePath('/pastoral/planes')
  revalidatePath(`/pastoral/planes/${planId}`)
  revalidatePath('/hoy/planes')
  return { success: true }
}

export async function guardarDiaPlanPastoral(planId: string, input: DiaInput): Promise<PlanActionResult> {
  const ctx = await puedeGestionar(planId)
  if ('error' in ctx) return ctx

  const numeroDia = Number(input.numeroDia)
  const chapter = Number(input.chapter)
  const verseStart = input.verseStart == null || Number(input.verseStart) <= 0 ? null : Number(input.verseStart)
  const verseEnd = input.verseEnd == null || Number(input.verseEnd) <= 0 ? null : Number(input.verseEnd)

  if (!Number.isInteger(numeroDia) || numeroDia < 1 || numeroDia > Number(ctx.plan.duracion_dias)) {
    return { error: 'Día inválido para este plan.' }
  }
  if (!Number.isInteger(chapter) || chapter < 1) return { error: 'Capítulo inválido.' }
  if (verseStart != null && (!Number.isInteger(verseStart) || verseStart < 1)) return { error: 'Versículo inicial inválido.' }
  if (verseEnd != null && (!Number.isInteger(verseEnd) || verseEnd < 1)) return { error: 'Versículo final inválido.' }
  if (verseStart != null && verseEnd != null && verseEnd < verseStart) return { error: 'El versículo final no puede ser menor que el inicial.' }

  const titulo = texto(input.titulo)
  const bookCode = texto(input.bookCode)
  const bookName = texto(input.bookName)
  const referencia = texto(input.referencia)
  const devocional = texto(input.devocional)
  const preguntaReflexion = texto(input.preguntaReflexion)

  if (!titulo || !bookCode || !bookName || !referencia || !devocional || !preguntaReflexion) {
    return { error: 'Completa el título, lectura bíblica, devocional y pregunta de reflexión.' }
  }

  const { error } = await (ctx.supabase as any)
    .from('planes_lectura_dias')
    .upsert({
      plan_id: planId,
      numero_dia: numeroDia,
      titulo,
      book_code: bookCode,
      book_name: bookName,
      chapter,
      verse_start: verseStart,
      verse_end: verseEnd,
      referencia,
      devocional,
      pregunta_reflexion: preguntaReflexion,
    }, { onConflict: 'plan_id,numero_dia' })

  if (error) {
    console.error('[planes-pastoral] guardar día', error)
    return { error: 'No se pudo guardar este día.' }
  }

  revalidatePath(`/pastoral/planes/${planId}`)
  revalidatePath(`/hoy/planes/${planId}/${numeroDia}`)
  return { success: true }
}

export async function eliminarDiaPlanPastoral(planId: string, numeroDiaInput: number): Promise<PlanActionResult> {
  const ctx = await puedeGestionar(planId)
  if ('error' in ctx) return ctx

  const numeroDia = Number(numeroDiaInput)
  if (!Number.isInteger(numeroDia) || numeroDia < 1) return { error: 'Día inválido.' }
  if (ctx.plan.publicado) return { error: 'Despublica el plan antes de eliminar días.' }

  const { error } = await (ctx.supabase as any)
    .from('planes_lectura_dias')
    .delete()
    .eq('plan_id', planId)
    .eq('numero_dia', numeroDia)

  if (error) {
    console.error('[planes-pastoral] eliminar día', error)
    return { error: 'No se pudo eliminar este día.' }
  }

  revalidatePath(`/pastoral/planes/${planId}`)
  return { success: true }
}

export async function cambiarPublicacionPlanPastoral(planId: string, publicar: boolean): Promise<PlanActionResult> {
  const ctx = await puedeGestionar(planId)
  if ('error' in ctx) return ctx

  if (publicar) {
    const { data: dias, error: diasError } = await (ctx.supabase as any)
      .from('planes_lectura_dias')
      .select('numero_dia')
      .eq('plan_id', planId)
      .order('numero_dia', { ascending: true })

    if (diasError) return { error: 'No se pudo validar el contenido del plan.' }

    const duracion = Number(ctx.plan.duracion_dias)
    const numeros = Array.isArray(dias) ? dias.map((item: any) => Number(item.numero_dia)) : []
    const completo = numeros.length === duracion && numeros.every((numero: number, index: number) => numero === index + 1)
    if (!completo) return { error: `Completa los ${duracion} días antes de publicar.` }
  }

  const { error } = await (ctx.supabase as any)
    .from('planes_lectura')
    .update({ publicado: Boolean(publicar), updated_at: new Date().toISOString() })
    .eq('id', planId)

  if (error) {
    console.error('[planes-pastoral] publicación', error)
    return { error: publicar ? 'No se pudo publicar el plan.' : 'No se pudo volver a borrador.' }
  }

  revalidatePath('/pastoral/planes')
  revalidatePath(`/pastoral/planes/${planId}`)
  revalidatePath('/hoy/planes')
  return { success: true }
}
