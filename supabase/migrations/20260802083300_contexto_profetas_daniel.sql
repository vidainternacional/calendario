-- FASE D · Bloque 4 · Profetas mayores 4: Daniel
update public.biblical_books
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('coverage_status', 'context_ready'),
    updated_at = now()
where code = 'DAN';

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
  ('daniel-perfil','DAN','book',1,NULL::smallint,12,NULL::smallint,
   'Daniel: fidelidad bajo imperios y esperanza apocalíptica',
   'Daniel combina relatos de judíos que viven fielmente en cortes extranjeras con visiones simbólicas sobre imperios, persecución, juicio y esperanza de que el dominio de Dios supera a todo poder humano.',
   'Los relatos se ambientan en los periodos babilónico y persa, mientras muchas características de las visiones responden con especial intensidad a la persecución bajo Antíoco IV en el siglo II a. C. La fecha y composición son objeto de amplio debate académico.',
   'Daniel forma parte de los Escritos en el Tanaj, no de los Profetas. Sus secciones hebreas y arameas reflejan una obra bilingüe que sostuvo la identidad judía en contextos imperiales.',
   'Los capítulos 1–6 contienen relatos cortesanos enlazados; los capítulos 7–12 presentan visiones apocalípticas. La obra usa simetrías, repeticiones de reinos y símbolos animales.',
   'Enseñar fidelidad sin asimilación total, desenmascarar la arrogancia imperial y ofrecer esperanza a comunidades perseguidas sin entregarles control sobre fechas exactas.',
   'Es posible servir responsablemente dentro de sistemas imperfectos sin adorarlos. La esperanza apocalíptica sostiene resistencia, humildad y confianza cuando la violencia parece dominar.',
   'Las visiones no deben convertirse en códigos para predecir cada conflicto moderno. Las identificaciones históricas y futuras deben distinguir evidencia, debate e interpretación religiosa. El libro no autoriza buscar experiencias peligrosas para demostrar fe.',
   ARRAY['Daniel','imperios','fidelidad','sabiduría','apocalíptica','Hijo de hombre','resurrección']::text[],
   ARRAY['judíos en diáspora','babilonios','persas','griegos']::text[],
   ARRAY['Babilonia','Susa','Jerusalén']::text[]),
  ('daniel-1-6-relatos-corte','DAN','section',1,NULL::smallint,6,NULL::smallint,
   'Relatos de fidelidad en las cortes imperiales',
   'Daniel y sus compañeros reciben educación cortesana, interpretan sueños, enfrentan decretos religiosos y mantienen su lealtad a Dios mientras sirven a gobernantes babilonios y persas.',
   'Los imperios trasladaban élites, cambiaban nombres y formaban administradores. Los relatos reflejan presiones de aculturación y la necesidad de negociar identidad dentro de instituciones extranjeras.',
   'La dieta, la oración orientada hacia Jerusalén y la negativa a adorar imágenes expresan fidelidad judía en diáspora. Los nombres arameos no eliminan la identidad del grupo.',
   'Cada relato presenta una crisis de lealtad, una respuesta sabia o valiente y una inversión donde el poder imperial termina reconociendo límites.',
   'Mostrar que la fidelidad puede combinar convicción, prudencia, servicio público y resistencia cuando el Estado exige adoración o violencia contra la conciencia.',
   'La integridad no requiere buscar conflicto, pero tampoco vender la conciencia. La oración y la comunidad sostienen decisiones difíciles.',
   'El horno y el foso no deben usarse para prometer rescate físico en toda persecución ni para animar a menores o adultos a exponerse a peligro. El relato de la dieta no constituye un plan médico universal.',
   ARRAY['diáspora','sabiduría','sueños','imagen','horno','oración','foso de leones']::text[],
   ARRAY['Daniel y sus compañeros','babilonios','persas','funcionarios']::text[],
   ARRAY['Babilonia','Jerusalén']::text[]),
  ('daniel-7-9-reinos-oracion','DAN','section',7,NULL::smallint,9,NULL::smallint,
   'Bestias, Hijo de hombre y oración por Jerusalén',
   'Daniel ve cuatro bestias y un tribunal celestial, recibe una visión del carnero y el macho cabrío y ora confesando el pecado comunitario mientras busca comprender el tiempo de desolación.',
   'Las imágenes reflejan sucesiones imperiales y alcanzan especial claridad en conflictos entre poderes helenísticos y la persecución asociada con Antíoco IV.',
   'El «como hijo de hombre» representa una figura humana o al pueblo santo frente a imperios bestiales y recibió desarrollos mesiánicos posteriores. La oración del capítulo 9 se arraiga en Escritura y solidaridad comunitaria.',
   'Visiones simbólicas se alternan con interpretación angélica y una oración extensa. El contraste entre bestias y humanidad es central.',
   'Describir a los imperios violentos como deshumanizadores, afirmar que el juicio pertenece a Dios y modelar una oración que asume responsabilidad sin perder esperanza.',
   'La esperanza no necesita negar la gravedad del poder opresivo. Orar con memoria histórica puede producir humildad y compromiso, no miedo obsesivo.',
   'Las setenta semanas tienen múltiples interpretaciones judías y cristianas y no deben presentarse como un cálculo indiscutible. El símbolo «Hijo de hombre» debe explicarse primero en Daniel antes de sus usos posteriores.',
   ARRAY['cuatro bestias','Anciano de días','Hijo de hombre','Antíoco IV','setenta semanas','oración']::text[],
   ARRAY['santos del Altísimo','judíos perseguidos','imperios helenísticos']::text[],
   ARRAY['Babilonia','Susa','Jerusalén']::text[]),
  ('daniel-10-12-conflicto-esperanza','DAN','section',10,NULL::smallint,12,NULL::smallint,
   'Conflicto imperial, persecución y esperanza de resurrección',
   'Una visión extensa presenta conflictos entre reyes del norte y del sur, profanación, resistencia de los entendidos, angustia y una esperanza final de despertar y recibir herencia.',
   'La descripción sigue de cerca luchas entre dinastías seléucidas y ptolemaicas y la crisis producida por Antíoco IV. El tramo final ha recibido distintas lecturas sobre el horizonte esperado y sus reinterpretaciones.',
   'El libro honra a quienes conservan fidelidad bajo persecución y contiene una de las expresiones más claras de esperanza de resurrección en el Tanaj.',
   'Una aparición celestial introduce un discurso histórico simbólico que culmina en lenguaje de tiempo final, libro sellado y destino de los sabios.',
   'Sostener a una comunidad que no puede controlar los imperios, afirmar que su sufrimiento es visto y orientar la resistencia hacia sabiduría y fidelidad.',
   'La esperanza de resurrección permite que el valor de una vida no dependa de la victoria inmediata. La sabiduría busca alumbrar sin dominar mediante miedo.',
   'Los «reyes del norte y del sur» no deben asignarse automáticamente a países modernos. Los números de días no autorizan fijar fechas del fin ni generar alarma. Las referencias a seres celestiales no ofrecen instrucciones para prácticas ocultistas.',
   ARRAY['rey del norte','rey del sur','abominación desoladora','Miguel','resurrección','sabios']::text[],
   ARRAY['judíos perseguidos','seléucidas','ptolemaicos','sabios']::text[],
   ARRAY['Persia','Grecia','Jerusalén']::text[])
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
  jsonb_build_object(
    'coverage_batch','major-prophets',
    'generated_by_ai',true,
    'review_level','ai_assisted_editorial',
    'human_review_status','pending'
  )
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