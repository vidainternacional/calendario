-- FASE D / Bloque 5 — recuperación exclusiva del paquete Daniel TAHOT v2.
-- Ejecutar solo si se necesita revertir el paquete fijado.

do $recovery$
declare
  v_source_id uuid;
  v_package_sha text := '7ca58a1c4804c23ffd6803ccb30321147a5d7f80e7a0d6255c0796163b74c582';
  v_payload_sha text := '383c4bd74c83fd5d4f2dac7fdfae9401152be6cfc6aef195e3b677ef2fbe4691';
begin
  select id into v_source_id
  from public.biblical_sources
  where slug='stepbible-lexical-pilot';
  if v_source_id is null then raise exception 'Fuente STEPBible no encontrada'; end if;

  delete from public.biblical_textual_variants variant
  using public.biblical_verse_texts verse
  where variant.verse_text_id=verse.id
    and variant.source_id=v_source_id
    and verse.source_id=v_source_id
    and verse.book_code='DAN'
    and variant.metadata->>'package_sha256'=v_package_sha
    and variant.metadata->>'payload_sha256'=v_payload_sha;

  delete from public.biblical_word_occurrences
  where source_id=v_source_id and book_code='DAN'
    and metadata->>'package_sha256'=v_package_sha
    and metadata->>'payload_sha256'=v_payload_sha;

  delete from public.biblical_verse_texts
  where source_id=v_source_id and book_code='DAN'
    and metadata->>'package_sha256'=v_package_sha
    and metadata->>'payload_sha256'=v_payload_sha;

  delete from internal.biblical_textual_import_batches
  where source_id=v_source_id and book_code='DAN'
    and artifact_sha256=v_package_sha
    and metadata->>'payload_sha256'=v_payload_sha;

  -- Solo elimina entradas creadas por Daniel que ya no son compartidas por otros libros.
  delete from public.biblical_lexical_entries lexical
  where lexical.source_id=v_source_id
    and lexical.metadata->>'package_sha256'=v_package_sha
    and lexical.metadata->>'payload_sha256'=v_payload_sha
    and not exists (
      select 1 from public.biblical_word_occurrences occurrence
      where occurrence.lexical_entry_id=lexical.id
    );

  update public.biblical_sources
  set metadata=jsonb_set(
        coalesce(metadata,'{}'::jsonb),
        '{tahot_packages}',
        coalesce(metadata->'tahot_packages','{}'::jsonb) - 'DAN',
        true
      ),
      updated_at=now()
  where id=v_source_id;

  if exists(select 1 from public.biblical_verse_texts where source_id=v_source_id and book_code='DAN')
     or exists(select 1 from public.biblical_word_occurrences where source_id=v_source_id and book_code='DAN')
     or exists(
       select 1 from public.biblical_textual_variants variant
       join public.biblical_verse_texts verse on verse.id=variant.verse_text_id
       where variant.source_id=v_source_id and verse.book_code='DAN'
     ) then
    raise exception 'La recuperación de Daniel dejó filas textuales residuales';
  end if;
end
$recovery$;
