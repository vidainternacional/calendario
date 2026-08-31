from pathlib import Path
import re

workspace = Path('components/pastoral/PastoralVisualWorkspaceV4.tsx')
text = workspace.read_text(encoding='utf-8')

def replace_once(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f'Missing expected block: {label}')
    text = text.replace(old, new, 1)

replace_once(
    "  Monitor, Plus, Redo2, Save, Share2, Smartphone, Square, Strikethrough,",
    "  Monitor, Palette, Plus, Redo2, Save, Share2, Smartphone, Square, Strikethrough,",
    'Palette import',
)
replace_once(
    "type GrupoPrincipal = 'plantillas' | 'texto' | 'capas'",
    "type GrupoPrincipal = 'fondos' | 'texto' | 'capas'",
    'GrupoPrincipal',
)
replace_once(
    "const HERRAMIENTAS: Array<{ id: GrupoPrincipal; label: string; icon: typeof LayoutTemplate }> = [\n  { id: 'plantillas', label: 'Plantillas', icon: LayoutTemplate },\n  { id: 'texto', label: 'Texto', icon: Type },\n  { id: 'capas', label: 'Capas', icon: Layers },\n]",
    "const HERRAMIENTAS: Array<{ id: GrupoPrincipal; label: string; icon: typeof LayoutTemplate }> = [\n  { id: 'fondos', label: 'Fondos', icon: Palette },\n  { id: 'texto', label: 'Texto', icon: Type },\n  { id: 'capas', label: 'Capas', icon: Layers },\n]",
    'HERRAMIENTAS',
)
replace_once(
    "const SUBMENUS: Record<GrupoPrincipal, Array<{ id: PanelEditor; label: string }>> = {\n  plantillas: [\n    { id: 'plantillas', label: 'Plantillas' },\n    { id: 'temas', label: 'Temas' },\n    { id: 'recursos', label: 'Imágenes' },\n  ],\n  texto: [\n    { id: 'texto', label: 'Herramientas' },\n    { id: 'biblia', label: 'Biblia' },\n  ],\n  capas: [\n    { id: 'capas', label: 'Capas' },\n    { id: 'diseno', label: 'Relación' },\n    { id: 'ajustes', label: 'Ajustes' },\n  ],\n}\nconst PANEL_INICIAL: Record<GrupoPrincipal, PanelEditor> = { plantillas: 'plantillas', texto: 'texto', capas: 'capas' }",
    "const SUBMENUS: Record<GrupoPrincipal, Array<{ id: PanelEditor; label: string }>> = {\n  fondos: [],\n  texto: [\n    { id: 'texto', label: 'Herramientas' },\n    { id: 'biblia', label: 'Biblia' },\n  ],\n  capas: [\n    { id: 'capas', label: 'Capas' },\n    { id: 'diseno', label: 'Relación' },\n    { id: 'ajustes', label: 'Ajustes' },\n  ],\n}\nconst PANEL_INICIAL: Record<GrupoPrincipal, PanelEditor> = { fondos: 'fondos', texto: 'texto', capas: 'capas' }",
    'SUBMENUS/PANEL_INICIAL',
)
replace_once(
    "  const [grupoPrincipal, setGrupoPrincipal] = useState<GrupoPrincipal | null>('plantillas')\n  const [panel, setPanel] = useState<PanelEditor | null>('plantillas')",
    "  const [grupoPrincipal, setGrupoPrincipal] = useState<GrupoPrincipal | null>('fondos')\n  const [panel, setPanel] = useState<PanelEditor | null>('fondos')",
    'initial editor state',
)

marker = "  const recursosFiltrados = useMemo(() => {\n    const q = busquedaRecursos.trim().toLowerCase()\n    return q ? imagenes.filter((item) => `${item.titulo} ${item.descripcion} ${item.categoria}`.toLowerCase().includes(q)) : imagenes\n  }, [imagenes, busquedaRecursos])"
insert = marker + "\n  const paletasColoresFlat = useMemo(() => PALETAS_PRESENTACION.filter((paleta) => !paleta.fondo.toLowerCase().includes('gradient')), [])\n  const paletasDegradados = useMemo(() => PALETAS_PRESENTACION.filter((paleta) => { const fondo = paleta.fondo.toLowerCase(); return fondo.includes('gradient') && !fondo.includes('repeating-') }), [])\n  const paletasTexturas = useMemo(() => PALETAS_PRESENTACION.filter((paleta) => paleta.fondo.toLowerCase().includes('repeating-')), [])"
replace_once(marker, insert, 'background palette groups')

replace_once(
    "  const aplicarPaleta = (paleta: PaletaPresentacion) => {",
    "  const aplicarFondoVisual = (paleta: PaletaPresentacion) => actualizarPagina({ fondo_modo: 'color', fondo: paleta.fondo, fondo_recurso_id: null, recurso_id: null })\n\n  const aplicarPaleta = (paleta: PaletaPresentacion) => {",
    'background-only apply function',
)
replace_once(
    "  const clasePanel = grupoPrincipal === 'plantillas' ? 'panel-plantillas' : panel ? `panel-${panel}` : `panel-${grupoPrincipal ?? 'vacio'}`",
    "  const clasePanel = panel ? `panel-${panel}` : `panel-${grupoPrincipal ?? 'vacio'}`",
    'panel class',
)

