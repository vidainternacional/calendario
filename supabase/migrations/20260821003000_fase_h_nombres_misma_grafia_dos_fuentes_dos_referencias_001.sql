with pending as (
  select e.id,e.lexical_id,e.strong_number,e.source_gloss,trim(split_part(e.source_gloss,'»',1)) as name
  from public.biblical_lexical_entries e
  where e.language='hebrew' and e.enabled=true and e.review_status='approved'
    and not exists (select 1 from public.biblical_hebrew_spanish_glosses g where g.lexical_entry_id=e.id)
    and e.source_gloss like '%»%'
), hits as (
  select distinct p.id,p.lexical_id,p.strong_number,p.source_gloss,p.name,o.book_code,o.chapter,o.verse,v.source_id
  from pending p
  join public.biblical_word_occurrences o on o.lexical_entry_id=p.id and o.enabled=true and o.review_status='approved'
  join public.biblical_verse_texts v on v.book_code=o.book_code and v.chapter=o.chapter and v.verse=o.verse and v.enabled=true and v.review_status='approved'
  join public.biblical_sources s on s.id=v.source_id
  where s.language='spa'
    and length(p.name)>=5
    and p.name ~ '^[A-Z][A-Za-z-]+$'
    and v.original_text ~ ('(^|[^[:alpha:]])' || regexp_replace(p.name,'([\\.^$|()\[\]{}*+?])','\\\1','g') || '([^[:alpha:]]|$)')
), approved as (
  select id,lexical_id,strong_number,source_gloss,name,
         count(distinct (book_code,chapter,verse)) refs,
         count(distinct source_id) sources
  from hits
  group by id,lexical_id,strong_number,source_gloss,name
  having count(distinct (book_code,chapter,verse)) >= 2
     and count(distinct source_id) >= 2
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,
  derivation_method,source_gloss_snapshot,status,provenance
)
select id,name,array[]::text[],99,
       'same_surface_two_spanish_sources_two_refs_v1',source_gloss,'verified_derived',
       jsonb_build_object(
         'phase','FASE_H_BLOQUE_3',
         'batch_id','fase_h_es_names_two_sources_two_refs_001_20260820',
         'lexical_id',lexical_id,
         'strong_number',strong_number,
         'source_identity','STEPBible TAHOT + verified Spanish Bible anchors',
         'context_used_as_meaning',false,
         'spanish_sources_min',2,
         'spanish_references_min',2
       )
from approved
on conflict (lexical_entry_id) do nothing;
