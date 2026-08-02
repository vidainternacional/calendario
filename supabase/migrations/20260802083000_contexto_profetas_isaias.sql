-- FASE D · Bloque 4 · Profetas mayores 1: Isaías
update public.biblical_sources
set provider_version = 'profetas-mayores-v1-2026-08-02',
    content_hash = encode(extensions.digest('vida-contexto-editorial|profetas-mayores-v1-2026-08-02', 'sha256'), 'hex'),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'coverage', 'canon-through-major-prophets',
      'latest_batch', 'major-prophets',
      'generated_by_ai', false
    ),
    updated_at = now()
where slug = 'vida-contexto-editorial';

update public.biblical_books
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('coverage_status', 'context_ready'),
    updated_at = now()
where code = 'ISA';

with source as (
  select id from public.biblical_sources where slug = 'vida-contexto-editorial'
),
data(
  slug, book_code, scope_kind, chapter_start, verse_start, chapter_end, verse_end,
  title, summary, historical_context, jewish_context, literary_context,
  authorial_intent, theological_reflection, interpretive_cautions,
  key_terms, people_groups, places
) as (
  values
  ('isaias-perfil','ISA','book',1,NULL::smallint,66,NULL::smallint,
   'Isaías: santidad, juicio, consuelo y nueva creación',
   'Isaías reúne oráculos, narraciones y poemas que confrontan injusticia e idolatría, interpretan crisis asirias y exílicas y anuncian consuelo, retorno, un siervo y una creación renovada.',
   'El libro abarca y relee varios periodos: la amenaza asiria del siglo VIII a. C., la crisis babilónica y la esperanza de comunidades exílicas y postexílicas. Su formación literaria y las etapas de composición son ampliamente debatidas.',
   'Isaías es central en la liturgia y esperanza judías, especialmente sus visiones de Sion, consuelo, retorno y paz. Textos posteriormente leídos de manera mesiánica conservan primero su sentido dentro de la historia de Israel.',
   'Grandes bloques de juicio y esperanza están unidos por imágenes repetidas: el Santo de Israel, viña, remanente, camino, siervo, luz, Sion y nueva creación.',
   'Llamar a confiar en Dios en vez de alianzas opresivas, unir culto con justicia y sostener esperanza de restauración que alcance también a las naciones.',
   'La santidad divina confronta orgullo y abuso, pero también purifica, consuela y crea futuro. La esperanza bíblica no evade la historia; transforma la forma de vivir dentro de ella.',
   'No debe afirmarse que cada oráculo describe directamente un acontecimiento moderno. Las lecturas cristológicas son interpretaciones canónicas posteriores que deben distinguirse del horizonte histórico inicial. El término almah en Isaías 7 no debe presentarse como prueba lingüística simple de una traducción única.',
   ARRAY['Santo de Israel','Sion','remanente','siervo','consuelo','justicia','nueva creación']::text[],
   ARRAY['Judá','Jerusalén','asirios','babilonios','naciones']::text[],
   ARRAY['Jerusalén','Sion','Asiria','Babilonia']::text[]),
  ('isaias-1-12-jerusalen-asiria','ISA','section',1,NULL::smallint,12,NULL::smallint,
   'Judá, Sion y la crisis asiria',
   'Oráculos contra culto injusto, la visión del llamado de Isaías, señales relacionadas con Acaz y poemas sobre un futuro gobernante confrontan la incredulidad de Judá ante Asiria.',
   'La guerra siro-efraimita y la expansión asiria presionaron a Judá para formar alianzas. Acaz buscó apoyo imperial, con costos políticos y religiosos.',
   'La visión del templo presenta al Dios santo y a un profeta purificado. Las señales de Emanuel pertenecen primero a la crisis de Acaz y recibieron lecturas mesiánicas posteriores.',
   'Acusación, llamado profético, señales, nombres simbólicos y poemas de esperanza alternan juicio y remanente.',
   'Mostrar que ritual sin justicia es rechazado y que la confianza política basada en miedo puede someter a la comunidad al mismo poder del que busca protección.',
   'La experiencia de santidad no produce superioridad, sino reconocimiento, purificación y disponibilidad para servir. La paz futura comienza con justicia hacia el vulnerable.',
   'Isaías 1 no condena toda reunión religiosa, sino culto separado de justicia. Isaías 7:14 debe explicarse dentro de la señal a Acaz antes de presentar interpretaciones cristianas posteriores.',
   ARRAY['Acaz','Asiria','Emanuel','llamado','Sion','remanente','justicia']::text[],
   ARRAY['judíos','asirios','arameos','israelitas del norte']::text[],
   ARRAY['Jerusalén','Sion','Damasco','Samaria']::text[]),
  ('isaias-13-27-naciones','ISA','section',13,NULL::smallint,27,NULL::smallint,
   'Oráculos sobre naciones y esperanza universal',
   'Una colección de oráculos confronta Babilonia, Moab, Damasco, Egipto, Tiro y otros poderes, y culmina con poemas sobre juicio cósmico, banquete y victoria sobre la muerte.',
   'Las ciudades y reinos mencionados ocuparon posiciones cambiantes entre Asiria, Egipto y Babilonia. Algunos oráculos fueron actualizados o releídos en nuevos periodos.',
   'El juicio sobre naciones no elimina la visión de inclusión: Egipto y Asiria pueden ser llamados pueblo y obra de Dios junto con Israel.',
   'Lamentos urbanos, sátiras contra reyes, señales proféticas y poemas apocalípticos amplían la visión desde Judá hacia el mundo.',
   'Desenmascarar orgullo imperial y afirmar que la justicia divina no está limitada por fronteras, mientras prepara una esperanza donde pueblos antes enemigos pueden ser reconciliados.',
   'Ningún imperio es eterno. La fe puede lamentar ciudades caídas sin aceptar su opresión y puede imaginar reconciliación más allá de enemistades heredadas.',
   'Los nombres de naciones antiguas no deben transferirse directamente a estados actuales para declarar condenas proféticas. El lenguaje cósmico es poético y apocalíptico, no calendario científico del fin.',
   ARRAY['naciones','Babilonia','Egipto','Tiro','banquete','muerte','reconciliación']::text[],
   ARRAY['babilonios','moabitas','egipcios','asirios','fenicios']::text[],
   ARRAY['Babilonia','Moab','Damasco','Egipto','Tiro','Jerusalén']::text[]),
  ('isaias-28-39-confianza','ISA','section',28,NULL::smallint,39,NULL::smallint,
   'Ayes, Ezequías y la prueba de la confianza',
   'Oráculos denuncian alianzas y liderazgo irresponsable; las narraciones sobre Ezequías muestran la invasión asiria, oración, liberación, enfermedad y una visita babilónica que anticipa exilio.',
   'Senaquerib invadió Judá en 701 a. C. y documentó su campaña. Jerusalén sobrevivió, aunque gran parte del territorio sufrió. Babilonia todavía emergía como futuro poder.',
   'La tradición valora la confianza y oración de Ezequías, pero conserva también su orgullo y la advertencia sobre Babilonia.',
   'Ayes poéticos conducen a una sección narrativa paralela a Reyes. La liberación de Asiria no cierra la historia, pues el capítulo 39 abre hacia el exilio.',
   'Enseñar que la confianza no consiste en negar amenazas ni rechazar toda diplomacia, sino en no convertir alianzas y fuerza militar en autoridad última.',
   'La oración puede coexistir con análisis realista de una crisis. Una liberación pasada no vuelve innecesarios humildad y discernimiento para decisiones futuras.',
   'La sanidad de Ezequías no constituye una receta médica universal. Los relatos de liberación nacional no deben aplicarse para prometer inmunidad a comunidades religiosas modernas.',
   ARRAY['Ezequías','Senaquerib','Asiria','alianzas','oración','Babilonia']::text[],
   ARRAY['judíos','asirios','babilonios','egipcios']::text[],
   ARRAY['Jerusalén','Laquis','Asiria','Babilonia']::text[]),
  ('isaias-40-55-consuelo-siervo','ISA','section',40,NULL::smallint,55,NULL::smallint,
   'Consuelo, retorno y cánticos del siervo',
   'Una voz anuncia consuelo a una comunidad exiliada, presenta a Ciro como instrumento de retorno, ridiculiza ídolos y desarrolla poemas sobre el siervo que trae justicia y carga sufrimiento.',
   'El ascenso de Persia y la política de Ciro permitieron retornos y reorganización de provincias. El lenguaje de nuevo éxodo transforma una realidad imperial en esperanza teológica.',
   'Israel es identificado varias veces como siervo, mientras otros poemas presentan una figura con misión particular. La tradición judía y la cristiana han interpretado su identidad de formas diversas.',
   'Himnos, disputas judiciales, sátiras, anuncios de salvación y cuatro poemas del siervo se enlazan mediante creación, camino y palabra eficaz.',
   'Afirmar que el exilio no cancela el pacto, que Dios puede usar actores extranjeros y que la restauración tiene una misión de justicia y luz más amplia que el bienestar privado.',
   'La espera puede renovarse cuando la comunidad recuerda quién crea, sostiene y llama por nombre. El consuelo bíblico devuelve dignidad y capacidad de caminar.',
   'El siervo no debe identificarse sin reconocer el debate entre lectura colectiva, individual y mesiánica. Isaías 53 no autoriza exigir que víctimas acepten abuso como vocación espiritual.',
   ARRAY['consuelo','Ciro','nuevo éxodo','siervo','luz','justicia','retorno']::text[],
   ARRAY['exiliados judíos','persas','Babilonia','naciones']::text[],
   ARRAY['Babilonia','Jerusalén','desierto','Persia']::text[]),
  ('isaias-56-66-restauracion','ISA','section',56,NULL::smallint,66,NULL::smallint,
   'Comunidad restaurada, justicia y nueva creación',
   'Los capítulos finales enfrentan exclusión, liderazgo corrupto, ayuno injusto y desánimo postexílico, mientras anuncian inclusión de extranjeros, gloria de Sion y cielos y tierra nuevos.',
   'La comunidad posterior al retorno enfrentó desigualdad, conflictos de pertenencia y expectativas no cumplidas. El templo restaurado no eliminó tensiones sociales.',
   'Extranjeros y eunucos fieles reciben lugar y nombre. Isaías 58 vincula ayuno con liberación de cargas y cuidado del pobre; la visión final sostiene esperanza y juicio.',
   'Disputas comunitarias se alternan con poemas de Sion, una figura ungida que anuncia buenas noticias y visiones de creación renovada.',
   'Definir la restauración mediante justicia, inclusión y culto auténtico, y no solo por edificios o identidad heredada.',
   'La espiritualidad se verifica en la manera de tratar al vulnerable. La esperanza de nueva creación impulsa reparación presente en vez de evasión.',
   'Las promesas de prosperidad de Sion no garantizan riqueza individual. Los textos de juicio final no deben usarse para clasificar enemigos personales como condenados ni para excluir a quienes el propio pasaje incorpora.',
   ARRAY['extranjero','eunuco','ayuno','justicia','Sion','ungido','nueva creación']::text[],
   ARRAY['judíos retornados','extranjeros','eunucos','pobres','naciones']::text[],
   ARRAY['Jerusalén','Sion']::text[])
)
insert into public.biblical_context_units (
  slug, book_code, source_id, scope_kind, chapter_start, verse_start,
  chapter_end, verse_end, title, summary, historical_context, jewish_context,
  literary_context, authorial_intent, theological_reflection,
  interpretive_cautions, key_terms, people_groups, places,
  source_locator, provider_version, content_hash, review_status, enabled, metadata
)
select data.slug, data.book_code, source.id, data.scope_kind,
  data.chapter_start::smallint, data.verse_start::smallint,
  data.chapter_end::smallint, data.verse_end::smallint,
  data.title, data.summary, data.historical_context, data.jewish_context,
  data.literary_context, data.authorial_intent, data.theological_reflection,
  data.interpretive_cautions, data.key_terms, data.people_groups, data.places,
  'vida://corpus/contexto/profetas-mayores/v1#' || data.slug,
  'profetas-mayores-v1-2026-08-02',
  encode(extensions.digest(concat_ws('|', data.slug, data.title, data.summary,
    data.historical_context, data.jewish_context, data.literary_context,
    data.authorial_intent, data.theological_reflection, data.interpretive_cautions), 'sha256'), 'hex'),
  'approved', true,
  jsonb_build_object('coverage_batch','major-prophets','generated_by_ai',false,'review_level','editorial')
from data cross join source
on conflict (slug) do update set
  book_code=excluded.book_code, source_id=excluded.source_id, scope_kind=excluded.scope_kind,
  chapter_start=excluded.chapter_start, verse_start=excluded.verse_start,
  chapter_end=excluded.chapter_end, verse_end=excluded.verse_end,
  title=excluded.title, summary=excluded.summary,
  historical_context=excluded.historical_context, jewish_context=excluded.jewish_context,
  literary_context=excluded.literary_context, authorial_intent=excluded.authorial_intent,
  theological_reflection=excluded.theological_reflection,
  interpretive_cautions=excluded.interpretive_cautions,
  key_terms=excluded.key_terms, people_groups=excluded.people_groups, places=excluded.places,
  source_locator=excluded.source_locator, provider_version=excluded.provider_version,
  content_hash=excluded.content_hash, review_status=excluded.review_status,
  enabled=excluded.enabled, metadata=excluded.metadata, updated_at=now();