from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
workspace_path = root / 'components/pastoral/PastoralVisualWorkspaceV4.tsx'
text = workspace_path.read_text(encoding='utf-8')

def replace_once(old: str, new: str, label: str):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text = text.replace(old, new, 1)

replace_once(
    "  Layers, LayoutTemplate, Link2, List, ListOrdered, Loader2, Lock, Maximize2, Minimize2,",
    "  Layers, Link2, List, ListOrdered, Loader2, Lock, Maximize2, Minimize2,",
    'remove LayoutTemplate import',
)
replace_once(
    "import { PALETAS_PRESENTACION, PLANTILLAS_VISUALES, type PaletaPresentacion, type PlantillaVisual } from '@/components/pastoral/pastoral-editor-presets'",
    "import { PALETAS_PRESENTACION, type PaletaPresentacion } from '@/components/pastoral/pastoral-editor-presets'",
    'remove template-only preset imports',
)
replace_once(
    "type PanelEditor = 'plantillas' | 'temas' | 'fondos' | 'recursos' | 'texto' | 'biblia' | 'capas' | 'diseno' | 'ajustes'",
    "type PanelEditor = 'fondos' | 'texto' | 'biblia' | 'capas' | 'diseno' | 'ajustes'",
    'PanelEditor native union',
)
replace_once(
    "const HERRAMIENTAS: Array<{ id: GrupoPrincipal; label: string; icon: typeof LayoutTemplate }> = [",
    "const HERRAMIENTAS: Array<{ id: GrupoPrincipal; label: string; icon: typeof Palette }> = [",
    'native tool icon type',
)
replace_once(
    "const tamanoPlantillaCanvas = (pt: number) => Math.max(9, Math.round(pt * .56))\nconst TEXTOS_PLACEHOLDER_PLANTILLA = new Set(['Título', 'Subtítulo', 'Escribe el contenido', 'Escribe aquí'])\n",
    "",
    'remove template-only constants',
)

helper_start = text.find("function textoMuestraPlantilla(")
helper_end = text.find("function normalizarPaginaEditor", helper_start)
if helper_start < 0 or helper_end < 0:
    raise SystemExit('template-only helper block not found')
text = text[:helper_start] + text[helper_end:]

apply_start = text.find("  const aplicarPlantilla =")
apply_end = text.find("\n  const nuevaPagina =", apply_start)
if apply_start < 0 or apply_end < 0:
    raise SystemExit('aplicarPlantilla block not found')
text = text[:apply_start] + text[apply_end+1:]

if 'clamp(' not in text:
    replace_once(
        "  ESTILOS_TEXTO, FORMATOS_LIENZO, FUENTES_PASTORALES, TEMAS_LIENZO, clamp, clonar, limpiarHtmlCanvas,",
        "  ESTILOS_TEXTO, FORMATOS_LIENZO, FUENTES_PASTORALES, TEMAS_LIENZO, clonar, limpiarHtmlCanvas,",
        'remove dead clamp import',
    )

replace_once(
    "const [destinoSubida, setDestinoSubida] = useState<DestinoSubida>('elemento')",
    "const [destinoSubida, setDestinoSubida] = useState<DestinoSubida>('fondo')",
    'background image destination default',
)

old_toggle = """  const alternarGrupoPrincipal = (grupo: GrupoPrincipal) => {
    if (grupoPrincipal === grupo) { setGrupoPrincipal(null); setPanel(null); return }
    setGrupoPrincipal(grupo)
    setPanel(PANEL_INICIAL[grupo])
  }"""
new_toggle = """  const alternarGrupoPrincipal = (grupo: GrupoPrincipal) => {
    if (grupoPrincipal === grupo) { setGrupoPrincipal(null); setPanel(null); return }
    setGrupoPrincipal(grupo)
    if (grupo === 'fondos') setDestinoSubida('fondo')
    setPanel(PANEL_INICIAL[grupo])
  }"""
replace_once(old_toggle, new_toggle, 'background group destination')

panel_start = text.find("    {panel === 'fondos' &&")
panel_end = text.find("\n\n    {panel === 'texto' &&", panel_start)
if panel_start < 0 or panel_end < 0:
    raise SystemExit('native Fondos panel boundaries not found')

