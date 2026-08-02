-- FASE D · Bloque 4 · Contexto editorial GEN
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
  ('genesis-perfil','GEN','book',1,NULL::smallint,50,NULL::smallint,'Génesis: perfil histórico y literario','Génesis presenta los orígenes del mundo, de la humanidad y de la familia de Abraham, y explica cómo la historia de Israel se vincula con la bendición destinada a todas las naciones.','Los relatos se sitúan en escenarios del antiguo Cercano Oriente: Mesopotamia, Canaán y Egipto. No todos los episodios pueden fecharse con precisión, y las costumbres patriarcales deben compararse con prudencia con otros textos antiguos.','En la tradición judía, Génesis es Bereshit, el inicio de la Torá. Sus relatos fundamentan la creación, el pacto, la elección de Abraham, la circuncisión y la identidad de las doce tribus.','Combina narrativa de orígenes, genealogías, ciclos familiares, discursos y escenas de pacto. Las repeticiones y la fórmula «estas son las generaciones» organizan grandes secciones.','Comunicar que el Dios creador gobierna la historia, confronta el pecado y preserva una línea de promesa mediante la cual alcanzará bendición a las naciones.','La iniciativa divina aparece antes que el mérito humano: Dios crea, llama, promete, corrige y sostiene aun a familias marcadas por conflictos.','No debe usarse cada detalle como manual científico moderno ni armonizarse a la fuerza con una cronología que el texto no ofrece. La autoría y el proceso de composición del Pentateuco son debatidos; la tradición lo asocia con Moisés, mientras que la investigación estudia una formación literaria compleja.',ARRAY['creación','imagen de Dios','pacto','bendición','simiente','patriarcas']::text[],ARRAY['israelitas','cananeos','egipcios','mesopotámicos']::text[],ARRAY['Mesopotamia','Canaán','Egipto']::text[]),
  ('genesis-1-11-origenes','GEN','section',1,NULL::smallint,11,NULL::smallint,'Los orígenes: creación, fractura y naciones','Esta unidad avanza desde la creación ordenada hasta Babel. Explica la dignidad humana, la entrada del pecado, la expansión de la violencia, el juicio del diluvio y la dispersión de los pueblos.','Comparte imágenes y temas con otros relatos del antiguo Cercano Oriente, pero los reorganiza para afirmar un solo Dios soberano, una creación buena y la responsabilidad moral humana.','En la lectura judía, estos capítulos hablan de la humanidad antes de Abraham y preparan el llamado de una familia destinada a ser bendición para las naciones.','La secuencia creación–caída–diluvio–Babel muestra repetición de pecado, juicio, preservación y nueva oportunidad.','Mostrar por qué la historia necesita una respuesta divina al desorden humano y preparar el llamado de Abraham.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','El texto no identifica razas modernas como malditas ni ofrece base para teorías de superioridad étnica. Los días de creación y las genealogías tienen debates de género y cronología que deben reconocerse.',ARRAY['creación','imagen de Dios','pecado','diluvio','Babel']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('genesis-12-24-abraham','GEN','section',12,NULL::smallint,24,NULL::smallint,'Abraham: llamado, promesa y pacto','Dios llama a Abram, promete tierra, descendencia y bendición, y forma una relación de pacto que atraviesa pruebas, decisiones humanas y esperas prolongadas.','Las prácticas familiares, los pactos, la hospitalidad y el movimiento entre ciudades reflejan el mundo del antiguo Cercano Oriente, aunque no permiten fechar cada escena con precisión.','Abraham es figura fundacional del pueblo judío. La circuncisión se presenta como señal del pacto y la hospitalidad de Abraham ocupa un lugar importante en la tradición.','El ciclo alterna promesa y amenaza: esterilidad, hambre, conflictos, Lot, Agar, reyes y la prueba de Isaac.','Enseñar que la promesa depende de la fidelidad divina, mientras la fe humana aprende a confiar y obedecer.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','La prueba de Isaac no legitima sacrificios humanos; el relato culmina en la provisión divina. Tampoco debe ocultarse el sufrimiento de Agar y Sara ni simplificarse el conflicto familiar.',ARRAY['Abraham','pacto','promesa','circuncisión','fe']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('genesis-25-36-jacob','GEN','section',25,NULL::smallint,36,NULL::smallint,'Isaac, Jacob y la formación de Israel','El relato sigue la continuidad de la promesa mediante Isaac y Jacob, la rivalidad entre hermanos, el exilio de Jacob, su familia y su regreso transformado con el nombre Israel.','Las estructuras de parentesco, matrimonios, herencias y pactos familiares pertenecen a sociedades antiguas de clan y no deben convertirse automáticamente en modelos familiares normativos.','Jacob/Israel es antepasado epónimo del pueblo. Sus doce hijos preparan la identidad tribal y la lucha en Peniel simboliza transformación y dependencia.','Repeticiones de engaño, conflicto, sueño, encuentro divino y reconciliación unen el ciclo.','Mostrar que Dios puede sostener su propósito a través de personas imperfectas, confrontándolas y transformándolas.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','El texto narra poligamia, rivalidad y violencia sin aprobar automáticamente cada conducta. Las bendiciones patriarcales no deben usarse para justificar favoritismo.',ARRAY['Isaac','Jacob','Israel','Esaú','Betel','bendición']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('genesis-37-50-jose','GEN','section',37,NULL::smallint,50,NULL::smallint,'José y la preservación de la familia','José es vendido por sus hermanos, llega a una posición de autoridad en Egipto y termina preservando a su familia durante una crisis alimentaria.','El relato utiliza elementos de administración egipcia, migración y hambre regional. La identificación precisa con una dinastía concreta es incierta.','En la tradición judía, José representa fidelidad en la diáspora, providencia y reconciliación, aunque también se examinan las consecuencias de sus políticas económicas.','La narrativa está cuidadosamente construida con sueños, descensos y ascensos, reconocimiento oculto, pruebas y reconciliación.','Enseñar que el mal humano no tiene la última palabra y que la providencia puede obrar sin convertir la traición en algo bueno.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','La frase sobre Dios encaminando el mal para bien no elimina la responsabilidad de los hermanos ni debe emplearse para minimizar el abuso o exigir reconciliación sin verdad.',ARRAY['José','providencia','Egipto','reconciliación','hambre']::text[],ARRAY[]::text[],ARRAY[]::text[])
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