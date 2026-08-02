-- FASE D · Bloque 4
-- El importador identifica el archivo TAGNT correcto a partir de la URL fijada.
do $fix$
declare
  body text;
begin
  select p.prosrc into body
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='internal'
    and p.proname='import_stepbible_tagnt_book'
    and pg_get_function_identity_arguments(p.oid)=
      'p_step_code text, p_book_code text, p_expected_references integer, p_expected_base_words integer, p_expected_variant_rows integer, p_artifact_sha256 text, p_source_url text, p_source_file_sha256 text';

  if body is null then
    raise exception 'No se encontró el importador TAGNT';
  end if;

  if position('v_dataset text;' in body)=0 then
    body := replace(
      body,
      '  v_bad_hashes integer;',
      '  v_bad_hashes integer;'||E'\n'||'  v_dataset text;'
    );
  end if;

  if position('v_dataset := case' in body)=0 then
    body := replace(
      body,
      '  drop table if exists pg_temp.tmp_tagnt_words;',
      '  v_dataset := case'||E'\n'||
      '    when p_source_url like ''%TAGNT%20Mat-Jhn%'' then ''TAGNT Mat-Jhn'''||E'\n'||
      '    when p_source_url like ''%TAGNT%20Act-Rev%'' then ''TAGNT Act-Rev'''||E'\n'||
      '    else null'||E'\n'||
      '  end;'||E'\n\n'||
      '  if v_dataset is null then'||E'\n'||
      '    raise exception ''URL TAGNT no reconocida para %: %'', p_book_code, p_source_url;'||E'\n'||
      '  end if;'||E'\n\n'||
      '  drop table if exists pg_temp.tmp_tagnt_words;'
    );
  end if;

  if position('v_source_id,''TAGNT Act-Rev'',p_book_code' in body)>0 then
    body := replace(
      body,
      'v_source_id,''TAGNT Act-Rev'',p_book_code',
      'v_source_id,v_dataset,p_book_code'
    );
  end if;

  if position('v_source_id,v_dataset,p_book_code' in body)=0 then
    raise exception 'No se pudo actualizar el dataset del registro de lotes';
  end if;

  execute format(
    'create or replace function internal.import_stepbible_tagnt_book(
      p_step_code text,
      p_book_code text,
      p_expected_references integer,
      p_expected_base_words integer,
      p_expected_variant_rows integer,
      p_artifact_sha256 text,
      p_source_url text,
      p_source_file_sha256 text
    ) returns jsonb language plpgsql security definer set search_path=public,extensions,internal,pg_temp as %L',
    body
  );
end
$fix$;

revoke all on function internal.import_stepbible_tagnt_book(
  text,text,integer,integer,integer,text,text,text
) from public,anon,authenticated;
