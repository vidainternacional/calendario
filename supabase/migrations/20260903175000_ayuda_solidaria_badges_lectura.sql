create table if not exists public.ayuda_solidaria_lecturas (
  user_id uuid not null references public.profiles(id) on delete cascade,
  solicitud_id uuid null references public.solicitudes_ayuda_solidaria(id) on delete cascade,
  aporte_id uuid null references public.aportes_ayuda_solidaria(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ayuda_solidaria_lecturas_un_contexto check (num_nonnulls(solicitud_id, aporte_id) = 1),
  constraint ayuda_solidaria_lecturas_solicitud_unique unique (user_id, solicitud_id),
  constraint ayuda_solidaria_lecturas_aporte_unique unique (user_id, aporte_id)
);

alter table public.ayuda_solidaria_lecturas enable row level security;

drop policy if exists "solidarity reads own select" on public.ayuda_solidaria_lecturas;
create policy "solidarity reads own select" on public.ayuda_solidaria_lecturas
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "solidarity reads own insert" on public.ayuda_solidaria_lecturas;
create policy "solidarity reads own insert" on public.ayuda_solidaria_lecturas
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1 from public.solicitudes_ayuda_solidaria s
      where s.id = solicitud_id
        and (s.profile_id = auth.uid() or public.is_solidarity_manager())
    )
    or exists (
      select 1 from public.aportes_ayuda_solidaria a
      where a.id = aporte_id
        and (a.profile_id = auth.uid() or public.is_solidarity_manager())
    )
  )
);

drop policy if exists "solidarity reads own update" on public.ayuda_solidaria_lecturas;
create policy "solidarity reads own update" on public.ayuda_solidaria_lecturas
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1 from public.solicitudes_ayuda_solidaria s
      where s.id = solicitud_id
        and (s.profile_id = auth.uid() or public.is_solidarity_manager())
    )
    or exists (
      select 1 from public.aportes_ayuda_solidaria a
      where a.id = aporte_id
        and (a.profile_id = auth.uid() or public.is_solidarity_manager())
    )
  )
);

grant select, insert, update on public.ayuda_solidaria_lecturas to authenticated;
revoke all on public.ayuda_solidaria_lecturas from anon;

insert into public.ayuda_solidaria_lecturas (user_id, solicitud_id, last_read_at, updated_at)
select s.profile_id, s.id, now(), now()
from public.solicitudes_ayuda_solidaria s
on conflict (user_id, solicitud_id) do nothing;

insert into public.ayuda_solidaria_lecturas (user_id, aporte_id, last_read_at, updated_at)
select a.profile_id, a.id, now(), now()
from public.aportes_ayuda_solidaria a
on conflict (user_id, aporte_id) do nothing;

insert into public.ayuda_solidaria_lecturas (user_id, solicitud_id, last_read_at, updated_at)
select p.id, s.id, now(), now()
from public.profiles p
cross join public.solicitudes_ayuda_solidaria s
where p.activo = true
  and p.estado_cuenta = 'activo'
  and (p.rol in ('pastor', 'administrador') or coalesce(p.es_pastor_general, false) = true)
on conflict (user_id, solicitud_id) do nothing;

insert into public.ayuda_solidaria_lecturas (user_id, aporte_id, last_read_at, updated_at)
select p.id, a.id, now(), now()
from public.profiles p
cross join public.aportes_ayuda_solidaria a
where p.activo = true
  and p.estado_cuenta = 'activo'
  and (p.rol in ('pastor', 'administrador') or coalesce(p.es_pastor_general, false) = true)
on conflict (user_id, aporte_id) do nothing;

create or replace function public.marcar_ayuda_solidaria_leida(p_contexto text, p_contexto_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_allowed boolean := false;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  if p_contexto = 'solicitud' then
    select exists (
      select 1 from public.solicitudes_ayuda_solidaria s
      where s.id = p_contexto_id
        and (s.profile_id = v_uid or public.is_solidarity_manager())
    ) into v_allowed;

    if not v_allowed then raise exception 'Sin acceso'; end if;

    insert into public.ayuda_solidaria_lecturas (user_id, solicitud_id, last_read_at, updated_at)
    values (v_uid, p_contexto_id, now(), now())
    on conflict (user_id, solicitud_id)
    do update set last_read_at = excluded.last_read_at, updated_at = excluded.updated_at;
  elsif p_contexto = 'aporte' then
    select exists (
      select 1 from public.aportes_ayuda_solidaria a
      where a.id = p_contexto_id
        and (a.profile_id = v_uid or public.is_solidarity_manager())
    ) into v_allowed;

    if not v_allowed then raise exception 'Sin acceso'; end if;

    insert into public.ayuda_solidaria_lecturas (user_id, aporte_id, last_read_at, updated_at)
    values (v_uid, p_contexto_id, now(), now())
    on conflict (user_id, aporte_id)
    do update set last_read_at = excluded.last_read_at, updated_at = excluded.updated_at;
  else
    raise exception 'Contexto inválido';
  end if;
end;
$$;

create or replace function public.ayuda_solidaria_no_leidos()
returns table (
  contexto text,
  contexto_id uuid,
  no_leidos bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with me as (
    select auth.uid() as uid
  ), accesibles as (
    select
      case when m.solicitud_id is not null then 'solicitud' else 'aporte' end as contexto,
      coalesce(m.solicitud_id, m.aporte_id) as contexto_id,
      m.created_at,
      m.autor_id,
      r.last_read_at
    from public.ayuda_solidaria_mensajes m
    cross join me
    left join public.ayuda_solidaria_lecturas r
      on r.user_id = me.uid
      and (
        (m.solicitud_id is not null and r.solicitud_id = m.solicitud_id)
        or (m.aporte_id is not null and r.aporte_id = m.aporte_id)
      )
    where me.uid is not null
      and m.autor_id <> me.uid
      and (
        exists (
          select 1 from public.solicitudes_ayuda_solidaria s
          where s.id = m.solicitud_id
            and (s.profile_id = me.uid or public.is_solidarity_manager())
        )
        or exists (
          select 1 from public.aportes_ayuda_solidaria a
          where a.id = m.aporte_id
            and (a.profile_id = me.uid or public.is_solidarity_manager())
        )
      )
  )
  select contexto, contexto_id, count(*)::bigint as no_leidos
  from accesibles
  where created_at > coalesce(last_read_at, '-infinity'::timestamptz)
  group by contexto, contexto_id
  having count(*) > 0
  order by max(created_at) desc;
$$;

grant execute on function public.marcar_ayuda_solidaria_leida(text, uuid) to authenticated;
grant execute on function public.ayuda_solidaria_no_leidos() to authenticated;
revoke all on function public.marcar_ayuda_solidaria_leida(text, uuid) from anon;
revoke all on function public.ayuda_solidaria_no_leidos() from anon;

comment on table public.ayuda_solidaria_lecturas is 'Estado privado de lectura por usuario y conversación de Ayuda Solidaria.';
comment on function public.ayuda_solidaria_no_leidos() is 'Devuelve únicamente los mensajes no leídos de conversaciones de Ayuda Solidaria accesibles al usuario autenticado.';
