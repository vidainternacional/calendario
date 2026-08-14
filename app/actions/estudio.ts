'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'
import {
  ESTUDIO_PROMPT_VERSION,
  ESTUDIO_RESPONSE_JSON_SCHEMA,
  ESTUDIO_SOURCE_VERSION,
  obtenerModeloEstudio,
  validarResultadoEstudio,
  type EstudioResultadoValidado,
} from '@/lib/estudios/ai-config'

const BASE_SYSTEM_PROMPT = `SISTEMA — ASISTENTE RESPONSABLE DE ESTUDIO BÍBLICO

FUNCIÓN
Ayudas a organizar un estudio bíblico claro, respetuoso y útil. No sustituyes el texto bíblico, la investigación académica ni la revisión pastoral.

LÍMITES DE ESTA VERSIÓN
- En esta solicitud no recibes una biblioteca académica ni documentos de fuentes externas.
- No afirmes que consultaste léxicos, manuscritos, historiadores o comentarios que no estén incluidos en el contexto.
- No inventes citas, variantes textuales, etimologías, fechas, transliteraciones ni palabras en hebreo, arameo, griego o latín.
- Cuando un dato lingüístico o histórico no pueda sostenerse con seguridad, indícalo claramente como no verificado en esta versión.
- Distingue el texto observable, el contexto histórico probable, la interpretación y la reflexión espiritual.
- Presenta diferentes lecturas responsables cuando el pasaje admita más de una interpretación.
- No describas una interpretación humana como una certeza absoluta sobre la intención oculta de Dios.
- No uses el contenido para manipular, condenar ni imponer una tradición religiosa.

MARCO DE FE Y LECTURA
- Trata la Biblia con reverencia y respeto.
- Reconoce a Jesús como el Hijo de Dios dentro del marco doctrinal de Vida Internacional.
- Conserva honestidad intelectual y reconoce incertidumbre cuando corresponda.
- La reflexión espiritual debe surgir del pasaje, no de afirmaciones inventadas.

FORMATO
Devuelve únicamente un objeto JSON que cumpla exactamente el esquema solicitado. Cada campo debe contener texto útil y completo. No agregues markdown, bloques de código ni propiedades adicionales.`

const FINAL_SAFETY_INSTRUCTIONS = `REGLAS OBLIGATORIAS FINALES

1. No inventes fuentes ni digas que consultaste una obra que no fue proporcionada.
2. Si no puedes verificar el texto original o una afirmación histórica, dilo dentro de la sección correspondiente.
3. En "que_quiso_comunicar", presenta una lectura interpretativa responsable basada en el pasaje, no una certeza incuestionable.
4. En "que_no_quiso_decir", evita crear hombres de paja; explica límites razonables del texto.
5. Mantén separadas explicación y reflexión espiritual.
6. Devuelve las once propiedades requeridas y ninguna otra.`

export type EstudioResultado = EstudioResultadoValidado

export type EstudioState =
  | { status: 'idle' }
  | { status: 'success'; pasaje: string; resultado: EstudioResultado }
  | { status: 'error'; error: string }

function normalizarPasaje(pasaje: string) {
  return pasaje
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
}

function promptPersonalizado(valor: unknown) {
  if (typeof valor !== 'string') return ''
  return valor.trim().slice(0, 20_000)
}