fondos_panel = '''
    {panel === 'fondos' && <div className="pastoral-panel-content grid gap-5 pb-2 pt-1">
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
    </div>}
'''
pattern = re.compile(r"\n    \{panel === 'plantillas'.*?\n    \{panel === 'texto'", re.S)
if len(pattern.findall(text)) != 1:
    raise SystemExit('Expected exactly one legacy Plantillas/Temas/Recursos panel block')
text = pattern.sub("\n" + fondos_panel + "\n    {panel === 'texto'", text, count=1)

old_toolbar = re.compile(r'''          <div className="pastoral-tool-dock" aria-label="Herramientas del lienzo">.*?</div>\n          \{grupoPrincipal && <aside className=\{`pastoral-tool-panel-flow \$\{clasePanel\}`\} aria-label=\{`Panel \$\{grupoPrincipal\}`\}>.*?</aside>\}''', re.S)
new_toolbar = '''          <div className="pastoral-tool-dock flex w-full items-center gap-2 px-2 py-2" aria-label="Herramientas del lienzo"><div className="flex min-w-0 flex-1 items-stretch gap-1 rounded-full border border-slate-200 bg-white p-1">{HERRAMIENTAS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => alternarGrupoPrincipal(id)} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full bg-transparent px-2 py-1 text-slate-600 shadow-none" aria-pressed={grupoPrincipal === id} aria-expanded={grupoPrincipal === id} aria-label={label} title={label}><Icon className={`h-[18px] w-[18px] ${grupoPrincipal === id ? 'text-indigo-600' : 'text-slate-500'}`} /><small className="text-[10px] font-bold text-slate-700">{label}</small></button>)}</div><button type="button" disabled={!elementoSeleccionado || elementoSeleccionado.bloqueado} onClick={() => elementoSeleccionado && eliminarElemento(elementoSeleccionado.id)} className="grid h-11 w-11 min-w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-30" aria-label="Borrar elemento seleccionado" title="Borrar"><Trash2 className="h-[18px] w-[18px]" /></button></div>
          {grupoPrincipal && <aside className={`pastoral-tool-panel-flow ${clasePanel}`} aria-label={`Panel ${grupoPrincipal}`}><div className="pastoral-tool-panel-flow-scroll px-3 pb-3 pt-2"><div className="flex flex-col">{SUBMENUS[grupoPrincipal].length > 0 && <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`Opciones de ${grupoPrincipal}`}>{SUBMENUS[grupoPrincipal].map((item) => <button key={item.id} type="button" onClick={() => alternarSubpanel(item.id)} className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-bold ${panel === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`} aria-pressed={panel === item.id}>{item.label}</button>)}</div>}<div className={`min-h-0 flex-1 ${SUBMENUS[grupoPrincipal].length > 0 ? 'pt-2' : ''}`}>{panelContenido}</div></div></div></aside>}'''
matches = old_toolbar.findall(text)
if len(matches) != 1:
    raise SystemExit(f'Expected exactly one toolbar/aside block, found {len(matches)}')
text = old_toolbar.sub(new_toolbar, text, count=1)
workspace.write_text(text, encoding='utf-8')

enhancements = Path('components/pastoral/PastoralEditorRuntimeEnhancements.tsx')
enh = enhancements.read_text(encoding='utf-8')
enh, count = re.subn(r"function limpiarFondosDuplicados\(\) \{.*?\n\}\n\n(?=function renombrarTextoLibre)", '', enh, count=1, flags=re.S)
if count != 1:
    raise SystemExit('Could not remove limpiarFondosDuplicados')
if '        limpiarFondosDuplicados()\n' not in enh:
    raise SystemExit('Could not find limpiarFondosDuplicados call')
enh = enh.replace('        limpiarFondosDuplicados()\n', '', 1)
enhancements.write_text(enh, encoding='utf-8')

wrapper = Path('components/pastoral/ProyectoContenidoWorkspace.tsx')
wrap = wrapper.read_text(encoding='utf-8')
if "import PastoralTemplateRuntime from '@/components/pastoral/PastoralTemplateRuntime'\n" not in wrap:
    raise SystemExit('PastoralTemplateRuntime import missing')
if "    <PastoralTemplateRuntime catalogo={catalogo} />\n" not in wrap:
    raise SystemExit('PastoralTemplateRuntime render missing')
wrap = wrap.replace("import PastoralTemplateRuntime from '@/components/pastoral/PastoralTemplateRuntime'\n", '', 1)
wrap = wrap.replace("    <PastoralTemplateRuntime catalogo={catalogo} />\n", '', 1)
wrapper.write_text(wrap, encoding='utf-8')
