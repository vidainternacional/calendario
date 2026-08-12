-- FASE D — staging temporal para transferir el payload TAHOT validado de Daniel.
-- Solo service_role puede cargar/finalizar. Se elimina después de la importación auditada.

create table if not exists internal.tahot_payload_stage (
  run_id uuid not null,
  section text not null,
  chunk_index integer not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (run_id, section, chunk_index),
  constraint tahot_payload_stage_section_check
    check (section in ('verse_texts','lexical_entries','occurrences','variants')),
  constraint tahot_payload_stage_chunk_check check (chunk_index >= 0),
  constraint tahot_payload_stage_data_array check (jsonb_typeof(data) = 'array')
);

revoke all on table internal.tahot_payload_stage from public;
revoke all on table internal.tahot_payload_stage from anon;
revoke all on table internal.tahot_payload_stage from authenticated;
grant select, insert, update, delete on table internal.tahot_payload_stage to service_role;

create or replace function public.stage_tahot_payload_chunk(
  p_run_id uuid,
  p_section text,
  p_chunk_index integer,
  p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $function$
declare
  v_items integer;
begin
  if p_run_id is null
     or p_section not in ('verse_texts','lexical_entries','occurrences','variants')
     or p_chunk_index < 0
     or jsonb_typeof(p_data) <> 'array' then
    raise exception 'Chunk TAHOT inválido';
  end if;

  v_items := jsonb_array_length(p_data);
  if v_items <= 0 or v_items > 1000 then
    raise exception 'Tamaño de chunk TAHOT fuera de rango: %', v_items;
  end if;

  insert into internal.tahot_payload_stage(run_id, section, chunk_index, data)
  values (p_run_id, p_section, p_chunk_index, p_data)
  on conflict(run_id, section, chunk_index) do update
    set data = excluded.data,
        created_at = now();

  return jsonb_build_object(
    'run_id', p_run_id,
    'section', p_section,
    'chunk_index', p_chunk_index,
    'items', v_items
  );
end
$function$;

revoke all on function public.stage_tahot_payload_chunk(uuid,text,integer,jsonb) from public;
revoke all on function public.stage_tahot_payload_chunk(uuid,text,integer,jsonb) from anon;
revoke all on function public.stage_tahot_payload_chunk(uuid,text,integer,jsonb) from authenticated;
grant execute on function public.stage_tahot_payload_chunk(uuid,text,integer,jsonb) to service_role;

create or replace function public.finalize_tahot_daniel_import(
  p_run_id uuid,
  p_meta jsonb,
  p_source_files jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $function$
declare
  v_verse_texts jsonb;
  v_lexical_entries jsonb;
  v_occurrences jsonb;
  v_variants jsonb;
  v_payload jsonb;
  v_result jsonb;
  v_chunk_count integer;
begin
  if p_run_id is null or jsonb_typeof(p_meta) <> 'object' or jsonb_typeof(p_source_files) <> 'object' then
    raise exception 'Finalización TAHOT inválida';
  end if;

  select coalesce(jsonb_agg(e.value order by s.chunk_index, e.ordinality), '[]'::jsonb)
  into v_verse_texts
  from internal.tahot_payload_stage s
  cross join lateral jsonb_array_elements(s.data) with ordinality e(value, ordinality)
  where s.run_id = p_run_id and s.section = 'verse_texts';

  select coalesce(jsonb_agg(e.value order by s.chunk_index, e.ordinality), '[]'::jsonb)
  into v_lexical_entries
  from internal.tahot_payload_stage s
  cross join lateral jsonb_array_elements(s.data) with ordinality e(value, ordinality)
  where s.run_id = p_run_id and s.section = 'lexical_entries';

  select coalesce(jsonb_agg(e.value order by s.chunk_index, e.ordinality), '[]'::jsonb)
  into v_occurrences
  from internal.tahot_payload_stage s
  cross join lateral jsonb_array_elements(s.data) with ordinality e(value, ordinality)
  where s.run_id = p_run_id and s.section = 'occurrences';

  select coalesce(jsonb_agg(e.value order by s.chunk_index, e.ordinality), '[]'::jsonb)
  into v_variants
  from internal.tahot_payload_stage s
  cross join lateral jsonb_array_elements(s.data) with ordinality e(value, ordinality)
  where s.run_id = p_run_id and s.section = 'variants';

  if jsonb_array_length(v_verse_texts) <> coalesce((p_meta#>>'{counts,verse_text_segments}')::integer, -1)
     or jsonb_array_length(v_lexical_entries) <> coalesce((p_meta#>>'{counts,lexical_keys}')::integer, -1)
     or jsonb_array_length(v_occurrences) <> coalesce((p_meta#>>'{counts,occurrences}')::integer, -1)
     or jsonb_array_length(v_variants) <> coalesce((p_meta#>>'{counts,variants}')::integer, -1) then
    raise exception 'Staging Daniel incompleto: verse_texts %, lexical %, occurrences %, variants %',
      jsonb_array_length(v_verse_texts),
      jsonb_array_length(v_lexical_entries),
      jsonb_array_length(v_occurrences),
      jsonb_array_length(v_variants);
  end if;

  v_payload := p_meta || jsonb_build_object(
    'verse_texts', v_verse_texts,
    'lexical_entries', v_lexical_entries,
    'occurrences', v_occurrences,
    'variants', v_variants
  );

  v_result := internal.import_stepbible_tahot_payload_v2(v_payload, p_source_files);

  select count(*) into v_chunk_count
  from internal.tahot_payload_stage
  where run_id = p_run_id;

  delete from internal.tahot_payload_stage where run_id = p_run_id;

  return v_result || jsonb_build_object(
    'run_id', p_run_id,
    'staged_chunks', v_chunk_count,
    'stage_cleaned', true
  );
end
$function$;

revoke all on function public.finalize_tahot_daniel_import(uuid,jsonb,jsonb) from public;
revoke all on function public.finalize_tahot_daniel_import(uuid,jsonb,jsonb) from anon;
revoke all on function public.finalize_tahot_daniel_import(uuid,jsonb,jsonb) from authenticated;
grant execute on function public.finalize_tahot_daniel_import(uuid,jsonb,jsonb) to service_role;

create or replace function public.clear_tahot_payload_stage(p_run_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $function$
declare
  v_deleted integer;
begin
  delete from internal.tahot_payload_stage where run_id = p_run_id;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end
$function$;

revoke all on function public.clear_tahot_payload_stage(uuid) from public;
revoke all on function public.clear_tahot_payload_stage(uuid) from anon;
revoke all on function public.clear_tahot_payload_stage(uuid) from authenticated;
grant execute on function public.clear_tahot_payload_stage(uuid) to service_role;