new_panel = r"""    {panel === 'fondos' && <div className="pastoral-panel-content grid gap-5 pb-2 pt-1">
      {[
        { id: 'flat', label: 'Colores flat', opciones: paletasColoresFlat, tema: false },
        { id: 'degradados', label: 'Degradados', opciones: paletasDegradados, tema: false },
        { id: 'texturas', label: 'Texturas', opciones: paletasTexturas, tema: false },
        { id: 'temas', label: 'Temas', opciones: PALETAS_PRESENTACION, tema: true },
      ].map((seccion) => <section key={seccion.id} className="grid gap-2">
        <p className="px-1 text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{seccion.label}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={seccion.label}>
          {seccion.opciones.map((paleta) => <button key={`${seccion.id}-${paleta.id}`} type="button" onClick={() => seccion.tema ? aplicarPaleta(paleta) : aplicarFondoVisual(paleta)} className="grid w-[62px] shrink-0 gap-1.5 text-center" aria-label={`${seccion.tema ? 'Aplicar tema' : 'Aplicar fondo'} ${paleta.label}`} title={paleta.label}><span className="mx-auto block h-12 w-12 rounded-full border border-slate-200" style={{ background: paleta.fondo }} /><small className="block truncate text-[9px] font-semibold text-slate-500">{paleta.label}</small></button>)}
        </div>
      </section>)}

      <section className="grid gap-2">
        <p className="px-1 text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Imágenes</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full border border-slate-200 bg-white p-1" aria-label="Destino de imagen">
            <button type="button" onClick={() => pagina.fondo_modo === 'imagen' && (pagina.fondo_recurso_id ?? pagina.recurso_id) ? restaurarFondoComoImagen() : setDestinoSubida('elemento')} className={`min-h-8 rounded-full px-3 text-[10px] font-bold ${destinoSubida === 'elemento' ? 'bg-slate-100 text-violet-700' : 'text-slate-500'}`} aria-pressed={destinoSubida === 'elemento'}>Imagen</button>
            <button type="button" onClick={() => elementoSeleccionado?.tipo === 'imagen' ? convertirImagenEnFondo(elementoSeleccionado.id) : setDestinoSubida('fondo')} className={`min-h-8 rounded-full px-3 text-[10px] font-bold ${destinoSubida === 'fondo' ? 'bg-slate-100 text-violet-700' : 'text-slate-500'}`} aria-pressed={destinoSubida === 'fondo'}>Como fondo</button>
          </div>
          <button type="button" onClick={() => prepararSubida(destinoSubida)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"><Upload className="h-4 w-4" /> Subir imagen</button>
        </div>
        <input value={busquedaRecursos} onChange={(e) => setBusquedaRecursos(e.target.value)} placeholder="Buscar en biblioteca" className="min-h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-xs text-slate-700 outline-none" />
        {recursosFiltrados.length ? <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Imágenes de la biblioteca">{recursosFiltrados.slice(0, 30).map((recurso) => <button key={recurso.id} type="button" onClick={() => destinoSubida === 'fondo' ? aplicarFondoImagen(recurso) : agregarImagen(recurso)} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label={`${destinoSubida === 'fondo' ? 'Aplicar como fondo' : 'Insertar imagen'} ${recurso.titulo}`}><img src={recurso.acceso_url ?? ''} alt={recurso.titulo} className="h-full w-full object-cover" /></button>)}</div> : <p className="px-1 text-[10px] text-slate-400">No hay imágenes en tu biblioteca todavía.</p>}
        <div className="flex flex-wrap gap-3">{BANCOS_EXTERNOS.map((banco) => <a key={banco.label} href={banco.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">{banco.label}<ExternalLink className="h-3 w-3" /></a>)}</div>
      </section>
    </div>}"""
text = text[:panel_start] + new_panel + text[panel_end:]

replace_once(
    "${grupoPrincipal === id ? 'text-indigo-600' : 'text-slate-500'}",
    "${grupoPrincipal === id ? 'text-violet-600' : 'text-slate-500'}",
    'purple active primary icon',
)

for forbidden in ["panel === 'plantillas'", "label: 'Plantillas'", ">En blanco<"]:
    if forbidden in text:
        raise SystemExit(f'legacy visible Plantillas marker survived: {forbidden}')

workspace_path.write_text(text, encoding='utf-8')

