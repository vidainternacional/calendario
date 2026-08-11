-- FASE D — Cobertura Bíblica Integral
-- TAHOT contiene 116 referencias Psa.x.0 correspondientes a superscripciones hebreas.
-- Se conservan como referencia fuente deshabilitada; no aparecen como versículos canónicos.
-- No modifica RLS.

alter table public.biblical_verse_texts
  drop constraint if exists biblical_verse_texts_reference_values;
alter table public.biblical_verse_texts
  add constraint biblical_verse_texts_reference_values
  check (chapter > 0 and verse >= 0 and (token_count is null or token_count >= 0));

alter table public.biblical_word_occurrences
  drop constraint if exists biblical_word_occurrences_reference_values;
alter table public.biblical_word_occurrences
  add constraint biblical_word_occurrences_reference_values
  check (chapter > 0 and verse >= 0 and word_index > 0);

do $patch$
declare
  v_definition text;
begin
  select pg_get_functiondef('internal.import_stepbible_tahot_core_v4(text,text[])'::regprocedure) into v_definition;

  v_definition := replace(
    v_definition,
    '''approved'', true, now(), NULL::uuid, jsonb_build_object(''dataset'', v_dataset, ''source_commit'', v_source_commit, ''source_file_sha256'', v_expected_sha, ''source_line'', c.source_line',
    '''approved'', (c.verse > 0), now(), NULL::uuid, jsonb_build_object(''dataset'', v_dataset, ''source_commit'', v_source_commit, ''source_file_sha256'', v_expected_sha, ''source_line'', c.source_line, ''source_superscription'', c.verse = 0'
  );
  v_definition := replace(
    v_definition,
    '''approved'', true, now(), NULL::uuid, jsonb_build_object(''dataset'', v_dataset, ''source_commit'', v_source_commit, ''source_file_sha256'', v_expected_sha, ''segment_order'', t.segment_order',
    '''approved'', (t.verse > 0), now(), NULL::uuid, jsonb_build_object(''dataset'', v_dataset, ''source_commit'', v_source_commit, ''source_file_sha256'', v_expected_sha, ''source_superscription'', t.verse = 0, ''segment_order'', t.segment_order'
  );
  v_definition := replace(v_definition, 'tahot-core-v4.1', 'tahot-core-v4.2');
  v_definition := replace(v_definition, 'tahot-occurrence-v4.1', 'tahot-occurrence-v4.2');
  v_definition := replace(v_definition, 'tahot-verse-v4.1', 'tahot-verse-v4.2');
  v_definition := replace(v_definition, 'tahot-direct-core-v4.1', 'tahot-direct-core-v4.2');
  execute v_definition;

  select pg_get_functiondef('internal.import_stepbible_tahot_variants_v3(text,text[])'::regprocedure) into v_definition;
  v_definition := replace(
    v_definition,
    '''approved'', true, now(), NULL::uuid, jsonb_build_object(''dataset'', v_dataset',
    '''approved'', (v.verse > 0), now(), NULL::uuid, jsonb_build_object(''dataset'', v_dataset, ''source_superscription'', v.verse = 0'
  );
  v_definition := replace(v_definition, 'tahot-variants-v3', 'tahot-variants-v3.1');
  execute v_definition;
end
$patch$;
