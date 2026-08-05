-- Adaptación compatible del calendario existente a la especificación Apple Calendar.
-- No reemplaza public.eventos ni sus relaciones con asignaciones e intercambios.

create table if not exists public.calendars (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 100),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  owner_id uuid references public.profiles(id) on delete set null,
  ministerio_id uuid references public.ministerios(id) on delete cascade,
  tipo_cuenta text not null default 'interno' check (tipo_cuenta in ('interno','gmail','icloud','other')),
  es_publico boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists calendars_ministerio_unique
  on public.calendars(ministerio_id) where ministerio_id is not null;
create unique index if not exists calendars_general_interno_unique
  on public.calendars(tipo_cuenta) where ministerio_id is null and tipo_cuenta = 'interno';

create table if not exists public.calendar_subscriptions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  visible boolean not null default true,
  can_edit boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, calendar_id)
);

alter table public.eventos add column if not exists calendar_id uuid references public.calendars(id) on delete restrict;
alter table public.eventos add column if not exists tiempo_viaje_minutos integer not null default 0 check (tiempo_viaje_minutos between 0 and 1440);
alter table public.eventos add column if not exists updated_at timestamptz not null default now();

create table if not exists public.calendar_changes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.eventos(id) on delete set null,
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  change_type text not null check (change_type in ('created','updated','deleted')),
  summary text not null check (char_length(summary) between 1 and 300),
  created_at timestamptz not null default now()
);

create table if not exists public.change_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  change_id uuid not null references public.calendar_changes(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, change_id)
);

insert into public.calendars (nombre, color, ministerio_id, tipo_cuenta, es_publico)
select nombre, color_primario, id, 'interno', false
from public.ministerios where activo
on conflict (ministerio_id) where ministerio_id is not null
  do update set nombre = excluded.nombre, color = excluded.color, updated_at = now();

insert into public.calendars (nombre, color, tipo_cuenta, es_publico)
select 'Vida Internacional', '#5B3DF5', 'interno', true
where not exists (
  select 1 from public.calendars where ministerio_id is null and tipo_cuenta = 'interno'
);

update public.eventos e
set calendar_id = coalesce(
  (select c.id from public.calendars c where c.ministerio_id = e.ministerio_id),
  (select c.id from public.calendars c where c.ministerio_id is null and c.tipo_cuenta = 'interno' limit 1)
)
where e.calendar_id is null;
alter table public.eventos alter column calendar_id set not null;

insert into public.calendar_subscriptions (user_id, calendar_id, visible, can_edit)
select p.id, c.id, true,
  case
    when p.rol in ('administrador'::public.rol_app, 'pastor'::public.rol_app) then true
    when c.ministerio_id is not null and exists (
      select 1 from public.ministerio_miembros mm
      where mm.profile_id = p.id and mm.ministerio_id = c.ministerio_id and mm.es_lider
    ) then true
    else false
  end
from public.profiles p cross join public.calendars c
where p.activo and p.estado_cuenta = 'activo'
on conflict (user_id, calendar_id)
do update set can_edit = excluded.can_edit, updated_at = now();

create or replace function public.calendar_event_change_feed()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_calendar_id uuid;
  v_calendar_name text;
  v_title text;
  v_type text;
  v_event_id uuid;
begin
  if tg_op = 'DELETE' then
    v_calendar_id := old.calendar_id; v_title := old.titulo; v_type := 'deleted'; v_event_id := null;
  elsif tg_op = 'INSERT' then
    v_calendar_id := new.calendar_id; v_title := new.titulo; v_type := 'created'; v_event_id := new.id;
  else
    v_calendar_id := new.calendar_id; v_title := new.titulo; v_type := 'updated'; v_event_id := new.id;
  end if;
  select nombre into v_calendar_name from public.calendars where id = v_calendar_id;
  insert into public.calendar_changes(event_id, calendar_id, changed_by, change_type, summary)
  values (v_event_id, v_calendar_id, auth.uid(), v_type,
    case v_type
      when 'created' then 'Se agregó “' || coalesce(v_title, 'Evento') || '” a ' || coalesce(v_calendar_name, 'Calendario')
      when 'updated' then 'Se actualizó “' || coalesce(v_title, 'Evento') || '” en ' || coalesce(v_calendar_name, 'Calendario')
      else 'Se eliminó “' || coalesce(v_title, 'Evento') || '” de ' || coalesce(v_calendar_name, 'Calendario')
    end);
  return coalesce(new, old);
end;
$$;
revoke all on function public.calendar_event_change_feed() from public, anon, authenticated;

drop trigger if exists eventos_calendar_change_feed on public.eventos;
create trigger eventos_calendar_change_feed after insert or update or delete on public.eventos
for each row execute function public.calendar_event_change_feed();

alter table public.calendars enable row level security;
alter table public.calendar_subscriptions enable row level security;
alter table public.calendar_changes enable row level security;
alter table public.change_reads enable row level security;

create policy calendars_read_active on public.calendars for select to authenticated
using (public.cuenta_activa() and (
  es_publico or public.es_admin_o_pastor() or exists (
    select 1 from public.calendar_subscriptions s
    where s.calendar_id = calendars.id and s.user_id = (select auth.uid())
  )
));
create policy subscriptions_read_own_or_manager on public.calendar_subscriptions for select to authenticated
using (user_id = (select auth.uid()) or public.es_admin_o_pastor());
create policy subscriptions_update_own_visibility on public.calendar_subscriptions for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy changes_read_subscribed on public.calendar_changes for select to authenticated
using (public.es_admin_o_pastor() or exists (
  select 1 from public.calendar_subscriptions s
  where s.calendar_id = calendar_changes.calendar_id
    and s.user_id = (select auth.uid()) and s.visible
));
create policy change_reads_own on public.change_reads for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index if not exists eventos_calendar_range_idx on public.eventos(calendar_id, fecha_inicio, fecha_fin);
create index if not exists calendar_subscriptions_user_visible_idx on public.calendar_subscriptions(user_id, visible);
create index if not exists calendar_changes_calendar_created_idx on public.calendar_changes(calendar_id, created_at desc);
