-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — plain_gloss nominales.
-- NO mover a supabase/migrations ni aplicar sin aprobación explícita.
--
-- Principio:
-- la traducción española se deriva únicamente de la glosa inglesa fuente ya
-- aprobada en STEPBible/TAHOT. No se usa RV1909, contexto, frecuencia ni
-- inferencia desde el lema hebreo para decidir el significado.
--
-- Subconjunto conservador de sustantivos con equivalencia española directa.
-- Se exige part_of_speech='noun' y coincidencia exacta de source_gloss.
--
-- Batch id propuesto: fase_h_es_plain_nouns_editorial_001_20260820
-- Política propuesta: insert-only + ON CONFLICT DO NOTHING.
--
-- Reversión exacta si posteriormente se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_plain_nouns_editorial_001_20260820';

with map(source_gloss, display_gloss_es) as (
  values
  ('destruction','destrucción'),
  ('fornication','fornicación'),
  ('rain','lluvia'),
  ('town','pueblo'),
  ('tumult','tumulto'),
  ('vigor','vigor'),
  ('viper','víbora'),
  ('weakness','debilidad'),
  ('wilderness','desierto'),
  ('young camel','camello joven'),
  ('acacia','acacia'),
  ('accusation','acusación'),
  ('adversary','adversario'),
  ('agate','ágata'),
  ('ambassador','embajador'),
  ('amber','ámbar'),
  ('amulet','amuleto'),
  ('annihilation','aniquilación'),
  ('ant','hormiga'),
  ('archer','arquero'),
  ('aroma','aroma'),
  ('atonement','expiación'),
  ('aunt','tía'),
  ('authority','autoridad'),
  ('autumn rain','lluvia otoñal'),
  ('bandage','vendaje'),
  ('beard','barba'),
  ('benefit','beneficio'),
  ('berry','baya'),
  ('betrothal','desposorio'),
  ('bitumen','betún'),
  ('blessing','bendición'),
  ('blossom','flor'),
  ('board','tabla'),
  ('boot','bota'),
  ('bribe','soborno'),
  ('brimstone','azufre'),
  ('brother-in-law','cuñado'),
  ('bud','brote'),
  ('bullock','novillo'),
  ('butter','mantequilla'),
  ('calamity','calamidad'),
  ('camp','campamento'),
  ('carbuncle','carbunclo'),
  ('cart','carro'),
  ('cause','causa'),
  ('cavern','caverna'),
  ('chance','azar'),
  ('channel','canal'),
  ('charioteer','auriga'),
  ('cherub','querubín'),
  ('clasp','broche'),
  ('club','garrote'),
  ('cobra','cobra'),
  ('tassel','borla'),
  ('terebinth','terebinto'),
  ('war-club','maza de guerra'),
  ('wild beast','bestia salvaje'),
  ('wild donkey','asno salvaje')
), eligible as (
  select
    e.id as lexical_entry_id,
    e.strong_number,
    e.lemma,
    e.source_gloss,
    map.display_gloss_es
  from public.biblical_lexical_entries e
  join map on map.source_gloss = e.source_gloss
  left join public.biblical_hebrew_spanish_glosses g
    on g.lexical_entry_id = e.id
  where e.language = 'hebrew'
    and e.review_status = 'approved'
    and e.enabled = true
    and e.display_gloss_es is null
    and g.lexical_entry_id is null
    and e.part_of_speech = 'noun'
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,
  display_gloss_es,
  alternative_glosses_es,
  confidence,
  derivation_method,
  source_gloss_snapshot,
  status,
  provenance
)
select
  lexical_entry_id,
  display_gloss_es,
  '{}'::text[],
  98,
  'manual_editorial_source_gloss_exact_v1',
  source_gloss,
  'manual_approved',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_plain_nouns_editorial_001_20260820',
    'source','STEPBible/TAHOT source_gloss en',
    'source_license','CC BY 4.0',
    'translation_layer','VIDA editorial Spanish',
    'translation_basis','exact approved English source_gloss + noun POS',
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false,
    'hebrew_lemma_used_to_infer_meaning',false,
    'strong_number',strong_number
  )
from eligible
on conflict (lexical_entry_id) do nothing;
