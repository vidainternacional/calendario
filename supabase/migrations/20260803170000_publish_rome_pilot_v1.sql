-- FASE D · Bloque 5
-- MIGRACIÓN ACTIVA REVISABLE — NO APLICAR SIN AUTORIZACIÓN POSTERIOR
-- Publica exclusivamente las seis filas fijadas de rome-pilot-v1.

begin;

do $$
declare
  affected integer;
begin
  if (select count(*) from public.biblical_places where slug = 'roma' and content_hash = '768fa98567a49be10e85ae29f748eea8a48fba471a56fbeb1b461f492cdd55ee' and review_status = 'pending' and enabled = false) <> 1 then
    raise exception 'Lugar Roma no coincide con el estado previo fijado';
  end if;

  if (select count(*) from public.biblical_timeline_periods where slug = 'roma-romanos-hechos-28' and content_hash = '968637654ac8aefa36ebb849b10a47b6e1ec62ec1b1aa56d66e35aa126e09a54' and review_status = 'pending' and enabled = false) <> 1 then
    raise exception 'Periodo Roma no coincide con el estado previo fijado';
  end if;

  if (select count(*) from public.biblical_timeline_events where slug in ('roma-destinatarios-romanos','pablo-llega-a-roma-hechos-28') and review_status = 'pending' and enabled = false and ((slug = 'roma-destinatarios-romanos' and content_hash = '0ad8cbe5c8e4499022298e7446432f44892ed3dbad9a2514d209ff38b97d36c6') or (slug = 'pablo-llega-a-roma-hechos-28' and content_hash = '1c97d3f44fc5453830ee09e8910b2519519adc9a1f6f4c6f4cf6fb57d101cd2d'))) <> 2 then
    raise exception 'Eventos de Roma no coinciden con el estado previo fijado';
  end if;

  if (select count(*) from public.biblical_timeline_event_places ep join public.biblical_timeline_events e on e.id = ep.event_id join public.biblical_places p on p.id = ep.place_id where p.slug = 'roma' and ep.review_status = 'pending' and ep.enabled = false and ((e.slug = 'roma-destinatarios-romanos' and ep.relation_type = 'associated' and ep.content_hash = 'c57f6ac09b54472138e6e7bd58919e204a8041c909ba7f4671894591ca4e6c1c') or (e.slug = 'pablo-llega-a-roma-hechos-28' and ep.relation_type = 'destination' and ep.content_hash = '232666a1732c67ccef35f1ead5eda59d2399b234b1e25ff60ff279973e42b87f'))) <> 2 then
    raise exception 'Relaciones de Roma no coinciden con el estado previo fijado';
  end if;

  update public.biblical_places set review_status = 'approved', enabled = true where slug = 'roma' and content_hash = '768fa98567a49be10e85ae29f748eea8a48fba471a56fbeb1b461f492cdd55ee';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Se esperaba publicar 1 lugar, se publicaron %', affected; end if;

  update public.biblical_timeline_periods set review_status = 'approved', enabled = true where slug = 'roma-romanos-hechos-28' and content_hash = '968637654ac8aefa36ebb849b10a47b6e1ec62ec1b1aa56d66e35aa126e09a54';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Se esperaba publicar 1 periodo, se publicaron %', affected; end if;

  update public.biblical_timeline_events set review_status = 'approved', enabled = true where (slug = 'roma-destinatarios-romanos' and content_hash = '0ad8cbe5c8e4499022298e7446432f44892ed3dbad9a2514d209ff38b97d36c6') or (slug = 'pablo-llega-a-roma-hechos-28' and content_hash = '1c97d3f44fc5453830ee09e8910b2519519adc9a1f6f4c6f4cf6fb57d101cd2d');
  get diagnostics affected = row_count;
  if affected <> 2 then raise exception 'Se esperaban publicar 2 eventos, se publicaron %', affected; end if;

  update public.biblical_timeline_event_places ep set review_status = 'approved', enabled = true from public.biblical_timeline_events e, public.biblical_places p where ep.event_id = e.id and ep.place_id = p.id and p.slug = 'roma' and ((e.slug = 'roma-destinatarios-romanos' and ep.relation_type = 'associated' and ep.content_hash = 'c57f6ac09b54472138e6e7bd58919e204a8041c909ba7f4671894591ca4e6c1c') or (e.slug = 'pablo-llega-a-roma-hechos-28' and ep.relation_type = 'destination' and ep.content_hash = '232666a1732c67ccef35f1ead5eda59d2399b234b1e25ff60ff279973e42b87f'));
  get diagnostics affected = row_count;
  if affected <> 2 then raise exception 'Se esperaban publicar 2 relaciones, se publicaron %', affected; end if;
end $$;
commit;
