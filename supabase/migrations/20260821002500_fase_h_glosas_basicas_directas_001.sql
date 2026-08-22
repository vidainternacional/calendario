insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,
  display_gloss_es,
  alternative_glosses_es,
  confidence,
  derivation_method,
  source_gloss_snapshot,
  status,
  provenance
)
values
  ('a86bf6de-1447-4b40-af18-61840b730a77','carecer',array[]::text[],99,'manual_editorial_source_gloss_exact_v3','I lack','manual_approved',jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_basic_direct_001_20260820','lexical_id','H2637','strong_number','H2637','source_identity','STEPBible TAHOT','source_identity_license','CC BY 4.0','context_used_as_meaning',false)),
  ('60e028da-acf1-4c81-be69-6ea83116dc19','mi',array[]::text[],99,'manual_editorial_source_gloss_exact_v3','my','manual_approved',jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_basic_direct_001_20260820','lexical_id','H9020','strong_number','H9020','source_identity','STEPBible TAHOT','source_identity_license','CC BY 4.0','context_used_as_meaning',false)),
  ('424b26b4-4abf-4cf7-87f6-6cbb4ab60b64','no',array[]::text[],99,'manual_editorial_source_gloss_exact_v3','not','manual_approved',jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_basic_direct_001_20260820','lexical_id','H3808','strong_number','H3808','source_identity','STEPBible TAHOT','source_identity_license','CC BY 4.0','context_used_as_meaning',false)),
  ('6a290762-3c39-45a6-9bda-725aff8e7947','pastorear',array['apacentar']::text[],99,'manual_editorial_source_gloss_exact_v3','to pasture','manual_approved',jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_basic_direct_001_20260820','lexical_id','H7462B','strong_number','H7462','source_identity','STEPBible TAHOT','source_identity_license','CC BY 4.0','context_used_as_meaning',false)),
  ('50eba73c-b4f0-4319-b91b-0f4a95dfaeb8','Yahvé',array['YHWH']::text[],99,'manual_editorial_source_gloss_exact_v3','Yahweh','manual_approved',jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_basic_direct_001_20260820','lexical_id','H3068G','strong_number','H3068','source_identity','STEPBible TAHOT','source_identity_license','CC BY 4.0','context_used_as_meaning',false))
on conflict (lexical_entry_id) do nothing;
