-- FASE D — Cobertura Bíblica Integral
-- Importador directo y reproducible del corpus TAHOT fijado.
-- Carga texto original, transliteración, léxico y morfología.
-- No modifica RLS. Ejecución exclusiva de service_role.

create table if not exists internal.tahot_book_catalog (
  step_code text primary key,
  book_code text not null unique references public.biblical_books(code) on delete restrict,
  source_key text not null
);

insert into internal.tahot_book_catalog(step_code, book_code, source_key) values
  ('Gen','GEN','tahot-gen-deu'),('Exo','EXO','tahot-gen-deu'),('Lev','LEV','tahot-gen-deu'),('Num','NUM','tahot-gen-deu'),('Deu','DEU','tahot-gen-deu'),
  ('Jos','JOS','tahot-jos-est'),('Jdg','JDG','tahot-jos-est'),('Rut','RUT','tahot-jos-est'),('1Sa','1SA','tahot-jos-est'),('2Sa','2SA','tahot-jos-est'),('1Ki','1KI','tahot-jos-est'),('2Ki','2KI','tahot-jos-est'),('1Ch','1CH','tahot-jos-est'),('2Ch','2CH','tahot-jos-est'),('Ezr','EZR','tahot-jos-est'),('Neh','NEH','tahot-jos-est'),('Est','EST','tahot-jos-est'),
  ('Job','JOB','tahot-job-sng'),('Psa','PSA','tahot-job-sng'),('Pro','PRO','tahot-job-sng'),('Ecc','ECC','tahot-job-sng'),('Sng','SNG','tahot-job-sng'),
  ('Isa','ISA','tahot-isa-mal'),('Jer','JER','tahot-isa-mal'),('Lam','LAM','tahot-isa-mal'),('Ezk','EZK','tahot-isa-mal'),('Dan','DAN','tahot-isa-mal'),('Hos','HOS','tahot-isa-mal'),('Jol','JOL','tahot-isa-mal'),('Amo','AMO','tahot-isa-mal'),('Oba','OBA','tahot-isa-mal'),('Jon','JON','tahot-isa-mal'),('Mic','MIC','tahot-isa-mal'),('Nam','NAM','tahot-isa-mal'),('Hab','HAB','tahot-isa-mal'),('Zep','ZEP','tahot-isa-mal'),('Hag','HAG','tahot-isa-mal'),('Zec','ZEC','tahot-isa-mal'),('Mal','MAL','tahot-isa-mal')
on conflict(step_code) do update set book_code=excluded.book_code, source_key=excluded.source_key;

revoke all on internal.tahot_book_catalog from public, anon, authenticated;
grant select on internal.tahot_book_catalog to service_role;

