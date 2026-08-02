-- FASE D · Bloque 4 · Contexto editorial NUM
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
  ('numeros-perfil','NUM','book',1,NULL::smallint,36,NULL::smallint,'Números: camino, rebelión y nueva generación','Números sigue a Israel desde Sinaí hasta las llanuras de Moab, mostrando organización comunitaria, crisis de confianza, disciplina y preparación de una nueva generación.','El escenario es el desierto entre Sinaí y Transjordania. Los censos y disposiciones tribales cumplen funciones narrativas y comunitarias; su interpretación histórica y numérica es discutida.','Bamidbar, «en el desierto», destaca la formación de Israel fuera de estructuras imperiales. La tradición judía lee este periodo como prueba, aprendizaje y dependencia de Dios.','El libro combina censos, itinerarios, leyes, relatos de rebelión, oráculos y preparación territorial. Dos censos enmarcan el paso de una generación a otra.','Mostrar que la promesa divina continúa pese a la incredulidad humana, pero que la falta de confianza tiene consecuencias reales para la comunidad.','El desierto funciona como espacio de exposición y formación: revela temores, deseos de volver atrás y la necesidad de una confianza madura.','Los relatos de juicio y guerra no deben usarse como autorización general para violencia religiosa. Los números deben leerse atendiendo al género, al propósito y a los debates textuales.',ARRAY['desierto','censo','murmuración','presencia','promesa','herencia']::text[],ARRAY['israelitas','levitas','madianitas','moabitas','edomitas']::text[],ARRAY['Sinaí','Cades','desierto','Moab','Transjordania']::text[]),
  ('numeros-1-9-preparacion','NUM','section',1,NULL::smallint,9,NULL::smallint,'Preparación del campamento en Sinaí','Se censan tribus, se organiza el campamento, se asignan funciones levíticas y se prepara la partida desde Sinaí.','Los censos antiguos tenían funciones militares, fiscales y administrativas. En Números también expresan orden alrededor del santuario.','Las tribus acampan alrededor de la presencia divina; levitas y sacerdotes poseen responsabilidades diferenciadas.','Listas, leyes y ceremonias construyen una imagen de comunidad ordenada antes de iniciar el viaje.','Mostrar que el pueblo necesita estructura, responsabilidad y santidad para caminar unido.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','Las cifras son objeto de debate textual e histórico y no deben emplearse sin reconocer dificultades demográficas. La organización tribal no es un modelo político obligatorio.',ARRAY['censo','tribus','levitas','campamento','Pascua']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('numeros-10-19-rebelion','NUM','section',10,NULL::smallint,19,NULL::smallint,'Del Sinaí a Cades: queja y rebelión','El viaje se complica por quejas, rivalidades, miedo ante la tierra y rebeliones contra Moisés y Aarón.','El desierto expone escasez, tensión de liderazgo y vulnerabilidad. Los relatos reflejan memoria de itinerancia y crisis comunitaria.','La generación del desierto se convierte en advertencia sobre incredulidad, lashón hará —habla dañina— y resistencia a la confianza.','La repetición de murmuración, intercesión, juicio y provisión produce una espiral de deterioro.','Explicar por qué una generación liberada puede seguir pensando como esclava y perder la oportunidad por miedo y desconfianza.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No toda crítica a un líder es rebelión contra Dios. El texto también muestra fallas de liderazgo y no debe utilizarse para silenciar denuncias legítimas.',ARRAY['murmuración','espías','Cades','Coré','Moisés','agua']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('numeros-20-25-transicion','NUM','section',20,NULL::smallint,25,NULL::smallint,'Transición de liderazgo y conflictos fronterizos','Mueren Miriam y Aarón, Moisés falla en Meriba, Israel rodea Edom, enfrenta enemigos y llega a las llanuras de Moab.','El escenario cambia hacia Transjordania, con relaciones diplomáticas y militares entre pueblos vecinos.','El episodio de la serpiente de bronce y los oráculos de Balaam reciben interpretaciones posteriores, pero primero pertenecen al viaje de Israel.','Muertes, rutas, victorias y oráculos marcan el final de una generación y la proximidad de la tierra.','Mostrar que la misión continúa aunque líderes importantes terminen su servicio y que Dios puede frustrar intentos de maldición.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','Los relatos de guerra requieren lectura ética y contextual. Balaam es una figura compleja y no debe simplificarse ignorando las diferencias entre los episodios.',ARRAY['Miriam','Aarón','Meriba','Balaam','serpiente de bronce','Moab']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('numeros-26-36-nueva-generacion','NUM','section',26,NULL::smallint,36,NULL::smallint,'La nueva generación en las llanuras de Moab','Un segundo censo, leyes de herencia, nombramiento de Josué, calendario de ofrendas, guerra con Madián y distribución territorial preparan la entrada.','La comunidad enfrenta problemas de sucesión, propiedad y asentamiento antes de cruzar el Jordán.','Las hijas de Zelofehad son importantes en el desarrollo de la ley de herencia. Las ciudades de refugio limitan la venganza privada.','El segundo censo responde al primero y muestra continuidad de la promesa mediante una nueva generación.','Preparar una comunidad responsable que recuerde el pasado y organice justicia, liderazgo y territorio.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','La guerra contra Madián contiene violencia difícil y no debe celebrarse sin análisis. Las leyes de herencia mejoran una situación antigua, pero no agotan la reflexión moderna sobre igualdad.',ARRAY['Josué','herencia','hijas de Zelofehad','ciudades de refugio','Moab']::text[],ARRAY[]::text[],ARRAY[]::text[])
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