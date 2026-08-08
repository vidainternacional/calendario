create table if not exists public.publicacion_lecturas (
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  profile_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  leido_at timestamptz not null default now(),
  primary key (publicacion_id, profile_id)
);

alter table public.publicacion_lecturas enable row level security;

create index if not exists publicacion_lecturas_profile_idx
  on public.publicacion_lecturas(profile_id, leido_at desc);

create policy "usuarios_ven_lecturas_propias"
  on public.publicacion_lecturas
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy "usuarios_registran_lecturas_propias"
  on public.publicacion_lecturas
  for insert
  to authenticated
  with check (profile_id = auth.uid());

create or replace function public.get_unread_publications_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.publicaciones p
  join public.profiles pr on pr.id = auth.uid()
  where pr.estado_cuenta = 'activo'
    and p.estado = 'aprobado'
    and (
      pr.rol::text in ('pastor', 'administrador')
      or p.ministerio_id is null
      or exists (
        select 1
        from public.ministerio_miembros mm
        where mm.profile_id = auth.uid()
          and mm.ministerio_id = p.ministerio_id
      )
    )
    and not exists (
      select 1
      from public.publicacion_lecturas pl
      where pl.publicacion_id = p.id
        and pl.profile_id = auth.uid()
    );
$$;

create or replace function public.get_unread_publication_ids(p_publication_ids uuid[])
returns table(publicacion_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.publicaciones p
  join public.profiles pr on pr.id = auth.uid()
  where p.id = any(coalesce(p_publication_ids, array[]::uuid[]))
    and pr.estado_cuenta = 'activo'
    and p.estado = 'aprobado'
    and (
      pr.rol::text in ('pastor', 'administrador')
      or p.ministerio_id is null
      or exists (
        select 1
        from public.ministerio_miembros mm
        where mm.profile_id = auth.uid()
          and mm.ministerio_id = p.ministerio_id
      )
    )
    and not exists (
      select 1
      from public.publicacion_lecturas pl
      where pl.publicacion_id = p.id
        and pl.profile_id = auth.uid()
    );
$$;

create or replace function public.mark_publication_read(p_publicacion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.publicaciones p
    join public.profiles pr on pr.id = auth.uid()
    where p.id = p_publicacion_id
      and pr.estado_cuenta = 'activo'
      and p.estado = 'aprobado'
      and (
        pr.rol::text in ('pastor', 'administrador')
        or p.ministerio_id is null
        or exists (
          select 1
          from public.ministerio_miembros mm
          where mm.profile_id = auth.uid()
            and mm.ministerio_id = p.ministerio_id
        )
      )
  ) then
    insert into public.publicacion_lecturas(publicacion_id, profile_id)
    values (p_publicacion_id, auth.uid())
    on conflict (publicacion_id, profile_id) do nothing;
  end if;
end;
$$;

revoke all on function public.get_unread_publications_count() from public;
revoke all on function public.get_unread_publication_ids(uuid[]) from public;
revoke all on function public.mark_publication_read(uuid) from public;

grant execute on function public.get_unread_publications_count() to authenticated;
grant execute on function public.get_unread_publication_ids(uuid[]) to authenticated;
grant execute on function public.mark_publication_read(uuid) to authenticated;
