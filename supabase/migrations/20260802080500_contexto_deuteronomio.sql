-- FASE D · Bloque 4 · Contexto editorial DEU
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
  ('deuteronomio-perfil','DEU','book',1,NULL::smallint,34,NULL::smallint,'Deuteronomio: memoria y renovación del pacto','Deuteronomio presenta discursos de Moisés a la nueva generación antes de entrar en la tierra, reinterpretando la ley como llamado a amar a Dios, recordar y vivir con justicia.','El escenario narrativo son las llanuras de Moab. Su forma recuerda discursos de despedida y tratados de alianza del antiguo Cercano Oriente; su composición y relación con reformas posteriores son ampliamente debatidas.','Devarim contiene el Shemá y textos centrales para la oración y la identidad judía. La memoria del éxodo sostiene la obediencia, la enseñanza a los hijos y el cuidado del vulnerable.','Discursos, recapitulaciones históricas, leyes, bendiciones, maldiciones, cánticos y el relato final de Moisés forman una renovación de pacto.','Llamar a Israel a responder al amor y fidelidad de Dios con lealtad integral, memoria, justicia y transmisión intergeneracional.','La obediencia no se presenta como simple formalismo, sino como respuesta del corazón que transforma relaciones, economía, culto y vida pública.','Las bendiciones y maldiciones no deben convertirse en una fórmula automática para explicar toda prosperidad o sufrimiento individual. Las leyes pertenecen a una sociedad antigua y requieren interpretación contextual.',ARRAY['Shemá','pacto','memoria','amor','obediencia','bendición','justicia']::text[],ARRAY['israelitas','levitas','extranjeros residentes']::text[],ARRAY['Moab','Jordán','Canaán']::text[]),
  ('deuteronomio-1-4-memoria','DEU','section',1,NULL::smallint,4,NULL::smallint,'Memoria del camino y llamado a escuchar','Moisés repasa el viaje desde Horeb, la crisis de los espías y las victorias en Transjordania, exhortando a aprender de la historia.','Los discursos se ubican en Moab ante una generación que no experimentó todos los acontecimientos directamente.','La memoria es una práctica teológica: Israel debe contar la historia para no repetir la incredulidad ni fabricar imágenes de Dios.','Recapitulación histórica y exhortación se entrelazan; el pasado se narra para formar decisiones presentes.','Enseñar que recordar la gracia y los errores colectivos es parte de la fidelidad.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','La historia está presentada con propósito exhortativo, no como simple cronología neutral. Las diferencias con otros relatos del Pentateuco deben estudiarse, no ocultarse.',ARRAY['memoria','Horeb','espías','idolatría','escuchar']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('deuteronomio-5-11-amor','DEU','section',5,NULL::smallint,11,NULL::smallint,'Decálogo, Shemá y amor de pacto','El Decálogo se repite y el Shemá llama a amar a Dios con todo el ser, enseñar a los hijos y recordar en la prosperidad.','Las sociedades de alianza expresaban lealtad mediante lenguaje de amor, temor y obediencia. Deuteronomio dirige esa lealtad exclusivamente a YHWH.','«Escucha, Israel» es una confesión central de la oración judía. Los textos se vinculan con mezuzá, tefilín y enseñanza cotidiana.','Mandamientos, memoria del desierto y advertencias contra el orgullo desarrollan una espiritualidad del corazón.','Mostrar que la obediencia surge de una lealtad amorosa y de recordar que la vida y la tierra son dones.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','Amar a Dios no significa negar preguntas ni sentimientos. Las promesas agrícolas pertenecen al marco del pacto nacional y no garantizan riqueza individual automática.',ARRAY['Shemá','Decálogo','amor','corazón','enseñanza','memoria']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('deuteronomio-12-26-leyes','DEU','section',12,NULL::smallint,26,NULL::smallint,'Leyes para culto, justicia y vida social','Regula culto, liderazgo, profetas, tribunales, guerra, familia, economía, pobres, esclavos, fiestas, primicias y diezmos.','Estas leyes imaginan a Israel como sociedad agraria asentada, rodeada de otros pueblos y con instituciones políticas y religiosas.','La justicia hacia huérfano, viuda y extranjero se fundamenta repetidamente en la memoria de la esclavitud. Las fiestas vinculan culto y solidaridad.','La colección se organiza desde el culto central hacia instituciones y casos de vida comunitaria, culminando en confesiones litúrgicas.','Formar una sociedad cuya lealtad a Dios sea visible en justicia, generosidad y límites al poder.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','Muchas normas son casuísticas y antiguas. Las leyes sobre guerra, esclavitud, género y castigos requieren reconocer su contexto y su desarrollo ético, no aplicarse literalmente sin mediación.',ARRAY['justicia','pobre','extranjero','rey','profeta','fiestas','diezmo']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('deuteronomio-27-30-renovacion','DEU','section',27,NULL::smallint,30,NULL::smallint,'Bendición, maldición y renovación del pacto','Se ordena una ceremonia en la tierra, se describen consecuencias de fidelidad e infidelidad y se llama a escoger la vida mediante una renovación del corazón.','Los tratados antiguos incluían bendiciones y maldiciones. Aquí se relacionan con la vida nacional, la tierra y el exilio.','La tradición judía ha leído estos capítulos a la luz del exilio y del retorno, destacando arrepentimiento, teshuvá y cercanía de la palabra.','Las largas sanciones conducen a una esperanza de restauración y a la elección entre vida y muerte.','Advertir que las decisiones colectivas tienen consecuencias y afirmar que el retorno a Dios sigue siendo posible.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No debe deducirse que todo enfermo o pobre está bajo maldición personal. El libro habla principalmente del pacto comunitario de Israel.',ARRAY['bendición','maldición','teshuvá','vida','exilio','corazón']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('deuteronomio-31-34-despedida','DEU','section',31,NULL::smallint,34,NULL::smallint,'Sucesión, cántico y muerte de Moisés','Josué recibe el encargo, la Torá se deposita para lectura pública, Moisés canta, bendice a las tribus y muere contemplando la tierra.','Los discursos de despedida preservan identidad y transfieren autoridad en momentos de cambio generacional.','Simjat Torá conecta el final de Deuteronomio con el reinicio de Génesis. Moisés es recordado como profeta incomparable, aunque no entra en la tierra.','Prosa, cántico, bendición poética y obituario cierran la Torá con una expectativa abierta.','Enseñar que la obra de Dios continúa más allá de un líder y que la comunidad debe conservar, leer y transmitir la enseñanza.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','El final no debe usarse para desacreditar a Moisés por un solo fracaso ni para afirmar con certeza detalles no dados sobre su sepultura.',ARRAY['Josué','Moisés','cántico','bendición','Torá','sucesión']::text[],ARRAY[]::text[],ARRAY[]::text[])
)
insert into public.biblical_context_units (
  slug, book_code, source_id, scope_kind, chapter_start, verse_start,
  chapter_end, verse_end, title, summary, historical_context, jewish_context,
  literary_context, authorial_intent, theological_reflection,
  interpretive_cautions, key_terms, people_groups, places,
  source_locator, provider_version, content_hash, review_status, enabled, metadata
)
select
  data.slug, data.book_code, source.id, data.scope_kind, data.chapter_start::smallint,
  data.verse_start::smallint, data.chapter_end::smallint, data.verse_end::smallint,
  data.title, data.summary, data.historical_context, data.jewish_context,
  data.literary_context, data.authorial_intent, data.theological_reflection,
  data.interpretive_cautions, data.key_terms, data.people_groups, data.places,
  'vida://corpus/contexto/pentateuco/v1#' || data.slug,
  'pentateuco-v1-2026-08-02',
  encode(extensions.digest(
    concat_ws('|', data.slug, data.title, data.summary, data.historical_context,
      data.jewish_context, data.literary_context, data.authorial_intent,
      data.theological_reflection, data.interpretive_cautions),
    'sha256'
  ), 'hex'),
  'approved',
  true,
  jsonb_build_object(
    'coverage_batch', 'pentateuch',
    'generated_by_ai', false,
    'review_level', 'editorial'
  )
from data cross join source
on conflict (slug) do update set
  book_code = excluded.book_code,
  source_id = excluded.source_id,
  scope_kind = excluded.scope_kind,
  chapter_start = excluded.chapter_start,
  verse_start = excluded.verse_start,
  chapter_end = excluded.chapter_end,
  verse_end = excluded.verse_end,
  title = excluded.title,
  summary = excluded.summary,
  historical_context = excluded.historical_context,
  jewish_context = excluded.jewish_context,
  literary_context = excluded.literary_context,
  authorial_intent = excluded.authorial_intent,
  theological_reflection = excluded.theological_reflection,
  interpretive_cautions = excluded.interpretive_cautions,
  key_terms = excluded.key_terms,
  people_groups = excluded.people_groups,
  places = excluded.places,
  source_locator = excluded.source_locator,
  provider_version = excluded.provider_version,
  content_hash = excluded.content_hash,
  review_status = excluded.review_status,
  enabled = excluded.enabled,
  metadata = excluded.metadata,
  updated_at = now();