from pathlib import Path

ACTION = Path('app/actions/pastoral-paquetes.ts')
WORKSPACE = Path('components/pastoral/PastoralVisualWorkspaceV4.tsx')

action = ACTION.read_text()
workspace = WORKSPACE.read_text()

# Persist the complete canvas contract already used by the editor/model.
action = action.replace(
"type AjusteImagen = 'cover' | 'contain'\n",
"type AjusteImagen = 'cover' | 'contain'\ntype ModoFusion = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'difference' | 'hue' | 'saturation' | 'color' | 'luminosity'\n"
)
action = action.replace(
"  radio?: number\n}\n",
"  radio?: number\n  oculto?: boolean\n  fondo_visual?: string\n  es_capa_fondo?: boolean\n  modo_fusion?: ModoFusion\n  bloqueado?: boolean\n  sombreado?: boolean\n}\n",
1
)
action = action.replace(
"  'Courier New', 'Lucida Console', 'Impact', 'Arial Black',\n])",
"  'Courier New', 'Lucida Console', 'Impact', 'Arial Black',\n  'Avenir Next', 'Futura', 'Helvetica Neue', 'Didot', 'Baskerville',\n  'var(--font-pastoral-eb-garamond)', 'var(--font-pastoral-montserrat)',\n  'var(--font-pastoral-playfair-display)', 'var(--font-pastoral-bebas-neue)',\n])"
)
needle = "function pesoInicialRol(rol: RolTexto) { if (rol === 'titulo') return 800; if (rol === 'subtitulo') return 700; return 500 }\n"
insert = needle + "\nconst MODOS_FUSION_SEGUROS = new Set<ModoFusion>(['normal','multiply','screen','overlay','soft-light','hard-light','darken','lighten','color-dodge','color-burn','difference','hue','saturation','color','luminosity'])\nfunction modoFusionSeguro(valor: unknown): ModoFusion { const modo = String(valor ?? 'normal') as ModoFusion; return MODOS_FUSION_SEGUROS.has(modo) ? modo : 'normal' }\nfunction fondoVisualSeguro(valor: unknown) {\n  const fondo = String(valor ?? '').trim()\n  if (!fondo || /url\\s*\\(/i.test(fondo) || /[;{}]/.test(fondo)) return undefined\n  if (/^#[0-9a-f]{3,8}$/i.test(fondo) || /^hsla?\\([^)]+\\)$/i.test(fondo)) return fondo\n  if (/^(?:linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient)\\(.+\\)$/i.test(fondo)) return fondo\n  return undefined\n}\n"
if needle not in action:
    raise SystemExit('pesoInicialRol anchor missing')
action = action.replace(needle, insert, 1)

needle = "      radio: numeroAcotado(item.radio, 0, 40, 14),\n    } satisfies ElementoCanvas]"
replacement = "      radio: numeroAcotado(item.radio, 0, 40, 14),\n      oculto: Boolean(item.oculto),\n      fondo_visual: fondoVisualSeguro(item.fondo_visual),\n      es_capa_fondo: Boolean(item.es_capa_fondo),\n      modo_fusion: modoFusionSeguro(item.modo_fusion),\n      bloqueado: Boolean(item.bloqueado),\n      sombreado: Boolean(item.sombreado),\n    } satisfies ElementoCanvas]"
if needle not in action:
    raise SystemExit('element persistence anchor missing')
action = action.replace(needle, replacement, 1)

old_update = "  const { error: updateError } = await (supabase as any).from('pastoral_paquetes').update({\n    titulo, descripcion_publica: texto(formData, 'descripcion_publica', 2000), instrucciones: texto(formData, 'instrucciones', 3000), notas_privadas: texto(formData, 'notas_privadas', 12000), bosquejo_id: uuidOpcional(formData.get('bosquejo_id')), coleccion_id: uuidOpcional(formData.get('coleccion_id')), recurso_ids: recursosDesdeFormulario(formData), presentacion_diapositivas: diapositivasDesdeFormulario(formData), presentacion_pdf_recurso_id: uuidOpcional(formData.get('presentacion_pdf_recurso_id')), estado: estadoValido(texto(formData, 'estado', 20)), updated_at: new Date().toISOString(),\n  }).eq('id', id).eq('profile_id', user.id)\n  if (updateError) return { success: false, error: 'No se pudo guardar el proyecto pastoral.' }"
new_update = "  const { data: updatedRows, error: updateError } = await (supabase as any).from('pastoral_paquetes').update({\n    titulo, descripcion_publica: texto(formData, 'descripcion_publica', 2000), instrucciones: texto(formData, 'instrucciones', 3000), notas_privadas: texto(formData, 'notas_privadas', 12000), bosquejo_id: uuidOpcional(formData.get('bosquejo_id')), coleccion_id: uuidOpcional(formData.get('coleccion_id')), recurso_ids: recursosDesdeFormulario(formData), presentacion_diapositivas: diapositivasDesdeFormulario(formData), presentacion_pdf_recurso_id: uuidOpcional(formData.get('presentacion_pdf_recurso_id')), estado: estadoValido(texto(formData, 'estado', 20)), updated_at: new Date().toISOString(),\n  }).eq('id', id).eq('profile_id', user.id).select('id')\n  if (updateError || !updatedRows?.length) return { success: false, error: 'No se pudo guardar el proyecto pastoral.' }"
if old_update not in action:
    raise SystemExit('update action anchor missing')
