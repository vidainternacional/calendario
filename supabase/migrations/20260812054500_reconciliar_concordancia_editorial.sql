-- FASE D — Reconciliación de procedencia de concordancias editoriales.
--
-- Hallazgo de auditoría:
-- 34 términos y 174 ocurrencias con source_locator `editorial-*` estaban asociados al
-- catálogo Open Cross References aunque ese source declara content_imported=false.
-- Esta migración separa la autoría editorial de VIDA, conserva el hash heredado en
-- metadata y normaliza todos los hashes de contenido a SHA-256 determinista.
-- No cambia términos, referencias, relevancias, alias, review_status ni visibilidad.

do $block$
declare
  v_old_source uuid;
  v_new_source uuid;
  v_term_count integer;
  v_occ_count integer;
  v_manifest_hash text;
begin
  select id into v_old_source
  from public.biblical_sources
  where slug='open-cross-ref';

  if v_old_source is null then
    raise exception 'Source open-cross-ref no encontrado';
  end if;

  select count(*) into v_term_count
  from public.biblical_concordance_terms
  where source_id=v_old_source;

  select count(*) into v_occ_count
  from public.biblical_concordance_occurrences
  where source_id=v_old_source;

  if v_term_count<>34 or v_occ_count<>174 then
    raise exception 'Conteos editoriales inesperados bajo open-cross-ref: terms %, occurrences %',v_term_count,v_occ_count;
  end if;

  if exists(
    select 1 from public.biblical_concordance_terms
    where source_id=v_old_source and source_locator not like 'editorial-%'
  ) or exists(
    select 1 from public.biblical_concordance_occurrences
    where source_id=v_old_source and source_locator not like 'editorial-%'
  ) then
    raise exception 'Open Cross References contiene filas no editoriales; abortando separación automática';
  end if;

  insert into public.biblical_sources(
    slug,name,source_type,language,website,license_url,license_notes,license_status,
    provider,provider_ref,provider_version,content_hash,attribution,review_status,enabled,
    metadata,approved_at
  ) values(
    'vida-concordancia-editorial',
    'VIDA — Concordancia editorial revisada',
    'cross_reference',
    'spa',
    null,
    null,
    'Contenido editorial propio de VIDA Internacional. Las relaciones no reproducen texto bíblico protegido; remiten a referencias y temas revisados.',
    'verified',
    'Vida Internacional',
    'editorial-concordance',
    'concordance-rich-v1-2026-08-02',
    null,
    'Vida Internacional — concordancia temática editorial revisada.',
    'approved',
    true,
    jsonb_build_object(
      'editorial_review',true,
      'contains_verse_text',false,
      'generated_by_ai',false,
      'source_split_from','open-cross-ref',
      'hash_algorithm','sha256',
      'hash_policy','Canonical semantic fields per term/occurrence; manifest is SHA-256 of sorted row hashes.',
      'provenance_reason','Rows were editorial but historically attached to the Open Cross References catalog source.'
    ),
    now()
  )
  on conflict(slug) do update set
    name=excluded.name,
    source_type=excluded.source_type,
    language=excluded.language,
    license_notes=excluded.license_notes,
    license_status=excluded.license_status,
    provider=excluded.provider,
    provider_ref=excluded.provider_ref,
    provider_version=excluded.provider_version,
    attribution=excluded.attribution,
    review_status=excluded.review_status,
    enabled=excluded.enabled,
    metadata=excluded.metadata,
    approved_at=coalesce(public.biblical_sources.approved_at,excluded.approved_at),
    updated_at=now()
  returning id into v_new_source;

  update public.biblical_concordance_terms t
  set source_id=v_new_source,
      content_hash=encode(extensions.digest(convert_to(concat_ws(E'\x1f',
        'vida-concordance-term-v1',
        coalesce(t.canonical_term,''),
        coalesce(t.normalized_term,''),
        coalesce(t.language,''),
        coalesce(t.description,''),
        coalesce(t.source_locator,''),
        coalesce(t.provider_version,'')
      ),'UTF8'),'sha256'),'hex'),
      metadata=coalesce(t.metadata,'{}'::jsonb) || jsonb_build_object(
        'legacy_source_slug','open-cross-ref',
        'legacy_content_hash',t.content_hash,
        'content_hash_algorithm','sha256',
        'content_hash_basis','vida-concordance-term-v1 semantic fields',
        'provenance_reconciled',true,
        'generated_by_ai',coalesce((t.metadata->>'generated_by_ai')::boolean,false)
      ),
      updated_at=now()
  where t.source_id=v_old_source;

  update public.biblical_concordance_occurrences o
  set source_id=v_new_source,
      content_hash=encode(extensions.digest(convert_to(concat_ws(E'\x1f',
        'vida-concordance-occurrence-v1',
        coalesce(t.normalized_term,''),
        coalesce(o.book_code,''),
        o.chapter::text,
        o.verse::text,
        coalesce(o.reference_label,''),
        coalesce(o.verse_excerpt,''),
        o.relevance::text,
        coalesce(o.relation_kind,''),
        coalesce(o.source_locator,''),
        coalesce(o.provider_version,'')
      ),'UTF8'),'sha256'),'hex'),
      metadata=coalesce(o.metadata,'{}'::jsonb) || jsonb_build_object(
        'legacy_source_slug','open-cross-ref',
        'legacy_content_hash',o.content_hash,
        'content_hash_algorithm','sha256',
        'content_hash_basis','vida-concordance-occurrence-v1 semantic fields',
        'provenance_reconciled',true,
        'generated_by_ai',false
      ),
      updated_at=now()
  from public.biblical_concordance_terms t
  where o.term_id=t.id
    and o.source_id=v_old_source;

  if (select count(*) from public.biblical_concordance_terms where source_id=v_new_source)<>34 then
    raise exception 'Conteo final de términos editoriales inesperado';
  end if;
  if (select count(*) from public.biblical_concordance_occurrences where source_id=v_new_source)<>174 then
    raise exception 'Conteo final de ocurrencias editoriales inesperado';
  end if;
  if exists(select 1 from public.biblical_concordance_terms where source_id=v_new_source and content_hash !~ '^[0-9a-f]{64}$') then
    raise exception 'Persisten hashes no SHA-256 en términos editoriales';
  end if;
  if exists(select 1 from public.biblical_concordance_occurrences where source_id=v_new_source and content_hash !~ '^[0-9a-f]{64}$') then
    raise exception 'Persisten hashes no SHA-256 en ocurrencias editoriales';
  end if;
  if exists(select 1 from public.biblical_concordance_terms where source_id=v_old_source)
     or exists(select 1 from public.biblical_concordance_occurrences where source_id=v_old_source) then
    raise exception 'Persisten filas editoriales atribuidas a open-cross-ref';
  end if;

  select encode(extensions.digest(convert_to(string_agg(item,'|' order by item),'UTF8'),'sha256'),'hex')
  into v_manifest_hash
  from (
    select 'term:'||content_hash as item
    from public.biblical_concordance_terms where source_id=v_new_source
    union all
    select 'occurrence:'||content_hash as item
    from public.biblical_concordance_occurrences where source_id=v_new_source
  ) manifest;

  update public.biblical_sources
  set content_hash=v_manifest_hash,
      metadata=metadata || jsonb_build_object(
        'terms',34,
        'occurrences',174,
        'manifest_sha256',v_manifest_hash,
        'provenance_reconciled_at',now()
      ),
      updated_at=now()
  where id=v_new_source;

  update public.biblical_sources
  set metadata=metadata || jsonb_build_object(
        'content_imported',false,
        'editorial_rows_reassigned_to','vida-concordancia-editorial',
        'editorial_rows_reassigned_terms',34,
        'editorial_rows_reassigned_occurrences',174,
        'editorial_rows_reassigned_at',now()
      ),
      updated_at=now()
  where id=v_old_source;
end
$block$;
