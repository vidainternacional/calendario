-- FASE D · Bloque 4
-- BORRADOR NO ACTIVO. Vive fuera de supabase/migrations y no se aplica a producción.

create or replace function internal.import_stepbible_tahot_payload(
  p_payload jsonb,
  p_source_files jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, internal, pg_temp
as $function$
declare
  v_source_id uuid;
  v_book_code text;
  v_step_code text;
  v_dataset text;
  v_source_commit text;
  v_source_sha256 text;
  v_package_sha256 text;
  v_payload_sha256 text;
  v_provider_version text;
  v_reference_count integer;
  v_visible_word_count integer;
  v_occurrence_count integer;
  v_lexical_count integer;
  v_variant_row_count integer;
  v_variant_count integer;
  v_bad_hashes integer;
begin
  if jsonb_typeof(p_payload) <> 'object'
     or p_payload->>'schema_version' <> 'vida-tahot-import-payload-v1'
     or jsonb_typeof(p_source_files) <> 'object' then
    raise exception 'Payload TAHOT inválido';
  end if;
  if coalesce((p_payload->>'spanish_editorial_fields_complete')::boolean,true) then
    raise exception 'El payload piloto debe mantener incompleta la capa editorial española';
  end if;

  v_book_code := p_payload#>>'{book,internal_code}';
  v_step_code := p_payload#>>'{book,step_code}';
  v_source_commit := p_payload#>>'{source,commit}';
  v_source_sha256 := p_payload#>>'{source,sha256}';
  v_package_sha256 := p_payload->>'package_sha256';
  v_payload_sha256 := p_payload->>'payload_sha256';
  v_provider_version := 'STEPBible-Data@'||v_source_commit;
  v_dataset := case v_source_sha256
    when 'f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5' then 'TAHOT Isa-Mal'
    when '84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5' then 'TAHOT Job-Sng'
    when '195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775' then 'TAHOT Jos-Est'
    when 'e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b' then 'TAHOT Gen-Deu'
  end;

  if v_book_code !~ '^[A-Z0-9]{2,8}$'
     or v_step_code !~ '^[123]?[A-Za-z]{2,3}$'
     or v_source_commit !~ '^[0-9a-f]{40}$'
     or v_source_sha256 !~ '^[0-9a-f]{64}$'
     or v_package_sha256 !~ '^[0-9a-f]{64}$'
     or v_payload_sha256 !~ '^[0-9a-f]{64}$'
     or v_dataset is null then
    raise exception 'Identidad del payload TAHOT inválida';
  end if;

  select id into v_source_id
  from public.biblical_sources
  where slug='stepbible-lexical-pilot' and enabled and review_status='approved';
  if v_source_id is null then
    raise exception 'Fuente STEPBible aprobada no encontrada';
  end if;
  if not exists(select 1 from public.biblical_books where code=v_book_code and enabled and review_status='approved') then
    raise exception 'Libro aprobado no encontrado: %',v_book_code;
  end if;
  if exists(
    select 1 from internal.biblical_textual_import_batches
    where source_id=v_source_id and dataset=v_dataset and book_code=v_book_code
      and source_commit=v_source_commit and artifact_sha256<>v_package_sha256
  ) then
    raise exception 'Existe un lote diferente para %',v_book_code;
  end if;

  v_reference_count := (p_payload#>>'{counts,references}')::integer;
  v_visible_word_count := (p_payload#>>'{counts,visible_words}')::integer;
  v_occurrence_count := (p_payload#>>'{counts,occurrences}')::integer;
  v_lexical_count := (p_payload#>>'{counts,lexical_ids}')::integer;
  v_variant_row_count := (p_payload#>>'{counts,source_variant_rows}')::integer;
  v_variant_count := (p_payload#>>'{counts,variants}')::integer;

  if jsonb_array_length(p_payload->'verse_texts')<>v_reference_count
     or jsonb_array_length(p_payload->'occurrences')<>v_occurrence_count
     or jsonb_array_length(p_payload->'lexical_entries')<>v_lexical_count
     or jsonb_array_length(p_payload->'variants')<>v_variant_count then
    raise exception 'Conteos internos del payload no coinciden';
  end if;
  if v_reference_count<>21 or v_visible_word_count<>291 or v_occurrence_count<>434
     or v_lexical_count<>184 or v_variant_row_count<>2 or v_variant_count<>3 then
    raise exception 'Conteos piloto de Obadías inesperados';
  end if;

  if exists(
    select 1 from jsonb_array_elements(p_payload->'lexical_entries') entry
    where entry->>'language' not in ('hebrew','aramaic')
       or entry->>'lexical_id' !~ '^H[0-9]{4}[A-Z]?$'
       or entry->>'strong_number' !~ '^H[0-9]{4}$'
       or coalesce(entry->>'lemma','')=''
       or entry->>'content_hash' !~ '^[0-9a-f]{64}$'
  ) then raise exception 'Entradas léxicas inválidas'; end if;

  if exists(
    select 1 from jsonb_array_elements(p_payload->'occurrences') occurrence
    where occurrence->>'content_hash' !~ '^[0-9a-f]{64}$'
       or occurrence->>'source_line_sha256' !~ '^[0-9a-f]{64}$'
       or occurrence->>'token_kind' not in ('word','prefix','suffix')
       or (occurrence->>'word_index')::integer<=0
       or (occurrence->>'display_word_index')::integer<=0
       or (occurrence->>'morpheme_index')::integer<=0
  ) then raise exception 'Ocurrencias inválidas'; end if;

  if exists(
    select 1 from jsonb_array_elements(p_payload->'verse_texts') verse
    where verse->>'language' not in ('hebrew','aramaic')
       or coalesce(verse->>'original_text','')=''
       or verse->>'content_hash' !~ '^[0-9a-f]{64}$'
  ) then raise exception 'Textos de versículo inválidos'; end if;

  if exists(
    select 1 from jsonb_array_elements(p_payload->'variants') variant
    where variant->>'reading_type' not in ('substitution','addition','omission','transposition','orthographic')
       or variant->>'content_hash' !~ '^[0-9a-f]{64}$'
  ) then raise exception 'Variantes inválidas'; end if;

  insert into public.biblical_lexical_entries(
    source_id,language,lexical_id,strong_number,lemma,transliteration,
    part_of_speech,source_gloss,display_gloss_es,display_gloss_kind,
    definition,source_locator,provider_version,content_hash,
    review_status,enabled,approved_at,metadata
  )
  select
    v_source_id,entry->>'language',entry->>'lexical_id',entry->>'strong_number',
    entry->>'lemma',null,nullif(entry->>'part_of_speech',''),nullif(entry->>'source_gloss',''),
    null,'editorial_translation',null,entry->>'source_locator',v_provider_version,
    entry->>'content_hash','approved',true,now(),
    jsonb_build_object(
      'dataset',v_dataset,'package_sha256',v_package_sha256,'payload_sha256',v_payload_sha256,
      'source_commit',v_source_commit,'source_file_sha256',v_source_sha256,
      'source_lemma',entry->>'source_lemma','canonical_lemma_policy',entry->>'lemma_policy',
      'source_gloss_language','en','spanish_editorial_fields_complete',false,
      'generated_by_ai',false
    )
  from jsonb_array_elements(p_payload->'lexical_entries') entry
  where not exists(
    select 1 from public.biblical_lexical_entries existing
    where existing.source_id=v_source_id and existing.language=entry->>'language'
      and existing.lexical_id=entry->>'lexical_id'
  )
  on conflict(source_id,language,lexical_id) do nothing;

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
    v_source_id,lexical.id,v_book_code,(occurrence->>'chapter')::smallint,
    (occurrence->>'verse')::smallint,(occurrence->>'word_index')::smallint,
    occurrence->>'surface_form',occurrence->>'surface_form',nullif(occurrence->>'morphology_code',''),null,
    occurrence->>'source_locator',v_provider_version,occurrence->>'content_hash',
    'approved',true,now(),
    jsonb_build_object(
      'dataset',v_dataset,'package_sha256',v_package_sha256,'payload_sha256',v_payload_sha256,
      'source_index_raw',occurrence->>'source_index_raw','source_line',(occurrence->>'source_line')::integer,
      'source_line_sha256',occurrence->>'source_line_sha256','source_gloss_en',occurrence->>'source_gloss_en',
      'source_lemma',occurrence->>'source_lemma','spanish_editorial_fields_complete',false,
      'generated_by_ai',false
    ),
    (occurrence->>'display_word_index')::smallint,(occurrence->>'morpheme_index')::smallint,
    occurrence->>'token_kind',lower(v_book_code)||'-'||(occurrence->>'chapter')||'-'||
      (occurrence->>'verse')||'-'||(occurrence->>'source_index_raw'),
    nullif(occurrence->>'transliteration',''),null,null,nullif(occurrence->>'punctuation_after',''),
    (occurrence->>'joins_previous')::boolean,(occurrence->>'joins_next')::boolean,
    'base',null,jsonb_build_object('text_suffix',occurrence->>'text_suffix','textual_status',occurrence->>'textual_status')
  from jsonb_array_elements(p_payload->'occurrences') occurrence
  join public.biblical_lexical_entries lexical
    on lexical.source_id=v_source_id and lexical.language='hebrew'
   and lexical.lexical_id=occurrence->>'lexical_id'
  on conflict(book_code,chapter,verse,source_id,word_index,morpheme_index) do nothing;

  insert into public.biblical_verse_texts(
    source_id,book_code,chapter,verse,language,original_text,normalized_text,
    transliteration,literal_translation_es,text_direction,token_count,
    analysis_status,source_locator,provider_version,content_hash,
    review_status,enabled,approved_at,metadata
  )
  select
    v_source_id,v_book_code,(verse->>'chapter')::smallint,(verse->>'verse')::smallint,
    verse->>'language',verse->>'original_text',null,nullif(verse->>'transliteration',''),null,
    case when verse->>'language' in ('hebrew','aramaic') then 'rtl' else 'ltr' end,
    (verse->>'token_count')::smallint,'verified',verse->>'source_locator',v_provider_version,
    verse->>'content_hash','approved',true,now(),
    jsonb_build_object(
      'dataset',v_dataset,'package_sha256',v_package_sha256,'payload_sha256',v_payload_sha256,
      'source_gloss_sequence_en',verse->>'source_gloss_sequence_en',
      'source_content_hash',verse->>'source_content_hash',
      'literal_translation_es_status','not_reviewed',
      'spanish_editorial_fields_complete',false,'generated_by_ai',false
    )
  from jsonb_array_elements(p_payload->'verse_texts') verse
  on conflict(source_id,book_code,chapter,verse,language) do nothing;

  insert into public.biblical_textual_variants(
    source_id,verse_text_id,variant_key,anchor_word_index,reading_type,
    base_reading,variant_reading,witness_summary,witnesses,editions,
    significance_es,source_locator,provider_version,content_hash,
    review_status,enabled,approved_at,metadata
  )
  select
    v_source_id,text.id,variant->>'variant_key',(variant->>'anchor_word_index')::smallint,
    variant->>'reading_type',nullif(variant->>'base_reading',''),nullif(variant->>'variant_reading',''),
    nullif(variant->>'witness_summary',''),coalesce(variant->'witnesses','[]'::jsonb),'[]'::jsonb,
    null,variant->>'source_locator',v_provider_version,variant->>'content_hash',
    'approved',true,now(),
    jsonb_build_object(
      'dataset',v_dataset,'package_sha256',v_package_sha256,'payload_sha256',v_payload_sha256,
      'source_line_sha256',variant->>'source_line_sha256',
      'significance_es_status','not_reviewed','generated_by_ai',false
    )
  from jsonb_array_elements(p_payload->'variants') variant
  join public.biblical_verse_texts text
    on text.source_id=v_source_id and text.book_code=v_book_code
   and text.chapter=(variant->>'chapter')::smallint and text.verse=(variant->>'verse')::smallint
   and text.language='hebrew'
  on conflict(source_id,verse_text_id,variant_key) do nothing;

  update public.biblical_sources
  set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
        'source_commit',v_source_commit,'source_files',p_source_files,
        'tahot_packages',coalesce(metadata->'tahot_packages','{}'::jsonb)||
          jsonb_build_object(v_book_code,jsonb_build_object(
            'artifact_sha256',v_package_sha256,'payload_sha256',v_payload_sha256,
            'source_file_sha256',v_source_sha256,'references',v_reference_count,
            'visible_words',v_visible_word_count,'occurrences',v_occurrence_count,
            'variants',v_variant_count
          ))
      ),
      content_hash=encode(extensions.digest(convert_to(concat_ws('|',
        'stepbible-textual-source',v_source_commit,p_source_files::text
      ),'UTF8'),'sha256'),'hex'),updated_at=now()
  where id=v_source_id;

  insert into internal.biblical_textual_import_batches(
    source_id,dataset,book_code,source_commit,artifact_sha256,
    source_reference_count,base_word_count,variant_row_count,total_row_count,
    import_status,imported_verse_count,imported_occurrence_count,
    imported_variant_count,metadata,updated_at
  ) values(
    v_source_id,v_dataset,v_book_code,v_source_commit,v_package_sha256,
    v_reference_count,v_visible_word_count,v_variant_row_count,v_visible_word_count,
    'imported',v_reference_count,v_occurrence_count,v_variant_count,
    jsonb_build_object(
      'step_code',v_step_code,'source_url',p_payload#>>'{source,url}',
      'source_file_sha256',v_source_sha256,'payload_sha256',v_payload_sha256,
      'lexical_ids',v_lexical_count,'generated_by_ai',false
    ),now()
  )
  on conflict(source_id,dataset,book_code,source_commit) do update set
    import_status='imported',artifact_sha256=excluded.artifact_sha256,
    source_reference_count=excluded.source_reference_count,
    base_word_count=excluded.base_word_count,variant_row_count=excluded.variant_row_count,
    total_row_count=excluded.total_row_count,
    imported_verse_count=excluded.imported_verse_count,
    imported_occurrence_count=excluded.imported_occurrence_count,
    imported_variant_count=excluded.imported_variant_count,error_message=null,
    metadata=excluded.metadata,updated_at=now();

  select count(*) into v_bad_hashes from (
    select content_hash from public.biblical_lexical_entries where source_id=v_source_id
    union all select content_hash from public.biblical_word_occurrences where source_id=v_source_id and book_code=v_book_code
    union all select content_hash from public.biblical_verse_texts where source_id=v_source_id and book_code=v_book_code
    union all select variant.content_hash from public.biblical_textual_variants variant
      join public.biblical_verse_texts text on text.id=variant.verse_text_id
      where variant.source_id=v_source_id and text.book_code=v_book_code
  ) hashes where content_hash is not null and content_hash !~ '^[0-9a-f]{64}$';

  if (select count(*) from public.biblical_verse_texts where source_id=v_source_id and book_code=v_book_code)<>v_reference_count
     or (select count(*) from public.biblical_word_occurrences where source_id=v_source_id and book_code=v_book_code)<>v_occurrence_count
     or (select count(*) from public.biblical_textual_variants variant join public.biblical_verse_texts text on text.id=variant.verse_text_id where variant.source_id=v_source_id and text.book_code=v_book_code)<>v_variant_count
     or v_bad_hashes<>0 then
    raise exception 'Validación posterior a la importación falló para %',v_book_code;
  end if;

  return jsonb_build_object(
    'book_code',v_book_code,'dataset',v_dataset,'package_sha256',v_package_sha256,
    'payload_sha256',v_payload_sha256,'references',v_reference_count,
    'visible_words',v_visible_word_count,'occurrences',v_occurrence_count,
    'lexical_ids',v_lexical_count,'source_variant_rows',v_variant_row_count,
    'variants',v_variant_count,'bad_hashes',v_bad_hashes,'idempotent',true
  );
end
$function$;

revoke all on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  to service_role;
