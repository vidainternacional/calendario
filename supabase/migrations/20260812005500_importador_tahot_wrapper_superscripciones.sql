-- FASE D — Cobertura Bíblica Integral
-- Wrapper explícito: ejecuta el core validado y oculta Psa.x.0 como superscripciones fuente.
-- Evita depender de parches textuales sobre el cuerpo PL/pgSQL.
-- No modifica RLS.

create or replace function internal.import_stepbible_tahot_core_v5(
  p_source_key text,
  p_book_codes text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, internal, pg_temp
as $function$
declare
  v_result jsonb;
  v_source_id uuid;
  v_superscription_texts integer := 0;
  v_superscription_occurrences integer := 0;
begin
  v_result := internal.import_stepbible_tahot_core_v4(p_source_key,p_book_codes);
  select id into v_source_id from public.biblical_sources where slug='stepbible-lexical-pilot';

  if p_source_key='tahot-job-sng' and (p_book_codes is null or 'PSA'=any(p_book_codes)) then
    update public.biblical_verse_texts
    set enabled=false,
        metadata=metadata||jsonb_build_object('source_superscription',true,'canonical_reference_visible',false,'superscription_policy','source-verse-zero-v1'),
        updated_at=now()
    where source_id=v_source_id and book_code='PSA' and verse=0;
    get diagnostics v_superscription_texts = row_count;

    update public.biblical_word_occurrences
    set enabled=false,
        metadata=metadata||jsonb_build_object('source_superscription',true,'canonical_reference_visible',false,'superscription_policy','source-verse-zero-v1'),
        updated_at=now()
    where source_id=v_source_id and book_code='PSA' and verse=0;
    get diagnostics v_superscription_occurrences = row_count;

    update internal.biblical_textual_import_batches
    set metadata=metadata||jsonb_build_object('superscription_policy','source-verse-zero-v1','superscription_reference_count',v_superscription_texts),updated_at=now()
    where source_id=v_source_id and dataset='TAHOT Job-Sng' and book_code='PSA'
      and source_commit='b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39';
  end if;

  return v_result||jsonb_build_object('core_version','tahot-core-v5','superscription_texts',v_superscription_texts,'superscription_occurrences',v_superscription_occurrences);
end
$function$;

create or replace function internal.import_stepbible_tahot_variants_v4(
  p_source_key text,
  p_book_codes text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, internal, pg_temp
as $function$
declare
  v_result jsonb;
  v_source_id uuid;
  v_hidden integer := 0;
begin
  v_result := internal.import_stepbible_tahot_variants_v3(p_source_key,p_book_codes);
  select id into v_source_id from public.biblical_sources where slug='stepbible-lexical-pilot';

  if p_source_key='tahot-job-sng' and (p_book_codes is null or 'PSA'=any(p_book_codes)) then
    update public.biblical_textual_variants v
    set enabled=false,
        metadata=v.metadata||jsonb_build_object('source_superscription',true,'canonical_reference_visible',false,'superscription_policy','source-verse-zero-v1'),
        updated_at=now()
    from public.biblical_verse_texts t
    where v.verse_text_id=t.id and v.source_id=v_source_id and t.book_code='PSA' and t.verse=0;
    get diagnostics v_hidden = row_count;

    update internal.biblical_textual_import_batches
    set metadata=metadata||jsonb_build_object('superscription_variants_hidden',v_hidden,'variant_import_version','tahot-variants-v4'),updated_at=now()
    where source_id=v_source_id and dataset='TAHOT Job-Sng' and book_code='PSA'
      and source_commit='b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39';
  end if;

  return v_result||jsonb_build_object('variant_version','tahot-variants-v4','superscription_variants_hidden',v_hidden);
end
$function$;

revoke all on function internal.import_stepbible_tahot_core_v5(text,text[]) from public,anon,authenticated;
grant execute on function internal.import_stepbible_tahot_core_v5(text,text[]) to service_role;
revoke all on function internal.import_stepbible_tahot_variants_v4(text,text[]) from public,anon,authenticated;
grant execute on function internal.import_stepbible_tahot_variants_v4(text,text[]) to service_role;
