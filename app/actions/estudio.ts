'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

const SYSTEM_PROMPT = `SISTEMA — ESTUDIOS BÍBLICOS INTEGRALES (NIVEL ACADÉMICO AVANZADO)

ROL Y PERFIL

Actúas como un experto de nivel mundial en estudios bíblicos integrales,
con formación académica rigurosa y experiencia real en:

- Arameo bíblico (siríaco – Peshitta)
- Hebreo bíblico (Texto Masorético)
- Griego koiné (Nuevo Testamento)
- Latín (Vulgata)
- Crítica textual y análisis de manuscritos
- Historia del judaísmo del Segundo Templo
- Contexto cultural, político y religioso del siglo I
- Hermenéutica y exégesis bíblica
- Teología bíblica y cristología histórica

NO eres un predicador.
NO impones dogmas.
NO evitas preguntas difíciles.
NO manipulas el texto para sostener tradiciones posteriores.

--------------------------------------------------
MARCO FUNDAMENTAL
--------------------------------------------------

Operas desde estas convicciones explícitas, sin dogmatismo ni proselitismo:

- Dios es real.
- Jesús es el Hijo de Dios.
- Jesús vino a revelar al Padre y a redimir a la humanidad.
- La Biblia es inspirada por Dios, pero fue transmitida mediante lenguas,
  culturas, géneros literarios y traductores humanos.

Estas convicciones NO anulan el análisis histórico, lingüístico o crítico,
sino que conviven con él de forma honesta.

--------------------------------------------------
MISIÓN PRINCIPAL
--------------------------------------------------

Ayudar al usuario a comprender qué quiso comunicar realmente Dios
a través de los textos bíblicos originales, distinguiendo claramente entre:

- El texto original
- Las traducciones antiguas y modernas
- Las interpretaciones humanas
- Las tradiciones religiosas posteriores

La fidelidad textual tiene prioridad sobre la tradición.

--------------------------------------------------
FUENTES AUTORIZADAS
--------------------------------------------------

Utilizas exclusivamente fuentes académicas y primarias, tales como:

- Texto Masorético, Peshitta, Septuaginta, NT griego
- Manuscritos antiguos relevantes (Sinaítico, Alejandrino, Qumrán, etc.)
- Léxicos y diccionarios académicos (BDB, HALOT, Liddell-Scott, BDAG)
- Estudios históricos del judaísmo del Segundo Templo
- Comparación crítica entre versiones bíblicas

--------------------------------------------------
METODOLOGÍA OBLIGATORIA DE RESPUESTA
--------------------------------------------------

Siempre que analices un pasaje bíblico, sigues este orden EXACTO.
Devuelve la respuesta como JSON válido con esta estructura exacta (sin markdown, sin código de bloque, solo JSON puro):

{
  "texto_original": "...",
  "transliteracion": "...",
  "traduccion_literal": "...",
  "traduccion_interpretativa": "...",
  "comparacion_versiones": "...",
  "contexto_historico": "...",
  "analisis_linguistico": "...",
  "que_quiso_comunicar": "...",
  "que_no_quiso_decir": "...",
  "explicacion": "...",
  "reflexion": "..."
}

--------------------------------------------------
PRINCIPIOS HERMENÉUTICOS CLAVE
--------------------------------------------------

- El significado original tiene prioridad absoluta.
- Señala variantes textuales cuando existan.
- Explica símbolos desde la mentalidad semítica, no occidental moderna.
- Distingue entre símbolo, metáfora y afirmación histórica.
- Respeta la fe del usuario sin apagar el pensamiento crítico.
- La verdad textual está por encima de la tradición religiosa.

--------------------------------------------------
TONO Y ESTILO
--------------------------------------------------

- Claro
- Profundo
- Intelectualmente honesto
- Espiritualmente respetuoso
- Críticamente responsable

Nunca emocionalista, nunca manipulador, nunca superficial.`

export type EstudioResultado = {
  texto_original: string
  transliteracion: string
  traduccion_literal: string
  traduccion_interpretativa: string
  comparacion_versiones: string
  contexto_historico: string
  analisis_linguistico: string
  que_quiso_comunicar: string
  que_no_quiso_decir: string
  explicacion: string
  reflexion: string
}

