-- FASE D · Bloque 4
-- Importador interno de un libro TAGNT desde una fuente fijada por URL y SHA-256.

create or replace function internal.import_stepbible_tagnt_book(
  p_step_code text,
  p_book_code text,
  p_expected_references integer,
  p_expected_base_words integer,
  p_expected_variant_rows integer,
  p_artifact_sha256 text,
  p_source_url text,
  p_source_file_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, internal, pg_temp
as $function$
declare
  v_status integer;
  v_content text;
  v_download_hash text;
  v_source_id uuid;
  v_reference_count integer;
  v_base_count integer;
  v_variant_count integer;
  v_total_count integer;
  v_verse_count integer;
  v_documented_variants integer;
  v_bad_hashes integer;
begin
  if p_step_code !~ '^[123]?[A-Za-z]{2,3}$' then
    raise exception 'Código STEPBible inválido: %', p_step_code;
  end if;
  if p_book_code !~ '^[123]?[A-Z]{2,3}$' then
    raise exception 'Código interno inválido: %', p_book_code;
  end if;
  if p_source_file_sha256 !~ '^[0-9a-f]{64}$'
     or p_artifact_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'SHA-256 inválido para %', p_book_code;
  end if;

  select id into v_source_id
  from public.biblical_sources
  where slug='stepbible-lexical-pilot'
    and enabled and review_status='approved';

  if v_source_id is null then
    raise exception 'Fuente STEPBible aprobada no encontrada';
  end if;

  select response.status, response.content
    into v_status, v_content
  from extensions.http_get(p_source_url) response;

  if v_status <> 200 or v_content is null then
    raise exception 'No se pudo descargar TAGNT para %: HTTP %', p_book_code, v_status;
  end if;

  v_download_hash := encode(extensions.digest(convert_to(v_content,'UTF8'),'sha256'),'hex');
  if v_download_hash <> p_source_file_sha256 then
    raise exception 'Hash TAGNT inesperado para %: %', p_book_code, v_download_hash;
  end if;

  drop table if exists pg_temp.tmp_tagnt_words;
  create temporary table tmp_tagnt_words (
    line_no integer not null,
    source_reference text not null,
    chapter smallint not null,
    verse smallint not null,
    source_index smallint not null,
    source_suffix text,
    surface_full text not null,
    surface_clean text not null,
    punctuation_after text,
    occurrence_transliteration text,
    source_gloss_en text,
    source_gloss_es text,
    strong_number text not null,
    morphology_code text,
    lemma text not null,
    lemma_gloss_en text,
    witnesses text[] not null,
    variant_note text,
    source_word_link text,
    source_lexical_id text,
    line_hash text not null,
    base_edition text,
    is_base boolean not null default false,
    display_word_index smallint
  ) on commit drop;

  insert into tmp_tagnt_words(
    line_no,source_reference,chapter,verse,source_index,source_suffix,
    surface_full,surface_clean,punctuation_after,occurrence_transliteration,
    source_gloss_en,source_gloss_es,strong_number,morphology_code,lemma,
    lemma_gloss_en,witnesses,variant_note,source_word_link,source_lexical_id,line_hash
  )
  with lines as (
    select ordinality::integer as line_no,
           trim(trailing E'\r' from line) as line,
           string_to_array(trim(trailing E'\r' from line), E'\t') as f
    from regexp_split_to_table(v_content,E'\n') with ordinality as source(line,ordinality)
    where line like p_step_code||'.%'
  ), parsed as (
    select line_no,line,f,
      regexp_replace(f[2], E'\\s+\\([^()]*\\)\\s*$', '') as surface_full
    from lines
    where array_length(f,1)>=12
      and f[1] ~ ('^'||p_step_code||'\\.[0-9]+\\.[0-9]+[^#]*#[0-9]+')
  )
  select
    line_no,
    f[1],
    substring(f[1] from '^[^.]+\.([0-9]+)\.')::smallint,
    substring(f[1] from '^[^.]+\.[0-9]+\.([0-9]+)')::smallint,
    substring(f[1] from '#([0-9]+)')::smallint,
    substring(f[1] from '(=[^[:space:]]+)$'),
    surface_full,
    regexp_replace(surface_full,'[,.;:·¶]+$','','g'),
    nullif(substring(surface_full from '([,.;:·¶]+)$'),''),
    substring(f[2] from '\(([^()]*)\)\s*$'),
    nullif(f[3],''),
    nullif(f[9],''),
    substring(f[4] from '^([GH][0-9]{4})'),
    substring(f[4] from '^[^=]+=(.*)$'),
    split_part(f[5],'=',1),
    nullif(substring(f[5] from '^[^=]+=(.*)$'),''),
    array_remove(string_to_array(f[6],'+'),''),
    nullif(f[8],''),
    nullif(f[11],''),
    nullif(f[12],''),
    encode(extensions.digest(convert_to(line,'UTF8'),'sha256'),'hex')
  from parsed;

  if not exists(select 1 from tmp_tagnt_words) then
    raise exception 'No se encontraron filas TAGNT para %', p_step_code;
  end if;

  with editions as (
    select chapter,verse,
      case
        when bool_or('NA28'=any(witnesses)) then 'NA28'
        when bool_or('NA27'=any(witnesses)) then 'NA27'
        when bool_or('Tyn'=any(witnesses)) then 'Tyn'
        when bool_or('SBL'=any(witnesses)) then 'SBL'
        when bool_or('WH'=any(witnesses)) then 'WH'
        when bool_or('Treg'=any(witnesses)) then 'Treg'
        when bool_or('TR'=any(witnesses)) then 'TR'
        when bool_or('Byz'=any(witnesses)) then 'Byz'
      end as base_edition
    from tmp_tagnt_words
    group by chapter,verse
  )
  update tmp_tagnt_words word
  set base_edition=edition.base_edition,
      is_base=(edition.base_edition=any(word.witnesses))
  from editions edition
  where edition.chapter=word.chapter and edition.verse=word.verse;

  if exists(select 1 from tmp_tagnt_words where base_edition is null) then
    raise exception 'Existen referencias sin edición base reconocida en %', p_book_code;
  end if;

  with base_positions as (
    select line_no,
      row_number() over(partition by chapter,verse order by source_index,line_no)::smallint as position
    from tmp_tagnt_words
    where is_base
  )
  update tmp_tagnt_words word
  set display_word_index=position.position
  from base_positions position
  where position.line_no=word.line_no;

  update tmp_tagnt_words variant
  set display_word_index=(
    select (count(*)+1)::smallint
    from tmp_tagnt_words base
    where base.chapter=variant.chapter and base.verse=variant.verse
      and base.is_base and base.source_index<variant.source_index
  )
  where not variant.is_base;

  select count(distinct (chapter,verse)),
         count(*) filter(where is_base),
         count(*) filter(where not is_base),
         count(*)
    into v_reference_count,v_base_count,v_variant_count,v_total_count
  from tmp_tagnt_words;

  if v_reference_count<>p_expected_references then
    raise exception '%: referencias esperadas %, obtenidas %',
      p_book_code,p_expected_references,v_reference_count;
  end if;
  if v_base_count<>p_expected_base_words then
    raise exception '%: palabras base esperadas %, obtenidas %',
      p_book_code,p_expected_base_words,v_base_count;
  end if;
  if v_variant_count<>p_expected_variant_rows then
    raise exception '%: lecturas adicionales esperadas %, obtenidas %',
      p_book_code,p_expected_variant_rows,v_variant_count;
  end if;

  drop table if exists pg_temp.tmp_tagnt_lexical;
  create temporary table tmp_tagnt_lexical (
    strong_number text not null,
    lemma text not null,
    lexical_id text,
    frequency integer not null,
    part_of_speech text,
    source_gloss text,
    display_gloss_es text,
    first_line integer not null,
    source_lines jsonb not null,
    source_lexical_ids jsonb not null,
    primary key(strong_number,lemma)
  ) on commit drop;

  insert into tmp_tagnt_lexical(
    strong_number,lemma,frequency,part_of_speech,source_gloss,
    display_gloss_es,first_line,source_lines,source_lexical_ids
  )
  select
    strong_number,
    lemma,
    count(*)::integer,
    case split_part(min(morphology_code),'-',1)
      when 'N' then 'noun' when 'V' then 'verb' when 'A' then 'adjective'
      when 'T' then 'article' when 'P' then 'pronoun' when 'PREP' then 'preposition'
      when 'CONJ' then 'conjunction' when 'ADV' then 'adverb' when 'PRT' then 'particle'
      when 'R' then 'relative_pronoun' when 'D' then 'demonstrative'
      when 'S' then 'possessive' when 'F' then 'reflexive_pronoun'
      when 'COND' then 'conditional' when 'Q' then 'interrogative'
      when 'X' then 'indefinite' when 'INJ' then 'interjection'
      else lower(split_part(min(morphology_code),'-',1))
    end,
    (array_agg(lemma_gloss_en order by line_no) filter(where lemma_gloss_en is not null))[1],
    (array_agg(source_gloss_es order by line_no) filter(where source_gloss_es is not null))[1],
    min(line_no),
    to_jsonb(array_agg(distinct line_no order by line_no)),
    to_jsonb(array_agg(distinct source_lexical_id order by source_lexical_id)
      filter(where source_lexical_id is not null))
  from tmp_tagnt_words
  group by strong_number,lemma;

  update tmp_tagnt_lexical item
  set lexical_id=(
    select entry.lexical_id
    from public.biblical_lexical_entries entry
    where entry.source_id=v_source_id
      and entry.language='greek'
      and entry.strong_number=item.strong_number
      and entry.lemma=item.lemma
    order by entry.enabled desc,entry.lexical_id
    limit 1
  )
  where exists(
    select 1 from public.biblical_lexical_entries entry
    where entry.source_id=v_source_id
      and entry.language='greek'
      and entry.strong_number=item.strong_number
      and entry.lemma=item.lemma
  );

  with ranked as (
    select strong_number,lemma,
      row_number() over(partition by strong_number order by frequency desc,lemma) as rn
    from tmp_tagnt_lexical
    where lexical_id is null
  ), candidates as (
    select strong.strong_number,
           candidate.lexical_id,
           row_number() over(partition by strong.strong_number order by candidate.n) as rn
    from (select distinct strong_number from ranked) strong
    cross join lateral (
      select n,
        strong.strong_number||case when n=0 then '' else chr(64+n) end as lexical_id
      from generate_series(0,26) n
      where not exists(
        select 1 from public.biblical_lexical_entries entry
        where entry.source_id=v_source_id
          and entry.language='greek'
          and entry.lexical_id=strong.strong_number||case when n=0 then '' else chr(64+n) end
      )
    ) candidate
  )
  update tmp_tagnt_lexical item
  set lexical_id=candidate.lexical_id
  from ranked
  join candidates candidate
    on candidate.strong_number=ranked.strong_number and candidate.rn=ranked.rn
  where item.strong_number=ranked.strong_number and item.lemma=ranked.lemma;

  if exists(select 1 from tmp_tagnt_lexical where lexical_id is null) then
    raise exception 'No se pudieron asignar IDs léxicos estables para %', p_book_code;
  end if;

  insert into public.biblical_lexical_entries(
    source_id,language,lexical_id,strong_number,lemma,transliteration,
    part_of_speech,source_gloss,display_gloss_es,display_gloss_kind,
    definition,source_locator,provider_version,content_hash,
    review_status,enabled,approved_at,metadata
  )
  select
    v_source_id,'greek',lexical_id,strong_number,lemma,null,
    part_of_speech,source_gloss,display_gloss_es,'source_translation',null,
    p_source_url||'#L'||first_line,
    'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    encode(extensions.digest(convert_to(concat_ws('|',
      'lexical','greek',lexical_id,strong_number,lemma,part_of_speech,
      coalesce(source_gloss,''),coalesce(display_gloss_es,''),
      'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39'),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),
    jsonb_build_object(
      'source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'source_file_hash',p_source_file_sha256,
      'source_lines',source_lines,
      'source_lexical_ids',source_lexical_ids,
      'review_level','source_validated',
      'generated_by_ai',false
    )
  from tmp_tagnt_lexical
  on conflict(source_id,language,lexical_id) do update set
    metadata=coalesce(public.biblical_lexical_entries.metadata,'{}'::jsonb)||excluded.metadata,
    review_status='approved',enabled=true,
    approved_at=coalesce(public.biblical_lexical_entries.approved_at,excluded.approved_at),
    updated_at=now();

  insert into public.biblical_word_occurrences(
    source_id,lexical_entry_id,book_code,chapter,verse,word_index,
    surface_form,normalized_form,morphology_code,morphology_summary,
    source_locator,provider_version,content_hash,review_status,enabled,
    approved_at,metadata,display_word_index,morpheme_index,token_kind,
    word_group_key,occurrence_transliteration,occurrence_gloss_es,
    punctuation_before,punctuation_after,joins_previous,joins_next,
    textual_status,variant_group_key,witness_data
  )
  select
    v_source_id,entry.id,p_book_code,word.chapter,word.verse,word.source_index,
    word.surface_clean,lower(word.surface_clean),word.morphology_code,null,
    p_source_url||'#L'||word.line_no,
    'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    encode(extensions.digest(convert_to(concat_ws('|',
      'occurrence',p_book_code,word.chapter,word.verse,word.source_index,
      lexical.lexical_id,word.surface_clean,word.morphology_code,
      word.occurrence_transliteration,word.source_gloss_es,
      case when word.is_base then 'base' else 'variant' end,
      word.line_hash,'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39'
    ),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),
    jsonb_build_object(
      'source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'source_file_hash',p_source_file_sha256,
      'source_line',word.line_no,
      'source_reference',word.source_reference,
      'source_lexical_id',word.source_lexical_id,
      'review_level','source_validated','generated_by_ai',false
    ),
    word.display_word_index,1,'word',null,
    word.occurrence_transliteration,word.source_gloss_es,null,
    word.punctuation_after,false,false,
    case when word.is_base then 'base' else 'variant' end,
    case when word.is_base then null else lower(p_book_code)||'-'||word.chapter||'-'||word.verse||'-'||word.source_index||'-variant' end,
    jsonb_strip_nulls(jsonb_build_object(
      'editions',to_jsonb(word.witnesses),'variant_note',word.variant_note,
      'raw_line_hash',word.line_hash,'source_word_link',word.source_word_link,
      'source_lexical_id',word.source_lexical_id,'generated_by_ai',false
    ))
  from tmp_tagnt_words word
  join tmp_tagnt_lexical lexical
    on lexical.strong_number=word.strong_number and lexical.lemma=word.lemma
  join public.biblical_lexical_entries entry
    on entry.source_id=v_source_id and entry.language='greek' and entry.lexical_id=lexical.lexical_id
  on conflict(book_code,chapter,verse,source_id,word_index,morpheme_index) do update set
    lexical_entry_id=excluded.lexical_entry_id,surface_form=excluded.surface_form,
    normalized_form=excluded.normalized_form,morphology_code=excluded.morphology_code,
    morphology_summary=excluded.morphology_summary,source_locator=excluded.source_locator,
    provider_version=excluded.provider_version,content_hash=excluded.content_hash,
    review_status='approved',enabled=true,
    approved_at=coalesce(public.biblical_word_occurrences.approved_at,excluded.approved_at),
    metadata=excluded.metadata,display_word_index=excluded.display_word_index,
    token_kind=excluded.token_kind,word_group_key=excluded.word_group_key,
    occurrence_transliteration=excluded.occurrence_transliteration,
    occurrence_gloss_es=excluded.occurrence_gloss_es,
    punctuation_before=excluded.punctuation_before,punctuation_after=excluded.punctuation_after,
    joins_previous=excluded.joins_previous,joins_next=excluded.joins_next,
    textual_status=excluded.textual_status,variant_group_key=excluded.variant_group_key,
    witness_data=excluded.witness_data,updated_at=now();

  insert into public.biblical_verse_texts(
    source_id,book_code,chapter,verse,language,original_text,normalized_text,
    transliteration,literal_translation_es,text_direction,token_count,
    analysis_status,source_locator,provider_version,content_hash,
    review_status,enabled,approved_at,metadata
  )
  select
    v_source_id,p_book_code,chapter,verse,'greek',
    string_agg(surface_full,' ' order by source_index,line_no) filter(where is_base),
    lower(string_agg(surface_clean,' ' order by source_index,line_no) filter(where is_base)),
    string_agg(occurrence_transliteration,' ' order by source_index,line_no) filter(where is_base),
    string_agg(coalesce(source_gloss_es,source_gloss_en),' ' order by source_index,line_no) filter(where is_base),
    'ltr',count(*) filter(where is_base),'verified',
    p_source_url||'#L'||min(line_no)||'-L'||max(line_no),
    'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    encode(extensions.digest(convert_to(concat_ws('|','verse',p_book_code,chapter,verse,
      string_agg(surface_full,' ' order by source_index,line_no) filter(where is_base),
      string_agg(occurrence_transliteration,' ' order by source_index,line_no) filter(where is_base),
      base_edition,'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39'),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),
    jsonb_build_object(
      'source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'source_file_hash',p_source_file_sha256,'artifact_sha256',p_artifact_sha256,
      'source_lines',jsonb_build_array(min(line_no),max(line_no)),
      'base_edition',base_edition,'uses_fallback_edition',(base_edition<>'NA28'),
      'translation_kind','source_gloss_sequence','review_level','source_validated',
      'generated_by_ai',false
    )
  from tmp_tagnt_words group by chapter,verse,base_edition
  on conflict(source_id,book_code,chapter,verse,language) do update set
    original_text=excluded.original_text,normalized_text=excluded.normalized_text,
    transliteration=excluded.transliteration,literal_translation_es=excluded.literal_translation_es,
    text_direction=excluded.text_direction,token_count=excluded.token_count,
    analysis_status=excluded.analysis_status,source_locator=excluded.source_locator,
    provider_version=excluded.provider_version,content_hash=excluded.content_hash,
    review_status='approved',enabled=true,
    approved_at=coalesce(public.biblical_verse_texts.approved_at,excluded.approved_at),
    metadata=excluded.metadata,updated_at=now();

  insert into public.biblical_textual_variants(
    source_id,verse_text_id,variant_key,anchor_word_index,reading_type,
    base_reading,variant_reading,witness_summary,witnesses,editions,
    significance_es,source_locator,provider_version,content_hash,
    review_status,enabled,approved_at,metadata
  )
  select
    v_source_id,verse_text.id,
    lower(p_book_code)||'-'||word.chapter||'-'||word.verse||'-'||word.source_index||'-additional',
    word.source_index,
    case when exists(select 1 from tmp_tagnt_words base where base.chapter=word.chapter and base.verse=word.verse and base.source_index=word.source_index and base.is_base) then 'substitution' else 'addition' end,
    (select base.surface_clean from tmp_tagnt_words base where base.chapter=word.chapter and base.verse=word.verse and base.source_index=word.source_index and base.is_base limit 1),
    word.surface_clean,
    'STEPBible registra esta lectura en: '||array_to_string(word.witnesses,', ')||'.',
    '[]'::jsonb,to_jsonb(word.witnesses),null,
    p_source_url||'#L'||word.line_no,
    'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    encode(extensions.digest(convert_to(concat_ws('|','variant',p_book_code,word.chapter,word.verse,word.source_index,word.surface_clean,array_to_string(word.witnesses,','),word.line_hash,'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39'),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),
    jsonb_build_object(
      'source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'source_file_hash',p_source_file_sha256,'source_reference',word.source_reference,
      'source_line',word.line_no,'source_lexical_id',word.source_lexical_id,
      'review_level','source_validated','generated_by_ai',false
    )
  from tmp_tagnt_words word
  join public.biblical_verse_texts verse_text
    on verse_text.source_id=v_source_id and verse_text.book_code=p_book_code
   and verse_text.chapter=word.chapter and verse_text.verse=word.verse and verse_text.language='greek'
  where not word.is_base
  on conflict(source_id,verse_text_id,variant_key) do update set
    anchor_word_index=excluded.anchor_word_index,reading_type=excluded.reading_type,
    base_reading=excluded.base_reading,variant_reading=excluded.variant_reading,
    witness_summary=excluded.witness_summary,witnesses=excluded.witnesses,
    editions=excluded.editions,significance_es=excluded.significance_es,
    source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status='approved',enabled=true,
    approved_at=coalesce(public.biblical_textual_variants.approved_at,excluded.approved_at),
    metadata=excluded.metadata,updated_at=now();

  insert into public.biblical_textual_variants(
    source_id,verse_text_id,variant_key,anchor_word_index,reading_type,
    base_reading,variant_reading,witness_summary,witnesses,editions,
    significance_es,source_locator,provider_version,content_hash,
    review_status,enabled,approved_at,metadata
  )
  select
    v_source_id,verse_text.id,
    lower(p_book_code)||'-'||word.chapter||'-'||word.verse||'-'||word.source_index||'-noted',
    word.source_index,'orthographic',word.surface_clean,
    trim(trailing ';' from btrim(split_part(word.variant_note,':',2))),
    'STEPBible documenta una lectura alternativa en: '||replace(split_part(word.variant_note,':',1),'+',', ')||'.',
    '[]'::jsonb,to_jsonb(string_to_array(split_part(word.variant_note,':',1),'+')),
    null,p_source_url||'#L'||word.line_no,
    'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    encode(extensions.digest(convert_to(concat_ws('|','variant-note',p_book_code,word.chapter,word.verse,word.source_index,word.surface_clean,word.variant_note,word.line_hash,'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39'),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),
    jsonb_build_object(
      'source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'source_file_hash',p_source_file_sha256,'source_reference',word.source_reference,
      'source_line',word.line_no,'source_lexical_id',word.source_lexical_id,
      'automated_classification','orthographic','review_level','source_validated',
      'generated_by_ai',false
    )
  from tmp_tagnt_words word
  join public.biblical_verse_texts verse_text
    on verse_text.source_id=v_source_id and verse_text.book_code=p_book_code
   and verse_text.chapter=word.chapter and verse_text.verse=word.verse and verse_text.language='greek'
  where word.is_base and word.variant_note is not null
  on conflict(source_id,verse_text_id,variant_key) do update set
    anchor_word_index=excluded.anchor_word_index,reading_type=excluded.reading_type,
    base_reading=excluded.base_reading,variant_reading=excluded.variant_reading,
    witness_summary=excluded.witness_summary,witnesses=excluded.witnesses,
    editions=excluded.editions,significance_es=excluded.significance_es,
    source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status='approved',enabled=true,
    approved_at=coalesce(public.biblical_textual_variants.approved_at,excluded.approved_at),
    metadata=excluded.metadata,updated_at=now();

  select count(*) into v_verse_count from public.biblical_verse_texts
  where source_id=v_source_id and book_code=p_book_code and enabled and review_status='approved';

  select count(*) into v_documented_variants
  from public.biblical_textual_variants variant
  join public.biblical_verse_texts verse_text on verse_text.id=variant.verse_text_id
  where variant.source_id=v_source_id and verse_text.book_code=p_book_code
    and variant.enabled and variant.review_status='approved';

  select count(*) into v_bad_hashes
  from (
    select content_hash from public.biblical_verse_texts where source_id=v_source_id and book_code=p_book_code and enabled
    union all
    select content_hash from public.biblical_word_occurrences where source_id=v_source_id and book_code=p_book_code and enabled
    union all
    select variant.content_hash from public.biblical_textual_variants variant
      join public.biblical_verse_texts verse_text on verse_text.id=variant.verse_text_id
      where variant.source_id=v_source_id and verse_text.book_code=p_book_code and variant.enabled
  ) hashes where content_hash is null or content_hash !~ '^[0-9a-f]{64}$';

  if v_verse_count<>p_expected_references then
    raise exception '%: textos esperados %, obtenidos %',p_book_code,p_expected_references,v_verse_count;
  end if;
  if v_bad_hashes<>0 then raise exception '%: hashes inválidos %',p_book_code,v_bad_hashes; end if;

  insert into internal.biblical_textual_import_batches(
    source_id,dataset,book_code,source_commit,artifact_sha256,
    source_reference_count,base_word_count,variant_row_count,total_row_count,
    import_status,imported_verse_count,imported_occurrence_count,
    imported_variant_count,error_message,metadata,updated_at
  )
  values(
    v_source_id,'TAGNT Act-Rev',p_book_code,
    'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',p_artifact_sha256,
    p_expected_references,p_expected_base_words,p_expected_variant_rows,
    p_expected_base_words+p_expected_variant_rows,'imported',
    v_verse_count,v_total_count,v_documented_variants,null,
    jsonb_build_object(
      'step_code',p_step_code,'download_sha256',v_download_hash,
      'source_url',p_source_url,'base_words',v_base_count,
      'variant_rows',v_variant_count,'documented_variants',v_documented_variants,
      'generated_by_ai',false
    ),now()
  )
  on conflict(source_id,dataset,book_code,source_commit) do update set
    artifact_sha256=excluded.artifact_sha256,
    source_reference_count=excluded.source_reference_count,
    base_word_count=excluded.base_word_count,variant_row_count=excluded.variant_row_count,
    total_row_count=excluded.total_row_count,import_status='imported',
    imported_verse_count=excluded.imported_verse_count,
    imported_occurrence_count=excluded.imported_occurrence_count,
    imported_variant_count=excluded.imported_variant_count,error_message=null,
    metadata=excluded.metadata,updated_at=now();

  return jsonb_build_object(
    'book_code',p_book_code,'references',v_reference_count,
    'base_words',v_base_count,'variant_rows',v_variant_count,
    'occurrences',v_total_count,'documented_variants',v_documented_variants,
    'download_sha256',v_download_hash
  );
end
$function$;

revoke all on function internal.import_stepbible_tagnt_book(
  text,text,integer,integer,integer,text,text,text
) from public,anon,authenticated;
