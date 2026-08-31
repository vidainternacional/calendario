from pathlib import Path
import json
import re

EXPECTED_HEAD = '527767f7e42a37712110b932c469bf11adece11c'


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old, new, 1)


def norm_hebrew(value: str) -> str:
    return re.sub(r'[^\u05D0-\u05EA]', '', value or '')


def norm_strong(value: str) -> str:
    m = re.fullmatch(r'([HA])(\d+)', value or '', re.I)
    if not m:
        return (value or '').upper()
    return f'{m.group(1).upper()}{int(m.group(2))}'


def build_gloss_index() -> None:
    with open('/tmp/ubs-hebrew-es.json', encoding='utf-8') as f:
        data = json.load(f)

    por_strong = {}
    por_lemma = {}
    for entry in data:
        lemma = entry.get('Lemma') or ''
        lemma_key = norm_hebrew(lemma)
        strongs = [norm_strong(s) for s in (entry.get('StrongCodes') or []) if str(s).upper().startswith('H')]
        if not strongs:
            continue

        chosen = None
        for base in entry.get('BaseForms') or []:
            for meaning in base.get('LEXMeanings') or []:
                for sense in meaning.get('LEXSenses') or []:
                    if sense.get('LanguageCode') != 'es':
                        continue
                    glosses = [str(g).strip() for g in (sense.get('Glosses') or []) if str(g).strip()]
                    definition = str(sense.get('DefinitionShort') or '').strip()
                    if glosses or definition:
                        chosen = {
                            'lemma': lemma,
                            'glosses': glosses[:3],
                            'definicion': re.sub(r'^=\s*', '', definition),
                        }
                        break
                if chosen:
                    break
            if chosen:
                break
        if not chosen:
            continue

        primary = strongs[0]
        for strong in strongs:
            por_strong.setdefault(strong, chosen)
        if lemma_key:
            por_lemma.setdefault(lemma_key, primary)

    out = {
        'fuente': 'UBS Dictionary of Biblical Hebrew © United Bible Societies, 2023; adaptado de Semantic Dictionary of Biblical Hebrew © 2000-2023 United Bible Societies.',
        'licencia': 'CC BY-SA 4.0',
        'url': 'https://github.com/ubsicap/ubs-open-license/tree/main/dictionaries/hebrew',
        'porStrong': por_strong,
        'porLemma': por_lemma,
    }
    path = Path('public/data/ubs-hebrew-es-glosses.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    assert len(por_strong) > 5000, len(por_strong)
    assert por_strong.get('H7225', {}).get('glosses'), por_strong.get('H7225')
    assert 'principio' in [g.lower() for g in por_strong['H7225']['glosses']], por_strong['H7225']
    print('Hebrew gloss entries:', len(por_strong), 'bytes:', path.stat().st_size)
    print('H7225:', por_strong['H7225'])


def patch_workspace() -> None:
    path = Path('components/pastoral/PastoralVisualWorkspaceV4.tsx')
    text = path.read_text(encoding='utf-8')

    old_resources = '''        {recursosFiltrados.length ? <div className="grid grid-cols-3 gap-2">{recursosFiltrados.map((recurso) => <article key={recurso.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={recurso.acceso_url ?? ''} alt="" className="aspect-square w-full object-cover" />
          <div className="grid grid-cols-2 border-t border-slate-100">
            <button type="button" onClick={() => usarRecursoComoImagen(recurso)} className="min-h-9 border-r border-slate-100 px-1 text-[10px] font-black text-slate-600" aria-label={`Usar ${recurso.titulo} como imagen`}>Imagen</button>
            <button type="button" onClick={() => usarRecursoComoFondo(recurso)} className="min-h-9 px-1 text-[10px] font-black text-indigo-600" aria-label={`Usar ${recurso.titulo} como fondo`}>Fondo</button>
          </div>
        </article>)}</div> : <p className="text-[10px] text-slate-400">No hay imágenes disponibles todavía.</p>}'''
    new_resources = '''        {recursosFiltrados.length ? <div className="grid grid-cols-3 gap-2">{recursosFiltrados.map((recurso) => {
          const seleccionadoMismoRecurso = elementoSeleccionado?.tipo === 'imagen' && elementoSeleccionado.recurso_id === recurso.id ? elementoSeleccionado : null
          const imagenActiva = Boolean(seleccionadoMismoRecurso && !seleccionadoMismoRecurso.es_capa_fondo)
          const fondoActivo = Boolean(!imagenActiva && ((seleccionadoMismoRecurso?.es_capa_fondo) || (pagina.fondo_modo === 'imagen' && (pagina.fondo_recurso_id ?? pagina.recurso_id) === recurso.id)))
          return <article key={recurso.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img src={recurso.acceso_url ?? ''} alt="" className="aspect-square w-full object-cover" />
            <div className="grid grid-cols-2 border-t border-slate-100">
              <button type="button" onClick={() => usarRecursoComoImagen(recurso)} className={`min-h-9 border-r border-slate-100 px-1 text-[10px] font-black ${imagenActiva ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-600'}`} aria-pressed={imagenActiva} aria-label={`Usar ${recurso.titulo} como imagen`}>Imagen</button>
              <button type="button" onClick={() => usarRecursoComoFondo(recurso)} className={`min-h-9 px-1 text-[10px] font-black ${fondoActivo ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-600'}`} aria-pressed={fondoActivo} aria-label={`Usar ${recurso.titulo} como fondo`}>Fondo</button>
            </div>
          </article>
        })}</div> : <p className="text-[10px] text-slate-400">No hay imágenes disponibles todavía.</p>}'''
    text = replace_once(text, old_resources, new_resources, 'image mode state')

    old_layers = '''        <label className="flex items-center gap-3"><span className="w-[78px] shrink-0 text-[11px] font-black text-slate-500">Fusión</span><select disabled={elementoSeleccionado.bloqueado} value={elementoSeleccionado.modo_fusion ?? 'normal'} onPointerDown={() => !elementoSeleccionado.bloqueado && registrarHistorial()} onChange={(event) => !elementoSeleccionado.bloqueado && patchElementoSinHistorial(elementoSeleccionado.id, { modo_fusion: event.target.value as ModoFusion })} className="min-h-10 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none disabled:opacity-30" aria-label="Modo de fusión de la capa seleccionada">{MODOS_FUSION.map((modo) => <option key={modo.id} value={modo.id}>{modo.label}</option>)}</select></label>
        <small className="pl-[90px] leading-4 text-slate-400">La capa seleccionada se fusiona visualmente con todas las capas que tenga debajo, sin destruir ninguna.</small>
        {elementoSeleccionado.tipo === 'imagen' && <button type="button" disabled={elementoSeleccionado.bloqueado} onClick={() => elementoSeleccionado.es_capa_fondo ? convertirFondoEnImagen(elementoSeleccionado.id) : convertirImagenEnFondo(elementoSeleccionado.id)} className="ml-[90px] inline-flex min-h-9 w-fit items-center rounded-full border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 disabled:opacity-30">{elementoSeleccionado.es_capa_fondo ? 'Convertir a imagen' : 'Convertir a fondo'}</button>}'''
    new_layers = '''        <div className={`grid items-end gap-2 ${elementoSeleccionado.tipo === 'imagen' ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-1'}`}>
          <label className="grid min-w-0 gap-1"><span className="text-[10px] font-black text-slate-500">Fusión</span><select disabled={elementoSeleccionado.bloqueado} value={elementoSeleccionado.modo_fusion ?? 'normal'} onPointerDown={() => !elementoSeleccionado.bloqueado && registrarHistorial()} onChange={(event) => !elementoSeleccionado.bloqueado && patchElementoSinHistorial(elementoSeleccionado.id, { modo_fusion: event.target.value as ModoFusion })} className="min-h-10 min-w-0 w-full rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none disabled:opacity-30" aria-label="Modo de fusión de la capa seleccionada">{MODOS_FUSION.map((modo) => <option key={modo.id} value={modo.id}>{modo.label}</option>)}</select></label>
          {elementoSeleccionado.tipo === 'imagen' && <div className="grid gap-1"><span className="text-[10px] font-black text-slate-500">Tipo</span><div className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white p-1"><button type="button" disabled={elementoSeleccionado.bloqueado} onClick={() => elementoSeleccionado.es_capa_fondo && convertirFondoEnImagen(elementoSeleccionado.id)} className={`min-h-8 rounded-full px-2.5 text-[10px] font-black disabled:opacity-30 ${!elementoSeleccionado.es_capa_fondo ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`} aria-pressed={!elementoSeleccionado.es_capa_fondo}>Imagen</button><button type="button" disabled={elementoSeleccionado.bloqueado} onClick={() => !elementoSeleccionado.es_capa_fondo && convertirImagenEnFondo(elementoSeleccionado.id)} className={`min-h-8 rounded-full px-2.5 text-[10px] font-black disabled:opacity-30 ${elementoSeleccionado.es_capa_fondo ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`} aria-pressed={Boolean(elementoSeleccionado.es_capa_fondo)}>Fondo</button></div></div>}
        </div>'''
    text = replace_once(text, old_layers, new_layers, 'compact fusion/type row')
    path.write_text(text, encoding='utf-8')


def patch_verse_picker() -> None:
    path = Path('components/pastoral/PastoralVersePicker.tsx')
    text = path.read_text(encoding='utf-8')

    old_const = "const LIBROS_NT = new Set(['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'])\ntype Libro = { id: string; name: string; numberOfChapters: number }"
    new_const = """const LIBROS_NT = new Set(['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'])
const NOMBRES_HEBREOS: Record<string, string> = {
  GEN: 'Bereshit', EXO: 'Shemot', LEV: 'Vayikra', NUM: 'Bamidbar', DEU: 'Devarim', JOS: 'Yehoshua', JDG: 'Shoftim', RUT: 'Rut',
  '1SA': 'Shmuel Alef', '2SA': 'Shmuel Bet', '1KI': 'Melakhim Alef', '2KI': 'Melakhim Bet', '1CH': 'Divrei HaYamim Alef', '2CH': 'Divrei HaYamim Bet',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Iyov', PSA: 'Tehillim', PRO: 'Mishlei', ECC: 'Qohelet', SNG: 'Shir HaShirim',
  ISA: 'Yeshayahu', JER: 'Yirmeyahu', LAM: 'Eikhah', EZK: 'Yehezkel', DAN: 'Daniel', HOS: 'Hoshea', JOL: 'Yoel', AMO: 'Amos', OBA: 'Ovadia',
  JON: 'Yonah', MIC: 'Mikhah', NAM: 'Nahum', HAB: 'Havakuk', ZEP: 'Tzefaniah', HAG: 'Haggai', ZEC: 'Zekhariah', MAL: 'Malakhi',
}
type Libro = { id: string; name: string; numberOfChapters: number }
type AnotacionOriginal = { start: number; end: number; strongs?: string[]; lemma?: string }
type EntradaGlosaHebrea = { lemma: string; glosses: string[]; definicion?: string }
type IndiceGlosasHebreas = { fuente: string; licencia: string; url: string; porStrong: Record<string, EntradaGlosaHebrea>; porLemma: Record<string, string> }"""
    text = replace_once(text, old_const, new_const, 'Hebrew book names and gloss types')

    old_state = "  const [cargandoOriginal, setCargandoOriginal] = useState(false)"
    new_state = """  const [cargandoOriginal, setCargandoOriginal] = useState(false)
  const [anotacionesOriginal, setAnotacionesOriginal] = useState<Record<string, AnotacionOriginal[]>>({})
  const [glosarioHebreo, setGlosarioHebreo] = useState<IndiceGlosasHebreas | null>(null)"""
    text = replace_once(text, old_state, new_state, 'Hebrew gloss state')

    anchor_effect = "  }, [open, modoOriginal, traduccionOriginal?.id, libro, capitulo, idiomaOriginal])\n\n  const textoVersiculoActual"
    insert_effect = """  }, [open, modoOriginal, traduccionOriginal?.id, libro, capitulo, idiomaOriginal])

  useEffect(() => {
    if (!open || !modoOriginal || esNuevoTestamento || !traduccionOriginal || !libro) { setAnotacionesOriginal({}); return }
    fetch(`${API}/${traduccionOriginal.id}/${libro}/${capitulo}.words.json`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('words')))
      .then(d => setAnotacionesOriginal(d.verses ?? {}))
      .catch(() => setAnotacionesOriginal({}))
  }, [open, modoOriginal, esNuevoTestamento, traduccionOriginal?.id, libro, capitulo])

  useEffect(() => {
    if (!open || !modoOriginal || esNuevoTestamento || glosarioHebreo) return
    fetch('/data/ubs-hebrew-es-glosses.json')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('glosses')))
      .then((d: IndiceGlosasHebreas) => setGlosarioHebreo(d))
      .catch(() => setGlosarioHebreo(null))
  }, [open, modoOriginal, esNuevoTestamento, glosarioHebreo])

  const textoVersiculoActual"""
    text = replace_once(text, anchor_effect, insert_effect, 'original annotations effects')

    old_helpers = """  const textoVersiculoActual = (v: VersiculoElegido) => modoOriginal ? (originales[v.verso] ?? '') : v.texto
  const traduccionVersiculoActual = (v: VersiculoElegido) => modoOriginal ? etiquetaOriginal : v.traduccion

  const visibles = useMemo(() => {"""
    new_helpers = """  const textoVersiculoActual = (v: VersiculoElegido) => modoOriginal ? (originales[v.verso] ?? '') : v.texto
  const traduccionVersiculoActual = (v: VersiculoElegido) => modoOriginal ? etiquetaOriginal : v.traduccion
  const normalizarStrong = (valor?: string) => {
    const match = String(valor ?? '').toUpperCase().match(/^([HA])(\\d+)$/)
    return match ? `${match[1]}${Number(match[2])}` : String(valor ?? '').toUpperCase()
  }
  const normalizarHebreo = (valor?: string) => String(valor ?? '').replace(/[^א-ת]/g, '')
  const entradaGlosaHebrea = (palabra: string, anotacion?: AnotacionOriginal) => {
    if (!glosarioHebreo) return null
    for (const strong of anotacion?.strongs ?? []) {
      const entrada = glosarioHebreo.porStrong[normalizarStrong(strong)]
      if (entrada) return entrada
    }
    const lemma = normalizarHebreo(anotacion?.lemma)
    if (lemma) {
      const strong = glosarioHebreo.porLemma[lemma]
      if (strong && glosarioHebreo.porStrong[strong]) return glosarioHebreo.porStrong[strong]
    }
    const limpia = normalizarHebreo(palabra)
    const candidatos = [limpia]
    let actual = limpia
    for (let i = 0; i < 2 && actual.length > 2 && /^[ובכלמהש]/.test(actual); i += 1) {
      actual = actual.slice(1)
      candidatos.push(actual)
    }
    for (const candidato of candidatos) {
      const strong = glosarioHebreo.porLemma[candidato]
      if (strong && glosarioHebreo.porStrong[strong]) return glosarioHebreo.porStrong[strong]
    }
    return null
  }
  const palabrasOriginales = (v: VersiculoElegido) => {
    const texto = originales[v.verso] ?? ''
    const anotaciones = anotacionesOriginal[String(v.verso)] ?? []
    if (anotaciones.length) {
      const vistos = new Set<string>()
      return anotaciones.flatMap((anotacion, indicePalabra) => {
        const clave = `${anotacion.start}:${anotacion.end}`
        if (vistos.has(clave)) return []
        vistos.add(clave)
        const palabra = texto.slice(anotacion.start, anotacion.end).trim()
        if (!palabra) return []
        const entrada = entradaGlosaHebrea(palabra, anotacion)
        return [{ palabra, entrada, indicePalabra }]
      })
    }
    return texto.split(/\\s+/).filter(Boolean).map((palabra, indicePalabra) => ({ palabra, entrada: entradaGlosaHebrea(palabra), indicePalabra }))
  }
  const referenciaOriginal = (v: VersiculoElegido) => modoOriginal && !esNuevoTestamento ? `${NOMBRES_HEBREOS[v.libroId] ?? libroActual?.name ?? v.libroId} ${v.capitulo}:${v.verso}` : v.referencia

  const visibles = useMemo(() => {"""
    text = replace_once(text, old_helpers, new_helpers, 'Hebrew word lookup helpers')

    old_guide = """        <p className="pastoral-verse-guide">{modoOriginal ? `Selecciona versículos o toca una palabra en ${idiomaOriginal.toLowerCase()} para insertarla sola.` : 'Selecciona varios versículos. Los consecutivos se insertarán juntos en un solo bloque.'}</p>
      </>}"""
    new_guide = """        <p className="pastoral-verse-guide">{modoOriginal ? `Selecciona versículos o revisa cada palabra en ${idiomaOriginal.toLowerCase()} antes de insertarla.` : 'Selecciona varios versículos. Los consecutivos se insertarán juntos en un solo bloque.'}</p>
        {modoOriginal && !esNuevoTestamento && <p className="mx-3 -mt-1 text-[9px] leading-4 text-slate-400">Significados en español: UBS Dictionary of Biblical Hebrew · CC BY-SA 4.0.</p>}
      </>}"""
    text = replace_once(text, old_guide, new_guide, 'Hebrew source attribution')

    old_row = """              <span className="min-w-0 flex-1"><strong>{v.referencia}</strong><em dir={modoOriginal && !esNuevoTestamento ? 'rtl' : 'ltr'} lang={modoOriginal ? (esNuevoTestamento ? 'grc' : 'he') : 'es'}>{modoOriginal ? (cargandoOriginal ? 'Cargando original…' : originales[v.verso] || 'Original no disponible') : v.texto}</em></span>"""
    new_row = """              <span className="min-w-0 flex-1"><strong className="block">{referenciaOriginal(v)}</strong>{modoOriginal && !esNuevoTestamento && <small className="mt-1 block text-[10px] font-medium text-slate-400">{v.referencia}</small>}<em dir={modoOriginal && !esNuevoTestamento ? 'rtl' : 'ltr'} lang={modoOriginal ? (esNuevoTestamento ? 'grc' : 'he') : 'es'} className={modoOriginal ? 'mt-3 block text-[16px] not-italic leading-8 text-slate-700' : undefined}>{modoOriginal ? (cargandoOriginal ? 'Cargando original…' : originales[v.verso] || 'Original no disponible') : v.texto}</em></span>"""
    text = replace_once(text, old_row, new_row, 'Hebrew reference spacing')

    old_words = """            {modoOriginal && originales[v.verso] && <div dir={esNuevoTestamento ? 'ltr' : 'rtl'} className="flex flex-wrap gap-1 border-t border-slate-100 px-3 py-2">{originales[v.verso].split(/\\s+/).filter(Boolean).map((palabra, indicePalabra) => <button key={`${v.verso}-${indicePalabra}`} type="button" onClick={() => insertarPalabraOriginal(v, palabra)} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700" title={`Insertar ${palabra}`}>{palabra}</button>)}</div>}"""
    new_words = """            {modoOriginal && originales[v.verso] && <div dir={esNuevoTestamento ? 'ltr' : 'rtl'} className="grid grid-cols-2 gap-2 border-t border-slate-100 px-3 py-3">{palabrasOriginales(v).map(({ palabra, entrada, indicePalabra }) => <button key={`${v.verso}-${indicePalabra}-${palabra}`} type="button" onClick={() => insertarPalabraOriginal(v, palabra)} className="grid min-h-[66px] content-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-right" title={`Insertar ${palabra}`}><span dir={esNuevoTestamento ? 'ltr' : 'rtl'} className="text-[15px] font-bold leading-6 text-slate-800">{palabra}</span><span dir="ltr" className="text-[10px] font-bold leading-4 text-indigo-700">{entrada?.glosses?.length ? entrada.glosses.join(' · ') : 'Significado no disponible'}</span>{entrada?.definicion && <span dir="ltr" className="line-clamp-2 text-[9px] font-medium leading-3.5 text-slate-400">{entrada.definicion}</span>}</button>)}</div>}"""
    text = replace_once(text, old_words, new_words, 'Hebrew word meaning cards')
    path.write_text(text, encoding='utf-8')


if __name__ == '__main__':
    build_gloss_index()
    patch_workspace()
    patch_verse_picker()
