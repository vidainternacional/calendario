from pathlib import Path

workspace = Path('components/pastoral/PastoralVisualWorkspaceV4.tsx')
s = workspace.read_text()

anchor = "const FUENTE_MUESTRA = FUENTES_PASTORALES.find((fuente) => fuente !== 'Inter') ?? FUENTES_PASTORALES[0] ?? 'Georgia'"
insert = """type TipoTexturaFondo = 'diagonal' | 'puntos' | 'cuadricula' | 'lino' | 'rayas' | 'cruzada'\nconst TIPOS_TEXTURA_FONDO: Array<{ id: TipoTexturaFondo; label: string }> = [\n  { id: 'diagonal', label: 'Diagonal' },\n  { id: 'puntos', label: 'Puntos' },\n  { id: 'cuadricula', label: 'Cuadrícula' },\n  { id: 'lino', label: 'Lino' },\n  { id: 'rayas', label: 'Rayas' },\n  { id: 'cruzada', label: 'Cruzada' },\n]\n\nfunction construirTexturaFondo(tipo: TipoTexturaFondo, tono: number, saturacion: number, luminosidad: number) {\n  const complementario = (tono + 180) % 360\n  const tinta = `hsla(${complementario}, ${saturacion}%, ${Math.max(20, luminosidad - 14)}%, .18)`\n  const tintaSuave = `hsla(${tono}, ${Math.max(20, saturacion - 18)}%, ${Math.max(16, luminosidad - 18)}%, .10)`\n  const base = `linear-gradient(hsl(${tono}, ${Math.max(24, saturacion - 22)}%, ${Math.min(90, luminosidad + 22)}%),hsl(${tono}, ${Math.max(28, saturacion - 12)}%, ${Math.max(18, luminosidad - 8)}%))`\n  if (tipo === 'puntos') return `radial-gradient(circle,${tinta} 0 1.5px,transparent 1.6px) 0 0 / 10px 10px,${base}`\n  if (tipo === 'cuadricula') return `repeating-linear-gradient(0deg,${tinta} 0 1px,transparent 1px 12px),repeating-linear-gradient(90deg,${tinta} 0 1px,transparent 1px 12px),${base}`\n  if (tipo === 'lino') return `repeating-linear-gradient(0deg,${tinta} 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,${tintaSuave} 0 1px,transparent 1px 6px),${base}`\n  if (tipo === 'rayas') return `repeating-linear-gradient(90deg,${tinta} 0 3px,transparent 3px 14px),${base}`\n  if (tipo === 'cruzada') return `repeating-linear-gradient(45deg,${tinta} 0 1px,transparent 1px 10px),repeating-linear-gradient(-45deg,${tintaSuave} 0 1px,transparent 1px 10px),${base}`\n  return `repeating-linear-gradient(135deg,${tinta} 0 2px,transparent 2px 11px),${base}`\n}\n\n""" + anchor
assert anchor in s
s = s.replace(anchor, insert, 1)

old = "  const [luminosidadFondoPersonalizado, setLuminosidadFondoPersonalizado] = useState(52)\n"
new = old + "  const [tipoTexturaFondoPersonalizado, setTipoTexturaFondoPersonalizado] = useState<TipoTexturaFondo>('diagonal')\n"
assert old in s
s = s.replace(old, new, 1)

old = "  const fondoPersonalizadoTextura = `repeating-linear-gradient(135deg,hsla(${tonoComplementario}, ${saturacionFondoPersonalizado}%, ${Math.max(22, luminosidadFondoPersonalizado - 12)}%, .16) 0 2px,transparent 2px 11px),linear-gradient(hsl(${tonoFondoPersonalizado}, ${Math.max(24, saturacionFondoPersonalizado - 22)}%, ${Math.min(90, luminosidadFondoPersonalizado + 22)}%),hsl(${tonoFondoPersonalizado}, ${Math.max(28, saturacionFondoPersonalizado - 12)}%, ${Math.max(18, luminosidadFondoPersonalizado - 8)}%))`\n"
new = "  const fondoPersonalizadoTextura = construirTexturaFondo(tipoTexturaFondoPersonalizado, tonoFondoPersonalizado, saturacionFondoPersonalizado, luminosidadFondoPersonalizado)\n"
assert old in s
s = s.replace(old, new, 1)

