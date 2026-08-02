-- FASE D · Bloque 4 · Contexto editorial EXO
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
  ('exodo-perfil','EXO','book',1,NULL::smallint,40,NULL::smallint,'Éxodo: liberación, pacto y presencia','Éxodo narra la opresión de Israel en Egipto, su liberación, el pacto en Sinaí y la construcción del tabernáculo como señal de la presencia divina entre el pueblo.','El relato refleja instituciones, rutas, prácticas y conflictos del antiguo Cercano Oriente. La identificación exacta del faraón y la fecha del éxodo continúan siendo debatidas; el texto se concentra en el significado teológico de la liberación.','Éxodo ocupa un lugar central en la memoria judía. La Pascua, la salida de Egipto, la entrega de la Torá y el pacto del Sinaí estructuran la identidad, la liturgia y la ética de Israel.','Alterna narrativa, discursos divinos, leyes, cánticos e instrucciones cultuales. La primera mitad avanza desde esclavitud hacia pacto; la segunda pregunta cómo puede habitar Dios en medio del pueblo.','Presentar a YHWH como el Dios que escucha el clamor, derrota poderes opresores, forma un pueblo de pacto y establece su presencia.','La liberación bíblica conduce a una vida de alianza, justicia, adoración y responsabilidad, no solamente a escapar de una dificultad.','Las plagas no deben reducirse a trucos naturales ni convertirse en permiso para demonizar pueblos actuales. Las leyes y símbolos deben interpretarse en su marco del pacto antiguo antes de aplicarlos directamente.',ARRAY['éxodo','Pascua','pacto','Torá','tabernáculo','presencia']::text[],ARRAY['israelitas','egipcios','levitas']::text[],ARRAY['Egipto','mar','Sinaí','desierto']::text[]),
  ('exodo-1-18-liberacion','EXO','section',1,NULL::smallint,18,NULL::smallint,'Opresión, llamado de Moisés y liberación','Israel pasa de ser una familia protegida a un pueblo oprimido. Dios llama a Moisés, confronta al faraón, celebra la Pascua y conduce al pueblo fuera de Egipto.','El relato refleja trabajo forzado, poder imperial y memoria de migración. La fecha exacta y la ruta geográfica son debatidas.','La Pascua se convierte en memorial central de la liberación. En la tradición judía, cada generación aprende a verse como participante de esa salida.','El conflicto aumenta mediante señales y plagas, culmina en la Pascua y continúa con el cruce y el cántico de liberación.','Presentar a Dios como quien escucha el clamor de los oprimidos y forma un pueblo libre para servirle.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','Las plagas no justifican odio contra egipcios actuales. El texto distingue entre la dureza del poder imperial y personas concretas, y su lenguaje debe interpretarse en su mundo antiguo.',ARRAY['Moisés','faraón','Pascua','plagas','liberación','mar']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('exodo-19-24-sinai','EXO','section',19,NULL::smallint,24,NULL::smallint,'Sinaí: pacto, mandamientos y vocación','Israel llega al Sinaí, acepta una alianza y recibe mandamientos que ordenan culto, relaciones, justicia y responsabilidad comunitaria.','Los pactos antiguos incluían preámbulo, memoria de beneficios, obligaciones y sanciones. Éxodo usa este marco para describir la relación entre Dios e Israel.','La entrega de la Torá es central en la identidad judía. Israel es llamado reino de sacerdotes y nación santa, con una vocación hacia Dios y las naciones.','Teofanía, Decálogo, colección legal y ceremonia de ratificación forman una unidad de pacto.','Mostrar que la liberación precede a la ley: el pueblo obedece como respuesta a la gracia de haber sido rescatado.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','Las leyes civiles antiguas no pueden copiarse sin interpretación en estados modernos. Debe distinguirse principio moral, regulación social antigua y desarrollo posterior.',ARRAY['Sinaí','Decálogo','Torá','pacto','justicia']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('exodo-25-31-tabernaculo-instrucciones','EXO','section',25,NULL::smallint,31,NULL::smallint,'El tabernáculo: instrucciones para la presencia','Se describen el santuario, sus objetos, el sacerdocio y el sábado como parte de la manera en que Dios habitará en medio del pueblo.','Los santuarios portátiles y objetos cultuales tienen paralelos regionales, pero el texto los integra en la teología del pacto y la santidad de Israel.','El mishkán o tabernáculo simboliza presencia ordenada. La tradición judía presta atención a cada detalle y a la colaboración generosa de la comunidad.','Las instrucciones avanzan desde el arca y el espacio interior hacia sacerdotes, altar, artesanos y sábado.','Comunicar que la adoración requiere reverencia, belleza, responsabilidad y límites, y que la presencia divina está en el centro de la comunidad.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No todos los materiales o medidas poseen un código secreto. Las interpretaciones simbólicas posteriores deben distinguirse del sentido directo de las instrucciones.',ARRAY['tabernáculo','arca','sacerdocio','sábado','presencia']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('exodo-32-34-becerro','EXO','section',32,NULL::smallint,34,NULL::smallint,'Becerro de oro, intercesión y renovación','Mientras Moisés permanece en la montaña, el pueblo fabrica un becerro. La crisis pone en riesgo el pacto, pero la intercesión y la misericordia conducen a una renovación.','Imágenes de toros y becerros estaban asociadas con fuerza y culto en la región. El problema incluye representar y manipular la presencia divina.','El episodio es una advertencia fundamental contra la idolatría. La revelación de los atributos misericordiosos de Dios en Éxodo 34 es central en la liturgia y pensamiento judíos.','La ruptura de las tablas, la intercesión y las nuevas tablas dramatizan ruptura y restauración.','Mostrar la gravedad de sustituir a Dios por una representación controlable y, a la vez, la posibilidad de perdón y renovación.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No debe usarse para condenar toda expresión artística. La violencia del episodio exige lectura histórica y canónica responsable, no imitación.',ARRAY['becerro de oro','idolatría','intercesión','misericordia','renovación']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('exodo-35-40-tabernaculo-construccion','EXO','section',35,NULL::smallint,40,NULL::smallint,'Construcción y llenura del tabernáculo','El pueblo aporta materiales, los artesanos ejecutan las instrucciones y la gloria divina llena el tabernáculo al concluir el libro.','La obra comunitaria combina habilidades artesanales, liderazgo y recursos voluntarios dentro de un proyecto cultual.','El texto destaca la sabiduría artesanal y la participación colectiva. La nube y la gloria conectan el santuario con la guía del éxodo.','La repetición de «como YHWH había mandado» subraya obediencia y culmina en la presencia que llena el espacio.','Concluir que el objetivo de la liberación y el pacto es una comunidad guiada por la presencia de Dios.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No debe reducirse la presencia divina a un edificio ni asumirse que una construcción religiosa garantiza aprobación divina.',ARRAY['artesanos','ofrenda','gloria','nube','tabernáculo']::text[],ARRAY[]::text[],ARRAY[]::text[])
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