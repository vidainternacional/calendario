do $$
declare
  v_source_id uuid;
  v_item_id uuid;
begin
  select id into v_source_id
  from public.biblical_sources
  where slug = 'stepbible-lexical-pilot'
    and enabled = true
    and review_status = 'approved'
    and license_status = 'verified';

  if v_source_id is null then
    raise exception 'La fuente STEPBible aprobada no está disponible';
  end if;

  insert into public.biblical_library_items (
    source_id,
    slug,
    title,
    author,
    item_type,
    language,
    edition,
    description,
    source_locator,
    license_status,
    provider_version,
    content_hash,
    review_status,
    enabled,
    approved_at,
    metadata
  ) values (
    v_source_id,
    'stepbible-piloto-lexico-contextual',
    'STEPBible Data — piloto léxico contextual',
    'STEP Bible',
    'dictionary',
    'mul',
    'lexical-pilot-v1',
    'Recurso piloto que organiza datos léxicos breves y morfológicos ya aprobados para mostrar evidencia interna por pasaje, sin importar léxicos completos.',
    'https://github.com/STEPBible/STEPBible-Data',
    'verified',
    'lexical-pilot-v1',
    '9be435e9ade374554b72e7778fc4d71ba65a63d1f5ca06f4c6e6ef2bae8d8ac2',
    'approved',
    true,
    now(),
    jsonb_build_object(
      'pilot', true,
      'scope', 'Salmos 23:1 y Juan 3:16',
      'content_policy', 'resúmenes editoriales basados únicamente en entradas léxicas aprobadas',
      'ai_connected', false
    )
  )
  returning id into v_item_id;

  insert into public.biblical_library_fragments (
    item_id,
    source_id,
    slug,
    title,
    content,
    content_kind,
    language,
    book_code,
    chapter_start,
    verse_start,
    chapter_end,
    verse_end,
    reference_label,
    topics,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    approved_at,
    metadata
  ) values
  (
    v_item_id,
    v_source_id,
    'salmos-23-1-resumen-lexico-piloto',
    'Estructura léxica verificada de Salmos 23:1',
    'En el piloto de Salmos 23:1 aparecen tres formas verificadas: יְהוָה, רֹעִי y אֶחְסָר. La entrada רֹעִי se vincula al lema רָעָה, con la glosa breve «pastorear, cuidar»; אֶחְסָר se vincula a חָסֵר, «carecer, faltar». El registro permite observar la secuencia léxica principal, pero no reemplaza el análisis sintáctico completo ni autoriza a derivar una doctrina únicamente desde números de Strong.',
    'editorial_summary',
    'spa',
    'PSA',
    23,
    1,
    23,
    1,
    'Salmos 23:1',
    array['hebreo','léxico','pastorear','carecer'],
    'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt',
    'lexical-pilot-v1',
    '4f62e9489758d95e81323ee5c8a5397b47c777c5c7d43386bf970067bc9962e4',
    'approved',
    true,
    now(),
    jsonb_build_object('derived_from', 'biblical_lexical_entries', 'ai_generated', false)
  ),
  (
    v_item_id,
    v_source_id,
    'juan-3-16-resumen-lexico-piloto',
    'Formas griegas verificadas de Juan 3:16',
    'En Juan 3:16 el piloto conserva cuatro formas verificadas: ἠγάπησεν (ἀγαπάω, «amar»), θεὸς (θεός, «Dios»), κόσμον (κόσμος, «mundo») y πιστεύων (πιστεύω, «creer, confiar»). La morfología identifica ἠγάπησεν como aoristo activo indicativo y πιστεύων como participio presente activo. Esta evidencia describe la forma del texto, pero no resuelve por sí sola todos los debates interpretativos del pasaje.',
    'editorial_summary',
    'spa',
    'JHN',
    3,
    16,
    3,
    16,
    'Juan 3:16',
    array['griego','léxico','morfología','amor','creer'],
    'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt',
    'lexical-pilot-v1',
    '9d39de1c1d11a4e2dfabb242e9a19e5d1688ec8c64419809f0dd253864dfb83c',
    'approved',
    true,
    now(),
    jsonb_build_object('derived_from', 'biblical_lexical_entries', 'ai_generated', false)
  );
end
$$;