old = """        <div className=\"grid grid-cols-3 gap-2\">\n          <button type=\"button\" onClick={() => aplicarFondoPersonalizado(fondoPersonalizadoPlano)} className=\"grid gap-1 rounded-xl border border-slate-200 bg-white p-2 text-[10px] font-bold text-slate-600\"><span className=\"mx-auto h-8 w-8 rounded-full border border-slate-200\" style={{ background: fondoPersonalizadoPlano }} />Plano</button>\n          <button type=\"button\" onClick={() => aplicarFondoPersonalizado(fondoPersonalizadoDegradado)} className=\"grid gap-1 rounded-xl border border-slate-200 bg-white p-2 text-[10px] font-bold text-slate-600\"><span className=\"mx-auto h-8 w-8 rounded-full border border-slate-200\" style={{ background: fondoPersonalizadoDegradado }} />Degradado</button>\n          <button type=\"button\" onClick={() => aplicarFondoPersonalizado(fondoPersonalizadoTextura)} className=\"grid gap-1 rounded-xl border border-slate-200 bg-white p-2 text-[10px] font-bold text-slate-600\"><span className=\"mx-auto h-8 w-8 rounded-full border border-slate-200\" style={{ background: fondoPersonalizadoTextura }} />Textura</button>\n        </div>\n"""
new = old + """        <div className=\"grid gap-2\">\n          <div className=\"px-1 text-[10px] font-black text-slate-500\">Tipo de textura</div>\n          <div className=\"flex touch-pan-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden\" aria-label=\"Tipos de textura personalizados\">\n            {TIPOS_TEXTURA_FONDO.map((tipo) => {\n              const fondoMuestra = construirTexturaFondo(tipo.id, tonoFondoPersonalizado, saturacionFondoPersonalizado, luminosidadFondoPersonalizado)\n              return <button key={tipo.id} type=\"button\" onClick={() => setTipoTexturaFondoPersonalizado(tipo.id)} aria-pressed={tipoTexturaFondoPersonalizado === tipo.id} className={`grid min-w-[72px] shrink-0 gap-1 rounded-xl border p-2 text-[9px] font-bold ${tipoTexturaFondoPersonalizado === tipo.id ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}><span className=\"mx-auto h-8 w-12 rounded-lg border border-slate-200\" style={{ background: fondoMuestra }} />{tipo.label}</button>\n            })}\n          </div>\n          <button type=\"button\" onClick={() => aplicarFondoPersonalizado(fondoPersonalizadoTextura)} className=\"min-h-10 rounded-full bg-indigo-600 px-4 text-xs font-black text-white\">Aplicar textura · {TIPOS_TEXTURA_FONDO.find((tipo) => tipo.id === tipoTexturaFondoPersonalizado)?.label}</button>\n        </div>\n"""
assert old in s
s = s.replace(old, new, 1)
workspace.write_text(s)

picker = Path('components/pastoral/PastoralVersePicker.tsx')
t = picker.read_text()

old = """  const [resultado, setResultado] = useState<ResultadoLexico | null>(null)\n  const [cargandoLexico, setCargandoLexico] = useState(false)\n"""
new = old + """  const [significadoIa, setSignificadoIa] = useState<{ significado: string; transliteracion: string } | null>(null)\n  const [cargandoIa, setCargandoIa] = useState(false)\n  const [errorIa, setErrorIa] = useState(false)\n"""
assert old in t
t = t.replace(old, new, 1)