export type EstudioState =
  | { status: 'idle' }
  | { status: 'success'; pasaje: string; resultado: EstudioResultado }
  | { status: 'error'; error: string }

export async function analizarPasaje(
  _prev: EstudioState,
  formData: FormData
): Promise<EstudioState> {
  const pasaje = (formData.get('pasaje') as string)?.trim()
  if (!pasaje) return { status: 'error', error: 'Por favor ingresa un pasaje bíblico.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', error: 'Debes iniciar sesión para usar esta función.' }

  const pasajeNormalizado = pasaje.toLowerCase().replace(/\s+/g, '')

  // 1. Check cache
  const { data: cached } = await (supabase as any)
    .from('estudios_profundos_ia')
    .select('resultado')
    .eq('pasaje_normalizado', pasajeNormalizado)
    .single()

  if (cached && cached.resultado) {
    return { status: 'success', pasaje, resultado: cached.resultado as EstudioResultado }
  }

  // 2. Read prompt from app_settings
  let activePrompt = SYSTEM_PROMPT
  const { data: setting } = await (supabase as any)
    .from('app_settings')
    .select('valor')
    .eq('clave', 'estudio_system_prompt')
    .single()

  if (setting && setting.valor && typeof setting.valor === 'string') {
    activePrompt = setting.valor
  }

  // 🔒 Límite diario: máx 10 estudios NUEVOS por usuario (protege la cuota gratis de Gemini)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const { count: usadosHoy } = await (supabase as any)
    .from('estudios_profundos_ia')
    .select('id', { count: 'exact', head: true })
    .eq('generado_por', user.id)
    .gte('created_at', hoy.toISOString())
  if ((usadosHoy ?? 0) >= 10) {
    return { status: 'error', error: 'Alcanzaste el límite de 10 estudios nuevos por día. Los estudios ya generados por la comunidad no cuentan — intenta buscar el pasaje de nuevo mañana. 🙏' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { status: 'error', error: 'API de IA no configurada. Contacta al administrador.' }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analiza el siguiente pasaje bíblico con tu metodología completa de 11 puntos: ${pasaje}`,
      config: {
        systemInstruction: activePrompt,
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    })

    const raw = response.text ?? ''

    // Strip markdown code fences if Gemini wraps the JSON
    const jsonStr = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    let resultado: EstudioResultado
    try {
      resultado = JSON.parse(jsonStr)
    } catch {
      // Fallback: wrap entire response in the first field if parsing fails
      console.error('[estudio] JSON parse failed, raw:', raw.slice(0, 300))
      return { status: 'error', error: 'Error al procesar la respuesta de la IA. Intenta de nuevo.' }
    }

    // Save to cache
    await (supabase as any).from('estudios_profundos_ia').insert({
      pasaje,
      pasaje_normalizado: pasajeNormalizado,
      resultado: resultado as any,
      generado_por: user.id
    })

    return { status: 'success', pasaje, resultado }
  } catch (err: unknown) {
    console.error('[estudio] Gemini error:', err)
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return { status: 'error', error: `Error al contactar la IA: ${msg}` }
  }
}

export async function obtenerHistorial() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('estudios_profundos_ia')
    .select('pasaje, created_at')
    .eq('generado_por', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (data || []) as { pasaje: string; created_at: string }[]
}

export async function obtenerNota(pasaje: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const pasajeNormalizado = pasaje.toLowerCase().replace(/\s+/g, '')
  const { data } = await (supabase as any)
    .from('notas_estudio')
    .select('nota')
    .eq('profile_id', user.id)
    .eq('pasaje_normalizado', pasajeNormalizado)
    .single()

  return (data as any)?.nota || null
}

export async function guardarNota(pasaje: string, nota: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const pasajeNormalizado = pasaje.toLowerCase().replace(/\s+/g, '')

  const { error } = await (supabase as any)
    .from('notas_estudio')
    .upsert({
      profile_id: user.id,
      pasaje_normalizado: pasajeNormalizado,
      nota: nota,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'profile_id, pasaje_normalizado'
    })

  if (error) {
    console.error('[guardarNota] error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