replacements = {
"Centro Pastoral fija el lienzo y deja páginas arriba junto a Compartir": r"""test('Centro Pastoral conserva lienzo, cabecera y herramientas nativas sin runtime de Plantillas', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const currentWrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
  const header = currentWorkspace.indexOf('<header')
  const compartir = currentWorkspace.indexOf('>Compartir<', header)
  const selectorPagina = currentWorkspace.indexOf('Página ${indice + 1} de ${paginas.length}', compartir)
  const lienzo = currentWorkspace.indexOf('pastoral-stage-flow', selectorPagina)
  const herramientas = currentWorkspace.indexOf('aria-label="Herramientas del lienzo"', lienzo)
  assert.ok(header >= 0 && compartir > header && selectorPagina > compartir && lienzo > selectorPagina && herramientas > lienzo)
  assert.ok(currentWrapper.includes('PastoralVisualWorkspaceV4'))
  assert.ok(!currentWrapper.includes('PastoralTemplateRuntime'))
})""",
"dock principal mantiene tres grupos y suma Borrar para cualquier selección": r"""test('dock principal mantiene Fondos Texto Capas y Borrar separado', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const dock = currentWorkspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Fondos', 'Texto', 'Capas']) assert.ok(dock.includes(`label: '${label}'`))
  assert.ok(!dock.includes('Plantillas'))
  assert.ok(currentWorkspace.includes("type GrupoPrincipal = 'fondos' | 'texto' | 'capas'"))
  assert.ok(currentWorkspace.includes('aria-label="Borrar elemento seleccionado"'))
  assert.ok(currentWorkspace.includes("text-violet-600"))
})""",
"herramientas viven en una sola cinta centrada de tres opciones": r"""test('herramientas viven en una píldora blanca nativa de tres opciones', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const dock = currentWorkspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Fondos', 'Texto', 'Capas']) assert.ok(dock.includes(`label: '${label}'`))
  assert.ok(currentWorkspace.includes('rounded-full border border-slate-200 bg-white p-1'))
  assert.ok(currentWorkspace.includes('rounded-full bg-transparent'))
  assert.ok(currentWorkspace.includes('shadow-none'))
  assert.ok(currentWorkspace.includes("text-violet-600"))
})""",
"Fondo deja de ser submenú y se conserva como modo dentro de Imágenes": r"""test('Fondos es grupo principal y contiene recursos de imagen en el mismo panel', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const dock = currentWorkspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  const fondos = currentWorkspace.slice(currentWorkspace.indexOf("panel === 'fondos'"), currentWorkspace.indexOf("panel === 'texto'"))
  assert.ok(dock.includes("id: 'fondos', label: 'Fondos'"))
  assert.ok(currentWorkspace.includes('fondos: []'))
  assert.ok(fondos.includes('Imágenes'))
  assert.ok(fondos.includes('Como fondo'))
  assert.ok(fondos.includes('aplicarFondoImagen'))
  assert.ok(fondos.includes('prepararSubida(destinoSubida)'))
})""",
"tres herramientas visibles conservan lenguaje integrado": r"""test('tres herramientas visibles usan estado neutro y solo icono activo morado', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const dock = currentWorkspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Fondos', 'Texto', 'Capas']) assert.ok(dock.includes(`label: '${label}'`))
  assert.ok(currentWorkspace.includes('rounded-full bg-transparent'))
  assert.ok(currentWorkspace.includes('shadow-none'))
  assert.ok(currentWorkspace.includes("text-violet-600"))
  assert.ok(currentWorkspace.includes("text-slate-500"))
})""",
"Borrar y Fondo no compiten como herramientas principales": r"""test('Borrar queda separado de los tres grupos principales', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const dock = currentWorkspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  assert.ok(dock.includes("label: 'Fondos'"))
  assert.ok(!dock.includes('Borrar'))
  assert.ok(currentWorkspace.includes('aria-label="Borrar elemento seleccionado"'))
  assert.ok(currentWorkspace.includes('pastoral-tool-dock flex w-full items-center gap-2'))
})""",
"Plantillas aplican composición real con escala inicial moderada y límites seguros": r"""test('Fondos simples cambian solo el fondo y Temas conserva composición completa', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const fondo = currentWorkspace.slice(currentWorkspace.indexOf('const aplicarFondoVisual'), currentWorkspace.indexOf('const aplicarPaleta'))
  const tema = currentWorkspace.slice(currentWorkspace.indexOf('const aplicarPaleta'), currentWorkspace.indexOf('const nuevaPagina'))
  assert.ok(fondo.includes('actualizarPagina'))
  assert.ok(fondo.includes('fondo: paleta.fondo'))
  assert.ok(!fondo.includes('color_texto'))
  assert.ok(!fondo.includes('elementos'))
  assert.ok(tema.includes('color_texto: paleta.texto'))
  assert.ok(tema.includes('elementos'))
})""",
"Plantillas y Temas crecen verticalmente en filas de tres": r"""test('Fondos organiza flat degradados texturas temas e imágenes en cintas compactas', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const fondos = currentWorkspace.slice(currentWorkspace.indexOf("panel === 'fondos'"), currentWorkspace.indexOf("panel === 'texto'"))
  for (const label of ['Colores flat', 'Degradados', 'Texturas', 'Temas', 'Imágenes']) assert.ok(fondos.includes(label))
  assert.ok(fondos.includes('overflow-x-auto'))
  assert.ok(fondos.includes('h-12 w-12 rounded-full'))
  assert.ok(!fondos.includes('Plantillas en filas de tres'))
})""",
"la arquitectura real mantiene tres grupos y las nuevas acciones aprobadas": r"""test('la arquitectura real mantiene Fondos Texto Capas y paneles existentes', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  assert.ok(currentWorkspace.includes("type GrupoPrincipal = 'fondos' | 'texto' | 'capas'"))
  assert.ok(currentWorkspace.includes("const PANEL_INICIAL: Record<GrupoPrincipal, PanelEditor> = { fondos: 'fondos', texto: 'texto', capas: 'capas' }"))
  assert.ok(currentWorkspace.includes("panel === 'biblia'"))
  assert.ok(currentWorkspace.includes("panel === 'capas'"))
  assert.ok(currentWorkspace.includes("panel === 'diseno'"))
  assert.ok(currentWorkspace.includes("panel === 'ajustes'"))
})""",
"Plantillas aplican composición con escala moderada y límites seguros al texto existente": r"""test('Fondos flat degradado y textura no alteran texto existente', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const fondo = currentWorkspace.slice(currentWorkspace.indexOf('const aplicarFondoVisual'), currentWorkspace.indexOf('const aplicarPaleta'))
  assert.ok(fondo.includes("fondo_modo: 'color'"))
  assert.ok(fondo.includes('fondo: paleta.fondo'))
  for (const marker of ['color_texto', 'elementos', 'paleta.titulo', 'paleta.texto']) assert.ok(!fondo.includes(marker))
  const fondosPanel = currentWorkspace.slice(currentWorkspace.indexOf("panel === 'fondos'"), currentWorkspace.indexOf("panel === 'texto'"))
  assert.ok(fondosPanel.includes("seccion.tema ? aplicarPaleta(paleta) : aplicarFondoVisual(paleta)"))
})""",
"En blanco modifica la página actual y solo el control superior crea página": r"""test('Plantillas y En blanco desaparecen de la ruta visible; Nueva página sigue arriba', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  assert.ok(!currentWorkspace.includes("panel === 'plantillas'"))
  assert.ok(!currentWorkspace.includes("label: 'Plantillas'"))
  assert.ok(!currentWorkspace.includes('>En blanco<'))
  assert.equal((currentWorkspace.match(/onClick=\{nuevaPagina\}/g) ?? []).length, 1)
  assert.ok(currentWorkspace.includes('aria-label="Nueva página"'))
})""",
"dock mantiene solo los tres grupos principales aprobados": r"""test('dock mantiene solo Fondos Texto y Capas como grupos principales', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const dock = currentWorkspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Fondos', 'Texto', 'Capas']) assert.ok(dock.includes(`label: '${label}'`))
  for (const label of ['Plantillas', 'Elementos', 'Biblia', 'Diseño', 'Párrafo', 'Borrar']) assert.ok(!dock.includes(`label: '${label}'`))
  assert.ok(currentWorkspace.includes('fondos: []'))
})""",
"Biblia entra directamente en panel e Imágenes absorbe la opción de fondo": r"""test('Biblia sigue directa e Imágenes vive dentro de Fondos', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  assert.ok(currentWorkspace.includes("panel === 'biblia'"))
  assert.ok(currentWorkspace.includes('PastoralVersePicker'))
  const fondos = currentWorkspace.slice(currentWorkspace.indexOf("panel === 'fondos'"), currentWorkspace.indexOf("panel === 'texto'"))
  assert.ok(fondos.includes('Imágenes'))
  assert.ok(fondos.includes('Como fondo'))
  assert.ok(fondos.includes('aplicarFondoImagen'))
  assert.ok(fondos.includes('agregarImagen'))
})""",
"Plantillas usa el mismo catálogo administrado para preview y muestras": r"""test('el editor deja de montar runtime de Plantillas y conserva el catálogo administrado fuera de la ruta visible', () => {
  const currentProyecto = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')
  assert.ok(currentProyecto.includes('PastoralVisualWorkspaceV4'))
  assert.ok(!currentProyecto.includes('PastoralTemplateRuntime'))
  assert.ok(!currentWorkspace.includes('PLANTILLAS_VISUALES'))
  assert.ok(presets.includes('PLANTILLAS_VISUALES'))
})""",
"las plantillas conservan contenido e imágenes y aplican composición segura al texto existente": r"""test('cambiar un fondo simple conserva contenido e imágenes del lienzo', () => {
  const currentWorkspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
  const fondo = currentWorkspace.slice(currentWorkspace.indexOf('const aplicarFondoVisual'), currentWorkspace.indexOf('const aplicarPaleta'))
  assert.ok(fondo.includes('actualizarPagina'))
  assert.ok(fondo.includes('fondo: paleta.fondo'))
  assert.ok(!fondo.includes('elementos'))
  assert.ok(!fondo.includes('color_texto'))
  assert.ok(currentWorkspace.includes('const agregarImagen'))
  assert.ok(currentWorkspace.includes('const aplicarFondoImagen'))
})""",
}

