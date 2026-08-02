-- FASE D · Bloque 4 · Poesía y sabiduría 1: Job
update public.biblical_sources
set provider_version = 'poesia-sabiduria-v1-2026-08-02',
    content_hash = encode(extensions.digest('vida-contexto-editorial|poesia-sabiduria-v1-2026-08-02', 'sha256'), 'hex'),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'coverage', 'canon-pentateuch-historical-and-wisdom',
      'latest_batch', 'poetry-wisdom',
      'generated_by_ai', false
    ),
    updated_at = now()
where slug = 'vida-contexto-editorial';

update public.biblical_books
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('coverage_status', 'context_ready'),
    updated_at = now()
where code = 'JOB';

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
  ('job-perfil','JOB','book',1,NULL::smallint,42,NULL::smallint,
   'Job: sufrimiento, justicia y límites del conocimiento humano',
   'Job explora el sufrimiento de una persona descrita como íntegra, el fracaso de explicaciones religiosas simplistas y el encuentro con una sabiduría divina que supera la comprensión humana.',
   'La ambientación patriarcal, la riqueza medida en ganado y las reuniones de ancianos evocan un mundo antiguo no fechado con certeza. El libro pudo alcanzar su forma literaria final después de un largo proceso de composición.',
   'Job pertenece a los Escritos y a la tradición sapiencial de Israel. Dialoga con preguntas compartidas en el antiguo Cercano Oriente sobre sufrimiento inocente, justicia divina y sabiduría.',
   'Un prólogo y epílogo narrativos enmarcan extensos diálogos poéticos. Los discursos avanzan en ciclos, luego interviene Elihú y finalmente Dios responde mediante preguntas sobre la creación.',
   'Desmontar la fórmula según la cual toda desgracia revela pecado oculto, defender el derecho de lamentar y mostrar que la justicia divina no cabe en explicaciones humanas automáticas.',
   'La fe bíblica puede protestar, preguntar y lamentar sin dejar de dirigirse a Dios. Acompañar a quien sufre requiere presencia y humildad antes que respuestas rápidas.',
   'El libro no enseña que Dios y el adversario hagan apuestas caprichosas con personas, ni que toda pérdida sea una prueba diseñada para producir una recompensa mayor. La restauración final no convierte el sufrimiento previo en algo bueno ni promete una compensación material idéntica a toda persona fiel.',
   ARRAY['Job','sufrimiento','justicia','sabiduría','lamento','integridad','retribución']::text[],
   ARRAY['sabios','familia de Job','amigos de Job']::text[],
   ARRAY['Uz']::text[]),
  ('job-1-2-prologo','JOB','section',1,NULL::smallint,2,NULL::smallint,
   'Prólogo: integridad, pérdida y silencio',
   'Job es presentado como íntegro y sufre una cadena de pérdidas sin conocer la conversación celestial que el lector ha escuchado. Sus amigos llegan y guardan silencio durante siete días.',
   'El lenguaje de corte celestial utiliza imágenes conocidas en literatura antigua para plantear una pregunta sobre la motivación de la fidelidad y no para ofrecer una descripción exhaustiva del mundo espiritual.',
   'La figura del satán funciona aquí como acusador dentro de la corte, no necesariamente con todos los rasgos desarrollados en tradiciones posteriores. El duelo de Job sigue prácticas antiguas de rasgar vestiduras y sentarse en ceniza.',
   'La prosa rápida de las calamidades contrasta con la quietud final de los amigos. El lector sabe que Job no está siendo castigado por una culpa oculta.',
   'Establecer desde el inicio que el sufrimiento no puede explicarse mediante una ecuación simple entre conducta y resultado, y que la presencia silenciosa puede ser una respuesta más humana que el discurso.',
   'El dolor no obliga a fingir serenidad. La persona herida puede lamentar, guardar silencio y recibir compañía sin tener que defender inmediatamente su fe.',
   'No debe culparse a Job, a su esposa ni a las víctimas de tragedias actuales. La frase sobre dar y quitar no debe utilizarse aislada para negar responsabilidad humana o impedir el duelo.',
   ARRAY['integridad','acusador','pérdida','duelo','silencio']::text[],
   ARRAY['familia de Job','amigos de Job']::text[],
   ARRAY['Uz']::text[]),
  ('job-3-31-dialogos','JOB','section',3,NULL::smallint,31,NULL::smallint,
   'Lamento de Job y diálogos con sus amigos',
   'Job lamenta su nacimiento y debate con Elifaz, Bildad y Zofar, quienes intentan defender un orden moral donde el sufrimiento demuestra culpa, mientras Job insiste en su inocencia y busca una audiencia con Dios.',
   'Los discursos reflejan formas de debate sapiencial, proverbios, observación tradicional y poesía de lamento. Las voces no poseen la misma autoridad que una declaración final del narrador.',
   'El libro conserva una disputa interna de la sabiduría israelita. Los amigos dicen algunas verdades generales, pero las aplican de manera cruel y equivocada al caso concreto de Job.',
   'Tres ciclos se vuelven progresivamente desordenados, mostrando que el debate ha dejado de producir comprensión. El capítulo 28 funciona como poema sobre la inaccesibilidad de la sabiduría.',
   'Mostrar que una doctrina correcta en abstracto puede convertirse en falsedad cuando se aplica sin escuchar la realidad de una persona, y legitimar la búsqueda honesta de justicia.',
   'La espiritualidad madura no necesita defender a Dios acusando al que sufre. Puede tolerar preguntas difíciles y acompañar sin inventar causas ocultas.',
   'Las acusaciones de los amigos no deben repetirse como consejo pastoral. Las palabras intensas de Job forman parte de un lamento poético y no deben extraerse como afirmaciones sistemáticas sobre Dios o la muerte.',
   ARRAY['lamento','Elifaz','Bildad','Zofar','retribución','inocencia','sabiduría']::text[],
   ARRAY['Job','amigos de Job','sabios']::text[],
   ARRAY['Uz']::text[]),
  ('job-32-37-elihu','JOB','section',32,NULL::smallint,37,NULL::smallint,
   'Elihú: una voz adicional antes de la respuesta divina',
   'Elihú interviene después de los amigos, critica tanto a Job como a sus interlocutores y propone que el sufrimiento también puede advertir, formar o impedir una caída.',
   'La intervención refleja respeto antiguo por la edad y, al mismo tiempo, la afirmación de que la comprensión no depende exclusivamente de los años.',
   'La tradición ha evaluado de manera diversa a Elihú: el epílogo no lo reprende explícitamente como a los tres amigos, pero Dios tampoco declara que su explicación resuelva el caso.',
   'Seis capítulos de discurso interrumpen la secuencia esperada antes de la aparición de Dios. El lenguaje de tormenta prepara literariamente la respuesta desde el torbellino.',
   'Añadir una posibilidad pedagógica sin permitir que esa explicación se convierta en certeza sobre la causa específica del sufrimiento de Job.',
   'Una experiencia dolorosa puede producir aprendizaje, pero nadie debe imponer esa interpretación desde afuera ni convertirla en explicación universal.',
   'No debe afirmarse que Elihú ofrece la respuesta definitiva ni que toda enfermedad o pérdida es disciplina directa. Su perspectiva forma parte del debate y necesita leerse junto con la respuesta divina.',
   ARRAY['Elihú','disciplina','sabiduría','tormenta','formación']::text[],
   ARRAY['Job','Elihú','amigos de Job']::text[],
   ARRAY['Uz']::text[]),
  ('job-38-42-respuesta','JOB','section',38,NULL::smallint,42,NULL::smallint,
   'Discursos divinos, respuesta de Job y epílogo',
   'Dios responde desde el torbellino con preguntas sobre la creación, los animales y fuerzas fuera del control humano. Job reconoce sus límites; después Dios reprende a los amigos y restaura su vida comunitaria.',
   'Las imágenes de Behemot y Leviatán usan criaturas y símbolos de poder conocidos en el mundo antiguo para expresar que el orden creado contiene realidades que exceden la capacidad humana.',
   'La respuesta no explica el prólogo al personaje Job. La tradición debate el sentido exacto de su retractación y la diferencia entre arrepentirse de pecado y reconocer límites en polvo y ceniza.',
   'Dos discursos divinos con respuestas breves de Job desplazan la pregunta desde una causa oculta hacia la amplitud de la creación. El epílogo vuelve a prosa y corrige a los amigos.',
   'Mostrar que la ausencia de una explicación completa no equivale a ausencia de Dios, y que la sabiduría humana debe reconocer su lugar sin abandonar la justicia ni la compasión.',
   'El encuentro puede transformar la forma de preguntar sin negar el dolor vivido. La restauración incluye comunidad, intercesión y reconocimiento público de que los amigos hablaron incorrectamente.',
   'Dios no declara que el sufrimiento de Job fue castigo. La nueva familia no reemplaza emocionalmente a quienes murieron, y la prosperidad final no debe predicarse como garantía económica para quien soporta una prueba.',
   ARRAY['torbellino','creación','Behemot','Leviatán','límites','restauración']::text[],
   ARRAY['Job','amigos de Job','familia de Job']::text[],
   ARRAY['Uz']::text[])
)
insert into public.biblical_context_units (
  slug, book_code, source_id, scope_kind, chapter_start, verse_start,
  chapter_end, verse_end, title, summary, historical_context, jewish_context,
  literary_context, authorial_intent, theological_reflection,
  interpretive_cautions, key_terms, people_groups, places,
  source_locator, provider_version, content_hash, review_status, enabled, metadata
)
select
  data.slug, data.book_code, source.id, data.scope_kind,
  data.chapter_start::smallint, data.verse_start::smallint,
  data.chapter_end::smallint, data.verse_end::smallint,
  data.title, data.summary, data.historical_context, data.jewish_context,
  data.literary_context, data.authorial_intent, data.theological_reflection,
  data.interpretive_cautions, data.key_terms, data.people_groups, data.places,
  'vida://corpus/contexto/poesia-sabiduria/v1#' || data.slug,
  'poesia-sabiduria-v1-2026-08-02',
  encode(extensions.digest(concat_ws('|', data.slug, data.title, data.summary,
    data.historical_context, data.jewish_context, data.literary_context,
    data.authorial_intent, data.theological_reflection, data.interpretive_cautions), 'sha256'), 'hex'),
  'approved', true,
  jsonb_build_object('coverage_batch','poetry-wisdom','generated_by_ai',false,'review_level','editorial')
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