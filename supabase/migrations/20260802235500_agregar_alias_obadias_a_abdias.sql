-- FASE D · Bloque 4
-- Permite resolver las denominaciones Obadías/Obadias usadas por la interfaz
-- hacia el código canónico OBA, cuyo nombre español interno es Abdías.

update public.biblical_books
set aliases = (
  select array_agg(distinct alias order by alias)
  from unnest(coalesce(aliases, '{}'::text[]) || array['Obadías','Obadias']) as alias
),
updated_at = now()
where code = 'OBA'
  and enabled = true
  and review_status = 'approved';

do $$
begin
  if not exists (
    select 1
    from public.biblical_books
    where code = 'OBA'
      and enabled = true
      and review_status = 'approved'
      and aliases @> array['Obadías','Obadias']::text[]
  ) then
    raise exception 'No se pudieron registrar los alias de Obadías';
  end if;
end
$$;
