-- FASE D — Cobertura Bíblica Integral
-- Importa variantes TAHOT desde las fuentes fijadas, sobre textos core ya cargados.
-- Replica la política v2: Qere/Ketiv, ortográficas y significado.
-- No modifica RLS. Ejecución exclusiva de service_role.

create or replace function internal.import_stepbible_tahot_variants_v3(
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
    else raise exception 'Fuente TAHOT no autorizada: %',p_source_key;
  end case;

  select count(*) into v_selected_books from internal.tahot_book_catalog c
  where c.source_key=p_source_key and (p_book_codes is null or c.book_code=any(p_book_codes));
  if v_selected_books=0 then raise exception 'No hay libros seleccionados'; end if;
  if p_book_codes is not null and v_selected_books<>cardinality(p_book_codes) then raise exception 'Selección fuera de fuente'; end if;

  select id into v_source_id from public.biblical_sources
  where slug='stepbible-lexical-pilot' and enabled and review_status='approved' and license_status='verified';
  if v_source_id is null then raise exception 'Fuente STEPBible aprobada no encontrada'; end if;

  select h.status,h.content into v_status,v_content from extensions.http_get(v_url) h;
  if v_status<>200 or v_content is null then raise exception 'No se pudo recuperar %',p_source_key; end if;
  v_actual_sha:=encode(extensions.digest(v_content,'sha256'),'hex');
  if v_actual_sha<>v_expected_sha then raise exception 'SHA inesperado %',v_actual_sha; end if;

  drop table if exists pg_temp.tahot_variant_rows;
  drop table if exists pg_temp.tahot_variant_candidates;
  drop table if exists pg_temp.tahot_variants_parsed;

  create temporary table tahot_variant_rows on commit drop as
  with raw as (
    select l.ord::integer source_line,c.step_code,c.book_code,string_to_array(l.line,E'\t') fields,l.line source_line_text,
      regexp_match((string_to_array(l.line,E'\t'))[1],'^([123]?[A-Za-z]{2,3})\.([0-9]+)\.([0-9]+)[a-z]?(?:\([0-9]+\.[0-9]+[a-z]?\))?#([0-9]+)(=.+)$') m
    from regexp_split_to_table(v_content,E'\r?\n') with ordinality l(line,ord)
    join internal.tahot_book_catalog c on split_part(l.line,'.',1)=c.step_code and c.source_key=p_source_key
      and (p_book_codes is null or c.book_code=any(p_book_codes))
  ), parsed as (
    select *,
      (m[2])::smallint chapter,(m[3])::smallint verse,m[4] source_index_raw,m[5] text_suffix,
      m[5] like '=Q%' is_qere,
      case when fields[6] like 'H%' then 'hebrew' when fields[6] like 'A%' then 'aramaic' else 'none' end language,
      (m[5] like '=Q%' and fields[2]='' and fields[3]='[ ]' and fields[4]='[ ]' and fields[5]='' and fields[6]='' and fields[7] like 'K=%') is_placeholder,
      replace(split_part(fields[2],E'\\',1),'/','') surface_form,
      coalesce(fields[7],'') meaning_evidence,coalesce(fields[8],'') spelling_evidence,
      coalesce(fields[8],'') ~ '(^|;)\s*K\s*=' spelling_has_k,
      coalesce(fields[7],'') ~ '(^|;)\s*K\s*=' meaning_has_k,
      btrim(regexp_replace(coalesce(fields[8],''),'(^|;)\s*K\s*=[^;]*','\1','g'),' ;') spelling_without_k,
      encode(extensions.digest(source_line_text,'sha256'),'hex') source_line_sha256
    from raw where m is not null
  )
  select p.*,
    case when is_placeholder then null else
      sum(case when not is_placeholder then 1 else 0 end) over(partition by book_code,chapter,verse order by source_line rows unbounded preceding)::smallint
    end display_word_index
  from parsed p;

  select count(*) into v_bad from tahot_variant_rows
  where is_qere and spelling_has_k and not meaning_has_k and meaning_evidence<>'';
  if v_bad<>0 then raise exception 'Existen % colisiones Qere no representables',v_bad; end if;

  create temporary table tahot_variant_candidates on commit drop as
  select *, 'addition'::text reading_type,
    case when meaning_evidence ~ '(^|;)\s*K\s*=' then meaning_evidence else spelling_evidence end evidence,
    case when meaning_evidence ~ '(^|;)\s*K\s*=' then 'meaning' else 'spelling' end parse_mode,
    null::text base_reading,null::smallint anchor_word_index,'qere_omission'::text variant_origin
  from tahot_variant_rows where is_placeholder
  union all
  select *, 'orthographic',case when is_qere and spelling_has_k then spelling_without_k else spelling_evidence end,
    'spelling',surface_form,display_word_index,'spelling'
  from tahot_variant_rows
  where not is_placeholder and spelling_evidence<>'' and (not(is_qere and spelling_has_k) or spelling_without_k<>'')
  union all
  select *, 'substitution',meaning_evidence,'meaning',surface_form,display_word_index,'meaning'
  from tahot_variant_rows where not is_placeholder and meaning_evidence<>''
  union all
  select *, 'substitution',
    (select fragment from regexp_split_to_table(spelling_evidence,';') fragment where fragment ~ '^\s*K\s*=' limit 1),
    'spelling',surface_form,display_word_index,'ketiv_spelling'
  from tahot_variant_rows where not is_placeholder and is_qere and spelling_has_k and not meaning_has_k;

  create temporary table tahot_variants_parsed on commit drop as
  select c.*,
    lower(book_code)||'-'||chapter||'-'||verse||'-'||source_index_raw||text_suffix||'-'||reading_type variant_key,
    case when parse_mode='spelling' then
      btrim(replace(replace(split_part(split_part((select fragment from regexp_split_to_table(evidence,';') fragment where btrim(fragment)<>'' limit 1),'=',2),'¦',1),'/',''),E'\\',''))
    else
      (select btrim(replace(replace(mm[1],'/',''),E'\\','')) from regexp_matches(evidence,'\(([^()]*)\)','g') mm where mm[1] ~ '[א-ת]' limit 1)
    end variant_reading,
    coalesce((select jsonb_agg(code order by first_ord) from (
      select btrim(split_part(fragment,'=',1)) code,min(ord) first_ord
      from regexp_split_to_table(evidence,';') with ordinality f(fragment,ord)
      where strpos(fragment,'=')>0 and btrim(split_part(fragment,'=',1))<>''
      group by btrim(split_part(fragment,'=',1))
    ) q),'[]'::jsonb) witnesses
  from tahot_variant_candidates c;

  select count(*) into v_bad from tahot_variants_parsed where coalesce(variant_reading,'')='';
  if v_bad<>0 then raise exception 'No se pudo extraer lectura para % variantes',v_bad; end if;
  select count(*) into v_bad from (select book_code,variant_key,count(*) from tahot_variants_parsed group by book_code,variant_key having count(*)>1) q;
  if v_bad<>0 then raise exception 'Hay % claves de variante duplicadas',v_bad; end if;

  insert into public.biblical_textual_variants(
    source_id,verse_text_id,variant_key,anchor_word_index,reading_type,base_reading,variant_reading,
    witness_summary,witnesses,editions,significance_es,source_locator,provider_version,content_hash,
    review_status,enabled,approved_at,approved_by,metadata
  )
  select v_source_id,vt.id,v.variant_key,v.anchor_word_index,v.reading_type,v.base_reading,v.variant_reading,
    v.evidence,v.witnesses,'[]'::jsonb,null,v_url||'#L'||v.source_line,v_provider_version,
    encode(extensions.digest(convert_to(concat_ws('|','tahot-variant-v3',v_expected_sha,v.book_code,v.variant_key,coalesce(v.base_reading,''),v.variant_reading,v.evidence),'UTF8'),'sha256'),'hex'),
    'approved',true,now(),null,
    jsonb_build_object('dataset',v_dataset,'source_commit',v_source_commit,'source_file_sha256',v_expected_sha,
      'source_line',v.source_line,'source_line_sha256',v.source_line_sha256,'variant_origin',v.variant_origin,
      'language',case when v.language='none' then vt.language else v.language end,'generated_by_ai',false,
      'direct_import_version','tahot-variants-v3')
  from tahot_variants_parsed v
  join lateral (
    select t.* from public.biblical_verse_texts t
    where t.source_id=v_source_id and t.book_code=v.book_code and t.chapter=v.chapter and t.verse=v.verse
      and (v.language='none' or t.language=v.language)
    order by coalesce((t.metadata->>'segment_order')::integer,1),t.language limit 1
  ) vt on true
  on conflict(source_id,verse_text_id,variant_key) do update set
    anchor_word_index=excluded.anchor_word_index,reading_type=excluded.reading_type,base_reading=excluded.base_reading,
    variant_reading=excluded.variant_reading,witness_summary=excluded.witness_summary,witnesses=excluded.witnesses,
    editions=excluded.editions,source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status=excluded.review_status,enabled=excluded.enabled,
    approved_at=excluded.approved_at,metadata=excluded.metadata,updated_at=now();

  update internal.biblical_textual_import_batches b set
    import_status='imported',
    imported_variant_count=(select count(*) from public.biblical_textual_variants v join public.biblical_verse_texts t on t.id=v.verse_text_id where v.source_id=v_source_id and t.book_code=b.book_code and v.metadata->>'direct_import_version'='tahot-variants-v3'),
    metadata=b.metadata||jsonb_build_object('variants_pending',false,'variant_import_version','tahot-variants-v3'),updated_at=now()
  where b.source_id=v_source_id and b.dataset=v_dataset and b.source_commit=v_source_commit
    and (p_book_codes is null or b.book_code=any(p_book_codes));

  select jsonb_agg(jsonb_build_object(
    'book_code',x.book_code,'variants',x.variant_count,'orthographic',x.orthographic_count,
    'substitution',x.substitution_count,'addition',x.addition_count,'source_sha256',v_expected_sha
  ) order by (select canonical_order from public.biblical_books bb where bb.code=x.book_code)) into v_summary
  from (
    select book_code,count(*) variant_count,count(*) filter(where reading_type='orthographic') orthographic_count,
      count(*) filter(where reading_type='substitution') substitution_count,count(*) filter(where reading_type='addition') addition_count
    from tahot_variants_parsed group by book_code
  ) x;

  return jsonb_build_object('source_key',p_source_key,'dataset',v_dataset,'source_sha256',v_expected_sha,'books',coalesce(v_summary,'[]'::jsonb),'variant_version','tahot-variants-v3');
end
$function$;

revoke all on function internal.import_stepbible_tahot_variants_v3(text,text[]) from public;
revoke all on function internal.import_stepbible_tahot_variants_v3(text,text[]) from anon;
revoke all on function internal.import_stepbible_tahot_variants_v3(text,text[]) from authenticated;
grant execute on function internal.import_stepbible_tahot_variants_v3(text,text[]) to service_role;
