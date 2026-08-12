-- FASE D — Trazabilidad de la secuencia literal del NT griego.
-- No modifica texto bíblico ni glosas. Solo documenta la derivación ya existente.
-- La secuencia mostrada como ayuda de estudio debe ser exactamente la concatenación
-- ordenada de occurrence_gloss_es para las ocurrencias base aprobadas.

do $block$
declare
  v_segments integer;
  v_complete integer;
  v_matches integer;
  v_mismatches integer;
begin
  with greek_verses as (
    select v.id,v.book_code,v.chapter,v.verse,v.literal_translation_es,v.source_id
    from public.biblical_verse_texts v
    join public.biblical_sources s on s.id=v.source_id
    where v.language='greek'
      and v.enabled
      and v.review_status='approved'
      and s.slug='stepbible-lexical-pilot'
      and s.enabled
      and s.review_status='approved'
  ), built as (
    select
      g.id,
      g.literal_translation_es,
      string_agg(nullif(btrim(o.occurrence_gloss_es),''),' ' order by o.word_index,o.morpheme_index)
        filter (where nullif(btrim(o.occurrence_gloss_es),'') is not null) as gloss_sequence,
      count(o.*) as occurrence_count,
      count(o.*) filter (where nullif(btrim(o.occurrence_gloss_es),'') is not null) as gloss_count
    from greek_verses g
    left join public.biblical_word_occurrences o
      on o.source_id=g.source_id
     and o.book_code=g.book_code
     and o.chapter=g.chapter
     and o.verse=g.verse
     and o.enabled
     and o.review_status='approved'
     and o.textual_status='base'
    group by g.id,g.literal_translation_es
  )
  select
    count(*),
    count(*) filter (where occurrence_count=gloss_count and gloss_count>0),
    count(*) filter (
      where regexp_replace(coalesce(literal_translation_es,''),'\s+',' ','g')
          = regexp_replace(coalesce(gloss_sequence,''),'\s+',' ','g')
    ),
    count(*) filter (
      where regexp_replace(coalesce(literal_translation_es,''),'\s+',' ','g')
         <> regexp_replace(coalesce(gloss_sequence,''),'\s+',' ','g')
    )
  into v_segments,v_complete,v_matches,v_mismatches
  from built;

  if v_segments<>7958 then
    raise exception 'Conteo griego inesperado al documentar secuencia de glosas: %',v_segments;
  end if;
  if v_complete<>7958 then
    raise exception 'Hay segmentos griegos con glosas base incompletas: %/7958',v_complete;
  end if;
  if v_matches<>7958 or v_mismatches<>0 then
    raise exception 'La secuencia literal griega no coincide con las glosas aprobadas: matches %, mismatches %',v_matches,v_mismatches;
  end if;
end
$block$;

update public.biblical_verse_texts v
set metadata=coalesce(v.metadata,'{}'::jsonb) || jsonb_build_object(
      'literal_translation_kind','approved_gloss_sequence',
      'literal_translation_source','biblical_word_occurrences.occurrence_gloss_es',
      'literal_translation_rule','base occurrences ordered by word_index,morpheme_index and joined with a single space',
      'literal_translation_scope','study_aid_not_polished_translation',
      'literal_translation_verified_matches_source_glosses',true,
      'literal_translation_verified_segments',7958,
      'generated_by_ai',false
    ),
    updated_at=now()
from public.biblical_sources s
where s.id=v.source_id
  and s.slug='stepbible-lexical-pilot'
  and v.language='greek'
  and v.enabled
  and v.review_status='approved';