export async function analizarPasaje(
  _prev: EstudioState,
  formData: FormData
): Promise<EstudioState> {
  const pasaje = (formData.get('pasaje') as string)?.trim()
  if (!pasaje) return { status: 'error', error: 'Por favor ingresa un pasaje bíblico.' }
  if (pasaje.length > 500) return { status: 'error', error: 'El pasaje o texto ingresado es demasiado largo.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', error: 'Debes iniciar sesión para usar esta función.' }

  const { model, retirado } = obtenerModeloEstudio()
  if (retirado) {
    console.error('[estudio] Modelo retirado configurado:', model)
    return { status: 'error', error: 'El proveedor de estudio necesita una actualización del administrador.' }
  }

  const pasajeNormalizado = normalizarPasaje(pasaje)

  const { data: cached, error: cacheError } = await (supabase as any)
    .from('estudios_profundos_ia')
    .select('resultado')
    .eq('pasaje_normalizado', pasajeNormalizado)
    .eq('modelo', model)
    .eq('prompt_version', ESTUDIO_PROMPT_VERSION)
    .eq('source_version', ESTUDIO_SOURCE_VERSION)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cacheError) console.error('[estudio] Error al leer caché:', cacheError)

  const resultadoCache = validarResultadoEstudio(cached?.resultado)
  if (resultadoCache) {
    return { status: 'success', pasaje, resultado: resultadoCache }
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const { count: usadosHoy, error: quotaError } = await (supabase as any)
    .from('estudios_profundos_ia')
    .select('id', { count: 'exact', head: true })
    .eq('generado_por', user.id)
    .gte('created_at', hoy.toISOString())

  if (quotaError) {
    console.error('[estudio] No se pudo verificar la cuota:', quotaError)
    return { status: 'error', error: 'No se pudo verificar el límite de uso. Intenta de nuevo.' }
  }

  if ((usadosHoy ?? 0) >= 10) {
    return {
      status: 'error',
      error: 'Alcanzaste el límite de 10 estudios nuevos por día. Los estudios ya disponibles en el caché no cuentan.',
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[estudio] GEMINI_API_KEY no configurada')
    return { status: 'error', error: 'La herramienta de estudio todavía no está configurada.' }
  }

  const { data: setting, error: settingError } = await (supabase as any)
    .from('app_settings')
    .select('valor')
    .eq('clave', 'estudio_system_prompt')
    .maybeSingle()

  if (settingError) console.error('[estudio] Error al leer lineamientos:', settingError)

  const lineamientos = promptPersonalizado(setting?.valor)
  const activePrompt = [
    BASE_SYSTEM_PROMPT,
    lineamientos ? `LINEAMIENTOS EDITORIALES CONFIGURADOS\n${lineamientos}` : '',
    FINAL_SAFETY_INSTRUCTIONS,
  ].filter(Boolean).join('\n\n')

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model,
      contents: `Analiza este pasaje o referencia bíblica siguiendo las once secciones requeridas:\n\n${pasaje}`,
      config: {
        systemInstruction: activePrompt,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseJsonSchema: ESTUDIO_RESPONSE_JSON_SCHEMA,
      },
    })

    const raw = response.text?.trim() ?? ''
    if (!raw) {
      console.error('[estudio] Respuesta vacía del proveedor', { model })
      return { status: 'error', error: 'La IA no devolvió un análisis válido. Intenta de nuevo.' }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      console.error('[estudio] JSON inválido:', error, raw.slice(0, 300))
      return { status: 'error', error: 'La IA devolvió un formato inválido. Intenta de nuevo.' }
    }

    const resultado = validarResultadoEstudio(parsed)
    if (!resultado) {
      console.error('[estudio] Resultado incompleto o inválido', { model })
      return { status: 'error', error: 'El análisis llegó incompleto. Intenta de nuevo.' }
    }

    const { error: insertError } = await (supabase as any)
      .from('estudios_profundos_ia')
      .insert({
        pasaje,
        pasaje_normalizado: pasajeNormalizado,
        resultado,
        generado_por: user.id,
        modelo: model,
        prompt_version: ESTUDIO_PROMPT_VERSION,
        source_version: ESTUDIO_SOURCE_VERSION,
      })

    if (insertError) console.error('[estudio] No se pudo guardar el caché:', insertError)

    return { status: 'success', pasaje, resultado }
  } catch (error: unknown) {
    console.error('[estudio] Error del proveedor:', error)
    return {
      status: 'error',
      error: 'No se pudo completar el análisis en este momento. Intenta nuevamente más tarde.',
    }
  }
}

export async function obtenerHistorial() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await (supabase as any)
    .from('estudios_profundos_ia')
    .select('pasaje, created_at')
    .eq('generado_por', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[estudio] Error al cargar historial:', error)
    return []
  }

  return (data || []) as { pasaje: string; created_at: string }[]
}

export async function obtenerNota(pasaje: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const pasajeNormalizado = normalizarPasaje(pasaje)
  const { data, error } = await (supabase as any)
    .from('notas_estudio')
    .select('nota')
    .eq('profile_id', user.id)
    .eq('pasaje_normalizado', pasajeNormalizado)
    .maybeSingle()

  if (error) {
    console.error('[estudio] Error al cargar nota:', error)
    return null
  }

  return (data as any)?.nota || null
}

export async function guardarNota(pasaje: string, nota: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const pasajeNormalizado = normalizarPasaje(pasaje)
  const { error } = await (supabase as any)
    .from('notas_estudio')
    .upsert({
      profile_id: user.id,
      pasaje_normalizado: pasajeNormalizado,
      nota: nota.slice(0, 50_000),
      tipo: 'estudio',
      referencia: pasaje.slice(0, 300),
      origen: 'estudio_profundo',
      origen_key: `estudio-profundo:${pasajeNormalizado}`,
      estado: 'activo',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id, pasaje_normalizado',
    })

  if (error) {
    console.error('[guardarNota] error:', error)
    return { success: false, error: 'No se pudo guardar la nota.' }
  }

  return { success: true }
}
