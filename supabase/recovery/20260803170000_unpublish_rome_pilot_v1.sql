-- FASE D · Bloque 5
-- RECUPERACIÓN OPERATIVA — NO EJECUTAR SIN AUTORIZACIÓN POSTERIOR
-- Revierte exclusivamente las seis filas fijadas mientras continúen aprobadas y habilitadas.

begin;

do $$
declare
  affected integer;
begin
  if (select count(*) from public.biblical_places where slug = 'roma' and content_hash = '768fa98567a49be10e85ae29f748eea8a48fba471a56fbeb1b461f492cdd55ee' and review_status = 'approved' and enabled = true) <> 1 then
    raise exception 'Lugar Roma no coincide con el estado publicado fijado';
  end if;

  if (select count(*) from public.biblical_timeline_periods where slug = 'roma-romanos-hechos-28' and content_hash = '968637654ac8aefa36ebb849b10a47b6e1ec62ec1b1aa56d66e35aa126e09a54' and review_status = 'approved' and enabled = true) <> 1 then
    raise exception 'Periodo Roma no coincide con el estado publicado fijado';
  end if;

  if (select count(*) from public.biblical_timeline_events where slug in ('roma-destinatarios-romanos','pablo-llega-a-roma-hechos-28') and review_status = 'approved' and enabled = true and ((slug = 'roma-destinatarios-romanos' and content_hash = '0ad8cbe5c8e4499022298e7446432f44892ed3dbad9a2514d209ff38b97d36c6') or (slug = 'pablo-llega-a-roma-hechos-28' and content_hash = '1c97d3f44fc5453830ee09e8910b2519519adc9a1f6f4c6f4cf6fb57d101cd2d'))) <> 2 then
    raise exception 'Eventos de Roma no coinciden con el estado publicado fijado';
  end if;

  if (select count(*) from public.biblical_timeline_event_places ep join public.biblical_timeline_events e on e.id = ep.event_id join public.biblical_places p on p.id = ep.place_id where p.slug = 'roma' and ep.review_status = 'approved' and ep.enabled = true and ((e.slug = 'roma-destinatarios-romanos' and ep.relation_type = 'associated' and ep.content_hash = 'c57f6ac09b54472138e6e7bd58919e204a8041c909ba7f4671894591ca4e6c1c') or (e.slug = 'pablo-llega-a-roma-hechos-28' and ep.relation_type = 'destination' and ep.content_hash = '232666a1732c67ccef35f1ead5eda59d2399b234b1e25ff60ff279973e42b87f'))) <> 2 then
    raise exception 'Relaciones de Roma no coinciden con el estado publicado fijado';
  end if;

  update public.biblical_timeline_event_places ep set review_status = 'pending', enabled = false from public.biblical_timeline_events e, public.biblical_places p where ep.event_id = e.id and ep.place_id = p.id and p.slug = 'roma' and ((e.slug = 'roma-destinatarios-romanos' and ep.relation_type = 'associated' and ep.content_hash = 'c57f6ac09b54472138e6e7bd58919e204a8041c909ba7f4671894591ca4e6c1c') or (e.slug = 'pablo-llega-a-roma-hechos-28' and ep.relation_type = 'destination' and ep.content_hash = '232666a1732c67ccef35f1ead5eda59d2399b234b1e25ff60ff279973e42b87f'));
  get diagnostics affected = row_count;
  if affected <> 2 then raise exception 'Se esperaban revertir 2 relaciones, se revirtieron %', affected; end if;

  update public.biblical_timeline_events set review_status = 'pending', enabled = false where (slug = 'roma-destinatarios-romanos' and content_hash = '0ad8cbe5c8e4499022298e7446432f44892ed3dbad9a2514d209ff38b97d36c6') or (slug = 'pablo-llega-a-roma-hechos-28' and content_hash = '1c97d3f44fc5453830ee09e8910b2519519adc9a1f6f4c6f4cf6fb57d101cd2d');
  get diagnostics affected = row_count;
  if affected <> 2 then raise exception 'Se esperaban revertir 2 eventos, se revirtieron %', affected; end if;

  update public.biblical_timeline_periods set review_status = 'pending', enabled = false where slug = 'roma-romanos-hechos-28' and content_hash = '968637654ac8aefa36ebb849b10a47b6e1ec62ec1b1aa56d66e35aa126e09a54';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Se esperaba revertir 1 periodo, se revirtieron %', affected; end if;

  update public.biblical_places set review_status = 'pending', enabled = false where slug = 'roma' and content_hash = '768fa98567a49be10e85ae29f748eea8a48fba471a56fbeb1b461f492cdd55ee';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Se esperaba revertir 1 lugar, se revirtieron %', affected; end if;
end $$;
commit;
