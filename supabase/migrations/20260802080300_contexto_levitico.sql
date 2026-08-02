-- FASE D · Bloque 4 · Contexto editorial LEV
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
  ('levitico-perfil','LEV','book',1,NULL::smallint,27,NULL::smallint,'Levítico: santidad, culto y comunidad','Levítico reúne instrucciones sobre sacrificios, sacerdocio, pureza, expiación, fiestas y vida santa para una comunidad que entiende a Dios habitando en medio de ella.','El libro refleja prácticas sacerdotales de Israel y un mundo donde culto, alimentación, salud comunitaria, calendario y justicia social estaban estrechamente relacionados.','En la tradición judía se llama Vayikrá y es fundamental para comprender la santidad, el servicio sacerdotal, Yom Kippur, las fiestas y el mandato de amar al prójimo.','Está organizado alrededor del acercamiento a Dios, la regulación de impurezas, el Día de la Expiación y el llamado a la santidad. Las fórmulas legales y rituales crean una estructura pedagógica.','Enseñar cómo una comunidad de pacto puede vivir cerca de un Dios santo mediante expiación, discernimiento, justicia y prácticas comunitarias ordenadas.','La santidad bíblica no se limita al ritual: incluye el trato al pobre, al extranjero, al trabajador y al prójimo.','Pureza ritual no equivale automáticamente a pecado moral. Las categorías antiguas de alimentos, enfermedad y culto no deben trasladarse sin mediación al diagnóstico médico o a la exclusión social moderna.',ARRAY['santidad','sacrificio','pureza','expiación','sacerdocio','jubileo']::text[],ARRAY['sacerdotes','levitas','israelitas','extranjeros residentes']::text[],ARRAY['tabernáculo','campamento']::text[]),
  ('levitico-1-7-sacrificios','LEV','section',1,NULL::smallint,7,NULL::smallint,'Ofrendas y sacrificios','Se regulan ofrendas quemadas, vegetales, de comunión, purificación y reparación, con distintas funciones dentro del culto.','El sacrificio era común en el mundo antiguo, pero Levítico lo organiza alrededor del pacto, la santidad y la restitución.','Las categorías hebreas no coinciden exactamente con términos cristianos populares. Algunas ofrendas expresan gratitud y comunión, no solamente culpa.','Las leyes se presentan primero desde la perspectiva del oferente y luego desde las tareas sacerdotales.','Enseñar que acercarse a Dios incluye reconocimiento, gratitud, reparación y orden comunitario.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No todo sacrificio representa el mismo concepto. No debe afirmarse que cada detalle predice de forma directa un acontecimiento posterior sin atender primero a su función israelita.',ARRAY['sacrificio','ofrenda','reparación','comunión','altar']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('levitico-8-10-sacerdocio','LEV','section',8,NULL::smallint,10,NULL::smallint,'Consagración sacerdotal y responsabilidad','Aarón y sus hijos son consagrados; el inicio del ministerio sacerdotal incluye bendición, gloria y la muerte de Nadab y Abiú.','El sacerdocio administraba culto, enseñanza y distinciones de pureza en una sociedad donde religión y vida comunitaria estaban unidas.','El episodio subraya el peso del servicio sacerdotal y la necesidad de distinguir entre santo y común.','Una ceremonia detallada de consagración es seguida por una crisis que muestra la seriedad del cargo.','Comunicar que el liderazgo religioso no elimina la responsabilidad y que la cercanía al santuario exige discernimiento.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No debe especularse con certeza sobre la falta exacta de Nadab y Abiú más allá de lo que dice el texto, ni usar el relato para justificar abuso de autoridad.',ARRAY['Aarón','sacerdocio','consagración','santidad','Nadab y Abiú']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('levitico-11-15-pureza','LEV','section',11,NULL::smallint,15,NULL::smallint,'Alimentos, cuerpos y pureza ritual','Estas leyes organizan alimentos, parto, afecciones cutáneas, objetos y flujos corporales mediante categorías de puro e impuro.','En el mundo antiguo, el santuario y el campamento requerían sistemas comunitarios para manejar cuerpos, enfermedades y contacto con la muerte.','La impureza ritual suele ser temporal y no equivale a culpa moral. La tradición judía desarrolla cuidadosamente estas distinciones.','La unidad se mueve de alimentos a estados corporales y termina con procedimientos de restauración.','Enseñar a la comunidad a preservar límites cultuales y reintegrar a personas mediante procesos establecidos.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No debe identificarse «impuro» con pecador, inferior o contagioso en sentido médico moderno. Tampoco deben diagnosticarse enfermedades actuales a partir de términos antiguos.',ARRAY['pureza','impureza','alimentos','tzaraat','cuerpo']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('levitico-16-expiacion','LEV','section',16,NULL::smallint,16,NULL::smallint,'Día de la Expiación','El sumo sacerdote realiza ritos para purificar el santuario y la comunidad, incluyendo dos machos cabríos y la confesión de las transgresiones.','El rito responde a la tensión de una presencia santa en medio de una comunidad humana y a la acumulación simbólica de impureza.','Yom Kippur continúa siendo el día más solemne del calendario judío, asociado con arrepentimiento, confesión y reconciliación.','La entrada excepcional al lugar santísimo y la salida del macho cabrío estructuran un movimiento de purificación y remoción.','Comunicar que el pecado y la impureza dañan la vida comunitaria y requieren expiación, confesión y restauración.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','El macho cabrío para Azazel tiene interpretaciones debatidas; no debe presentarse una explicación única como certeza. El rito no autoriza culpar a una persona como «chivo expiatorio».',ARRAY['Yom Kippur','expiación','sumo sacerdote','Azazel','confesión']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('levitico-17-26-santidad','LEV','section',17,NULL::smallint,26,NULL::smallint,'Código de santidad y vida del pacto','Regula sangre, sexualidad, relaciones sociales, sacerdocio, fiestas, tierra, jubileo y consecuencias del pacto bajo el llamado «sean santos».','Las leyes responden a una comunidad agraria, tribal y cultual. Vinculan adoración con economía, justicia y cuidado del vulnerable.','Levítico 19 reúne mandatos centrales como amar al prójimo y respetar al extranjero. Las fiestas y el jubileo organizan memoria, descanso y justicia.','El centro ético expande la santidad desde el santuario hacia campos, negocios, familia y tribunales.','Mostrar que pertenecer a Dios transforma la vida diaria y exige justicia, integridad y compasión.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','Las regulaciones sexuales y penales requieren análisis lingüístico, histórico y canónico; no deben usarse selectivamente para hostigar personas mientras se ignoran otros mandatos de justicia.',ARRAY['santidad','prójimo','extranjero','fiestas','jubileo','justicia']::text[],ARRAY[]::text[],ARRAY[]::text[]),
  ('levitico-27-votos','LEV','section',27,NULL::smallint,27,NULL::smallint,'Votos, dedicaciones y rescates','El cierre regula la valoración y el rescate de personas, animales, casas y campos dedicados mediante votos.','Los votos religiosos podían afectar bienes y economía familiar, por lo que necesitaban límites y procedimientos claros.','La tradición judía distingue dedicaciones voluntarias de obligaciones permanentes y estudia cuidadosamente las valoraciones.','Funciona como apéndice práctico después de las bendiciones y maldiciones del pacto.','Evitar que el fervor religioso produzca compromisos económicos desordenados o manipulables.','El pasaje invita a responder a Dios con memoria, confianza, justicia y obediencia contextualizada, sin borrar la complejidad humana del relato.','No debe interpretarse el valor monetario como medida del valor humano. La tabla regula un voto antiguo, no la dignidad de las personas.',ARRAY['votos','dedicación','rescate','valoración']::text[],ARRAY[]::text[],ARRAY[]::text[])
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