old = """  const significado = seleccionada && esHebreo ? significadoDePalabra(seleccionada, resultado) : null\n\n  return <div className=\"border-t border-slate-100 bg-slate-50/70 px-3 py-3\">\n"""
new = """  const significado = seleccionada && esHebreo ? significadoDePalabra(seleccionada, resultado) : null\n\n  useEffect(() => {\n    setSignificadoIa(null)\n    setErrorIa(false)\n    if (!seleccionada || cargandoLexico || significado) {\n      setCargandoIa(false)\n      return\n    }\n    const controller = new AbortController()\n    setCargandoIa(true)\n    fetch('/api/pastoral/original-word', {\n      method: 'POST',\n      headers: { 'content-type': 'application/json' },\n      body: JSON.stringify({ palabra: seleccionada, idioma: esHebreo ? 'hebrew' : 'greek', referencia: versiculo.referencia }),\n      signal: controller.signal,\n    }).then(async response => {\n      if (!response.ok) throw new Error('ai-gloss')\n      return response.json() as Promise<{ significado?: string; transliteracion?: string }>\n    }).then(data => {\n      const significado = String(data.significado ?? '').trim()\n      if (!significado) throw new Error('empty-ai-gloss')\n      setSignificadoIa({ significado, transliteracion: String(data.transliteracion ?? '').trim() })\n    }).catch(error => {\n      if ((error as Error)?.name !== 'AbortError') setErrorIa(true)\n    }).finally(() => setCargandoIa(false))\n    return () => controller.abort()\n  }, [seleccionada, cargandoLexico, significado, esHebreo, versiculo.referencia])\n\n  const significadoMostrado = significado ?? significadoIa?.significado ?? null\n  const textoParaInsertar = seleccionada ? [\n    seleccionada,\n    significadoIa?.transliteracion ? `(${significadoIa.transliteracion})` : '',\n    significadoMostrado ? `— ${significadoMostrado}` : '',\n  ].filter(Boolean).join(' ') : ''\n\n  return <div className=\"border-t border-slate-100 bg-slate-50/70 px-3 py-3\">\n"""
assert old in t
t = t.replace(old, new, 1)

old = """          <p className={`mt-1.5 text-xs font-semibold leading-5 ${significado ? 'text-indigo-700' : 'text-slate-500'}`}>\n            {esHebreo\n              ? significado ?? (cargandoLexico ? 'Buscando significado…' : 'Significado verificado no disponible para esta forma.')\n              : 'Palabra original en griego. Puedes agregarla al lienzo.'}\n          </p>\n        </div>\n        <button type=\"button\" onClick={() => onInsert(seleccionada)} className=\"inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-indigo-600 px-3 text-[11px] font-black text-white\">\n"""
new = """          <p className={`mt-1.5 text-xs font-semibold leading-5 ${significadoMostrado ? 'text-indigo-700' : 'text-slate-500'}`}>\n            {significadoMostrado ?? (cargandoLexico || cargandoIa ? 'Buscando significado…' : errorIa ? 'No se pudo obtener la explicación en este momento.' : 'Buscando explicación…')}\n          </p>\n          {significado && <span className=\"mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700\">Léxico VIDA</span>}\n          {!significado && significadoIa && <span className=\"mt-1 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-black text-violet-700\">Explicación IA</span>}\n          {significadoIa?.transliteracion && <span className=\"ml-1 mt-1 inline-flex text-[10px] font-semibold text-slate-500\">{significadoIa.transliteracion}</span>}\n        </div>\n        <button type=\"button\" disabled={!textoParaInsertar} onClick={() => textoParaInsertar && onInsert(textoParaInsertar)} className=\"inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-indigo-600 px-3 text-[11px] font-black text-white disabled:opacity-40\">\n"""
assert old in t
t = t.replace(old, new, 1)

old = """        {modoOriginal && libroHebreoActual && <div className=\"mx-3 mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3\">\n          <div lang=\"he\" dir=\"rtl\" className=\"text-right text-[24px] font-bold leading-tight text-slate-900\">{libroHebreoActual.hebreo}</div>\n          <div className=\"mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-2\" dir=\"ltr\">\n            <strong className=\"text-sm font-black text-indigo-700\">{libroHebreoActual.transliteracion}</strong>\n            <span className=\"text-xs font-bold text-slate-500\">{libroHebreoActual.transliteracion} {capitulo}</span>\n          </div>\n        </div>}\n"""
new = """        {modoOriginal && libroHebreoActual && <div className=\"mx-3 mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center\">\n          <div lang=\"he\" dir=\"rtl\" className=\"text-[26px] font-bold leading-tight text-slate-900\">{libroHebreoActual.hebreo}</div>\n          <strong className=\"mt-2 block text-lg font-black text-indigo-700\">{libroHebreoActual.transliteracion}</strong>\n          <span className=\"mt-1 block text-xs font-bold text-slate-500\">{libroActual?.name ?? 'Génesis'}</span>\n        </div>}\n"""
assert old in t
t = t.replace(old, new, 1)