def replace_test_block(contents: str, old_title: str, new_block: str):
    starts = []
    for needle in [f"test('{old_title}'", f'test("{old_title}"']:
        pos = contents.find(needle)
        if pos >= 0:
            starts.append(pos)
    if len(starts) != 1:
        return None
    start = starts[0]
    next_test = contents.find('\ntest(', start + 5)
    end = len(contents) if next_test < 0 else next_test + 1
    return contents[:start] + new_block.rstrip() + '\n\n' + contents[end:]

test_files = sorted((root / 'tests/regression').glob('*.test.mjs'))
found = {}
for old_title, new_block in replacements.items():
    matches = []
    for path in test_files:
        contents = path.read_text(encoding='utf-8')
        if f"test('{old_title}'" in contents or f'test("{old_title}"' in contents:
            matches.append(path)
    if len(matches) != 1:
        raise SystemExit(f"stale test title {old_title!r}: expected 1 file, found {len(matches)}")
    path = matches[0]
    contents = path.read_text(encoding='utf-8')
    updated = replace_test_block(contents, old_title, new_block)
    if updated is None:
        raise SystemExit(f'could not replace test block: {old_title}')
    path.write_text(updated, encoding='utf-8')
    found[old_title] = str(path.relative_to(root))

final = workspace_path.read_text(encoding='utf-8')
required = [
    "type GrupoPrincipal = 'fondos' | 'texto' | 'capas'",
    "{ id: 'fondos', label: 'Fondos', icon: Palette }",
    "fondos: []",
    "panel === 'fondos'",
    "Colores flat", "Degradados", "Texturas", "Temas", "Imágenes",
    "const aplicarFondoVisual",
    "const aplicarPaleta",
    "text-violet-600",
    'aria-label="Borrar elemento seleccionado"',
]
for marker in required:
    if marker not in final:
        raise SystemExit(f'missing final contract marker: {marker}')
for marker in ["panel === 'plantillas'", "label: 'Plantillas'", 'PastoralTemplateRuntime']:
    if marker in final:
        raise SystemExit(f'legacy marker survived final workspace: {marker}')

enhancements = (root / 'components/pastoral/PastoralEditorRuntimeEnhancements.tsx').read_text(encoding='utf-8')
if 'limpiarFondosDuplicados' in enhancements:
    raise SystemExit('legacy limpiarFondosDuplicados still active')
if (root / 'components/pastoral/PastoralTemplateRuntime.tsx').exists():
    raise SystemExit('legacy PastoralTemplateRuntime file should already be removed')

print(f'Updated native Fondos source and {len(found)} stale regression contracts.')
for title, path in found.items():
    print(f'- {path}: {title}')