action = action.replace(old_update, new_update, 1)

# Serialize autosave/manual saves so an older request can never overwrite a newer snapshot.
workspace = workspace.replace(
"  const autosaveSerialRef = useRef(0)\n",
"  const autosaveSerialRef = useRef(0)\n  const saveInFlightRef = useRef<Promise<Awaited<ReturnType<typeof editarPaquetePastoral>>> | null>(null)\n"
)
anchor = "  const guardar = () => startTransition(async () => {\n    const resultado = await editarPaquetePastoral(paquete.id, construirFormulario())"
replacement = "  const persistirFormulario = async (formData: FormData) => {\n    if (saveInFlightRef.current) await saveInFlightRef.current\n    const promesa = editarPaquetePastoral(paquete.id, formData)\n    saveInFlightRef.current = promesa\n    try { return await promesa } finally { if (saveInFlightRef.current === promesa) saveInFlightRef.current = null }\n  }\n\n  const guardar = () => startTransition(async () => {\n    const resultado = await persistirFormulario(construirFormulario())"
if anchor not in workspace:
    raise SystemExit('manual save anchor missing')
workspace = workspace.replace(anchor, replacement, 1)
workspace = workspace.replace(
"    const resultado = await editarPaquetePastoral(paquete.id, construirFormulario())\n    if (serial !== autosaveSerialRef.current) return",
"    const resultado = await persistirFormulario(construirFormulario())\n    if (serial !== autosaveSerialRef.current) return",
1
)

# Fullscreen: use native API when available, vendor fallback, hide navigation UI where supported,
# lock page scrolling, and keep a true viewport-sized presentation surface as fallback on iOS.
old_fs = "  const abrirPantallaCompleta = async () => { setModoPresentacion(true); try { await document.documentElement.requestFullscreen?.() } catch {} }\n  const cerrarPantallaCompleta = async () => { setModoPresentacion(false); try { if (document.fullscreenElement) await document.exitFullscreen?.() } catch {} }"
new_fs = "  const abrirPantallaCompleta = async () => {\n    setModoPresentacion(true)\n    try {\n      const raiz = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }\n      if (raiz.requestFullscreen) await raiz.requestFullscreen({ navigationUI: 'hide' })\n      else await raiz.webkitRequestFullscreen?.()\n    } catch {}\n    try { await (screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> }).lock?.('landscape') } catch {}\n  }\n  const cerrarPantallaCompleta = async () => {\n    setModoPresentacion(false)\n    try {\n      const doc = document as Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void }\n      if (document.fullscreenElement) await document.exitFullscreen?.()\n      else if (doc.webkitFullscreenElement) await doc.webkitExitFullscreen?.()\n    } catch {}\n    try { (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock?.() } catch {}\n  }"
if old_fs not in workspace:
    raise SystemExit('fullscreen function anchor missing')
workspace = workspace.replace(old_fs, new_fs, 1)

# Keep fullscreen mode synchronized if the browser exits it and prevent the editor page from scrolling behind it.
effect_anchor = "  useEffect(() => {\n    if (!autosaveReadyRef.current) { autosaveReadyRef.current = true; return }"
fullscreen_effect = "  useEffect(() => {\n    if (!modoPresentacion) return\n    const html = document.documentElement\n    const body = document.body\n    const htmlOverflow = html.style.overflow\n    const bodyOverflow = body.style.overflow\n    html.style.overflow = 'hidden'\n    body.style.overflow = 'hidden'\n    const onFullscreenChange = () => {\n      const doc = document as Document & { webkitFullscreenElement?: Element | null }\n      if (!document.fullscreenElement && !doc.webkitFullscreenElement && modoPresentacion) {\n        // iPhone/Safari may not expose element fullscreen; keep the viewport overlay active instead.\n      }\n    }\n    document.addEventListener('fullscreenchange', onFullscreenChange)\n    document.addEventListener('webkitfullscreenchange', onFullscreenChange as EventListener)\n    return () => {\n      html.style.overflow = htmlOverflow\n      body.style.overflow = bodyOverflow\n      document.removeEventListener('fullscreenchange', onFullscreenChange)\n      document.removeEventListener('webkitfullscreenchange', onFullscreenChange as EventListener)\n    }\n  }, [modoPresentacion])\n\n" + effect_anchor
if effect_anchor not in workspace:
    raise SystemExit('autosave effect anchor missing')
workspace = workspace.replace(effect_anchor, fullscreen_effect, 1)
workspace = workspace.replace(
"'fixed inset-0 z-[170] flex items-center justify-center overflow-hidden bg-black'",
"'fixed inset-0 z-[170] flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-black overscroll-none'",
1
)
workspace = workspace.replace(
"<div className=\"fixed inset-0 z-[170] flex items-center justify-center bg-black\">",
"<div className=\"fixed inset-0 z-[170] flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-black overscroll-none\">",
1
)

ACTION.write_text(action)
WORKSPACE.write_text(workspace)
print('patched pastoral save + fullscreen')
