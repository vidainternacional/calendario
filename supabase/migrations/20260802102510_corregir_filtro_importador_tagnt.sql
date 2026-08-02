-- FASE D · Bloque 4
-- Corrige el filtro de referencia duplicado por escapes durante el transporte del SQL.
do $fix$
declare
  body text;
  start_position integer;
  relative_end integer;
begin
  select p.prosrc into body
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='internal'
    and p.proname='import_stepbible_tagnt_book'
    and pg_get_function_identity_arguments(p.oid)=
      'p_step_code text, p_book_code text, p_expected_references integer, p_expected_base_words integer, p_expected_variant_rows integer, p_artifact_sha256 text, p_source_url text, p_source_file_sha256 text';

  if body is null then
    raise exception 'No se encontró el importador TAGNT que debe corregirse';
  end if;

  start_position := position('and f[1] ~' in body);
  relative_end := position(E'\n  )\n  select' in substring(body from start_position));

  if start_position=0 or relative_end=0 then
    raise exception 'No se encontró el fragmento del filtro TAGNT';
  end if;

  body := overlay(
    body
    placing 'and f[1] like p_step_code||''.%#%'''
    from start_position
    for relative_end-1
  );

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
