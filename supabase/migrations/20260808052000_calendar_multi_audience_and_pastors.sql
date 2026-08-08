create or replace function public.es_admin_o_pastor()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and (
        p.rol in ('administrador', 'pastor')
        or coalesce(p.es_pastor_general, false) = true
      )
  );
$function$;

create table if not exists public.evento_calendarios (
  evento_id uuid not null references public.eventos(id) on delete cascade,
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (evento_id, calendar_id)
);

create index if not exists evento_calendarios_calendar_id_idx
  on public.evento_calendarios(calendar_id);

alter table public.evento_calendarios enable row level security;

drop policy if exists evento_calendarios_read on public.evento_calendarios;
create policy evento_calendarios_read
on public.evento_calendarios
for select
to authenticated
using (
  public.cuenta_activa()
  and (
    public.es_admin_o_pastor()
    or exists (
      select 1
      from public.calendars c
      where c.id = evento_calendarios.calendar_id
        and (
          c.es_publico = true
          or exists (
            select 1
            from public.calendar_subscriptions s
            where s.calendar_id = c.id
              and s.user_id = auth.uid()
          )
        )
    )
  )
);

drop policy if exists evento_calendarios_insert on public.evento_calendarios;
create policy evento_calendarios_insert
on public.evento_calendarios
for insert
to authenticated
with check (
  public.es_admin_o_pastor()
  or exists (
    select 1
    from public.calendars c
    where c.id = evento_calendarios.calendar_id
      and c.ministerio_id is not null
      and public.lidera(c.ministerio_id)
      and exists (
        select 1
        from public.calendar_subscriptions s
        where s.calendar_id = c.id
          and s.user_id = auth.uid()
          and s.can_edit = true
      )
  )
);

drop policy if exists evento_calendarios_delete on public.evento_calendarios;
create policy evento_calendarios_delete
on public.evento_calendarios
for delete
to authenticated
using (
  public.es_admin_o_pastor()
  or exists (
    select 1
    from public.calendars c
    where c.id = evento_calendarios.calendar_id
      and c.ministerio_id is not null
      and public.lidera(c.ministerio_id)
      and exists (
        select 1
        from public.calendar_subscriptions s
        where s.calendar_id = c.id
          and s.user_id = auth.uid()
          and s.can_edit = true
      )
  )
);

insert into public.evento_calendarios (evento_id, calendar_id)
select e.id, e.calendar_id
from public.eventos e
on conflict (evento_id, calendar_id) do nothing;

insert into public.calendars (nombre, color, owner_id, ministerio_id, tipo_cuenta, es_publico)
select
  'Pastores',
  '#7C3AED',
  p.id,
  null,
  'other',
  false
from public.profiles p
where p.activo = true
  and p.estado_cuenta = 'activo'
  and (
    p.rol in ('administrador', 'pastor')
    or coalesce(p.es_pastor_general, false) = true
  )
  and not exists (
    select 1 from public.calendars c where lower(c.nombre) = lower('Pastores')
  )
order by case when p.rol = 'administrador' then 0 else 1 end, p.created_at
limit 1;

insert into public.calendar_subscriptions (user_id, calendar_id, visible, can_edit)
select p.id, c.id, true, true
from public.profiles p
join public.calendars c on lower(c.nombre) = lower('Pastores')
where p.activo = true
  and p.estado_cuenta = 'activo'
  and (
    p.rol in ('administrador', 'pastor')
    or coalesce(p.es_pastor_general, false) = true
  )
on conflict (user_id, calendar_id)
do update set visible = true, can_edit = true, updated_at = now();
