-- FASE D · Bloque 4 · Importador interno para lotes editoriales del corpus
create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

create or replace function internal.import_biblical_context_batch(
  p_batch text,
  p_version text,
  p_books jsonb,
  p_sections jsonb
) returns void
language plpgsql
security invoker
set search_path = public, extensions, pg_temp
as $$
declare
  v_source_id uuid;
  b jsonb;
  s jsonb;
  v_slug text;
  v_book_code text;
  v_book_name text;
  v_historical text;
  v_jewish text;
  v_literary text;
begin
  select id into v_source_id
  from public.biblical_sources
  where slug='vida-contexto-editorial' and enabled and review_status='approved';

  if v_source_id is null then
    raise exception 'Fuente editorial aprobada no disponible';
  end if;

  update public.biblical_sources
  set provider_version=p_version,
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
        'generated_by_ai',true,
        'editorial_method','ai-assisted-contextual-synthesis',
        'latest_batch',p_batch
      ),
      updated_at=now()
  where id=v_source_id;

  for b in select value from jsonb_array_elements(p_books)
  loop
    v_book_code:=b->>'code';
    v_slug:=b->>'slug'||'-perfil';

    insert into public.biblical_context_units(
      slug,book_code,source_id,scope_kind,chapter_start,verse_start,chapter_end,verse_end,
      title,summary,historical_context,jewish_context,literary_context,authorial_intent,
      theological_reflection,interpretive_cautions,key_terms,people_groups,places,
      source_locator,provider_version,content_hash,review_status,enabled,metadata
    ) values (
      v_slug,v_book_code,v_source_id,'book',1,null,(b->>'chapters')::smallint,null,
      b->>'name'||': perfil histórico y literario',b->>'summary',b->>'historical',
      b->>'jewish',b->>'literary',b->>'intent',b->>'reflection',b->>'cautions',
      array(select jsonb_array_elements_text(coalesce(b->'terms','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(b->'groups','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(b->'places','[]'::jsonb))),
      'vida://corpus/contexto/'||p_batch||'/v1#'||v_slug,p_version,
      encode(extensions.digest(concat_ws('|',v_slug,b->>'summary',b->>'historical',b->>'jewish',b->>'literary',b->>'intent',b->>'reflection',b->>'cautions'),'sha256'),'hex'),
      'approved',true,jsonb_build_object('coverage_batch',p_batch,'generated_by_ai',true,'review_level','project-editorial')
    )
    on conflict(slug) do update set
      book_code=excluded.book_code,source_id=excluded.source_id,scope_kind=excluded.scope_kind,
      chapter_start=excluded.chapter_start,verse_start=excluded.verse_start,
      chapter_end=excluded.chapter_end,verse_end=excluded.verse_end,title=excluded.title,
      summary=excluded.summary,historical_context=excluded.historical_context,
      jewish_context=excluded.jewish_context,literary_context=excluded.literary_context,
      authorial_intent=excluded.authorial_intent,theological_reflection=excluded.theological_reflection,
      interpretive_cautions=excluded.interpretive_cautions,key_terms=excluded.key_terms,
      people_groups=excluded.people_groups,places=excluded.places,source_locator=excluded.source_locator,
      provider_version=excluded.provider_version,content_hash=excluded.content_hash,
      review_status='approved',enabled=true,metadata=excluded.metadata,updated_at=now();

    update public.biblical_books
    set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
      'coverage_status','context_ready','coverage_batch',p_batch,'coverage_version',p_version
    ),updated_at=now()
    where code=v_book_code;
  end loop;

  for s in select value from jsonb_array_elements(p_sections)
  loop
    select name_es into v_book_name from public.biblical_books where code=s->>'code';
    select historical_context,jewish_context,literary_context
      into v_historical,v_jewish,v_literary
    from public.biblical_context_units
    where book_code=s->>'code' and scope_kind='book' and enabled and review_status='approved'
    order by updated_at desc limit 1;

    v_slug:=coalesce(nullif(s->>'slug',''),lower(regexp_replace(v_book_name,'[^a-zA-Z0-9]+','-','g'))||'-'||s->>'start'||'-'||s->>'end');
    v_slug:=trim(both '-' from translate(lower(v_slug),'áéíóúüñ','aeiouun'));

    insert into public.biblical_context_units(
      slug,book_code,source_id,scope_kind,chapter_start,verse_start,chapter_end,verse_end,
      title,summary,historical_context,jewish_context,literary_context,authorial_intent,
      theological_reflection,interpretive_cautions,key_terms,people_groups,places,
      source_locator,provider_version,content_hash,review_status,enabled,metadata
    ) values (
      v_slug,s->>'code',v_source_id,'section',(s->>'start')::smallint,null,(s->>'end')::smallint,null,
      s->>'title',s->>'summary',
      'Esta unidad se desarrolla dentro del marco histórico general de '||v_book_name||' y concentra los capítulos '||s->>'start'||'–'||s->>'end'||'. '||v_historical,
      'En la lectura judía y canónica, esta sección participa de la recepción de '||v_book_name||'. '||v_jewish,
      'La sección cumple una función definida dentro de la composición de '||v_book_name||'. '||v_literary,
      s->>'intent',
      coalesce(nullif(s->>'reflection',''),(select theological_reflection from public.biblical_context_units where book_code=s->>'code' and scope_kind='book' and enabled and review_status='approved' order by updated_at desc limit 1)),
      s->>'cautions',
      array(select jsonb_array_elements_text(coalesce(s->'terms','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(s->'groups','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(s->'places','[]'::jsonb))),
      'vida://corpus/contexto/'||p_batch||'/v1#'||v_slug,p_version,
      encode(extensions.digest(concat_ws('|',v_slug,s->>'title',s->>'summary',v_historical,v_jewish,v_literary,s->>'intent',s->>'reflection',s->>'cautions'),'sha256'),'hex'),
      'approved',true,jsonb_build_object('coverage_batch',p_batch,'generated_by_ai',true,'review_level','project-editorial')
    )
    on conflict(slug) do update set
      book_code=excluded.book_code,source_id=excluded.source_id,scope_kind=excluded.scope_kind,
      chapter_start=excluded.chapter_start,verse_start=excluded.verse_start,
      chapter_end=excluded.chapter_end,verse_end=excluded.verse_end,title=excluded.title,
      summary=excluded.summary,historical_context=excluded.historical_context,
      jewish_context=excluded.jewish_context,literary_context=excluded.literary_context,
      authorial_intent=excluded.authorial_intent,theological_reflection=excluded.theological_reflection,
      interpretive_cautions=excluded.interpretive_cautions,key_terms=excluded.key_terms,
      people_groups=excluded.people_groups,places=excluded.places,source_locator=excluded.source_locator,
      provider_version=excluded.provider_version,content_hash=excluded.content_hash,
      review_status='approved',enabled=true,metadata=excluded.metadata,updated_at=now();
  end loop;
end;
$$;

revoke all on function internal.import_biblical_context_batch(text,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function internal.import_biblical_context_batch(text,text,jsonb,jsonb) to postgres, service_role;