old = "          const referenciaVisible = modoOriginal && libroHebreoActual ? `${libroHebreoActual.transliteracion} ${v.capitulo}:${v.verso}` : v.referencia\n"
new = "          const referenciaVisible = modoOriginal && libroHebreoActual ? `${v.capitulo}:${v.verso}` : v.referencia\n"
assert old in t
t = t.replace(old, new, 1)

old = """                <strong dir=\"ltr\" className={modoOriginal ? 'block pb-2' : undefined}>{referenciaVisible}</strong>\n                <em dir={modoOriginal && !esNuevoTestamento ? 'rtl' : 'ltr'} lang={modoOriginal ? (esNuevoTestamento ? 'grc' : 'he') : 'es'} className={modoOriginal ? 'block pt-1' : undefined}>{modoOriginal ? (cargandoOriginal ? 'Cargando original…' : originales[v.verso] || 'Original no disponible') : v.texto}</em>\n"""
new = """                <strong dir=\"ltr\" className=\"block pb-2\">{referenciaVisible}</strong>\n                <em dir={modoOriginal && !esNuevoTestamento ? 'rtl' : 'ltr'} lang={modoOriginal ? (esNuevoTestamento ? 'grc' : 'he') : 'es'} className=\"block pt-1 leading-relaxed\">{modoOriginal ? (cargandoOriginal ? 'Cargando original…' : originales[v.verso] || 'Original no disponible') : v.texto}</em>\n"""
assert old in t
t = t.replace(old, new, 1)
picker.write_text(t)

route = Path('app/api/pastoral/original-word/route.ts')
route.parent.mkdir(parents=True, exist_ok=True)
route.write_text(r'''import { NextResponse } from 'next/server'
import { VidaAiError, vidaAI } from '@/lib/ai/vida-ai'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function limpiarJson(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/iu, '').replace(/\s*```$/u, '').trim()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  let payload: { palabra?: unknown; idioma?: unknown; referencia?: unknown } = {}
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }) }

  const palabra = String(payload.palabra ?? '').trim().slice(0, 120)
  const idioma = payload.idioma === 'greek' ? 'griego koiné' : payload.idioma === 'hebrew' ? 'hebreo bíblico' : ''
  const referencia = String(payload.referencia ?? '').trim().slice(0, 120)
  if (!palabra || !idioma) return NextResponse.json({ error: 'Palabra o idioma inválido.' }, { status: 400 })

  try {
    const generated = await vidaAI({
      task: 'interpretar_busqueda_biblica',
      ownerId: user.id,
      input: palabra,
      instructions: [
        `Actúa como asistente léxico de ${idioma}.`,
        referencia ? `La palabra aparece en ${referencia}; usa esa referencia únicamente para escoger el sentido léxico más probable.` : '',
        'Da una glosa breve y clara en español y una transliteración legible para hispanohablantes.',
        'No hagas sermones, aplicaciones doctrinales ni afirmaciones etimológicas especulativas.',
        'Devuelve JSON estricto con exactamente estas claves: significado_es y transliteracion.',
        'significado_es debe ser una frase corta, útil para entender la palabra en su contexto bíblico.',
      ].filter(Boolean).join(' '),
    })

    let parsed: { significado_es?: unknown; transliteracion?: unknown } = {}
    try { parsed = JSON.parse(limpiarJson(generated.text)) } catch { parsed = { significado_es: generated.text.trim(), transliteracion: '' } }
    const significado = String(parsed.significado_es ?? '').trim()
    const transliteracion = String(parsed.transliteracion ?? '').trim()
    if (!significado) return NextResponse.json({ error: 'La IA no devolvió una explicación.' }, { status: 502 })
    return NextResponse.json({ significado, transliteracion, fuente: 'ai' })
  } catch (error) {
    if (error instanceof VidaAiError) {
      if (error.code === 'rate_limited') return NextResponse.json({ error: 'Espera un momento antes de volver a consultar.' }, { status: 429 })
      if (error.code === 'not_configured') return NextResponse.json({ error: 'La IA todavía no está disponible en el servidor.' }, { status: 503 })
    }
    console.error('Pastoral original word AI fallback failed', error)
    return NextResponse.json({ error: 'No se pudo obtener la explicación en este momento.' }, { status: 502 })
  }
}
''')
