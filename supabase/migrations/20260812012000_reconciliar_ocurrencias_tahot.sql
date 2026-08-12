-- FASE D — Cobertura Bíblica Integral
-- Reconciliación final del corpus TAHOT:
-- 1) recupera dos raíces Qere reales situadas después de puntuación (paseq);
-- 2) elimina tres ocurrencias obsoletas del piloto de Salmos 23:1 ya sustituidas por el corpus completo.
-- No modifica RLS ni inventa contenido.

do $reconcile$
declare
  v_source_id uuid;
  v_deleted integer := 0;
  v_processed integer := 0;
  v_rowcount integer := 0;
begin
  select id into v_source_id
  from public.biblical_sources
  where slug='stepbible-lexical-pilot'
    and enabled and review_status='approved' and license_status='verified';

  if v_source_id is null then
    raise exception 'Fuente STEPBible aprobada no encontrada';
  end if;

  -- El piloto antiguo de Salmos 23:1 dejó tres ocurrencias desplazadas.
  if (
    select count(*)
    from public.biblical_word_occurrences o
    where o.source_id=v_source_id and o.book_code='PSA' and o.chapter=23 and o.verse=1
      and o.word_index in (4,5,6)
      and o.metadata->>'review_level'='source_validated'
      and not (o.metadata ? 'direct_import_version')
      and o.metadata->>'source_commit'='b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39'
  ) <> 3 then
    raise exception 'No se encontraron exactamente las 3 ocurrencias obsoletas esperadas de PSA 23:1';
  end if;

  delete from public.biblical_word_occurrences o
  where o.source_id=v_source_id and o.book_code='PSA' and o.chapter=23 and o.verse=1
    and o.word_index in (4,5,6)
    and o.metadata->>'review_level'='source_validated'
    and not (o.metadata ? 'direct_import_version')
    and o.metadata->>'source_commit'='b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39';
  get diagnostics v_deleted = row_count;

  -- 1 Crónicas 27:12#06=Q(K): después del paseq (׀),
  -- TAHOT continúa la lectura Qere con יְמִינִי / H3227B.
  insert into public.biblical_word_occurrences(
    source_id,lexical_entry_id,book_code,chapter,verse,word_index,
    surface_form,normalized_form,morphology_code,morphology_summary,
    source_locator,provider_version,content_hash,review_status,enabled,
    approved_at,approved_by,metadata,display_word_index,morpheme_index,
    token_kind,word_group_key,occurrence_transliteration,occurrence_gloss_es,
    punctuation_before,punctuation_after,joins_previous,joins_next,
    textual_status,variant_group_key,witness_data
  )
  select
    v_source_id,e.id,'1CH',27,12,6,
    'יְמִינִי','יְמִינִי','Ngmsa',null,
    'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Jos-Est%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt#L138269',
    'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    encode(extensions.digest(convert_to('tahot-post-punctuation-v1|1CH|27|12|6|3|H3227B|יְמִינִי|Ngmsa|138269','UTF8'),'sha256'),'hex'),
    'approved',true,now(),null,
    jsonb_build_object(
      'dataset','TAHOT Jos-Est','source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'source_file_sha256','195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775',
      'source_line',138269,'source_lemma','יְמִינִי','source_gloss_en','jaminite[s]',
      'post_punctuation_lexical_recovery',true,'punctuation_tag','H9015','punctuation_surface','׀',
      'generated_by_ai',false,'direct_import_version','tahot-core-v5.1'
    ),
    6,3,'word','1ch-27-12-06','ye.mi.ni',null,'׀',null,false,false,'base',null,
    jsonb_build_object('text_suffix','=Q(K)','source_textual_status','qere','language','hebrew')
  from public.biblical_lexical_entries e
  where e.source_id=v_source_id and e.language='hebrew' and e.lexical_id='H3227B'
  on conflict(book_code,chapter,verse,source_id,word_index,morpheme_index)
  do update set
    lexical_entry_id=excluded.lexical_entry_id,surface_form=excluded.surface_form,
    normalized_form=excluded.normalized_form,morphology_code=excluded.morphology_code,
    source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status=excluded.review_status,enabled=excluded.enabled,
    approved_at=excluded.approved_at,metadata=excluded.metadata,display_word_index=excluded.display_word_index,
    token_kind=excluded.token_kind,word_group_key=excluded.word_group_key,
    occurrence_transliteration=excluded.occurrence_transliteration,punctuation_before=excluded.punctuation_before,
    joins_previous=excluded.joins_previous,joins_next=excluded.joins_next,
    textual_status=excluded.textual_status,witness_data=excluded.witness_data,updated_at=now();
  get diagnostics v_rowcount = row_count;
  v_processed := v_processed + v_rowcount;

  -- Nehemías 2:13#17=Q(K): después del paseq (׀),
  -- la lectura Qere continúa con פְּרוּצִים / H6555.
  insert into public.biblical_word_occurrences(
    source_id,lexical_entry_id,book_code,chapter,verse,word_index,
    surface_form,normalized_form,morphology_code,morphology_summary,
    source_locator,provider_version,content_hash,review_status,enabled,
    approved_at,approved_by,metadata,display_word_index,morpheme_index,
    token_kind,word_group_key,occurrence_transliteration,occurrence_gloss_es,
    punctuation_before,punctuation_after,joins_previous,joins_next,
    textual_status,variant_group_key,witness_data
  )
  select
    v_source_id,e.id,'NEH',2,13,17,
    'פְּרוּצִים','פְּרוּצִים','Vqsmpa',null,
    'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Jos-Est%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt#L170046',
    'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    encode(extensions.digest(convert_to('tahot-post-punctuation-v1|NEH|2|13|17|2|H6555|פְּרוּצִים|Vqsmpa|170046','UTF8'),'sha256'),'hex'),
    'approved',true,now(),null,
    jsonb_build_object(
      'dataset','TAHOT Jos-Est','source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'source_file_sha256','195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775',
      'source_line',170046,'source_lemma','פָּרַץ','source_gloss_en','[were] broken down',
      'post_punctuation_lexical_recovery',true,'punctuation_tag','H9015','punctuation_surface','׀',
      'generated_by_ai',false,'direct_import_version','tahot-core-v5.1'
    ),
    17,2,'word','neh-2-13-17','fe.ru.tzim',null,'׀',null,false,false,'base',null,
    jsonb_build_object('text_suffix','=Q(K)','source_textual_status','qere','language','hebrew')
  from public.biblical_lexical_entries e
  where e.source_id=v_source_id and e.language='hebrew' and e.lexical_id='H6555'
  on conflict(book_code,chapter,verse,source_id,word_index,morpheme_index)
  do update set
    lexical_entry_id=excluded.lexical_entry_id,surface_form=excluded.surface_form,
    normalized_form=excluded.normalized_form,morphology_code=excluded.morphology_code,
    source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status=excluded.review_status,enabled=excluded.enabled,
    approved_at=excluded.approved_at,metadata=excluded.metadata,display_word_index=excluded.display_word_index,
    token_kind=excluded.token_kind,word_group_key=excluded.word_group_key,
    occurrence_transliteration=excluded.occurrence_transliteration,punctuation_before=excluded.punctuation_before,
    joins_previous=excluded.joins_previous,joins_next=excluded.joins_next,
    textual_status=excluded.textual_status,witness_data=excluded.witness_data,updated_at=now();
  get diagnostics v_rowcount = row_count;
  v_processed := v_processed + v_rowcount;

  if v_deleted <> 3 then
    raise exception 'Se esperaban 3 ocurrencias obsoletas eliminadas, se eliminaron %',v_deleted;
  end if;
  if v_processed <> 2 then
    raise exception 'Se esperaban 2 raíces Qere reconciliadas, se procesaron %',v_processed;
  end if;

  update internal.biblical_textual_import_batches b
  set metadata=b.metadata||jsonb_build_object('reconciliation','tahot-post-punctuation-v1','post_punctuation_lexical_recoveries',1),updated_at=now()
  where b.source_id=v_source_id and b.source_commit='b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39' and b.book_code in ('1CH','NEH');

  update internal.biblical_textual_import_batches b
  set metadata=b.metadata||jsonb_build_object('reconciliation','psa23-pilot-cleanup-v1','legacy_occurrences_removed',3),updated_at=now()
  where b.source_id=v_source_id and b.source_commit='b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39' and b.book_code='PSA';
end
$reconcile$;