create or replace function internal.import_stepbible_tahot_core_v3(
  p_source_key text,
  p_book_codes text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, internal, pg_temp
as $function$
declare
  v_url text;
  v_expected_sha text;
  v_dataset text;
  v_content text;
  v_status integer;
  v_actual_sha text;
  v_source_id uuid;
  v_source_commit constant text := 'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39';
  v_provider_version text := 'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39';
  v_selected_books integer;
  v_raw_count integer;
  v_parsed_count integer;
  v_bad integer;
  v_summary jsonb;
begin
  case p_source_key
    when 'tahot-gen-deu' then
      v_url := 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Gen-Deu%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt';
      v_expected_sha := 'e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b';
      v_dataset := 'TAHOT Gen-Deu';
    when 'tahot-jos-est' then
      v_url := 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Jos-Est%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt';
      v_expected_sha := '195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775';
      v_dataset := 'TAHOT Jos-Est';
    when 'tahot-job-sng' then
      v_url := 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt';
      v_expected_sha := '84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5';
      v_dataset := 'TAHOT Job-Sng';
    when 'tahot-isa-mal' then
      v_url := 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Isa-Mal%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt';
      v_expected_sha := 'f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5';
      v_dataset := 'TAHOT Isa-Mal';
    else
      raise exception 'Fuente TAHOT no autorizada: %', p_source_key;
  end case;

  select count(*) into v_selected_books
  from internal.tahot_book_catalog c
  where c.source_key=p_source_key
    and (p_book_codes is null or c.book_code=any(p_book_codes));
  if v_selected_books=0 then raise exception 'No hay libros seleccionados para %',p_source_key; end if;
  if p_book_codes is not null and v_selected_books<>cardinality(p_book_codes) then
    raise exception 'La selección contiene libros fuera de la fuente %',p_source_key;
  end if;

  select id into v_source_id from public.biblical_sources
  where slug='stepbible-lexical-pilot' and enabled and review_status='approved' and license_status='verified';
  if v_source_id is null then raise exception 'Fuente STEPBible aprobada no encontrada'; end if;

  select h.status,h.content into v_status,v_content from extensions.http_get(v_url) h;
  if v_status<>200 or v_content is null then raise exception 'No se pudo recuperar %: HTTP %',p_source_key,v_status; end if;
  v_actual_sha := encode(extensions.digest(v_content,'sha256'),'hex');
  if v_actual_sha<>v_expected_sha then raise exception 'SHA TAHOT inesperado para %: %',p_source_key,v_actual_sha; end if;

  drop table if exists pg_temp.tahot_raw_rows;
  drop table if exists pg_temp.tahot_parsed_rows;
  drop table if exists pg_temp.tahot_visible_words;
  drop table if exists pg_temp.tahot_components;
  drop table if exists pg_temp.tahot_lexical;
  drop table if exists pg_temp.tahot_verse_texts;

  create temporary table tahot_raw_rows on commit drop as
  select l.ord::integer source_line,c.step_code,c.book_code,string_to_array(l.line,E'\t') fields,l.line source_line_text
  from regexp_split_to_table(v_content,E'\r?\n') with ordinality l(line,ord)
  join internal.tahot_book_catalog c
    on split_part(l.line,'.',1)=c.step_code
   and c.source_key=p_source_key
   and (p_book_codes is null or c.book_code=any(p_book_codes));

  select count(*) into v_raw_count from tahot_raw_rows;
  select count(*) into v_bad from tahot_raw_rows where cardinality(fields)<>17;
  if v_bad<>0 then raise exception 'TAHOT % contiene % filas con columnas inválidas',p_source_key,v_bad; end if;

  create temporary table tahot_parsed_rows on commit drop as
  with matched as (
    select r.*,regexp_match(r.fields[1],'^([123]?[A-Za-z]{2,3})\.([0-9]+)\.([0-9]+)[a-z]?(?:\([0-9]+\.[0-9]+[a-z]?\))?#([0-9]+)(=.+)$') m
    from tahot_raw_rows r
  )
  select
    source_line,step_code,book_code,fields,source_line_text,
    (m[2])::smallint chapter,(m[3])::smallint verse,m[4] source_index_raw,m[5] text_suffix,
    case when m[5]='=R' then 'restored' when m[5]='=X' then 'lxx_addition' when m[5] like '=Q%' then 'qere' when m[5] like '=L%' then 'leningrad' else 'other' end source_textual_status,
    case when fields[6] like 'H%' then 'hebrew' when fields[6] like 'A%' then 'aramaic' when coalesce(fields[6],'')='' then 'none' else 'unknown' end language,
    (m[5] like '=Q%' and fields[2]='' and fields[3]='[ ]' and fields[4]='[ ]' and fields[5]='' and fields[6]='' and fields[7] like 'K=%') is_placeholder,
    replace(split_part(fields[2],E'\\',1),'/','') surface_form,
    case when strpos(fields[2],E'\\')>0 then replace(split_part(fields[2],E'\\',2),'/','') else '' end punctuation_after,
    (replace(split_part(fields[3],E'\\',1),'/','') || case when strpos(fields[3],E'\\')>0 then split_part(fields[3],E'\\',2) else '' end) display_transliteration,
    regexp_replace(btrim(replace(split_part(fields[4],E'\\',1),'/',' ')),'\s+',' ','g') source_gloss_sequence_en,
    encode(extensions.digest(source_line_text,'sha256'),'hex') source_line_sha256
  from matched where m is not null;

  select count(*) into v_parsed_count from tahot_parsed_rows;
  if v_parsed_count<>v_raw_count then raise exception 'No se pudieron parsear todas las filas TAHOT: %/%',v_parsed_count,v_raw_count; end if;
  select count(*) into v_bad from tahot_parsed_rows where language='unknown' or (language='none' and not is_placeholder);
  if v_bad<>0 then raise exception 'TAHOT contiene % filas con idioma inválido',v_bad; end if;

  create temporary table tahot_visible_words on commit drop as
  select p.*,
    row_number() over(partition by book_code,chapter,verse order by source_line)::smallint display_word_index
  from tahot_parsed_rows p
  where not is_placeholder;

  select count(*) into v_bad from tahot_visible_words
  where language not in ('hebrew','aramaic') or btrim(surface_form)='';
  if v_bad<>0 then raise exception 'TAHOT contiene % palabras visibles inválidas',v_bad; end if;

  create temporary table tahot_components on commit drop as
  with exploded as (
    select w.*,
      u.component_index::integer component_index,
      u.dpart,u.epart,u.hpart,u.tpart,u.gpart,u.mpart,
      (btrim(u.dpart)='' and btrim(u.epart)='' and btrim(coalesce(u.hpart,''))='' and btrim(coalesce(u.tpart,''))='' and btrim(coalesce(u.gpart,''))='' and btrim(coalesce(u.mpart,''))='') is_separator,
      regexp_replace(btrim(u.dpart),'\+$','') dcore,
      regexp_replace(btrim(u.epart),'\+$','') ecore
    from tahot_visible_words w
    cross join lateral unnest(
      case when split_part(w.fields[5],E'\\',1)='' then array[]::text[] else string_to_array(split_part(w.fields[5],E'\\',1),'/') end,
      case when split_part(w.fields[12],E'\\',1)='' then array[]::text[] else string_to_array(split_part(w.fields[12],E'\\',1),'/') end,
      case when split_part(w.fields[2],E'\\',1)='' then array[]::text[] else string_to_array(split_part(w.fields[2],E'\\',1),'/') end,
      case when split_part(w.fields[3],E'\\',1)='' then array[]::text[] else string_to_array(split_part(w.fields[3],E'\\',1),'/') end,
      case when split_part(w.fields[4],E'\\',1)='' then array[]::text[] else string_to_array(split_part(w.fields[4],E'\\',1),'/') end,
      case when w.fields[6]='' then array[]::text[] else string_to_array(w.fields[6],'/') end
    ) with ordinality u(dpart,epart,hpart,tpart,gpart,mpart,component_index)
  ), segmented as (
    select e.*,
      1+sum(case when is_separator then 1 else 0 end) over(partition by source_line order by component_index) segment_no
    from exploded e
  ), nonsep as (
    select s.*,
      regexp_replace(regexp_replace(dcore,'^\{',''),'\}$','') lexical_id,
      regexp_replace(regexp_replace(ecore,'^\{',''),'\}$','') expanded_core,
      (dcore like '{%}' ) is_root,
      row_number() over(partition by source_line order by component_index)::smallint morpheme_index,
      count(*) over(partition by source_line)::smallint morpheme_count,
      row_number() over(partition by source_line,segment_no order by component_index)::smallint segment_position,
      count(*) over(partition by source_line,segment_no)::smallint segment_count,
      count(*) filter(where dcore like '{%}') over(partition by source_line,segment_no)::integer root_count,
      min(component_index) filter(where dcore like '{%}') over(partition by source_line,segment_no)::integer root_component_index
    from segmented s where not is_separator
  )
  select
    n.*,
    split_part(expanded_core,'=',1) expanded_id,
    split_part(expanded_core,'=',2) source_lemma,
    regexp_replace(expanded_core,'^[^=]+=[^=]+=','') source_gloss,
    left(lexical_id,5) strong_number,
    case when component_index<root_component_index then 'prefix' when component_index=root_component_index then 'word' else 'suffix' end token_kind,
    segment_position>1 joins_previous,
    segment_position<segment_count joins_next,
    btrim(dpart) like '%+' source_joins_next_word
  from nonsep n;

  select count(*) into v_bad from tahot_components
  where root_count<>1 or lexical_id !~ '^H[0-9]{4}[A-Z]?$' or strong_number !~ '^H[0-9]{4}$'
     or expanded_id<>lexical_id or expanded_core !~ '^[^=]+=[^=]+=' or hpart is null or tpart is null or gpart is null or mpart is null;
  if v_bad<>0 then raise exception 'TAHOT contiene % componentes léxicos inválidos',v_bad; end if;

  create temporary table tahot_lexical on commit drop as
  with lemma_counts as (
    select language,lexical_id,source_lemma,count(*) uses,min(source_line) first_line
    from tahot_components group by language,lexical_id,source_lemma
  ), lemma_ranked as (
    select *,row_number() over(partition by language,lexical_id order by uses desc,first_line,source_lemma)::integer rn
    from lemma_counts
  ), surface_counts as (
    select language,lexical_id,btrim(hpart) surface,count(*) uses,min(source_line) first_line
    from tahot_components where btrim(hpart)<>'' group by language,lexical_id,btrim(hpart)
  ), surface_ranked as (
    select *,row_number() over(partition by language,lexical_id order by uses desc,first_line,surface)::integer rn
    from surface_counts
  ), gloss_counts as (
    select language,lexical_id,source_gloss,count(*) uses,min(source_line) first_line
    from tahot_components where coalesce(source_gloss,'')<>'' group by language,lexical_id,source_gloss
  ), gloss_ranked as (
    select *,row_number() over(partition by language,lexical_id order by uses desc,first_line,source_gloss)::integer rn
    from gloss_counts
  ), grouped as (
    select c.language,c.lexical_id,
      bool_and(c.token_kind='prefix') all_prefix,bool_and(c.token_kind='suffix') all_suffix,
      bool_or(coalesce(c.mpart,'') ~ '^(HN|AN)') has_noun,
      bool_or(coalesce(c.mpart,'') ~ '^(HV|AV)') has_verb,
      bool_or(coalesce(c.mpart,'') ~ '^(HA|AA)') has_adjective,
      bool_or(coalesce(c.mpart,'') ~ '^(HS|AS)') has_pronoun,
      min(c.source_line) first_line,
      jsonb_agg(distinct to_jsonb(c.source_lemma)) source_lemmas
    from tahot_components c group by c.language,c.lexical_id
  )
  select g.language,g.lexical_id,left(g.lexical_id,5) strong_number,
    case when l.source_lemma ~ '[א-ת]' then l.source_lemma else s.surface end lemma,
    case when l.source_lemma ~ '[א-ת]' then 'most_frequent_source_script_lemma' else 'most_frequent_observed_surface' end lemma_policy,
    gr.source_gloss,
    case when g.all_prefix then 'prefix' when g.all_suffix then 'suffix' when g.has_noun then 'noun' when g.has_verb then 'verb' when g.has_adjective then 'adjective' when g.has_pronoun then 'pronoun' else null end part_of_speech,
    g.first_line,g.source_lemmas
  from grouped g
  join lemma_ranked l on l.language=g.language and l.lexical_id=g.lexical_id and l.rn=1
  left join surface_ranked s on s.language=g.language and s.lexical_id=g.lexical_id and s.rn=1
  left join gloss_ranked gr on gr.language=g.language and gr.lexical_id=g.lexical_id and gr.rn=1;

  select count(*) into v_bad from tahot_lexical where coalesce(lemma,'')='';
  if v_bad<>0 then raise exception 'No se pudo derivar lema canónico para % entradas',v_bad; end if;

  insert into public.biblical_lexical_entries(
    source_id,language,lexical_id,strong_number,lemma,transliteration,part_of_speech,
    source_gloss,display_gloss_es,display_gloss_kind,definition,source_locator,
    provider_version,content_hash,review_status,enabled,approved_at,approved_by,metadata
  )
  select v_source_id,l.language,l.lexical_id,l.strong_number,l.lemma,null,l.part_of_speech,
    nullif(l.source_gloss,''),null,'editorial_translation',null,v_url||'#L'||l.first_line,
    v_provider_version,
    encode(extensions.digest(convert_to(concat_ws('|','tahot-core-v3',v_expected_sha,l.language,l.lexical_id,l.lemma,coalesce(l.part_of_speech,''),coalesce(l.source_gloss,'')),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),null,
    jsonb_build_object('dataset',v_dataset,'source_commit',v_source_commit,'source_file_sha256',v_expected_sha,
      'canonical_lemma_policy',l.lemma_policy,'source_lemmas',l.source_lemmas,'source_gloss_language','en',
      'spanish_editorial_fields_complete',false,'generated_by_ai',false,'direct_import_version','tahot-core-v3')
  from tahot_lexical l
  on conflict(source_id,language,lexical_id) do nothing;

  insert into public.biblical_word_occurrences(
    source_id,lexical_entry_id,book_code,chapter,verse,word_index,surface_form,normalized_form,
    morphology_code,morphology_summary,source_locator,provider_version,content_hash,review_status,
    enabled,approved_at,approved_by,metadata,display_word_index,morpheme_index,token_kind,
    word_group_key,occurrence_transliteration,occurrence_gloss_es,punctuation_before,punctuation_after,
    joins_previous,joins_next,textual_status,variant_group_key,witness_data
  )
  select v_source_id,e.id,c.book_code,c.chapter,c.verse,c.display_word_index,
    coalesce(c.hpart,''),nullif(c.hpart,''),nullif(c.mpart,''),null,
    v_url||'#L'||c.source_line,v_provider_version,
    encode(extensions.digest(convert_to(concat_ws('|','tahot-occurrence-v3',v_expected_sha,c.book_code,c.chapter,c.verse,c.display_word_index,c.morpheme_index,c.language,c.lexical_id,coalesce(c.hpart,''),coalesce(c.mpart,''),c.source_line_sha256),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),null,
    jsonb_build_object('dataset',v_dataset,'source_commit',v_source_commit,'source_file_sha256',v_expected_sha,
      'source_line',c.source_line,'source_line_sha256',c.source_line_sha256,'source_gloss_en',c.gpart,
      'source_lemma',c.source_lemma,'source_joins_next_word',c.source_joins_next_word,
      'spanish_editorial_fields_complete',false,'generated_by_ai',false,'direct_import_version','tahot-core-v3'),
    c.display_word_index,c.morpheme_index,c.token_kind,
    lower(c.book_code)||'-'||c.chapter||'-'||c.verse||'-'||c.source_index_raw,
    nullif(c.tpart,''),null,null,
    case when c.morpheme_index=c.morpheme_count then nullif(c.punctuation_after,'') else null end,
    c.joins_previous,c.joins_next,'base',null,
    jsonb_build_object('text_suffix',c.text_suffix,'source_textual_status',c.source_textual_status,'language',c.language)
  from tahot_components c
  join public.biblical_lexical_entries e on e.source_id=v_source_id and e.language=c.language and e.lexical_id=c.lexical_id
  on conflict(book_code,chapter,verse,source_id,word_index,morpheme_index) do update set
    lexical_entry_id=excluded.lexical_entry_id,surface_form=excluded.surface_form,normalized_form=excluded.normalized_form,
    morphology_code=excluded.morphology_code,source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status=excluded.review_status,enabled=excluded.enabled,approved_at=excluded.approved_at,
    metadata=excluded.metadata,display_word_index=excluded.display_word_index,token_kind=excluded.token_kind,
    word_group_key=excluded.word_group_key,occurrence_transliteration=excluded.occurrence_transliteration,
    punctuation_after=excluded.punctuation_after,joins_previous=excluded.joins_previous,joins_next=excluded.joins_next,
    textual_status=excluded.textual_status,witness_data=excluded.witness_data,updated_at=now();

  create temporary table tahot_verse_texts on commit drop as
  with grouped as (
    select book_code,chapter,verse,language,
      min(source_line) first_line,max(source_line) last_line,count(*)::smallint token_count,
      string_agg(btrim(surface_form||punctuation_after),' ' order by source_line) original_text,
      nullif(string_agg(nullif(btrim(display_transliteration),'') ,' ' order by source_line),'') transliteration,
      nullif(string_agg(nullif(btrim(source_gloss_sequence_en),'') ,' ' order by source_line),'') source_gloss_sequence_en
    from tahot_visible_words group by book_code,chapter,verse,language
  )
  select g.*,
    row_number() over(partition by book_code,chapter,verse order by first_line)::integer segment_order
  from grouped g;

  insert into public.biblical_verse_texts(
    source_id,book_code,chapter,verse,language,original_text,normalized_text,transliteration,
    literal_translation_es,text_direction,token_count,analysis_status,source_locator,provider_version,
    content_hash,review_status,enabled,approved_at,approved_by,metadata
  )
  select v_source_id,t.book_code,t.chapter,t.verse,t.language,t.original_text,null,t.transliteration,null,'rtl',
    t.token_count,'verified',v_url||'#L'||t.first_line,v_provider_version,
    encode(extensions.digest(convert_to(concat_ws('|','tahot-verse-v3',v_expected_sha,t.book_code,t.chapter,t.verse,t.language,t.original_text,coalesce(t.transliteration,'')),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),null,
    jsonb_build_object('dataset',v_dataset,'source_commit',v_source_commit,'source_file_sha256',v_expected_sha,
      'segment_order',t.segment_order,'source_line_start',t.first_line,'source_line_end',t.last_line,
      'source_gloss_sequence_en',t.source_gloss_sequence_en,'base_edition','TAHOT',
      'literal_translation_es_status','not_reviewed','spanish_editorial_fields_complete',false,
      'generated_by_ai',false,'direct_import_version','tahot-core-v3')
  from tahot_verse_texts t
  on conflict(source_id,book_code,chapter,verse,language) do update set
    original_text=excluded.original_text,normalized_text=excluded.normalized_text,transliteration=excluded.transliteration,
    literal_translation_es=excluded.literal_translation_es,text_direction=excluded.text_direction,token_count=excluded.token_count,
    analysis_status=excluded.analysis_status,source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status=excluded.review_status,enabled=excluded.enabled,approved_at=excluded.approved_at,
    metadata=excluded.metadata,updated_at=now();

  insert into internal.biblical_textual_import_batches(
    source_id,dataset,book_code,source_commit,artifact_sha256,source_reference_count,base_word_count,
    variant_row_count,total_row_count,import_status,imported_verse_count,imported_occurrence_count,
    imported_variant_count,error_message,metadata,updated_at
  )
  select v_source_id,v_dataset,b.book_code,v_source_commit,
    encode(extensions.digest(convert_to(concat_ws('|','tahot-direct-core-v3',v_expected_sha,b.book_code),'UTF8'),'sha256'),'hex'),
    (select count(distinct (chapter,verse)) from tahot_visible_words w where w.book_code=b.book_code),
    (select count(*) from tahot_visible_words w where w.book_code=b.book_code),
    (select count(*) from tahot_parsed_rows r where r.book_code=b.book_code and (coalesce(r.fields[7],'')<>'' or coalesce(r.fields[8],'')<>'' or r.is_placeholder)),
    (select count(*) from tahot_parsed_rows r where r.book_code=b.book_code),
    'validated',
    (select count(*) from tahot_verse_texts t where t.book_code=b.book_code),
    (select count(*) from tahot_components c where c.book_code=b.book_code),
    0,null,
    jsonb_build_object('source_key',p_source_key,'source_url',v_url,'source_file_sha256',v_expected_sha,
      'direct_import_version','tahot-core-v3','variants_pending',true,'generated_by_ai',false),now()
  from (select distinct book_code from tahot_visible_words) b
  on conflict(source_id,dataset,book_code,source_commit) do update set
    artifact_sha256=excluded.artifact_sha256,source_reference_count=excluded.source_reference_count,
    base_word_count=excluded.base_word_count,variant_row_count=excluded.variant_row_count,total_row_count=excluded.total_row_count,
    import_status=excluded.import_status,imported_verse_count=excluded.imported_verse_count,
    imported_occurrence_count=excluded.imported_occurrence_count,error_message=null,metadata=excluded.metadata,updated_at=now();

  select count(*) into v_bad
  from tahot_visible_words w
  where (select count(*) from public.biblical_word_occurrences o where o.source_id=v_source_id and o.book_code=w.book_code and o.chapter=w.chapter and o.verse=w.verse and o.word_index=w.display_word_index)=0;
  if v_bad<>0 then raise exception 'Validación posterior: % palabras sin ocurrencias',v_bad; end if;

  select jsonb_agg(jsonb_build_object(
    'book_code',b.book_code,
    'references',(select count(distinct (chapter,verse)) from tahot_visible_words w where w.book_code=b.book_code),
    'verse_text_segments',(select count(*) from tahot_verse_texts t where t.book_code=b.book_code),
    'visible_words',(select count(*) from tahot_visible_words w where w.book_code=b.book_code),
    'occurrences',(select count(*) from tahot_components c where c.book_code=b.book_code),
    'lexical_keys',(select count(distinct (language,lexical_id)) from tahot_components c where c.book_code=b.book_code),
    'mixed_references',(select count(*) from (select chapter,verse from tahot_verse_texts t where t.book_code=b.book_code group by chapter,verse having count(*)>1) q),
    'source_sha256',v_expected_sha,
    'variants_pending',true
  ) order by (select canonical_order from public.biblical_books bb where bb.code=b.book_code)) into v_summary
  from (select distinct book_code from tahot_visible_words) b;

  return jsonb_build_object('source_key',p_source_key,'dataset',v_dataset,'source_sha256',v_expected_sha,'books',v_summary,'core_version','tahot-core-v3');
end
$function$;

revoke all on function internal.import_stepbible_tahot_core_v3(text,text[]) from public;
revoke all on function internal.import_stepbible_tahot_core_v3(text,text[]) from anon;
revoke all on function internal.import_stepbible_tahot_core_v3(text,text[]) from authenticated;
grant execute on function internal.import_stepbible_tahot_core_v3(text,text[]) to service_role;
